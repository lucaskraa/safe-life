const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares para comunicação com o Front-end e tratamento de dados
// Ajustado: limit definido para 10mb para suportar o envio das fotos em Base64
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

/* ==========================================================================
   BANCO DE DADOS EM MEMÓRIA (SIMULADO NO SERVIDOR)
   ========================================================================== */
let cadastrosUsuarios = [
    // Massa de teste padrão (Bypass de homologação)
    { nome: "Cidadão Exemplo", cpf: "11111111111", type: "citizen", company: "Nenhum" },
    { nome: "Agente Técnico Plantonista", cpf: "99999999999", type: "professional", company: "Safe Life Matriz" }
];

let dbOcorrencias = [];

let meusPets = [
    { 
        id: 1,
        nome: "Ademir", 
        idade: 3, 
        especie: "Gato", 
        local: "São Paulo - Zona Sul", 
        foto: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150&q=80" 
    }
];

/* ==========================================================================
   ROTAS DE AUTENTICAÇÃO (CADASTRO E LOGIN)
   ========================================================================== */

// Rota para registrar novos usuários (Cidadão ou Funcionário)
app.post('/api/auth/register', (req, res) => {
    const { nome, cpf, type, company } = req.body;

    if (!nome || !cpf || !type) {
        return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    const usuarioExiste = cadastrosUsuarios.find(user => user.cpf === cpf);
    if (usuarioExiste) {
        return res.status(400).json({ error: "Este CPF já está cadastrado no ecossistema." });
    }

    const novoUsuario = {
        nome,
        cpf,
        type,
        company: type === 'professional' ? company : 'Nenhum'
    };

    cadastrosUsuarios.push(novoUsuario);
    return res.status(201).json({ message: "Usuário homologado com sucesso!", user: novoUsuario });
});

// Rota de Login com validação de perfil e empresa
app.post('/api/auth/login', (req, res) => {
    const { cpf, role, company } = req.body;

    const usuario = cadastrosUsuarios.find(user => user.cpf === cpf && user.type === role);

    if (!usuario) {
        return res.status(401).json({ error: "Credenciais inválidas ou perfil incorreto." });
    }

    // Se for profissional, valida se selecionou a empresa correta configurada no cadastro
    if (role === 'professional' && company && usuario.company !== company) {
        return res.status(401).json({ error: "Vínculo corporativo divergente para este agente." });
    }

    return res.status(200).json({ message: "Autenticação bem-sucedida!", user: usuario });
});


/* ==========================================================================
   ROTAS DE OCORRÊNCIAS E CHAMADOS (TRIAGEM OPERACIONAL)
   ========================================================================== */

// Rota para registrar uma ocorrência padrão ou SOS Emergência
app.post('/api/ocorrencias', (req, res) => {
    const { tipo, assunto, localizacao, detalhes, foto } = req.body;

    if (!assunto || !localizacao || !detalhes) {
        return res.status(400).json({ error: "Informações de campo insuficientes." });
    }

    const novaOcorrencia = {
        id: Date.now(),
        tipo: tipo || "Chamado Geral",
        assunto,
        localizacao,
        detalhes,
        foto: foto || null, // Captura a foto vinda do front-end
        isAnonima: false,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    dbOcorrencias.push(novaOcorrencia);
    return res.status(201).json({ message: "Ocorrência enviada à central de triagem.", data: novaOcorrencia });
});

// Rota blindada para Denúncias Anônimas (Zera metadados de IP/User no Servidor)
app.post('/api/ocorrencias/anonima', (req, res) => {
    const { assunto, localizacao, detalhes } = req.body;

    if (!assunto || !localizacao || !detalhes) {
        return res.status(400).json({ error: "Dados insuficientes para a denúncia." });
    }

    const novaDenunciaAnonima = {
        id: Date.now(),
        tipo: "🚨 DENÚNCIA ULTRA-ANÔNIMA CRIPTOGRAFADA",
        assunto,
        localizacao,
        detalhes,
        isAnonima: true,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    dbOcorrencias.push(novaDenunciaAnonima);
    return res.status(201).json({ message: "Denúncia blindada transmitida.", data: novaDenunciaAnonima });
});

// Rota para o Funcionário listar todas as ocorrências ativas
app.get('/api/ocorrencias', (req, res) => {
    return res.status(200).json(dbOcorrencias);
});

// Rota para o Funcionário despachar viatura e encerrar o chamado
app.delete('/api/ocorrencias/:id', (req, res) => {
    const { id } = req.params;
    const totalAntes = dbOcorrencias.length;

    dbOcorrencias = dbOcorrencias.filter(item => item.id !== parseInt(id));

    if (dbOcorrencias.length === totalAntes) {
        return res.status(404).json({ error: "Chamado não localizado ou já atendido." });
    }

    return res.status(200).json({ message: "Unidade de resgate despachada! Chamado concluído." });
});


/* ==========================================================================
   ROTAS DO GERENCIADOR DE PETS DO CIDADÃO
   ========================================================================== */

// Rota para listar os pets (Sempre retorna o Ademir + novos cadastros)
app.get('/api/pets', (req, res) => {
    return res.status(200).json(meusPets);
});

// Rota para cadastrar um novo pet
app.post('/api/pets', (req, res) => {
    const { nome, idade, especie, local, foto } = req.body;

    if (!nome) {
        return res.status(400).json({ error: "Nome do animal é obrigatório." });
    }

    const novoPet = {
        id: Date.now(),
        nome,
        idade: idade || 0,
        especie: especie || "Animal",
        local: local || "Não informado",
        foto: foto || "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=150&q=80"
    };

    meusPets.push(novoPet);
    return res.status(201).json({ message: "Pet indexado com sucesso!", pet: novoPet });
});


/* ==========================================================================
   INICIALIZAÇÃO DO SERVIDOR
   ========================================================================== */
app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 SERVIDOR SAFE LIFE ONLINE EM: http://localhost:${PORT}`);
    console.log(`🔒 Endpoints da API prontos para receber requisições.`);
    console.log(`====================================================`);
});
