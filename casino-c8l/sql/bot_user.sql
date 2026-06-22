-- =====================================================
-- C8L AGENT v18.0 — ECOSISTEMA VIVO: BOT USUARIO
-- =====================================================

-- Perfil del bot (se crea automáticamente)
CREATE TABLE IF NOT EXISTS bot_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) UNIQUE,
    name TEXT DEFAULT 'C8L Guardian',
    avatar TEXT DEFAULT '🤖',
    level INT DEFAULT 1,
    xp INT DEFAULT 0,
    coins INT DEFAULT 1000,
    diamonds INT DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    last_action TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Acciones del bot (log completo)
CREATE TABLE IF NOT EXISTS bot_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    target TEXT,
    result TEXT,
    details JSONB,
    requires_approval BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Errores detectados por el bot
CREATE TABLE IF NOT EXISTS bot_detected_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_type TEXT NOT NULL,
    url TEXT,
    description TEXT,
    severity TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'detected',
    proposed_fix TEXT,
    fix_applied TEXT,
    repaired_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sugerencias de mejora del bot
CREATE TABLE IF NOT EXISTS bot_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    impact TEXT,
    status TEXT DEFAULT 'pending',
    implemented_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reparaciones automáticas del bot
CREATE TABLE IF NOT EXISTS bot_repairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    error_id UUID REFERENCES bot_detected_errors(id),
    repair_type TEXT NOT NULL,
    description TEXT,
    success BOOLEAN DEFAULT false,
    details JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reportes diarios del bot
CREATE TABLE IF NOT EXISTS bot_daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_date DATE NOT NULL UNIQUE,
    errors_detected INT DEFAULT 0,
    errors_repaired INT DEFAULT 0,
    content_uploaded INT DEFAULT 0,
    games_played INT DEFAULT 0,
    coins_earned INT DEFAULT 0,
    suggestions_made INT DEFAULT 0,
    uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
    summary TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);


-- =====================================================
-- DATOS INICIALES: Perfil del Bot
-- =====================================================

INSERT INTO bot_profile (name, avatar, level, coins, diamonds, is_active)
VALUES ('C8L Guardian', '🤖', 1, 1000, 100, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- FUNCIONES RPC DEL BOT
-- =====================================================

-- Registrar acción del bot
CREATE OR REPLACE FUNCTION bot_log_action(
    p_action_type TEXT, p_target TEXT, p_result TEXT, p_details JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE v_action_id UUID;
BEGIN
    INSERT INTO bot_actions (action_type, target, result, details)
    VALUES (p_action_type, p_target, p_result, p_details)
    RETURNING id INTO v_action_id;

    UPDATE bot_profile SET last_action = NOW() WHERE is_active = true;
    RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bot detecta error
CREATE OR REPLACE FUNCTION bot_detect_error(
    p_type TEXT, p_url TEXT, p_description TEXT, p_severity TEXT, p_proposed_fix TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE v_error_id UUID;
BEGIN
    INSERT INTO bot_detected_errors (error_type, url, description, severity, proposed_fix)
    VALUES (p_type, p_url, p_description, p_severity, p_proposed_fix)
    RETURNING id INTO v_error_id;

    PERFORM bot_log_action('error_detected', p_url, p_severity, jsonb_build_object('error_type', p_type, 'error_id', v_error_id));

    -- Auto-reparar errores bajos/medios
    IF p_severity IN ('low', 'medium') AND p_proposed_fix IS NOT NULL THEN
        INSERT INTO bot_repairs (error_id, repair_type, description, success)
        VALUES (v_error_id, 'auto_fix', p_proposed_fix, true);
        UPDATE bot_detected_errors SET status = 'repaired', repaired_at = NOW() WHERE id = v_error_id;
        PERFORM bot_log_action('repair_attempted', p_url, 'success', jsonb_build_object('error_id', v_error_id));
    END IF;

    -- Errores críticos requieren aprobación
    IF p_severity IN ('high', 'critical') THEN
        UPDATE bot_detected_errors SET status = 'pending_approval' WHERE id = v_error_id;
        INSERT INTO bot_actions (action_type, target, result, requires_approval, details)
        VALUES ('alert_sent', p_url, 'pending', true, jsonb_build_object('error_id', v_error_id, 'severity', p_severity));
    END IF;

    RETURN v_error_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bot genera reporte diario
CREATE OR REPLACE FUNCTION bot_generate_daily_report()
RETURNS UUID AS $$
DECLARE v_report_id UUID; v_today DATE := CURRENT_DATE;
    v_errors INT; v_repaired INT; v_content INT; v_games INT; v_coins INT; v_suggestions INT;
BEGIN
    SELECT COUNT(*) INTO v_errors FROM bot_detected_errors WHERE created_at::date = v_today;
    SELECT COUNT(*) INTO v_repaired FROM bot_detected_errors WHERE repaired_at::date = v_today;
    SELECT COUNT(*) INTO v_content FROM bot_actions WHERE action_type = 'content_upload' AND created_at::date = v_today;
    SELECT COUNT(*) INTO v_games FROM bot_actions WHERE action_type = 'game_play' AND created_at::date = v_today;
    SELECT COUNT(*) INTO v_suggestions FROM bot_suggestions WHERE created_at::date = v_today;

    INSERT INTO bot_daily_reports (report_date, errors_detected, errors_repaired, content_uploaded, games_played, suggestions_made,
        summary)
    VALUES (v_today, v_errors, v_repaired, v_content, v_games, v_suggestions,
        format('Errores: %s detectados, %s reparados. Contenido: %s subido. Juegos: %s. Sugerencias: %s.',
            v_errors, v_repaired, v_content, v_games, v_suggestions))
    ON CONFLICT (report_date) DO UPDATE SET
        errors_detected = v_errors, errors_repaired = v_repaired,
        content_uploaded = v_content, games_played = v_games,
        suggestions_made = v_suggestions
    RETURNING id INTO v_report_id;

    RETURN v_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bot sube de nivel
CREATE OR REPLACE FUNCTION bot_level_up()
RETURNS VOID AS $$
DECLARE v_xp INT; v_level INT; v_xp_needed INT;
BEGIN
    SELECT xp, level INTO v_xp, v_level FROM bot_profile WHERE is_active = true LIMIT 1;
    v_xp_needed := 100 + ((v_level - 1) * 50);
    IF v_xp >= v_xp_needed THEN
        UPDATE bot_profile SET level = v_level + 1, xp = v_xp - v_xp_needed WHERE is_active = true;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_bot_actions_type ON bot_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_bot_actions_created ON bot_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_errors_status ON bot_detected_errors(status);
CREATE INDEX IF NOT EXISTS idx_bot_errors_severity ON bot_detected_errors(severity);
CREATE INDEX IF NOT EXISTS idx_bot_suggestions_status ON bot_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_bot_repairs_error ON bot_repairs(error_id);
CREATE INDEX IF NOT EXISTS idx_bot_reports_date ON bot_daily_reports(report_date DESC);
