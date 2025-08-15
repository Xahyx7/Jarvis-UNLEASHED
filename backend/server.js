// JARVIS AI Backend Server
// Secure API proxy with environment variable support
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourusername.github.io', 'https://your-custom-domain.com'] 
        : '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting (basic)
const requestCounts = new Map();
setInterval(() => requestCounts.clear(), 60000); // Reset every minute

// API Configuration using Environment Variables
const API_PROVIDERS = [
    {
        name: "Groq-Ultra-Fast",
        url: "https://api.groq.com/openai/v1/chat/completions",
        key: process.env.GROQ_API_KEY,
        model: "mixtral-8x7b-32768",
        type: "openai-compatible",
        priority: 1,
        maxTokens: 2000,
        description: "Ultra-fast Mixtral responses"
    },
    {
        name: "DeepSeek-Intelligence",
        url: "https://api.deepseek.com/v1/chat/completions",
        key: process.env.DEEPSEEK_API_KEY,
        model: "deepseek-chat",
        type: "openai-compatible",
        priority: 2,
        maxTokens: 2000,
        description: "Advanced reasoning AI"
    },
    {
        name: "Together-AI-Llama",
        url: "https://api.together.xyz/v1/chat/completions",
        key: process.env.TOGETHER_API_KEY,
        model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        type: "openai-compatible",
        priority: 3,
        maxTokens: 2000,
        description: "Latest Llama 3.1 model"
    },
    {
        name: "HuggingFace-Backup",
        url: "https://api-inference.huggingface.co/models/microsoft/DialoGPT-large",
        key: process.env.HUGGINGFACE_API_KEY,
        type: "huggingface",
        priority: 4,
        description: "Reliable HuggingFace backup"
    }
];

// Validate API keys on startup
const validateAPIKeys = () => {
    const missingKeys = [];
    API_PROVIDERS.forEach(provider => {
        if (!provider.key || provider.key === 'your_' + provider.name.toLowerCase().split('-')[0] + '_api_key_here') {
            missingKeys.push(provider.name);
        }
    });

    if (missingKeys.length > 0) {
        console.error('❌ Missing or invalid API keys for:', missingKeys.join(', '));
        console.error('Please set environment variables or update .env file');
        console.log('📝 Required environment variables:');
        console.log('   GROQ_API_KEY');
        console.log('   DEEPSEEK_API_KEY');
        console.log('   TOGETHER_API_KEY');
        console.log('   HUGGINGFACE_API_KEY');
        
        if (process.env.NODE_ENV !== 'production') {
            console.log('ℹ️  In development: Copy .env.example to .env and add your keys');
        }
        return false;
    }
    return true;
};

// Health check endpoint
app.get('/health', (req, res) => {
    const keysValid = validateAPIKeys();
    res.json({
        status: 'JARVIS Backend Online',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        apis_configured: API_PROVIDERS.filter(p => p.key && p.key.length > 10).length,
        apis_total: API_PROVIDERS.length,
        keys_valid: keysValid
    });
});

// Main chat endpoint
app.post('/api/chat', async (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    // Basic rate limiting
    const count = requestCounts.get(clientIP) || 0;
    if (count > 60) { // 60 requests per minute per IP
        return res.status(429).json({
            error: 'Rate limit exceeded',
            message: 'Please wait before making more requests'
        });
    }
    requestCounts.set(clientIP, count + 1);

    try {
        const { message, history } = req.body;
        
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ 
                error: 'Message is required',
                message: 'Please provide a valid message string'
            });
        }

        if (message.length > 10000) {
            return res.status(400).json({
                error: 'Message too long',
                message: 'Please keep messages under 10,000 characters'
            });
        }

        console.log(`🤖 [${new Date().toISOString()}] Processing: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`);
        
        // Try each API provider in priority order
        const sortedProviders = API_PROVIDERS
            .filter(p => p.key && p.key.length > 10)
            .sort((a, b) => a.priority - b.priority);

        if (sortedProviders.length === 0) {
            return res.status(503).json({
                error: 'No API providers configured',
                message: 'Server configuration error - please contact administrator'
            });
        }

        for (const provider of sortedProviders) {
            try {
                console.log(`🔄 Trying ${provider.name}...`);
                const response = await callAIProvider(provider, message, history || []);
                
                if (response && response.length > 10) {
                    console.log(`✅ Success with ${provider.name} (${response.length} chars)`);
                    return res.json({
                        response: response,
                        provider: provider.name,
                        model: provider.model || 'Unknown',
                        timestamp: new Date().toISOString(),
                        processing_time_ms: Date.now() - req.startTime
                    });
                }
            } catch (error) {
                console.log(`❌ ${provider.name} failed: ${error.message}`);
            }
        }
        
        // All providers failed
        res.status(503).json({
            error: 'All AI providers are currently unavailable',
            message: 'Please try again in a moment. If the issue persists, contact support.',
            providers_tried: sortedProviders.map(p => p.name)
        });
        
    } catch (error) {
        console.error('💥 Server error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: 'An unexpected error occurred. Please try again.'
        });
    }
});

