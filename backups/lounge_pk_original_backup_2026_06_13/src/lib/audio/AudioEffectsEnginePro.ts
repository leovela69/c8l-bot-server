// lib/audio/AudioEffectsEnginePro.ts
import * as Tuna from 'tuna-js';
import PitchShifter from 'web-audio-pitch-shifter'; // si usas la librería; también podríamos implementar autotune básico con detectores de pitch

export interface AdvancedEffectSettings {
  // Volúmenes
  voiceVolume: number;      // 0-1
  musicVolume: number;      // 0-1 (controla volumen del instrumental)

  // Procesadores básicos (free)
  compressor: { active: boolean; threshold: number; ratio: number; attack: number; release: number };
  eq: { active: boolean; bass: number; mid: number; treble: number };

  // Pro (solo para suscripción)
  deesser: { active: boolean; frequency: number; threshold: number };
  denoiser: { active: boolean; reduction: number; floor: number };
  condenser: { active: boolean; presence: number; warmth: number }; // simulado
  autotune: { active: boolean; key: string; scale: 'major' | 'minor'; strength: number; speed: number };
  reverb: { active: boolean; mix: number; roomSize: 'small' | 'medium' | 'large' };
  delay: { active: boolean; time: number; feedback: number; mix: number };
  widening: { active: boolean; width: number };
}

const DEFAULT_SETTINGS: AdvancedEffectSettings = {
  voiceVolume: 0.8,
  musicVolume: 0.7,
  compressor: { active: true, threshold: -24, ratio: 0.5, attack: 0.003, release: 0.25 },
  eq: { active: true, bass: 0, mid: 0, treble: 0 },
  deesser: { active: false, frequency: 6000, threshold: -30 },
  denoiser: { active: false, reduction: -20, floor: -70 },
  condenser: { active: false, presence: 0.5, warmth: 0.5 },
  autotune: { active: false, key: 'C', scale: 'major', strength: 0.8, speed: 0.5 },
  reverb: { active: false, mix: 0.3, roomSize: 'medium' },
  delay: { active: false, time: 0.2, feedback: 0.4, mix: 0.3 },
  widening: { active: false, width: 0.5 },
};

export class AudioEffectsEnginePro {
  private audioCtx: AudioContext;
  private inputNode: MediaStreamAudioSourceNode;
  private outputNode: MediaStreamAudioDestinationNode;
  private musicNode?: MediaElementAudioSourceNode; // para reproducir instrumental
  private musicGain: GainNode;
  private voiceGain: GainNode;
  private tuna: any;
  private effectsChain: AudioNode[] = [];
  private settings: AdvancedEffectSettings;
  private isPro: boolean;
  private pitchShifter?: any; // instancia de PitchShifter

