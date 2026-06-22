-- =====================================================
-- C8L AGENT v20.0 — GUARDIÁN DE LA COMUNIDAD
-- Sistema de Bloqueos y Moderación Avanzado
-- =====================================================

-- Categorías de infracciones
CREATE TABLE IF NOT EXISTS infraction_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tipos de infracciones (25 tipos, todos ejecutables por bot)
CREATE TABLE IF NOT EXISTS infraction_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES infraction_categories(id),
    name TEXT NOT NULL,
    description TEXT,
    severity TEXT NOT NULL, -- 'leve', 'media', 'grave', 'critica'
    default_days INT, -- 0 = permanente
    is_auto_executable BOOLEAN DEFAULT true,
    requires_human_review BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Infracciones de usuarios
CREATE TABLE IF NOT EXISTS user_infractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    infraction_type_id UUID REFERENCES infraction_types(id),
    description TEXT,
    evidence JSONB,
    context JSONB,
    detected_by UUID, -- Bot o moderador
    status TEXT DEFAULT 'active',
    sanction_days INT,
    start_date TIMESTAMP DEFAULT NOW(),
    end_date TIMESTAMP,
    escalation_reason TEXT,
    escalated_to UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Sanciones activas
CREATE TABLE IF NOT EXISTS active_sanctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    infraction_id UUID REFERENCES user_infractions(id),
    sanction_type TEXT NOT NULL,
    days INT,
    start_date TIMESTAMP DEFAULT NOW(),
    end_date TIMESTAMP,
    reason TEXT,
    restrictions JSONB,
    is_permanent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Historial de advertencias (sistema 3-strikes)
CREATE TABLE IF NOT EXISTS user_warnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    infraction_id UUID REFERENCES user_infractions(id),
    warning_level INT DEFAULT 1,
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Sistema de apelaciones v2
CREATE TABLE IF NOT EXISTS moderation_appeals_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    infraction_id UUID REFERENCES user_infractions(id),
    appeal_text TEXT NOT NULL,
    appeal_evidence JSONB,
    status TEXT DEFAULT 'pending',
    reviewed_by UUID,
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP
);

-- Logs del bot moderador
CREATE TABLE IF NOT EXISTS bot_moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    target_user_id UUID REFERENCES users(id),
    details JSONB,
    detection_confidence FLOAT,
    requires_review BOOLEAN DEFAULT false,
    is_auto_executed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);


-- =====================================================
-- DATOS INICIALES
-- =====================================================

INSERT INTO infraction_categories (name, description, icon) VALUES
('Spam', 'Publicidad no autorizada y mensajes repetitivos', '📢'),
('Lenguaje', 'Lenguaje ofensivo y discurso de odio', '💬'),
('Acoso', 'Acoso y hostigamiento a otros usuarios', '🚫'),
('Amenazas', 'Amenazas y comportamiento intimidatorio', '⚠️'),
('Violencia', 'Apología o contenido violento', '💀'),
('Suplantación', 'Suplantación de identidad', '🎭'),
('Fraude', 'Estafas y manipulación', '💰'),
('Derechos', 'Violación de derechos y privacidad', '⚖️'),
('Comunidad', 'Comportamiento tóxico en la comunidad', '👥')
ON CONFLICT (name) DO NOTHING;

-- 25 tipos de infracciones ejecutables por el bot
INSERT INTO infraction_types (category_id, name, description, severity, default_days, is_auto_executable) VALUES
((SELECT id FROM infraction_categories WHERE name='Spam'), 'Publicidad no autorizada', 'Publicación de enlaces promocionales sin permiso', 'leve', 3, true),
((SELECT id FROM infraction_categories WHERE name='Spam'), 'Mensajes repetitivos', 'Envía el mismo mensaje múltiples veces', 'leve', 3, true),
((SELECT id FROM infraction_categories WHERE name='Spam'), 'Enlaces maliciosos', 'Publicación de enlaces sospechosos', 'media', 7, true),
((SELECT id FROM infraction_categories WHERE name='Lenguaje'), 'Lenguaje ofensivo', 'Uso de insultos o lenguaje inapropiado', 'leve', 3, true),
((SELECT id FROM infraction_categories WHERE name='Lenguaje'), 'Discurso de odio', 'Discurso que promueve odio hacia grupos', 'grave', 30, true),
((SELECT id FROM infraction_categories WHERE name='Lenguaje'), 'Incitación a la violencia', 'Incitación a actos violentos', 'critica', 0, true),
((SELECT id FROM infraction_categories WHERE name='Acoso'), 'Acoso verbal', 'Insultos reiterados y descalificaciones', 'media', 7, true),
((SELECT id FROM infraction_categories WHERE name='Acoso'), 'Acoso sexual', 'Comentarios sexuales no deseados', 'grave', 30, true),
((SELECT id FROM infraction_categories WHERE name='Acoso'), 'Acoso psicológico', 'Manipulación y hostigamiento', 'grave', 30, true),
((SELECT id FROM infraction_categories WHERE name='Acoso'), 'Acoso colectivo', 'Acoso grupal o manada', 'critica', 0, true),
((SELECT id FROM infraction_categories WHERE name='Amenazas'), 'Amenazas de muerte', 'Amenaza de muerte explícita', 'critica', 0, true),
((SELECT id FROM infraction_categories WHERE name='Amenazas'), 'Amenazas de daño físico', 'Amenaza de daño físico no letal', 'grave', 30, true),
((SELECT id FROM infraction_categories WHERE name='Violencia'), 'Apología de la violencia', 'Defensa de actos violentos', 'grave', 30, true),
((SELECT id FROM infraction_categories WHERE name='Violencia'), 'Contenido violento explícito', 'Contenido violento gráfico', 'critica', 0, true),
((SELECT id FROM infraction_categories WHERE name='Suplantación'), 'Suplantación de identidad', 'Hacerse pasar por otro usuario', 'critica', 0, true),
((SELECT id FROM infraction_categories WHERE name='Suplantación'), 'Suplantación de streamer', 'Hacerse pasar por streamer oficial', 'critica', 0, true),
((SELECT id FROM infraction_categories WHERE name='Fraude'), 'Estafa a usuarios', 'Intento de estafa o engaño', 'critica', 0, true),
((SELECT id FROM infraction_categories WHERE name='Fraude'), 'Manipulación de juegos', 'Trampas o manipulación en juegos', 'grave', 30, true),
((SELECT id FROM infraction_categories WHERE name='Derechos'), 'Violación de privacidad', 'Publicación de info privada sin consentimiento', 'grave', 30, true),
((SELECT id FROM infraction_categories WHERE name='Derechos'), 'Difusión de datos personales', 'Publicar datos personales de otros', 'critica', 0, true),
((SELECT id FROM infraction_categories WHERE name='Derechos'), 'Violación de derechos de autor', 'Uso de contenido con derechos sin permiso', 'media', 7, true),
((SELECT id FROM infraction_categories WHERE name='Derechos'), 'Uso indebido de imagen', 'Uso de imagen de otra persona sin permiso', 'grave', 30, true),
((SELECT id FROM infraction_categories WHERE name='Comunidad'), 'Comportamiento tóxico recurrente', 'Comportamiento tóxico que afecta la comunidad', 'media', 7, true),
((SELECT id FROM infraction_categories WHERE name='Comunidad'), 'Sabotaje de comunidad', 'Acciones que dañan la comunidad', 'grave', 30, true),
((SELECT id FROM infraction_categories WHERE name='Comunidad'), 'Incitación al odio', 'Incitación al odio contra la comunidad', 'critica', 0, true);

