# economy/api.py — API Unificada del Sistema Económico C8L
# Un solo servidor Flask con TODOS los endpoints económicos

import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

from .economy import EconomySystem
from .payouts import PayoutSystem
from .subscriptions import SubscriptionSystem

logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=['*'])

# Initialize systems
economy = EconomySystem()
payouts = PayoutSystem(db=economy.db, )
subscriptions = SubscriptionSystem(db=economy.db, economy=economy)


# ================================================================
# MIDDLEWARE
# ================================================================

@app.before_request
def check_auth():
    """Basic auth check (expand with JWT/Supabase auth)."""
    # Skip for health check and webhook
    if request.path in ('/health', '/api/webhook/stripe'):
        return
    # In production, validate JWT token here
    pass


# ================================================================
# HEALTH
# ================================================================

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'c8l-economy', 'version': '1.0.0'})


# ================================================================
# WALLET & BALANCE
# ================================================================

@app.route('/api/balance/<user_id>', methods=['GET'])
def get_balance(user_id):
    """Obtener balance completo."""
    balance = economy.get_balance(user_id)
    return jsonify(balance)


@app.route('/api/earn', methods=['POST'])
def earn_coins():
    """Ganar coins (tareas, daily bonus, etc)."""
    data = request.json or {}
    user_id = data.get('user_id')
    amount = data.get('amount', 0)
    source = data.get('source', 'task')
    description = data.get('description', '')

    if not user_id or not amount:
        return jsonify({'error': 'user_id y amount requeridos'}), 400

    result = economy.earn_coins(user_id, int(amount), source, description)
    return jsonify(result)


@app.route('/api/spend', methods=['POST'])
def spend_coins():
    """Gastar coins (compras, apuestas, etc)."""
    data = request.json or {}
    user_id = data.get('user_id')
    amount = data.get('amount', 0)
    description = data.get('description', '')
    source = data.get('source', 'purchase')

    if not user_id or not amount:
        return jsonify({'error': 'user_id y amount requeridos'}), 400

    result = economy.spend_coins(user_id, int(amount), description, source)
    return jsonify(result)


@app.route('/api/daily-bonus/<user_id>', methods=['POST'])
def daily_bonus(user_id):
    """Reclamar bono diario."""
    result = economy.claim_daily_bonus(user_id)
    return jsonify(result)


# ================================================================
# CONVERSIONS & WITHDRAWALS
# ================================================================

@app.route('/api/convert', methods=['POST'])
def convert():
    """Convertir coins → diamonds."""
    data = request.json or {}
    user_id = data.get('user_id')
    coins = data.get('coins', 0)

    if not user_id or not coins:
        return jsonify({'error': 'user_id y coins requeridos'}), 400

    result = economy.convert_coins_to_diamonds(user_id, int(coins))
    return jsonify(result)


@app.route('/api/withdraw', methods=['POST'])
def withdraw():
    """Solicitar retiro diamonds → EUR."""
    data = request.json or {}
    user_id = data.get('user_id')
    diamonds = data.get('diamonds', 0)
    method = data.get('method', 'stripe')
    email = data.get('email', '')

    if not user_id or not diamonds or not email:
        return jsonify({'error': 'user_id, diamonds y email requeridos'}), 400

    result = economy.request_withdrawal(user_id, int(diamonds), method, email)
    return jsonify(result)


# ================================================================
# CASINO
# ================================================================

@app.route('/api/casino/buy-chips', methods=['POST'])
def buy_chips():
    """Comprar fichas de casino con coins."""
    data = request.json or {}
    user_id = data.get('user_id')
    coins = data.get('coins', 0)

    if not user_id or not coins:
        return jsonify({'error': 'user_id y coins requeridos'}), 400

    result = economy.buy_casino_chips(user_id, int(coins))
    return jsonify(result)


@app.route('/api/casino/result', methods=['POST'])
def casino_result():
    """Registrar resultado de casino."""
    data = request.json or {}
    user_id = data.get('user_id')
    bet = data.get('bet', 0)
    win = data.get('win', 0)
    game = data.get('game', 'unknown')

    if not user_id:
        return jsonify({'error': 'user_id requerido'}), 400

    result = economy.casino_result(user_id, int(bet), int(win), game)
    return jsonify(result)


# ================================================================
# SUBSCRIPTIONS
# ================================================================

@app.route('/api/plans', methods=['GET'])
def get_plans():
    """Obtener todos los planes."""
    plans = subscriptions.get_plans()
    # Clean for frontend
    clean = {}
    for name, p in plans.items():
        clean[name] = {
            'name': p.get('name'),
            'display_name': p.get('display_name'),
            'price_monthly': p.get('price_monthly'),
            'price_yearly': p.get('price_yearly'),
            'price_lifetime': p.get('price_lifetime'),
            'coins_monthly': p.get('coins_monthly'),
            'trial_days': p.get('trial_days', 0),
            'max_members': p.get('max_members', 1),
            'features': p.get('features', {}),
        }
    return jsonify(clean)


