-- ============================================================
-- C8L AGENCY — ARQUITECTURA ECONÓMICA UNIFICADA v1.0
-- Máxima eficiencia: Economía + Pagos + Suscripciones + Anti-fraude
-- ============================================================

-- ============ 1. CONFIGURACIÓN ECONÓMICA ============
CREATE TABLE IF NOT EXISTS economic_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(50) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by UUID
);

INSERT INTO economic_config (key, value, description) VALUES
('conversion_rates', '{
    "coins_to_diamond": 100,
    "diamond_to_eur": 10,
    "min_withdraw_eur": 5,
    "min_convert_coins": 100
}', 'Tasas de conversión entre monedas'),
('fees', '{
    "conversion_fee_percent": 5,
    "withdrawal_fee_percent": 10,
    "withdrawal_min_fee_eur": 0.50,
    "casino_winnings_convert_penalty": 30
}', 'Comisiones del sistema'),
('limits', '{
    "max_daily_free_coins": 500,
    "max_daily_conversions": 3,
    "max_monthly_withdraw_eur": 5000,
    "hold_period_days": 14,
    "coin_expiry_days": 60,
    "dunning_grace_days": 7
}', 'Límites anti-abuso'),
('coin_packs', '{
    "small": {"coins": 100, "price_eur": 0.99, "bonus": 0},
    "medium": {"coins": 500, "price_eur": 3.99, "bonus": 50},
    "large": {"coins": 1500, "price_eur": 9.99, "bonus": 200},
    "mega": {"coins": 4000, "price_eur": 24.99, "bonus": 800},
    "elite": {"coins": 10000, "price_eur": 49.99, "bonus": 2500}
}', 'Paquetes de monedas comprables'),
('withdrawal_tiers', '{
    "bronze": {"min_diamonds": 50, "rate": 10},
    "silver": {"min_diamonds": 200, "rate": 9},
    "gold": {"min_diamonds": 1000, "rate": 8}
}', 'Tasas mejoradas por volumen de retiro')
ON CONFLICT (key) DO NOTHING;

-- ============ 2. PLANES DE SUSCRIPCIÓN ============
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    price_lifetime DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    coins_monthly INTEGER DEFAULT 0,
    max_members INTEGER DEFAULT 1,
    trial_days INTEGER DEFAULT 0,
    features JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO subscription_plans (name, display_name, description, price_monthly, price_yearly, price_lifetime, coins_monthly, max_members, trial_days, features, sort_order) VALUES
('free', 'Gratis', 'Acceso básico a C8L', 0, 0, NULL, 100, 1, 0,
 '{"ads": true, "basic_skins": true, "chess_limited": true, "support": "community", "casino_daily_spins": 3, "tv_quality": "720p", "storage_mb": 100}', 1),
('normal', 'Normal', 'Experiencia mejorada sin anuncios', 5.99, 49.99, NULL, 500, 1, 0,
 '{"ads": false, "basic_skins": true, "premium_skins": false, "chess_unlimited": true, "tournaments": true, "support": "priority", "casino_daily_spins": 10, "tv_quality": "1080p", "storage_mb": 1000, "duet_challenges": true}', 2),
('crew', 'Crew (Bando)', 'Plan grupal para bandos — hasta 10 miembros', 24.99, 199.99, NULL, 1000, 10, 0,
 '{"ads": false, "basic_skins": true, "premium_skins": true, "chess_unlimited": true, "tournaments": true, "support": "priority", "faction_treasury_bonus": true, "war_priority": true, "custom_banner": true, "shared_coins": true, "tv_quality": "1080p", "storage_mb": 5000}', 3),
('premium', 'Premium', 'Acceso VIP total a C8L', 14.99, 149.99, NULL, 2000, 1, 7,
 '{"ads": false, "basic_skins": true, "premium_skins": true, "chess_unlimited": true, "tournaments": true, "tournaments_vip": true, "support": "vip", "streaming": true, "downloads": true, "ai_advanced": true, "casino_daily_spins": 50, "tv_quality": "4k", "storage_mb": 10000, "duet_challenges": true, "custom_profile": true}', 4),
('lifetime', 'Lifetime VIP', 'Acceso permanente — Edición Fundador (100 unidades)', NULL, NULL, 199.99, 5000, 1, 0,
 '{"ads": false, "all_unlocked": true, "support": "founder", "badge": "fundador_og", "streaming": true, "downloads": true, "ai_advanced": true, "casino_daily_spins": 999, "tv_quality": "4k", "storage_mb": 50000, "exclusive_events": true, "founder_badge": true}', 5)
ON CONFLICT (name) DO NOTHING;

