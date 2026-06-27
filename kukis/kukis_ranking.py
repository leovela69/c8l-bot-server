# -*- coding: utf-8 -*-
"""
🍪 KUKIS — Sistema de Ranking y Logros
Estadísticas de jugadores, ranking y achievements.
"""
import json
import os
import time
from config import DATA_DIR

KUKIS_RANKING_FILE = os.path.join(DATA_DIR, "kukis_ranking.json")
KUKIS_ACHIEVEMENTS_FILE = os.path.join(DATA_DIR, "kukis_achievements.json")


# ============================================================
# ALMACENAMIENTO (JSON, igual que chess)
# ============================================================

def _load_ranking():
    """Carga datos de ranking."""
    try:
        if os.path.exists(KUKIS_RANKING_FILE):
            with open(KUKIS_RANKING_FILE, 'r') as f:
                return json.load(f)
    except Exception:
        pass
    return {}


def _save_ranking(data):
    """Guarda datos de ranking."""
    os.makedirs(os.path.dirname(KUKIS_RANKING_FILE), exist_ok=True)
    with open(KUKIS_RANKING_FILE, 'w') as f:
        json.dump(data, f, indent=2)


# ============================================================
# ESTADÍSTICAS
# ============================================================

def get_player_stats(user_id):
    """Obtiene stats de un jugador de Kukis."""
    data = _load_ranking()
    uid = str(user_id)
    if uid not in data:
        data[uid] = {
            'name': 'Investigador',
            'cases_resolved': 0,
            'cases_failed': 0,
            'total_chips_won': 0,
            'total_chips_spent': 0,
            'best_case_difficulty': 0,
            'unicorn_uses': 0,
            'synergies_achieved': 0,
            'streak': 0,
            'max_streak': 0,
            'rank_points': 0,
            'last_game': 0,
        }
        _save_ranking(data)
    return data[uid]


def update_after_case(user_id, user_name, won, case_difficulty, chips_won, synergy_used):
    """Actualiza stats después de un caso."""
    data = _load_ranking()
    uid = str(user_id)
    stats = data.get(uid, {
        'name': user_name,
        'cases_resolved': 0,
        'cases_failed': 0,
        'total_chips_won': 0,
        'total_chips_spent': 0,
        'best_case_difficulty': 0,
        'unicorn_uses': 0,
        'synergies_achieved': 0,
        'streak': 0,
        'max_streak': 0,
        'rank_points': 0,
        'last_game': 0,
    })

    stats['name'] = user_name
    stats['total_chips_spent'] += 50  # Coste de investigar
    stats['last_game'] = time.time()

    if won:
        stats['cases_resolved'] += 1
        stats['total_chips_won'] += chips_won
        stats['streak'] += 1
        stats['max_streak'] = max(stats['max_streak'], stats['streak'])
        stats['best_case_difficulty'] = max(stats['best_case_difficulty'], case_difficulty)
        # Puntos de ranking: dificultad * 10 + bonus streak
        points = case_difficulty * 10 + (stats['streak'] * 5)
        stats['rank_points'] += points
    else:
        stats['cases_failed'] += 1
        stats['streak'] = 0

    if synergy_used:
        stats['synergies_achieved'] += 1

    data[uid] = stats
    _save_ranking(data)

    # Verificar logros nuevos
    new_achievements = check_achievements(uid, stats)
    return stats, new_achievements


def record_unicorn_use(user_id):
    """Registra uso de poder unicornio."""
    data = _load_ranking()
    uid = str(user_id)
    if uid in data:
        data[uid]['unicorn_uses'] = data[uid].get('unicorn_uses', 0) + 1
        _save_ranking(data)


# ============================================================
# RANKING
# ============================================================

def get_kukis_ranking(limit=10):
    """Genera texto de ranking top N."""
    data = _load_ranking()
    if not data:
        return (
            "🍪 *RANKING KUKIS*\n\n"
            "No hay investigadores todavía.\n"
            "Sé el primero con /kukis"
        )

    # Ordenar por rank_points
    sorted_players = sorted(
        data.items(),
        key=lambda x: x[1].get('rank_points', 0),
        reverse=True
    )[:limit]

    medals = ['🥇', '🥈', '🥉']
    lines = ["🍪🔍 *RANKING KUKIS — TOP INVESTIGADORES*\n"]

    for i, (uid, stats) in enumerate(sorted_players):
        medal = medals[i] if i < 3 else f"#{i+1}"
        name = stats.get('name', 'Investigador')[:15]
        points = stats.get('rank_points', 0)
        cases = stats.get('cases_resolved', 0)
        streak = stats.get('streak', 0)
        streak_icon = f"🔥{streak}" if streak >= 3 else ""
        lines.append(f"{medal} *{name}* — 🏆{points}pts | 📋{cases} casos {streak_icon}")

    lines.append(f"\n👥 Total investigadores: {len(data)}")
    lines.append("🍪 KUKIS — Agencia de Investigación Dulce")
    return "\n".join(lines)


