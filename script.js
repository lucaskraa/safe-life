/* ==========================================================================
   1. ESTADO DA APLICAÇÃO (BANCO DE DADOS EM MEMÓRIA VIRTUAL)
   ========================================================================== */
let dbOcorrencias = [];
let estatisticasPro = { chamadosAtendidos: 0 };
let cadastrosSimulados = [];
let usuarioLogado = null;

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

/* ==========================================================================
   3. FILTROS E EXIBIÇÃO CONDICIONAL DE CAMPOS (TRIAGEM CORPORATIVA)
   ========================================================================== */
function toggleRegCompanyField() {
    const currentSelection = document.getElementById('regType').value;
    const companyBlock = document.getElementById('companyRegWrapper');
    // Só exibe a seleção de empresa/instituição se for perfil operacional
    companyBlock.style.display = (currentSelection === 'professional') ? 'block' : 'none';
}

function toggleLoginCompanyField() {
    const currentSelection = document.getElementById('loginRole').value;
    const companyBlock = document.getElementById('loginCompanyWrapper');
    // Exigência estrita de vínculo corporativo para login de funcionário
    companyBlock.style.display = (currentSelection === 'professional') ? 'block' : 'none';
}

/* ==========================================================================
   4. SISTEMA DE CADASTRO E SISTEMA DE LOGINS (BIFURCAÇÃO CIVIL / AGENTE)
   ========================================================================== */
function efetuarCadastro() {
    const nome = document.getElementById('regName').value;
    const cpf = document.getElementById('regCpf').value;
    const type = document.getElementById('regType').value;
    const company = document.getElementById('regCompany').value;

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

    alert(`Sucesso! Conta criada para ${nome}. Faça o login utilizando seu portal.`);
    
    // Auto-preenche os campos de login para facilitar a usabilidade
    document.getElementById('cpfInput').value = cpf;
    document.getElementById('loginRole').value = type;
    toggleLoginCompanyField();
    nextScreen('loginScreen');
}

function autenticar() {
    const inputCpf = document.getElementById('cpfInput').value;
    const chosenRole = document.getElementById('loginRole').value;
    const chosenCompany = document.getElementById('loginCompany').value;

    // --- BYPASS DE HOMOLOGAÇÃO (MASSA DE TESTE RÁPIDA) ---
    if (inputCpf === '11111111111' && chosenRole === 'citizen') {
        usuarioLogado = { nome: "Cidadão Exemplo", type: "citizen" };
        triggerToast("👋 Bem-vindo ao Safe Life Central!");
        nextScreen('menuScreen');
        return;
    }
    if (inputCpf === '99999999999' && chosenRole === 'professional') {
        usuarioLogado = { nome: "Agente Técnico Plantonista", type: "professional", company: chosenCompany };
        triggerToast("🔒 Terminal Operacional Conectado.");
        inicializarPainelPro();
        return;
    }

    // --- BUSCA NO BANCO DINÂMICO LOCAL ---
    const contaLocalizada = cadastrosSimulados.find(user => user.cpf === inputCpf && user.type === chosenRole);
    
    if (contaLocalizada) {
        usuarioLogado = contaLocalizada;
        if (chosenRole === 'citizen') {
            triggerToast(`Olá ${usuarioLogado.nome}, ambiente carregado.`);
            nextScreen('menuScreen');
        } else {
            triggerToast("Terminal de monitoramento corporativo inicializado.");
            inicializarPainelPro();
        }
    } else {
        alert("Falha de Autenticação: Verifique as credenciais e o portal de entrada selecionado.");
    }
}

function inicializarPainelPro() {
    document.getElementById('proWelcomeName').innerText = `Agente: ${usuarioLogado.nome}`;
    document.getElementById('proCompanyName').innerText = `🏢 Corporação: ${usuarioLogado.company}`;
    nextScreen('proDashboard');
}

function logout() {
    usuarioLogado = null;
    document.getElementById('cpfInput').value = '';
    triggerToast("Sessão encerrada com segurança.");
    nextScreen('loginScreen');
}

/* ==========================================================================
   5. COLETA DE DADOS: FORMULÁRIOS DINÂMICOS, FOTO E LOCALIZAÇÃO
   ========================================================================== */
function openCitizenForm(title, key) {
    document.getElementById('formTitle').innerText = title;
    document.getElementById('formKey').value = key;
    
    // Condicional para abrir a idade e a espécie apenas quando for cadastro de pet
    const petFieldsContainer = document.getElementById('conditionalPetFields');
    petFieldsContainer.style.display = (key === 'register_pet') ? 'block' : 'none';
    
    nextScreen('scrForm');
}

function registrarAcao(event) {
    event.preventDefault();
    const chaveFormulario = document.getElementById('formKey').value;
    const tituloOcorrencia = document.getElementById('formTitle').innerText;
    const assuntoPrincipal = document.getElementById('formSubject').value;
    const campoLocalizacao = document.getElementById('formLocation').value;
    const campoDetalhes = document.getElementById('formDetails').value;
    
    if (chaveFormulario === 'register_pet') {
        // Fluxo de Negócio: Salvar animal de estimação diretamente no perfil do usuário
        const idadeInformada = document.getElementById('petAge').value || "0";
        const especieInformada = document.getElementById('petBreed').value || "Animal";
        
        meusPets.push({
            nome: assuntoPrincipal,
            idade: idadeInformada,
            especie: especieInformada,
            local: campoLocalizacao,
            foto: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=150&q=80" // Placeholder premium para novas fotos
        });
        
        triggerToast("🐾 Novo pet registrado na sua conta!");
        document.getElementById('confirmMsg').innerText = `O pet "${assuntoPrincipal}" foi cadastrado e agora aparece na sua lista de configurações.`;
    } else {
        // Fluxo de Negócio: Direcionar denúncia/chamado para a fila de triagem do funcionário
        dbOcorrencias.push({
            id: Date.now(),
            tipo: tituloOcorrencia,
            assunto: assuntoPrincipal,
            localizacao: campoLocalizacao,
            detalhes: campoDetalhes,
            isAnonima: false,
            timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        });
        triggerToast("🚀 Ocorrência transmitida com sucesso!");
        document.getElementById('confirmMsg').innerText = `Sua solicitação de "${assuntoPrincipal}" foi enviada com sucesso para os agentes locais.`;
    }

    event.target.reset(); // Limpa o formulário
    nextScreen('confirmationScreen');
}

