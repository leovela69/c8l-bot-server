// supabase/functions/moderator-ai/index.ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const { commentId, commentText, userId } = await req.json();

    if (!commentText) {
      return new Response(JSON.stringify({ error: 'Falta commentText' }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const perspectiveApiKey = Deno.env.get('PERSPECTIVE_API_KEY');
    let toxicityScore = 0;
    let isToxic = false;

    if (perspectiveApiKey) {
      // Call Perspective API
      try {
        const response = await fetch(
          `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${perspectiveApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              comment: { text: commentText },
              languages: ['es', 'en'],
              requestedAttributes: { TOXICITY: {} }
            })
          }
        );
        if (response.ok) {
          const result = await response.json();
          toxicityScore = result.attributeScores.TOXICITY.summaryScore.value;
          isToxic = toxicityScore > 0.7; // threshold
        }
      } catch (err) {
        console.error('Error contacting Perspective API, falling back to heuristics:', err);
      }
    }

    // Heuristic fallback if Perspective API is not set or failed
    if (!perspectiveApiKey || toxicityScore === 0) {
      const badWords = ['mierda', 'puta', 'cabron', 'maricon', 'hijo de puta', 'fuck', 'shit', 'asshole'];
      const textLower = commentText.toLowerCase();
      const hasBadWord = badWords.some(word => textLower.includes(word));
      toxicityScore = hasBadWord ? 0.85 : 0.1;
      isToxic = hasBadWord;
    }

    if (isToxic) {
      // Moderate comment in video_comments if commentId is given
      if (commentId) {
        await supabase
          .from('video_comments')
          .update({ moderated: true, comment: '[Comentario moderado por IA]' })
          .eq('id', commentId);
      }

      // Record a report in reports table
      await supabase.from('reports').insert({
        type: 'comment',
        target_id: commentId || 'unspecified',
        target_name: 'Comentario de Video',
        reporter_id: userId || null,
        reporter_name: 'IA Moderator',
        reason: 'Toxicidad detectada',
        description: `Comentario: "${commentText}". Moderado automáticamente. Score de toxicidad: ${Math.round(toxicityScore * 100)}%.`,
        status: 'resolved',
        severity: 'high',
        resolution: 'El comentario ha sido censurado de forma automática por la IA de C8L.'
      });
    }

    return new Response(JSON.stringify({
      moderated: isToxic,
      toxicityScore,
      message: isToxic ? 'El comentario ha sido bloqueado por lenguaje ofensivo.' : 'Aprobado'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
