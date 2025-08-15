#!/bin/bash
echo "🤖 Setting up Jarvis AI Assistant..."
echo "=================================="

# Check Python installation
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Use python3 if available, otherwise python
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
    PIP_CMD=pip3
else
    PYTHON_CMD=python
    PIP_CMD=pip
fi

echo "✅ Python found: $($PYTHON_CMD --version)"

# Install Python dependencies
echo "📦 Installing Python dependencies..."
if [ -f "07-requirements.txt" ]; then
    $PIP_CMD install -r 07-requirements.txt
    echo "✅ Python dependencies installed"
else
    echo "❌ 07-requirements.txt not found"
    exit 1
fi

# Create backend directories if they don't exist
echo "📁 Creating backend directories..."
mkdir -p backend/static/temp
mkdir -p backend/data
echo "✅ Backend directories created"

# Copy .env.example to .env if it doesn't exist
if [ -f ".env.example" ] && [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Environment file created (.env)"
fi

echo ""
echo "🚀 Setup complete!"
echo "=================================="
echo "📋 Next steps:"
echo "1. Open 01-index.html in your browser for frontend-only"
echo "2. Run 'python backend/app.py' for full backend features"
echo "3. Or deploy to GitHub Pages for online access"
echo ""
echo "🌐 GitHub Pages URL: https://yourusername.github.io/Jarvis-Initializer/"
echo "🎬 Entry Point: 01-index.html (Arc Reactor intro)"
echo ""
echo "✨ Jarvis is ready to assist with your studies!"
