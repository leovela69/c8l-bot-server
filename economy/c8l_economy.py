# -*- coding: utf-8 -*-
"""
⚡ C8L ECONOMY — Sistema Económico tipo StarMaker
===================================================
Dos monedas, dos mundos:

🎒 MOCHILA (C8L Coins):
  - Se ganan gratis: tareas, eventos, logros, login diario
  - Se COMPRAN con dinero real ($15 = 1,000 coins)
  - Se gastan en: regalos, skins, casino, torneos
  - Regalos de mochila NO generan diamantes
  - Los gratis expiran en 60 días, los comprados NO

💎 DIAMANTES:
  - Se ganan SOLO cuando alguien te regala con coins REALES (comprados)
  - Ratio: 3 Coins = 1 Diamante
  - Son RETIRABLES (dinero real)
  - NO expiran
  - Mínimo retiro: 1,000 diamantes

FÓRMULA:
  1,000 Coins = $15 USD
  3,000 Coins regalados → 1,000 Diamantes para receptor
  C8L retiene 2/3 (se queman), receptor gana 1/3 como diamantes

Autor: C8L Agency / Leo
"""

import os
import json
import time
import logging
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta

logger = logging.getLogger("c8l.economy")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
ECONOMY_FILE = os.path.join(DATA_DIR, "c8l_economy.json")

os.makedirs(DATA_DIR, exist_ok=True)


# ===================================================================
# CONFIGURACIÓN DE PRECIOS
# ===================================================================

PAYPAL_PAYMENT_LINK = os.environ.get("PAYPAL_PAYMENT_LINK", "https://www.paypal.com/ncp/payment/YFQBHL69MXWBN")
PAYPAL_BUTTON_ID = "YFQBHL69MXWBN"
COINS_PER_DIAMOND = 3   # 3 coins regalados = 1 diamante
MIN_WITHDRAWAL_DIAMONDS = 1000  # Mínimo para retirar

# Packs de compra — PayPal (1 USD ≈ 75 coins base)
COIN_PACKS_PAYPAL = {
    "mini":      {"coins": 301,   "price_usd": 3.99,   "discount": "17.08%", "bonus": 0},
    "basico":    {"coins": 762,   "price_usd": 9.99,   "discount": "18.53%", "bonus": 0},
    "estandar":  {"coins": 1538,  "price_usd": 19.99,  "discount": "19.66%", "bonus": 0},
    "popular":   {"coins": 3876,  "price_usd": 49.99,  "discount": "20.66%", "bonus": 0, "hot": True},
    "grande":    {"coins": 7813,  "price_usd": 99.99,  "discount": "21.65%", "bonus": 0},
    "mega":      {"coins": 15750, "price_usd": 199.99, "discount": "22.63%", "bonus": 0},
    "ultra":     {"coins": 31500, "price_usd": 399.99, "discount": "22.63%", "bonus": 0},
}

# Packs de compra — Tarjeta (1 USD ≈ 79 coins base)
COIN_PACKS_CARD = {
    "micro":     {"coins": 79,    "price_usd": 1.00,   "discount": "19.39%", "bonus": 0},
    "basico":    {"coins": 558,   "price_usd": 7.00,   "discount": "20.55%", "bonus": 0},
    "estandar":  {"coins": 802,   "price_usd": 10.00,  "discount": "21.31%", "bonus": 0},
    "popular":   {"coins": 1618,  "price_usd": 20.00,  "discount": "22.40%", "bonus": 0},
    "hot":       {"coins": 4076,  "price_usd": 50.00,  "discount": "23.33%", "bonus": 0, "hot": True},
    "mega":      {"coins": 8216,  "price_usd": 100.00, "discount": "24.27%", "bonus": 0},
}

# Default packs (PayPal es el principal)
COIN_PACKS = COIN_PACKS_PAYPAL

