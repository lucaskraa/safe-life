-- Safe Life: usar a mesma ocorrência identificada para cidadão, equipe e mapa.
-- Migração idempotente; não publica denúncias anônimas nem dados pessoais.
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS demonstrativo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.ocorrencias ADD COLUMN IF NOT EXISTS demo_origem_id INTEGER;
CREATE UNIQUE INDEX IF NOT EXISTS idx_ocorrencias_demo_origem_id ON public.ocorrencias(demo_origem_id);
-- Interromper definitivamente os gatilhos que publicavam denúncias anônimas.
DROP TRIGGER IF EXISTS sl_vitrine_ao_criar_anonima ON public.denuncias_anonimas;
DROP TRIGGER IF EXISTS sl_vitrine_ao_atualizar_anonima ON public.denuncias_anonimas;
CREATE OR REPLACE FUNCTION public.safe_life_atualizar_vitrine_por_ocorrencia()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  fonte_nova TEXT;
  bairro_novo TEXT;
  tipo_novo TEXT;
  titulo_novo TEXT;
  status_novo TEXT;
  foto_nova TEXT;
  pos_lat NUMERIC(9,6);
  pos_lng NUMERIC(9,6);
  id_a_substituir BIGINT;
  quantidade INTEGER;
  descricao TEXT;
