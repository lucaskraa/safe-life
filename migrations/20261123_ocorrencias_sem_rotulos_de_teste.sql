-- Safe Life: retirar rótulos visuais dos registros demonstrativos sem remover sua origem.
-- Não altera ocorrências reais, o indicador interno demonstrativo ou o histórico.
UPDATE public.ocorrencias
SET
  detalhes = trim(regexp_replace(detalhes, '^\\s*\\[EXEMPLO ILUSTRATIVO\\]\\s*', '', 'i')),
  localizacao = trim(regexp_replace(localizacao, '\\s*\\(exemplo\\)', '', 'gi')),
  endereco_completo = trim(regexp_replace(endereco_completo, '\\s*\\(exemplo\\)', '', 'gi'))
WHERE demonstrativo = TRUE
  AND (
    detalhes ~* '^\\s*\\[EXEMPLO ILUSTRATIVO\\]'
    OR localizacao ~* '\\(exemplo\\)'
    OR endereco_completo ~* '\\(exemplo\\)'
  );
