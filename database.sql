-- =====================================================
-- SAFE LIFE
-- BANCO DE DADOS COMPLETO
-- PostgreSQL
-- Versão com:
-- Cidadão
-- Profissional
-- Administrador Master
-- CPF ADMIN: 45317828791
-- Chamados
-- Denúncias anônimas
-- Pets
-- Painel profissional
-- Área administrativa
-- =====================================================

-- =====================================================
-- LIMPEZA DO BANCO
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
-- FUNÇÃO PARA ATUALIZAR DATA AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION atualizar_data_modificacao()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TABELA: USUÁRIOS
-- =====================================================

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,

    nome VARCHAR(200) NOT NULL,

    cpf VARCHAR(11) UNIQUE NOT NULL,

    senha_hash VARCHAR(255),

    email VARCHAR(255) UNIQUE,

    telefone VARCHAR(30),

    tipo tipo_usuario_enum NOT NULL DEFAULT 'citizen',

    empresa VARCHAR(255),

    foto_perfil TEXT,

    ativo BOOLEAN DEFAULT TRUE,

    ultimo_login TIMESTAMP,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_usuario_cpf
        CHECK (cpf ~ '^[0-9]{11}$'),

    CONSTRAINT chk_usuario_email
        CHECK (
            email IS NULL
            OR email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
        ),

    CONSTRAINT chk_empresa_funcionario
        CHECK (
            tipo <> 'professional'
            OR empresa IS NOT NULL
        )
);

CREATE TRIGGER trg_usuarios_atualizado_em
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_modificacao();

-- =====================================================
-- TABELA: EMPRESAS / BASES PARCEIRAS
-- =====================================================

CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,

    nome VARCHAR(200) UNIQUE NOT NULL,

    tipo VARCHAR(100) DEFAULT 'Empresa parceira',

    cnpj VARCHAR(30),

    telefone VARCHAR(30),

    email VARCHAR(255),

    endereco TEXT,

    ativo BOOLEAN DEFAULT TRUE,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_empresa_email
        CHECK (
            email IS NULL
            OR email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
        )
);

CREATE TRIGGER trg_empresas_atualizado_em
BEFORE UPDATE ON empresas
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_modificacao();

-- =====================================================
-- TABELA: FUNCIONÁRIOS
-- =====================================================

