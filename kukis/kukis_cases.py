# -*- coding: utf-8 -*-
"""
🍪 KUKIS — Casos de Investigación
Cada caso tiene dificultad, recompensa y un villano.
"""
import random

KUKIS_CASES = [
    {
        'id': 1,
        'name': 'El Misterio de las Galletas Desaparecidas',
        'emoji': '🍪',
        'desc': 'Las galletas de chocolate han desaparecido de la fábrica. '
                'Todos los empleados son sospechosos. Hay migas en el almacén...',
        'difficulty': 3,
        'reward': 200,
        'villain': 'Ladrón de Migas',
        'villain_emoji': '🦹',
        'villain_power': 9,
    },
    {
        'id': 2,
        'name': 'Secuestro en el Reino de las Chuches',
        'emoji': '🏰',
        'desc': 'El príncipe Malvavisco ha sido secuestrado. '
                'Hay huellas de azúcar glas por todo el castillo y un olor a regaliz...',
        'difficulty': 4,
        'reward': 350,
        'villain': 'Bruja de Regaliz',
        'villain_emoji': '🧙‍♀️',
        'villain_power': 12,
    },
    {
        'id': 3,
        'name': 'El Pastel Envenenado',
        'emoji': '🎂',
        'desc': 'Alguien ha puesto un ingrediente secreto en el pastel real. '
                'Los invitados al banquete están en peligro. El tiempo se acaba...',
        'difficulty': 5,
        'reward': 500,
        'villain': 'Chef Oscuro',
        'villain_emoji': '👨‍🍳',
        'villain_power': 15,
    },
    {
        'id': 4,
        'name': 'La Maldición del Unicornio de Chocolate',
        'emoji': '🦄',
        'desc': 'Un unicornio de chocolate blanco ha sido maldecido y ahora es de '
                'chocolate negro amargo. Hay que romper el hechizo antes del amanecer...',
        'difficulty': 6,
        'reward': 750,
        'villain': 'Hechicero Amargo',
        'villain_emoji': '🧙',
        'villain_power': 18,
    },
    {
        'id': 5,
        'name': 'Robo en el Banco de Caramelos',
        'emoji': '🏦',
        'desc': 'El banco más dulce del reino ha sido asaltado durante la noche. '
                'Los testigos hablan de una figura de caramelo derretido...',
        'difficulty': 7,
        'reward': 1000,
        'villain': 'Banda del Fondant',
        'villain_emoji': '👥',
        'villain_power': 21,
    },
    {
        'id': 6,
        'name': 'El Fantasma de la Fábrica de Chicles',
        'emoji': '👻',
        'desc': 'Apariciones nocturnas en la fábrica de chicles. Las máquinas se '
                'activan solas y producen chicles de sabor... ¿miedo?',
        'difficulty': 5,
        'reward': 600,
        'villain': 'Fantasma Chicle',
        'villain_emoji': '👻',
        'villain_power': 15,
    },
    {
        'id': 7,
        'name': 'Sabotaje en la Competición de Pasteles',
        'emoji': '🏆',
        'desc': 'Alguien está saboteando la gran competición anual de pasteles. '
                'Los hornos explotan y las recetas desaparecen misteriosamente...',
        'difficulty': 4,
        'reward': 400,
        'villain': 'Pastelero Envidioso',
        'villain_emoji': '😈',
        'villain_power': 12,
    },
    {
        'id': 8,
        'name': 'La Isla de los Dulces Prohibidos',
        'emoji': '🏝️',
        'desc': 'Una isla misteriosa donde se fabrican dulces ilegales ha aparecido '
                'en el mapa. Hay que infiltrarse y desmantelar la operación...',
        'difficulty': 8,
        'reward': 1500,
        'villain': 'Barón del Azúcar',
        'villain_emoji': '🎩',
        'villain_power': 24,
    },
]


def get_random_case():
    """Obtiene un caso aleatorio."""
    return random.choice(KUKIS_CASES)


def get_case_display(case):
    """Muestra un caso formateado para Telegram."""
    stars = '⭐' * case['difficulty']
    return (
        f"📋 *CASO #{case['id']}: {case['name']}* {case['emoji']}\n\n"
        f"📝 {case['desc']}\n\n"
        f"⚔️ Villano: {case['villain_emoji']} *{case['villain']}* (Poder: {case['villain_power']})\n"
        f"🎯 Dificultad: {stars} ({case['difficulty']}/8)\n"
        f"🍪 Recompensa: {case['reward']} Chips\n"
        f"💡 Necesitas poder ≥ {case['difficulty'] * 3} para resolver"
    )


def get_case_by_id(case_id):
    """Obtiene caso por ID."""
    for case in KUKIS_CASES:
        if case['id'] == case_id:
            return case
    return None
