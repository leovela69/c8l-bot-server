# economy/config.py — Configuración del sistema económico
import os

# Supabase
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://placeholder.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'placeholder_key')

# Stripe
STRIPE_SECRET_KEY = os.getenv('STRIPE_SECRET_KEY', '')
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET', '')
STRIPE_PUBLISHABLE_KEY = os.getenv('STRIPE_PUBLISHABLE_KEY', '')

# Admin
ADMIN_USER_IDS = ['leovela69', 'rufinoleon30@gmail.com']
ADMIN_CREDITS = 9999

# URLs
SUCCESS_URL = os.getenv('C8L_SUCCESS_URL', 'https://c8l-bot-server.vercel.app/monetizacion?success=true')
CANCEL_URL = os.getenv('C8L_CANCEL_URL', 'https://c8l-bot-server.vercel.app/monetizacion?canceled=true')

# Defaults (overridden by DB config)
DEFAULT_CONFIG = {
    'conversion_rates': {
        'coins_to_diamond': 100,
        'diamond_to_eur': 10,
        'min_withdraw_eur': 5,
        'min_convert_coins': 100,
    },
    'fees': {
        'conversion_fee_percent': 5,
        'withdrawal_fee_percent': 10,
        'withdrawal_min_fee_eur': 0.50,
        'casino_winnings_convert_penalty': 30,
    },
    'limits': {
        'max_daily_free_coins': 500,
        'max_daily_conversions': 3,
        'max_monthly_withdraw_eur': 5000,
        'hold_period_days': 14,
        'coin_expiry_days': 60,
        'dunning_grace_days': 7,
    },
}
