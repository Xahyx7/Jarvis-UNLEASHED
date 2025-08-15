@echo off
echo 🤖 Setting up Jarvis AI Assistant...
echo ==================================

REM Check Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    echo 📥 Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python found:
python --version

REM Install Python dependencies
echo 📦 Installing Python dependencies...
if exist "07-requirements.txt" (
    pip install -r 07-requirements.txt
    echo ✅ Python dependencies installed
) else (
    echo ❌ 07-requirements.txt not found
    pause
    exit /b 1
)

REM Create backend directories
echo 📁 Creating backend directories...
if not exist "backend\static\temp" mkdir backend\static\temp
if not exist "backend\data" mkdir backend\data
echo ✅ Backend directories created

REM Copy .env.example to .env if it doesn't exist
if exist ".env.example" (
    if not exist ".env" (
        copy .env.example .env
        echo ✅ Environment file created (.env)
    )
)

echo.
echo 🚀 Setup complete!
echo ==================================
echo 📋 Next steps:
echo 1. Open 01-index.html in your browser for frontend-only
echo 2. Run 'python backend/app.py' for full backend features
echo 3. Or deploy to GitHub Pages for online access
echo.
echo 🌐 GitHub Pages URL: https://yourusername.github.io/Jarvis-Initializer/
echo 🎬 Entry Point: 01-index.html (Arc Reactor intro)
echo.
echo ✨ Jarvis is ready to assist with your studies!
pause
