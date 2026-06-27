# -*- coding: utf-8 -*-
"""
🍪 KUKIS — Base de Datos de Cartas
Tres tipos: Personajes, Objetos, Eventos
Cada carta tiene poder, habilidad y tipo.
"""
import random

# ============================================================
# 🦄 PERSONAJES — Aportan poder de investigación
# ============================================================
PERSONAJES = [
    {
        'id': 'uni-detective',
        'name': 'Unicornio Detective',
        'emoji': '🦄',
        'type': 'Personaje',
        'power': 8,
        'ability': 'Doble pista',
        'desc': 'El investigador estrella de la agencia. Su cuerno brilla cuando detecta mentiras.'
    },
    {
        'id': 'galletita-agente',
        'name': 'Galletita Agente',
        'emoji': '🍪',
        'type': 'Personaje',
        'power': 6,
        'ability': 'Rastrear migas',
        'desc': 'Experta en seguir rastros. Donde hay migas, hay culpable.'
    },
    {
        'id': 'choco-magnum',
        'name': 'Choco Magnum',
        'emoji': '🍫',
        'type': 'Personaje',
        'power': 7,
        'ability': 'Derretir pistas',
        'desc': 'Imponente y misterioso. Derrite las defensas de cualquier sospechoso.'
    },
    {
        'id': 'nube-algodon',
        'name': 'Nube de Algodón',
        'emoji': '☁️',
        'type': 'Personaje',
        'power': 4,
        'ability': 'Flotar sobre obstáculos',
        'desc': 'Ligera y etérea. Puede infiltrarse en cualquier lugar sin ser detectada.'
    },
    {
        'id': 'piruleta-forense',
        'name': 'Piruleta Forense',
        'emoji': '🍭',
        'type': 'Personaje',
        'power': 5,
        'ability': 'Analizar dulces',
        'desc': 'Científica del azúcar. Identifica cualquier ingrediente con un solo lamido.'
    },
    {
        'id': 'muffin-misterioso',
        'name': 'Muffin Misterioso',
        'emoji': '🧁',
        'type': 'Personaje',
        'power': 6,
        'ability': 'Hornear soluciones',
        'desc': 'Bajo su cobertura esponjosa se esconde una mente brillante.'
    },
    {
        'id': 'donut-oscuro',
        'name': 'Donut Oscuro',
        'emoji': '🍩',
        'type': 'Personaje',
        'power': 7,
        'ability': 'Agujero dimensional',
        'desc': 'Su agujero central es un portal a dimensiones ocultas de información.'
    },
    {
        'id': 'caramelo-espia',
        'name': 'Caramelo Espía',
        'emoji': '🍬',
        'type': 'Personaje',
        'power': 5,
        'ability': 'Disfraz dulce',
        'desc': 'Puede adoptar cualquier forma. Nadie sospecha de un caramelo.'
    },
]

# ============================================================
# 🔍 OBJETOS — Herramientas para encontrar pistas
# ============================================================
OBJETOS = [
    {
        'id': 'lupa-caramelo',
        'name': 'Lupa de Caramelo',
        'emoji': '🔍',
        'type': 'Objeto',
        'power': 4,
        'ability': 'Amplificar pistas',
        'desc': 'Aumenta la visibilidad de las pistas ocultas entre los dulces.'
    },
    {
        'id': 'libro-recetas',
        'name': 'Libro de Recetas',
        'emoji': '📖',
        'type': 'Objeto',
        'power': 5,
        'ability': 'Conocimiento antiguo',
        'desc': 'Contiene recetas ancestrales... y secretos mortales entre sus páginas.'
    },
    {
        'id': 'pocion-arcoiris',
        'name': 'Poción Arcoíris',
        'emoji': '🌈',
        'type': 'Objeto',
        'power': 7,
        'ability': 'Revelar verdades',
        'desc': 'Al rociarla, revela huellas invisibles y mensajes ocultos.'
    },
    {
        'id': 'caja-galletas',
        'name': 'Caja de Galletas',
        'emoji': '🎁',
        'type': 'Objeto',
        'power': 3,
        'ability': 'Contiene sorpresas',
        'desc': 'Nunca se sabe qué encontrarás dentro. A veces pistas, a veces trampas.'
    },
    {
        'id': 'cinta-regaliz',
        'name': 'Cinta de Regaliz',
        'emoji': '🎀',
        'type': 'Objeto',
        'power': 2,
        'ability': 'Asegurar evidencias',
        'desc': 'Perfecta para sellar escenas del crimen y atar sospechosos.'
    },
    {
        'id': 'camara-fresa',
        'name': 'Cámara de Fresa',
        'emoji': '📸',
        'type': 'Objeto',
        'power': 4,
        'ability': 'Capturar momentos',
        'desc': 'Fotografía con aroma a fresa. Las fotos revelan lo invisible.'
    },
    {
        'id': 'brujula-miel',
        'name': 'Brújula de Miel',
        'emoji': '🧭',
        'type': 'Objeto',
        'power': 6,
        'ability': 'Señalar culpable',
        'desc': 'Su aguja dorada siempre apunta al más dulce... o al más culpable.'
    },
    {
        'id': 'walkie-chicle',
        'name': 'Walkie de Chicle',
        'emoji': '📻',
        'type': 'Objeto',
        'power': 3,
        'ability': 'Comunicar pistas',
        'desc': 'Permite comunicarse con otros investigadores en la distancia.'
    },
]