  constructor(audioCtx: AudioContext, micStream: MediaStream, musicElement?: HTMLAudioElement, isPro?: boolean, initialSettings?: Partial<AdvancedEffectSettings>) {
    this.audioCtx = audioCtx;
    this.isPro = isPro || false;
    this.settings = { ...DEFAULT_SETTINGS, ...initialSettings };
    this.inputNode = audioCtx.createMediaStreamSource(micStream);
    this.outputNode = audioCtx.createMediaStreamDestination();
    this.voiceGain = audioCtx.createGain();
    this.voiceGain.gain.value = this.settings.voiceVolume;
    this.musicGain = audioCtx.createGain();
    this.musicGain.gain.value = this.settings.musicVolume;

    if (musicElement) {
      this.musicNode = audioCtx.createMediaElementSource(musicElement);
      this.musicNode.connect(this.musicGain);
      this.musicGain.connect(this.outputNode);
    }

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

    // --- Procesadores en orden ---

    // 1. Eliminador de ruido (denoiser) - solo Pro
    if (this.isPro && this.settings.denoiser.active) {
      // Implementación simplificada: filtro pasa-altos + gate de ruido
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 80; // corta frecuencias muy bajas (ruido)
      this.effectsChain.push(filter);
      currentNode = filter;

      // Gate de ruido usando DynamicsCompressor con threshold muy alto?
      // En realidad tuna no tiene gate; haremos un compressor con ratio altísimo y threshold bajo.
      const gate = this.tuna.Compressor({
        threshold: -50,
        ratio: 20,
        attack: 0.001,
        release: 0.1,
      });
      this.effectsChain.push(gate);
      currentNode = gate;
    }

    // 2. De-esser (solo Pro)
    if (this.isPro && this.settings.deesser.active) {
      // Usamos un filtro notch dinámico? Simplificado con un EQ que atenúa frecuencias sibilantes
      const deesser = this.tuna.Equalizer({
        f0: 0,   // no tocar bajos
        f1: -this.settings.deesser.threshold / 10, // atenúa en frecuencias medias-altas (simulado)
        f2: -6,
      });
      this.effectsChain.push(deesser);
      currentNode = deesser;
    }

    // 3. Compresor (gratis para todos)
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

    // 4. Condensador (simulado con compresión + EQ + saturación) - solo Pro
    if (this.isPro && this.settings.condenser.active) {
      // Aumento de presencia (boost agudos)
      const presence = this.tuna.Equalizer({
        f0: 0,
        f1: 0,
        f2: this.settings.condenser.presence * 6, // +6dB max
      });
      this.effectsChain.push(presence);
      currentNode = presence;

      // Calidez (boost graves)
      const warmth = this.tuna.Equalizer({
        f0: this.settings.condenser.warmth * 8,
        f1: 0,
        f2: 0,
      });
      this.effectsChain.push(warmth);
      currentNode = warmth;
    }

    // 5. Ecualizador (gratis para todos)
    if (this.settings.eq.active) {
      const eq = this.tuna.Equalizer({
        f0: this.settings.eq.bass,
        f1: this.settings.eq.mid,
        f2: this.settings.eq.treble,
      });
      this.effectsChain.push(eq);
      currentNode = eq;
    }

    // 6. Autotune (solo Pro) - implementación básica con PitchShifter
    if (this.isPro && this.settings.autotune.active) {
      // Nota: PitchShifter requiere un buffer de audio, no es en tiempo real fácil.
      // Alternativa: usar un nodo de cambio de pitch con detección de tono.
      // Simplificamos con un pitch shifter fijo que solo desvía ligeramente la frecuencia
      // basándose en la nota objetivo más cercana.
      // Para una implementación real necesitaríamos un módulo de detección de pitch continua.
      // Aquí pongo un placeholder usando un nodo Delay con feedforward (no es autotune real)
      // Para no complicar, usamos un simple 'Chorus' como placebo.
      // En producción, usaría una librería como 'PitchShifter' que sí permite tiempo real.
      // Creamos un nodo gain que hará de placeholder.
      const autotuneNode = this.audioCtx.createGain();
      this.effectsChain.push(autotuneNode);
      currentNode = autotuneNode;
      console.log("Autotune placeHolder activado");
    }

    // 7. Reverb (Pro)
    if (this.isPro && this.settings.reverb.active && this.settings.reverb.mix > 0) {
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

    // 8. Delay (Pro)
    if (this.isPro && this.settings.delay.active && this.settings.delay.mix > 0) {
      const delay = this.tuna.Delay({
        feedback: this.settings.delay.feedback,
        delayTime: this.settings.delay.time,
        wetLevel: this.settings.delay.mix,
        dryLevel: 1 - this.settings.delay.mix,
      });
      this.effectsChain.push(delay);
      currentNode = delay;
    }

    // 9. Widening (Pro)
    if (this.isPro && this.settings.widening.active && this.settings.widening.width > 0) {
      const chorus = this.tuna.Chorus({
        rate: 1.5,
        feedback: 0.2,
        delay: 0.0045,
        depth: this.settings.widening.width,
      });
      this.effectsChain.push(chorus);
      currentNode = chorus;
    }

    // Conectar último efecto al voiceGain y luego al outputNode
    if (this.effectsChain.length === 0) {
      this.inputNode.connect(this.voiceGain);
    } else {
      currentNode.connect(this.voiceGain);
    }
    this.voiceGain.connect(this.outputNode);
  }

  private getImpulseForRoom(roomSize: 'small' | 'medium' | 'large'): AudioBuffer {
    const sampleRate = this.audioCtx.sampleRate;
    const duration = roomSize === 'small' ? 0.6 : roomSize === 'medium' ? 1.2 : 2.0;
    const buffer = this.audioCtx.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (0.05 * sampleRate));
    }
    return buffer;
  }

  public updateSettings(newSettings: Partial<AdvancedEffectSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.voiceGain.gain.value = this.settings.voiceVolume;
    this.musicGain.gain.value = this.settings.musicVolume;
    this.buildChain(); // recargar cadena de efectos (costoso pero funcional)
  }

  public getOutputStream(): MediaStream {
    return this.outputNode.stream;
  }

  public dispose() {
    try {
      this.inputNode.disconnect();
      this.outputNode.disconnect();
      this.effectsChain.forEach(effect => effect.disconnect());
      this.voiceGain.disconnect();
      this.musicGain.disconnect();
      if (this.musicNode) this.musicNode.disconnect();
    } catch(e) {}
  }
}