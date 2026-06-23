# -*- coding: utf-8 -*-
"""
C8L Chess Master — Sistema de ELO y Ranking
"""
import json
import os
import time
from config import DATA_DIR

RANKING_FILE = os.path.join(DATA_DIR, "chess_ranking.json")
ACHIEVEMENTS_FILE = os.path.join(DATA_DIR, "chess_achievements.json")

# ELO Calculation
def calculate_elo(rating_a, rating_b, result, k_factor=32):
    """Calcula nuevo ELO. result: 1=win, 0=loss, 0.5=draw"""
    expected_a = 1 / (1 + 10 ** ((rating_b - rating_a) / 400))
    new_a = rating_a + k_factor * (result - expected_a)
    new_b = rating_b + k_factor * ((1 - result) - (1 - expected_a))
    return round(new_a), round(new_b)


# Ranking storage (JSON-based for now)
def _load_ranking():
    try:
        if os.path.exists(RANKING_FILE):
            with open(RANKING_FILE, 'r') as f:
                return json.load(f)
    except:
        pass
    return {}


def _save_ranking(data):
    os.makedirs(os.path.dirname(RANKING_FILE), exist_ok=True)
    with open(RANKING_FILE, 'w') as f:
        json.dump(data, f, indent=2)


def get_player_stats(user_id):
    """Obtiene stats de un jugador."""
    data = _load_ranking()
    uid = str(user_id)
    if uid not in data:
        data[uid] = {
            'elo': 1200, 'peak': 1200, 'wins': 0, 'losses': 0,
            'draws': 0, 'streak': 0, 'max_streak': 0, 'games': 0,
            'name': 'Jugador', 'last_game': 0
        }
        _save_ranking(data)
    return data[uid]


def update_after_game(user_id, user_name, result, ai_level):
    """Actualiza stats despues de una partida vs IA."""
    data = _load_ranking()
    uid = str(user_id)
    stats = data.get(uid, {
        'elo': 1200, 'peak': 1200, 'wins': 0, 'losses': 0,
        'draws': 0, 'streak': 0, 'max_streak': 0, 'games': 0,
        'name': user_name, 'last_game': 0
    })

    # ELO de la IA segun nivel
    ai_elos = {1: 800, 2: 1000, 3: 1200, 4: 1500, 5: 1800, 6: 2200}
    ai_elo = ai_elos.get(ai_level, 1200)

    # Calcular nuevo ELO
    if result == 'win':
        r = 1
        stats['wins'] += 1
        stats['streak'] += 1
        stats['max_streak'] = max(stats['max_streak'], stats['streak'])
    elif result == 'loss':
        r = 0
        stats['losses'] += 1
        stats['streak'] = 0
    else:
        r = 0.5
        stats['draws'] += 1

    new_elo, _ = calculate_elo(stats['elo'], ai_elo, r)
    stats['elo'] = max(100, new_elo)  # Min ELO 100
    stats['peak'] = max(stats['peak'], stats['elo'])
    stats['games'] += 1
    stats['name'] = user_name
    stats['last_game'] = time.time()

    data[uid] = stats
    _save_ranking(data)

    # Check achievements
    new_achievements = check_achievements(uid, stats)

    return stats, new_achievements


def get_ranking_text(limit=10):
    """Genera texto de ranking top N."""
    data = _load_ranking()
    if not data:
        return "🏆 *Ranking C8L Chess*\n\nNo hay jugadores todavia. Se el primero con /ajedrez"

    # Ordenar por ELO
    sorted_players = sorted(data.items(), key=lambda x: x[1].get('elo', 0), reverse=True)[:limit]

    medals = ['🥇', '🥈', '🥉']
    lines = ["🏆 *RANKING C8L CHESS MASTER*\n"]

    for i, (uid, stats) in enumerate(sorted_players):
        medal = medals[i] if i < 3 else f"#{i+1}"
        name = stats.get('name', 'Jugador')[:15]
        elo = stats.get('elo', 1200)
        wins = stats.get('wins', 0)
        streak = stats.get('streak', 0)
        streak_icon = f"🔥{streak}" if streak >= 3 else ""
        lines.append(f"{medal} *{name}* — ELO: {elo} | W:{wins} {streak_icon}")

    lines.append(f"\nTotal jugadores: {len(data)}")
    lines.append("🤖 C8L Chess Master")
    return "\n".join(lines)


# Achievements
ACHIEVEMENTS = {
    'first_win': {'name': 'Primera Victoria', 'icon': '🏆', 'coins': 100, 'req': lambda s: s['wins'] >= 1},
    'win_10': {'name': 'Aprendiz', 'icon': '⭐', 'coins': 200, 'req': lambda s: s['wins'] >= 10},
    'win_50': {'name': 'Experto', 'icon': '🌟', 'coins': 500, 'req': lambda s: s['wins'] >= 50},
    'streak_5': {'name': 'Racha x5', 'icon': '🔥', 'coins': 300, 'req': lambda s: s['max_streak'] >= 5},
    'streak_10': {'name': 'Racha x10', 'icon': '⚡', 'coins': 500, 'req': lambda s: s['max_streak'] >= 10},
    'elo_1500': {'name': 'Maestro', 'icon': '👑', 'coins': 500, 'req': lambda s: s['elo'] >= 1500},
    'elo_2000': {'name': 'Gran Maestro', 'icon': '💎', 'coins': 1000, 'req': lambda s: s['elo'] >= 2000},
    'games_100': {'name': 'Veterano', 'icon': '🎖️', 'coins': 300, 'req': lambda s: s['games'] >= 100},
}


def check_achievements(user_id, stats):
    """Verifica logros nuevos."""
    try:
        if os.path.exists(ACHIEVEMENTS_FILE):
            with open(ACHIEVEMENTS_FILE, 'r') as f:
                all_ach = json.load(f)
        else:
            all_ach = {}
    except:
        all_ach = {}

    uid = str(user_id)
    user_ach = all_ach.get(uid, [])
    new_unlocked = []

    for key, ach in ACHIEVEMENTS.items():
        if key not in user_ach and ach['req'](stats):
            user_ach.append(key)
            new_unlocked.append(ach)

    if new_unlocked:
        all_ach[uid] = user_ach
        os.makedirs(os.path.dirname(ACHIEVEMENTS_FILE), exist_ok=True)
        with open(ACHIEVEMENTS_FILE, 'w') as f:
            json.dump(all_ach, f, indent=2)

    return new_unlocked
