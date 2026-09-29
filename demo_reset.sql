-- Safe Life V25 - restauração do ambiente de demonstração.
-- Remove somente dados de ocorrências/chamados e notificações relacionadas.
-- Não apaga usuários, funcionários, empresas ou pets.

BEGIN;

DELETE FROM notificacoes
WHERE tipo LIKE 'OCORRENCIA_%';

DELETE FROM eventos_tempo_real
WHERE tipo_evento IN (
    'new_occurrence',
    'queue_changed',
    'occurrence_updated',
    'admin_changed'
);

TRUNCATE TABLE
    historico_ocorrencias,
    ocorrencias,
    denuncias_anonimas
RESTART IDENTITY CASCADE;

COMMIT;
