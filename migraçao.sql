-- SAFE LIFE V20 — MIGRAÇÃO ONLINE FIRST
-- Não apaga usuários, pets, ocorrências ou notificações.
BEGIN;

CREATE TABLE IF NOT EXISTS eventos_tempo_real (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    audiencia VARCHAR(30) NOT NULL DEFAULT 'ALL',
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_evento VARCHAR(80) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_evento_audiencia CHECK (audiencia IN ('ALL', 'PROFESSIONALS', 'ADMINS', 'USER'))
);

CREATE INDEX IF NOT EXISTS idx_eventos_tempo_real_audiencia_id
ON eventos_tempo_real(audiencia, usuario_id, id);

CREATE INDEX IF NOT EXISTS idx_eventos_tempo_real_data
ON eventos_tempo_real(criado_em DESC);

ALTER TABLE eventos_tempo_real ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE eventos_tempo_real FROM anon, authenticated;

COMMIT;
SELECT 'Migração V20 online concluída' AS resultado;
