-- Registros ilustrativos da landing: fotos de acervo, não imagens dos fatos.
-- Não altera ocorrências reais, denúncias anônimas, pets ou resgates.
ALTER TABLE public.ocorrencias_demo_landing ADD COLUMN IF NOT EXISTS foto_url TEXT;
UPDATE public.ocorrencias_demo_landing SET foto_url = CASE id
    WHEN 1 THEN './landing-cao-abrigo-primeiro-plano.jpg'
    WHEN 2 THEN './landing-abrigo-sobre.jpg'
    WHEN 3 THEN './landing-abrigo-cta-opcao.jpg'
    WHEN 4 THEN './landing-abrigo-hero-opcao.jpg'
    WHEN 5 THEN './landing-abrigo-hero.jpg'
    WHEN 6 THEN './landing-cao-abrigo-pb.jpg'
    WHEN 7 THEN './landing-cao-abrigo-primeiro-plano.jpg'
    WHEN 8 THEN './landing-abrigo-sobre.jpg'
    WHEN 9 THEN './landing-abrigo-hero.jpg'
    WHEN 10 THEN './landing-abrigo-hero-opcao.jpg'
    WHEN 11 THEN './landing-abrigo-cta.jpg'
    WHEN 12 THEN './landing-cao-abrigo-pb.jpg'
    ELSE foto_url END
WHERE demonstrativa = TRUE AND id BETWEEN 1 AND 12;
