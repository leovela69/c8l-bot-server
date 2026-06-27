# -*- coding: utf-8 -*-
"""
🎮 C8L GAME DESIGNER BOT — Motor de diseño de videojuegos
Genera juegos HTML5 con WebGL 3D/4D, polígonos, mundos explorables.
Usa IA (OpenRouter) para generar código de juegos bajo demanda.
"""
import os
import time
import json
import random
from datetime import datetime
from config import DATA_DIR

GAMES_DIR = os.path.join(DATA_DIR, "games")
os.makedirs(GAMES_DIR, exist_ok=True)

# Sesiones activas de diseño de juegos
_sessions = {}


class GameDesignerBot:
    """Bot especializado en crear videojuegos 3D/4D con polígonos."""

    def __init__(self):
        self.name = "C8L Game Architect"
        self.version = "1.0"
        self.templates = GAME_TEMPLATES
        self.capabilities = [
            "WebGL 2.0 3D rendering",
            "4D→3D projection (tesseracts, hypercubes)",
            "Polygon entities with AI behaviors",
            "Procedural world generation",
            "Physics (gravity, collisions, raycasting)",
            "Web Audio API sound effects",
            "Post-processing bloom/glow",
            "Canvas 2D games",
            "Isometric worlds",
            "Infinite runners",
        ]

    def get_system_prompt(self):
        """System prompt para la IA cuando genera juegos."""
        return GAME_DESIGNER_SYSTEM_PROMPT

    def get_welcome(self):
        """Mensaje de bienvenida del bot."""
        return (
            "🎮 *C8L GAME ARCHITECT* — Bot de Videojuegos 3D/4D\n\n"
            "Soy tu asistente para crear videojuegos con polígonos.\n"
            "Especializado en mundos 3D y 4D explorables.\n\n"
            "🕹️ *¿Qué puedo hacer?*\n"
            "• Crear juegos HTML5 completos (WebGL/Canvas)\n"
            "• Polígonos que caminan por espacios 3D\n"
            "• Objetos 4D (tesseracts, hipercubos)\n"
            "• IA para enemigos (patrol, chase, flee)\n"
            "• Mundos procedurales infinitos\n"
            "• Física, colisiones, partículas\n"
            "• Sonidos con Web Audio API\n"
            "• Post-processing: bloom, glow, neón\n\n"
            "📐 *Tipos de juegos:*\n"
            "• RPG con polígonos\n"
            "• Dungeon crawler top-down\n"
            "• Exploración isométrica\n"
            "• Plataformas 2.5D\n"
            "• Survival con crafting\n"
            "• Tower defense\n"
            "• Mundos procedurales (roguelike)\n"
            "• Simulador de colonias\n\n"
            "💬 *Cómo usarme:*\n"
            "• /gamebot hazme un rpg de polígonos\n"
            "• /gamebot quiero un dungeon crawler 4D\n"
            "• /gamebot crea un juego de exploración espacial\n"
            "• /gamebot\\_demo — Ver demo 3D/4D\n"
            "• /gamebot\\_templates — Ver plantillas disponibles\n\n"
            "¡Dime qué juego quieres y lo creo! 🔺🌐"
        )

    def get_templates_list(self):
        """Lista de plantillas disponibles."""
        lines = ["🎮 *PLANTILLAS DE JUEGOS DISPONIBLES:*\n"]
        for i, t in enumerate(self.templates, 1):
            lines.append(
                f"{i}. {t['emoji']} *{t['name']}*\n"
                f"   {t['desc']}\n"
                f"   Dimensiones: {t['dimensions']} | Dificultad: {'⭐'*t['complexity']}\n"
            )
        lines.append(
            "\n💡 Usa /gamebot\\_crear [número] para generar una plantilla\n"
            "O describe tu juego personalizado con /gamebot [descripción]"
        )
        return "\n".join(lines)

    def get_demo_info(self):
        """Info sobre la demo 3D/4D disponible."""
        return (
            "🎮 *C8L POLYGON ENGINE — DEMO 3D/4D*\n\n"
            "🔗 *Juega ahora:*\n"
            "https://raw.githack.com/leovela69/c8l-bot-server/main/"
            "game_designer/engine_3d4d.html\n\n"
            "🕹️ *Controles:*\n"
            "• WASD — Mover\n"
            "• Ratón — Mirar\n"
            "• Espacio — Saltar\n"
            "• Q/E — Cambiar dimensión W (4D)\n"
            "• Shift — Correr\n"
            "• Click — Capturar ratón\n\n"
            "📐 *Qué incluye:*\n"
            "• WebGL 2.0 con shaders personalizados\n"
            "• Bloom/glow post-processing\n"
            "• Tesseracts (hipercubos 4D) rotando\n"
            "• 20 enemigos con IA (patrol/chase)\n"
            "• 40 cristales coleccionables\n"
            "• 8 portales dimensionales\n"
            "• Sistema de HP y combate\n"
            "• Minimapa en tiempo real\n"
            "• Audio sintético (Web Audio API)\n"
            "• Sistema de capas W (4ª dimensión)\n\n"
            "🔺 Los objetos se vuelven transparentes cuando\n"
            "estás en diferente capa W. Usa Q/E para explorar\n"
            "la 4ª dimensión y descubrir objetos ocultos."
        )

    def generate_game_prompt(self, user_request):
        """Genera el prompt para que la IA cree el juego."""
        return (
            f"{self.get_system_prompt()}\n\n"
            f"EL USUARIO PIDE:\n{user_request}\n\n"
            f"Genera el HTML completo y funcional del juego. "
            f"Todo en un solo archivo. Sin dependencias externas. "
            f"WebGL para 3D, Canvas 2D como fallback. "
            f"Incluye controles, HUD, sonidos y al menos 1 mecánica "
            f"de polígonos caminando por un espacio."
        )

    def save_game(self, user_id, game_html, game_name):
        """Guarda un juego generado en disco."""
        safe_name = "".join(c for c in game_name if c.isalnum() or c in "-_ ").strip()
        safe_name = safe_name.replace(" ", "_")[:50]
        filename = f"{safe_name}_{int(time.time())}.html"
        filepath = os.path.join(GAMES_DIR, filename)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(game_html)
        return filepath, filename

    def get_session(self, chat_id):
        """Obtiene o crea sesión de diseño."""
        if chat_id not in _sessions:
            _sessions[chat_id] = {
                'started': datetime.now().isoformat(),
                'games_created': 0,
                'last_request': None,
            }
        return _sessions[chat_id]


