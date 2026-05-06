// --- ESTADO LOCAL GLOBAL DO ECOSSISTEMA ---
let dbOcorrencias = [];
let meusPets = [
    { nome: "Ademir", idade: 3, especie: "Gato", local: "Casa (Padrão)", foto: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=120&q=80" }
];
let cadastrosSimulados = [];
let usuarioLogado = null;

// --- MOTOR DE NAVEGAÇÃO INTERNA ---
function nextScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) {
        target.classList.add('active');
        window.scrollTo(0,0);
    }
}

// --- CONFIGURAÇÃO DE FLUXOS VISUAIS NOS FORMULÁRIOS ---
function toggleRegCompanyField() {
    const type = document.getElementById('regType').value;
    document.getElementById('companyRegWrapper').style.display = (type === 'professional') ? 'block' : 'none';
}

function toggleLoginCompanyField() {
    const role = document.getElementById('loginRole').value;
    document.getElementById('loginCompanyWrapper').style.display = (role === 'professional') ? 'block' : 'none';
}

// --- CADASTRO INTEGRADO ---
function efetuarCadastro() {
    const nome = document.getElementById('regName').value;
    const cpf = document.getElementById('regCpf').value;
    const type = document.getElementById('regType').value;
    const company = document.getElementById('regCompany').value;

    if(!nome || !cpf) { alert("Dados incompletos!"); return; }

    cadastrosSimulados.push({ nome, cpf, type, company: type === 'professional' ? company : 'Nenhum' });
    alert("Cadastro pré-aprovado! Prossiga com o login informando seu perfil.");
    document.getElementById('cpfInput').value = cpf;
    nextScreen('loginScreen');
}

// --- LOGIN BIFURCADO E VALIDADO ---
function autenticar() {
    const cpf = document.getElementById('cpfInput').value;
    const role = document.getElementById('loginRole').value;
    const company = document.getElementById('loginCompany').value;

    // Atalhos Rápidos para Teste Direto
    if(cpf === '11111111111' && role === 'citizen') {
        usuarioLogado = { nome: "Cidadão de Testes", type: "citizen" };
        nextScreen('menuScreen');
        return;
    }
    if(cpf === '99999999999' && role === 'professional') {
        usuarioLogado = { nome: "Agente Operacional", type: "professional", company: company };
        abrirPainelProfissional();
        return;
    }

    // Procura no array de contas registradas
    const conta = cadastrosSimulados.find(u => u.cpf === cpf && u.type === role);
    if(conta) {
        usuarioLogado = conta;
        if(role === 'citizen') {
            nextScreen('menuScreen');
        } else {
            abrirPainelProfissional();
        }
    } else {
        alert("Conta não localizada ou tipo de perfil incorreto para este CPF!");
    }
}

function abrirPainelProfissional() {
    document.getElementById('proWelcomeName').innerText = `Agente: ${usuarioLogado.nome}`;
    document.getElementById('proCompanyName').innerText = `🏢 Unidade: ${usuarioLogado.company}`;
    nextScreen('proDashboard');
}

function logout() {
    usuarioLogado = null;
    document.getElementById('cpfInput').value = '';
    nextScreen('loginScreen');
}

// --- FLUXO DINÂMICO DE ANEXOS E PETS DO CIDADÃO ---
function openCitizenForm(title, key) {
    document.getElementById('formTitle').innerText = title;
    document.getElementById('formKey').value = key;
    
    // Habilita campos adicionais se for Registro de Pet
    const petFields = document.getElementById('conditionalPetFields');
    petFields.style.display = (key === 'register_pet') ? 'block' : 'none';
    
    nextScreen('scrForm');
}

function registrarAcao(event) {
    event.preventDefault();
    const key = document.getElementById('formKey').value;
    const titulo = document.getElementById('formTitle').innerText;
    const assunto = document.getElementById('formSubject').value;
    const localizacao = document.getElementById('formLocation').value;
    const detalhes = document.getElementById('formDetails').value;
    
    if(key === 'register_pet') {
        // Fluxo de criação de Pet
        const idade = document.getElementById('petAge').value || "Não informada";
        const especie = document.getElementById('petBreed').value || "Não especificada";
        
        meusPets.push({
            nome: assunto, idade, especie, local: localizacao,
            foto: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=120&q=80" // Placeholder foto
        });
        
        triggerToast("🐾 Novo pet indexado ao seu perfil!");
        document.getElementById('confirmMsg').innerText = `Seu pet "${assunto}" foi salvo e registrado com segurança.`;
    } else {
        // Envia para o Painel do Funcionário ler
        dbOcorrencias.push({
            id: Date.now(), tipo: titulo, assunto, localizacao, detalhes, anonimo: false,
            hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        });
        triggerToast("🚀 Ocorrência transmitida para as viaturas!");
        document.getElementById('confirmMsg').innerText = `Seu relato de "${titulo}" foi enviado à central regional de resgates.`;
    }

    event.target.reset();
    nextScreen('confirmationScreen');
}

