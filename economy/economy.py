# economy/economy.py — Motor Económico Central C8L
# Gestiona: wallets, coins, diamonds, conversiones, retiros, límites diarios

import os
import json
import logging
from datetime import datetime, timedelta
from decimal import Decimal

logger = logging.getLogger(__name__)

try:
    from supabase import create_client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False

from .config import SUPABASE_URL, SUPABASE_KEY, ADMIN_USER_IDS, ADMIN_CREDITS, DEFAULT_CONFIG


class EconomySystem:
    """Motor económico central de C8L Agency."""

    def __init__(self):
        if SUPABASE_AVAILABLE and SUPABASE_URL and 'placeholder' not in SUPABASE_URL:
            self.db = create_client(SUPABASE_URL, SUPABASE_KEY)
        else:
            self.db = None
            logger.warning("Supabase not configured — running in local/mock mode")

        self.config = self._load_config()

    def _load_config(self) -> dict:
        """Carga configuración económica desde DB o defaults."""
        if not self.db:
            return DEFAULT_CONFIG
        try:
            resp = self.db.table('economic_config').select('key, value').execute()
            config = {}
            for item in resp.data:
                config[item['key']] = item['value']
            return config
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            return DEFAULT_CONFIG

    def _get_rate(self, key: str, subkey: str, default=None):
        """Obtiene un valor de configuración."""
        return self.config.get(key, {}).get(subkey, default)

    # ================================================================
    # WALLETS
    # ================================================================

    def get_balance(self, user_id: str) -> dict:
        """Obtiene balance completo de un usuario."""
        if self._is_admin(user_id):
            return {
                'user_id': user_id,
                'coins': ADMIN_CREDITS,
                'diamonds': ADMIN_CREDITS,
                'real_balance': 0,
                'casino_chips': ADMIN_CREDITS,
                'is_admin': True
            }

        if not self.db:
            return {'user_id': user_id, 'coins': 0, 'diamonds': 0, 'real_balance': 0, 'casino_chips': 0, 'is_admin': False}

        try:
            resp = self.db.table('user_wallets').select('*').eq('user_id', user_id).execute()
            if not resp.data:
                return self._create_wallet(user_id)
            w = resp.data[0]
            w['is_admin'] = False
            return w
        except Exception as e:
            logger.error(f"Error getting balance: {e}")
            return {'user_id': user_id, 'coins': 0, 'diamonds': 0, 'real_balance': 0, 'casino_chips': 0, 'is_admin': False}

    def _create_wallet(self, user_id: str) -> dict:
        """Crea wallet para usuario nuevo con bono de bienvenida."""
        wallet = {
            'user_id': user_id,
            'coins': 100,
            'diamonds': 0,
            'real_balance': 0,
            'casino_chips': 0,
            'total_earned_coins': 100,
        }
        if self.db:
            self.db.table('user_wallets').insert(wallet).execute()
            self._log_tx(user_id, 'earn_coins', amount=100, desc='Bono de bienvenida', source='system')
        wallet['is_admin'] = False
        return wallet

    def _is_admin(self, user_id: str) -> bool:
        """Verifica si es admin."""
        return user_id in ADMIN_USER_IDS

    # ================================================================
    # EARN COINS (Ganar monedas)
    # ================================================================

    def earn_coins(self, user_id: str, amount: int, source: str, description: str = '') -> dict:
        """Añade coins a un usuario respetando límites diarios."""
        if amount <= 0:
            return {'success': False, 'error': 'Cantidad debe ser positiva'}

        if self._is_admin(user_id):
            return {'success': True, 'new_balance': ADMIN_CREDITS, 'earned': amount}

        # Check daily limit
        daily = self._get_daily_limits(user_id)
        max_daily = self._get_rate('limits', 'max_daily_free_coins', 500)

        if source != 'purchase' and daily['coins_earned'] + amount > max_daily:
            remaining = max(0, max_daily - daily['coins_earned'])
            if remaining == 0:
                return {'success': False, 'error': f'Límite diario alcanzado ({max_daily} coins/día)'}
            amount = remaining  # Dar lo que queda

        if not self.db:
            return {'success': True, 'new_balance': amount, 'earned': amount}

        # Update wallet
        wallet = self.get_balance(user_id)
        new_coins = wallet['coins'] + amount

        self.db.table('user_wallets').update({
            'coins': new_coins,
            'total_earned_coins': wallet.get('total_earned_coins', 0) + amount,
            'updated_at': datetime.now().isoformat()
        }).eq('user_id', user_id).execute()

        # Update daily limits
        self._increment_daily(user_id, 'coins_earned', amount)

        # Log transaction
        self._log_tx(user_id, 'earn_coins', amount=amount, desc=description, source=source)

        # Create coin grant with expiry
        expiry_days = self._get_rate('limits', 'coin_expiry_days', 60)
        if source != 'purchase':
            self._create_coin_grant(user_id, amount, source, expiry_days)

        return {'success': True, 'new_balance': new_coins, 'earned': amount}

    def spend_coins(self, user_id: str, amount: int, description: str = '', source: str = 'purchase') -> dict:
        """Gasta coins de un usuario."""
        if amount <= 0:
            return {'success': False, 'error': 'Cantidad debe ser positiva'}

        if self._is_admin(user_id):
            return {'success': True, 'new_balance': ADMIN_CREDITS, 'spent': amount}

        wallet = self.get_balance(user_id)
        if wallet['coins'] < amount:
            return {'success': False, 'error': 'Saldo insuficiente', 'current': wallet['coins']}

        new_coins = wallet['coins'] - amount

        if self.db:
            self.db.table('user_wallets').update({
                'coins': new_coins,
                'total_spent_coins': wallet.get('total_spent_coins', 0) + amount,
                'updated_at': datetime.now().isoformat()
            }).eq('user_id', user_id).execute()

            self._log_tx(user_id, 'spend_coins', amount=amount, desc=description, source=source)

        return {'success': True, 'new_balance': new_coins, 'spent': amount}

    # ================================================================
    # CONVERSIÓN: COINS → DIAMONDS
    # ================================================================

    def convert_coins_to_diamonds(self, user_id: str, coins: int) -> dict:
        """Convierte coins en diamonds con fee."""
        rate = self._get_rate('conversion_rates', 'coins_to_diamond', 100)
        min_coins = self._get_rate('conversion_rates', 'min_convert_coins', 100)
        fee_percent = self._get_rate('fees', 'conversion_fee_percent', 5)
        max_daily = self._get_rate('limits', 'max_daily_conversions', 3)

        if coins < min_coins:
            return {'success': False, 'error': f'Mínimo {min_coins} coins para convertir'}

        # Check daily limit
        daily = self._get_daily_limits(user_id)
        if daily['conversions_done'] >= max_daily:
            return {'success': False, 'error': f'Máximo {max_daily} conversiones/día'}

        # Check balance
        wallet = self.get_balance(user_id)
        if wallet['coins'] < coins:
            return {'success': False, 'error': 'Saldo insuficiente'}

        # Calculate with fee
        fee_coins = int(coins * fee_percent / 100)
        effective_coins = coins - fee_coins
        diamonds = effective_coins // rate

        if diamonds < 1:
            return {'success': False, 'error': f'Cantidad insuficiente después de comisión ({fee_percent}%)'}

        # Execute
        new_coins = wallet['coins'] - coins
        new_diamonds = wallet['diamonds'] + diamonds

        if self.db:
            self.db.table('user_wallets').update({
                'coins': new_coins,
                'diamonds': new_diamonds,
                'total_earned_diamonds': wallet.get('total_earned_diamonds', 0) + diamonds,
                'updated_at': datetime.now().isoformat()
            }).eq('user_id', user_id).execute()

            self.db.table('conversions').insert({
                'user_id': user_id,
                'coins_used': coins,
                'fee_coins': fee_coins,
                'diamonds_received': diamonds,
                'rate': rate,
            }).execute()

            self._increment_daily(user_id, 'conversions_done', 1)
            self._log_tx(user_id, 'convert', amount=coins,
                        desc=f'{coins} coins → {diamonds} diamonds (fee: {fee_coins})', source='conversion')

        return {
            'success': True,
            'coins_used': coins,
            'fee_coins': fee_coins,
            'diamonds_received': diamonds,
            'new_coins': new_coins,
            'new_diamonds': new_diamonds
        }

    # ================================================================
    # RETIROS: DIAMONDS → EUR
    # ================================================================

    def request_withdrawal(self, user_id: str, diamonds: int, method: str, email: str) -> dict:
        """Solicita retiro de diamonds a EUR."""
        wallet = self.get_balance(user_id)
        if wallet['diamonds'] < diamonds:
            return {'success': False, 'error': 'Saldo de diamonds insuficiente'}

        # Determine tier
        tiers = self._get_rate('withdrawal_tiers', None, None) or self.config.get('withdrawal_tiers', {})
        rate = 10  # default: 10 diamonds = 1€
        tier_name = 'bronze'
        if isinstance(tiers, dict):
            for t_name in ['gold', 'silver', 'bronze']:
                t = tiers.get(t_name, {})
                if diamonds >= t.get('min_diamonds', 99999):
                    rate = t.get('rate', 10)
                    tier_name = t_name
                    break

        amount_eur = diamonds / rate
        min_withdraw = self._get_rate('conversion_rates', 'min_withdraw_eur', 5)

        if amount_eur < min_withdraw:
            return {'success': False, 'error': f'Mínimo {min_withdraw}€ para retirar ({int(min_withdraw * rate)} diamonds)'}

        # Calculate fee
        fee_percent = self._get_rate('fees', 'withdrawal_fee_percent', 10)
        min_fee = self._get_rate('fees', 'withdrawal_min_fee_eur', 0.50)
        fee_eur = max(amount_eur * fee_percent / 100, min_fee)
        net_eur = amount_eur - fee_eur

        # Hold period
        hold_days = self._get_rate('limits', 'hold_period_days', 14)
        hold_until = (datetime.now() + timedelta(days=hold_days)).isoformat()

        # Deduct diamonds
        new_diamonds = wallet['diamonds'] - diamonds

        if self.db:
            self.db.table('user_wallets').update({
                'diamonds': new_diamonds,
                'updated_at': datetime.now().isoformat()
            }).eq('user_id', user_id).execute()

            resp = self.db.table('withdrawals').insert({
                'user_id': user_id,
                'diamonds_used': diamonds,
                'amount_eur': float(amount_eur),
                'fee_eur': float(fee_eur),
                'net_amount_eur': float(net_eur),
                'rate': rate,
                'tier': tier_name,
                'payment_method': method,
                'payment_email': email,
                'status': 'held',
                'hold_until': hold_until,
            }).execute()

            self._log_tx(user_id, 'withdraw', amount=diamonds, amount_real=float(net_eur),
                        desc=f'Retiro {diamonds} dia → {net_eur:.2f}€ (fee: {fee_eur:.2f}€)', source='withdrawal')

            return {
                'success': True,
                'withdrawal_id': resp.data[0]['id'],
                'diamonds_used': diamonds,
                'gross_eur': float(amount_eur),
                'fee_eur': float(fee_eur),
                'net_eur': float(net_eur),
                'tier': tier_name,
                'hold_until': hold_until,
                'status': 'held'
            }

        return {'success': True, 'net_eur': float(net_eur), 'status': 'held'}

    # ================================================================
    # CASINO CHIPS (Separado de economía principal)
    # ================================================================

    def buy_casino_chips(self, user_id: str, coins: int) -> dict:
        """Compra fichas de casino con coins (1:1)."""
        result = self.spend_coins(user_id, coins, 'Compra fichas casino', 'casino')
        if not result['success']:
            return result

        wallet = self.get_balance(user_id)
        new_chips = wallet['casino_chips'] + coins

        if self.db:
            self.db.table('user_wallets').update({
                'casino_chips': new_chips,
                'updated_at': datetime.now().isoformat()
            }).eq('user_id', user_id).execute()

        return {'success': True, 'chips': new_chips, 'coins_spent': coins}

    def casino_result(self, user_id: str, bet: int, win: int, game_type: str) -> dict:
        """Registra resultado de casino."""
        wallet = self.get_balance(user_id)
        net = win - bet
        new_chips = wallet['casino_chips'] + net

        if self.db:
            self.db.table('user_wallets').update({
                'casino_chips': max(0, new_chips),
                'updated_at': datetime.now().isoformat()
            }).eq('user_id', user_id).execute()

            self.db.table('casino_sessions').insert({
                'user_id': user_id,
                'game_type': game_type,
                'chips_in': bet,
                'chips_out': win,
                'net_result': net,
                'rounds_played': 1,
            }).execute()

        return {'success': True, 'net': net, 'new_chips': max(0, new_chips)}

    # ================================================================
    # DAILY BONUS
    # ================================================================

    def claim_daily_bonus(self, user_id: str) -> dict:
        """Reclama el bono diario."""
        wallet = self.get_balance(user_id)
        last_bonus = wallet.get('last_daily_bonus')

        if last_bonus:
            last_dt = datetime.fromisoformat(str(last_bonus).replace('Z', ''))
            if last_dt.date() == datetime.now().date():
                return {'success': False, 'error': 'Ya reclamaste tu bono hoy'}

        bonus = 50  # Base daily bonus
        result = self.earn_coins(user_id, bonus, 'daily_bonus', 'Bono diario')

        if result['success'] and self.db:
            self.db.table('user_wallets').update({
                'last_daily_bonus': datetime.now().isoformat()
            }).eq('user_id', user_id).execute()

        return result

    # ================================================================
    # HELPERS
    # ================================================================

    def _get_daily_limits(self, user_id: str) -> dict:
        """Obtiene límites diarios del usuario."""
        if not self.db:
            return {'coins_earned': 0, 'conversions_done': 0, 'casino_bets': 0, 'withdrawals_requested': 0}
        try:
            today = datetime.now().strftime('%Y-%m-%d')
            resp = self.db.table('daily_limits').select('*').eq('user_id', user_id).eq('date', today).execute()
            if resp.data:
                return resp.data[0]
            # Create today's record
            self.db.table('daily_limits').insert({'user_id': user_id, 'date': today}).execute()
            return {'coins_earned': 0, 'conversions_done': 0, 'casino_bets': 0, 'withdrawals_requested': 0}
        except:
            return {'coins_earned': 0, 'conversions_done': 0, 'casino_bets': 0, 'withdrawals_requested': 0}

    def _increment_daily(self, user_id: str, field: str, amount: int):
        """Incrementa un campo en daily_limits."""
        if not self.db:
            return
        today = datetime.now().strftime('%Y-%m-%d')
        try:
            resp = self.db.table('daily_limits').select(field).eq('user_id', user_id).eq('date', today).execute()
            if resp.data:
                current = resp.data[0].get(field, 0)
                self.db.table('daily_limits').update({field: current + amount}).eq('user_id', user_id).eq('date', today).execute()
        except:
            pass

    def _create_coin_grant(self, user_id: str, amount: int, source: str, expiry_days: int):
        """Crea un grant de coins con fecha de expiración."""
        if not self.db:
            return
        self.db.table('coin_grants').insert({
            'user_id': user_id,
            'amount': amount,
            'remaining': amount,
            'source': source,
            'expires_at': (datetime.now() + timedelta(days=expiry_days)).isoformat()
        }).execute()

    def _log_tx(self, user_id: str, tx_type: str, amount: int = 0, amount_real: float = 0,
                desc: str = '', source: str = '', metadata: dict = None):
        """Registra una transacción."""
        if not self.db:
            return
        try:
            self.db.table('transactions').insert({
                'user_id': user_id,
                'type': tx_type,
                'amount': amount if amount else None,
                'amount_real': amount_real if amount_real else None,
                'description': desc,
                'source': source,
                'metadata': metadata or {},
                'status': 'completed',
            }).execute()
        except Exception as e:
            logger.error(f"Error logging tx: {e}")

    # ================================================================
    # METRICS
    # ================================================================

    def get_metrics(self) -> dict:
        """Métricas financieras globales."""
        if not self.db:
            return {'error': 'DB not connected'}
        try:
            wallets = self.db.table('user_wallets').select('coins, diamonds').execute()
            total_coins = sum(w['coins'] for w in wallets.data)
            total_diamonds = sum(w['diamonds'] for w in wallets.data)

            deposits = self.db.table('transactions').select('amount_real').eq('type', 'deposit').eq('status', 'completed').execute()
            total_revenue = sum(t['amount_real'] for t in deposits.data if t.get('amount_real'))

            withdrawals = self.db.table('withdrawals').select('net_amount_eur').eq('status', 'completed').execute()
            total_withdrawn = sum(w['net_amount_eur'] for w in withdrawals.data if w.get('net_amount_eur'))

            return {
                'total_users': len(wallets.data),
                'total_coins_circulation': total_coins,
                'total_diamonds_circulation': total_diamonds,
                'total_revenue_eur': total_revenue,
                'total_withdrawn_eur': total_withdrawn,
                'net_revenue_eur': total_revenue - total_withdrawn,
            }
        except Exception as e:
            return {'error': str(e)}
