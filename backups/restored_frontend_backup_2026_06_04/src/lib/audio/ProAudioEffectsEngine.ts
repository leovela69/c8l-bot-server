// lib/audio/ProAudioEffectsEngine.ts
import * as Tuna from 'tuna-js';
import PitchShifter from 'web-audio-pitch-shifter';

export interface ProEffectSettings {
  // Volúmenes
  voiceVolume: number;        // 0..1
  musicVolume: number;        // 0..1

  // Eliminador de ruido (Noise Gate)
  noiseGate: {
    active: boolean;
    threshold: number;        // -100..0 dB
    attack: number;           // segundos
    release: number;          // segundos
  };

  // Compresor (condensador)
  compressor: {
    active: boolean;
    threshold: number;        // -40..0 dB
    ratio: number;            // 1..20
    attack: number;           // 0.001..0.5 s
    release: number;          // 0.01..1 s
    knee: number;             // 0..40 dB
  };

  // Ecualizador
  eq: {
    active: boolean;
    bass: number;             // -12..12 dB
    mid: number;
    treble: number;
  };

  // Autotune
  autotune: {
    active: boolean;
    strength: number;         // 0..1 (0 = sin cambio, 1 = perfecto)
    key: string;              // 'C', 'C#', 'D', ... 'B'
    scale: string;            // 'major', 'minor', 'pentatonic'
  };

  // Reverb
  reverb: {
    active: boolean;
    mix: number;              // 0..1
    roomSize: 'small' | 'medium' | 'large';
  };

  // Delay
  delay: {
    active: boolean;
    time: number;             // 0.05..0.8 s
    feedback: number;         // 0..0.8
    mix: number;              // 0..1
  };

  // Widening
  widening: {
    active: boolean;
    width: number;            // 0..1
  };
}

export const DEFAULT_PRO_EFFECTS: ProEffectSettings = {
  voiceVolume: 0.8,
  musicVolume: 0.7,
  noiseGate: { active: true, threshold: -60, attack: 0.003, release: 0.05 },
  compressor: { active: true, threshold: -24, ratio: 4, attack: 0.01, release: 0.2, knee: 12 },
  eq: { active: true, bass: 0, mid: 0, treble: 0 },
  autotune: { active: false, strength: 0.7, key: 'C', scale: 'major' },
  reverb: { active: false, mix: 0.3, roomSize: 'medium' },
  delay: { active: false, time: 0.2, feedback: 0.4, mix: 0.3 },
  widening: { active: false, width: 0.5 },
};

export class ProAudioEffectsEngine {
  private audioCtx: AudioContext;
  private micSource: MediaStreamAudioSourceNode;
  private instrumentalSource: AudioBufferSourceNode | MediaElementAudioSourceNode;
  private noiseGateNode?: any;   // Tuna NoiseGate o propio
  private compressorNode?: any;
  private eqNode?: any;
  private pitchShifter?: any;
  private reverbNode?: any;
  private delayNode?: any;
  private wideningNode?: any;
  private voiceGain: GainNode;
  private musicGain: GainNode;
  private outputGain: GainNode;
  private recorderGain: GainNode;
  private tuna: any;
  private settings: ProEffectSettings;
  private destinationStream: MediaStreamAudioDestinationNode;
  public onPitchUpdate?: (pitch: number, targetPitch: number) => void;

  constructor(audioCtx: AudioContext, micStream: MediaStream, instrumentalUrl: string, initialSettings?: Partial<ProEffectSettings>) {
    this.audioCtx = audioCtx;
    this.settings = { ...DEFAULT_PRO_EFFECTS, ...initialSettings };
    this.micSource = audioCtx.createMediaStreamSource(micStream);
    this.instrumentalSource = audioCtx.createMediaElementSource(new Audio(instrumentalUrl));
    this.tuna = new Tuna(audioCtx);
    
    // Nodos de mezcla
    this.voiceGain = audioCtx.createGain();
    this.musicGain = audioCtx.createGain();
    this.outputGain = audioCtx.createGain();
    this.recorderGain = audioCtx.createGain();
    this.destinationStream = audioCtx.createMediaStreamDestination();
    
    this.applySettings();
  }

