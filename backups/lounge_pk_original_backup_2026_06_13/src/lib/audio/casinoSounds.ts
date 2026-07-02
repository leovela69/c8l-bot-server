// src/lib/audio/casinoSounds.ts

let sharedCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!sharedCtx) {
      sharedCtx = new AudioContextClass();
    }
    // Resume context if suspended (common browser autoplay restriction)
    if (sharedCtx.state === 'suspended') {
      sharedCtx.resume();
    }
    return sharedCtx;
  } catch (e) {
    console.warn('AudioContext failed to initialize:', e);
    return null;
  }
};

export const playTone = (freq: number, type: OscillatorType, duration: number, startOffset: number = 0, volume: number = 0.05) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
    
    gain.gain.setValueAtTime(volume, ctx.currentTime + startOffset);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime + startOffset);
    osc.stop(ctx.currentTime + startOffset + duration);
  } catch (e) {
    console.warn('Procedural tone play error:', e);
  }
};

export const casinoSounds = {
  playClick: () => {
    // Short high pitch click
    playTone(1000, 'sine', 0.04, 0, 0.03);
  },

  playRouletteSpin: (duration: number = 1.5) => {
    // Emulates a spinning ball clicking against dividers.
    // We play a sequence of clicks that slow down.
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const clickCount = Math.floor(duration * 8); // 8 clicks per second
      for (let i = 0; i < clickCount; i++) {
        // Linear slowing down of click rate: time gap increases
        const progress = i / clickCount;
        const timeOffset = duration * Math.pow(progress, 1.5);
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        // Pitch slightly drops as it slows down
        osc.frequency.setValueAtTime(300 - progress * 100, ctx.currentTime + timeOffset);
        
        gain.gain.setValueAtTime(0.04 * (1 - progress * 0.3), ctx.currentTime + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.04);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + timeOffset);
        osc.stop(ctx.currentTime + timeOffset + 0.04);
      }
    } catch (e) {
      console.warn('Roulette spin sound error:', e);
    }
  },

  playBallDrop: () => {
    // High-to-low bouncing clicks (ball landing in segment)
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const bounces = [
        { time: 0, freq: 450, dur: 0.08 },
        { time: 0.12, freq: 350, dur: 0.06 },
        { time: 0.22, freq: 280, dur: 0.05 },
        { time: 0.30, freq: 220, dur: 0.05 }
      ];
      
      bounces.forEach((b) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(b.freq, ctx.currentTime + b.time);
        gain.gain.setValueAtTime(0.05, ctx.currentTime + b.time);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + b.time + b.dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + b.time);
        osc.stop(ctx.currentTime + b.time + b.dur);
      });
    } catch (e) {
      console.warn('Ball drop sound error:', e);
    }
  },

  playSlotSpin: (duration: number = 1.0) => {
    // Quick chiptune retro rising/falling tones to simulate reels spinning
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const steps = 15;
      for (let i = 0; i < steps; i++) {
        const timeOffset = (i * duration) / steps;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'square';
        // Alternating pitch rise
        const freq = 180 + (i % 3) * 120 + Math.floor(i / 3) * 30;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + timeOffset);
        
        gain.gain.setValueAtTime(0.015, ctx.currentTime + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.06);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + timeOffset);
        osc.stop(ctx.currentTime + timeOffset + 0.06);
      }
    } catch (e) {
      console.warn('Slot spin sound error:', e);
    }
  },

  playWin: () => {
    // Upward arpeggio C major chord + sine swell
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const arpeggio = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
      arpeggio.forEach((freq, idx) => {
        const timeOffset = idx * 0.08;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + timeOffset);
        
        gain.gain.setValueAtTime(0.04, ctx.currentTime + timeOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + timeOffset + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(ctx.currentTime + timeOffset);
        osc.stop(ctx.currentTime + timeOffset + 0.3);
      });
      
      // Add a happy square vibrato lead for extra juice
      const leadOsc = ctx.createOscillator();
      const leadGain = ctx.createGain();
      leadOsc.type = 'sine';
      leadOsc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.5);
      leadOsc.frequency.linearRampToValueAtTime(1046.50, ctx.currentTime + 1.2);
      
      leadGain.gain.setValueAtTime(0, ctx.currentTime + 0.5);
      leadGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.6);
      leadGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      
      leadOsc.connect(leadGain);
      leadGain.connect(ctx.destination);
      leadOsc.start(ctx.currentTime + 0.5);
      leadOsc.stop(ctx.currentTime + 1.2);
      
    } catch (e) {
      console.warn('Win sound error:', e);
    }
  },

  playJackpotAlert: () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      
      // 1. Alternating retro square wave siren alert
      const alarmDuration = 2.0;
      const alarmSteps = 16;
      for (let i = 0; i < alarmSteps; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        const freq = i % 2 === 0 ? 880 : 1200;
        const time = now + (i * alarmDuration) / alarmSteps;
        const stepDur = alarmDuration / alarmSteps;
        
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.05, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + stepDur);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(time);
        osc.stop(time + stepDur);
      }
      
      // 2. High-speed rising sweeps
      for (let j = 0; j < 3; j++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        const startTime = now + j * 0.6;
        
        osc.frequency.setValueAtTime(300, startTime);
        osc.frequency.exponentialRampToValueAtTime(2200, startTime + 0.5);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.03, startTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.55);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + 0.55);
      }
      
      // 3. Falling gold coin shower effect
      const coinCount = 20;
      for (let k = 0; k < coinCount; k++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const coinTime = now + 0.1 + Math.random() * 1.8;
        const coinPitch = 900 + Math.random() * 600;
        
        osc.frequency.setValueAtTime(coinPitch, coinTime);
        osc.frequency.exponentialRampToValueAtTime(coinPitch * 1.5, coinTime + 0.1);
        
        gain.gain.setValueAtTime(0.03, coinTime);
        gain.gain.exponentialRampToValueAtTime(0.001, coinTime + 0.15);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(coinTime);
        osc.stop(coinTime + 0.15);
      }
    } catch (e) {
      console.warn('Jackpot alert sound error:', e);
    }
  }
};

// Emulated Howler class to drop-in replace the Howl constructor
export class Howl {
  private srcName: string;
  private volume: number;

  constructor(options: { src: string[]; volume?: number }) {
    const fullSrc = options.src[0] || '';
    this.srcName = fullSrc.split('/').pop() || '';
    this.volume = options.volume ?? 1.0;
  }

  play() {
    if (this.srcName.includes('roulette-spin')) {
      casinoSounds.playRouletteSpin(1.8);
    } else if (this.srcName.includes('roulette-ball')) {
      casinoSounds.playBallDrop();
    } else if (this.srcName.includes('slot-spin')) {
      casinoSounds.playSlotSpin(1.2);
    } else if (this.srcName.includes('jackpot')) {
      casinoSounds.playJackpotAlert();
    } else if (this.srcName.includes('win')) {
      casinoSounds.playWin();
    } else if (this.srcName.includes('click')) {
      casinoSounds.playClick();
    }
  }
}
