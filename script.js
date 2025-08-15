// JARVIS AI - Frontend (Connects to Backend)
class JarvisAISystem {
    constructor() {
        this.version = "JARVIS-AI-Secure-v7.0";
        this.systemName = "Just A Rather Very Intelligent System";
        this.isProcessing = false;
        this.isListening = false;
        this.conversationHistory = [];

        // Around line 15 in script.js
this.backendURL = window.location.hostname === 'localhost' 
    ? "http://localhost:3000"
    : "https://jarvis-ai-backend-gz9x.onrender.com"; // Replace with your actual Render URL

        
        this.initialize();
    }

    async initialize() {
        console.log("🤖 Initializing " + this.systemName + "...");
        
        try {
            await this.waitForDOM();
            this.initializeUIElements();
            this.setupAllEventListeners();
            this.initializeSpeechRecognition();
            await this.testBackendConnection();
            this.displayWelcomeMessage();
            this.updateSystemStatus("JARVIS Online", "Connected to AI servers");
            console.log("✅ JARVIS AI System fully operational");
        } catch (error) {
            console.error("❌ System initialization failed:", error);
            this.handleInitializationError(error);
        }
    }

    async waitForDOM() {
        if (document.readyState === 'loading') {
            return new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
    }

    initializeUIElements() {
        this.elements = {
            messagesArea: document.getElementById('messagesArea'),
            messageInput: document.getElementById('messageInput'),
            inputForm: document.getElementById('inputForm'),
            sendButton: document.getElementById('sendButton'),
            voiceButton: document.getElementById('voiceButton'),
            typingIndicator: document.getElementById('typingIndicator'),
            statusText: document.getElementById('statusText'),
            apiInfo: document.getElementById('apiInfo')
        };

        const missingElements = [];
        for (const [name, element] of Object.entries(this.elements)) {
            if (!element) {
                missingElements.push(name);
            }
        }

        if (missingElements.length > 0) {
            throw new Error("Missing UI elements: " + missingElements.join(', '));
        }
    }

    setupAllEventListeners() {
        this.elements.inputForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.processUserMessage();
        });