CREATE TABLE funcionarios (
    id SERIAL PRIMARY KEY,

    usuario_id INTEGER NOT NULL UNIQUE,

    cargo VARCHAR(100),

    empresa VARCHAR(255) NOT NULL,

    nivel_acesso nivel_acesso_enum DEFAULT 'operador',

    registro_profissional VARCHAR(80),

    especialidade VARCHAR(150),

    regiao_atendimento VARCHAR(200),

    status_plantao VARCHAR(80) DEFAULT 'Disponível',

    veiculo VARCHAR(120),

    equipe VARCHAR(120),

    bio_profissional TEXT,

    ativo BOOLEAN DEFAULT TRUE,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

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
-- TABELA: PETS
-- =====================================================

CREATE TABLE pets (
    id SERIAL PRIMARY KEY,

    usuario_id INTEGER NOT NULL,

    nome VARCHAR(100) NOT NULL,

    idade INTEGER DEFAULT 0,

    especie VARCHAR(100) DEFAULT 'Animal',

    raca VARCHAR(100),

    sexo sexo_pet_enum DEFAULT 'NAO_INFORMADO',

    cor VARCHAR(100),

    peso DECIMAL(10,2),

    localizacao TEXT,

    observacoes TEXT,

    foto TEXT,

    desaparecido BOOLEAN DEFAULT FALSE,

    status_pet VARCHAR(50) DEFAULT 'CADASTRADO',

    local_desaparecimento TEXT,

    detalhes_desaparecimento TEXT,

    desaparecido_em TIMESTAMP,

    encontrado_em TIMESTAMP,

    ativo BOOLEAN DEFAULT TRUE,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_pet_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE CASCADE,

    CONSTRAINT chk_pet_idade
        CHECK (idade >= 0),

    CONSTRAINT chk_pet_peso
        CHECK (peso IS NULL OR peso >= 0)
);

CREATE TRIGGER trg_pets_atualizado_em
BEFORE UPDATE ON pets
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_modificacao();-- =====================================================
-- TABELA: OCORRÊNCIAS IDENTIFICADAS
-- =====================================================

CREATE TABLE ocorrencias (
    id SERIAL PRIMARY KEY,

    usuario_id INTEGER,

    tipo VARCHAR(150) NOT NULL DEFAULT 'Chamado Geral',

    categoria VARCHAR(100),

    assunto VARCHAR(200),

    opcao_escolhida VARCHAR(200),

    localizacao TEXT NOT NULL,

    detalhes TEXT NOT NULL,

    foto TEXT,

    latitude DECIMAL(10,8),

    longitude DECIMAL(11,8),

    endereco_completo TEXT,

    bairro VARCHAR(150),

    cidade VARCHAR(150),

    estado VARCHAR(100),

    status status_ocorrencia_enum DEFAULT 'PENDENTE',

    prioridade prioridade_enum DEFAULT 'NORMAL',

    anonima BOOLEAN DEFAULT FALSE,

    atendente_id INTEGER,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    concluido_em TIMESTAMP,

    CONSTRAINT fk_ocorrencia_usuario
        FOREIGN KEY (usuario_id)
        REFERENCES usuarios(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_ocorrencia_atendente
        FOREIGN KEY (atendente_id)
        REFERENCES funcionarios(id)
        ON DELETE SET NULL
);

CREATE TRIGGER trg_ocorrencias_atualizado_em
BEFORE UPDATE ON ocorrencias
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_modificacao();

-- =====================================================
-- TABELA: DENÚNCIAS ANÔNIMAS
-- =====================================================

CREATE TABLE denuncias_anonimas (
    id SERIAL PRIMARY KEY,

    tipo VARCHAR(150) NOT NULL DEFAULT 'Denúncia Anônima',

    categoria VARCHAR(100),

    assunto VARCHAR(200),

    opcao_escolhida VARCHAR(200),

    localizacao TEXT NOT NULL,

    detalhes TEXT NOT NULL,

    foto TEXT,

    latitude DECIMAL(10,8),

    longitude DECIMAL(11,8),

    endereco_completo TEXT,

    bairro VARCHAR(150),

    cidade VARCHAR(150),

    estado VARCHAR(100),

    status status_ocorrencia_enum DEFAULT 'PENDENTE',

    prioridade prioridade_enum DEFAULT 'ALTA',

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    concluido_em TIMESTAMP
);

CREATE TRIGGER trg_denuncias_anonimas_atualizado_em
BEFORE UPDATE ON denuncias_anonimas
FOR EACH ROW
EXECUTE FUNCTION atualizar_data_modificacao();

-- =====================================================
-- TABELA: HISTÓRICO DAS OCORRÊNCIAS
-- =====================================================

CREATE TABLE historico_ocorrencias (
    id SERIAL PRIMARY KEY,

    ocorrencia_id INTEGER,

    funcionario_id INTEGER,

    status_anterior status_ocorrencia_enum,

    status_novo status_ocorrencia_enum,

    acao VARCHAR(150),

    observacao TEXT,

    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

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
-- ÍNDICES PARA MELHORAR BUSCAS
-- =====================================================

CREATE INDEX idx_usuarios_cpf
ON usuarios(cpf);

CREATE INDEX idx_usuarios_tipo
ON usuarios(tipo);

CREATE INDEX idx_usuarios_ativo
ON usuarios(ativo);

CREATE INDEX idx_empresas_nome
ON empresas(nome);

CREATE INDEX idx_empresas_ativo
ON empresas(ativo);

CREATE INDEX idx_funcionarios_usuario_id
ON funcionarios(usuario_id);

CREATE INDEX idx_funcionarios_empresa
ON funcionarios(empresa);

CREATE INDEX idx_pets_usuario_id
ON pets(usuario_id);

CREATE INDEX idx_pets_desaparecido
ON pets(desaparecido);

CREATE INDEX idx_ocorrencias_usuario_id
ON ocorrencias(usuario_id);

CREATE INDEX idx_ocorrencias_status
ON ocorrencias(status);

CREATE INDEX idx_ocorrencias_prioridade
ON ocorrencias(prioridade);

CREATE INDEX idx_ocorrencias_criado_em
ON ocorrencias(criado_em);

CREATE INDEX idx_denuncias_status
ON denuncias_anonimas(status);

CREATE INDEX idx_denuncias_prioridade
ON denuncias_anonimas(prioridade);

CREATE INDEX idx_denuncias_criado_em
ON denuncias_anonimas(criado_em);

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
ON uf.id = f.usuario_id;-- =====================================================
-- VIEW: CHAMADOS PARA PROFISSIONAIS
-- =====================================================

CREATE VIEW view_chamados_profissionais AS
SELECT
    id,
    'ocorrencia' AS origem,
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
    'anonima' AS origem,
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
    'Anônimo' AS nome_usuario,
    NULL AS cpf_usuario,
    NULL AS foto_usuario
FROM denuncias_anonimas;

-- =====================================================
-- DADOS INICIAIS: EMPRESAS / BASES
-- =====================================================

INSERT INTO empresas
(
    nome,
    tipo,
    cnpj,
    telefone,
    email,
    endereco,
    ativo
)
VALUES
(
    'Safe Life Matriz',
    'Base Safe Life',
    '',
    '(11) 97777-0000',
    'contato@safelife.com',
    'Base principal do sistema Safe Life',
    TRUE
),
(
    'ONG Patas Livres',
    'ONG parceira',
    '',
    '(11) 98888-0000',
    'contato@pataslivres.org',
    'Atendimento comunitário e resgate animal',
    TRUE
),
(
    'Centro de Controle de Zoonoses',
    'Órgão público',
    '',
    '(11) 3333-0000',
    'zoonoses@safelife.com',
    'Apoio em fiscalização e controle sanitário',
    TRUE
),
(
    'Protetores Independentes Associados',
    'Protetores independentes',
    '',
    '(11) 92222-0000',
    'protetores@safelife.com',
    'Rede de lares temporários e voluntários',
    TRUE
);

-- =====================================================
-- DADOS INICIAIS: USUÁRIOS
-- =====================================================

INSERT INTO usuarios
(
    nome,
    cpf,
    senha_hash,
    email,
    telefone,
    tipo,
    empresa,
    foto_perfil,
    ativo
)
VALUES
(
    'Vitor Chineque',
    '11111111111',
    '123456',
    'vitor.chinequero@safelife.com',
    '(11) 99999-0000',
    'citizen',
    NULL,
    'img/vitor-chineque.jpg',
    TRUE
),
(
    'Zeca do Santos',
    '99999999999',
    '123456',
    'zeca.dos.animais@safelife.com',
    '(11) 98888-0000',
    'professional',
    'Safe Life Matriz',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    TRUE
),
(
    'Gustavo Siri',
    '45317828791',
    '123456',
    'gustavo.siriguejo@safelife.com',
    '(11) 97777-0000',
    'admin',
    'Safe Life Matriz',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
    TRUE
);

-- =====================================================
-- DADOS INICIAIS: FUNCIONÁRIO TESTE
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
    'Centro e bairros próximos',
    'Disponível',
    'Carro de resgate',
    'Equipe Alpha',
    'Profissional responsável por triagem, resgate e acompanhamento inicial de chamados.',
    TRUE
FROM usuarios
WHERE cpf = '99999999999';

-- =====================================================
-- DADOS INICIAIS: ADMIN COMO SUPERVISOR OPERACIONAL
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
-- DADOS INICIAIS: PET TESTE
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
    'São Paulo - Zona Sul',
    'Pet cadastrado para demonstração do sistema.',
    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150&q=80',
    TRUE
FROM usuarios
WHERE cpf = '11111111111';

-- =====================================================
-- DADOS INICIAIS: OCORRÊNCIAS IDENTIFICADAS
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
    'Cachorro assustado correndo próximo aos carros. Parece estar perdido e com risco de atropelamento.',
    'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=600&q=80',
    -23.550520,
    -46.633308,
    'Rua das Flores - Centro - São Paulo - SP',
    'Centro',
    'São Paulo',
    'SP',
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
    'Gato aparentemente ferido, parado na calçada, sem conseguir andar direito.',
    'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=600&q=80',
    -23.551000,
    -46.634000,
    'Avenida Principal - Bairro Novo - São Paulo - SP',
    'Bairro Novo',
    'São Paulo',
    'SP',
    'PENDENTE',
    'CRITICA',
    FALSE
FROM usuarios
WHERE cpf = '11111111111';-- =====================================================
-- DADOS INICIAIS: DENÚNCIAS ANÔNIMAS
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
    'Cachorro preso no quintal aparentemente sem água e sem comida há alguns dias.',
    'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?auto=format&fit=crop&w=600&q=80',
    -23.552000,
    -46.635000,
    'Rua Esperança - Jardim América - São Paulo - SP',
    'Jardim América',
    'São Paulo',
    'SP',
    'PENDENTE',
    'ALTA'
),
(
    'Denúncia Anônima',
    'anonymous',
    'Animal acorrentado',
    'Animal acorrentado',
    'Travessa das Palmeiras - Vila Verde',
    'Animal fica acorrentado o dia inteiro, sem abrigo adequado contra chuva e sol.',
    'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&w=600&q=80',
    -23.553000,
    -46.636000,
    'Travessa das Palmeiras - Vila Verde - São Paulo - SP',
    'Vila Verde',
    'São Paulo',
    'SP',
    'PENDENTE',
    'ALTA'
);

-- =====================================================
-- HISTÓRICO INICIAL
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
    f.id,
    NULL,
    'PENDENTE',
    'Chamado criado',
    'Ocorrência registrada automaticamente pelo sistema.'
FROM ocorrencias o
LEFT JOIN funcionarios f
ON f.empresa = 'Safe Life Matriz'
LIMIT 2;

-- =====================================================
-- CONSULTAS DE TESTE
-- =====================================================

-- Ver todos os usuários:
-- SELECT * FROM view_usuarios_completos;

-- Ver todas as ocorrências identificadas:
-- SELECT * FROM view_ocorrencias_completas;

-- Ver chamados do painel profissional:
-- SELECT * FROM view_chamados_profissionais ORDER BY criado_em DESC;

-- Ver empresas:
-- SELECT * FROM empresas;

-- Ver funcionários:
-- SELECT * FROM funcionarios;

-- =====================================================
-- CONTAS DE TESTE
-- =====================================================

-- CIDADÃO:
-- CPF: 11111111111
-- Nome: Vitor Chineque

-- PROFISSIONAL:
-- CPF: 99999999999
-- Empresa: Safe Life Matriz

-- ADMINISTRADOR MASTER:
-- CPF: 45317828791

-- =====================================================
-- FIM DO BANCO SAFE LIFE
-- =====================================================
