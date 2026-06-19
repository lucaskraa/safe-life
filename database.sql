-- =============================================================
-- SAFE LIFE V20 — BANCO COMPLETO ONLINE FIRST DE PRODUÇÃO / SUPABASE
-- Atualização segura: não apaga contas, pets ou chamados reais.
-- Pode ser executado no SQL Editor do Supabase.
-- =============================================================

BEGIN;

-- =============================================================
-- TIPOS
-- =============================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_usuario_enum') THEN
        CREATE TYPE tipo_usuario_enum AS ENUM ('citizen', 'professional', 'admin');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_ocorrencia_enum') THEN
        CREATE TYPE status_ocorrencia_enum AS ENUM ('PENDENTE', 'EM_ATENDIMENTO', 'CONCLUIDA', 'CANCELADA');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prioridade_enum') THEN
        CREATE TYPE prioridade_enum AS ENUM ('BAIXA', 'NORMAL', 'ALTA', 'CRITICA');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nivel_acesso_enum') THEN
        CREATE TYPE nivel_acesso_enum AS ENUM ('operador', 'supervisor', 'administrador');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sexo_pet_enum') THEN
        CREATE TYPE sexo_pet_enum AS ENUM ('MACHO', 'FEMEA', 'NAO_INFORMADO');
    END IF;
END;
$$;

-- =============================================================
-- FUNÇÕES DE APOIO
-- =============================================================

