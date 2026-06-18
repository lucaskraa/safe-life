-- =====================================================
-- SAFE LIFE — BANCO DE DADOS COMPLETO
-- PostgreSQL / Supabase
-- Compatível com o server.js atualizado para Render
--
-- ATENÇÃO: este arquivo APAGA e recria as estruturas.
-- Use-o na primeira instalação ou quando quiser reiniciar o banco.
-- =====================================================

BEGIN;

-- =====================================================
-- LIMPEZA CONTROLADA
-- =====================================================

DROP VIEW IF EXISTS view_chamados_profissionais CASCADE;
DROP VIEW IF EXISTS view_ocorrencias_completas CASCADE;
DROP VIEW IF EXISTS view_usuarios_completos CASCADE;

DROP TABLE IF EXISTS historico_ocorrencias CASCADE;
DROP TABLE IF EXISTS denuncias_anonimas CASCADE;
DROP TABLE IF EXISTS ocorrencias CASCADE;
DROP TABLE IF EXISTS pets CASCADE;
DROP TABLE IF EXISTS funcionarios CASCADE;
DROP TABLE IF EXISTS empresas CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

DROP TYPE IF EXISTS tipo_usuario_enum CASCADE;
DROP TYPE IF EXISTS status_ocorrencia_enum CASCADE;
DROP TYPE IF EXISTS prioridade_enum CASCADE;
DROP TYPE IF EXISTS nivel_acesso_enum CASCADE;
DROP TYPE IF EXISTS sexo_pet_enum CASCADE;

DROP FUNCTION IF EXISTS atualizar_data_modificacao() CASCADE;

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE tipo_usuario_enum AS ENUM (
    'citizen',
    'professional',
    'admin'
);

CREATE TYPE status_ocorrencia_enum AS ENUM (
    'PENDENTE',
    'EM_ATENDIMENTO',
    'CONCLUIDA',
    'CANCELADA'
);

CREATE TYPE prioridade_enum AS ENUM (
    'BAIXA',
    'NORMAL',
    'ALTA',
    'CRITICA'
);

CREATE TYPE nivel_acesso_enum AS ENUM (
    'operador',
    'supervisor',
    'administrador'
);

CREATE TYPE sexo_pet_enum AS ENUM (
    'MACHO',
    'FEMEA',
    'NAO_INFORMADO'
);

-- =====================================================
-- FUNÇÃO DE ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

CREATE OR REPLACE FUNCTION atualizar_data_modificacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USUÁRIOS
-- =====================================================

CREATE TABLE usuarios (
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
    ultimo_login TIMESTAMPTZ,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_usuario_cpf
        CHECK (cpf ~ '^[0-9]{11}$'),

    CONSTRAINT chk_usuario_email
        CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),

    CONSTRAINT chk_empresa_funcionario
        CHECK (tipo <> 'professional' OR NULLIF(BTRIM(empresa), '') IS NOT NULL)
);

CREATE TRIGGER trg_usuarios_atualizado_em
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_modificacao();

-- =====================================================
-- EMPRESAS / BASES / ONGS
-- =====================================================

CREATE TABLE empresas (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(200) UNIQUE NOT NULL,
    tipo VARCHAR(100) NOT NULL DEFAULT 'Empresa parceira',
    cnpj VARCHAR(30),
    telefone VARCHAR(30),
    email VARCHAR(255),
    endereco TEXT,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_empresa_email
        CHECK (
            email IS NULL
            OR email = ''
            OR email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
        )
);

CREATE TRIGGER trg_empresas_atualizado_em
BEFORE UPDATE ON empresas
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_modificacao();

-- =====================================================
-- FUNCIONÁRIOS
-- =====================================================

CREATE TABLE funcionarios (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INTEGER NOT NULL UNIQUE,
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
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_funcionario_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE
);

CREATE TRIGGER trg_funcionarios_atualizado_em
BEFORE UPDATE ON funcionarios
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_modificacao();

-- =====================================================
-- PETS
-- =====================================================

CREATE TABLE pets (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INTEGER NOT NULL,
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

    CONSTRAINT fk_pet_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_pet_idade
        CHECK (idade >= 0),

    CONSTRAINT chk_pet_peso
        CHECK (peso IS NULL OR peso >= 0),

    CONSTRAINT chk_pet_status
        CHECK (status_pet IN ('CADASTRADO', 'DESAPARECIDO', 'ENCONTRADO'))
);

