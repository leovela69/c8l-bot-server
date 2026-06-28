/**
 * 🎰 C8L CASINO — Sistema de Sonido
 * Audio sintético usando Web Audio API (sin archivos externos)
 */

class SoundManager {
    constructor() {
        this.enabled = true;
        this.ctx = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Audio not available:', e);
            this.enabled = false;
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    _playTone(freq, duration, type = 'sine', volume = 0.3) {
        if (!this.enabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    _playNoise(duration, volume = 0.1) {
        if (!this.enabled || !this.ctx) return;
        
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const source = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        
        source.buffer = buffer;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        source.start();
    }

    // Sonido de inicio de giro
    spinStart() {
        this._playNoise(0.3, 0.08);
        this._playTone(200, 0.1, 'square', 0.1);
    }

    // Sonido de carrete girando (tick)
    reelTick() {
        this._playTone(600 + Math.random() * 200, 0.05, 'square', 0.05);
    }

    // Sonido de carrete parando
    reelStop(index) {
        const freq = 300 + index * 100;
        this._playTone(freq, 0.15, 'triangle', 0.2);
        this._playTone(freq * 0.5, 0.1, 'sine', 0.1);
    }

    // Sonido de ganancia pequeña
    winSmall() {
        const notes = [523, 659, 784]; // C5, E5, G5
        notes.forEach((freq, i) => {
            setTimeout(() => this._playTone(freq, 0.2, 'sine', 0.2), i * 100);
        });
    }

    // Sonido de ganancia grande
    winBig() {
        const notes = [523, 659, 784, 1047, 1319]; // C major arpeggio
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this._playTone(freq, 0.3, 'sine', 0.25);
                this._playTone(freq * 1.5, 0.2, 'triangle', 0.1);
            }, i * 120);
        });
    }

    // Sonido de MEGA ganancia
    winMega() {
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                const freq = 400 + i * 100;
                this._playTone(freq, 0.4, 'sine', 0.3);
                this._playTone(freq * 2, 0.3, 'triangle', 0.15);
            }, i * 150);
        }
        setTimeout(() => this._playNoise(0.5, 0.15), 800);
    }

    // Sonido de Jackpot
    jackpot() {
        const fanfare = [523, 659, 784, 1047, 784, 1047, 1319, 1568];
        fanfare.forEach((freq, i) => {
            setTimeout(() => {
                this._playTone(freq, 0.5, 'sine', 0.3);
                this._playTone(freq / 2, 0.4, 'sawtooth', 0.1);
            }, i * 200);
        });
    }

    // Sonido de Giros Gratis activados
    freeSpins() {
        const melody = [784, 988, 1175, 1568, 1175, 1568];
        melody.forEach((freq, i) => {
            setTimeout(() => {
                this._playTone(freq, 0.3, 'sine', 0.25);
            }, i * 150);
        });
    }

    // Sonido de Modo Rugido
    modoRugido() {
        // Rugido grave
        this._playTone(80, 0.8, 'sawtooth', 0.3);
        this._playTone(100, 0.6, 'square', 0.2);
        this._playNoise(0.5, 0.2);
        setTimeout(() => {
            this._playTone(150, 0.4, 'sawtooth', 0.25);
        }, 300);
    }

    // Sonido de botón
    buttonClick() {
        this._playTone(800, 0.05, 'sine', 0.15);
    }

    // Sonido de scatter apareciendo
    scatterLand() {
        this._playTone(1200, 0.2, 'sine', 0.25);
        this._playTone(1500, 0.15, 'triangle', 0.2);
    }
}

// Instancia global
const sound = new SoundManager();
