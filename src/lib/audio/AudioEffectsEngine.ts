// lib/audio/AudioEffectsEngine.ts
import * as Tuna from 'tuna-js';

export interface EffectSettings {
  compressor: { active: boolean; threshold: number; ratio: number; attack: number; release: number };
  eq: { active: boolean; bass: number; mid: number; treble: number };
  reverb: { active: boolean; mix: number; roomSize: 'small' | 'medium' | 'large' };
  delay: { active: boolean; time: number; feedback: number; mix: number };
  widening: { active: boolean; width: number };
  autotune: { active: boolean; strength: number }; // placeholder para futura implementación
}

const DEFAULT_SETTINGS: EffectSettings = {
  compressor: { active: true, threshold: -24, ratio: 0.5, attack: 0.003, release: 0.25 },
  eq: { active: true, bass: 0, mid: 0, treble: 0 },
  reverb: { active: false, mix: 0.3, roomSize: 'medium' },
  delay: { active: false, time: 0.2, feedback: 0.4, mix: 0.3 },
  widening: { active: false, width: 0.5 },
  autotune: { active: false, strength: 0.7 },
};

export class AudioEffectsEngine {
  private audioCtx: AudioContext;
  private inputNode: MediaStreamAudioSourceNode;
  private outputNode: MediaStreamAudioDestinationNode;
  private tuna: any;
  private effectsChain: any[] = [];
  private dryGain: GainNode;
  private settings: EffectSettings;

  constructor(audioCtx: AudioContext, micStream: MediaStream, initialSettings?: Partial<EffectSettings>) {
    this.audioCtx = audioCtx;
    this.settings = { ...DEFAULT_SETTINGS, ...initialSettings };
    this.inputNode = audioCtx.createMediaStreamSource(micStream);
    this.outputNode = audioCtx.createMediaStreamDestination();
    this.dryGain = audioCtx.createGain();
    this.tuna = new Tuna(audioCtx);
    this.buildChain();
  }

  private buildChain() {
    // Desconectar todo anterior
    this.inputNode.disconnect();
    this.effectsChain.forEach(effect => {
      try { effect.disconnect(); } catch(e) {}
    });
    this.effectsChain = [];

    let currentNode: AudioNode = this.inputNode;

    // 1. Compresor (gratis)
    if (this.settings.compressor.active) {
      const compressor = this.tuna.Compressor({
        threshold: this.settings.compressor.threshold,
        ratio: this.settings.compressor.ratio,
        attack: this.settings.compressor.attack,
        release: this.settings.compressor.release,
      });
      this.effectsChain.push(compressor);
      currentNode = compressor;
    }

    // 2. Ecualizador (gratis)
    if (this.settings.eq.active) {
      const eq = this.tuna.Equalizer({
        f0: this.settings.eq.bass,   // graves
        f1: this.settings.eq.mid,    // medios
        f2: this.settings.eq.treble, // agudos
      });
      this.effectsChain.push(eq);
      currentNode = eq;
    }

    // 3. Reverb (PRO)
    if (this.settings.reverb.active && this.settings.reverb.mix > 0) {
      const reverb = this.tuna.Convolver({
        highCut: 22000,
        lowCut: 20,
        dryLevel: 1 - this.settings.reverb.mix,
        wetLevel: this.settings.reverb.mix,
        impulse: this.getImpulseForRoom(this.settings.reverb.roomSize),
      });
      this.effectsChain.push(reverb);
      currentNode = reverb;
    }

    // 4. Delay (PRO)
    if (this.settings.delay.active && this.settings.delay.mix > 0) {
      const delay = this.tuna.Delay({
        feedback: this.settings.delay.feedback,
        delayTime: this.settings.delay.time,
        wetLevel: this.settings.delay.mix,
        dryLevel: 1 - this.settings.delay.mix,
      });
      this.effectsChain.push(delay);
      currentNode = delay;
    }

    // 5. Widening (PRO) - Simulado con un chorus sutil
    if (this.settings.widening.active && this.settings.widening.width > 0) {
      const chorus = this.tuna.Chorus({
        rate: 1.5,
        feedback: 0.2,
        delay: 0.0045,
        depth: this.settings.widening.width,
      });
      this.effectsChain.push(chorus);
      currentNode = chorus;
    }

    // Conectar último efecto al destino, o directo si no hay efectos
    if (this.effectsChain.length === 0) {
      this.inputNode.connect(this.outputNode);
    } else {
      currentNode.connect(this.outputNode);
    }
  }

  private getImpulseForRoom(roomSize: 'small' | 'medium' | 'large'): AudioBuffer {
    const sampleRate = this.audioCtx.sampleRate;
    const duration = roomSize === 'small' ? 0.6 : roomSize === 'medium' ? 1.2 : 2.0;
    const buffer = this.audioCtx.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      // Decaimiento exponencial
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (0.05 * sampleRate));
    }
    return buffer;
  }

  public updateSettings(newSettings: Partial<EffectSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.buildChain();
  }

  public getOutputStream(): MediaStream {
    return this.outputNode.stream;
  }

  public dispose() {
    try {
      this.inputNode.disconnect();
      this.outputNode.disconnect();
      this.effectsChain.forEach(effect => effect.disconnect());
      this.dryGain.disconnect();
    } catch(e) {}
  }
}