CREATE TRIGGER trg_pets_atualizado_em
BEFORE UPDATE ON pets
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_modificacao();

-- =====================================================
-- OCORRÊNCIAS IDENTIFICADAS
-- =====================================================

CREATE TABLE ocorrencias (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_id INTEGER,
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
    atendente_id INTEGER,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    concluido_em TIMESTAMPTZ,

    CONSTRAINT fk_ocorrencia_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_ocorrencia_atendente
        FOREIGN KEY (atendente_id)
        REFERENCES funcionarios(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_ocorrencia_latitude
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),

    CONSTRAINT chk_ocorrencia_longitude
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE TRIGGER trg_ocorrencias_atualizado_em
BEFORE UPDATE ON ocorrencias
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_modificacao();

-- =====================================================
-- DENÚNCIAS ANÔNIMAS
-- =====================================================

CREATE TABLE denuncias_anonimas (
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

    CONSTRAINT chk_denuncia_latitude
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),

    CONSTRAINT chk_denuncia_longitude
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE TRIGGER trg_denuncias_anonimas_atualizado_em
BEFORE UPDATE ON denuncias_anonimas
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_modificacao();

-- =====================================================
-- HISTÓRICO DAS OCORRÊNCIAS
-- =====================================================

CREATE TABLE historico_ocorrencias (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ocorrencia_id INTEGER NOT NULL,
    funcionario_id INTEGER,
    status_anterior status_ocorrencia_enum,
    status_novo status_ocorrencia_enum NOT NULL,
    acao VARCHAR(150) NOT NULL,
    observacao TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_historico_ocorrencia
        FOREIGN KEY (ocorrencia_id)
        REFERENCES ocorrencias(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_historico_funcionario
        FOREIGN KEY (funcionario_id)
        REFERENCES funcionarios(id)
        ON DELETE SET NULL
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX idx_usuarios_tipo ON usuarios(tipo);
CREATE INDEX idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX idx_usuarios_criado_em ON usuarios(criado_em DESC);

CREATE INDEX idx_empresas_ativo ON empresas(ativo);

CREATE INDEX idx_funcionarios_empresa ON funcionarios(empresa);
CREATE INDEX idx_funcionarios_ativo ON funcionarios(ativo);
CREATE INDEX idx_funcionarios_status_plantao ON funcionarios(status_plantao);

CREATE INDEX idx_pets_usuario_id ON pets(usuario_id);
CREATE INDEX idx_pets_desaparecido ON pets(desaparecido) WHERE ativo = TRUE;
CREATE INDEX idx_pets_status_pet ON pets(status_pet);
CREATE INDEX idx_pets_criado_em ON pets(criado_em DESC);

CREATE INDEX idx_ocorrencias_usuario_id ON ocorrencias(usuario_id);
CREATE INDEX idx_ocorrencias_atendente_id ON ocorrencias(atendente_id);
CREATE INDEX idx_ocorrencias_status ON ocorrencias(status);
CREATE INDEX idx_ocorrencias_prioridade ON ocorrencias(prioridade);
CREATE INDEX idx_ocorrencias_categoria ON ocorrencias(categoria);
CREATE INDEX idx_ocorrencias_criado_em ON ocorrencias(criado_em DESC);

CREATE INDEX idx_denuncias_status ON denuncias_anonimas(status);
CREATE INDEX idx_denuncias_prioridade ON denuncias_anonimas(prioridade);
CREATE INDEX idx_denuncias_categoria ON denuncias_anonimas(categoria);
CREATE INDEX idx_denuncias_criado_em ON denuncias_anonimas(criado_em DESC);

CREATE INDEX idx_historico_ocorrencia_id ON historico_ocorrencias(ocorrencia_id);
CREATE INDEX idx_historico_funcionario_id ON historico_ocorrencias(funcionario_id);
CREATE INDEX idx_historico_criado_em ON historico_ocorrencias(criado_em DESC);

-- =====================================================
-- VIEW: USUÁRIOS COMPLETOS
-- =====================================================

CREATE VIEW view_usuarios_completos AS
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
LEFT JOIN funcionarios f
    ON f.usuario_id = u.id;

-- =====================================================
-- VIEW: OCORRÊNCIAS COMPLETAS
-- =====================================================

CREATE VIEW view_ocorrencias_completas AS
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
    uf.cpf AS cpf_atendente,
    f.cargo AS cargo_atendente,
    f.empresa AS empresa_atendente
FROM ocorrencias o
LEFT JOIN usuarios u
    ON u.id = o.usuario_id
LEFT JOIN funcionarios f
    ON f.id = o.atendente_id
LEFT JOIN usuarios uf
    ON uf.id = f.usuario_id;

-- =====================================================
-- VIEW: CHAMADOS DO PAINEL PROFISSIONAL
-- =====================================================

CREATE VIEW view_chamados_profissionais AS
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
FROM denuncias_anonimas;

-- =====================================================
-- DADOS INICIAIS: EMPRESAS
-- =====================================================

INSERT INTO empresas
(nome, tipo, cnpj, telefone, email, endereco, ativo)
VALUES
(
    'Safe Life Matriz',
    'Base Safe Life',
    '',
    '(41) 97777-0000',
    'contato@safelife.com',
    'Base principal do sistema Safe Life',
    TRUE
),
(
    'ONG Patas Livres',
    'ONG parceira',
    '',
    '(41) 98888-0000',
    'contato@pataslivres.org',
    'Atendimento comunitário e resgate animal',
    TRUE
),
(
    'Centro de Controle de Zoonoses',
    'Órgão público',
    '',
    '(41) 3333-0000',
    'zoonoses@safelife.com',
    'Apoio em fiscalização e controle sanitário',
    TRUE
),
(
    'Protetores Independentes Associados',
    'Protetores independentes',
    '',
    '(41) 92222-0000',
    'protetores@safelife.com',
    'Rede de lares temporários e voluntários',
    TRUE
);

-- =====================================================
-- DADOS INICIAIS: USUÁRIOS
-- Senha das contas de teste: 123456
-- Os hashes abaixo usam o mesmo formato scrypt do server.js.
-- O admin será sincronizado com ADMIN_PASSWORD quando o servidor iniciar.
-- =====================================================

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
    'img/vitor-chineque.jpg',
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
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
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
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
    TRUE
);

-- =====================================================
-- FUNCIONÁRIOS INICIAIS
-- =====================================================

INSERT INTO funcionarios
(
    usuario_id,
    cargo,
    empresa,
    nivel_acesso,
    registro_profissional,
    especialidade,
    regiao_atendimento,
    status_plantao,
    veiculo,
    equipe,
    bio_profissional,
    ativo
)
SELECT
    id,
    'Agente Operacional',
    'Safe Life Matriz',
    'operador',
    'SAFE-0001',
    'Resgate de rua',
    'Curitiba, Araucária e bairros próximos',
    'Disponível',
    'Carro de resgate',
    'Equipe Alpha',
    'Profissional responsável por triagem, resgate e acompanhamento inicial de chamados.',
    TRUE
FROM usuarios
WHERE cpf = '99999999999';

INSERT INTO funcionarios
(
    usuario_id,
    cargo,
    empresa,
    nivel_acesso,
    registro_profissional,
    especialidade,
    regiao_atendimento,
    status_plantao,
    veiculo,
    equipe,
    bio_profissional,
    ativo
)
SELECT
    id,
    'Administrador Master',
    'Safe Life Matriz',
    'administrador',
    'ADMIN-MASTER',
    'Gestão geral da plataforma',
    'Todas as regiões',
    'Supervisão',
    'Gestão administrativa',
    'Central Safe Life',
    'Administrador principal com acesso total ao sistema, empresas, contas e chamados.',
    TRUE
FROM usuarios
WHERE cpf = '45317828791';

-- =====================================================
-- PET DE DEMONSTRAÇÃO
-- =====================================================

INSERT INTO pets
(
    usuario_id,
    nome,
    idade,
    especie,
    raca,
    sexo,
    cor,
    peso,
    localizacao,
    observacoes,
    foto,
    ativo
)
SELECT
    id,
    'Ademir',
    3,
    'Gato',
    'SRD',
    'MACHO',
    'Cinza',
    4.20,
    'Araucária - Paraná',
    'Pet cadastrado para demonstração do sistema.',
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150&q=80',
    TRUE
FROM usuarios
WHERE cpf = '11111111111';

-- =====================================================
-- OCORRÊNCIAS DE DEMONSTRAÇÃO
-- =====================================================

INSERT INTO ocorrencias
(
    usuario_id,
    tipo,
    categoria,
    assunto,
    opcao_escolhida,
    localizacao,
    detalhes,
    foto,
    latitude,
    longitude,
    endereco_completo,
    bairro,
    cidade,
    estado,
    status,
    prioridade,
    anonima
)
SELECT
    id,
    'Solicitar Resgate',
    'rescue',
    'Animal na rua',
    'Animal na rua',
    'Rua das Flores - Centro',
    'Cachorro assustado próximo aos carros, aparentemente perdido e com risco de atropelamento.',
    'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=600&q=80',
    -25.593700,
    -49.410300,
    'Rua das Flores - Centro - Araucária - PR',
    'Centro',
    'Araucária',
    'PR',
    'PENDENTE',
    'ALTA',
    FALSE
FROM usuarios
WHERE cpf = '11111111111';

INSERT INTO ocorrencias
(
    usuario_id,
    tipo,
    categoria,
    assunto,
    opcao_escolhida,
    localizacao,
    detalhes,
    foto,
    latitude,
    longitude,
    endereco_completo,
    bairro,
    cidade,
    estado,
    status,
    prioridade,
    anonima
)
SELECT
    id,
    'Emergência Crítica / Código Vermelho',
    'emergency',
    'Animal ferido',
    'Animal ferido',
    'Avenida Principal - Bairro Novo',
    'Gato aparentemente ferido, parado na calçada e sem conseguir andar direito.',
    'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=600&q=80',
    -25.595000,
    -49.412000,
    'Avenida Principal - Bairro Novo - Araucária - PR',
    'Bairro Novo',
    'Araucária',
    'PR',
    'PENDENTE',
    'CRITICA',
    FALSE
FROM usuarios
WHERE cpf = '11111111111';

-- =====================================================
-- DENÚNCIAS ANÔNIMAS DE DEMONSTRAÇÃO
-- =====================================================

INSERT INTO denuncias_anonimas
(
    tipo,
    categoria,
    assunto,
    opcao_escolhida,
    localizacao,
    detalhes,
    foto,
    latitude,
    longitude,
    endereco_completo,
    bairro,
    cidade,
    estado,
    status,
    prioridade
)
VALUES
(
    'Denúncia Anônima',
    'anonymous',
    'Sem água e comida',
    'Sem água e comida',
    'Rua Esperança - Jardim América',
    'Cachorro preso no quintal, aparentemente sem água e sem comida há alguns dias.',
    'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?auto=format&fit=crop&w=600&q=80',
    -25.596000,
    -49.414000,
    'Rua Esperança - Jardim América - Araucária - PR',
    'Jardim América',
    'Araucária',
    'PR',
    'PENDENTE',
    'ALTA'
),
(
    'Denúncia Anônima',
    'anonymous',
    'Animal acorrentado',
    'Animal acorrentado',
    'Travessa das Palmeiras - Vila Verde',
    'Animal permanece acorrentado o dia inteiro, sem abrigo adequado contra chuva e sol.',
    'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&w=600&q=80',
    -25.598000,
    -49.416000,
    'Travessa das Palmeiras - Vila Verde - Araucária - PR',
    'Vila Verde',
    'Araucária',
    'PR',
    'PENDENTE',
    'ALTA'
);

-- =====================================================
-- HISTÓRICO INICIAL
-- Cada ocorrência recebe exatamente um registro de criação.
-- =====================================================

INSERT INTO historico_ocorrencias
(
    ocorrencia_id,
    funcionario_id,
    status_anterior,
    status_novo,
    acao,
    observacao
)
SELECT
    o.id,
    NULL,
    NULL,
    'PENDENTE',
    'Chamado criado',
    'Ocorrência registrada automaticamente pelo sistema.'
FROM ocorrencias o;

COMMIT;

-- =====================================================
-- TESTES OPCIONAIS
-- Execute separadamente após concluir o script:
--
-- SELECT * FROM view_usuarios_completos ORDER BY id;
-- SELECT * FROM view_ocorrencias_completas ORDER BY criado_em DESC;
-- SELECT * FROM view_chamados_profissionais ORDER BY criado_em DESC;
-- SELECT COUNT(*) FROM usuarios;
-- SELECT COUNT(*) FROM pets;
-- =====================================================

-- CONTAS DE TESTE
-- Cidadão:     CPF 11111111111 | senha 123456
-- Profissional: CPF 99999999999 | senha 123456
-- Administrador: CPF 45317828791 | senha definida em ADMIN_PASSWORD no Render
