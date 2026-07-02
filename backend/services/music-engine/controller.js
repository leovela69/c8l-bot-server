/**
 * Music IA Engine Controller
 * c.8.l. agency - Project Antigravity
 */

const MusicEngineService = require("./service");

/**
 * Genera letras estructuradas con metatags musicales basándose en la temática e intenciones.
 */
exports.generateLyrics = async (req, res) => {
  try {
    const { theme, style, styleInfluence } = req.body;

    if (!theme) {
      return res.status(400).json({
        success: false,
        error: "Se requiere un tema base para la generación de letras."
      });
    }

    console.log(`[Music Controller] Generando letras para temática: "${theme}", estilo: "${style}"`);
    
    // Llamar al servicio generativo
    const lyrics = await MusicEngineService.callLyricsGenerationAPI({
      theme,
      style,
      styleInfluence
    });

    return res.status(200).json({
      success: true,
      lyrics,
      metadata: {
        theme,
        style,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("[Music Controller] Error al generar letras:", error);
    return res.status(500).json({
      success: false,
      error: "Error interno del servidor en el motor de letras: " + error.message
    });
  }
};

/**
 * Intercepta los prompts, aplica el filtro de exclusión negativo penalizado y genera la canción con stems.
 */
exports.generateMusicTrack = async (req, res) => {
  try {
    const { title, positivePrompt, negativePrompt, styleInfluence, bpm } = req.body;

    if (!positivePrompt) {
      return res.status(400).json({
        success: false,
        error: "Se requiere un prompt positivo para acondicionar el sonido."
      });
    }

    console.log(`[Music Controller] Interceptando prompts para track: "${title || "Unnamed"}"`);
    console.log(`[Music Controller] Prompt Positivo: "${positivePrompt}"`);
    console.log(`[Music Controller] Prompt Negativo (Exclusión): "${negativePrompt || "Ninguno"}"`);

    // Lógica del Filtro de Exclusión (Negative Prompting)
    // Penalización estricta al vector de pesos de inferencia w_e
    const weightPenaltyFactor = 0.85; // w_e
    
    let processedPrompt = positivePrompt;
    if (negativePrompt) {
      // Concatenar de forma limpia indicando penalización de tokens negativos al backend generativo
      processedPrompt = `${positivePrompt} | EXCLUSIONS: [${negativePrompt}] (w_e_penalty: ${weightPenaltyFactor})`;
    }

    console.log(`[Music Controller] Prompt procesado final para inferencia: "${processedPrompt}"`);

    // Llamar al servicio generativo de música (Suno/MusicGen API wrapper)
    const audioOutput = await MusicEngineService.callMusicGenerationAPI({
      prompt: processedPrompt,
      styleInfluence,
      bpm: bpm || 120,
      title: title || "Quantum Audio Track"
    });

    return res.status(200).json({
      success: true,
      trackId: audioOutput.trackId,
      title: audioOutput.title,
      processedPrompt,
      bpm: audioOutput.bpm,
      stemsUrls: audioOutput.stems,
      masterUrl: audioOutput.masterUrl,
      lyrics: audioOutput.lyrics
    });

  } catch (error) {
    console.error("[Music Controller] Error al generar pista musical:", error);
    return res.status(500).json({
      success: false,
      error: "Error interno en el motor de síntesis de audio: " + error.message
    });
  }
};
