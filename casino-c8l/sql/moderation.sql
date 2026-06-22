-- =====================================================
-- SISTEMA DE MODERACIÓN C8L
-- =====================================================

-- Infracciones registradas
CREATE TABLE IF NOT EXISTS moderation_infractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES users(id),
    type TEXT NOT NULL, -- 'spam', 'offensive_language', 'harassment_light', 'inappropriate_content', 'harassment_severe', 'threats', 'violence', 'rights_violation', 'crime'
    severity TEXT NOT NULL, -- 'light', 'medium', 'severe', 'critical'
    description TEXT,
    evidence JSONB, -- screenshots, message IDs, etc.
    context TEXT, -- donde ocurrió: 'chat', 'live', 'cover', 'casino', 'faction'
    status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'dismissed', 'appealed'
    reviewed_by UUID,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Bloqueos activos
CREATE TABLE IF NOT EXISTS moderation_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    infraction_id UUID REFERENCES moderation_infractions(id),
    block_type TEXT NOT NULL, -- 'light', 'medium', 'severe', 'permanent'
    reason TEXT NOT NULL,
    starts_at TIMESTAMP DEFAULT NOW(),
    ends_at TIMESTAMP, -- NULL = permanente
    is_active BOOLEAN DEFAULT true,
    lifted_by UUID,
    lifted_at TIMESTAMP,
    lift_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Historial de moderación del usuario
CREATE TABLE IF NOT EXISTS moderation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'warning', 'mute', 'block', 'unblock', 'appeal', 'appeal_accepted', 'appeal_rejected'
    details TEXT,
    performed_by UUID, -- moderador o bot
    created_at TIMESTAMP DEFAULT NOW()
);

-- Apelaciones
CREATE TABLE IF NOT EXISTS moderation_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_id UUID REFERENCES moderation_blocks(id),
    user_id UUID REFERENCES users(id),
    reason TEXT NOT NULL,
    evidence TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    reviewed_by UUID,
    reviewed_at TIMESTAMP,
    response TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Reportes de usuarios
CREATE TABLE IF NOT EXISTS moderation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES users(id),
    reported_user_id UUID REFERENCES users(id),
    reason TEXT NOT NULL,
    description TEXT,
    evidence JSONB,
    context TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'action_taken', 'dismissed'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Palabras/patrones prohibidos
CREATE TABLE IF NOT EXISTS moderation_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern TEXT NOT NULL,
    type TEXT DEFAULT 'word', -- 'word', 'regex', 'phrase'
    severity TEXT DEFAULT 'light',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- CONFIGURACIÓN DE BLOQUEOS
-- =====================================================

CREATE TABLE IF NOT EXISTS moderation_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    severity TEXT UNIQUE NOT NULL,
    block_duration_days INT, -- NULL = permanente
    description TEXT,
    examples TEXT[],
    auto_detect BOOLEAN DEFAULT false,
    requires_review BOOLEAN DEFAULT true
);

INSERT INTO moderation_config (severity, block_duration_days, description, examples, auto_detect, requires_review) VALUES
('light', 3, 'Bloqueo leve: 3 días', ARRAY['Spam repetitivo', 'Lenguaje ofensivo leve', 'Flood en chat'], true, false),
('medium', 7, 'Bloqueo medio: 7 días', ARRAY['Acoso leve', 'Contenido inapropiado', 'Suplantación de identidad', 'Manipulación de votos'], true, true),
('severe', 30, 'Bloqueo grave: 30 días', ARRAY['Acoso grave', 'Amenazas', 'Contenido violento', 'Discurso de odio'], false, true),
('critical', NULL, 'Bloqueo permanente', ARRAY['Invasión de derechos', 'Delitos', 'Explotación', 'Fraude grave'], false, true)
ON CONFLICT (severity) DO NOTHING;

-- Palabras prohibidas iniciales
INSERT INTO moderation_blacklist (pattern, type, severity) VALUES
('spam', 'word', 'light'),
('compra aquí', 'phrase', 'light'),
('http://bit.ly', 'phrase', 'light')
ON CONFLICT DO NOTHING;


-- =====================================================
-- FUNCIONES RPC DE MODERACIÓN
-- =====================================================

-- Reportar usuario
CREATE OR REPLACE FUNCTION report_user(
    p_reporter_id UUID, p_reported_user_id UUID, p_reason TEXT, p_description TEXT, p_context TEXT
) RETURNS UUID AS $$
DECLARE v_report_id UUID;
BEGIN
    INSERT INTO moderation_reports (reporter_id, reported_user_id, reason, description, context)
    VALUES (p_reporter_id, p_reported_user_id, p_reason, p_description, p_context)
    RETURNING id INTO v_report_id;
    RETURN v_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear infracción (auto o manual)