-- =====================================================
-- FUNCIONES RPC
-- =====================================================

-- Aplicar sanción automática
CREATE OR REPLACE FUNCTION auto_apply_sanction(
    p_user_id UUID, p_infraction_type TEXT, p_evidence JSONB, p_context JSONB
) RETURNS UUID AS $$
DECLARE v_type RECORD; v_infraction_id UUID; v_end_date TIMESTAMP;
BEGIN
    SELECT * INTO v_type FROM infraction_types WHERE name = p_infraction_type AND is_auto_executable = true LIMIT 1;
    IF NOT FOUND THEN RETURN NULL; END IF;

    v_end_date := CASE WHEN v_type.default_days > 0 THEN NOW() + (v_type.default_days || ' days')::INTERVAL ELSE NULL END;

    INSERT INTO user_infractions (user_id, infraction_type_id, description, evidence, context, detected_by, sanction_days, start_date, end_date)
    VALUES (p_user_id, v_type.id, v_type.description, p_evidence, p_context, NULL, v_type.default_days, NOW(), v_end_date)
    RETURNING id INTO v_infraction_id;

    INSERT INTO active_sanctions (user_id, infraction_id, sanction_type, days, start_date, end_date, reason, is_permanent)
    VALUES (p_user_id, v_infraction_id,
        CASE WHEN v_type.default_days = 0 THEN 'permanent_ban' ELSE 'temporary_ban' END,
        v_type.default_days, NOW(), v_end_date, v_type.description,
        v_type.default_days = 0);

    INSERT INTO bot_moderation_logs (action_type, target_user_id, details, detection_confidence, is_auto_executed)
    VALUES ('auto_sanction', p_user_id, jsonb_build_object('type', p_infraction_type, 'severity', v_type.severity, 'days', v_type.default_days), 0.9, true);

    RETURN v_infraction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verificar si usuario está sancionado
CREATE OR REPLACE FUNCTION is_user_sanctioned(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE v_sanction RECORD;
BEGIN
    -- Limpiar sanciones expiradas
    UPDATE active_sanctions SET is_permanent = false
    WHERE user_id = p_user_id AND end_date IS NOT NULL AND end_date < NOW() AND is_permanent = false;
    DELETE FROM active_sanctions WHERE user_id = p_user_id AND end_date IS NOT NULL AND end_date < NOW();

    SELECT * INTO v_sanction FROM active_sanctions WHERE user_id = p_user_id LIMIT 1;
    IF FOUND THEN
        RETURN jsonb_build_object('blocked', true, 'type', v_sanction.sanction_type, 'reason', v_sanction.reason, 'end_date', v_sanction.end_date, 'is_permanent', v_sanction.is_permanent);
    END IF;
    RETURN jsonb_build_object('blocked', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Levantar sanción
CREATE OR REPLACE FUNCTION lift_sanction(p_user_id UUID, p_reason TEXT)
RETURNS VOID AS $$
BEGIN
    DELETE FROM active_sanctions WHERE user_id = p_user_id;
    UPDATE user_infractions SET status = 'overturned', updated_at = NOW() WHERE user_id = p_user_id AND status = 'active';
    INSERT INTO bot_moderation_logs (action_type, target_user_id, details, is_auto_executed)
    VALUES ('lift_sanction', p_user_id, jsonb_build_object('reason', p_reason), false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_infractions_user ON user_infractions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_infractions_status ON user_infractions(status);
CREATE INDEX IF NOT EXISTS idx_active_sanctions_user ON active_sanctions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sanctions_permanent ON active_sanctions(is_permanent);
CREATE INDEX IF NOT EXISTS idx_bot_mod_logs_type ON bot_moderation_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_bot_mod_logs_created ON bot_moderation_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appeals_v2_status ON moderation_appeals_v2(status);
CREATE INDEX IF NOT EXISTS idx_warnings_user ON user_warnings(user_id);