CREATE OR REPLACE FUNCTION atualizar_data_modificacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================
-- TABELAS PRINCIPAIS
-- =============================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(200) NOT NULL,
    cpf VARCHAR(11) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(30) NOT NULL,
    tipo tipo_usuario_enum NOT NULL DEFAULT 'citizen',
    empresa VARCHAR(255),
    foto_perfil TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    bloqueado_em TIMESTAMPTZ,
    bloqueado_ate TIMESTAMPTZ,
    bloqueado_por INTEGER,
    motivo_bloqueio TEXT,
    excluida_em TIMESTAMPTZ,
    session_version INTEGER NOT NULL DEFAULT 1,
    ultimo_login TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_usuario_cpf CHECK (cpf ~ '^[0-9]{11}$'),
    CONSTRAINT chk_usuario_email CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
    CONSTRAINT chk_session_version CHECK (session_version >= 1)
);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bloqueado_em TIMESTAMPTZ;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bloqueado_ate TIMESTAMPTZ;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS bloqueado_por INTEGER;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS motivo_bloqueio TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS excluida_em TIMESTAMPTZ;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS empresas (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(200) UNIQUE NOT NULL,
    tipo VARCHAR(100) NOT NULL DEFAULT 'Empresa parceira',
    cnpj VARCHAR(30),
    telefone VARCHAR(30),
    email VARCHAR(255),
    endereco TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS funcionarios (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
    cargo VARCHAR(100),
    empresa VARCHAR(255) NOT NULL,
    nivel_acesso nivel_acesso_enum NOT NULL DEFAULT 'operador',
    registro_profissional VARCHAR(80),
    especialidade VARCHAR(150),
    regiao_atendimento VARCHAR(200),
    status_plantao VARCHAR(80) NOT NULL DEFAULT 'Disponível',
    veiculo VARCHAR(120),
    equipe VARCHAR(120),
    bio_profissional TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pets (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    idade INTEGER NOT NULL DEFAULT 0,
    especie VARCHAR(100) NOT NULL DEFAULT 'Animal',
    raca VARCHAR(100),
    sexo sexo_pet_enum NOT NULL DEFAULT 'NAO_INFORMADO',
    cor VARCHAR(100),
    peso NUMERIC(10,2),
    localizacao TEXT,
    observacoes TEXT,
    foto TEXT,
    desaparecido BOOLEAN NOT NULL DEFAULT FALSE,
    status_pet VARCHAR(50) NOT NULL DEFAULT 'CADASTRADO',
    local_desaparecimento TEXT,
    detalhes_desaparecimento TEXT,
    desaparecido_em TIMESTAMPTZ,
    encontrado_em TIMESTAMPTZ,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_pet_idade CHECK (idade >= 0),
    CONSTRAINT chk_pet_peso CHECK (peso IS NULL OR peso >= 0),
    CONSTRAINT chk_pet_status CHECK (status_pet IN ('CADASTRADO', 'DESAPARECIDO', 'ENCONTRADO'))
);

CREATE TABLE IF NOT EXISTS ocorrencias (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    tipo VARCHAR(150) NOT NULL DEFAULT 'Chamado Geral',
    categoria VARCHAR(100),
    assunto VARCHAR(200),
    opcao_escolhida VARCHAR(200),
    localizacao TEXT NOT NULL,
    detalhes TEXT NOT NULL,
    foto TEXT,
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    endereco_completo TEXT,
    bairro VARCHAR(150),
    cidade VARCHAR(150),
    estado VARCHAR(100),
    status status_ocorrencia_enum NOT NULL DEFAULT 'PENDENTE',
    prioridade prioridade_enum NOT NULL DEFAULT 'NORMAL',
    anonima BOOLEAN NOT NULL DEFAULT FALSE,
    atendente_id INTEGER REFERENCES funcionarios(id) ON DELETE SET NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    concluido_em TIMESTAMPTZ,
    CONSTRAINT chk_ocorrencia_latitude CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_ocorrencia_longitude CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE TABLE IF NOT EXISTS denuncias_anonimas (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo VARCHAR(150) NOT NULL DEFAULT 'Denúncia Anônima',
    categoria VARCHAR(100),
    assunto VARCHAR(200),
    opcao_escolhida VARCHAR(200),
    localizacao TEXT NOT NULL,
    detalhes TEXT NOT NULL,
    foto TEXT,
    latitude NUMERIC(10,8),
    longitude NUMERIC(11,8),
    endereco_completo TEXT,
    bairro VARCHAR(150),
    cidade VARCHAR(150),
    estado VARCHAR(100),
    status status_ocorrencia_enum NOT NULL DEFAULT 'PENDENTE',
    prioridade prioridade_enum NOT NULL DEFAULT 'ALTA',
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    concluido_em TIMESTAMPTZ,
    CONSTRAINT chk_denuncia_latitude CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_denuncia_longitude CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE TABLE IF NOT EXISTS historico_ocorrencias (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ocorrencia_id INTEGER NOT NULL REFERENCES ocorrencias(id) ON DELETE CASCADE,
    funcionario_id INTEGER REFERENCES funcionarios(id) ON DELETE SET NULL,
    status_anterior status_ocorrencia_enum,
    status_novo status_ocorrencia_enum NOT NULL,
    acao VARCHAR(150) NOT NULL,
    observacao TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- NOTIFICAÇÕES REAIS ENTRE DISPOSITIVOS
-- =============================================================

CREATE TABLE IF NOT EXISTS notificacoes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo VARCHAR(80) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    mensagem TEXT NOT NULL,
    foto TEXT,
    dados JSONB NOT NULL DEFAULT '{}'::jsonb,
    lida BOOLEAN NOT NULL DEFAULT FALSE,
    lida_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- EVENTOS DURÁVEIS DE TEMPO REAL
-- Permite recuperar eventos perdidos após reconexão ou reinício.
-- =============================================================

CREATE TABLE IF NOT EXISTS eventos_tempo_real (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    audiencia VARCHAR(30) NOT NULL DEFAULT 'ALL',
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_evento VARCHAR(80) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_evento_audiencia CHECK (audiencia IN ('ALL', 'PROFESSIONALS', 'ADMINS', 'USER'))
);

-- =============================================================
-- RESGATE DE PET DESAPARECIDO
-- =============================================================

CREATE TABLE IF NOT EXISTS resgates_pets (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    funcionario_id INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE RESTRICT,
    foto_encontrado TEXT NOT NULL,
    destino_tipo VARCHAR(30) NOT NULL,
    destino_nome VARCHAR(200) NOT NULL,
    destino_endereco TEXT NOT NULL,
    instrucoes_retirada TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'CONCLUIDO',
    iniciado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    concluido_em TIMESTAMPTZ,
    CONSTRAINT chk_resgate_destino_tipo CHECK (destino_tipo IN ('PROFISSIONAL', 'INSTITUICAO')),
    CONSTRAINT chk_resgate_status CHECK (status IN ('EM_ATENDIMENTO', 'CONCLUIDO', 'CANCELADO'))
);

-- =============================================================
-- BLOQUEIOS, AUDITORIA E SEGURANÇA
-- =============================================================

CREATE TABLE IF NOT EXISTS bloqueios_conta (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    administrador_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    inicio_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fim_em TIMESTAMPTZ NOT NULL,
    motivo TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    revogado_em TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_bloqueio_periodo CHECK (fim_em > inicio_em)
);

CREATE TABLE IF NOT EXISTS auditoria_seguranca (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    administrador_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_alvo_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    acao VARCHAR(100) NOT NULL,
    detalhes JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_origem VARCHAR(100),
    user_agent TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tentativas_login (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cpf VARCHAR(11),
    sucesso BOOLEAN NOT NULL,
    ip_origem VARCHAR(100),
    user_agent TEXT,
    motivo VARCHAR(200),
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================
-- RELACIONAMENTO DO BLOQUEIO COM O ADMINISTRADOR
-- =============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_usuarios_bloqueado_por'
    ) THEN
        ALTER TABLE usuarios
        ADD CONSTRAINT fk_usuarios_bloqueado_por
        FOREIGN KEY (bloqueado_por)
        REFERENCES usuarios(id)
        ON DELETE SET NULL;
    END IF;
END;
$$;

-- =============================================================
-- TRIGGERS DE DATA
-- =============================================================

DROP TRIGGER IF EXISTS trg_usuarios_atualizado_em ON usuarios;
CREATE TRIGGER trg_usuarios_atualizado_em
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION atualizar_data_modificacao();

DROP TRIGGER IF EXISTS trg_empresas_atualizado_em ON empresas;
CREATE TRIGGER trg_empresas_atualizado_em
BEFORE UPDATE ON empresas
FOR EACH ROW EXECUTE FUNCTION atualizar_data_modificacao();

DROP TRIGGER IF EXISTS trg_funcionarios_atualizado_em ON funcionarios;
CREATE TRIGGER trg_funcionarios_atualizado_em
BEFORE UPDATE ON funcionarios
FOR EACH ROW EXECUTE FUNCTION atualizar_data_modificacao();

DROP TRIGGER IF EXISTS trg_pets_atualizado_em ON pets;
CREATE TRIGGER trg_pets_atualizado_em
BEFORE UPDATE ON pets
FOR EACH ROW EXECUTE FUNCTION atualizar_data_modificacao();

DROP TRIGGER IF EXISTS trg_ocorrencias_atualizado_em ON ocorrencias;
CREATE TRIGGER trg_ocorrencias_atualizado_em
BEFORE UPDATE ON ocorrencias
FOR EACH ROW EXECUTE FUNCTION atualizar_data_modificacao();

DROP TRIGGER IF EXISTS trg_denuncias_anonimas_atualizado_em ON denuncias_anonimas;
CREATE TRIGGER trg_denuncias_anonimas_atualizado_em
BEFORE UPDATE ON denuncias_anonimas
FOR EACH ROW EXECUTE FUNCTION atualizar_data_modificacao();

-- =============================================================
-- ÍNDICES
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_usuarios_tipo_ativo ON usuarios(tipo, ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_bloqueado_ate ON usuarios(bloqueado_ate) WHERE bloqueado_ate IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usuarios_excluida_em ON usuarios(excluida_em) WHERE excluida_em IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_empresas_ativo_nome ON empresas(ativo, nome);
CREATE INDEX IF NOT EXISTS idx_funcionarios_empresa_ativo ON funcionarios(empresa, ativo);
CREATE INDEX IF NOT EXISTS idx_pets_usuario_status ON pets(usuario_id, status_pet, ativo);
CREATE INDEX IF NOT EXISTS idx_pets_desaparecidos_reais ON pets(desaparecido_em DESC) WHERE desaparecido = TRUE AND ativo = TRUE;
CREATE INDEX IF NOT EXISTS idx_ocorrencias_fila ON ocorrencias(status, prioridade, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_usuario_status ON ocorrencias(usuario_id, status);
CREATE INDEX IF NOT EXISTS idx_denuncias_fila ON denuncias_anonimas(status, prioridade, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_data ON notificacoes(usuario_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_notificacoes_nao_lidas ON notificacoes(usuario_id, lida) WHERE lida = FALSE;
CREATE INDEX IF NOT EXISTS idx_eventos_tempo_real_audiencia_id ON eventos_tempo_real(audiencia, usuario_id, id);
CREATE INDEX IF NOT EXISTS idx_eventos_tempo_real_data ON eventos_tempo_real(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_resgates_pet ON resgates_pets(pet_id, concluido_em DESC);
CREATE INDEX IF NOT EXISTS idx_resgates_funcionario ON resgates_pets(funcionario_id, concluido_em DESC);
CREATE INDEX IF NOT EXISTS idx_bloqueios_usuario_ativo ON bloqueios_conta(usuario_id, ativo);
CREATE INDEX IF NOT EXISTS idx_auditoria_data ON auditoria_seguranca(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_tentativas_login_cpf_data ON tentativas_login(cpf, criado_em DESC);

-- =============================================================
-- VIEWS SEM DADOS DE DEMONSTRAÇÃO
-- =============================================================

DROP VIEW IF EXISTS view_chamados_profissionais;
DROP VIEW IF EXISTS view_ocorrencias_completas;
DROP VIEW IF EXISTS view_usuarios_completos;

CREATE OR REPLACE VIEW view_usuarios_completos AS
SELECT
    u.id,
    u.nome,
    u.cpf,
    u.email,
    u.telefone,
    u.tipo,
    u.empresa,
    u.foto_perfil,
    u.ativo,
    u.bloqueado_em,
    u.bloqueado_ate,
    u.motivo_bloqueio,
    u.excluida_em,
    u.session_version,
    u.ultimo_login,
    u.criado_em,
    u.atualizado_em,
    f.id AS funcionario_id,
    f.cargo,
    f.nivel_acesso,
    f.registro_profissional,
    f.especialidade,
    f.regiao_atendimento,
    f.status_plantao,
    f.veiculo,
    f.equipe,
    f.bio_profissional,
    f.ativo AS funcionario_ativo
FROM usuarios u
LEFT JOIN funcionarios f ON f.usuario_id = u.id;

CREATE OR REPLACE VIEW view_ocorrencias_completas AS
SELECT
    o.id,
    o.usuario_id,
    o.tipo,
    o.categoria,
    o.assunto,
    o.opcao_escolhida,
    o.localizacao,
    o.endereco_completo,
    o.bairro,
    o.cidade,
    o.estado,
    o.detalhes,
    o.foto,
    o.latitude,
    o.longitude,
    o.status,
    o.prioridade,
    o.anonima,
    o.criado_em,
    o.atualizado_em,
    o.concluido_em,
    u.nome AS nome_usuario,
    u.cpf AS cpf_usuario,
    u.email AS email_usuario,
    u.telefone AS telefone_usuario,
    u.foto_perfil AS foto_usuario,
    f.id AS atendente_id,
    uf.nome AS nome_atendente,
    f.cargo AS cargo_atendente,
    f.empresa AS empresa_atendente
FROM ocorrencias o
LEFT JOIN usuarios u ON u.id = o.usuario_id
LEFT JOIN funcionarios f ON f.id = o.atendente_id
LEFT JOIN usuarios uf ON uf.id = f.usuario_id;

CREATE OR REPLACE VIEW view_chamados_profissionais AS
SELECT
    id,
    'ocorrencia'::TEXT AS origem,
    tipo,
    categoria,
    assunto,
    opcao_escolhida,
    localizacao,
    endereco_completo,
    bairro,
    cidade,
    estado,
    detalhes,
    foto,
    latitude,
    longitude,
    status,
    prioridade,
    anonima,
    criado_em,
    nome_usuario,
    cpf_usuario,
    foto_usuario
FROM view_ocorrencias_completas
WHERE status NOT IN ('CONCLUIDA', 'CANCELADA')

UNION ALL

SELECT
    id,
    'anonima'::TEXT AS origem,
    tipo,
    categoria,
    assunto,
    opcao_escolhida,
    localizacao,
    endereco_completo,
    bairro,
    cidade,
    estado,
    detalhes,
    foto,
    latitude,
    longitude,
    status,
    prioridade,
    TRUE AS anonima,
    criado_em,
    'Anônimo'::VARCHAR AS nome_usuario,
    NULL::VARCHAR AS cpf_usuario,
    NULL::TEXT AS foto_usuario
FROM denuncias_anonimas
WHERE status NOT IN ('CONCLUIDA', 'CANCELADA');

-- =============================================================
-- CONTAS E EMPRESAS INICIAIS, SEM PETS OU DENÚNCIAS FALSAS
-- =============================================================

INSERT INTO empresas (nome, tipo, cnpj, telefone, email, endereco, ativo)
VALUES
    ('Safe Life Matriz', 'Base Safe Life', '', '(41) 97777-0000', 'contato@safelife.com', 'Base principal do sistema Safe Life', TRUE),
    ('ONG Patas Livres', 'ONG parceira', '', '(41) 98888-0000', 'contato@pataslivres.org', 'Atendimento comunitário e resgate animal', TRUE),
    ('Centro de Controle de Zoonoses', 'Órgão público', '', '(41) 3333-0000', 'zoonoses@safelife.com', 'Apoio em fiscalização e controle sanitário', TRUE),
    ('Protetores Independentes Associados', 'Protetores independentes', '', '(41) 92222-0000', 'protetores@safelife.com', 'Rede de lares temporários e voluntários', TRUE)
ON CONFLICT (nome) DO UPDATE SET
    tipo = EXCLUDED.tipo,
    telefone = EXCLUDED.telefone,
    email = EXCLUDED.email,
    endereco = EXCLUDED.endereco;

INSERT INTO usuarios
(nome, cpf, senha_hash, email, telefone, tipo, empresa, foto_perfil, ativo)
VALUES
(
    'Vitor Chineque',
    '11111111111',
    'scrypt$35648d7fd60731ac9205183ec436c4e0$6a122be2c6771531791ff7de26b1d4fc59775e62cd03265070ea048881e782cd280567e6e76b3169a24adb5636b7dcf70589e2645133ee02be43f64b9ed78f7e',
    'vitor.chinequero@safelife.com',
    '(41) 99999-0000',
    'citizen',
    NULL,
    'img/pequenochinique.jpeg',
    TRUE
),
(
    'Zeca dos Santos',
    '99999999999',
    'scrypt$ae5d4f36ed0b35fb69e440c77d6f3978$5d02a0401490f6f62f97692d8e8f2f449dda23ef8cd4e90899818324a232e289737441c5c64999589d3579d6ad2f5fc7ab299be3986373e727fd2ed93b47858b',
    'zeca.dos.animais@safelife.com',
    '(41) 98888-0000',
    'professional',
    'Safe Life Matriz',
    'img/corredorzeca.jpeg',
    TRUE
),
(
    'Gustavo Siri',
    '45317828791',
    'scrypt$8feab15f9b71b8e65b7a18af374ded86$e059083684993f4287ffa67fbeee1bce8cc3d84d4a125760172941177a7f2bd77ab10a4fa09b942036785dd1b8b2459b61417e7bd04a60d0d04e84a6e84cc3d5',
    'gustavo.siriguejo@safelife.com',
    '(41) 97777-0000',
    'admin',
    'Safe Life Matriz',
    'img/apenasumsiri.jpeg',
    TRUE
)
ON CONFLICT (cpf) DO UPDATE SET
    nome = EXCLUDED.nome,
    foto_perfil = COALESCE(NULLIF(usuarios.foto_perfil, ''), EXCLUDED.foto_perfil),
    empresa = EXCLUDED.empresa,
    tipo = EXCLUDED.tipo,
    excluida_em = NULL;

INSERT INTO funcionarios
(usuario_id, cargo, empresa, nivel_acesso, registro_profissional, especialidade, regiao_atendimento, status_plantao, veiculo, equipe, bio_profissional, ativo)
SELECT
    u.id,
    'Agente Operacional',
    'Safe Life Matriz',
    'operador',
    'SAFE-0001',
    'Resgate de rua',
    'Curitiba e Região Metropolitana',
    'Disponível',
    'Carro de resgate',
    'Equipe Alpha',
    'Profissional de resgate e triagem animal.',
    TRUE
FROM usuarios u
WHERE u.cpf = '99999999999'
ON CONFLICT (usuario_id) DO UPDATE SET
    empresa = EXCLUDED.empresa,
    ativo = TRUE;

INSERT INTO funcionarios
(usuario_id, cargo, empresa, nivel_acesso, registro_profissional, especialidade, regiao_atendimento, status_plantao, veiculo, equipe, bio_profissional, ativo)
SELECT
    u.id,
    'Administrador Master',
    'Safe Life Matriz',
    'administrador',
    'ADMIN-MASTER',
    'Gestão geral da plataforma',
    'Todas as regiões',
    'Supervisão',
    'Gestão administrativa',
    'Central Safe Life',
    'Administrador principal da plataforma.',
    TRUE
FROM usuarios u
WHERE u.cpf = '45317828791'
ON CONFLICT (usuario_id) DO UPDATE SET
    nivel_acesso = 'administrador',
    ativo = TRUE;

-- =============================================================
-- LIMPEZA EXCLUSIVA DOS REGISTROS DE DEMONSTRAÇÃO
-- Não remove denúncias reais diferentes destes exemplos.
-- =============================================================

DELETE FROM historico_ocorrencias
WHERE ocorrencia_id IN (
    SELECT id FROM ocorrencias
    WHERE
        (LOWER(COALESCE(assunto, '')) = 'animal na rua' AND LOWER(COALESCE(localizacao, '')) LIKE 'rua das flores%')
        OR (LOWER(COALESCE(assunto, '')) = 'animal ferido' AND LOWER(COALESCE(localizacao, '')) LIKE 'avenida principal%')
        OR COALESCE(foto, '') LIKE '%photo-1558788353-f76d92427f16%'
        OR COALESCE(foto, '') LIKE '%photo-1574158622682-e40e69881006%'
);

DELETE FROM ocorrencias
WHERE
    (LOWER(COALESCE(assunto, '')) = 'animal na rua' AND LOWER(COALESCE(localizacao, '')) LIKE 'rua das flores%')
    OR (LOWER(COALESCE(assunto, '')) = 'animal ferido' AND LOWER(COALESCE(localizacao, '')) LIKE 'avenida principal%')
    OR COALESCE(foto, '') LIKE '%photo-1558788353-f76d92427f16%'
    OR COALESCE(foto, '') LIKE '%photo-1574158622682-e40e69881006%';

DELETE FROM denuncias_anonimas
WHERE
    (LOWER(COALESCE(assunto, '')) = 'sem água e comida' AND LOWER(COALESCE(localizacao, '')) LIKE 'rua esperança%')
    OR (LOWER(COALESCE(assunto, '')) = 'animal acorrentado' AND LOWER(COALESCE(localizacao, '')) LIKE 'travessa das palmeiras%')
    OR COALESCE(foto, '') LIKE '%photo-1583512603805-3cc6b41f3edb%'
    OR COALESCE(foto, '') LIKE '%photo-1596492784531-6e6eb5ea9993%';

DELETE FROM pets
WHERE usuario_id = (SELECT id FROM usuarios WHERE cpf = '11111111111')
  AND nome = 'Ademir'
  AND LOWER(COALESCE(observacoes, '')) LIKE '%demonstração%';

-- =============================================================
-- PROTEÇÃO CONTRA ACESSO DIRETO PELA API PÚBLICA DO SUPABASE
-- O Render usa a conexão PostgreSQL e continua funcionando.
-- =============================================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE denuncias_anonimas ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_tempo_real ENABLE ROW LEVEL SECURITY;
ALTER TABLE resgates_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloqueios_conta ENABLE ROW LEVEL SECURITY;
ALTER TABLE auditoria_seguranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE tentativas_login ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE usuarios FROM anon, authenticated;
REVOKE ALL ON TABLE empresas FROM anon, authenticated;
REVOKE ALL ON TABLE funcionarios FROM anon, authenticated;
REVOKE ALL ON TABLE pets FROM anon, authenticated;
REVOKE ALL ON TABLE ocorrencias FROM anon, authenticated;
REVOKE ALL ON TABLE denuncias_anonimas FROM anon, authenticated;
REVOKE ALL ON TABLE historico_ocorrencias FROM anon, authenticated;
REVOKE ALL ON TABLE notificacoes FROM anon, authenticated;
REVOKE ALL ON TABLE eventos_tempo_real FROM anon, authenticated;
REVOKE ALL ON TABLE resgates_pets FROM anon, authenticated;
REVOKE ALL ON TABLE bloqueios_conta FROM anon, authenticated;
REVOKE ALL ON TABLE auditoria_seguranca FROM anon, authenticated;
REVOKE ALL ON TABLE tentativas_login FROM anon, authenticated;

-- Limpa eventos antigos sem tocar nos dados reais do aplicativo.
DELETE FROM eventos_tempo_real
WHERE criado_em < CURRENT_TIMESTAMP - INTERVAL '7 days';

COMMIT;

SELECT
    'Safe Life V20 Online instalado com segurança' AS resultado,
    (SELECT COUNT(*) FROM usuarios WHERE excluida_em IS NULL) AS usuarios_ativos_no_banco,
    (SELECT COUNT(*) FROM pets WHERE ativo = TRUE) AS pets_reais,
    (SELECT COUNT(*) FROM ocorrencias) AS ocorrencias_reais,
    (SELECT COUNT(*) FROM notificacoes) AS notificacoes;