def get_player_profile(user_id):
    """Perfil completo de un jugador."""
    stats = get_player_stats(user_id)
    total_cases = stats['cases_resolved'] + stats['cases_failed']
    win_rate = (stats['cases_resolved'] / total_cases * 100) if total_cases > 0 else 0

    # Determinar rango
    rank = _get_rank_title(stats['rank_points'])

    profile = (
        f"🍪 *PERFIL DE INVESTIGADOR*\n\n"
        f"👤 {stats['name']}\n"
        f"🏅 Rango: {rank}\n"
        f"🏆 Puntos: {stats['rank_points']}\n\n"
        f"📋 Casos resueltos: {stats['cases_resolved']}\n"
        f"❌ Casos fallidos: {stats['cases_failed']}\n"
        f"📊 Win rate: {win_rate:.0f}%\n"
        f"🔥 Racha actual: {stats['streak']}\n"
        f"⚡ Mejor racha: {stats['max_streak']}\n"
        f"⭐ Mejor dificultad: {stats['best_case_difficulty']}/8\n\n"
        f"💰 Chips ganados: {stats['total_chips_won']}\n"
        f"💸 Chips gastados: {stats['total_chips_spent']}\n"
        f"🦄 Usos unicornio: {stats['unicorn_uses']}\n"
        f"🌈 Sinergias logradas: {stats['synergies_achieved']}"
    )
    return profile


def _get_rank_title(points):
    """Determina título de rango por puntos."""
    if points >= 5000:
        return "🦄 Unicornio Legendario"
    elif points >= 3000:
        return "👑 Gran Detective Dulce"
    elif points >= 1500:
        return "⭐ Detective Experto"
    elif points >= 750:
        return "🔍 Investigador Senior"
    elif points >= 300:
        return "🍪 Investigador"
    elif points >= 100:
        return "🧁 Aprendiz de Detective"
    else:
        return "🍬 Novato Dulce"


# ============================================================
# LOGROS
# ============================================================

KUKIS_ACHIEVEMENTS = {
    'primer_caso': {
        'name': 'Primera Investigación',
        'icon': '🔍',
        'coins': 100,
        'req': lambda s: s['cases_resolved'] >= 1
    },
    'casos_5': {
        'name': 'Detective Junior',
        'icon': '🕵️',
        'coins': 200,
        'req': lambda s: s['cases_resolved'] >= 5
    },
    'casos_20': {
        'name': 'Detective Senior',
        'icon': '🏆',
        'coins': 500,
        'req': lambda s: s['cases_resolved'] >= 20
    },
    'casos_50': {
        'name': 'Leyenda de la Agencia',
        'icon': '🦄',
        'coins': 1000,
        'req': lambda s: s['cases_resolved'] >= 50
    },
    'racha_3': {
        'name': 'Racha Dulce',
        'icon': '🔥',
        'coins': 150,
        'req': lambda s: s['max_streak'] >= 3
    },
    'racha_7': {
        'name': 'Imparable',
        'icon': '⚡',
        'coins': 400,
        'req': lambda s: s['max_streak'] >= 7
    },
    'racha_15': {
        'name': 'Invencible',
        'icon': '💎',
        'coins': 1000,
        'req': lambda s: s['max_streak'] >= 15
    },
    'dificultad_5': {
        'name': 'Caso Difícil',
        'icon': '⭐',
        'coins': 300,
        'req': lambda s: s['best_case_difficulty'] >= 5
    },
    'dificultad_8': {
        'name': 'Caso Imposible',
        'icon': '🌟',
        'coins': 750,
        'req': lambda s: s['best_case_difficulty'] >= 8
    },
    'sinergia_5': {
        'name': 'Maestro de Sinergias',
        'icon': '🌈',
        'coins': 300,
        'req': lambda s: s['synergies_achieved'] >= 5
    },
    'sinergia_20': {
        'name': 'Arcoíris Perfecto',
        'icon': '✨',
        'coins': 600,
        'req': lambda s: s['synergies_achieved'] >= 20
    },
    'unicornio_10': {
        'name': 'Domador de Unicornios',
        'icon': '🦄',
        'coins': 250,
        'req': lambda s: s.get('unicorn_uses', 0) >= 10
    },
    'chips_5000': {
        'name': 'Millonario Dulce',
        'icon': '💰',
        'coins': 500,
        'req': lambda s: s['total_chips_won'] >= 5000
    },
}


def check_achievements(user_id, stats):
    """Verifica logros nuevos desbloqueados."""
    try:
        if os.path.exists(KUKIS_ACHIEVEMENTS_FILE):
            with open(KUKIS_ACHIEVEMENTS_FILE, 'r') as f:
                all_ach = json.load(f)
        else:
            all_ach = {}
    except Exception:
        all_ach = {}

    uid = str(user_id)
    user_ach = all_ach.get(uid, [])
    new_unlocked = []

    for key, ach in KUKIS_ACHIEVEMENTS.items():
        if key not in user_ach and ach['req'](stats):
            user_ach.append(key)
            new_unlocked.append(ach)

    if new_unlocked:
        all_ach[uid] = user_ach
        os.makedirs(os.path.dirname(KUKIS_ACHIEVEMENTS_FILE), exist_ok=True)
        with open(KUKIS_ACHIEVEMENTS_FILE, 'w') as f:
            json.dump(all_ach, f, indent=2)

    return new_unlocked
