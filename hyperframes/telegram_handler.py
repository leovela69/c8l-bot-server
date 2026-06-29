"""
🎬 HYPERFRAMES TELEGRAM HANDLER
=================================
Comandos de Telegram para crear videos con Hyperframes.

Comandos:
  /video <descripción>         — Genera video con IA desde prompt
  /video template <nombre>     — Usa template pre-construido
  /video templates             — Lista templates disponibles
  /video status                — Estado del motor de renderizado
  /video help                  — Ayuda

Integración con Zeus:
  - Zeus detecta intent "video" y enruta aquí
  - También se activa con frases como "hazme un video de..."
"""

import asyncio
import logging
import re
import threading
from typing import Dict, Optional, Tuple

logger = logging.getLogger("c8l.hyperframes.telegram")



# Lazy-load engine to avoid import cycles
_engine = None


def _get_engine():
    """Obtiene instancia singleton del motor Hyperframes"""
    global _engine
    if _engine is None:
        from hyperframes.engine import HyperframesEngine
        _engine = HyperframesEngine()
    return _engine


# ===========================================================================
# PARSEO DE COMANDOS
# ===========================================================================

def parse_video_command(text: str) -> Dict:
    """
    Parsea el comando /video y determina la acción.

    Retorna:
        Dict con 'action', 'args', y parámetros específicos
    """
    # Limpiar el comando
    text = text.strip()

    # Remover /video o /hf del inicio
    for prefix in ["/video", "/hf", "/hyperframes"]:
        if text.lower().startswith(prefix):
            text = text[len(prefix):].strip()
            break

    # Comando vacío = help
    if not text:
        return {'action': 'help'}

    # Sub-comandos
    lower = text.lower()

    if lower in ('help', 'ayuda', '?'):
        return {'action': 'help'}

    if lower in ('status', 'estado'):
        return {'action': 'status'}

    if lower in ('templates', 'plantillas', 'lista'):
        return {'action': 'list_templates'}

    # Template con variables: template <name> var1=val1 var2=val2
    if lower.startswith('template ') or lower.startswith('plantilla '):
        return _parse_template_command(text)

    # Formato específico: neon, social, stats, etc (atajos)
    format_shortcuts = {
        'neon': 'neon_glow',
        'social': 'social_promo',
        'promo': 'social_promo',
        'lanzamiento': 'product_launch',
        'launch': 'product_launch',
        'anuncio': 'announcement',
        'countdown': 'countdown',
        'cuenta': 'countdown',
        'stats': 'stats',
        'logo': 'logo_sting',
        'marca': 'logo_sting',
        'kinetic': 'kinetic_type',
        'texto': 'kinetic_type',
    }

    first_word = lower.split()[0]
    if first_word in format_shortcuts:
        # Tratar como template con el resto como variables
        template_name = format_shortcuts[first_word]
        rest = text[len(first_word):].strip()
        return {
            'action': 'template_shortcut',
            'template': template_name,
            'prompt': rest
        }

    # Default: generar video con IA desde el prompt
    return {
        'action': 'generate',
        'prompt': text
    }



def _parse_template_command(text: str) -> Dict:
    """Parsea: template <nombre> var1=valor1 var2=valor2"""
    # Quitar "template " o "plantilla "
    for prefix in ['template ', 'plantilla ']:
        if text.lower().startswith(prefix):
            text = text[len(prefix):].strip()
            break

    parts = text.split()
    if not parts:
        return {'action': 'list_templates'}

    template_name = parts[0]
    variables = {}

    # Parsear variables key=value
    for part in parts[1:]:
        if '=' in part:
            key, val = part.split('=', 1)
            variables[key.strip()] = val.strip()

    return {
        'action': 'render_template',
        'template': template_name,
        'variables': variables
    }


# ===========================================================================
# HANDLERS PRINCIPALES
# ===========================================================================