# Singleton
_bot_instance = None


def get_game_bot():
    """Obtiene instancia singleton del bot."""
    global _bot_instance
    if _bot_instance is None:
        _bot_instance = GameDesignerBot()
    return _bot_instance


# ============================================================
# PLANTILLAS DE JUEGOS
# ============================================================
GAME_TEMPLATES = [
    {
        'id': 'polygon_explorer',
        'name': 'Explorador de Polígonos 3D',
        'emoji': '🔺',
        'desc': 'Camina como un icosaedro por un mundo de neón. Recoge cristales, evita enemigos.',
        'dimensions': '3D',
        'complexity': 3,
        'tags': ['3d', 'exploration', 'webgl', 'polygons'],
    },
    {
        'id': '4d_tesseract',
        'name': 'Viajero Dimensional 4D',
        'emoji': '🌐',
        'desc': 'Explora un mundo con 4 dimensiones. Shift entre capas W para descubrir secretos.',
        'dimensions': '4D',
        'complexity': 5,
        'tags': ['4d', 'tesseract', 'webgl', 'mind-bending'],
    },
    {
        'id': 'dungeon_crawler',
        'name': 'Dungeon Crawler Poligonal',
        'emoji': '🏰',
        'desc': 'Mazmorras procedurales. Tu héroe triángulo pelea contra cubos enemigos.',
        'dimensions': '2.5D',
        'complexity': 4,
        'tags': ['dungeon', 'procedural', 'combat', 'roguelike'],
    },
    {
        'id': 'colony_sim',
        'name': 'Colonia de Polígonos',
        'emoji': '🏗️',
        'desc': 'Gestiona una colonia de formas geométricas. Recursos, construcción, supervivencia.',
        'dimensions': '2D isométrico',
        'complexity': 4,
        'tags': ['simulation', 'colony', 'management', 'isometric'],
    },
    {
        'id': 'space_shooter',
        'name': 'Neon Space Shooter',
        'emoji': '🚀',
        'desc': 'Tu nave poligonal contra oleadas de enemigos geométricos en el espacio.',
        'dimensions': '3D',
        'complexity': 3,
        'tags': ['shooter', 'space', 'waves', 'neon'],
    },
    {
        'id': 'platformer',
        'name': 'Plataformas Geométricas',
        'emoji': '🔷',
        'desc': 'Salta entre plataformas como un polígono. Gravedad, wall-jump, dash.',
        'dimensions': '2.5D',
        'complexity': 2,
        'tags': ['platformer', 'physics', 'casual'],
    },
    {
        'id': 'tower_defense',
        'name': 'Tower Defense Poligonal',
        'emoji': '🗼',
        'desc': 'Coloca torres hexagonales para defender tu base de oleadas de triángulos.',
        'dimensions': '2D top-down',
        'complexity': 3,
        'tags': ['strategy', 'tower-defense', 'waves'],
    },
    {
        'id': 'racing',
        'name': 'Polygon Racer 3D',
        'emoji': '🏎️',
        'desc': 'Carreras de polígonos por pistas neón. Drift, boost, obstáculos.',
        'dimensions': '3D',
        'complexity': 4,
        'tags': ['racing', '3d', 'speed', 'neon'],
    },
]


