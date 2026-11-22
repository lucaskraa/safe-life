-- Safe Life: dados fictícios usados exclusivamente na landing do TCC.
-- Execute com privilégios de migração. Não altera tabelas operacionais.
CREATE TABLE IF NOT EXISTS public.ocorrencias_demo_landing (
  id INTEGER PRIMARY KEY,
  bairro TEXT NOT NULL,
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  texto TEXT NOT NULL,
  acao TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open','progress','done')),
  lat NUMERIC(9,6) NOT NULL,
  lng NUMERIC(9,6) NOT NULL,
  demonstrativa BOOLEAN NOT NULL DEFAULT TRUE CHECK (demonstrativa = TRUE)
);
ALTER TABLE public.ocorrencias_demo_landing ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ocorrencias_demo_landing FROM anon, authenticated;
INSERT INTO public.ocorrencias_demo_landing (id,bairro,tipo,titulo,texto,acao,status,lat,lng) VALUES
  (1, 'Centro', 'Abandono', 'Animal abandonado', 'Cão encontrado desacompanhado em uma praça, aparentemente debilitado.', 'Registro demonstrativo de acolhimento e avaliação veterinária.', 'done', -25.592000, -49.409000),
  (2, 'Capela Velha', 'Maus-tratos', 'Suspeita de maus-tratos', 'Relato fictício de cão mantido sem abrigo adequado.', 'Registro demonstrativo encaminhado para vistoria.', 'progress', -25.553000, -49.404000),
  (3, 'Iguaçu', 'Desaparecimento', 'Gato desaparecido', 'Tutor procura gato rajado desaparecido nas proximidades do bairro.', 'Divulgação demonstrativa e organização das informações.', 'open', -25.598000, -49.398000),
  (4, 'Costeira', 'Resgate', 'Filhote em risco', 'Filhote localizado em área de risco durante chuva.', 'Simulação de encaminhamento para equipe de resgate.', 'done', -25.606000, -49.372000),
  (5, 'Fazenda Velha', 'Abandono', 'Ninhada abandonada', 'Ninhada encontrada sem responsável próximo a uma área verde.', 'Solicitação demonstrativa de acolhimento.', 'progress', -25.583000, -49.394000),
  (6, 'Porto das Laranjeiras', 'Maus-tratos', 'Animal sem cuidados', 'Relato fictício de animal sem acesso regular à água.', 'Registro demonstrativo em análise.', 'open', -25.578000, -49.431000),
  (7, 'Estação', 'Resgate', 'Cão ferido', 'Cão encontrado com dificuldade de locomoção.', 'Simulação de atendimento e encaminhamento clínico.', 'done', -25.591000, -49.420000),
  (8, 'Tindiquera', 'Desaparecimento', 'Cachorra desaparecida', 'Família busca cadela de porte médio desaparecida.', 'Divulgação demonstrativa nas proximidades.', 'open', -25.614000, -49.414000),
  (9, 'Thomaz Coelho', 'Abandono', 'Cão deixado na rua', 'Cão encontrado desacompanhado em via pública.', 'Simulação de acionamento da rede de apoio.', 'progress', -25.568000, -49.366000),
  (10, 'Campina da Barra', 'Maus-tratos', 'Suspeita de negligência', 'Moradores relatam animal exposto ao tempo sem abrigo.', 'Registro fictício para avaliação de prioridade.', 'open', -25.627000, -49.405000),
  (11, 'Cachoeira', 'Resgate', 'Gato preso', 'Gato encontrado em local de difícil acesso.', 'Simulação de resgate realizado em segurança.', 'done', -25.557000, -49.435000),
  (12, 'Boqueirão', 'Abandono', 'Animal em situação de rua', 'Animal aparentemente sem tutor visto próximo a comércio.', 'Solicitação fictícia de avaliação e acolhimento.', 'progress', -25.608000, -49.447000)
ON CONFLICT (id) DO NOTHING;
