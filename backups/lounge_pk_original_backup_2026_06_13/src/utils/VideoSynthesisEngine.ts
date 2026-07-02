export interface VideoSynthesisPayload {
  subjectImage: File | null;
  environmentImage: File | null;
  stylePreset: "pan" | "realistic" | "cartoon" | "anime" | string;
  songAudioUrl: string | null;
  lyricsPrompt: string;
}

export interface VideoSynthesisResult {
  videoUrl: string;
  duration: number; // in seconds, i.e., 210
  logs: string[];
}

export const STYLE_PRESET_MAP: Record<string, string> = {
  pan: "Cinematic slow pan, 8k resolution, anamorphic lens flare, professional lighting.",
  realistic: "Photorealistic, hyper-detailed skin textures, natural depth of field, volumetric fog.",
  cartoon: "3D animated style, rounded chunky shapes, vibrant colors, Pixar aesthetic.",
  anime: "Japanese anime style, cell-shaded, hand-drawn textures, high-octane action lines, Studio Ghibli vibe.",
};

export class VideoSynthesisEngine {
  /**
   * Helper to record a Canvas animation of the uploaded photo(s) into a WebM video.
   */
  static async recordCanvasVideo(
    subjectUrl: string | null,
    environmentUrl: string | null,
    stylePreset: string,
    durationMs: number = 8000
  ): Promise<string> {
    if (typeof window === "undefined" || typeof document === "undefined" || typeof MediaRecorder === "undefined") {
      return "";
    }

    // Create canvas element
    const canvas = document.createElement("canvas");
    canvas.width = 854;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas 2d context");

    // Load images
    const loadImg = (url: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = (e) => reject(e);
        img.src = url;
      });
    };

    let subjectImg: HTMLImageElement | null = null;
    let envImg: HTMLImageElement | null = null;

    try {
      if (subjectUrl) subjectImg = await loadImg(subjectUrl);
    } catch (e) {
      console.error("Failed to load subject image for recording:", e);
    }

    try {
      if (environmentUrl) envImg = await loadImg(environmentUrl);
    } catch (e) {
      console.error("Failed to load environment image for recording:", e);
    }

    // Set up MediaRecorder on canvas stream
    const stream = canvas.captureStream(30); // 30 fps
    let options = { mimeType: "video/webm;codecs=vp9" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "video/webm;codecs=vp8" };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "video/webm" };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "" };
    }

    const recordedChunks: BlobPart[] = [];
    const mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    const recordingPromise = new Promise<string>((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        resolve(url);
      };
      mediaRecorder.onerror = (e) => reject(e);
    });

    mediaRecorder.start();

    const startTime = Date.now();
    let animationFrameId: number;

    // Helper to draw rotating pentagram / star
    const drawCyberShape = (cx: number, cy: number, size: number, angle: number, color: string) => {
      ctx!.save();
      ctx!.translate(cx, cy);
      ctx!.rotate(angle);
      ctx!.strokeStyle = color;
      ctx!.lineWidth = 4;
      ctx!.shadowColor = color;
      ctx!.shadowBlur = 15;
      ctx!.beginPath();
      for (let j = 0; j < 5; j++) {
        const a = (j * Math.PI * 2) / 5;
        const rx = Math.cos(a) * size;
        const ry = Math.sin(a) * size;
        if (j === 0) ctx!.moveTo(rx, ry);
        else ctx!.lineTo(rx, ry);
      }
      ctx!.closePath();
      ctx!.stroke();
      ctx!.restore();
    };

    // Draw Scene 1: Portrait Close-up
    const drawScene1 = (progress: number, elapsed: number, alpha: number) => {
      ctx!.save();
      ctx!.globalAlpha = alpha;

      // Pink vignette gradient backdrop
      const grad = ctx!.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 50,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.7
      );
      grad.addColorStop(0, "#190815");
      grad.addColorStop(1, "#030104");
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, canvas.width, canvas.height);

      // Slower, smooth pan on background environment under subject (double exposure vibe)
      if (envImg) {
        ctx!.save();
        ctx!.globalAlpha = 0.18 * alpha;
        const scale = 1.1 + Math.sin(progress * Math.PI) * 0.05;
        const ew = canvas.width * scale;
        const eh = canvas.height * scale;
        ctx!.drawImage(envImg, (canvas.width - ew)/2, (canvas.height - eh)/2, ew, eh);
        ctx!.restore();
      }

      // Neon floating particle dust
      ctx!.fillStyle = "rgba(255, 0, 127, 0.4)";
      for (let i = 0; i < 35; i++) {
        const px = (i * 123 + elapsed * 0.05) % canvas.width;
        const py = (i * 77 + elapsed * 0.02) % canvas.height;
        const r = 1 + (i % 3);
        ctx!.beginPath();
        ctx!.arc(px, py, r, 0, Math.PI * 2);
        ctx!.fill();
      }

      if (subjectImg) {
        const t1 = 0.35;
        const zoom = 1.25 - (progress / t1) * 0.12; // slow zoom out
        const size = 190 * zoom;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Glowing backdrop behind face
        ctx!.save();
        const faceGlow = ctx!.createRadialGradient(cx, cy, size/4, cx, cy, size*0.75);
        faceGlow.addColorStop(0, "rgba(255, 0, 127, 0.55)");
        faceGlow.addColorStop(1, "rgba(255, 0, 127, 0)");
        ctx!.fillStyle = faceGlow;
        ctx!.beginPath();
        ctx!.arc(cx, cy, size * 0.75, 0, Math.PI*2);
        ctx!.fill();
        ctx!.restore();

        // Cyber shoulders silhouette
        ctx!.save();
        ctx!.strokeStyle = "#00F3FF";
        ctx!.fillStyle = "#0c0d10";
        ctx!.lineWidth = 3.5;
        ctx!.beginPath();
        ctx!.moveTo(cx - 55, cy + size * 0.4);
        ctx!.bezierCurveTo(cx - 95, cy + size * 0.8, cx - 130, cy + size * 1.1, cx - 160, canvas.height);
        ctx!.lineTo(cx + 160, canvas.height);
        ctx!.bezierCurveTo(cx + 130, cy + size * 1.1, cx + 95, cy + size * 0.8, cx + 55, cy + size * 0.4);
        ctx!.closePath();
        ctx!.fill();
        ctx!.stroke();
        ctx!.restore();

        // Crop face
        ctx!.save();
        ctx!.beginPath();
        ctx!.arc(cx, cy, size / 2, 0, Math.PI * 2);
        ctx!.clip();

        const aspect = subjectImg.width / subjectImg.height;
        let dw = size;
        let dh = size;
        if (aspect > 1) dw = size * aspect;
        else dh = size / aspect;

        ctx!.drawImage(subjectImg, cx - dw / 2, cy - dh / 2, dw, dh);
        ctx!.restore();

        // Frame border
        ctx!.strokeStyle = "#FF007F";
        ctx!.lineWidth = 4;
        ctx!.beginPath();
        ctx!.arc(cx, cy, size / 2, 0, Math.PI * 2);
        ctx!.stroke();

        // Laser scan line
        const scanY = cy - size/2 + ((Math.sin(elapsed * 0.004) + 1)/2) * size;
        ctx!.strokeStyle = "rgba(0, 243, 255, 0.9)";
        ctx!.lineWidth = 2.5;
        ctx!.shadowColor = "#00F3FF";
        ctx!.shadowBlur = 10;
        ctx!.beginPath();
        const dy = Math.abs(scanY - cy);
        if (dy < size / 2) {
          const dx = Math.sqrt((size / 2) ** 2 - dy ** 2);
          ctx!.moveTo(cx - dx, scanY);
          ctx!.lineTo(cx + dx, scanY);
          ctx!.stroke();
        }
        ctx!.shadowBlur = 0;
      } else {
        drawCyberShape(canvas.width / 2, canvas.height / 2, 110, elapsed * 0.0015, "#FF007F");
      }

      ctx!.restore();
    };

    // Draw Scene 2: Environmental Wireframe Grid
    const drawScene2 = (progress: number, elapsed: number, alpha: number) => {
      ctx!.save();
      ctx!.globalAlpha = alpha;

      const t1 = 0.35;
      const t2 = 0.70;
      const relP = (progress - t1) / (t2 - t1);

      // Environment panorama pan
      if (envImg) {
        const zoom = 1.15;
        const panX = -25 + relP * 50; // pan left to right
        const w = canvas.width * zoom;
        const h = canvas.height * zoom;
        ctx!.drawImage(envImg, (canvas.width - w) / 2 + panX, (canvas.height - h) / 2, w, h);
      } else {
        ctx!.fillStyle = "#020407";
        ctx!.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw waving 3D topographical grid
      ctx!.strokeStyle = "rgba(0, 243, 255, 0.18)";
      ctx!.lineWidth = 1;
      const step = 32;
      for (let y = 0; y < canvas.height; y += step) {
        ctx!.beginPath();
        for (let x = 0; x < canvas.width; x += 15) {
          const wave = Math.sin((x / canvas.width + progress * 4.5) * Math.PI * 2) * 12;
          if (x === 0) ctx!.moveTo(x, y + wave);
          else ctx!.lineTo(x, y + wave);
        }
        ctx!.stroke();
      }

      // Holographic corner panel showing subject face likeness status
      if (subjectImg) {
        const panelX = 40;
        const panelY = 40;
        const size = 110;

        ctx!.fillStyle = "rgba(0, 0, 0, 0.75)";
        ctx!.fillRect(panelX, panelY, size, size);
        ctx!.strokeStyle = "#00F3FF";
        ctx!.lineWidth = 2;
        ctx!.strokeRect(panelX, panelY, size, size);

        ctx!.fillStyle = "#00F3FF";
        ctx!.font = "bold 7px monospace";
        ctx!.fillText("SCAN_DEPTH: 88.4%", panelX + 6, panelY + size - 8);

        ctx!.save();
        ctx!.beginPath();
        ctx!.rect(panelX + 6, panelY + 6, size - 12, size - 24);
        ctx!.clip();
        ctx!.drawImage(subjectImg, panelX + 6, panelY + 6, size - 12, size - 24);
        ctx!.restore();
      }

      ctx!.restore();
    };

    // Draw Scene 3: Climax Beat Performance
    const drawScene3 = (progress: number, elapsed: number, alpha: number) => {
      ctx!.save();
      ctx!.globalAlpha = alpha;

      const t2 = 0.70;
      // Fast beats simulation for camera shake
      const beatFreq = Math.sin(progress * Math.PI * 28);
      const shakeX = Math.abs(beatFreq) > 0.82 ? (Math.random() - 0.5) * 7 : 0;
      const shakeY = Math.abs(beatFreq) > 0.82 ? (Math.random() - 0.5) * 5 : 0;

      ctx!.save();
      ctx!.translate(shakeX, shakeY);

      // Environment double exposure chromatic aberration
      if (envImg) {
        // Red channel offset
        ctx!.save();
        ctx!.globalAlpha = 0.55 * alpha;
        ctx!.drawImage(envImg, -6, -2, canvas.width + 12, canvas.height + 4);
        ctx!.globalCompositeOperation = "screen";
        ctx!.fillStyle = "rgba(255, 0, 0, 0.12)";
        ctx!.fillRect(0, 0, canvas.width, canvas.height);
        ctx!.restore();

        // Blue channel offset
        ctx!.save();
        ctx!.globalAlpha = 0.55 * alpha;
        ctx!.drawImage(envImg, 6, 2, canvas.width + 12, canvas.height + 4);
        ctx!.globalCompositeOperation = "screen";
        ctx!.fillStyle = "rgba(0, 243, 255, 0.12)";
        ctx!.fillRect(0, 0, canvas.width, canvas.height);
        ctx!.restore();

        // Normal blend
        ctx!.save();
        ctx!.globalAlpha = 0.75 * alpha;
        ctx!.drawImage(envImg, 0, 0, canvas.width, canvas.height);
        ctx!.restore();
      } else {
        ctx!.fillStyle = "#0c030d";
        ctx!.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Subject in the center with a glowing visualizer crown
      if (subjectImg) {
        const scale = 1.0 + Math.sin(progress * Math.PI * 5) * 0.02;
        const size = 160 * scale;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2 - 10;

        // Radial visualizer glow background
        ctx!.save();
        const radGlow = ctx!.createRadialGradient(cx, cy, size/4, cx, cy, size*0.75);
        radGlow.addColorStop(0, "rgba(255, 0, 127, 0.5)");
        radGlow.addColorStop(1, "rgba(255, 0, 127, 0)");
        ctx!.fillStyle = radGlow;
        ctx!.beginPath();
        ctx!.arc(cx, cy, size * 0.75, 0, Math.PI*2);
        ctx!.fill();
        ctx!.restore();

        // Cyber shoulders
        ctx!.save();
        ctx!.strokeStyle = "#00F3FF";
        ctx!.fillStyle = "#07080a";
        ctx!.lineWidth = 3.5;
        ctx!.beginPath();
        ctx!.moveTo(cx - 50, cy + size * 0.4);
        ctx!.bezierCurveTo(cx - 90, cy + size * 0.8, cx - 120, cy + size * 1.1, cx - 150, canvas.height);
        ctx!.lineTo(cx + 150, canvas.height);
        ctx!.bezierCurveTo(cx + 120, cy + size * 1.1, cx + 90, cy + size * 0.8, cx + 50, cy + size * 0.4);
        ctx!.closePath();
        ctx!.fill();
        ctx!.stroke();
        ctx!.restore();

        // Crop face
        ctx!.save();
        ctx!.beginPath();
        ctx!.arc(cx, cy, size / 2, 0, Math.PI * 2);
        ctx!.clip();

        const aspect = subjectImg.width / subjectImg.height;
        let dw = size;
        let dh = size;
        if (aspect > 1) dw = size * aspect;
        else dh = size / aspect;

        ctx!.drawImage(subjectImg, cx - dw / 2, cy - dh / 2, dw, dh);
        ctx!.restore();

        // Face border
        ctx!.strokeStyle = "#FF007F";
        ctx!.lineWidth = 3.5;
        ctx!.beginPath();
        ctx!.arc(cx, cy, size / 2, 0, Math.PI * 2);
        ctx!.stroke();

        // RADIAL FREQUENCY VISUALIZER CROWN
        ctx!.save();
        ctx!.translate(cx, cy);
        ctx!.strokeStyle = "#00F3FF";
        ctx!.lineWidth = 2.5;
        const barsCount = 48;
        for (let b = 0; b < barsCount; b++) {
          const angle = (b * Math.PI * 2) / barsCount;
          // Reacting length
          const bounce = Math.abs(Math.sin(b * 0.25 + elapsed * 0.015)) * 32 + 8;
          const rStart = size / 2 + 5;
          ctx!.beginPath();
          ctx!.moveTo(Math.cos(angle) * rStart, Math.sin(angle) * rStart);
          ctx!.lineTo(Math.cos(angle) * (rStart + bounce), Math.sin(angle) * (rStart + bounce));
          ctx!.stroke();
        }
        ctx!.restore();
      } else {
        drawCyberShape(canvas.width / 2, canvas.height / 2, 130, -elapsed * 0.002, "#00F3FF");
      }

      ctx!.restore();
      ctx!.restore();
    };

    return new Promise<string>((resolve, reject) => {
      function drawFrame() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / durationMs;

        if (progress >= 1.0) {
          mediaRecorder.stop();
          recordingPromise.then(resolve).catch(reject);
          return;
        }

        // Draw backdrop
        ctx!.fillStyle = "#050506";
        ctx!.fillRect(0, 0, canvas.width, canvas.height);

        // Scene boundaries
        const t1 = 0.35; // Cut 1: 35% time
        const t2 = 0.70; // Cut 2: 70% time
        const trans = 0.04; // Transition duration (320ms)

        let a1 = 0;
        let a2 = 0;
        let a3 = 0;

        if (progress < t1 - trans) {
          a1 = 1;
        } else if (progress < t1 + trans) {
          const blend = (progress - (t1 - trans)) / (trans * 2);
          a1 = 1 - blend;
          a2 = blend;
        } else if (progress < t2 - trans) {
          a2 = 1;
        } else if (progress < t2 + trans) {
          const blend = (progress - (t2 - trans)) / (trans * 2);
          a2 = 1 - blend;
          a3 = blend;
        } else {
          a3 = 1;
        }

        // Draw active storyboard scenes
        if (a1 > 0) drawScene1(progress, elapsed, a1);
        if (a2 > 0) drawScene2(progress, elapsed, a2);
        if (a3 > 0) drawScene3(progress, elapsed, a3);

        // 3. Audio visualizer spectrum bars (unified overlay)
        const barW = 8;
        const gap = 3;
        const numBars = Math.floor(canvas.width / (barW + gap));
        ctx!.fillStyle = "rgba(0, 243, 255, 0.85)";
        for (let b = 0; b < numBars; b++) {
          const waveHeight = 14 + Math.abs(Math.sin(b * 0.12 + progress * Math.PI * 16)) * 40 + Math.random() * 10;
          ctx!.fillRect(b * (barW + gap), canvas.height - waveHeight, barW, waveHeight);
        }

        // 4. Tech HUD overlay details
        ctx!.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx!.fillRect(24, 24, 250, 78);
        ctx!.strokeStyle = "#FF007F";
        ctx!.lineWidth = 2;
        ctx!.strokeRect(24, 24, 250, 78);

        ctx!.fillStyle = "#FF007F";
        ctx!.font = "bold 9px 'Courier New', monospace";
        ctx!.fillText("🔴 REC [C8L AI-VEO STORYBOARD v2.5]", 32, 40);

        ctx!.fillStyle = "#ffffff";
        ctx!.font = "9px 'Courier New', monospace";
        ctx!.fillText(`STYLE PRESET: ${stylePreset.toUpperCase()}`, 32, 54);
        ctx!.fillText(
          `ACTIVE CUT: ${a1 > 0 && a2 > 0 ? "CROSSFADE CUT 1" : a1 > 0 ? "SCENE 1 (PORTRAIT)" : a2 > 0 && a3 > 0 ? "CROSSFADE CUT 2" : a2 > 0 ? "SCENE 2 (DEPTH MESH)" : "SCENE 3 (CLIMAX SYNC)"}`,
          32,
          67
        );
        ctx!.fillText(`PROGRESS: ${Math.floor(progress * 100)}% COMPLETE`, 32, 80);

        // Frame border
        ctx!.strokeStyle = "#000000";
        ctx!.lineWidth = 8;
        ctx!.strokeRect(0, 0, canvas.width, canvas.height);

        // Cyber corners
        ctx!.strokeStyle = "#FF007F";
        ctx!.lineWidth = 2.5;
        // top-left
        ctx!.beginPath(); ctx!.moveTo(12, 28); ctx!.lineTo(12, 12); ctx!.lineTo(28, 12); ctx!.stroke();
        // top-right
        ctx!.beginPath(); ctx!.moveTo(canvas.width - 28, 12); ctx!.lineTo(canvas.width - 12, 12); ctx!.lineTo(canvas.width - 12, 28); ctx!.stroke();
        // bottom-left
        ctx!.beginPath(); ctx!.moveTo(12, canvas.height - 28); ctx!.lineTo(12, canvas.height - 12); ctx!.lineTo(28, canvas.height - 12); ctx!.stroke();
        // bottom-right
        ctx!.beginPath(); ctx!.moveTo(canvas.width - 28, canvas.height - 12); ctx!.lineTo(canvas.width - 12, canvas.height - 12); ctx!.lineTo(canvas.width - 12, canvas.height - 28); ctx!.stroke();

        animationFrameId = requestAnimationFrame(drawFrame);
      }

      animationFrameId = requestAnimationFrame(drawFrame);
    });
  }

  /**
   * Simulates a microservice pipeline to synthesize an AI videoclip.
   * Processes the input images, applies recursive frame conditioning,
   * combines with the audio via FFmpeg simulator, and exports the final video.
   */
  static async synthesizeVideo(
    payload: VideoSynthesisPayload,
    onProgress: (log: string) => void
  ): Promise<VideoSynthesisResult> {
    const logs: string[] = [];

    const addLog = (msg: string) => {
      logs.push(msg);
      onProgress(msg);
    };

    // Helper to simulate time delay
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // 1. Initializing microservice pipeline
    addLog("🔧 [VideoSynthesisEngine] Conectando con el microservicio de renderizado de vídeo C8L...");
    await delay(800);

    // 2. Mapping Subject likeness
    if (payload.subjectImage) {
      addLog(`👤 [Subject Layer] Mapeando imagen de sujeto ("${payload.subjectImage.name}") para parecido facial (Likeness Match)...`);
    } else {
      addLog("⚠️ [Subject Layer] No se proporcionó imagen de sujeto. Generando rostro aleatorio estilo C8L...");
    }
    await delay(1000);

    // 3. Mapping Environment / Inpainting
    if (payload.environmentImage) {
      addLog(`🌆 [Environment Layer] Mapeando fondo del escenario ("${payload.environmentImage.name}") para ambientación de set...`);
    } else {
      addLog("🔮 [Environment Layer] Foto 2 ausente. Aplicando Inpainting generativo para reconstruir fondo inteligente...");
    }
    await delay(1200);

    // 4. Injecting Style Preset keywords
    const mappedStyle = STYLE_PRESET_MAP[payload.stylePreset] || STYLE_PRESET_MAP.pan;
    addLog(`🎨 [Style Injector] Preset seleccionado: "${payload.stylePreset}". Inyectando prompt técnico:`);
    addLog(`   >> "${mappedStyle}"`);
    await delay(1000);

    // 5. Parallel Worker Processing
    addLog("⚡ [Workers Suite] Inicializando llamadas en paralelo mediante Workers distribuidos en la granja de render...");
    await delay(800);

    // 6. Loop for Recursive Frame Conditioning (Stitching)
    addLog("🔗 [Continuity Loop] Iniciando algoritmo de Interpolación y Continuidad (Recursive Frame Conditioning)...");
    await delay(600);

    const totalDuration = 210; // 3.5 minutes
    const clipDuration = 10; // each clip is 10s
    const totalClips = Math.ceil(totalDuration / clipDuration); // 21 clips

    for (let i = 1; i <= totalClips; i++) {
      const startTime = (i - 1) * clipDuration;
      const endTime = Math.min(i * clipDuration, totalDuration);

      if (i === 1) {
        addLog(`   🎥 [Conditioning] Generando clip 1/21 (${startTime}s - ${endTime}s) usando imagen inicial como semilla...`);
      } else {
        addLog(`   🎥 [Conditioning] Generando clip ${i}/21 (${startTime}s - ${endTime}s) inyectando el último fotograma del fragmento anterior...`);
      }
      // Speed up simulated rendering progress
      await delay(180);
    }

    // 7. FFmpeg compilation & Audio coupling
    addLog("🎬 [FFmpeg Processing] Agrupando los 21 fragmentos generados para fusión secuencial...");
    await delay(1000);
    addLog("🎛️ [FFmpeg Processing] Aplicando transiciones suaves de mezcla (cross-fade) entre fragmentos...");
    await delay(800);

    if (payload.songAudioUrl) {
      addLog(`🎵 [Audio Coupler] Acoplando pista de audio de la canción generada ("${payload.songAudioUrl}") en el canal estéreo...`);
    } else {
      addLog("🎵 [Audio Coupler] Acoplando pista de audio por defecto: 'CORAZONES LOCOS (IBIZA HOUSE MIX)'...");
    }
    await delay(1000);

    addLog("📦 [FFmpeg Processing] Codificando contenedor final MP4 en códec H.264 / AAC...");
    await delay(900);

    // Always render Canvas video procedurally
    addLog("🎬 [VideoSynthesisEngine] Compilando fotogramas en el lienzo del cliente y codificando stream de video...");
    let videoUrl = "";
    try {
      const subjectUrl = payload.subjectImage ? URL.createObjectURL(payload.subjectImage) : null;
      const environmentUrl = payload.environmentImage ? URL.createObjectURL(payload.environmentImage) : null;

      videoUrl = await this.recordCanvasVideo(subjectUrl, environmentUrl, payload.stylePreset);

      if (subjectUrl) URL.revokeObjectURL(subjectUrl);
      if (environmentUrl) URL.revokeObjectURL(environmentUrl);

      addLog("✨ [VideoSynthesisEngine] ¡Compilación finalizada con éxito! Contenedor WebM generado dinámicamente.");
    } catch (err) {
      addLog("⚠️ [VideoSynthesisEngine] Error en codificación Canvas. Retornando stream vacío...");
      console.error("Canvas recording error:", err);
      videoUrl = "";
    }

    return {
      videoUrl,
      duration: totalDuration,
      logs,
    };
  }
}