async def handle_video_command(text: str, chat_id: str, user_name: str,
                               send_fn=None, typing_fn=None,
                               video_fn=None, video_action_fn=None) -> Dict:
    """
    Handler principal para comandos de video.

    Args:
        text: Texto del comando
        chat_id: ID del chat de Telegram
        user_name: Nombre del usuario
        send_fn: Función para enviar texto (chat_id, text)
        typing_fn: Función para mostrar "escribiendo..."
        video_fn: Función para enviar video (chat_id, bytes, filename, caption)
        video_action_fn: Función para mostrar "subiendo video..."
    """
    parsed = parse_video_command(text)
    action = parsed['action']

    if action == 'help':
        return await _handle_help(send_fn, chat_id)

    elif action == 'status':
        return await _handle_status(send_fn, chat_id)

    elif action == 'list_templates':
        return await _handle_list_templates(send_fn, chat_id)

    elif action == 'render_template':
        return await _handle_render_template(
            parsed, chat_id, send_fn, typing_fn, video_fn, video_action_fn
        )

    elif action == 'template_shortcut':
        return await _handle_template_shortcut(
            parsed, chat_id, user_name, send_fn, typing_fn, video_fn, video_action_fn
        )

    elif action == 'generate':
        return await _handle_generate(
            parsed, chat_id, user_name, send_fn, typing_fn, video_fn, video_action_fn
        )

    return {'status': 'error', 'error': 'Acción no reconocida'}



# ===========================================================================
# HANDLERS ESPECÍFICOS
# ===========================================================================

async def _handle_help(send_fn, chat_id) -> Dict:
    """Muestra ayuda de video"""
    help_text = (
        "🎬 *HYPERFRAMES — Motor de Video HTML→MP4*\n\n"
        "📋 *Comandos:*\n"
        "• `/video <descripción>` — Crea video con IA\n"
        "• `/video template <nombre> vars...` — Usa plantilla\n"
        "• `/video templates` — Ver plantillas\n"
        "• `/video status` — Estado del motor\n\n"
        "⚡ *Atajos rápidos:*\n"
        "• `/video neon Mi Texto` — Estilo neón\n"
        "• `/video social Headline` — Promo social\n"
        "• `/video countdown GO!` — Cuenta regresiva\n"
        "• `/video logo MiMarca` — Logo animado\n"
        "• `/video stats` — Estadísticas\n"
        "• `/video lanzamiento` — Product launch\n\n"
        "🎨 *Estilos para IA:*\n"
        "Incluye en tu prompt: neon, minimal, bold, elegant, modern\n\n"
        "💡 *Ejemplo:*\n"
        "`/video un intro épico estilo neon para C8L Agency`\n"
        "`/video template logo_sting brand=C8L tagline=Agency`"
    )
    if send_fn:
        send_fn(chat_id, help_text)
    return {'status': 'ok', 'action': 'help'}


async def _handle_status(send_fn, chat_id) -> Dict:
    """Muestra estado del motor"""
    engine = _get_engine()
    status = engine.get_status()

    reqs = status['requirements']
    node_emoji = "✅" if reqs['node'] else "❌"
    ffmpeg_emoji = "✅" if reqs['ffmpeg'] else "❌"
    ready_emoji = "🟢" if reqs['ready'] else "🔴"

    text = (
        f"🎬 *HYPERFRAMES ENGINE STATUS*\n\n"
        f"{ready_emoji} Motor: {'Listo' if reqs['ready'] else 'No disponible'}\n"
        f"{node_emoji} Node.js 22+: {'OK' if reqs['node'] else 'No encontrado'}\n"
        f"{ffmpeg_emoji} FFmpeg: {'OK' if reqs['ffmpeg'] else 'No encontrado'}\n\n"
        f"📊 Videos renderizados: {status['render_count']}\n"
        f"🕐 Último render: {status['last_render'] or 'Ninguno'}\n"
        f"⚠️ Errores: {status['errors_count']}"
    )
    if send_fn:
        send_fn(chat_id, text)
    return {'status': 'ok', 'data': status}