  private async applySettings() {
    // Reconstruir cadena completa (disconnect y reconnect)
    this.disconnect();
    
    let prevNode: AudioNode = this.micSource;
    
    // 1. Noise Gate (usando Tuna si está disponible, si no, simular con Gain)
    if (this.settings.noiseGate.active) {
      // Tuna tiene NoiseGate? En su lugar usaremos un Compressor con ratio extremo.
      // Alternativa: crear nuestro propio NoiseGate con ScriptProcessorNode (obsoleto) o AudioWorklet.
      // Por simplicidad, simularemos con un Gate simple mediante un Gain que se abre según RMS.
      // Implementaremos un AudioWorklet personalizado para mejor rendimiento.
      // De momento, lo dejamos como placeholder.
    }
    
    // 2. Compresor
    if (this.settings.compressor.active) {
      this.compressorNode = this.tuna.Compressor({
        threshold: this.settings.compressor.threshold,
        ratio: this.settings.compressor.ratio,
        attack: this.settings.compressor.attack,
        release: this.settings.compressor.release,
        knee: this.settings.compressor.knee,
      });
      prevNode.connect(this.compressorNode);
      prevNode = this.compressorNode;
    }
    
    // 3. Ecualizador
    if (this.settings.eq.active) {
      this.eqNode = this.tuna.Equalizer({
        f0: this.settings.eq.bass,
        f1: this.settings.eq.mid,
        f2: this.settings.eq.treble,
      });
      prevNode.connect(this.eqNode);
      prevNode = this.eqNode;
    }
    
    // 4. Autotune (PitchShifter)
    if (this.settings.autotune.active) {
      this.pitchShifter = new PitchShifter(this.audioCtx, {
        pitch: 0, // semitonos (0 = sin cambio)
        wet: this.settings.autotune.strength,
      });
      prevNode.connect(this.pitchShifter.input);
      prevNode = this.pitchShifter.output;
      // Simular detección de pitch: cada cierto tiempo analizar el input y ajustar pitch
      this.startPitchDetection();
    }
    
    // 5. Reverb
    if (this.settings.reverb.active && this.settings.reverb.mix > 0) {
      this.reverbNode = this.tuna.Convolver({
        dryLevel: 1 - this.settings.reverb.mix,
        wetLevel: this.settings.reverb.mix,
        impulse: this.getImpulseForRoom(this.settings.reverb.roomSize),
      });
      prevNode.connect(this.reverbNode);
      prevNode = this.reverbNode;
    }
    
    // 6. Delay
    if (this.settings.delay.active && this.settings.delay.mix > 0) {
      this.delayNode = this.tuna.Delay({
        feedback: this.settings.delay.feedback,
        delayTime: this.settings.delay.time,
        wetLevel: this.settings.delay.mix,
        dryLevel: 1 - this.settings.delay.mix,
      });
      prevNode.connect(this.delayNode);
      prevNode = this.delayNode;
    }
    
    // 7. Widening
    if (this.settings.widening.active) {
      this.wideningNode = this.tuna.Chorus({
        rate: 1.5,
        feedback: 0.2,
        delay: 0.0045,
        depth: this.settings.widening.width,
      });
      prevNode.connect(this.wideningNode);
      prevNode = this.wideningNode;
    }
    
    // Conectar voz al gain final
    prevNode.connect(this.voiceGain);
    this.voiceGain.gain.value = this.settings.voiceVolume;
    
    // Conectar instrumental
    this.instrumentalSource.connect(this.musicGain);
    this.musicGain.gain.value = this.settings.musicVolume;
    
    // Mezclar voz e instrumental
    this.voiceGain.connect(this.outputGain);
    this.musicGain.connect(this.outputGain);
    
    // Salida a altavoz (para que el usuario se escuche)
    this.outputGain.connect(this.audioCtx.destination);
    // Salida para grabación
    this.outputGain.connect(this.recorderGain);
    this.recorderGain.connect(this.destinationStream);
  }
  
