// lib/audio/livePitchAnalyzer.ts
type PitchCallback = (data: { pitch: number; energy: number; timestamp: number }) => void;

export class LivePitchAnalyzer {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private isRunning = false;
  private animationId: number | null = null;
  private onPitchDetected: PitchCallback;
  
  // Historial para suavizar resultados
  private pitchHistory: number[] = [];
  private readonly HISTORY_SIZE = 5;
  
  constructor(onPitchDetected: PitchCallback) {
    this.onPitchDetected = onPitchDetected;
  }
  
  /**
   * Iniciar captura y análisis
   */
  async start(): Promise<boolean> {
    try {
      // 1. Solicitar micrófono
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          latency: 0.01 // Solicitar latencia mínima (10ms)
        } as any
      });
      
      // 2. Crear AudioContext con latencia interactiva
      this.audioContext = new AudioContext({
        latencyHint: 'interactive',
        sampleRate: 44100
      });
      
      // 3. Cargar AudioWorklet
      await this.audioContext.audioWorklet.addModule('/audio/pitch-processor.js');
      
      // 4. Crear nodos
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.workletNode = new AudioWorkletNode(this.audioContext, 'pitch-processor');
      
      // 5. Conectar: micrófono → worklet → destino (opcional, para monitoreo)
      this.sourceNode.connect(this.workletNode);
      // No conectamos a destino para evitar eco, pero podríamos si quisieramos monitoreo
      
      // 6. Escuchar mensajes del worklet
      this.workletNode.port.onmessage = (event) => {
        const { pitch, energy, timestamp } = event.data;
        if (pitch > 0) {
          // Suavizado de pitch (media móvil)
          this.pitchHistory.push(pitch);
          if (this.pitchHistory.length > this.HISTORY_SIZE) {
            this.pitchHistory.shift();
          }
          const avgPitch = this.pitchHistory.reduce((a,b) => a+b, 0) / this.pitchHistory.length;
          
          this.onPitchDetected({
            pitch: avgPitch,
            energy: energy,
            timestamp: timestamp
          });
        }
      };
      
      // 7. Iniciar contexto
      await this.audioContext.resume();
      this.isRunning = true;
      
      console.log('LivePitchAnalyzer iniciado con AudioWorklet');
      return true;
      
    } catch (error) {
      console.error('Error al iniciar analizador de tono:', error);
      return false;
    }
  }
  
  /**
   * Obtener la nota musical más cercana (para feedback visual)
   */
  getNoteFromPitch(pitch: number): { note: string; cents: number } {
    const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const A4 = 440;
    const C0 = A4 * Math.pow(2, -4.75);
    
    const halfSteps = Math.round(12 * Math.log2(pitch / C0));
    const noteIndex = (halfSteps % 12 + 12) % 12;
    const octave = Math.floor(halfSteps / 12);
    const note = `${NOTES[noteIndex]}${octave}`;
    
    const exactPitch = C0 * Math.pow(2, halfSteps / 12);
    const cents = Math.round(1200 * Math.log2(pitch / exactPitch));
    
    return { note, cents };
  }
  
  /**
   * Detener captura y limpiar recursos
   */
  async stop() {
    this.isRunning = false;
    
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.pitchHistory = [];
  }
  
  get isActive(): boolean {
    return this.isRunning;
  }
}