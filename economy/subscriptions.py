# economy/subscriptions.py — Sistema de Suscripciones C8L
# Planes: Free / Normal / Crew / Premium / Lifetime
# Stripe integration, dunning (7 días gracia), trial, coins mensuales

import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

try:
    import stripe
    STRIPE_AVAILABLE = True
except ImportError:
    STRIPE_AVAILABLE = False

from .config import (
    SUPABASE_URL, SUPABASE_KEY, STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET, SUCCESS_URL, CANCEL_URL
)

try:
    from supabase import create_client
except ImportError:
    pass


DUNNING_SCHEDULE = [
    {'day': 1, 'action': 'retry_payment', 'notify': 'email'},
    {'day': 3, 'action': 'retry_payment', 'notify': 'email+push'},
    {'day': 5, 'action': 'retry_payment', 'notify': 'email+push+telegram'},
    {'day': 7, 'action': 'downgrade_to_free', 'notify': 'all'},
]


class SubscriptionSystem:
    """Gestiona planes de suscripción, pagos recurrentes y coins mensuales."""

    def __init__(self, db=None, economy=None):
        if db:
            self.db = db
        elif SUPABASE_URL and 'placeholder' not in SUPABASE_URL:
            self.db = create_client(SUPABASE_URL, SUPABASE_KEY)
        else:
            self.db = None

        self.economy = economy  # EconomySystem instance for coin operations

        if STRIPE_AVAILABLE and STRIPE_SECRET_KEY:
            stripe.api_key = STRIPE_SECRET_KEY

        self._plans_cache = None

    # ================================================================
    # PLANS
    # ================================================================

    def get_plans(self) -> dict:
        """Obtiene todos los planes activos."""
        if self._plans_cache:
            return self._plans_cache

        if not self.db:
            self._plans_cache = self._default_plans()
            return self._plans_cache

        try:
            resp = self.db.table('subscription_plans').select('*').eq('is_active', True).order('sort_order').execute()
            self._plans_cache = {p['name']: p for p in resp.data}
            return self._plans_cache
        except:
            self._plans_cache = self._default_plans()
            return self._plans_cache

    def _default_plans(self) -> dict:
        return {
            'free': {'name': 'free', 'display_name': 'Gratis', 'price_monthly': 0, 'price_yearly': 0, 'coins_monthly': 100, 'trial_days': 0,
                     'features': {'ads': True, 'basic_skins': True, 'chess_limited': True, 'support': 'community'}},
            'normal': {'name': 'normal', 'display_name': 'Normal', 'price_monthly': 5.99, 'price_yearly': 49.99, 'coins_monthly': 500, 'trial_days': 0,
                       'features': {'ads': False, 'basic_skins': True, 'chess_unlimited': True, 'tournaments': True, 'support': 'priority'}},
            'crew': {'name': 'crew', 'display_name': 'Crew (Bando)', 'price_monthly': 24.99, 'price_yearly': 199.99, 'coins_monthly': 1000, 'max_members': 10, 'trial_days': 0,
                     'features': {'ads': False, 'premium_skins': True, 'faction_treasury_bonus': True, 'war_priority': True}},
            'premium': {'name': 'premium', 'display_name': 'Premium', 'price_monthly': 14.99, 'price_yearly': 149.99, 'coins_monthly': 2000, 'trial_days': 7,
                        'features': {'ads': False, 'all_unlocked': True, 'streaming': True, 'ai_advanced': True, 'support': 'vip'}},
            'lifetime': {'name': 'lifetime', 'display_name': 'Lifetime VIP', 'price_monthly': None, 'price_yearly': None, 'price_lifetime': 199.99, 'coins_monthly': 5000, 'trial_days': 0,
                         'features': {'all_unlocked': True, 'badge': 'fundador_og', 'exclusive_events': True}},
        }

    # ================================================================
    # GET USER SUBSCRIPTION
    # ================================================================

    def get_user_subscription(self, user_id: str) -> dict:
        """Obtiene la suscripción activa de un usuario."""
        if not self.db:
            return {'plan': 'free', 'status': 'active', 'features': self._default_plans()['free']['features']}

        try:
            resp = self.db.table('user_subscriptions').select('*, subscription_plans(*)').eq('user_id', user_id).eq('status', 'active').execute()
            if not resp.data:
                return {'plan': 'free', 'status': 'active', 'features': self.get_plans()['free'].get('features', {})}

            sub = resp.data[0]
            plan = sub.get('subscription_plans', {})

            # Check expiry
            if sub.get('end_date'):
                end = datetime.fromisoformat(str(sub['end_date']).replace('Z', ''))
                if datetime.now() > end:
                    self._expire_subscription(sub['id'], user_id)
                    return {'plan': 'free', 'status': 'expired', 'features': self.get_plans()['free'].get('features', {})}

            return {
                'plan': plan.get('name', 'free'),
                'display_name': plan.get('display_name', 'Gratis'),
                'status': sub['status'],
                'billing_cycle': sub.get('billing_cycle', 'monthly'),
                'end_date': sub.get('end_date'),
                'is_trial': sub.get('is_trial', False),
                'trial_ends_at': sub.get('trial_ends_at'),
                'auto_renew': sub.get('auto_renew', True),
                'coins_monthly': plan.get('coins_monthly', 0),
                'features': plan.get('features', {}),
            }
        except Exception as e:
            logger.error(f"Error getting subscription: {e}")
            return {'plan': 'free', 'status': 'active', 'features': {}}

    def has_feature(self, user_id: str, feature: str) -> bool:
        """Verifica si un usuario tiene acceso a una feature."""
        sub = self.get_user_subscription(user_id)
        return sub.get('features', {}).get(feature, False)

    # ================================================================
    # SUBSCRIBE (Create payment session)
    # ================================================================

    def subscribe(self, user_id: str, plan_name: str, billing: str = 'monthly') -> dict:
        """Crea sesión de pago para suscripción."""
        plans = self.get_plans()
        plan = plans.get(plan_name)
        if not plan:
            return {'success': False, 'error': 'Plan no encontrado'}

        if plan_name == 'free':
            return self._activate_free(user_id)

        # Determine price
        if plan_name == 'lifetime':
            price = plan.get('price_lifetime', 199.99)
            mode = 'payment'
            interval = None
        elif billing == 'yearly':
            price = plan.get('price_yearly', plan.get('price_monthly', 0) * 10)
            mode = 'payment'
            interval = None
        else:
            price = plan.get('price_monthly', 0)
            mode = 'subscription'
            interval = 'month'

        if not STRIPE_AVAILABLE or not STRIPE_SECRET_KEY:
            # Mock mode — activate directly (for development)
            return self._activate_subscription(user_id, plan_name, billing, 'mock')

        # Create Stripe session
        try:
            line_item = {
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': f'C8L {plan.get("display_name", plan_name)}',
                        'description': f'Suscripción C8L Agency — {plan.get("display_name", plan_name)}'
                    },
                    'unit_amount': int(price * 100),
                },
                'quantity': 1,
            }

            if mode == 'subscription' and interval:
                line_item['price_data']['recurring'] = {'interval': interval}

            session_params = {
                'payment_method_types': ['card'],
                'line_items': [line_item],
                'mode': mode,
                'success_url': SUCCESS_URL + f'&session_id={{CHECKOUT_SESSION_ID}}',
                'cancel_url': CANCEL_URL,
                'metadata': {
                    'user_id': user_id,
                    'plan': plan_name,
                    'billing': billing,
                },
            }

            # Add trial for premium
            if mode == 'subscription' and plan.get('trial_days', 0) > 0:
                session_params['subscription_data'] = {
                    'trial_period_days': plan['trial_days'],
                    'metadata': {'user_id': user_id, 'plan': plan_name}
                }

            session = stripe.checkout.Session.create(**session_params)

            return {
                'success': True,
                'session_id': session.id,
                'session_url': session.url,
                'plan': plan_name,
                'billing': billing,
                'price': price,
            }
        except Exception as e:
            logger.error(f"Stripe error: {e}")
            return {'success': False, 'error': str(e)}

    # ================================================================
    # ACTIVATE SUBSCRIPTION
    # ================================================================

    def _activate_free(self, user_id: str) -> dict:
        """Activa plan gratuito."""
        return self._activate_subscription(user_id, 'free', 'none', None)

    def _activate_subscription(self, user_id: str, plan_name: str, billing: str, stripe_sub_id: str = None) -> dict:
        """Activa suscripción en la DB."""
        plans = self.get_plans()
        plan = plans.get(plan_name)
        if not plan:
            return {'success': False, 'error': 'Plan no encontrado'}

        start = datetime.now()
        if plan_name == 'lifetime':
            end = start + timedelta(days=36500)  # 100 years
        elif billing == 'yearly':
            end = start + timedelta(days=365)
        else:
            end = start + timedelta(days=30)

        is_trial = plan.get('trial_days', 0) > 0
        trial_ends = (start + timedelta(days=plan['trial_days'])).isoformat() if is_trial else None

        if self.db:
            # Cancel any existing active subscription
            try:
                self.db.table('user_subscriptions').update({
                    'status': 'superseded',
                    'updated_at': datetime.now().isoformat()
                }).eq('user_id', user_id).eq('status', 'active').execute()
            except:
                pass

            # Get plan_id
            plan_id = plan.get('id')
            if not plan_id:
                try:
                    resp = self.db.table('subscription_plans').select('id').eq('name', plan_name).execute()
                    plan_id = resp.data[0]['id'] if resp.data else None
                except:
                    plan_id = None

            sub_data = {
                'user_id': user_id,
                'plan_id': plan_id,
                'status': 'active',
                'billing_cycle': billing,
                'start_date': start.isoformat(),
                'end_date': end.isoformat(),
                'next_payment_date': end.isoformat() if plan_name != 'lifetime' else None,
                'stripe_subscription_id': stripe_sub_id,
                'is_trial': is_trial,
                'trial_ends_at': trial_ends,
                'auto_renew': plan_name not in ('free', 'lifetime'),
            }

            self.db.table('user_subscriptions').insert(sub_data).execute()

        # Give monthly coins
        coins = plan.get('coins_monthly', 0)
        if billing == 'yearly':
            coins *= 12  # All yearly coins at once

        if coins > 0 and self.economy:
            self.economy.earn_coins(user_id, coins, 'subscription', f'Coins de suscripción {plan_name}')

        return {
            'success': True,
            'plan': plan_name,
            'billing': billing,
            'end_date': end.isoformat(),
            'coins_granted': coins,
            'is_trial': is_trial,
        }

    # ================================================================
    # CONFIRM STRIPE PAYMENT (Webhook)
    # ================================================================

    def confirm_payment(self, session_id: str) -> dict:
        """Confirma pago de Stripe (llamado por webhook)."""
        if not STRIPE_AVAILABLE:
            return {'success': False, 'error': 'Stripe not available'}

        try:
            session = stripe.checkout.Session.retrieve(session_id)
            if session.payment_status != 'paid':
                return {'success': False, 'error': 'Payment not completed'}

            user_id = session.metadata.get('user_id')
            plan_name = session.metadata.get('plan')
            billing = session.metadata.get('billing', 'monthly')
            stripe_sub_id = session.subscription

            result = self._activate_subscription(user_id, plan_name, billing, stripe_sub_id)

            # Record payment
            if self.db:
                self.db.table('payment_history').insert({
                    'user_id': user_id,
                    'amount': session.amount_total / 100,
                    'currency': session.currency.upper(),
                    'payment_method': 'stripe',
                    'stripe_payment_id': session.payment_intent,
                    'status': 'completed',
                    'description': f'Suscripción {plan_name} ({billing})',
                    'completed_at': datetime.now().isoformat()
                }).execute()

            return result
        except Exception as e:
            logger.error(f"Error confirming payment: {e}")
            return {'success': False, 'error': str(e)}

    # ================================================================
    # CANCEL
    # ================================================================

    def cancel(self, user_id: str) -> dict:
        """Cancela suscripción (acceso hasta fin del período)."""
        if not self.db:
            return {'success': True, 'message': 'Cancelled'}

        try:
            sub = self.db.table('user_subscriptions').select('*').eq('user_id', user_id).eq('status', 'active').execute()
            if not sub.data:
                return {'success': False, 'error': 'No hay suscripción activa'}

            s = sub.data[0]

            # Cancel in Stripe (at period end)
            if STRIPE_AVAILABLE and s.get('stripe_subscription_id'):
                try:
                    stripe.Subscription.modify(s['stripe_subscription_id'], cancel_at_period_end=True)
                except:
                    pass

            self.db.table('user_subscriptions').update({
                'auto_renew': False,
                'cancelled_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }).eq('id', s['id']).execute()

            return {
                'success': True,
                'message': 'Suscripción cancelada. Acceso hasta ' + str(s.get('end_date', 'fin del período')),
                'access_until': s.get('end_date')
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def _expire_subscription(self, sub_id: str, user_id: str):
        """Marca suscripción como expirada."""
        if self.db:
            self.db.table('user_subscriptions').update({
                'status': 'expired', 'updated_at': datetime.now().isoformat()
            }).eq('id', sub_id).execute()

    # ================================================================
    # DUNNING (Manejo de pagos fallidos)
    # ================================================================

    def handle_payment_failed(self, stripe_sub_id: str) -> dict:
        """Maneja un pago fallido — inicia dunning de 7 días."""
        if not self.db:
            return {'action': 'none'}

        try:
            sub = self.db.table('user_subscriptions').select('*').eq('stripe_subscription_id', stripe_sub_id).execute()
            if not sub.data:
                return {'action': 'none'}

            s = sub.data[0]
            attempts = s.get('dunning_attempts', 0) + 1

            # Check dunning schedule
            if attempts >= len(DUNNING_SCHEDULE):
                # Max attempts reached — downgrade to free
                self.db.table('user_subscriptions').update({
                    'status': 'expired',
                    'dunning_attempts': attempts,
                    'updated_at': datetime.now().isoformat()
                }).eq('id', s['id']).execute()
                return {'action': 'downgraded', 'user_id': s['user_id']}

            # Schedule next retry
            next_retry = datetime.now() + timedelta(days=2)
            self.db.table('user_subscriptions').update({
                'dunning_attempts': attempts,
                'dunning_next_retry': next_retry.isoformat(),
                'updated_at': datetime.now().isoformat()
            }).eq('id', s['id']).execute()

            schedule = DUNNING_SCHEDULE[attempts - 1]
            return {'action': schedule['action'], 'notify': schedule['notify'], 'attempt': attempts}
        except Exception as e:
            return {'error': str(e)}

    # ================================================================
    # MONTHLY COINS DISTRIBUTION (Cron — ejecutar 1x/mes)
    # ================================================================

    def distribute_monthly_coins(self) -> dict:
        """Distribuye coins mensuales a todos los suscriptores activos."""
        if not self.db or not self.economy:
            return {'distributed': 0}

        try:
            subs = self.db.table('user_subscriptions').select('user_id, subscription_plans(coins_monthly, name)').eq('status', 'active').execute()
            distributed = 0

            for sub in subs.data:
                plan = sub.get('subscription_plans', {})
                coins = plan.get('coins_monthly', 0)
                plan_name = plan.get('name', 'free')

                if coins > 0 and plan_name != 'free':
                    self.economy.earn_coins(
                        sub['user_id'], coins,
                        'subscription_monthly',
                        f'Coins mensuales ({plan_name})'
                    )
                    distributed += 1

            return {'distributed': distributed, 'timestamp': datetime.now().isoformat()}
        except Exception as e:
            return {'error': str(e)}

    # ================================================================
    # UPGRADE / DOWNGRADE (con prorrateo)
    # ================================================================

    def change_plan(self, user_id: str, new_plan: str, billing: str = 'monthly') -> dict:
        """Cambia de plan con prorrateo."""
        current = self.get_user_subscription(user_id)
        plans = self.get_plans()

        if current['plan'] == new_plan:
            return {'success': False, 'error': 'Ya tienes este plan'}

        old_plan = plans.get(current['plan'], {})
        new_plan_data = plans.get(new_plan, {})

        if not new_plan_data:
            return {'success': False, 'error': 'Plan no encontrado'}

        # Calculate proration
        old_price = old_plan.get('price_monthly', 0) or 0
        new_price = new_plan_data.get('price_monthly', 0) or 0

        if current.get('end_date'):
            end = datetime.fromisoformat(str(current['end_date']).replace('Z', ''))
            days_remaining = max(0, (end - datetime.now()).days)
        else:
            days_remaining = 30

        credit = (old_price / 30) * days_remaining
        cost = (new_price / 30) * days_remaining
        difference = cost - credit

        if new_price > old_price:
            # Upgrade — charge difference
            return self.subscribe(user_id, new_plan, billing)
        else:
            # Downgrade — apply credit to next period
            result = self._activate_subscription(user_id, new_plan, billing)
            result['credit_applied'] = round(credit, 2)
            return result

    # ================================================================
    # WEBHOOK HANDLER
    # ================================================================

    def handle_webhook(self, payload: bytes, sig_header: str) -> dict:
        """Procesa webhooks de Stripe."""
        if not STRIPE_AVAILABLE:
            return {'error': 'Stripe not available'}

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)

            if event['type'] == 'checkout.session.completed':
                session = event['data']['object']
                return self.confirm_payment(session['id'])

            elif event['type'] == 'invoice.payment_failed':
                sub_id = event['data']['object'].get('subscription')
                if sub_id:
                    return self.handle_payment_failed(sub_id)

            elif event['type'] == 'customer.subscription.deleted':
                sub_id = event['data']['object']['id']
                if self.db:
                    self.db.table('user_subscriptions').update({
                        'status': 'cancelled',
                        'updated_at': datetime.now().isoformat()
                    }).eq('stripe_subscription_id', sub_id).execute()
                return {'action': 'cancelled'}

            return {'success': True, 'event': event['type']}
        except Exception as e:
            logger.error(f"Webhook error: {e}")
            return {'error': str(e)}