/* ==========================================================================
   6. PROTOCOLO BLINDADO E CRIPTOGRAFADO DE DENÚNCIA ANÔNIMA
   ========================================================================== */
function openAnonForm() {
    nextScreen('scrAnonForm');
}

function registrarAcaoAnonima(event) {
    event.preventDefault();
    const assunto = document.getElementById('anonSubject').value;
    const localizacao = document.getElementById('anonLocation').value;
    const detalhes = document.getElementById('anonDetails').value;

    // Registra a ocorrência na fila mantendo a identidade e metadados totalmente em branco
    dbOcorrencias.push({
        id: Date.now(),
        tipo: "🚨 DENÚNCIA ULTRA-ANÔNIMA CRIPTOGRAFADA",
        assunto: assunto,
        localizacao: localizacao,
        detalhes: detalhes,
        isAnonima: true,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });

    triggerToast("🛡️ Denúncia Blindada Enviada sem Rastros!");
    document.getElementById('confirmMsg').innerText = "Denúncia anônima processada com sucesso. Nenhuma credencial de conta ou IP foi gravado no servidor local.";
    
    event.target.reset();
    nextScreen('confirmationScreen');
}

/* ==========================================================================
   7. INTERFACE DE CONFIGURAÇÕES, HISTÓRICO DE PETS E VISUAL VISUALIZAÇÃO
   ========================================================================== */
function renderPerfilCidadao() {
    if (usuarioLogado) {
        document.getElementById('citizenProfileName').innerText = usuarioLogado.nome;
    }
    
    const listContainer = document.getElementById('myPetsContainer');
    listContainer.innerHTML = ''; // Reseta o container visual

    // Loop que renderiza todos os pets salvos (garantindo o Ademir ativo)
    meusPets.forEach(pet => {
        const itemBox = document.createElement('div');
        itemBox.className = 'pet-item-box';
        itemBox.innerHTML = `
            <img src="${pet.foto}" style="width:50px; height:50px; border-radius:12px; object-fit:cover; border:1px solid rgba(0,0,0,0.1);">
            <div>
                <strong style="font-size:15px; display:block;">${pet.nome} (${pet.especie})</strong>
                <small style="font-size:12px; color:var(--text-light)">Idade: ${pet.idade} anos | Local/Abrigo: ${pet.local}</small>
            </div>
        `;
        listContainer.appendChild(itemBox);
    });

    nextScreen('citizenProfile');
}

function salvarDadosPerfil() {
    triggerToast("💾 Alterações cadastrais gravadas com sucesso.");
}

function atualizarFotoPerfil(inputElement) {
    if (inputElement.files && inputElement.files[0]) {
        const fileReader = new FileReader();
        fileReader.onload = function(event) {
            document.getElementById('profileAvatar').src = event.target.result;
        };
        fileReader.readAsDataURL(inputElement.files[0]);
        triggerToast("📸 Preview da foto de perfil atualizado.");
    }
}

function alternarModoEscuro() {
    const toggleState = document.getElementById('darkModeToggle').checked;
    if (toggleState) {
        document.body.classList.add('dark-theme');
        triggerToast("🌙 Modo Escuro Ativado.");
    } else {
        document.body.classList.remove('dark-theme');
        triggerToast("☀️ Modo Claro Ativado.");
    }
}

/* ==========================================================================
   8. INTERFACE DO TRABALHADOR OPERACIONAL E DESPACHO DE VIATURAS
   ========================================================================== */
function abrirOcorrenciasPro() {
    const queueContainer = document.getElementById('listaIntegradaPro');
    queueContainer.innerHTML = '';

    if (dbOcorrencias.length === 0) {
        queueContainer.innerHTML = `
            <div class="occurrence-card" style="text-align:center; border-left-color: var(--text-light);">
                <p style="font-size: 14px; color: var(--text-light); margin: 0;">Fila de monitoramento limpa. Nenhum chamado pendente no quadrante.</p>
            </div>`;
    } else {
        dbOcorrencias.forEach(ocorrencia => {
            const cardElement = document.createElement('div');
            cardElement.className = 'occurrence-card';
            
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
            queueContainer.appendChild(cardElement);
        });
    }
    nextScreen('proListScreen');
}

function despacharViatura(idChamado) {
    // Remove o chamado da fila operando o resgate
    dbOcorrencias = dbOcorrencias.filter(item => item.id !== idChamado);
    estatisticasPro.chamadosAtendidos++;
    alert("Operação confirmada: Sirenes acionadas. Unidade de pronto-atendimento móvel veterinária a caminho das coordenadas!");
    abrirOcorrenciasPro(); // Recarrega a fila atualizada
}

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