// --- TELA EXCLUSIVA DE DENÚNCIAS ANÔNIMAS ---
function openAnonForm() {
    nextScreen('scrAnonForm');
}

function registrarAcaoAnonima(event) {
    event.preventDefault();
    const assunto = document.getElementById('anonSubject').value;
    const localizacao = document.getElementById('anonLocation').value;
    const detalhes = document.getElementById('anonDetails').value;

    dbOcorrencias.push({
        id: Date.now(), tipo: "🔴 DENÚNCIA ANÔNIMA BLINDADA", assunto, localizacao, detalhes, anonimo: true,
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });

    triggerToast("🛡️ Denúncia Blindada Enviada Sem Rastros!");
    document.getElementById('confirmMsg').innerText = "Denúncia Processada. Seus metadados pessoais foram totalmente descartados.";
    
    event.target.reset();
    nextScreen('confirmationScreen');
}

// --- RENDERIZADORES DE PERFIL E CONFIGS ---
function renderPerfilCidadao() {
    if(usuarioLogado) {
        document.getElementById('citizenProfileName').innerText = usuarioLogado.name || usuarioLogado.nome || "Usuário Ativo";
    }
    
    const container = document.getElementById('myPetsContainer');
    container.innerHTML = '';

    meusPets.forEach(pet => {
        const item = document.createElement('div');
        item.style = 'display:flex; align-items:center; gap:12px; margin-top:10px; border-top:1px solid rgba(0,0,0,0.05); padding-top:10px;';
        item.innerHTML = `
            <img src="${pet.foto}" style="width:45px; height:45px; border-radius:10px; object-fit:cover;">
            <div>
                <strong style="font-size:14px;">${pet.nome} (${pet.especie})</strong><br>
                <small style="font-size:11px; color:var(--text-light)">Idade: ${pet.idade} anos | Região: ${pet.local}</small>
            </div>
        `;
        container.appendChild(item);
    });

    nextScreen('citizenProfile');
}

function salvarDadosPerfil() {
    triggerToast("💾 Configurações de conta salvas!");
}

function atualizarFotoPerfil(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profileAvatar').src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function alternarModoEscuro() {
    const isDark = document.getElementById('darkModeToggle').checked;
    if(isDark) {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

// --- INTERFACE DO AGENTE / FUNCIONÁRIO ---
function abrirOcorrenciasPro() {
    const container = document.getElementById('listaIntegradaPro');
    container.innerHTML = '';

    if(dbOcorrencias.length === 0) {
        container.innerHTML = '<div class="occurrence-card" style="text-align:center;"><p>Fila limpa. Sem chamados operacionais ativos.</p></div>';
    } else {
        dbOcorrencias.forEach(item => {
            const card = document.createElement('div');
            card.className = 'occurrence-card';
            if(item.anonimo) card.style.borderLeft = '6px solid #ef4444';
            
            card.innerHTML = `
                <strong>${item.tipo}</strong> <small>(${item.hora})</small><br>
                <span>Fato: ${item.assunto}</span><br>
                <span style="color:var(--blue-accent); font-weight:bold;">📍 Alvo/Local: ${item.localizacao}</span>
                <p style="background:rgba(0,0,0,0.02); padding:8px; border-radius:8px; margin:5px 0;">${item.detalhes}</p>
                <button class="btn" style="padding:10px; font-size:12px; margin:0;" onclick="resolverChamado(${item.id})">Despachar Resgate para este GPS 🚗</button>
            `;
            container.appendChild(card);
        });
    }
    nextScreen('proListScreen');
}

function resolverChamado(id) {
    dbOcorrencias = dbOcorrencias.filter(o => o.id !== id);
    estatisticasPro.atendimentos++;
    alert("Viatura alocada em tempo real para as coordenadas especificadas.");
    abrirOcorrenciasPro();
}

// --- NOTIFICAÇÃO TOAST ---
function triggerToast(text) {
    const t = document.getElementById('toast');
    t.innerText = text;
    t.style.top = '24px';
    setTimeout(() => t.style.top = '-100px', 3500);
}