CREATE OR REPLACE FUNCTION create_infraction(
    p_user_id UUID, p_type TEXT, p_severity TEXT, p_description TEXT, p_context TEXT, p_reported_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE v_infraction_id UUID; v_config RECORD;
BEGIN
    INSERT INTO moderation_infractions (user_id, reported_by, type, severity, description, context)
    VALUES (p_user_id, p_reported_by, p_type, p_severity, p_description, p_context)
    RETURNING id INTO v_infraction_id;

    SELECT * INTO v_config FROM moderation_config WHERE severity = p_severity;

    -- Auto-bloquear si no requiere revisión
    IF v_config.requires_review = false THEN
        PERFORM apply_block(p_user_id, v_infraction_id, p_severity, p_description);
    END IF;

    RETURN v_infraction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar bloqueo
CREATE OR REPLACE FUNCTION apply_block(
    p_user_id UUID, p_infraction_id UUID, p_severity TEXT, p_reason TEXT
) RETURNS UUID AS $$
DECLARE v_block_id UUID; v_days INT; v_ends_at TIMESTAMP;
BEGIN
    SELECT block_duration_days INTO v_days FROM moderation_config WHERE severity = p_severity;
    v_ends_at := CASE WHEN v_days IS NOT NULL THEN NOW() + (v_days || ' days')::INTERVAL ELSE NULL END;

    INSERT INTO moderation_blocks (user_id, infraction_id, block_type, reason, starts_at, ends_at, is_active)
    VALUES (p_user_id, p_infraction_id, p_severity, p_reason, NOW(), v_ends_at, true)
    RETURNING id INTO v_block_id;

    INSERT INTO moderation_history (user_id, action, details)
    VALUES (p_user_id, 'block', format('Bloqueo %s: %s', p_severity, COALESCE(v_days || ' días', 'permanente')));

    RETURN v_block_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar si usuario está bloqueado
CREATE OR REPLACE FUNCTION is_user_blocked(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Desactivar bloqueos expirados
    UPDATE moderation_blocks SET is_active = false
    WHERE user_id = p_user_id AND is_active = true AND ends_at IS NOT NULL AND ends_at < NOW();

    RETURN EXISTS (SELECT 1 FROM moderation_blocks WHERE user_id = p_user_id AND is_active = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-detectar contenido prohibido
CREATE OR REPLACE FUNCTION check_content_moderation(p_user_id UUID, p_content TEXT, p_context TEXT)
RETURNS JSONB AS $$
DECLARE v_pattern RECORD; v_result JSONB := '{"flagged": false}'::JSONB;
BEGIN
    FOR v_pattern IN SELECT * FROM moderation_blacklist WHERE is_active = true
    LOOP
        IF v_pattern.type = 'word' AND p_content ILIKE '%' || v_pattern.pattern || '%' THEN
            v_result := jsonb_build_object('flagged', true, 'pattern', v_pattern.pattern, 'severity', v_pattern.severity);
            PERFORM create_infraction(p_user_id, 'auto_detected', v_pattern.severity, 'Contenido prohibido: ' || v_pattern.pattern, p_context);
            EXIT;
        ELSIF v_pattern.type = 'phrase' AND p_content ILIKE '%' || v_pattern.pattern || '%' THEN
            v_result := jsonb_build_object('flagged', true, 'pattern', v_pattern.pattern, 'severity', v_pattern.severity);
            PERFORM create_infraction(p_user_id, 'auto_detected', v_pattern.severity, 'Frase prohibida: ' || v_pattern.pattern, p_context);
            EXIT;
        END IF;
    END LOOP;
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Contar infracciones de un usuario (para escalado)
CREATE OR REPLACE FUNCTION get_user_infraction_count(p_user_id UUID)
RETURNS INT AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM moderation_infractions WHERE user_id = p_user_id AND status = 'confirmed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_mod_infractions_user ON moderation_infractions(user_id);
CREATE INDEX IF NOT EXISTS idx_mod_infractions_status ON moderation_infractions(status);
CREATE INDEX IF NOT EXISTS idx_mod_infractions_severity ON moderation_infractions(severity);
CREATE INDEX IF NOT EXISTS idx_mod_blocks_user ON moderation_blocks(user_id);
CREATE INDEX IF NOT EXISTS idx_mod_blocks_active ON moderation_blocks(is_active);
CREATE INDEX IF NOT EXISTS idx_mod_reports_status ON moderation_reports(status);
CREATE INDEX IF NOT EXISTS idx_mod_appeals_status ON moderation_appeals(status);
CREATE INDEX IF NOT EXISTS idx_mod_history_user ON moderation_history(user_id);