        this.elements.sendButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.processUserMessage();
        });

        this.elements.voiceButton.addEventListener('click', () => {
            this.toggleVoiceInput();
        });

        this.elements.messageInput.addEventListener('input', () => {
            this.autoResizeTextarea();
        });

        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const message = btn.getAttribute('data-msg');
                this.elements.messageInput.value = message;
                this.processUserMessage();
            });
        });

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                this.elements.messageInput.focus();
            }
            if (e.key === 'Escape' && document.activeElement === this.elements.messageInput) {
                this.elements.messageInput.value = '';
            }
        });
    }

    autoResizeTextarea() {
        const textarea = this.elements.messageInput;
        textarea.style.height = 'auto';
        const maxHeight = 150;
        const newHeight = Math.min(textarea.scrollHeight, maxHeight);
        textarea.style.height = newHeight + 'px';
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();

            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                this.elements.voiceButton.textContent = '⏹️';
                this.elements.voiceButton.style.background = 'linear-gradient(135deg, #ff4757, #ff3742)';
                this.updateSystemStatus("Listening...", "Voice input active");
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.elements.messageInput.value = transcript;
                this.autoResizeTextarea();
                setTimeout(() => this.processUserMessage(), 500);
            };

            this.recognition.onerror = (event) => {
                console.error("Speech recognition error:", event.error);
                this.resetVoiceButton();
                this.updateSystemStatus("Voice error", "Try again or use text");
            };

            this.recognition.onend = () => {
                this.resetVoiceButton();
            };
        } else {
            this.elements.voiceButton.style.display = 'none';
        }
    }

    toggleVoiceInput() {
        if (!this.recognition) return;

        if (this.isListening) {
            this.recognition.stop();
        } else {
            try {
                this.recognition.start();
            } catch (error) {
                console.error("Speech start error:", error);
                this.updateSystemStatus("Voice unavailable", "Use text input");
            }
        }
    }

    resetVoiceButton() {
        this.isListening = false;
        this.elements.voiceButton.textContent = '🎤';
        this.elements.voiceButton.style.background = 'linear-gradient(135deg, #00d4ff 0%, #0080ff 100%)';
        this.updateSystemStatus("JARVIS Ready", "Voice input ready");
    }

    async testBackendConnection() {
        try {
            console.log("🔍 Testing backend connection...");
            const response = await fetch(this.backendURL + '/health');
            if (response.ok) {
                const data = await response.json();
                console.log("✅ Backend connection successful:", data);
                this.updateSystemStatus("Connected", "AI servers ready");
            } else {
                throw new Error("Backend not responding properly");
            }
        } catch (error) {
            console.error("❌ Backend connection failed:", error);
            this.updateSystemStatus("Backend offline", "Check if server is running");
            throw new Error("Cannot connect to backend server. Please make sure it's running on " + this.backendURL);
        }
    }

    async processUserMessage() {
        if (this.isProcessing) {
            return;
        }

        const message = this.elements.messageInput.value.trim();
        if (!message) {
            this.elements.messageInput.focus();
            return;
        }

        this.isProcessing = true;
        this.elements.messageInput.value = '';
        this.elements.messageInput.style.height = '55px';
        this.addMessageToChat(message, 'user');
        this.showTypingIndicator();
        this.updateSystemStatus("Processing...", "Generating AI response");

        try {
            this.conversationHistory.push({
                role: 'user',
                content: message,
                timestamp: Date.now()
            });

            if (this.conversationHistory.length > 20) {
                this.conversationHistory = this.conversationHistory.slice(-10);
            }

            const response = await this.getAIResponse(message);

            this.conversationHistory.push({
                role: 'assistant',
                content: response.text,
                timestamp: Date.now()
            });

            this.hideTypingIndicator();
            this.addMessageToChat(response.text, 'ai');

            if (response.text.length < 500) {
                this.speakResponse(response.text);
            }

            this.updateSystemStatus("Response complete", "via " + response.provider);
        } catch (error) {
            console.error("❌ Error processing message:", error);
            this.hideTypingIndicator();
            
            let errorMessage = "I'm having trouble connecting to my AI servers. ";
            if (error.message.includes("backend server")) {
                errorMessage += "Please make sure the backend server is running (npm start in backend folder).";
            } else if (error.message.includes("API")) {
                errorMessage += "There might be an issue with the API keys. Please check the server console for details.";
            } else {
                errorMessage += "Please check your internet connection and try again.";
            }
            
            this.addMessageToChat(errorMessage, 'ai');
            this.updateSystemStatus("Connection error", "Check backend server");
        } finally {
            this.isProcessing = false;
            setTimeout(() => { this.elements.messageInput.focus(); }, 100);
        }
    }

    async getAIResponse(message) {
        try {
            console.log("📡 Sending request to backend...");
            const response = await fetch(this.backendURL + '/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    history: this.conversationHistory.slice(-6)
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error('Backend response error: ' + response.status + ' - ' + (errorData.error || errorData.message || 'Unknown error'));
            }

            const data = await response.json();
            return {
                text: data.response || "I apologize, but I couldn't generate a response. Please try again.",
                provider: data.provider || "Unknown"
            };
        } catch (error) {
            console.error("❌ API call failed:", error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error("Cannot connect to backend server. Make sure it's running on " + this.backendURL);
            }
            throw error;
        }
    }

    addMessageToChat(content, sender) {
        const messagesArea = this.elements.messagesArea;
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ' + sender;
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        if (sender === 'user') {
            messageContent.innerHTML = '<strong>👤 You:</strong> ' + this.escapeHTML(content);
        } else {
            messageContent.innerHTML = this.formatAIContent(content);
        }

        messageDiv.appendChild(messageContent);
        messagesArea.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatAIContent(content) {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    scrollToBottom() {
        const messagesArea = this.elements.messagesArea;
        setTimeout(() => {
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }, 150);
    }

    showTypingIndicator() {
        this.elements.typingIndicator.style.display = 'block';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.elements.typingIndicator.style.display = 'none';
    }

    updateSystemStatus(status, info) {
        this.elements.statusText.textContent = status;
        this.elements.apiInfo.textContent = info || '';
    }

    speakResponse(text) {
        if ('speechSynthesis' in window && text.length < 800) {
            const cleanText = text
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/\*(.*?)\*/g, '$1')
                .replace(/[🤖📚📊🌱🏛️⚡🌍📖🔍💡✅❌⚠️🎯🚀🌟💎]/g, '')
                .substring(0, 400);
            
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.rate = 0.9;
            utterance.volume = 0.6;
            utterance.pitch = 1.1;
            
            speechSynthesis.speak(utterance);
        }
    }

    displayWelcomeMessage() {
        const welcome = "🤖 **JARVIS AI System Online**\n\nJust A Rather Very Intelligent System ready to assist! I'm securely connected to multiple AI providers through a protected backend server.";
        this.addMessageToChat(welcome, 'ai');
    }

    handleInitializationError(error) {
        document.body.innerHTML = '<div style="padding:40px; color:#ff4757; font-family: monospace; text-align: center;"><h1>🚨 JARVIS Initialization Error</h1><p>' + error.message + '</p><p>Make sure the backend server is running!</p><button onclick="location.reload()" style="background:#00d4ff; color:#000; border:none; padding:15px 30px; border-radius:8px; cursor:pointer;">🔄 Restart JARVIS</button></div>';
    }
}

// Initialize JARVIS
let jarvisSystem;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        jarvisSystem = new JarvisAISystem();
    });
} else {
    jarvisSystem = new JarvisAISystem();
}

window.jarvis = jarvisSystem;
console.log('🤖 JARVIS AI Frontend loaded - Secure version');
