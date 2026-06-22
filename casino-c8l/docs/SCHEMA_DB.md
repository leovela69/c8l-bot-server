# 🗄️ Schema de Base de Datos — Casino C8L

## Supabase Tables

### sports_bets (Apuestas deportivas)
```sql
CREATE TABLE sports_bets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    event_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    bet_type TEXT NOT NULL,           -- 'moneyline', 'spread', 'over/under'
    selection TEXT NOT NULL,           -- equipo/opción elegida
    odds DECIMAL(10,2) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    potential_win DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',    -- 'pending', 'won', 'lost', 'cancelled'
    settled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sports_bets_user ON sports_bets(user_id);
CREATE INDEX idx_sports_bets_event ON sports_bets(event_id);
CREATE INDEX idx_sports_bets_status ON sports_bets(status);
```

### prophet_predictions (Predicciones del Profeta)
```sql
CREATE TABLE prophet_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT,
    event_name TEXT NOT NULL,
    prediction TEXT NOT NULL,
    confidence DECIMAL(5,2),          -- 0.00 a 1.00
    result TEXT,                       -- 'correct', 'incorrect', null (pending)
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_prophet_event ON prophet_predictions(event_id);
```

### real_wallets (Monedero de apuestas reales)
```sql
CREATE TABLE real_wallets (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    balance DECIMAL(10,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'EUR',
    total_deposited DECIMAL(10,2) DEFAULT 0.00,
    total_withdrawn DECIMAL(10,2) DEFAULT 0.00,
    kyc_verified BOOLEAN DEFAULT false,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### wallet_transactions (Historial de transacciones reales)
```sql
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type TEXT NOT NULL,               -- 'deposit', 'withdrawal', 'bet', 'win'
    amount DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    payment_method TEXT,              -- 'mercadopago', 'stripe', 'crypto'
    payment_ref TEXT,                 -- referencia externa
    status TEXT DEFAULT 'completed',  -- 'pending', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wallet_tx_user ON wallet_transactions(user_id);
```

### casino_sessions (Sesiones de juego)
```sql
CREATE TABLE casino_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    game TEXT NOT NULL,               -- 'roulette', 'slots', 'poker', 'bingo', 'derby'
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    total_bet DECIMAL(10,2) DEFAULT 0.00,
    total_won DECIMAL(10,2) DEFAULT 0.00,
    spins_count INTEGER DEFAULT 0
);

CREATE INDEX idx_casino_sessions_user ON casino_sessions(user_id);
CREATE INDEX idx_casino_sessions_game ON casino_sessions(game);
```

### game_history (Historial detallado de cada jugada)
```sql
CREATE TABLE game_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES casino_sessions(id),
    user_id UUID REFERENCES users(id),
    game TEXT NOT NULL,
    bet_amount DECIMAL(10,2),
    result TEXT,                      -- 'win', 'lose', 'push'
    win_amount DECIMAL(10,2) DEFAULT 0.00,
    details JSONB,                    -- datos específicos del juego (número, cartas, etc.)
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_game_history_session ON game_history(session_id);
CREATE INDEX idx_game_history_user ON game_history(user_id);
```

---

## Tablas Existentes (Actualizar)

### users (Añadir campos)
```sql
ALTER TABLE users ADD COLUMN diamonds INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN vip_level INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN total_wagered DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN favorite_game TEXT;
```

---

## RLS Policies (Row Level Security)

```sql
-- Solo ver tus propias apuestas
ALTER TABLE sports_bets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bets" ON sports_bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bets" ON sports_bets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Solo ver tu propio monedero
ALTER TABLE real_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own wallet" ON real_wallets FOR SELECT USING (auth.uid() = user_id);

-- Solo ver tu propio historial
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON wallet_transactions FOR SELECT USING (auth.uid() = user_id);
```