// Middleware to track request start time
app.use((req, res, next) => {
    req.startTime = Date.now();
    next();
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'Server error',
        message: 'An unexpected error occurred'
    });
});

// AI Provider Functions
async function callAIProvider(provider, message, history) {
    const systemPrompt = `You are JARVIS (Just A Rather Very Intelligent System), an advanced AI assistant with unlimited knowledge and capabilities.

Guidelines:
- Provide helpful, accurate, and detailed responses
- Be engaging, supportive, and intelligent
- Use clear formatting with **bold** and *italic* when helpful
- No topic restrictions - answer any question asked
- Include examples and real-world applications when relevant
- Be encouraging and positive in your responses

You can discuss any topic without limitations. Provide comprehensive, intelligent responses that demonstrate your advanced capabilities.`;

    const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6), // Last 6 messages for context
        { role: 'user', content: message }
    ];

    if (provider.type === 'openai-compatible') {
        return await callOpenAICompatible(provider, messages);
    } else if (provider.type === 'huggingface') {
        return await callHuggingFace(provider, message);
    }
    
    throw new Error(`Unsupported provider type: ${provider.type}`);
}

async function callOpenAICompatible(provider, messages) {
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.key}`,
        'User-Agent': 'JARVIS-AI/2.0'
    };

    // Special headers for specific providers
    if (provider.name.includes('OpenRouter')) {
        headers['HTTP-Referer'] = process.env.FRONTEND_URL || 'https://yourusername.github.io';
        headers['X-Title'] = 'JARVIS AI Educational Assistant';
    }

    const response = await fetch(provider.url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
            model: provider.model,
            messages: messages,
            max_tokens: provider.maxTokens || 2000,
            temperature: 0.7,
            stream: false
        }),
        timeout: 30000 // 30 second timeout
    });

    if (!response.ok) {
        let errorText;
        try {
            const errorData = await response.json();
            errorText = errorData.error?.message || errorData.message || 'Unknown error';
        } catch {
            errorText = await response.text() || `HTTP ${response.status}`;
        }
        throw new Error(`${provider.name} API error: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices.message) {
        throw new Error(`Invalid response format from ${provider.name}`);
    }
    
    return data.choices.message.content;
}

async function callHuggingFace(provider, message) {
    const response = await fetch(provider.url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${provider.key}`,
            'Content-Type': 'application/json',
            'User-Agent': 'JARVIS-AI/2.0'
        },
        body: JSON.stringify({
            inputs: message,
            parameters: {
                max_length: 500,
                temperature: 0.7,
                do_sample: true,
                return_full_text: false,
                repetition_penalty: 1.1
            }
        }),
        timeout: 30000
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`HuggingFace API error: ${errorText}`);
    }

    const data = await response.json();
    
    if (Array.isArray(data) && data[0] && data.generated_text) {
        return data.generated_text;
    } else if (data.generated_text) {
        return data.generated_text;
    } else if (data.error) {
        throw new Error(`HuggingFace error: ${data.error}`);
    }
    
    throw new Error('Invalid HuggingFace response format');
}

// Add fetch polyfill for Node.js
if (!global.fetch) {
    global.fetch = require('node-fetch');
}

// Start server
const startServer = () => {
    const keysValid = validateAPIKeys();
    
    app.listen(PORT, () => {
        console.log('\n🤖 ═══════════════════════════════════════════════════');
        console.log('   JARVIS AI BACKEND SERVER ONLINE');
        console.log('   ═══════════════════════════════════════════════════');
        console.log(`   📡 Server: http://localhost:${PORT}`);
        console.log(`   🔗 Health: http://localhost:${PORT}/health`);
        console.log(`   🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`   ✅ APIs configured: ${API_PROVIDERS.filter(p => p.key && p.key.length > 10).length}/${API_PROVIDERS.length}`);
        console.log(`   🔐 Keys validation: ${keysValid ? 'PASSED' : 'FAILED'}`);
        console.log('   ═══════════════════════════════════════════════════\n');
        
        if (!keysValid) {
            console.log('⚠️  Some API keys are missing - JARVIS functionality may be limited');
        }
    });
};

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});