# Regalos disponibles
GIFTS = {
    # Regalos de MOCHILA (gratis, NO generan diamantes)
    "aplauso":    {"cost": 10,   "type": "mochila", "emoji": "👏", "name": "Aplauso"},
    "corazon":    {"cost": 50,   "type": "mochila", "emoji": "❤️", "name": "Corazón"},
    "rosa":       {"cost": 100,  "type": "mochila", "emoji": "🌹", "name": "Rosa"},
    "microfono":  {"cost": 200,  "type": "mochila", "emoji": "🎤", "name": "Micrófono"},
    "fuego":      {"cost": 500,  "type": "mochila", "emoji": "🔥", "name": "Fuego"},
    # Regalos REALES (SÍ generan diamantes — solo con coins comprados)
    "estrella":   {"cost": 500,  "type": "real", "emoji": "⭐", "name": "Estrella",     "diamonds": 166},
    "leon":       {"cost": 1000, "type": "real", "emoji": "🦁", "name": "León Dorado",  "diamonds": 333},
    "corona":     {"cost": 2500, "type": "real", "emoji": "👑", "name": "Corona",       "diamonds": 833},
    "cohete":     {"cost": 5000, "type": "real", "emoji": "🚀", "name": "Cohete",       "diamonds": 1666},
    "castillo":   {"cost": 10000,"type": "real", "emoji": "🏰", "name": "Castillo",     "diamonds": 3333},
}

# Recompensas gratis (mochila)
DAILY_REWARDS = {
    "login": 20,
    "racha_3": 50,
    "racha_7": 200,
    "racha_30": 1000,
    "tarea_completada": 30,
    "partida_chess_ganada": 25,
    "casino_jackpot": 500,
    "referido": 200,
    "stream_30min": 100,
    "achievement": 100,
}

# Límites diarios (coins gratis)
DAILY_FREE_LIMIT = 500
COIN_EXPIRY_DAYS_FREE = 60  # Coins gratis expiran en 60 días


