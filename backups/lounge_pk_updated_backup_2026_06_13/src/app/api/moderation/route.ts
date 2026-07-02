export const dynamic = 'force-static';
// app/api/moderation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// 1. La clave se toma de las variables de entorno
const PERSPECTIVE_API_KEY = process.env.PERSPECTIVE_API_KEY;
const PERSPECTIVE_API_URL = 'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';

// 2. Función central que habla con Perspective API
async function moderateText(text: string): Promise<{ isSafe: boolean; scores?: any }> {
  if (!PERSPECTIVE_API_KEY) {
    console.error('PERSPECTIVE_API_KEY no está configurada');
    return { isSafe: true };
  }

  try {
    // 3. Llamada a la API de Google para analizar el texto
    const response = await axios.post(
      PERSPECTIVE_API_URL,
      {
        comment: { text },
        languages: ['es'], // Forzar análisis en español
        requestedAttributes: {
          TOXICITY: {},
          SEVERE_TOXICITY: {},
          THREAT: {}, // <- Detecta amenazas directamente
          INSULT: {},
          IDENTITY_ATTACK: {},
        },
      },
      { params: { key: PERSPECTIVE_API_KEY } }
    );

    // Extraer las puntuaciones del resultado
    const scores = response.data.attributeScores;
    const toxicity = scores.TOXICITY.summaryScore.value;
    const severeToxicity = scores.SEVERE_TOXICITY.summaryScore.value;
    const threat = scores.THREAT.summaryScore.value;
    const insult = scores.INSULT.summaryScore.value;

    // 4. Lógica de decisión: Bloquear si supera el umbral en alguna categoría sensible
    const isThreatOrViolent = threat > 0.7 || severeToxicity > 0.7 || (toxicity > 0.8 && insult > 0.6);

    if (isThreatOrViolent) {
      console.warn(`❗ Mensaje bloqueado por contenido violento/amenazante. Puntuaciones:`, scores);
      return { isSafe: false, scores };
    }

    // Mensaje seguro
    return { isSafe: true, scores };
  } catch (error) {
    // En caso de error con la API, registramos pero permitimos el mensaje
    console.error('Error moderando el mensaje:', error);
    return { isSafe: true };
  }
}

// POST es el método que usaremos para enviar el texto a moderar
export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'No se proporcionó texto para moderar' }, { status: 400 });
    }

    const moderationResult = await moderateText(text);

    if (!moderationResult.isSafe) {
      // 5. (Opcional) Guardar el mensaje bloqueado en una tabla de auditoría para revisión manual
      // await saveBlockedMessage(text, moderationResult.scores);
      
      return NextResponse.json({
        allowed: false,
        message: 'Tu mensaje no se ha enviado porque contiene lenguaje prohibido.',
      });
    }

    return NextResponse.json({ allowed: true });
  } catch (error) {
    console.error('Error en el proceso de moderación:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}