-- ============ 3. WALLETS (Monederos) ============
CREATE TABLE IF NOT EXISTS user_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    coins INTEGER DEFAULT 0,
    diamonds INTEGER DEFAULT 0,
    real_balance DECIMAL(10,2) DEFAULT 0,
    casino_chips INTEGER DEFAULT 0,
    total_earned_coins INTEGER DEFAULT 0,
    total_earned_diamonds INTEGER DEFAULT 0,
    total_spent_coins INTEGER DEFAULT 0,
    total_withdrawn_eur DECIMAL(10,2) DEFAULT 0,
    last_daily_bonus TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============ 4. TRANSACCIONES (Registro universal) ============
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(30) NOT NULL,
    -- Types: earn_coins, spend_coins, earn_diamonds, spend_diamonds,
    --        convert, withdraw, deposit, subscription_coins, casino_bet,
    --        casino_win, tip, payout_faction, payout_streamer, refund
    amount INTEGER,
    amount_real DECIMAL(10,2),
    currency VARCHAR(10) DEFAULT 'C8L',
    description TEXT,
    source VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'completed',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_tx_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_tx_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_tx_created ON transactions(created_at);

-- ============ 5. COIN GRANTS (Coins con expiración) ============
CREATE TABLE IF NOT EXISTS coin_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount INTEGER NOT NULL,
    remaining INTEGER NOT NULL,
    source VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grants_user ON coin_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_grants_expiry ON coin_grants(expires_at);

-- ============ 6. DAILY LIMITS (Anti-farming) ============
CREATE TABLE IF NOT EXISTS daily_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    coins_earned INTEGER DEFAULT 0,
    conversions_done INTEGER DEFAULT 0,
    casino_bets INTEGER DEFAULT 0,
    withdrawals_requested INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
);

-- ============ 7. SUSCRIPCIONES DE USUARIOS ============
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    plan_id UUID REFERENCES subscription_plans(id),
    status VARCHAR(20) DEFAULT 'active',
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    start_date TIMESTAMP DEFAULT NOW(),
    end_date TIMESTAMP,
    next_payment_date TIMESTAMP,
    payment_method VARCHAR(30),
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    is_trial BOOLEAN DEFAULT FALSE,
    trial_ends_at TIMESTAMP,
    auto_renew BOOLEAN DEFAULT TRUE,
    dunning_attempts INTEGER DEFAULT 0,
    dunning_next_retry TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subs_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_status ON user_subscriptions(status);

-- ============ 8. PAYMENT HISTORY ============
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    subscription_id UUID REFERENCES user_subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    payment_method VARCHAR(30),
    stripe_payment_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    description TEXT,
    invoice_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);

-- ============ 9. CONVERSIONES (Coins → Diamonds) ============
CREATE TABLE IF NOT EXISTS conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    coins_used INTEGER NOT NULL,
    fee_coins INTEGER DEFAULT 0,
    diamonds_received INTEGER NOT NULL,
    rate INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============ 10. RETIROS (Diamonds → EUR) ============
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    diamonds_used INTEGER NOT NULL,
    amount_eur DECIMAL(10,2) NOT NULL,
    fee_eur DECIMAL(10,2) DEFAULT 0,
    net_amount_eur DECIMAL(10,2) NOT NULL,
    rate INTEGER NOT NULL,
    tier VARCHAR(20) DEFAULT 'bronze',
    payment_method VARCHAR(30),
    payment_email VARCHAR(255),
    bank_details JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    hold_until TIMESTAMP,
    kyc_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- ============ 11. PAYOUT RULES (Reparto dinámico) ============
CREATE TABLE IF NOT EXISTS payout_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_type VARCHAR(50) NOT NULL UNIQUE,
    c8l_share DECIMAL(5,2) NOT NULL,
    faction_share DECIMAL(5,2) NOT NULL,
    streamer_share DECIMAL(5,2) NOT NULL,
    creator_share DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO payout_rules (product_type, c8l_share, faction_share, streamer_share, creator_share) VALUES
('coins_pack', 85, 10, 5, 0),
('subscription', 70, 20, 10, 0),
('skin', 50, 15, 10, 25),
('beat', 40, 10, 10, 40),
('tournament_entry', 60, 25, 15, 0),
('tip', 5, 0, 0, 95),
('masterclass', 50, 10, 10, 30),
('nft', 60, 15, 10, 15),
('default', 70, 20, 10, 0)
ON CONFLICT (product_type) DO NOTHING;