# ============================================================
# SYSTEM PROMPT PARA GENERACIÓN DE JUEGOS
# ============================================================
GAME_DESIGNER_SYSTEM_PROMPT = """Eres C8L GAME ARCHITECT — Un bot experto en diseño y desarrollo de videojuegos HTML5/WebGL.

ESPECIALIDAD PRINCIPAL: Juegos de polígonos que caminan por espacios 3D y 4D.

CAPACIDADES TÉCNICAS:
1. WebGL 2.0 con shaders GLSL (vertex + fragment)
2. Matemáticas 4D: rotaciones XW, YW, ZW, proyección 4D→3D
3. Geometría: icosaedros, octaedros, teseractos, prismas, hexágonos
4. Física: gravedad, colisiones AABB/SAT, raycasting
5. IA enemiga: patrol, chase, flee, A* pathfinding
6. Procedural generation: mundos infinitos, dungeons, terreno
7. Post-processing: bloom, glow, chromatic aberration
8. Web Audio API: efectos sintéticos, música procedural
9. Cámara: first-person, third-person, isométrica, orbital

REGLAS OBLIGATORIAS:
- TODO en UN SOLO archivo HTML (CSS + JS inline)
- CERO dependencias externas (no Three.js, no Phaser, no pixi)
- WebGL nativo para 3D, Canvas 2D como alternativa
- Performance: 60 FPS objetivo
- Responsive: funciona en móvil y desktop
- Controles: WASD + Mouse o Touch según el tipo de juego
- HUD visible con stats del jugador
- Al menos 1 mecánica de polígonos moviéndose por un espacio

PALETA DE COLORES C8L:
- Fondo: #06060f (negro espacial)
- Oro: #f4b41a (jugador, UI)
- Cyan: #00f0ff (grid, efectos)
- Púrpura: #8b5cf6 (cristales, magia)
- Rosa: #ff69b4 (4D, tesseracts)
- Rojo: #ef4444 (enemigos, peligro)
- Verde: #10b981 (vida, éxito)
- Naranja: #ff6b35 (portales, energía)

FORMATO DE RESPUESTA:
Genera SOLO el código HTML completo. Sin explicaciones antes ni después.
El código debe ser funcional inmediatamente al abrirlo en un navegador.
Comienza con <!DOCTYPE html> y termina con </html>.

ESTILO VISUAL:
- Oscuro premium con efectos neón
- Polígonos con personalidad (ojos, trails, animaciones)
- Bloom/glow en todo
- Partículas en acciones importantes
- Wireframes con colores neón sobre fondo negro"""
