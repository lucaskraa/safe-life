-- Safe Life V26 — limpeza final do ambiente de demonstração.
-- Mantém intactos:
--   • usuários e as três contas públicas;
--   • funcionários e perfis;
--   • empresas;
--   • pets cadastrados;
--   • funções, views, índices, triggers e estrutura do banco.
--
-- Remove somente histórico operacional/de testes para entregar o TCC limpo.

BEGIN;

TRUNCATE TABLE
    historico_ocorrencias,
    ocorrencias,
    denuncias_anonimas,
    notificacoes,
    eventos_tempo_real,
    resgates_pets,
    bloqueios_conta,
    auditoria_seguranca,
    tentativas_login
RESTART IDENTITY;

COMMIT;

SELECT
    (SELECT COUNT(*) FROM ocorrencias) AS ocorrencias,
    (SELECT COUNT(*) FROM denuncias_anonimas) AS denuncias_anonimas,
    (SELECT COUNT(*) FROM historico_ocorrencias) AS historico_ocorrencias,
    (SELECT COUNT(*) FROM notificacoes) AS notificacoes,
    (SELECT COUNT(*) FROM eventos_tempo_real) AS eventos_tempo_real,
    (SELECT COUNT(*) FROM resgates_pets) AS resgates_pets,
    (SELECT COUNT(*) FROM auditoria_seguranca) AS auditoria,
    (SELECT COUNT(*) FROM tentativas_login) AS tentativas_login;