BEGIN
  IF TG_TABLE_NAME <> 'ocorrencias' THEN RETURN NEW; END IF;
  IF NEW.anonima OR NEW.usuario_id IS NULL THEN RETURN NEW; END IF;
  fonte_nova := 'ocorrencia';
  status_novo := CASE
    WHEN NEW.status::text = 'EM_ATENDIMENTO' THEN 'progress'
    WHEN NEW.status::text IN ('CONCLUIDA','CANCELADA') THEN 'done'
    ELSE 'open' END;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      UPDATE public.landing_casos_publicos
      SET status = status_novo
      WHERE fonte = fonte_nova AND origem_id = NEW.id;
    END IF;
    RETURN NEW;
  END IF;

  -- Apenas criacao de denuncia provoca troca de cartao.
  PERFORM pg_advisory_xact_lock(20261123, 12);

  IF EXISTS (SELECT 1 FROM public.landing_casos_publicos WHERE fonte = fonte_nova AND origem_id = NEW.id)
  THEN RETURN NEW; END IF;

  -- Bairro publicado so em lista de bairros conhecida; nao publicar rua.
  bairro_novo := CASE
    WHEN lower(coalesce(NEW.bairro,'')) LIKE '%centro%' THEN 'Centro'
    WHEN lower(coalesce(NEW.bairro,'')) LIKE '%capela velha%' THEN 'Capela Velha'
    WHEN lower(coalesce(NEW.bairro,'')) LIKE '%iguaçu%' THEN 'Iguaçu'
    WHEN lower(coalesce(NEW.bairro,'')) LIKE '%costeira%' THEN 'Costeira'
    WHEN lower(coalesce(NEW.bairro,'')) LIKE '%fazenda velha%' THEN 'Fazenda Velha'
    WHEN lower(coalesce(NEW.bairro,'')) LIKE '%laranjeiras%' THEN 'Porto das Laranjeiras'
    WHEN lower(coalesce(NEW.bairro,'')) LIKE '%estação%' THEN 'Estação'
    WHEN lower(coalesce(NEW.bairro,'')) LIKE '%tindiquera%' THEN 'Tindiquera'
    WHEN lower(coalesce(NEW.bairro,'')) LIKE '%thomaz coelho%' THEN 'Thomaz Coelho'
    WHEN lower(coalesce(NEW.bairro,'')) LIKE '%campina da barra%' THEN 'Campina da Barra'
    WHEN lower(coalesce(NEW.bairro,'')) LIKE '%cachoeira%' THEN 'Cachoeira'
    WHEN lower(coalesce(NEW.bairro,'')) LIKE '%boqueirão%' THEN 'Boqueirão'
    ELSE 'Araucária' END;

  -- NUNCA usar as coordenadas exatas de uma denuncia.
  SELECT d.lat,d.lng INTO pos_lat,pos_lng
  FROM public.ocorrencias_demo_landing d
  WHERE lower(d.bairro) = lower(bairro_novo)
  LIMIT 1;
  pos_lat := coalesce(pos_lat, -25.593);
  pos_lng := coalesce(pos_lng, -49.405);

  descricao := lower(coalesce(NEW.categoria,'') || ' ' || coalesce(NEW.tipo,'') || ' ' || coalesce(NEW.assunto,''));
  IF descricao LIKE '%maus%trato%' OR descricao LIKE '%neglig%' THEN
    tipo_novo := 'Maus-tratos';
    titulo_novo := 'Suspeita de maus-tratos';
    foto_nova := './landing-abrigo-sobre.jpg';
  ELSIF descricao LIKE '%resgate%' OR descricao LIKE '%emerg%' OR descricao LIKE '%socorro%' THEN
    tipo_novo := 'Resgate';
    titulo_novo := 'Solicitacao de resgate';
    foto_nova := './landing-cao-abrigo-primeiro-plano.jpg';
  ELSIF descricao LIKE '%desaparec%' OR descricao LIKE '%perdid%' THEN
    tipo_novo := 'Desaparecimento';
    titulo_novo := 'Animal desaparecido';
    foto_nova := './landing-abrigo-cta-opcao.jpg';
  ELSIF descricao LIKE '%abandono%' OR descricao LIKE '%abandon%' THEN
    tipo_novo := 'Abandono';
    titulo_novo := 'Situacao de abandono';
    foto_nova := './landing-abrigo-hero.jpg';
  ELSE
    tipo_novo := 'Ocorrência';
    titulo_novo := 'Ocorrência registrada';
    foto_nova := './landing-abrigo-hero-opcao.jpg';
  END IF;

  SELECT count(*)::int INTO quantidade FROM public.landing_casos_publicos;
  IF quantidade >= 12 THEN
    SELECT id INTO id_a_substituir FROM public.landing_casos_publicos
    ORDER BY
      CASE WHEN EXISTS (SELECT 1 FROM public.ocorrencias o WHERE o.id = origem_id AND o.demonstrativo) THEN 0 WHEN status = 'done' THEN 1 ELSE 2 END,
      inserido_em ASC, id ASC
    LIMIT 1 FOR UPDATE;
    DELETE FROM public.landing_casos_publicos WHERE id = id_a_substituir;
  END IF;

  INSERT INTO public.landing_casos_publicos
  (fonte,origem_id,bairro,tipo,titulo,texto,acao,status,lat,lng,foto_url)
  VALUES (
    fonte_nova,NEW.id,bairro_novo,tipo_novo,titulo_novo,
    'Nova comunicação sobre ' || lower(tipo_novo) || ' na região de ' || bairro_novo || '. Os dados completos ficam restritos à equipe.',
    'Registro recebido para triagem e acompanhamento.',status_novo,pos_lat,pos_lng,foto_nova
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Vitrine publica: nao foi possivel sincronizar a ocorrencia (SQLSTATE %)', SQLSTATE;
  RETURN NEW; -- nao bloquear uma denuncia por falha do recurso publico
END;
$function$;



-- Converte exemplos conhecidos do mapa em ocorrências explicitamente ilustrativas.
-- Apenas a conta de demonstração Antonio Cidadão é usada; nenhum registro real
-- preexistente recebe autoria falsa, e nenhum cidadão comum é alterado.
INSERT INTO public.ocorrencias
(usuario_id, tipo, categoria, assunto, opcao_escolhida, localizacao,
 detalhes, foto, latitude, longitude, endereco_completo, bairro, cidade, estado,
 status, prioridade, anonima, demonstrativo, demo_origem_id)
SELECT u.id,
 CASE WHEN d.tipo='Resgate' THEN 'Solicitar Resgate' ELSE 'Ocorrência Animal' END,
 CASE WHEN d.tipo='Resgate' THEN 'rescue' ELSE 'report' END,
 d.titulo, d.titulo,
 d.bairro || ', Araucária – PR (exemplo)',
 '[EXEMPLO ILUSTRATIVO] ' || d.texto,
 NULL, NULL, NULL,
 d.bairro || ', Araucária – PR (exemplo)', d.bairro, 'Araucária', 'PR',
 CASE d.status WHEN 'progress' THEN 'EM_ATENDIMENTO'::status_ocorrencia_enum
               ELSE 'PENDENTE'::status_ocorrencia_enum END,
 'NORMAL'::prioridade_enum, FALSE, TRUE, d.id
FROM public.ocorrencias_demo_landing d
JOIN public.usuarios u ON u.cpf = '11111111111' AND u.tipo = 'citizen'
WHERE d.demonstrativa=TRUE AND d.status <> 'done'
ON CONFLICT (demo_origem_id) DO NOTHING;

-- As projeções públicas de denúncias anônimas e exemplos soltos são retiradas;
-- os registros de origem continuam no banco, sem perder o histórico.
DELETE FROM public.landing_casos_publicos WHERE fonte IN ('anonima','demo');

-- Remover eventuais projeções oriundas de ocorrências não identificadas.
DELETE FROM public.landing_casos_publicos p WHERE p.fonte='ocorrencia'
AND NOT EXISTS (SELECT 1 FROM public.ocorrencias o WHERE o.id=p.origem_id AND o.usuario_id IS NOT NULL AND NOT o.anonima);
