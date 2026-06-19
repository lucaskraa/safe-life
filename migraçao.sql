-- SAFE LIFE V21 — CORREÇÕES DE PERFIS E FOTOS PADRÃO
-- NÃO APAGA CONTAS, PETS, OCORRÊNCIAS OU DENÚNCIAS.

BEGIN;

UPDATE usuarios
SET foto_perfil = 'img/pequenochinique.jpeg'
WHERE cpf = '11111111111'
  AND COALESCE(TRIM(foto_perfil), '') = '';

UPDATE usuarios
SET foto_perfil = 'img/corredorzeca.jpeg'
WHERE cpf = '99999999999'
  AND COALESCE(TRIM(foto_perfil), '') = '';

UPDATE usuarios
SET foto_perfil = 'img/apenasumsiri.jpeg'
WHERE cpf = '45317828791'
  AND COALESCE(TRIM(foto_perfil), '') = '';

COMMIT;

SELECT 'Migração V21 concluída sem apagar dados' AS resultado;