async def _handle_list_templates(send_fn, chat_id) -> Dict:
    """Lista plantillas disponibles"""
    from hyperframes.templates import VideoTemplates
    summary = VideoTemplates.get_summary()
    if send_fn:
        send_fn(chat_id, summary)
    return {'status': 'ok', 'action': 'list_templates'}



async def _handle_render_template(parsed, chat_id, send_fn,
                                   typing_fn, video_fn, video_action_fn) -> Dict:
    """Renderiza un template con variables"""
    template_name = parsed.get('template', '')
    variables = parsed.get('variables', {})

    from hyperframes.templates import get_template

    template = get_template(template_name)
    if not template:
        if send_fn:
            send_fn(chat_id,
                    f"❌ Template '{template_name}' no encontrado.\n"
                    f"Usa /video templates para ver los disponibles.")
        return {'status': 'error', 'error': f'Template not found: {template_name}'}

    # Verificar variables requeridas
    missing_vars = [v for v in template['variables'] if v not in variables]
    if missing_vars:
        vars_hint = ", ".join(f"{v}=..." for v in template['variables'])
        if send_fn:
            send_fn(chat_id,
                    f"⚠️ Faltan variables para '{template_name}':\n"
                    f"Requeridas: {', '.join(template['variables'])}\n\n"
                    f"💡 Uso: /video template {template_name} {vars_hint}")
        return {'status': 'error', 'error': f'Missing vars: {missing_vars}'}

    # Notificar que estamos renderizando
    if send_fn:
        send_fn(chat_id, f"🎬 Renderizando template `{template_name}`...")
    if typing_fn:
        typing_fn(chat_id)

    # Renderizar
    engine = _get_engine()
    result = await engine.render_template(template_name, variables)

    return await _send_render_result(result, chat_id, send_fn, video_fn, video_action_fn)


async def _handle_template_shortcut(parsed, chat_id, user_name,
                                     send_fn, typing_fn, video_fn, video_action_fn) -> Dict:
    """Maneja atajos de templates (ej: /video neon Mi Texto)"""
    template_name = parsed.get('template', '')
    prompt = parsed.get('prompt', '')

    from hyperframes.templates import get_template

    template = get_template(template_name)
    if not template:
        # Fallback a generación con IA
        return await _handle_generate(
            {'action': 'generate', 'prompt': f"{template_name} {prompt}"},
            chat_id, user_name, send_fn, typing_fn, video_fn, video_action_fn
        )

    # Auto-asignar variables desde el prompt
    variables = _auto_assign_variables(template, prompt, user_name)

    if send_fn:
        send_fn(chat_id, f"🎬 Creando video estilo `{template_name}`...")
    if typing_fn:
        typing_fn(chat_id)

    engine = _get_engine()
    result = await engine.render_template(template_name, variables)

    return await _send_render_result(result, chat_id, send_fn, video_fn, video_action_fn)



async def _handle_generate(parsed, chat_id, user_name,
                           send_fn, typing_fn, video_fn, video_action_fn) -> Dict:
    """Genera video con IA desde un prompt libre"""
    prompt = parsed.get('prompt', '')

    if not prompt:
        if send_fn:
            send_fn(chat_id, "❌ Necesito una descripción. Ej: /video un intro para mi canal")
        return {'status': 'error', 'error': 'Empty prompt'}

    # Detectar estilo del prompt
    style = _detect_style(prompt)

    # Detectar dimensiones
    width, height = _detect_dimensions(prompt)

    if send_fn:
        send_fn(chat_id,
                f"🎬 Generando video con IA...\n"
                f"📐 {width}x{height} | 🎨 Estilo: {style}\n"
                f"⏱️ Esto puede tardar 1-3 minutos...")
    if typing_fn:
        typing_fn(chat_id)

    engine = _get_engine()
    result = await engine.generate_and_render(
        prompt=prompt,
        style=style,
        duration=_detect_duration(prompt),
        width=width,
        height=height
    )

    return await _send_render_result(result, chat_id, send_fn, video_fn, video_action_fn)


