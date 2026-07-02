// C8L Casino Audio Engine - Web Audio API
class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private initialized = false;

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.6;
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
    } catch (e) {
      console.warn("Audio not available");
    }
  }

  private ensureCtx() {
    if (!this.ctx || this.ctx.state === "suspended") {
      this.ctx?.resume();
    }
    if (!this.initialized) this.init();
  }

  // Generate a click/tick sound for ball hitting dividers
  playBallTick() {
    this.ensureCtx();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 2800 + Math.random() * 800;
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.03);
  }

  // Continuous spinning sound (wooden wheel + ball rolling on track)
  playSpinning(duration: number): { stop: () => void } {
    this.ensureCtx();
    if (!this.ctx || !this.masterGain) return { stop: () => {} };

    const noise = this.ctx.createBufferSource();
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate realistic wheel spin sound:
    // - continuous rumble (wooden wheel on axis)
    // - rhythmic ball-on-track clicking that decelerates naturally
    for (let i = 0; i < bufferSize; i++) {
      const progress = i / bufferSize;
      // Ease-out curve: fast start, very slow end
      const speedCurve = Math.pow(1 - progress, 0.4);
      
      // Base rumble
      const rumble = (Math.random() * 2 - 1) * 0.04 * speedCurve;
      
      // Ball rolling clicks that slow down over time
      const clickRate = 80 * speedCurve; // Starts fast, gets slower
      const clickPhase = (i / this.ctx.sampleRate) * clickRate;
      const clickSharpness = Math.sin(clickPhase * Math.PI * 2);
      const click = clickSharpness > 0.92 ? 0.25 * speedCurve : 0;
      
      // Gentle whoosh undertone
      const whoosh = Math.sin(i * 0.01 * speedCurve) * 0.02 * speedCurve;
      
      data[i] = rumble + click + whoosh;
    }

    noise.buffer = buffer;
    
    // Bandpass filter for wooden character
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 900;
    filter.Q.value = 1.5;

    // Volume envelope: ramps up quickly, sustains, then fades
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime + duration * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.02, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();

    return {
      stop: () => {
        try { noise.stop(); } catch {}
      }
    };
  }

  // Ball bouncing sound (metallic bounce)
  playBallBounce() {
    this.ensureCtx();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(4000, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  // Ball settling into pocket
  playBallSettle() {
    this.ensureCtx();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  // Chip placement sound
  playChipPlace() {
    this.ensureCtx();
    if (!this.ctx || !this.masterGain) return;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = "sine";
    osc1.frequency.value = 1800;
    osc2.type = "sine";
    osc2.frequency.value = 2400;

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);
    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.06);
    osc2.stop(this.ctx.currentTime + 0.06);
  }

  // Win sound (ascending arpeggio)
  playWin() {
    this.ensureCtx();
    if (!this.ctx || !this.masterGain) return;

    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, this.ctx!.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, this.ctx!.currentTime + i * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + i * 0.12 + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(this.ctx!.currentTime + i * 0.12);
      osc.stop(this.ctx!.currentTime + i * 0.12 + 0.3);
    });
  }

  // Lose sound (descending tone)
  playLose() {
    this.ensureCtx();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(150, this.ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }

  // Crupier announcement chime
  playCrupierChime() {
    this.ensureCtx();
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }
}

export const audioEngine = new AudioEngine();
