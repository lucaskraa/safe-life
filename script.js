// --- ESTADO LOCAL GLOBAL DO ECOSSISTEMA ---
/* ==========================================================================
   1. ESTADO DA APLICAÇÃO (BANCO DE DADOS EM MEMÓRIA VIRTUAL)
   ========================================================================== */
let dbOcorrencias = [];
let meusPets = [
    { nome: "Ademir", idade: 3, especie: "Gato", local: "Casa (Padrão)", foto: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=120&q=80" }
];
let estatisticasPro = { chamadosAtendidos: 0 };
let cadastrosSimulados = [];
let usuarioLogado = null;

// --- MOTOR DE NAVEGAÇÃO INTERNA ---
// Registro Base de Animais (Gato Ademir pré-existente no sistema)
let meusPets = [
    { 
        nome: "Ademir", 
        idade: 3, 
        especie: "Gato", 
        local: "São Paulo - Zona Sul", 
        foto: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150&q=80" 
    }
];

/* ==========================================================================
   2. MOTOR DE NAVEGAÇÃO E TRANSIÇÃO DE TELAS
   ========================================================================== */
function nextScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) {
        target.classList.add('active');
        window.scrollTo(0,0);
    // Oculta todas as telas ativas do ecossistema
    document.querySelectorAll('.screen').forEach(screenElement => {
        screenElement.classList.remove('active');
    });
    
    // Ativa a tela de destino solicitada
    const targetScreen = document.getElementById(id);
    if (targetScreen) {
        targetScreen.classList.add('active');
        window.scrollTo(0, 0); // Reseta o scroll para o topo
    }
}

// --- CONFIGURAÇÃO DE FLUXOS VISUAIS NOS FORMULÁRIOS ---
/* ==========================================================================
   3. FILTROS E EXIBIÇÃO CONDICIONAL DE CAMPOS (TRIAGEM CORPORATIVA)
   ========================================================================== */
function toggleRegCompanyField() {
    const type = document.getElementById('regType').value;
    document.getElementById('companyRegWrapper').style.display = (type === 'professional') ? 'block' : 'none';
    const currentSelection = document.getElementById('regType').value;
    const companyBlock = document.getElementById('companyRegWrapper');
    // Só exibe a seleção de empresa/instituição se for perfil operacional
    companyBlock.style.display = (currentSelection === 'professional') ? 'block' : 'none';
}

function toggleLoginCompanyField() {
    const role = document.getElementById('loginRole').value;
    document.getElementById('loginCompanyWrapper').style.display = (role === 'professional') ? 'block' : 'none';
    const currentSelection = document.getElementById('loginRole').value;
    const companyBlock = document.getElementById('loginCompanyWrapper');
    // Exigência estrita de vínculo corporativo para login de funcionário
    companyBlock.style.display = (currentSelection === 'professional') ? 'block' : 'none';
}

// --- CADASTRO INTEGRADO ---
/* ==========================================================================
   4. SISTEMA DE CADASTRO E SISTEMA DE LOGINS (BIFURCAÇÃO CIVIL / AGENTE)
   ========================================================================== */
function efetuarCadastro() {
    const nome = document.getElementById('regName').value;
    const cpf = document.getElementById('regCpf').value;
    const type = document.getElementById('regType').value;
    const company = document.getElementById('regCompany').value;

    if(!nome || !cpf) { alert("Dados incompletos!"); return; }
    if (!nome || !cpf) { 
        alert("Erro regulamentar: Preencha todos os campos obrigatórios para validar o cadastro."); 
        return; 
    }

    // Armazena a conta no vetor de homologação temporária
    cadastrosSimulados.push({ 
        nome: nome, 
        cpf: cpf, 
        type: type, 
        company: type === 'professional' ? company : 'Nenhum' 
    });

    cadastrosSimulados.push({ nome, cpf, type, company: type === 'professional' ? company : 'Nenhum' });
    alert("Cadastro pré-aprovado! Prossiga com o login informando seu perfil.");
    alert(`Sucesso! Conta criada para ${nome}. Faça o login utilizando seu portal.`);
    
    // Auto-preenche os campos de login para facilitar a usabilidade
    document.getElementById('cpfInput').value = cpf;
    document.getElementById('loginRole').value = type;
    toggleLoginCompanyField();
    nextScreen('loginScreen');
}

