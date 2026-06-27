# -*- coding: utf-8 -*-
"""
🍪 KUKIS — Juego de Cartas de Investigación Dulce
C8L Casino Module

Un juego de cartas único que fusiona galletas de chocolate,
chuches, unicornios y resolución de misterios.
"""
from kukis.kukis_game import KukisGame, start_game, get_game, end_game
from kukis.kukis_cards import KUKIS_CARDS, get_random_hand
from kukis.kukis_cases import KUKIS_CASES, get_random_case
from kukis.kukis_ranking import get_kukis_ranking, update_after_case