-- ============ 12. FACTION TREASURY (Tesorería Bandos) ============
CREATE TABLE IF NOT EXISTS faction_treasury (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id UUID NOT NULL UNIQUE,
    balance_coins INTEGER DEFAULT 0,
    balance_diamonds INTEGER DEFAULT 0,
    balance_eur DECIMAL(10,2) DEFAULT 0,
    total_earned_eur DECIMAL(10,2) DEFAULT 0,
    total_withdrawn_eur DECIMAL(10,2) DEFAULT 0,
    last_payout_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============ 13. FACTION PAYOUTS ============
CREATE TABLE IF NOT EXISTS faction_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id UUID NOT NULL,
    source VARCHAR(50) NOT NULL,
    source_id UUID,
    amount_eur DECIMAL(10,2),
    percentage DECIMAL(5,2),
    description TEXT,
    status VARCHAR(20) DEFAULT 'held',
    available_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- ============ 14. FACTION DISTRIBUTION (Reparto interno) ============
CREATE TABLE IF NOT EXISTS faction_distribution_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faction_id UUID NOT NULL,
    role VARCHAR(30) NOT NULL,
    share_percent DECIMAL(5,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(faction_id, role)
);

-- ============ 15. STREAMER PROFILES ============
CREATE TABLE IF NOT EXISTS streamer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    streamer_name VARCHAR(100) NOT NULL,
    platform VARCHAR(30) NOT NULL,
    platform_url VARCHAR(255),
    followers INTEGER DEFAULT 0,
    commission_rate DECIMAL(5,2) DEFAULT 10.0,
    total_earned_eur DECIMAL(10,2) DEFAULT 0,
    total_withdrawn_eur DECIMAL(10,2) DEFAULT 0,
    available_balance_eur DECIMAL(10,2) DEFAULT 0,
    kyc_verified BOOLEAN DEFAULT FALSE,
    stripe_connect_id VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============ 16. STREAMER PAYOUTS ============
CREATE TABLE IF NOT EXISTS streamer_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    streamer_id UUID REFERENCES streamer_profiles(id),
    source VARCHAR(50) NOT NULL,
    source_id UUID,
    amount_eur DECIMAL(10,2),
    percentage DECIMAL(5,2),
    description TEXT,
    status VARCHAR(20) DEFAULT 'held',
    available_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

-- ============ 17. REFERRAL CODES ============
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    owner_type VARCHAR(20) NOT NULL,
    owner_id UUID NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 10,
    bonus_percent DECIMAL(5,2) DEFAULT 5,
    uses INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 0,
    earnings_eur DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============ 18. SALES (Ventas con reparto completo) ============
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID,
    product_type VARCHAR(30) NOT NULL,
    product_id UUID,
    product_name VARCHAR(200),
    buyer_id UUID NOT NULL,
    total_amount_eur DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    referral_code VARCHAR(20),
    referral_discount DECIMAL(10,2) DEFAULT 0,
    c8l_share_percent DECIMAL(5,2),
    c8l_amount DECIMAL(10,2),
    faction_id UUID,
    faction_share_percent DECIMAL(5,2),
    faction_amount DECIMAL(10,2),
    streamer_id UUID,
    streamer_share_percent DECIMAL(5,2),
    streamer_amount DECIMAL(10,2),
    creator_id UUID,
    creator_share_percent DECIMAL(5,2),
    creator_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_buyer ON sales(buyer_id);
CREATE INDEX IF NOT EXISTS idx_sales_faction ON sales(faction_id);
CREATE INDEX IF NOT EXISTS idx_sales_streamer ON sales(streamer_id);

-- ============ 19. CASINO (Separado de economía principal) ============
CREATE TABLE IF NOT EXISTS casino_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    game_type VARCHAR(30) NOT NULL,
    chips_in INTEGER NOT NULL,
    chips_out INTEGER DEFAULT 0,
    net_result INTEGER DEFAULT 0,
    rounds_played INTEGER DEFAULT 0,
    max_win INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

-- ============ 20. KYC VERIFICATION ============
CREATE TABLE IF NOT EXISTS kyc_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    full_name VARCHAR(200),
    document_type VARCHAR(30),
    document_number VARCHAR(50),
    country VARCHAR(3),
    date_of_birth DATE,
    status VARCHAR(20) DEFAULT 'pending',
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============ VIEWS (Métricas rápidas) ============
CREATE OR REPLACE VIEW v_economy_metrics AS
SELECT
    (SELECT COUNT(*) FROM user_wallets) as total_users,
    (SELECT COALESCE(SUM(coins), 0) FROM user_wallets) as total_coins_circulation,
    (SELECT COALESCE(SUM(diamonds), 0) FROM user_wallets) as total_diamonds_circulation,
    (SELECT COALESCE(SUM(amount_real), 0) FROM transactions WHERE type = 'deposit' AND status = 'completed') as total_revenue_eur,
    (SELECT COALESCE(SUM(net_amount_eur), 0) FROM withdrawals WHERE status = 'completed') as total_withdrawn_eur,
    (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active') as active_subscriptions,
    (SELECT COUNT(*) FROM streamer_profiles WHERE is_active = TRUE) as active_streamers;