# ===========================================================================
# UTILIDADES
# ===========================================================================

async def _send_render_result(result, chat_id, send_fn, video_fn, video_action_fn) -> Dict:
    """Envía el resultado del render al chat"""
    if result['status'] == 'success':
        video_bytes = result.get('video_bytes')
        filename = result.get('filename', 'video.mp4')
        size_mb = result.get('size_mb', 0)
        method = result.get('method', 'hyperframes')

        caption = (
            f"🎬 Video generado por C8L Hyperframes\n"
            f"📐 {result.get('width')}x{result.get('height')} @ {result.get('fps')}fps\n"
            f"📦 {size_mb} MB"
        )
        if method == 'fallback_ffmpeg':
            caption += "\n⚡ (render rápido)"

        if video_action_fn:
            video_action_fn(chat_id)

        if video_fn and video_bytes:
            video_fn(chat_id, video_bytes, filename, caption)
            return {'status': 'ok', 'size_mb': size_mb, 'filename': filename}
        elif send_fn:
            send_fn(chat_id, f"✅ Video renderizado: {filename} ({size_mb} MB)\n"
                             f"(No pude enviarlo por Telegram)")
            return {'status': 'ok', 'filename': filename}
    else:
        error = result.get('error', 'Error desconocido')
        if send_fn:
            send_fn(chat_id, f"❌ Error al renderizar: {error[:300]}")
        return {'status': 'error', 'error': error}


def _detect_style(prompt: str) -> str:
    """Detecta el estilo visual del prompt"""
    lower = prompt.lower()
    if any(w in lower for w in ['neon', 'cyber', 'glow', 'futurista']):
        return 'neon'
    elif any(w in lower for w in ['minimal', 'simple', 'limpio', 'clean']):
        return 'minimal'
    elif any(w in lower for w in ['bold', 'fuerte', 'impactante', 'grande']):
        return 'bold'
    elif any(w in lower for w in ['elegant', 'elegante', 'luxury', 'premium', 'dorado']):
        return 'elegant'
    return 'modern'


def _detect_dimensions(prompt: str) -> Tuple[int, int]:
    """Detecta dimensiones del video"""
    lower = prompt.lower()
    if any(w in lower for w in ['cuadrado', 'square', 'instagram', '1080x1080', '1:1']):
        return 1080, 1080
    elif any(w in lower for w in ['vertical', 'reel', 'tiktok', 'story', '9:16']):
        return 1080, 1920
    elif any(w in lower for w in ['720', 'hd']):
        return 1280, 720
    return 1920, 1080


def _detect_duration(prompt: str) -> int:
    """Detecta duración del video"""
    # Buscar números seguidos de "seg" o "s"
    match = re.search(r'(\d+)\s*(?:seg|segundo|sec|s\b)', prompt.lower())
    if match:
        dur = int(match.group(1))
        return min(max(dur, 3), 60)  # Entre 3 y 60 segundos
    # Default según contenido
    lower = prompt.lower()
    if any(w in lower for w in ['corto', 'short', 'sting', 'logo']):
        return 5
    elif any(w in lower for w in ['largo', 'long', 'completo']):
        return 20
    return 10