class C8LEconomy:
    """
    ⚡ Motor Económico C8L — Modelo StarMaker adaptado.

    Maneja wallets, coins (mochila), diamantes, regalos, retiros.
    """

    def __init__(self):
        self._data = self._load()

    def _load(self) -> Dict:
        if os.path.exists(ECONOMY_FILE):
            try:
                with open(ECONOMY_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {
            "wallets": {},
            "transactions": [],
            "gifts_log": [],
            "withdrawals": [],
            "stats": {
                "total_coins_sold": 0,
                "total_diamonds_generated": 0,
                "total_revenue_usd": 0.0,
                "total_withdrawals_usd": 0.0,
            },
        }

    def _save(self):
        try:
            with open(ECONOMY_FILE, "w", encoding="utf-8") as f:
                json.dump(self._data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Error guardando economía: {e}")

    # ===================================================================
    # WALLET
    # ===================================================================

    def get_wallet(self, user_id: str) -> Dict:
        """Obtiene el wallet de un usuario (crea si no existe)."""
        user_id = str(user_id)
        if user_id not in self._data["wallets"]:
            self._data["wallets"][user_id] = {
                "user_id": user_id,
                "coins_free": 100,       # Bono bienvenida (mochila)
                "coins_paid": 0,         # Coins comprados con dinero
                "diamonds": 0,           # Ingresos reales
                "total_earned_free": 100,
                "total_purchased": 0,
                "total_spent": 0,
                "total_diamonds_earned": 0,
                "total_diamonds_withdrawn": 0,
                "login_streak": 0,
                "last_login": None,
                "last_daily_claim": None,
                "daily_free_earned": 0,
                "tier": "free",
                "created_at": datetime.now().isoformat(),
            }
            self._save()
        return self._data["wallets"][user_id]

    def get_total_coins(self, user_id: str) -> int:
        """Total de coins disponibles (free + paid)."""
        w = self.get_wallet(user_id)
        return w["coins_free"] + w["coins_paid"]

    def get_balance_text(self, user_id: str) -> str:
        """Texto del balance para mostrar en Telegram."""
        w = self.get_wallet(user_id)
        total_coins = w["coins_free"] + w["coins_paid"]
        diamond_value = w["diamonds"] * COIN_PRICE_USD * COINS_PER_DIAMOND

        return (
            f"💰 *Tu Wallet C8L*\n\n"
            f"🎒 *Mochila:* {total_coins} coins\n"
            f"   ├── Gratis: {w['coins_free']}\n"
            f"   └── Comprados: {w['coins_paid']}\n\n"
            f"💎 *Diamantes:* {w['diamonds']}\n"
            f"   └── Valor: ${diamond_value:.2f} USD\n\n"
            f"📊 *Historial:*\n"
            f"   • Total ganado (gratis): {w['total_earned_free']}\n"
            f"   • Total comprado: {w['total_purchased']}\n"
            f"   • Total gastado: {w['total_spent']}\n"
            f"   • Diamantes ganados: {w['total_diamonds_earned']}\n"
            f"   • Diamantes retirados: {w['total_diamonds_withdrawn']}\n\n"
            f"🔥 Racha login: {w['login_streak']} días\n"
            f"👑 Tier: {w['tier']}"
        )

    # ===================================================================
    # GANAR COINS GRATIS (Mochila)
    # ===================================================================

    def earn_free_coins(self, user_id: str, amount: int,
                        source: str = "task") -> Dict:
        """
        Agrega coins gratis a la mochila.

        Args:
            user_id: ID del usuario
            amount: Cantidad de coins
            source: De dónde vienen (login, task, chess, casino, etc.)

        Returns:
            {"success": bool, "message": str, "new_balance": int}
        """
        user_id = str(user_id)
        w = self.get_wallet(user_id)

        # Verificar límite diario
        today = datetime.now().strftime("%Y-%m-%d")
        if w.get("last_daily_claim") != today:
            w["daily_free_earned"] = 0
            w["last_daily_claim"] = today

        if w["daily_free_earned"] + amount > DAILY_FREE_LIMIT:
            remaining = DAILY_FREE_LIMIT - w["daily_free_earned"]
            if remaining <= 0:
                return {
                    "success": False,
                    "message": f"🎒 Límite diario alcanzado ({DAILY_FREE_LIMIT} coins/día). Vuelve mañana!",
                }
            amount = remaining

        w["coins_free"] += amount
        w["total_earned_free"] += amount
        w["daily_free_earned"] += amount
        self._save()

        self._log_transaction(user_id, "earn_free", amount, source)

        return {
            "success": True,
            "message": f"🎒 +{amount} coins ({source})",
            "new_balance": w["coins_free"] + w["coins_paid"],
            "earned": amount,
        }

    def claim_daily_login(self, user_id: str) -> Dict:
        """Reclama recompensa de login diario."""
        user_id = str(user_id)
        w = self.get_wallet(user_id)

        today = datetime.now().strftime("%Y-%m-%d")
        if w.get("last_login") == today:
            return {"success": False, "message": "Ya reclamaste tu login de hoy."}

        # Calcular racha
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        if w.get("last_login") == yesterday:
            w["login_streak"] += 1
        else:
            w["login_streak"] = 1

        w["last_login"] = today

        # Bonus por racha
        streak = w["login_streak"]
        reward = DAILY_REWARDS["login"]
        bonus_msg = ""

        if streak >= 30:
            reward += DAILY_REWARDS["racha_30"]
            bonus_msg = f"\n🎉 ¡Racha 30 días! +{DAILY_REWARDS['racha_30']} BONUS"
        elif streak >= 7:
            reward += DAILY_REWARDS["racha_7"]
            bonus_msg = f"\n🔥 ¡Racha 7 días! +{DAILY_REWARDS['racha_7']} BONUS"
        elif streak >= 3:
            reward += DAILY_REWARDS["racha_3"]
            bonus_msg = f"\n✨ ¡Racha 3 días! +{DAILY_REWARDS['racha_3']} BONUS"

        result = self.earn_free_coins(user_id, reward, "login_diario")

        if result["success"]:
            result["message"] = (
                f"✅ *Login diario reclamado!*\n\n"
                f"🎒 +{reward} coins\n"
                f"🔥 Racha: {streak} días{bonus_msg}\n"
                f"💰 Balance: {self.get_total_coins(user_id)} coins"
            )
            result["streak"] = streak

        return result

    # ===================================================================
    # COMPRAR COINS (Dinero Real)
    # ===================================================================

    def purchase_coins(self, user_id: str, pack_name: str) -> Dict:
        """
        Simula compra de coins (integrar con Stripe en producción).

        Returns:
            {"success": bool, "message": str, "coins_added": int}
        """
        user_id = str(user_id)
        if pack_name not in COIN_PACKS:
            packs_text = "\n".join(
                f"  • `{k}`: {v['coins']} coins = ${v['price_usd']}"
                + (f" (+{v['bonus']} bonus)" if v['bonus'] else "")
                for k, v in COIN_PACKS.items()
            )
            return {
                "success": False,
                "message": f"❌ Pack no válido. Packs disponibles:\n\n{packs_text}",
            }

        pack = COIN_PACKS[pack_name]
        total_coins = pack["coins"] + pack["bonus"]

        w = self.get_wallet(user_id)
        w["coins_paid"] += total_coins
        w["total_purchased"] += total_coins

        self._data["stats"]["total_coins_sold"] += total_coins
        self._data["stats"]["total_revenue_usd"] += pack["price_usd"]
        self._save()

        self._log_transaction(user_id, "purchase", total_coins, pack_name,
                            amount_usd=pack["price_usd"])

        bonus_text = f" (+{pack['bonus']} bonus!)" if pack['bonus'] else ""
        return {
            "success": True,
            "message": (
                f"✅ *Compra exitosa!*\n\n"
                f"💰 +{total_coins} coins{bonus_text}\n"
                f"💵 Pagado: ${pack['price_usd']}\n"
                f"🎒 Balance: {self.get_total_coins(user_id)} coins"
            ),
            "coins_added": total_coins,
        }

    # ===================================================================
    # REGALOS (El corazón de la economía)
    # ===================================================================

    def send_gift(self, sender_id: str, receiver_id: str,
                  gift_name: str) -> Dict:
        """
        Envía un regalo de sender a receiver.

        - Regalos de MOCHILA: cuestan coins gratis, NO generan diamantes
        - Regalos REALES: cuestan coins COMPRADOS, SÍ generan diamantes (ratio 3:1)

        Args:
            sender_id: Quien regala
            receiver_id: Quien recibe
            gift_name: Nombre del regalo

        Returns:
            {"success": bool, "message": str, "diamonds_generated": int}
        """
        sender_id = str(sender_id)
        receiver_id = str(receiver_id)

        if sender_id == receiver_id:
            return {"success": False, "message": "❌ No puedes regalarte a ti mismo."}

        if gift_name not in GIFTS:
            gifts_text = self._get_gifts_menu()
            return {"success": False, "message": f"❌ Regalo no existe.\n\n{gifts_text}"}

        gift = GIFTS[gift_name]
        cost = gift["cost"]
        gift_type = gift["type"]

        sender_wallet = self.get_wallet(sender_id)
        receiver_wallet = self.get_wallet(receiver_id)

        # Verificar balance
        if gift_type == "real":
            # Regalos reales SOLO se pagan con coins COMPRADOS
            if sender_wallet["coins_paid"] < cost:
                return {
                    "success": False,
                    "message": (
                        f"❌ Necesitas {cost} coins *comprados* para regalar {gift['emoji']} {gift['name']}.\n\n"
                        f"Tu saldo comprado: {sender_wallet['coins_paid']}\n"
                        f"_Los regalos reales solo se envían con coins comprados._\n\n"
                        f"Compra coins: /comprar"
                    ),
                }
            # Descontar de coins pagados
            sender_wallet["coins_paid"] -= cost
        else:
            # Regalos de mochila: primero gratis, luego pagados
            total = sender_wallet["coins_free"] + sender_wallet["coins_paid"]
            if total < cost:
                return {
                    "success": False,
                    "message": f"❌ Necesitas {cost} coins. Tienes {total}.",
                }
            # Descontar primero de gratis
            if sender_wallet["coins_free"] >= cost:
                sender_wallet["coins_free"] -= cost
            else:
                remainder = cost - sender_wallet["coins_free"]
                sender_wallet["coins_free"] = 0
                sender_wallet["coins_paid"] -= remainder

        sender_wallet["total_spent"] += cost

        # Generar diamantes si es regalo REAL
        diamonds_generated = 0
        if gift_type == "real":
            diamonds_generated = cost // COINS_PER_DIAMOND  # 3:1
            receiver_wallet["diamonds"] += diamonds_generated
            receiver_wallet["total_diamonds_earned"] += diamonds_generated
            self._data["stats"]["total_diamonds_generated"] += diamonds_generated

        self._save()

        # Log
        self._log_gift(sender_id, receiver_id, gift_name, cost, diamonds_generated)

        # Mensaje
        if diamonds_generated > 0:
            return {
                "success": True,
                "message": (
                    f"{gift['emoji']} *¡Regalo enviado!*\n\n"
                    f"🎁 {gift['name']} → usuario\n"
                    f"💎 +{diamonds_generated} diamantes para el receptor\n"
                    f"💰 -{cost} coins de tu wallet"
                ),
                "diamonds_generated": diamonds_generated,
            }
        else:
            return {
                "success": True,
                "message": (
                    f"{gift['emoji']} *¡Regalo de mochila enviado!*\n\n"
                    f"🎒 {gift['name']} → usuario\n"
                    f"💰 -{cost} coins\n"
                    f"_(Los regalos de mochila no generan diamantes)_"
                ),
                "diamonds_generated": 0,
            }

    # ===================================================================
    # RETIRO DE DIAMANTES
    # ===================================================================

    def withdraw_diamonds(self, user_id: str, amount: int) -> Dict:
        """
        Solicita retiro de diamantes (convertir a dinero real).

        Ratio: 1,000 diamantes = $15 USD (3000 coins × $0.015 × 1/3)
        Realmente: 1 diamante = $0.015 USD × 3 = $0.045... 
        Pero la fórmula real es: 3000 coins ($45) → 1000 diamantes
        Entonces 1000 diamantes = lo que pagaron / 3 = $15 de valor para receptor
        Hmm... recalculemos:
        1000 coins = $15. Para generar 333 diamantes necesitas regalar 1000 coins.
        Para generar 1000 diamantes necesitas que te regalen 3000 coins ($45).
        Pero C8L retuvo 2/3, así que paga 1/3: $45/3 = $15.
        1000 diamantes = $15 USD de valor para el receptor.
        """
        user_id = str(user_id)
        w = self.get_wallet(user_id)

        if amount < MIN_WITHDRAWAL_DIAMONDS:
            return {
                "success": False,
                "message": f"❌ Mínimo de retiro: {MIN_WITHDRAWAL_DIAMONDS} 💎\nTienes: {w['diamonds']} 💎",
            }

        if w["diamonds"] < amount:
            return {
                "success": False,
                "message": f"❌ No tienes suficientes diamantes.\nTienes: {w['diamonds']} 💎\nPides: {amount} 💎",
            }

        # Calcular valor USD
        # 1000 diamantes vienen de 3000 coins que costaron $45
        # C8L paga al usuario 1/3 del valor original
        usd_value = (amount / 1000) * 15.0  # $15 por cada 1000 diamantes

        w["diamonds"] -= amount
        w["total_diamonds_withdrawn"] += amount
        self._data["stats"]["total_withdrawals_usd"] += usd_value
        self._save()

        # Registrar retiro
        self._data["withdrawals"].append({
            "user_id": user_id,
            "diamonds": amount,
            "usd_value": usd_value,
            "status": "pending",
            "requested_at": datetime.now().isoformat(),
        })
        self._save()

        return {
            "success": True,
            "message": (
                f"✅ *Retiro solicitado!*\n\n"
                f"💎 {amount} diamantes\n"
                f"💵 Valor: ${usd_value:.2f} USD\n"
                f"📋 Estado: Pendiente de aprobación\n\n"
                f"_El admin procesará tu retiro en 24-48h._"
            ),
            "usd_value": usd_value,
        }

    # ===================================================================
    # UTILIDADES
    # ===================================================================

    def _get_gifts_menu(self) -> str:
        """Genera el menú de regalos formateado."""
        mochila = []
        reales = []
        for key, g in GIFTS.items():
            line = f"  {g['emoji']} `{key}` — {g['name']} ({g['cost']} coins)"
            if g["type"] == "mochila":
                mochila.append(line)
            else:
                diamonds = g.get("diamonds", g["cost"] // 3)
                reales.append(f"{line} → {diamonds}💎")

        return (
            f"🎒 *Regalos de Mochila* (no generan 💎):\n"
            f"{chr(10).join(mochila)}\n\n"
            f"💎 *Regalos Reales* (generan diamantes):\n"
            f"{chr(10).join(reales)}"
        )

    def _log_transaction(self, user_id: str, tx_type: str,
                         amount: int, source: str, amount_usd: float = 0):
        """Registra transacción."""
        self._data["transactions"].append({
            "user_id": user_id,
            "type": tx_type,
            "amount": amount,
            "source": source,
            "amount_usd": amount_usd,
            "timestamp": datetime.now().isoformat(),
        })
        # Mantener solo últimas 1000 transacciones
        if len(self._data["transactions"]) > 1000:
            self._data["transactions"] = self._data["transactions"][-1000:]

    def _log_gift(self, sender: str, receiver: str,
                  gift_name: str, cost: int, diamonds: int):
        """Registra regalo."""
        self._data["gifts_log"].append({
            "sender": sender,
            "receiver": receiver,
            "gift": gift_name,
            "cost": cost,
            "diamonds_generated": diamonds,
            "timestamp": datetime.now().isoformat(),
        })
        if len(self._data["gifts_log"]) > 500:
            self._data["gifts_log"] = self._data["gifts_log"][-500:]

    def get_economy_stats(self) -> str:
        """Stats globales de la economía."""
        s = self._data["stats"]
        total_users = len(self._data["wallets"])
        return (
            f"🏦 *Economía C8L*\n\n"
            f"👥 Usuarios: {total_users}\n"
            f"💰 Coins vendidos: {s['total_coins_sold']:,}\n"
            f"💎 Diamantes generados: {s['total_diamonds_generated']:,}\n"
            f"💵 Revenue: ${s['total_revenue_usd']:.2f}\n"
            f"📤 Retiros: ${s['total_withdrawals_usd']:.2f}\n"
            f"📊 Beneficio neto: ${s['total_revenue_usd'] - s['total_withdrawals_usd']:.2f}"
        )

    def get_packs_text(self, method: str = "paypal") -> str:
        """Texto de packs disponibles con descuentos visuales."""
        packs = COIN_PACKS_PAYPAL if method == "paypal" else COIN_PACKS_CARD
        rate = "75" if method == "paypal" else "79"

        lines = [
            f"💰 *Recarga de Coins C8L*",
            f"💳 Método: {'PayPal' if method == 'paypal' else 'Tarjeta'}",
            f"📊 Rate: 1 USD ≈ {rate} coins\n",
        ]
        for key, pack in packs.items():
            hot = " 🔥" if pack.get("hot") else ""
            lines.append(
                f"  🪙 *{pack['coins']:,} coins* — ${pack['price_usd']:.2f}{hot}\n"
                f"      _{pack['discount']} de descuento_"
            )
        lines.append(f"\n_Usa: /comprar [pack]_")
        lines.append(f"_Ej: /comprar popular_")
        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------
_economy_instance: Optional[C8LEconomy] = None


def get_c8l_economy() -> C8LEconomy:
    """Obtiene la instancia global de la economía C8L."""
    global _economy_instance
    if _economy_instance is None:
        _economy_instance = C8LEconomy()
    return _economy_instance
