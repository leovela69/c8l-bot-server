# -*- coding: utf-8 -*-
"""
💰 CRYPTO SKILL — Precios de Criptomonedas (100% Gratuito)
============================================================
API: CoinGecko (sin API key, 10-30 calls/min gratis)
"""

import requests
import logging
from typing import Dict, Optional, List

logger = logging.getLogger("c8l.skills.crypto")


class CryptoSkill:
    """Skill de criptomonedas usando CoinGecko API gratuita."""

    BASE_URL = "https://api.coingecko.com/api/v3"

    # Alias comunes
    ALIASES = {
        "btc": "bitcoin", "bitcoin": "bitcoin",
        "eth": "ethereum", "ethereum": "ethereum",
        "sol": "solana", "solana": "solana",
        "ada": "cardano", "cardano": "cardano",
        "xrp": "ripple", "ripple": "ripple",
        "doge": "dogecoin", "dogecoin": "dogecoin",
        "dot": "polkadot", "polkadot": "polkadot",
        "bnb": "binancecoin", "binance": "binancecoin",
        "matic": "matic-network", "polygon": "matic-network",
        "avax": "avalanche-2", "avalanche": "avalanche-2",
        "link": "chainlink", "chainlink": "chainlink",
        "uni": "uniswap", "uniswap": "uniswap",
        "shib": "shiba-inu", "shiba": "shiba-inu",
        "pepe": "pepe",
    }

    def __init__(self):
        self.query_count = 0

    def get_price(self, crypto: str, currency: str = "usd") -> Optional[str]:
        """
        Obtiene precio actual de una criptomoneda.

        Args:
            crypto: Nombre o símbolo (btc, ethereum, sol, etc.)
            currency: Moneda fiat (usd, eur, mxn)

        Returns:
            Texto formateado con el precio
        """
        coin_id = self.ALIASES.get(crypto.lower(), crypto.lower())

        try:
            url = f"{self.BASE_URL}/simple/price"
            params = {
                "ids": coin_id,
                "vs_currencies": currency,
                "include_24hr_change": "true",
                "include_market_cap": "true",
            }
            r = requests.get(url, params=params, timeout=10)

            if r.status_code == 200:
                data = r.json()
                if coin_id in data:
                    self.query_count += 1
                    return self._format_price(coin_id, data[coin_id], currency)
                else:
                    return f"❌ No encontré la crypto: {crypto}"
            elif r.status_code == 429:
                return "⏳ Demasiadas consultas. Intenta en 30 segundos."
            else:
                return f"❌ Error consultando precio ({r.status_code})"

        except Exception as e:
            logger.warning(f"Crypto price error: {e}")
            return f"❌ Error de conexión al consultar {crypto}"

    def get_top_cryptos(self, limit: int = 10, currency: str = "usd") -> Optional[str]:
        """Obtiene top N criptomonedas por market cap."""
        try:
            url = f"{self.BASE_URL}/coins/markets"
            params = {
                "vs_currency": currency,
                "order": "market_cap_desc",
                "per_page": limit,
                "page": 1,
            }
            r = requests.get(url, params=params, timeout=10)

            if r.status_code == 200:
                coins = r.json()
                return self._format_top(coins, currency)

        except Exception as e:
            logger.warning(f"Top cryptos error: {e}")
        return None

    def _format_price(self, coin_id: str, data: Dict, currency: str) -> str:
        """Formatea precio de una crypto."""
        price = data.get(currency, 0)
        change_24h = data.get(f"{currency}_24h_change", 0)
        market_cap = data.get(f"{currency}_market_cap", 0)

        # Icono de cambio
        if change_24h > 0:
            change_icon = "📈"
            change_color = "+"
        elif change_24h < 0:
            change_icon = "📉"
            change_color = ""
        else:
            change_icon = "➡️"
            change_color = ""

        # Formatear precio
        if price >= 1:
            price_str = f"${price:,.2f}"
        else:
            price_str = f"${price:.6f}"

        # Market cap
        if market_cap > 1_000_000_000:
            mc_str = f"${market_cap / 1_000_000_000:.1f}B"
        elif market_cap > 1_000_000:
            mc_str = f"${market_cap / 1_000_000:.1f}M"
        else:
            mc_str = f"${market_cap:,.0f}"

        name = coin_id.replace("-", " ").title()

        text = f"💰 *{name}*\n\n"
        text += f"💵 Precio: {price_str} {currency.upper()}\n"
        text += f"{change_icon} 24h: {change_color}{change_24h:.2f}%\n"
        text += f"📊 Market Cap: {mc_str}\n"
        return text

    def _format_top(self, coins: List[Dict], currency: str) -> str:
        """Formatea lista de top cryptos."""
        text = "💰 *Top Criptomonedas*\n\n"
        for i, coin in enumerate(coins, 1):
            price = coin.get("current_price", 0)
            change = coin.get("price_change_percentage_24h", 0) or 0
            icon = "📈" if change > 0 else "📉" if change < 0 else "➡️"
            symbol = coin.get("symbol", "?").upper()

            if price >= 1:
                p_str = f"${price:,.2f}"
            else:
                p_str = f"${price:.4f}"

            text += f"{i}. *{symbol}* {p_str} {icon}{change:+.1f}%\n"
        return text