@app.route('/api/subscription/<user_id>', methods=['GET'])
def get_subscription(user_id):
    """Obtener suscripción actual."""
    sub = subscriptions.get_user_subscription(user_id)
    return jsonify(sub)


@app.route('/api/subscribe', methods=['POST'])
def subscribe():
    """Crear suscripción (redirige a Stripe)."""
    data = request.json or {}
    user_id = data.get('user_id')
    plan = data.get('plan')
    billing = data.get('billing', 'monthly')

    if not user_id or not plan:
        return jsonify({'error': 'user_id y plan requeridos'}), 400

    result = subscriptions.subscribe(user_id, plan, billing)
    return jsonify(result)


@app.route('/api/subscription/cancel', methods=['POST'])
def cancel_subscription():
    """Cancelar suscripción."""
    data = request.json or {}
    user_id = data.get('user_id')

    if not user_id:
        return jsonify({'error': 'user_id requerido'}), 400

    result = subscriptions.cancel(user_id)
    return jsonify(result)


@app.route('/api/subscription/change', methods=['POST'])
def change_plan():
    """Cambiar de plan (upgrade/downgrade)."""
    data = request.json or {}
    user_id = data.get('user_id')
    new_plan = data.get('plan')
    billing = data.get('billing', 'monthly')

    if not user_id or not new_plan:
        return jsonify({'error': 'user_id y plan requeridos'}), 400

    result = subscriptions.change_plan(user_id, new_plan, billing)
    return jsonify(result)


# ================================================================
# SALES & PAYOUTS
# ================================================================

@app.route('/api/sales/process', methods=['POST'])
def process_sale():
    """Procesar venta con reparto automático."""
    data = request.json or {}
    required = ['product_type', 'buyer_id', 'total_amount_eur']
    for f in required:
        if f not in data:
            return jsonify({'error': f'{f} requerido'}), 400

    result = payouts.process_sale(data)
    return jsonify(result)


@app.route('/api/factions/<faction_id>/treasury', methods=['GET'])
def faction_treasury(faction_id):
    """Obtener tesorería de bando."""
    result = payouts.get_faction_treasury(faction_id)
    return jsonify(result)


@app.route('/api/streamers/<streamer_id>/balance', methods=['GET'])
def streamer_balance(streamer_id):
    """Obtener balance de streamer."""
    result = payouts.get_streamer_balance(streamer_id)
    return jsonify(result)


@app.route('/api/streamers/withdraw', methods=['POST'])
def streamer_withdraw():
    """Retiro de streamer."""
    data = request.json or {}
    streamer_id = data.get('streamer_id')
    amount = data.get('amount')
    method = data.get('method', 'stripe')
    email = data.get('email')

    if not streamer_id or not amount or not email:
        return jsonify({'error': 'streamer_id, amount y email requeridos'}), 400

    result = payouts.streamer_withdraw(streamer_id, float(amount), method, email)
    return jsonify(result)


@app.route('/api/referral/create', methods=['POST'])
def create_referral():
    """Crear código de referido."""
    data = request.json or {}
    result = payouts.create_referral_code(
        owner_type=data.get('owner_type', 'user'),
        owner_id=data.get('owner_id'),
        code=data.get('code'),
        discount=data.get('discount', 10),
        bonus=data.get('bonus', 5),
        max_uses=data.get('max_uses', 0)
    )
    return jsonify(result)


# ================================================================
# WEBHOOK (Stripe)
# ================================================================

@app.route('/api/webhook/stripe', methods=['POST'])
def stripe_webhook():
    """Webhook de Stripe."""
    payload = request.get_data()
    sig = request.headers.get('Stripe-Signature', '')
    result = subscriptions.handle_webhook(payload, sig)
    return jsonify(result)


# ================================================================
# ADMIN / METRICS
# ================================================================

@app.route('/api/admin/metrics', methods=['GET'])
def admin_metrics():
    """Métricas económicas globales."""
    eco_metrics = economy.get_metrics()
    payout_metrics = payouts.get_payout_metrics()
    return jsonify({**eco_metrics, **payout_metrics})


@app.route('/api/admin/release-payouts', methods=['POST'])
def release_payouts():
    """Liberar pagos cuyo hold expiró (cron)."""
    result = payouts.release_held_payouts()
    return jsonify(result)


@app.route('/api/admin/distribute-coins', methods=['POST'])
def distribute_coins():
    """Distribuir coins mensuales (cron)."""
    result = subscriptions.distribute_monthly_coins()
    return jsonify(result)


@app.route('/api/admin/config', methods=['GET'])
def get_config():
    """Obtener configuración económica."""
    return jsonify(economy.config)


# ================================================================
# RUN
# ================================================================

def create_app():
    """Factory function for the Flask app."""
    return app


if __name__ == '__main__':
    port = int(os.getenv('ECONOMY_PORT', 8081))
    app.run(host='0.0.0.0', port=port, debug=False)
