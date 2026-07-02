// src/lib/raid/soundEngine.ts

const playTone = (freq: number, type: OscillatorType, duration: number, startOffset: number = 0, gainValue: number = 0.05) => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
    
    gain.gain.setValueAtTime(gainValue, ctx.currentTime + startOffset);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(ctx.currentTime + startOffset);
    osc.stop(ctx.currentTime + startOffset + duration);
  } catch (e) {
    console.warn('Procedural audio play blocked or unsupported:', e);
  }
};

export const raidSounds = {
  playAttackSound: (giftId: string) => {
    const freq = giftId === 'rose' ? 440 : giftId === 'lightning' ? 880 : 660;
    playTone(freq, 'triangle', 0.15, 0, 0.06);
  },
  
  playComboSound: (comboCount: number) => {
    const baseFreq = 440 + (comboCount * 50);
    playTone(baseFreq, 'sine', 0.2, 0, 0.05);
    playTone(baseFreq * 1.5, 'sine', 0.2, 0.05, 0.03);
  },
  
  playLegendaryGiftSound: () => {
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      playTone(freq, 'sawtooth', 0.3, idx * 0.08, 0.03);
    });
  },
  
  playVictorySound: () => {
    const chord = [261.63, 329.63, 392.00, 523.25]; // C major chord
    chord.forEach((freq, idx) => {
      playTone(freq, 'triangle', 0.5, 0, 0.03);
      playTone(freq * 2, 'sine', 0.5, 0.1, 0.02);
    });
  }
};
