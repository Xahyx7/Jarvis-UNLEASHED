class JarvisIntro {
    constructor() {
        this.currentProgress = 0;
        this.audioContext = null;
        this.isInitialized = false;
        this.bootupSequence = [
            { message: ">> Initializing Jarvis AI System...", delay: 800, sound: 440 },
            { message: ">> Loading Neural Networks...", delay: 900, sound: 550 },
            { message: ">> Calibrating Voice Recognition...", delay: 1000, sound: 660 },
            { message: ">> Establishing Database Connections...", delay: 800, sound: 440 },
            { message: ">> Loading NCERT Knowledge Base...", delay: 950, sound: 770 },
            { message: ">> Importing Previous Year Questions...", delay: 850, sound: 880 },
            { message: ">> Activating Natural Language Processing...", delay: 900, sound: 990 },
            { message: ">> Optimizing Response Algorithms...", delay: 750, sound: 1100 },
            { message: ">> System Diagnostics Complete...", delay: 700, sound: 660 },
            { message: ">> All Systems Online...", delay: 600, sound: 550 },
            { message: ">> JARVIS INITIALIZED SUCCESSFULLY", delay: 1200, sound: 880 }
        ];
        
        this.bindEvents();
    }

    bindEvents() {
        document.body.addEventListener('click', () => {
            if (!this.isInitialized) {
                this.init();
                this.isInitialized = true;
            }
        }, { once: true });

        document.addEventListener('keydown', () => {
            if (!this.isInitialized) {
                this.init();
                this.isInitialized = true;
            }
        }, { once: true });

        setTimeout(() => {
            if (!this.isInitialized) {
                this.init();
                this.isInitialized = true;
            }
        }, 3000);
    }

    init() {
        document.querySelector('.click-notice').style.display = 'none';
        this.initAudioContext();
        this.generateBootupAudio();
        
        setTimeout(() => {
            this.startBootupSequence();
        }, 1000);
    }

    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    generateBootupAudio() {
        this.playStartupChord();
        
        setTimeout(() => {
            this.synthesizeRoboticVoice("JARVIS INITIALIZED");
        }, 8000);
    }

    playStartupChord() {
        if (!this.audioContext) return;

        const frequencies = [220, 277, 330, 440];
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, 0.3, 0.1);
            }, index * 200);
        });

        setTimeout(() => {
            this.playWhiteNoise(2, 0.05);
        }, 1000);
    }

    playTone(frequency, duration, volume) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playWhiteNoise(duration, volume) {
        if (!this.audioContext) return;

        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * volume;
        }
        
        const whiteNoise = this.audioContext.createBufferSource();
        whiteNoise.buffer = buffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
        
        const gain = this.audioContext.createGain();
        gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
        
        whiteNoise.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        
        whiteNoise.start(this.audioContext.currentTime);
        whiteNoise.stop(this.audioContext.currentTime + duration);
    }

    synthesizeRoboticVoice(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            
            utterance.rate = 0.7;
            utterance.pitch = 0.8;
            utterance.volume = 0.9;
            
            const voices = speechSynthesis.getVoices();
            const roboticVoice = voices.find(voice => 
                voice.name.toLowerCase().includes('microsoft') || 
                voice.name.toLowerCase().includes('google') ||
                voice.lang.includes('en-US')
            );
            
            if (roboticVoice) {
                utterance.voice = roboticVoice;
            }
            
            speechSynthesis.speak(utterance);
        }
    }

    async startBootupSequence() {
        const statusText = document.getElementById('statusText');
        const progressFill = document.getElementById('progressFill');
        const percentageText = document.getElementById('percentageText');
        const logContainer = document.getElementById('logContainer');
        
        for (let i = 0; i < this.bootupSequence.length; i++) {
            const step = this.bootupSequence[i];
            
            this.addLogEntry(logContainer, step.message);
            
            if (step.sound && this.audioContext) {
                this.playTone(step.sound, 0.1, 0.05);
            }
            
            const progress = ((i + 1) / this.bootupSequence.length) * 100;
            this.animateProgress(progressFill, percentageText, progress);
            
            if (i === 0) statusText.textContent = "INITIALIZING";
            if (i === 2) statusText.textContent = "VOICE SYSTEMS";
            if (i === 4) statusText.textContent = "LOADING DATABASES";
            if (i === 6) statusText.textContent = "ACTIVATING AI";
            if (i === 8) statusText.textContent = "DIAGNOSTICS";
            if (i === 9) statusText.textContent = "SYSTEMS ONLINE";
            if (i === 10) statusText.textContent = "READY";
            
            await this.delay(step.delay);
        }
        
        setTimeout(() => {
            this.completeBootup();
        }, 1500);
    }

    addLogEntry(container, message) {
        const logEntry = document.createElement('div');
        logEntry.classList.add('log-entry');
        logEntry.textContent = message;
        container.appendChild(logEntry);
        
        container.scrollTop = container.scrollHeight;
        
        const entries = container.querySelectorAll('.log-entry');
        if (entries.length > 10) {
            entries[0].remove();
        }
    }

    animateProgress(progressFill, percentageText, targetProgress) {
        const startProgress = this.currentProgress;
        const progressDiff = targetProgress - startProgress;
        const duration = 500;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            this.currentProgress = startProgress + (progressDiff * easeProgress);
            
            progressFill.style.width = `${this.currentProgress}%`;
            percentageText.textContent = `${Math.round(this.currentProgress)}%`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    completeBootup() {
        const container = document.querySelector('.intro-container');
        container.classList.add('bootup-complete');
        
        if (this.audioContext) {
            this.playTone(880, 0.5, 0.15);
            setTimeout(() => this.playTone(1100, 0.8, 0.1), 200);
        }
        
        setTimeout(() => {
            window.location.href = 'main.html';

        }, 1200);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if ('speechSynthesis' in window) {
        speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => {
            speechSynthesis.getVoices();
        };
    }
    
    new JarvisIntro();
});
