# economy/payouts.py — Sistema de Pagos y Reparto C8L
# Revenue sharing: C8L / Bando / Streamer / Creador (dinámico por producto)
# Hold period de 14 días, fees de retiro, códigos referido

import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

try:
    from supabase import create_client
except ImportError:
    pass

from .config import SUPABASE_URL, SUPABASE_KEY, DEFAULT_CONFIG


class PayoutSystem:
    """Sistema de reparto de ingresos entre C8L, Bandos, Streamers y Creadores."""

    def __init__(self, db=None):
        if db:
            self.db = db
        elif SUPABASE_URL and 'placeholder' not in SUPABASE_URL:
            self.db = create_client(SUPABASE_URL, SUPABASE_KEY)
        else:
            self.db = None

        self.hold_days = DEFAULT_CONFIG['limits']['hold_period_days']
        self._rules_cache = None

    # ================================================================
    # PAYOUT RULES (Reglas de reparto por producto)
    # ================================================================

    def get_rules(self, product_type: str) -> dict:
        """Obtiene reglas de reparto para un tipo de producto."""
        if not self._rules_cache:
            self._load_rules()

        if product_type in self._rules_cache:
            return self._rules_cache[product_type]
        return self._rules_cache.get('default', {
            'c8l_share': 70, 'faction_share': 20, 'streamer_share': 10, 'creator_share': 0
        })

    def _load_rules(self):
        """Carga reglas desde DB."""
        self._rules_cache = {}
        if not self.db:
            # Defaults hardcoded
            defaults = {
                'coins_pack': {'c8l_share': 85, 'faction_share': 10, 'streamer_share': 5, 'creator_share': 0},
                'subscription': {'c8l_share': 70, 'faction_share': 20, 'streamer_share': 10, 'creator_share': 0},
                'skin': {'c8l_share': 50, 'faction_share': 15, 'streamer_share': 10, 'creator_share': 25},
                'beat': {'c8l_share': 40, 'faction_share': 10, 'streamer_share': 10, 'creator_share': 40},
                'tournament_entry': {'c8l_share': 60, 'faction_share': 25, 'streamer_share': 15, 'creator_share': 0},
                'tip': {'c8l_share': 5, 'faction_share': 0, 'streamer_share': 0, 'creator_share': 95},
                'masterclass': {'c8l_share': 50, 'faction_share': 10, 'streamer_share': 10, 'creator_share': 30},
                'default': {'c8l_share': 70, 'faction_share': 20, 'streamer_share': 10, 'creator_share': 0},
            }
            self._rules_cache = defaults
            return

        try:
            resp = self.db.table('payout_rules').select('*').eq('is_active', True).execute()
            for r in resp.data:
                self._rules_cache[r['product_type']] = {
                    'c8l_share': float(r['c8l_share']),
                    'faction_share': float(r['faction_share']),
                    'streamer_share': float(r['streamer_share']),
                    'creator_share': float(r.get('creator_share', 0)),
                }
        except Exception as e:
            logger.error(f"Error loading payout rules: {e}")
            self._rules_cache = {'default': {'c8l_share': 70, 'faction_share': 20, 'streamer_share': 10, 'creator_share': 0}}

    # ================================================================
    # PROCESAR VENTA CON REPARTO AUTOMÁTICO
    # ================================================================

    def process_sale(self, sale_data: dict) -> dict:
        """
        Procesa una venta y distribuye automáticamente.

        sale_data = {
            'product_type': str,       # 'skin', 'subscription', 'beat', etc.
            'product_id': str/None,
            'product_name': str,
            'buyer_id': str,
            'total_amount_eur': float,
            'faction_id': str/None,    # Bando del comprador
            'streamer_id': str/None,   # Streamer que refirió
            'creator_id': str/None,    # Creador del contenido
            'referral_code': str/None, # Código de referido
        }
        """
        total = sale_data['total_amount_eur']
        product_type = sale_data['product_type']

        # Get rules for this product type
        rules = self.get_rules(product_type)

        # Apply referral discount if exists
        referral_discount = 0
        referral_bonus = 0
        if sale_data.get('referral_code'):
            ref_result = self._apply_referral(sale_data['referral_code'], total)
            referral_discount = ref_result.get('discount', 0)
            referral_bonus = ref_result.get('bonus_percent', 0)
            total -= referral_discount

        # Calculate shares
        c8l_amount = total * rules['c8l_share'] / 100
        faction_amount = total * rules['faction_share'] / 100 if sale_data.get('faction_id') else 0
        streamer_amount = total * rules['streamer_share'] / 100 if sale_data.get('streamer_id') else 0
        creator_amount = total * rules['creator_share'] / 100 if sale_data.get('creator_id') else 0

        # If no faction/streamer/creator, C8L absorbs their share
        unclaimed = total - c8l_amount - faction_amount - streamer_amount - creator_amount
        c8l_amount += unclaimed

        # Apply referral bonus to referrer (extra % from C8L share)
        if referral_bonus > 0 and sale_data.get('referral_code'):
            bonus_amount = total * referral_bonus / 100
            c8l_amount -= bonus_amount
            # bonus goes to referral owner (handled in _apply_referral)

        hold_until = (datetime.now() + timedelta(days=self.hold_days)).isoformat()

        # Execute payouts
        if sale_data.get('faction_id') and faction_amount > 0:
            self._payout_faction(sale_data['faction_id'], faction_amount, product_type, hold_until)

        if sale_data.get('streamer_id') and streamer_amount > 0:
            self._payout_streamer(sale_data['streamer_id'], streamer_amount, product_type, hold_until)

        # Register sale
        sale_record = {
            'product_type': product_type,
            'product_id': sale_data.get('product_id'),
            'product_name': sale_data.get('product_name', ''),
            'buyer_id': sale_data['buyer_id'],
            'total_amount_eur': sale_data['total_amount_eur'],
            'referral_code': sale_data.get('referral_code'),
            'referral_discount': referral_discount,
            'c8l_share_percent': rules['c8l_share'],
            'c8l_amount': round(c8l_amount, 2),
            'faction_id': sale_data.get('faction_id'),
            'faction_share_percent': rules['faction_share'] if sale_data.get('faction_id') else 0,
            'faction_amount': round(faction_amount, 2),
            'streamer_id': sale_data.get('streamer_id'),
            'streamer_share_percent': rules['streamer_share'] if sale_data.get('streamer_id') else 0,
            'streamer_amount': round(streamer_amount, 2),
            'creator_id': sale_data.get('creator_id'),
            'creator_share_percent': rules['creator_share'] if sale_data.get('creator_id') else 0,
            'creator_amount': round(creator_amount, 2),
            'status': 'completed',
        }

        if self.db:
            resp = self.db.table('sales').insert(sale_record).execute()
            sale_record['id'] = resp.data[0]['id'] if resp.data else None

        return {
            'success': True,
            'sale_id': sale_record.get('id'),
            'total_eur': sale_data['total_amount_eur'],
            'breakdown': {
                'c8l': round(c8l_amount, 2),
                'faction': round(faction_amount, 2),
                'streamer': round(streamer_amount, 2),
                'creator': round(creator_amount, 2),
                'referral_discount': round(referral_discount, 2),
            },
            'hold_until': hold_until
        }

    # ================================================================
    # FACTION TREASURY
    # ================================================================

    def _payout_faction(self, faction_id: str, amount: float, source: str, hold_until: str):
        """Ingresa dinero a la tesorería del bando (con hold)."""
        if not self.db:
            return

        # Ensure treasury exists
        treasury = self.db.table('faction_treasury').select('*').eq('faction_id', faction_id).execute()
        if not treasury.data:
            self.db.table('faction_treasury').insert({'faction_id': faction_id}).execute()
            treasury = self.db.table('faction_treasury').select('*').eq('faction_id', faction_id).execute()

        # Update balance
        new_balance = treasury.data[0]['balance_eur'] + amount
        total_earned = treasury.data[0]['total_earned_eur'] + amount

        self.db.table('faction_treasury').update({
            'balance_eur': new_balance,
            'total_earned_eur': total_earned,
            'last_payout_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }).eq('faction_id', faction_id).execute()

        # Register payout (held)
        self.db.table('faction_payouts').insert({
            'faction_id': faction_id,
            'source': source,
            'amount_eur': amount,
            'percentage': self.get_rules(source).get('faction_share', 20),
            'description': f'{source} → {amount:.2f}€',
            'status': 'held',
            'available_at': hold_until,
        }).execute()

    def get_faction_treasury(self, faction_id: str) -> dict:
        """Obtiene tesorería de un bando."""
        if not self.db:
            return {'balance_eur': 0, 'total_earned_eur': 0}
        try:
            resp = self.db.table('faction_treasury').select('*').eq('faction_id', faction_id).execute()
            return resp.data[0] if resp.data else {'balance_eur': 0, 'total_earned_eur': 0}
        except:
            return {'balance_eur': 0, 'total_earned_eur': 0}

    # ================================================================
    # STREAMER PAYOUTS
    # ================================================================

    def _payout_streamer(self, streamer_id: str, amount: float, source: str, hold_until: str):
        """Ingresa dinero al streamer (con hold de 14 días)."""
        if not self.db:
            return

        # Update streamer profile
        profile = self.db.table('streamer_profiles').select('*').eq('id', streamer_id).execute()
        if not profile.data:
            return

        new_earned = profile.data[0]['total_earned_eur'] + amount
        new_available = profile.data[0]['available_balance_eur'] + amount

        self.db.table('streamer_profiles').update({
            'total_earned_eur': new_earned,
            'available_balance_eur': new_available,
            'updated_at': datetime.now().isoformat()
        }).eq('id', streamer_id).execute()

        # Register payout (held)
        self.db.table('streamer_payouts').insert({
            'streamer_id': streamer_id,
            'source': source,
            'amount_eur': amount,
            'percentage': self.get_rules(source).get('streamer_share', 10),
            'description': f'{source} → {amount:.2f}€',
            'status': 'held',
            'available_at': hold_until,
        }).execute()

    def get_streamer_balance(self, streamer_id: str) -> dict:
        """Obtiene balance de un streamer."""
        if not self.db:
            return {'available': 0, 'total_earned': 0, 'total_withdrawn': 0}
        try:
            resp = self.db.table('streamer_profiles').select('*').eq('id', streamer_id).execute()
            if not resp.data:
                return {'error': 'Streamer no encontrado'}
            p = resp.data[0]
            return {
                'available': p['available_balance_eur'],
                'total_earned': p['total_earned_eur'],
                'total_withdrawn': p['total_withdrawn_eur'],
                'held': p['total_earned_eur'] - p['total_withdrawn_eur'] - p['available_balance_eur'],
            }
        except Exception as e:
            return {'error': str(e)}

    def streamer_withdraw(self, streamer_id: str, amount: float, method: str, email: str) -> dict:
        """Streamer solicita retiro."""
        balance = self.get_streamer_balance(streamer_id)
        if 'error' in balance:
            return balance
        if balance['available'] < amount:
            return {'success': False, 'error': f'Saldo disponible insuficiente ({balance["available"]:.2f}€)'}

        # Fee
        fee_percent = DEFAULT_CONFIG['fees']['withdrawal_fee_percent']
        min_fee = DEFAULT_CONFIG['fees']['withdrawal_min_fee_eur']
        fee = max(amount * fee_percent / 100, min_fee)
        net = amount - fee

        if self.db:
            self.db.table('streamer_profiles').update({
                'available_balance_eur': balance['available'] - amount,
                'total_withdrawn_eur': balance['total_withdrawn'] + net,
            }).eq('id', streamer_id).execute()

            # TODO: Process actual payment via Stripe Connect
            logger.info(f"💸 Streamer {streamer_id} withdrawal: {net:.2f}€ via {method} to {email}")

        return {'success': True, 'gross': amount, 'fee': fee, 'net': net, 'method': method, 'status': 'processing'}

    # ================================================================
    # REFERRAL CODES
    # ================================================================

    def _apply_referral(self, code: str, total: float) -> dict:
        """Aplica código de referido."""
        if not self.db:
            return {'discount': 0, 'bonus_percent': 0}
        try:
            ref = self.db.table('referral_codes').select('*').eq('code', code).eq('is_active', True).execute()
            if not ref.data:
                return {'discount': 0, 'bonus_percent': 0}

            r = ref.data[0]
            if r['max_uses'] > 0 and r['uses'] >= r['max_uses']:
                return {'discount': 0, 'bonus_percent': 0}

            discount = total * r['discount_percent'] / 100
            bonus = r['bonus_percent']

            # Update uses and earnings
            self.db.table('referral_codes').update({
                'uses': r['uses'] + 1,
                'earnings_eur': r['earnings_eur'] + (total * bonus / 100)
            }).eq('id', r['id']).execute()

            return {'discount': discount, 'bonus_percent': bonus}
        except:
            return {'discount': 0, 'bonus_percent': 0}

    def create_referral_code(self, owner_type: str, owner_id: str, code: str,
                            discount: float = 10, bonus: float = 5, max_uses: int = 0) -> dict:
        """Crea un código de referido."""
        if not self.db:
            return {'success': True, 'code': code}

        try:
            self.db.table('referral_codes').insert({
                'code': code.upper(),
                'owner_type': owner_type,
                'owner_id': owner_id,
                'discount_percent': discount,
                'bonus_percent': bonus,
                'max_uses': max_uses,
            }).execute()
            return {'success': True, 'code': code.upper()}
        except Exception as e:
            return {'success': False, 'error': str(e)}

    # ================================================================
    # RELEASE HELD PAYOUTS (Cron job — ejecutar diariamente)
    # ================================================================

    def release_held_payouts(self) -> dict:
        """Libera pagos cuyo hold period ha expirado."""
        if not self.db:
            return {'released': 0}

        now = datetime.now().isoformat()
        released = 0

        # Faction payouts
        try:
            held = self.db.table('faction_payouts').select('*').eq('status', 'held').lte('available_at', now).execute()
            for p in held.data:
                self.db.table('faction_payouts').update({'status': 'available', 'processed_at': now}).eq('id', p['id']).execute()
                released += 1
        except:
            pass

        # Streamer payouts
        try:
            held = self.db.table('streamer_payouts').select('*').eq('status', 'held').lte('available_at', now).execute()
            for p in held.data:
                self.db.table('streamer_payouts').update({'status': 'available', 'processed_at': now}).eq('id', p['id']).execute()
                released += 1
        except:
            pass

        # Withdrawals
        try:
            held = self.db.table('withdrawals').select('*').eq('status', 'held').lte('hold_until', now).execute()
            for w in held.data:
                self.db.table('withdrawals').update({'status': 'pending_payment', 'processed_at': now}).eq('id', w['id']).execute()
                released += 1
        except:
            pass

        return {'released': released, 'timestamp': now}

    # ================================================================
    # METRICS
    # ================================================================

    def get_payout_metrics(self) -> dict:
        """Métricas de pagos."""
        if not self.db:
            return {}
        try:
            faction_total = self.db.table('faction_payouts').select('amount_eur').eq('status', 'available').execute()
            streamer_total = self.db.table('streamer_payouts').select('amount_eur').eq('status', 'available').execute()

            return {
                'total_paid_factions': sum(p['amount_eur'] for p in faction_total.data if p.get('amount_eur')),
                'total_paid_streamers': sum(p['amount_eur'] for p in streamer_total.data if p.get('amount_eur')),
            }
        except:
            return {}