def _auto_assign_variables(template: Dict, prompt: str, user_name: str) -> Dict:
    """Auto-asigna variables de un template desde un prompt libre"""
    variables = {}
    var_names = template.get('variables', [])
    words = prompt.split() if prompt else []

    # Estrategias por template
    template_name = template.get('name', '')

    if template_name == 'neon_glow':
        variables['title'] = prompt or 'C8L AGENCY'
        variables['subtitle'] = f'by {user_name}' if user_name else 'The Future is Now'

    elif template_name == 'social_promo':
        variables['headline'] = prompt or 'BIG NEWS'
        variables['body'] = 'No te lo pierdas'
        variables['badge'] = 'VER MÁS'

    elif template_name == 'product_launch':
        variables['title'] = prompt or 'Nuevo Producto'
        variables['subtitle'] = 'Disponible ahora'
        variables['cta'] = 'DESCUBRE MÁS'

    elif template_name == 'announcement':
        variables['badge_text'] = 'ANUNCIO OFICIAL'
        variables['main_text'] = prompt or 'Gran Novedad'
        variables['detail'] = 'Más detalles próximamente'
        variables['date'] = 'COMING SOON'

    elif template_name == 'countdown':
        variables['final_text'] = prompt or 'GO!'

    elif template_name == 'kinetic_type':
        # Repartir palabras
        if len(words) >= 4:
            variables['word1'] = words[0]
            variables['word2'] = words[1]
            variables['word3'] = words[2]
            variables['word4'] = ' '.join(words[3:])
        elif len(words) == 3:
            variables['word1'] = words[0]
            variables['word2'] = words[1]
            variables['word3'] = words[2]
            variables['word4'] = '!'
        elif len(words) == 2:
            variables['word1'] = words[0]
            variables['word2'] = words[1]
            variables['word3'] = 'NOW'
            variables['word4'] = '!'
        else:
            variables['word1'] = prompt or 'CREATE'
            variables['word2'] = 'BUILD'
            variables['word3'] = 'LAUNCH'
            variables['word4'] = 'WIN'

    elif template_name == 'stats':
        variables['title'] = prompt or 'RESULTADOS'
        variables['stat1_value'] = '10K+'
        variables['stat1_label'] = 'Usuarios'
        variables['stat2_value'] = '99%'
        variables['stat2_label'] = 'Uptime'
        variables['stat3_value'] = '50+'
        variables['stat3_label'] = 'Países'
        variables['stat4_value'] = '#1'
        variables['stat4_label'] = 'En su categoría'

    elif template_name == 'logo_sting':
        variables['brand'] = prompt or 'C8L'
        variables['tagline'] = f'{user_name} PRESENTS' if user_name else 'AGENCY'

    else:
        # Genérico: usar prompt para la primera variable
        if var_names:
            variables[var_names[0]] = prompt or template_name
            for v in var_names[1:]:
                variables[v] = v.replace('_', ' ').title()

    return variables


# ===========================================================================
# DETECCIÓN DE INTENT (para Zeus)
# ===========================================================================

def is_video_intent(text: str) -> bool:
    """
    Detecta si el texto tiene intención de crear un video.
    Usado por Zeus para enrutar al handler de Hyperframes.
    """
    lower = text.lower()

    # Comandos directos
    if lower.startswith(('/video', '/hf', '/hyperframes')):
        return True

    # Frases que indican video
    video_keywords = [
        'hazme un video', 'crea un video', 'genera un video',
        'quiero un video', 'necesito un video',
        'make a video', 'create a video', 'render video',
        'video de', 'video para', 'video con',
        'animación de', 'animacion de', 'motion graphic',
        'intro para', 'outro para', 'sting de',
        'promo en video', 'clip de', 'render html',
    ]

    return any(kw in lower for kw in video_keywords)


def get_video_prompt_from_text(text: str) -> str:
    """Extrae el prompt de video de un texto natural"""
    lower = text.lower()

    # Remover prefijos conocidos
    prefixes = [
        'hazme un video de', 'hazme un video para', 'hazme un video con',
        'crea un video de', 'crea un video para', 'crea un video con',
        'genera un video de', 'genera un video para',
        'quiero un video de', 'quiero un video para',
        'necesito un video de',
    ]

    for prefix in prefixes:
        if lower.startswith(prefix):
            return text[len(prefix):].strip()

    return text
