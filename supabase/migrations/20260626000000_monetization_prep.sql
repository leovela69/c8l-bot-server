-- =====================================================
-- C8L AGENCY - MONETIZACIÓN & FACTURACIÓN (MIGRACIÓN)
-- =====================================================

-- 1. MODIFICACIÓN DE LA TABLA DE USUARIOS
-- Añadir campos para controlar los tiers y la cuota diaria
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'plan') THEN
        ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'free';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'music_generated_today') THEN
        ALTER TABLE users ADD COLUMN music_generated_today INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_music_generated_date') THEN
        ALTER TABLE users ADD COLUMN last_music_generated_date DATE DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- 2. TABLA DE CÓDIGOS DE INVITACIÓN
CREATE TABLE IF NOT EXISTS invitation_codes (
    code TEXT PRIMARY KEY,
    is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES users(id) ON DELETE SET NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE FACTURAS (AUTOMÁTICA Y SECUENCIAL)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL, -- Secuencial: C8L-2026-0001, etc.
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    stripe_payment_intent_id TEXT,
    tax_id TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    country TEXT NOT NULL,
    eu_vat_number TEXT,
    concept TEXT NOT NULL,
    base_amount NUMERIC(10, 2) NOT NULL,
    vat_rate NUMERIC(5, 2) NOT NULL,
    vat_amount NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE MÚSICA GENERADA (REPLICATE ENGINE)
CREATE TABLE IF NOT EXISTS generated_music (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'music',
    prompt TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    replicate_prediction_id TEXT UNIQUE,
    output_url TEXT,
    duration_seconds INT,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    coins_cost INT DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ÍNDICES DE VELOCIDAD
CREATE INDEX IF NOT EXISTS idx_invitation_codes_used ON invitation_codes(is_used);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_generated_music_user ON generated_music(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_music_pred ON generated_music(replicate_prediction_id);

-- 6. FUNCIÓN AUXILIAR: Obtener el siguiente número de factura secuencial para un año
CREATE OR REPLACE FUNCTION get_next_invoice_number(p_year TEXT)
RETURNS TEXT AS $$
DECLARE
    v_prefix TEXT;
    v_count INT;
    v_next_num TEXT;
BEGIN
    v_prefix := 'C8L-' || p_year || '-';
    
    SELECT COUNT(*) INTO v_count 
    FROM invoices 
    WHERE invoice_number LIKE v_prefix || '%';
    
    v_next_num := v_prefix || lpad((v_count + 1)::TEXT, 4, '0');
    RETURN v_next_num;
END;
$$ LANGUAGE plpgsql;

-- 7. FUNCIÓN: Añadir coins al usuario
CREATE OR REPLACE FUNCTION add_coins(user_id UUID, amount INT)
RETURNS VOID AS $$
BEGIN
    UPDATE users SET coins = coins + amount WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 8. FUNCIÓN: Incrementar contador de música del usuario
CREATE OR REPLACE FUNCTION increment_music_counter(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users SET music_generated_today = music_generated_today + 1 WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;