# ============================================================
# ⚡ EVENTOS — Ataques y defensas en combate
# ============================================================
EVENTOS = [
    {
        'id': 'explosion-choco',
        'name': 'Explosión de Chocolate',
        'emoji': '💥',
        'type': 'Evento',
        'power': 9,
        'ability': 'Daño masivo dulce',
        'desc': 'Una erupción de chocolate fundido que arrasa con todo a su paso.'
    },
    {
        'id': 'lluvia-chuches',
        'name': 'Lluvia de Chuches',
        'emoji': '🌧️',
        'type': 'Evento',
        'power': 6,
        'ability': 'Curar aliados',
        'desc': 'Del cielo caen gominolas curativas que restauran la energía.'
    },
    {
        'id': 'tornado-azucar',
        'name': 'Tornado de Azúcar',
        'emoji': '🌪️',
        'type': 'Evento',
        'power': 8,
        'ability': 'Desordenar enemigos',
        'desc': 'Un torbellino de azúcar glass que confunde y aturde a los villanos.'
    },
    {
        'id': 'escudo-gominola',
        'name': 'Escudo de Gominola',
        'emoji': '🛡️',
        'type': 'Evento',
        'power': 5,
        'ability': 'Protección dulce',
        'desc': 'Una barrera elástica de gominola que absorbe cualquier ataque.'
    },
    {
        'id': 'portal-galletas',
        'name': 'Portal de Galletas',
        'emoji': '🌀',
        'type': 'Evento',
        'power': 7,
        'ability': 'Teletransporte',
        'desc': 'Abre un portal entre dos puntos. Ideal para emboscadas sorpresa.'
    },
    {
        'id': 'furia-unicornio',
        'name': 'Furia de Unicornio',
        'emoji': '🦄',
        'type': 'Evento',
        'power': 10,
        'ability': 'Ataque legendario',
        'desc': 'El poder máximo. Un rayo arcoíris devastador que destruye todo.'
    },
    {
        'id': 'trampa-caramelo',
        'name': 'Trampa de Caramelo',
        'emoji': '🪤',
        'type': 'Evento',
        'power': 4,
        'ability': 'Capturar villano',
        'desc': 'Un caramelo irresistible que atrapa al villano que lo toca.'
    },
    {
        'id': 'invocacion-helado',
        'name': 'Invocación Helada',
        'emoji': '🍦',
        'type': 'Evento',
        'power': 6,
        'ability': 'Congelar enemigo',
        'desc': 'Congela al villano en un bloque de helado de vainilla.'
    },
]

# ============================================================
# TODAS LAS CARTAS
# ============================================================
KUKIS_CARDS = PERSONAJES + OBJETOS + EVENTOS


def get_random_hand(cantidad=6):
    """Reparte una mano aleatoria de cartas."""
    shuffled = random.sample(KUKIS_CARDS, min(cantidad, len(KUKIS_CARDS)))
    return [dict(card, instance_id=f"{card['id']}-{random.randint(1000,9999)}") for card in shuffled]


def get_card_display(card):
    """Muestra una carta formateada para Telegram."""
    return (
        f"{card['emoji']} *{card['name']}*\n"
        f"   Tipo: {card['type']} | ⚡Poder: {card['power']}\n"
        f"   🎯 {card['ability']}"
    )


def get_hand_display(hand):
    """Muestra la mano completa formateada."""
    if not hand:
        return "🃏 Tu mano está vacía"
    lines = ["🃏 *TU MANO DE INVESTIGADOR:*\n"]
    for i, card in enumerate(hand, 1):
        lines.append(f"  {i}. {card['emoji']} {card['name']} (⚡{card['power']} | {card['ability']})")
    lines.append(f"\n📊 Cartas: {len(hand)} | Poder total disponible: {sum(c['power'] for c in hand)}")
    return "\n".join(lines)


def get_card_by_index(hand, index):
    """Obtiene carta de la mano por número (1-based)."""
    if 1 <= index <= len(hand):
        return hand[index - 1]
    return None
