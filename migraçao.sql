-- =====================================================
-- SAFE LIFE V21.3
-- PROFISSIONAIS CRIADOS SOMENTE PELO ADMINISTRADOR
-- NÃO APAGA CONTAS, PETS OU OCORRÊNCIAS.
-- =====================================================

BEGIN;

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS troca_senha_obrigatoria
BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE funcionarios
ADD COLUMN IF NOT EXISTS registro_profissional VARCHAR(80);

CREATE UNIQUE INDEX IF NOT EXISTS
idx_funcionarios_registro_profissional_unico
ON funcionarios (LOWER(BTRIM(registro_profissional)))
WHERE registro_profissional IS NOT NULL
  AND BTRIM(registro_profissional) <> '';

-- Profissionais antigos continuam entrando com a senha atual.
UPDATE usuarios
SET troca_senha_obrigatoria = FALSE
WHERE tipo = 'professional'
  AND troca_senha_obrigatoria IS NULL;

COMMIT;

SELECT
    'Safe Life V21.3 instalado: profissionais somente pelo admin'
    AS resultado;
