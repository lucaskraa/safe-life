-- =====================================================
-- SAFE LIFE — LIMPEZA DEFINITIVA DOS DADOS DE DEMONSTRAÇÃO
-- Execute UMA VEZ no Supabase > SQL Editor > New query > Run.
-- Mantém as denúncias reais e remove somente os exemplos antigos.
-- =====================================================

BEGIN;

CREATE TEMP TABLE demo_occurrence_ids AS
SELECT id
FROM ocorrencias
WHERE
       (LOWER(COALESCE(assunto, '')) = 'animal na rua'
        AND LOWER(COALESCE(localizacao, '')) LIKE 'rua das flores%')
    OR (LOWER(COALESCE(assunto, '')) = 'animal ferido'
        AND LOWER(COALESCE(localizacao, '')) LIKE 'avenida principal%')
    OR LOWER(COALESCE(detalhes, '')) LIKE '%cachorro assustado%próximo aos carros%'
    OR LOWER(COALESCE(detalhes, '')) LIKE '%gato aparentemente ferido%parado na calçada%'
    OR COALESCE(foto, '') LIKE '%photo-1558788353-f76d92427f16%'
    OR COALESCE(foto, '') LIKE '%photo-1574158622682-e40e69881006%';

DELETE FROM historico_ocorrencias
WHERE ocorrencia_id IN (SELECT id FROM demo_occurrence_ids);

DELETE FROM ocorrencias
WHERE id IN (SELECT id FROM demo_occurrence_ids);

DELETE FROM denuncias_anonimas
WHERE
       (LOWER(COALESCE(assunto, '')) = 'sem água e comida'
        AND LOWER(COALESCE(localizacao, '')) LIKE 'rua esperança%')
    OR (LOWER(COALESCE(assunto, '')) = 'animal acorrentado'
        AND LOWER(COALESCE(localizacao, '')) LIKE 'travessa das palmeiras%')
    OR LOWER(COALESCE(detalhes, '')) LIKE '%cachorro preso no quintal%sem água%'
    OR LOWER(COALESCE(detalhes, '')) LIKE '%animal fica acorrentado o dia inteiro%'
    OR COALESCE(foto, '') LIKE '%photo-1583512603805-3cc6b41f3edb%'
    OR COALESCE(foto, '') LIKE '%photo-1596492784531-6e6eb5ea9993%';

UPDATE usuarios
SET foto_perfil = CASE cpf
    WHEN '11111111111' THEN 'img/pequenochinique.jpeg'
    WHEN '99999999999' THEN 'img/corredorzeca.jpeg'
    WHEN '45317828791' THEN 'img/apenasumsiri.jpeg'
    ELSE foto_perfil
END
WHERE cpf IN ('11111111111', '99999999999', '45317828791');

COMMIT;

-- Resultado esperado: zero linhas para os exemplos antigos.
SELECT id, assunto, localizacao, status
FROM ocorrencias
WHERE
       LOWER(COALESCE(localizacao, '')) LIKE 'rua das flores%'
    OR LOWER(COALESCE(localizacao, '')) LIKE 'avenida principal%';

SELECT id, assunto, localizacao, status
FROM denuncias_anonimas
WHERE
       LOWER(COALESCE(localizacao, '')) LIKE 'rua esperança%'
    OR LOWER(COALESCE(localizacao, '')) LIKE 'travessa das palmeiras%';
