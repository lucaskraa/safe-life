-- =====================================================
-- SAFE LIFE V17 — MIGRAÇÃO SEGURA
-- NÃO APAGA USUÁRIOS, PETS OU CHAMADOS.
-- Execute uma única vez no SQL Editor do Supabase.
-- =====================================================

ALTER TABLE IF EXISTS ocorrencias
    ADD COLUMN IF NOT EXISTS concluido_em TIMESTAMP;

ALTER TABLE IF EXISTS denuncias_anonimas
    ADD COLUMN IF NOT EXISTS concluido_em TIMESTAMP;

ALTER TABLE IF EXISTS ocorrencias
    ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE IF EXISTS denuncias_anonimas
    ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS historico_ocorrencias (
    id SERIAL PRIMARY KEY,
    ocorrencia_id INTEGER,
    funcionario_id INTEGER,
    status_anterior status_ocorrencia_enum,
    status_novo status_ocorrencia_enum,
    acao VARCHAR(150),
    observacao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_historico_ocorrencia'
    ) THEN
        ALTER TABLE historico_ocorrencias
        ADD CONSTRAINT fk_historico_ocorrencia
        FOREIGN KEY (ocorrencia_id)
        REFERENCES ocorrencias(id)
        ON DELETE CASCADE;
    END IF;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_historico_funcionario'
    ) THEN
        ALTER TABLE historico_ocorrencias
        ADD CONSTRAINT fk_historico_funcionario
        FOREIGN KEY (funcionario_id)
        REFERENCES funcionarios(id)
        ON DELETE SET NULL;
    END IF;
END;
$$;

UPDATE usuarios
SET foto_perfil = 'img/pequenochinique.jpeg'
WHERE cpf = '11111111111';

UPDATE usuarios
SET foto_perfil = 'img/corredorzeca.jpeg'
WHERE cpf = '99999999999';

UPDATE usuarios
SET foto_perfil = 'img/apenasumsiri.jpeg'
WHERE cpf = '45317828791';

CREATE INDEX IF NOT EXISTS idx_ocorrencias_usuario_status
ON ocorrencias(usuario_id, status);

CREATE INDEX IF NOT EXISTS idx_ocorrencias_atendente_status
ON ocorrencias(atendente_id, status);

SELECT
    'Migração V17 concluída' AS resultado,
    COUNT(*) AS total_usuarios
FROM usuarios;