  private getImpulseForRoom(roomSize: string): AudioBuffer {
    // ... misma implementación que antes
    const sampleRate = this.audioCtx.sampleRate;
    const duration = roomSize === 'small' ? 0.6 : roomSize === 'medium' ? 1.2 : 2.0;
    const buffer = this.audioCtx.createBuffer(1, duration * sampleRate, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (0.05 * sampleRate));
    }
    return buffer;
  }
  
  private startPitchDetection() {
    // Usaremos un analizador sencillo cada 50ms
    const analyser = this.audioCtx.createAnalyser();
    this.micSource.connect(analyser);
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    let lastPitch = 440;
    
    const detect = () => {
      if (!this.pitchShifter) return;
      analyser.getFloatTimeDomainData(dataArray);
      const pitch = this.autoCorrelate(dataArray, this.audioCtx.sampleRate);
      if (pitch > 0) {
        lastPitch = pitch;
        const targetPitch = this.getTargetPitchFromKey(pitch, this.settings.autotune.key, this.settings.autotune.scale);
        const cents = 1200 * Math.log2(targetPitch / pitch);
        const semitones = cents / 100;
        // Limitar corrección máxima a ±2 semitonos
        const correction = Math.min(2, Math.max(-2, semitones)) * this.settings.autotune.strength;
        this.pitchShifter.pitch = correction;
        this.onPitchUpdate?.(pitch, targetPitch);
      }
      requestAnimationFrame(detect);
    };
    detect();
  }
  
  private autoCorrelate(buffer: Float32Array, sampleRate: number): number {
    // Implementación simplificada de autocorrelación
    let size = buffer.length;
    let maxCorr = 0;
    let pitch = -1;
    for (let lag = 20; lag < 1000; lag++) {
      let corr = 0;
      for (let i = 0; i < size - lag; i++) {
        corr += buffer[i] * buffer[i+lag];
      }
      if (corr > maxCorr) {
        maxCorr = corr;
        pitch = sampleRate / lag;
      }
    }
    return pitch > 80 && pitch < 800 ? pitch : -1;
  }
  
  private getTargetPitchFromKey(currentPitch: number, key: string, scale: string): number {
    // Mapeo de teclas a frecuencias base (C4 = 261.63)
    const notes = { C: 261.63, 'C#': 277.18, D: 293.66, 'D#': 311.13, E: 329.63, F: 349.23, 'F#': 369.99, G: 392.00, 'G#': 415.30, A: 440.00, 'A#': 466.16, B: 493.88 };
    const baseFreq = notes[key as keyof typeof notes] || 261.63;
    // Escala mayor: índices 0,2,4,5,7,9,11
    const majorScale = [0,2,4,5,7,9,11];
    const scaleIndices = scale === 'major' ? majorScale : [0,2,3,5,7,8,10]; // menor natural
    
    // Encontrar la nota más cercana en la escala
    let bestFreq = baseFreq;
    let bestDiff = Infinity;
    for (let octave = 2; octave <= 6; octave++) {
      for (let idx of scaleIndices) {
        const freq = baseFreq * Math.pow(2, (idx + (octave-4)*12) / 12);
        const diff = Math.abs(Math.log2(currentPitch / freq));
        if (diff < bestDiff) {
          bestDiff = diff;
          bestFreq = freq;
        }
      }
    }
    return bestFreq;
  }
  
  private disconnect() {
    if (this.compressorNode) this.compressorNode.disconnect();
    if (this.eqNode) this.eqNode.disconnect();
    if (this.reverbNode) this.reverbNode.disconnect();
    if (this.delayNode) this.delayNode.disconnect();
    if (this.wideningNode) this.wideningNode.disconnect();
    if (this.pitchShifter) this.pitchShifter.destroy();
    this.voiceGain.disconnect();
    this.musicGain.disconnect();
    this.outputGain.disconnect();
    this.recorderGain.disconnect();
  }
  
  public updateSettings(newSettings: Partial<ProEffectSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.applySettings();
  }
  
  public getRecordingStream(): MediaStream {
    return this.destinationStream.stream;
  }
  
  public dispose() {
    this.disconnect();
    this.micSource.disconnect();
    this.instrumentalSource.disconnect();
  }
}