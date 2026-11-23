-- Safe Life: remover marcas textuais de testes em registros de demonstração.
-- Mantém demonstrativo = TRUE internamente e preserva registros operacionais reais.
UPDATE public.ocorrencias
SET
  detalhes = trim(regexp_replace(detalhes, '^[[:space:]]*\[EXEMPLO ILUSTRATIVO\][[:space:]]*', '', 'i')),
  localizacao = trim(regexp_replace(localizacao, '[[:space:]]*\(exemplo\)', '', 'gi')),
  endereco_completo = trim(regexp_replace(endereco_completo, '[[:space:]]*\(exemplo\)', '', 'gi'))
WHERE demonstrativo = TRUE
  AND (
    detalhes ~* '^[[:space:]]*\[EXEMPLO ILUSTRATIVO\]'
    OR localizacao ~* '\(exemplo\)'
    OR endereco_completo ~* '\(exemplo\)'
  );