// --- LOGIN BIFURCADO E VALIDADO ---
function autenticar() {
    const cpf = document.getElementById('cpfInput').value;
    const role = document.getElementById('loginRole').value;
    const company = document.getElementById('loginCompany').value;
    const inputCpf = document.getElementById('cpfInput').value;
    const chosenRole = document.getElementById('loginRole').value;
    const chosenCompany = document.getElementById('loginCompany').value;

    // Atalhos Rápidos para Teste Direto
    if(cpf === '11111111111' && role === 'citizen') {
        usuarioLogado = { nome: "Cidadão de Testes", type: "citizen" };
    // --- BYPASS DE HOMOLOGAÇÃO (MASSA DE TESTE RÁPIDA) ---
    if (inputCpf === '11111111111' && chosenRole === 'citizen') {
        usuarioLogado = { nome: "Cidadão Exemplo", type: "citizen" };
        triggerToast("👋 Bem-vindo ao Safe Life Central!");
        nextScreen('menuScreen');
        return;
    }
    if(cpf === '99999999999' && role === 'professional') {
        usuarioLogado = { nome: "Agente Operacional", type: "professional", company: company };
        abrirPainelProfissional();
    if (inputCpf === '99999999999' && chosenRole === 'professional') {
        usuarioLogado = { nome: "Agente Técnico Plantonista", type: "professional", company: chosenCompany };
        triggerToast("🔒 Terminal Operacional Conectado.");
        inicializarPainelPro();
        return;
    }

    // Procura no array de contas registradas
    const conta = cadastrosSimulados.find(u => u.cpf === cpf && u.type === role);
    if(conta) {
        usuarioLogado = conta;
        if(role === 'citizen') {
    // --- BUSCA NO BANCO DINÂMICO LOCAL ---
    const contaLocalizada = cadastrosSimulados.find(user => user.cpf === inputCpf && user.type === chosenRole);
    
    if (contaLocalizada) {
        usuarioLogado = contaLocalizada;
        if (chosenRole === 'citizen') {
            triggerToast(`Olá ${usuarioLogado.nome}, ambiente carregado.`);
            nextScreen('menuScreen');
        } else {
            abrirPainelProfissional();
            triggerToast("Terminal de monitoramento corporativo inicializado.");
            inicializarPainelPro();
        }
    } else {
        alert("Conta não localizada ou tipo de perfil incorreto para este CPF!");
        alert("Falha de Autenticação: Verifique as credenciais e o portal de entrada selecionado.");
    }
}

function abrirPainelProfissional() {
function inicializarPainelPro() {
    document.getElementById('proWelcomeName').innerText = `Agente: ${usuarioLogado.nome}`;
    document.getElementById('proCompanyName').innerText = `🏢 Unidade: ${usuarioLogado.company}`;
    document.getElementById('proCompanyName').innerText = `🏢 Corporação: ${usuarioLogado.company}`;
    nextScreen('proDashboard');
}

function logout() {
    usuarioLogado = null;
    document.getElementById('cpfInput').value = '';
    triggerToast("Sessão encerrada com segurança.");
    nextScreen('loginScreen');
}

// --- FLUXO DINÂMICO DE ANEXOS E PETS DO CIDADÃO ---
/* ==========================================================================
   5. COLETA DE DADOS: FORMULÁRIOS DINÂMICOS, FOTO E LOCALIZAÇÃO
   ========================================================================== */
function openCitizenForm(title, key) {
    document.getElementById('formTitle').innerText = title;
    document.getElementById('formKey').value = key;

    // Habilita campos adicionais se for Registro de Pet
    const petFields = document.getElementById('conditionalPetFields');
    petFields.style.display = (key === 'register_pet') ? 'block' : 'none';
    // Condicional para abrir a idade e a espécie apenas quando for cadastro de pet
    const petFieldsContainer = document.getElementById('conditionalPetFields');
    petFieldsContainer.style.display = (key === 'register_pet') ? 'block' : 'none';

    nextScreen('scrForm');
}

function registrarAcao(event) {
    event.preventDefault();
    const key = document.getElementById('formKey').value;
    const titulo = document.getElementById('formTitle').innerText;
    const assunto = document.getElementById('formSubject').value;
    const localizacao = document.getElementById('formLocation').value;
    const detalhes = document.getElementById('formDetails').value;
    const chaveFormulario = document.getElementById('formKey').value;
    const tituloOcorrencia = document.getElementById('formTitle').innerText;
    const assuntoPrincipal = document.getElementById('formSubject').value;
    const campoLocalizacao = document.getElementById('formLocation').value;
    const campoDetalhes = document.getElementById('formDetails').value;

    if(key === 'register_pet') {
        // Fluxo de criação de Pet
        const idade = document.getElementById('petAge').value || "Não informada";
        const especie = document.getElementById('petBreed').value || "Não especificada";
    if (chaveFormulario === 'register_pet') {
        // Fluxo de Negócio: Salvar animal de estimação diretamente no perfil do usuário
        const idadeInformada = document.getElementById('petAge').value || "0";
        const especieInformada = document.getElementById('petBreed').value || "Animal";

        meusPets.push({
            nome: assunto, idade, especie, local: localizacao,
            foto: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=120&q=80" // Placeholder foto
            nome: assuntoPrincipal,
            idade: idadeInformada,
            especie: especieInformada,
            local: campoLocalizacao,
            foto: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=150&q=80" // Placeholder premium para novas fotos
        });

        triggerToast("🐾 Novo pet indexado ao seu perfil!");
        document.getElementById('confirmMsg').innerText = `Seu pet "${assunto}" foi salvo e registrado com segurança.`;
        triggerToast("🐾 Novo pet registrado na sua conta!");
        document.getElementById('confirmMsg').innerText = `O pet "${assuntoPrincipal}" foi cadastrado e agora aparece na sua lista de configurações.`;
    } else {
        // Envia para o Painel do Funcionário ler
        // Fluxo de Negócio: Direcionar denúncia/chamado para a fila de triagem do funcionário
        dbOcorrencias.push({
            id: Date.now(), tipo: titulo, assunto, localizacao, detalhes, anonimo: false,
            hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            id: Date.now(),
            tipo: tituloOcorrencia,
            assunto: assuntoPrincipal,
            localizacao: campoLocalizacao,
            detalhes: campoDetalhes,
            isAnonima: false,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        });
        triggerToast("🚀 Ocorrência transmitida para as viaturas!");
        document.getElementById('confirmMsg').innerText = `Seu relato de "${titulo}" foi enviado à central regional de resgates.`;
        triggerToast("🚀 Ocorrência transmitida com sucesso!");
        document.getElementById('confirmMsg').innerText = `Sua solicitação de "${assuntoPrincipal}" foi enviada com sucesso para os agentes locais.`;
    }

    event.target.reset();
    event.target.reset(); // Limpa o formulário
    nextScreen('confirmationScreen');
}

// --- TELA EXCLUSIVA DE DENÚNCIAS ANÔNIMAS ---
/* ==========================================================================
   6. PROTOCOLO BLINDADO E CRIPTOGRAFADO DE DENÚNCIA ANÔNIMA
   ========================================================================== */
function openAnonForm() {
    nextScreen('scrAnonForm');
}
@@ -143,103 +200,135 @@ function registrarAcaoAnonima(event) {
    const localizacao = document.getElementById('anonLocation').value;
    const detalhes = document.getElementById('anonDetails').value;

    // Registra a ocorrência na fila mantendo a identidade e metadados totalmente em branco
    dbOcorrencias.push({
        id: Date.now(), tipo: "🔴 DENÚNCIA ANÔNIMA BLINDADA", assunto, localizacao, detalhes, anonimo: true,
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        id: Date.now(),
        tipo: "🚨 DENÚNCIA ULTRA-ANÔNIMA CRIPTOGRAFADA",
        assunto: assunto,
        localizacao: localizacao,
        detalhes: detalhes,
        isAnonima: true,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });

    triggerToast("🛡️ Denúncia Blindada Enviada Sem Rastros!");
    document.getElementById('confirmMsg').innerText = "Denúncia Processada. Seus metadados pessoais foram totalmente descartados.";
    triggerToast("🛡️ Denúncia Blindada Enviada sem Rastros!");
    document.getElementById('confirmMsg').innerText = "Denúncia anônima processada com sucesso. Nenhuma credencial de conta ou IP foi gravado no servidor local.";

    event.target.reset();
    nextScreen('confirmationScreen');
}

// --- RENDERIZADORES DE PERFIL E CONFIGS ---
/* ==========================================================================
   7. INTERFACE DE CONFIGURAÇÕES, HISTÓRICO DE PETS E VISUAL VISUALIZAÇÃO
   ========================================================================== */
function renderPerfilCidadao() {
    if(usuarioLogado) {
        document.getElementById('citizenProfileName').innerText = usuarioLogado.name || usuarioLogado.nome || "Usuário Ativo";
    if (usuarioLogado) {
        document.getElementById('citizenProfileName').innerText = usuarioLogado.nome;
    }

    const container = document.getElementById('myPetsContainer');
    container.innerHTML = '';
    const listContainer = document.getElementById('myPetsContainer');
    listContainer.innerHTML = ''; // Reseta o container visual

    // Loop que renderiza todos os pets salvos (garantindo o Ademir ativo)
    meusPets.forEach(pet => {
        const item = document.createElement('div');
        item.style = 'display:flex; align-items:center; gap:12px; margin-top:10px; border-top:1px solid rgba(0,0,0,0.05); padding-top:10px;';
        item.innerHTML = `
            <img src="${pet.foto}" style="width:45px; height:45px; border-radius:10px; object-fit:cover;">
        const itemBox = document.createElement('div');
        itemBox.className = 'pet-item-box';
        itemBox.innerHTML = `
            <img src="${pet.foto}" style="width:50px; height:50px; border-radius:12px; object-fit:cover; border:1px solid rgba(0,0,0,0.1);">
            <div>
                <strong style="font-size:14px;">${pet.nome} (${pet.especie})</strong><br>
                <small style="font-size:11px; color:var(--text-light)">Idade: ${pet.idade} anos | Região: ${pet.local}</small>
                <strong style="font-size:15px; display:block;">${pet.nome} (${pet.especie})</strong>
                <small style="font-size:12px; color:var(--text-light)">Idade: ${pet.idade} anos | Local/Abrigo: ${pet.local}</small>
            </div>
        `;
        container.appendChild(item);
        listContainer.appendChild(itemBox);
    });

    nextScreen('citizenProfile');
}

function salvarDadosPerfil() {
    triggerToast("💾 Configurações de conta salvas!");
    triggerToast("💾 Alterações cadastrais gravadas com sucesso.");
}

function atualizarFotoPerfil(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profileAvatar').src = e.target.result;
function atualizarFotoPerfil(inputElement) {
    if (inputElement.files && inputElement.files[0]) {
        const fileReader = new FileReader();
        fileReader.onload = function(event) {
            document.getElementById('profileAvatar').src = event.target.result;
        };
        reader.readAsDataURL(input.files[0]);
        fileReader.readAsDataURL(inputElement.files[0]);
        triggerToast("📸 Preview da foto de perfil atualizado.");
    }
}

function alternarModoEscuro() {
    const isDark = document.getElementById('darkModeToggle').checked;
    if(isDark) {
    const toggleState = document.getElementById('darkModeToggle').checked;
    if (toggleState) {
        document.body.classList.add('dark-theme');
        triggerToast("🌙 Modo Escuro Ativado.");
    } else {
        document.body.classList.remove('dark-theme');
        triggerToast("☀️ Modo Claro Ativado.");
    }
}

// --- INTERFACE DO AGENTE / FUNCIONÁRIO ---
/* ==========================================================================
   8. INTERFACE DO TRABALHADOR OPERACIONAL E DESPACHO DE VIATURAS
   ========================================================================== */
function abrirOcorrenciasPro() {
    const container = document.getElementById('listaIntegradaPro');
    container.innerHTML = '';
    const queueContainer = document.getElementById('listaIntegradaPro');
    queueContainer.innerHTML = '';

    if(dbOcorrencias.length === 0) {
        container.innerHTML = '<div class="occurrence-card" style="text-align:center;"><p>Fila limpa. Sem chamados operacionais ativos.</p></div>';
    if (dbOcorrencias.length === 0) {
        queueContainer.innerHTML = `
            <div class="occurrence-card" style="text-align:center; border-left-color: var(--text-light);">
                <p style="font-size: 14px; color: var(--text-light); margin: 0;">Fila de monitoramento limpa. Nenhum chamado pendente no quadrante.</p>
            </div>`;
    } else {
        dbOcorrencias.forEach(item => {
            const card = document.createElement('div');
            card.className = 'occurrence-card';
            if(item.anonimo) card.style.borderLeft = '6px solid #ef4444';
        dbOcorrencias.forEach(ocorrencia => {
            const cardElement = document.createElement('div');
            cardElement.className = 'occurrence-card';

            card.innerHTML = `
                <strong>${item.tipo}</strong> <small>(${item.hora})</small><br>
                <span>Fato: ${item.assunto}</span><br>
                <span style="color:var(--blue-accent); font-weight:bold;">📍 Alvo/Local: ${item.localizacao}</span>
                <p style="background:rgba(0,0,0,0.02); padding:8px; border-radius:8px; margin:5px 0;">${item.detalhes}</p>
                <button class="btn" style="padding:10px; font-size:12px; margin:0;" onclick="resolverChamado(${item.id})">Despachar Resgate para este GPS 🚗</button>
            // Atribui uma borda vermelha de alerta urgente caso seja denúncia anônima
            if (ocorrencia.isAnonima) {
                cardElement.style.borderLeftColor = '#ef4444';
            }
            
            cardElement.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <strong style="font-size:15px; color: var(--text-dark);">${ocorrencia.tipo}</strong>
                    <span style="font-size:12px; color:var(--text-light); font-weight:600;">${ocorrencia.timestamp}</span>
                </div>
                <div style="font-size:14px; margin-bottom:10px;">
                    <span style="display:block; margin-bottom:4px;"><strong>Caso / Raça:</strong> ${ocorrencia.assunto}</span>
                    <span style="color:var(--blue-accent); font-weight:600; display:block; margin-bottom:6px;">📍 GPS: ${ocorrencia.localizacao}</span>
                    <p style="background:rgba(0,0,0,0.02); padding:12px; border-radius:8px; font-size:13px; color:var(--text-dark); line-height:1.4;">${ocorrencia.detalhes}</p>
                </div>
                <button class="btn" style="padding:12px; font-size:13px; margin:0;" onclick="despacharViatura(${ocorrencia.id})">Despachar Ambulância/Viatura Operacional 🚒</button>
            `;
            container.appendChild(card);
            queueContainer.appendChild(cardElement);
        });
    }
    nextScreen('proListScreen');
}

function resolverChamado(id) {
    dbOcorrencias = dbOcorrencias.filter(o => o.id !== id);
    estatisticasPro.atendimentos++;
    alert("Viatura alocada em tempo real para as coordenadas especificadas.");
    abrirOcorrenciasPro();
function despacharViatura(idChamado) {
    // Remove o chamado da fila operando o resgate
    dbOcorrencias = dbOcorrencias.filter(item => item.id !== idChamado);
    estatisticasPro.chamadosAtendidos++;
    alert("Operação confirmada: Sirenes acionadas. Unidade de pronto-atendimento móvel veterinária a caminho das coordenadas!");
    abrirOcorrenciasPro(); // Recarrega a fila atualizada
}

// --- NOTIFICAÇÃO TOAST ---
function triggerToast(text) {
    const t = document.getElementById('toast');
    t.innerText = text;
    t.style.top = '24px';
    setTimeout(() => t.style.top = '-100px', 3500);
/* ==========================================================================
   9. BANNER FLUTUANTE DE AVISOS (TOAST INTERNO)
   ========================================================================== */
function triggerToast(mensagem) {
    const toastBox = document.getElementById('toast');
    toastBox.innerText = mensagem;
    toastBox.style.top = '30px'; // Desce o banner
    
    setTimeout(() => { 
        toastBox.style.top = '-100px'; // Recolhe o banner após 4 segundos
    }, 4000);
}
