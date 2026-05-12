const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(bodyParser.json());


let cadastrosUsuarios = [

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


app.post('/api/auth/login', (req, res) => {
    const { cpf, role, company } = req.body;

    const usuario = cadastrosUsuarios.find(user => user.cpf === cpf && user.type === role);

    if (!usuario) {
        return res.status(401).json({ error: "Credenciais inválidas ou perfil incorreto." });
    }

    if (role === 'professional' && company && usuario.company !== company) {
        return res.status(401).json({ error: "Vínculo corporativo divergente para este agente." });
    }

    return res.status(200).json({ message: "Autenticação bem-sucedida!", user: usuario });
});



app.post('/api/ocorrencias', (req, res) => {
    const { tipo, assunto, localizacao, detalhes } = req.body;

    if (!assunto || !localizacao || !detalhes) {
        return res.status(400).json({ error: "Informações de campo insuficientes." });
    }

    const novaOcorrencia = {
        id: Date.now(),
        tipo: tipo || "Chamado Geral",
        assunto,
        localizacao,
        detalhes,
        isAnonima: false,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    dbOcorrencias.push(novaOcorrencia);
    return res.status(201).json({ message: "Ocorrência enviada à central de triagem.", data: novaOcorrencia });
});
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


app.get('/api/ocorrencias', (req, res) => {
    return res.status(200).json(dbOcorrencias);
});

app.delete('/api/ocorrencias/:id', (req, res) => {
    const { id } = req.params;
    const totalAntes = dbOcorrencias.length;

    dbOcorrencias = dbOcorrencias.filter(item => item.id !== parseInt(id));

    if (dbOcorrencias.length === totalAntes) {
        return res.status(404).json({ error: "Chamado não localizado ou já atendido." });
    }

    return res.status(200).json({ message: "Unidade de resgate despachada! Chamado concluído." });
});


app.get('/api/pets', (req, res) => {
    return res.status(200).json(meusPets);
});

app.post('/api/pets', (req, res) => {
    const { nome, idade, especie, local } = req.body;

    if (!nome) {
        return res.status(400).json({ error: "Nome do animal é obrigatório." });
    }

    const novoPet = {
        id: Date.now(),
        nome,
        idade: idade || 0,
        especie: especie || "Animal",
        local: local || "Não informado",
        foto: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=150&q=80"
    };

    meusPets.push(novoPet);
    return res.status(201).json({ message: "Pet indexado com sucesso!", pet: novoPet });
});


app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 SERVIDOR SAFE LIFE ONLINE EM: http://localhost:${PORT}`);
    console.log(`🔒 Endpoints da API prontos para receber requisições.`);
    console.log(`====================================================`);
});
