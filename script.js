// --- ESTADO CENTRALIZADO DA APLICAÇÃO ---
let reports = []; 
let cachedUser = null; 
let atendimentosCount = 12;

// --- MOTOR DE NAVEGAÇÃO INTERNA (Alternador de Telas) ---
function nextScreen(screenId) {
    // Oculta todas as telas do app
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    // Ativa apenas a tela desejada
    const TargetScreen = document.getElementById(screenId);
    if(TargetScreen) TargetScreen.classList.add('active');
    
    // Joga o foco do scroll para o topo da nova tela
    window.scrollTo(0,0);
}

// --- CONTROLADOR EXIBIÇÃO DE EMPRESAS (Cadastro Condicional) ---
function toggleCompanySelection() {
    const type = document.getElementById('regType').value;
    const wrapper = document.getElementById('companyFieldWrapper');
    
    // Se for profissional, exibe o seletor de instituições parceiras
    wrapper.style.display = (type === 'professional') ? 'block' : 'none';
}

// --- LÓGICA DE CADASTRO ---
function handleRegister() {
    const name = document.getElementById('regName').value;
    const cpf = document.getElementById('regCpf').value;
    const type = document.getElementById('regType').value;
    const company = document.getElementById('regCompany').value;

    if(!name || !cpf) {
        alert("Preencha seu Nome e CPF para concluir o cadastro.");
        return;
    }

    // Salva o usuário em memória temporária
    cachedUser = { 
        name, 
        cpf, 
        type, 
        company: type === 'professional' ? company : 'Nenhum' 
    };
    
    alert("Cadastro efetuado! Use seu CPF para acessar o painel correspondente.");
    document.getElementById('cpfInput').value = cpf;
    nextScreen('loginScreen');
}

// --- LÓGICA DE LOGIN ---
function handleLogin() {
    const cpf = document.getElementById('cpfInput').value;
    
    // Atalhos/Mocks para testes rápidos sem precisar cadastrar
    if (cpf === '11111111111') {
        cachedUser = { name: "Cidadão de Testes", type: "citizen" };
        nextScreen('menuScreen');
        return;
    } else if (cpf === '99999999999') {
        cachedUser = { name: "Agente de Campo", type: "professional", company: "Safe Life Matriz" };
        loadProfessionalDashboard();
        return;
    }

    // Validação do cadastro em cache
    if(cachedUser && cachedUser.cpf === cpf) {
        if(cachedUser.type === 'citizen') {
            nextScreen('menuScreen');
        } else {
            loadProfessionalDashboard();
        }
    } else {
        alert("CPF não localizado no banco local. Por favor, faça o cadastro primeiro.");
    }
}

// Carrega os dados específicos no painel do profissional
function loadProfessionalDashboard() {
    document.getElementById('proName').innerText = `Olá, ${cachedUser.name}`;
    document.getElementById('proDisplayCompany').innerText = cachedUser.company;
    nextScreen('proDashboardScreen');
}

// Limpa o campo de entrada e desloga o usuário
function logout() {
    document.getElementById('cpfInput').value = '';
    nextScreen('loginScreen');
}

// --- FLUXO DO CIDADÃO (Abertura de Chamados) ---
function openFormDirect(title) {
    document.getElementById('dynamicFormTitle').innerText = title;
    nextScreen('emergencyScreen');
}

function submitReport() {
    const tipoForm = document.getElementById('dynamicFormTitle').innerText;
    const data = {
        id: Date.now(),
        tipo: tipoForm,
        animal: document.getElementById('em_tipo').value,
        local: document.getElementById('em_local').value,
        desc: document.getElementById('em_desc').value,
        status: 'Pendente'
    };

    // Insere o chamado na lista global
    reports.push(data); 

    // NOTIFICAÇÃO CIDADÃO: Feedback imediato de envio bem-sucedido
    triggerToast("✅ Denúncia realizada! Uma equipe está a caminho.", false);
    
    // NOTIFICAÇÃO CRUZADA: Dispara o push simulado na central do profissional em background
    simulateProAlert(tipoForm);

    // Limpeza padrão dos inputs do formulário
    document.getElementById('em_tipo').value = '';
    document.getElementById('em_local').value = '';
    document.getElementById('em_desc').value = '';
    
    nextScreen('menuScreen');
}

// --- FLUXO DO PROFISSIONAL (Gestão Operacional) ---
function renderOccurrences() {
    const container = document.getElementById('listContainer');
    container.innerHTML = '';

    if (reports.length === 0) {
        container.innerHTML = '<div class="occurrence-card" style="text-align:center;"><p>Nenhum chamado operacional em aberto.</p></div>';
    } else {
        // Monta os cards dinamicamente com base nas denúncias dos cidadãos
        reports.forEach(report => {
            const card = document.createElement('div');
            card.className = 'occurrence-card';
            card.innerHTML = `
                <h4>🚨 ${report.tipo}: ${report.animal}</h4>
                <p>📍 <strong>Local:</strong> ${report.local}</p>
                <p style="background:#f9f9f9; padding:10px; border-radius:10px;">${report.desc}</p>
                <button class="pro-btn" onclick="atenderOcorrencia(${report.id})">Assumir e Despachar Resgate 🚗</button>
            `;
            container.appendChild(card);
        });
    }
    nextScreen('proListScreen');
}

function atenderOcorrencia(id) {
    // Remove da lista de pendentes e incrementa a meta/contador do profissional
    reports = reports.filter(r => r.id !== id);
    atendimentosCount++;
    document.getElementById('countAtendimentos').innerText = atendimentosCount;
    
    alert("Chamado assumido! Ordem de serviço enviada para a viatura de campo.");
    renderOccurrences();
}

// --- SISTEMA DE TOAST NOTIFICATIONS (Animação Push Superior) ---
function triggerToast(text, isProNotification = false) {
    const toast = document.getElementById('notificationToast');
    toast.innerText = text;
    
    // Aplica estilo diferenciado se for um alerta operacional do funcionário
    if(isProNotification) {
        toast.classList.add('pro-alert');
    } else {
        toast.classList.remove('pro-alert');
    }

    // Desce o Toast
    toast.style.top = '20px';
    
    // Recolhe o Toast após 5 segundos
    setTimeout(() => { 
        toast.style.top = '-100px'; 
    }, 5000);
}

// Simula o recebimento de uma notificação após um pequeno delay de rede (2.5s)
function simulateProAlert(tipoChamado) {
    setTimeout(() => {
        triggerToast(`🚨 Alerta: Novo chamado de resgate pendente: "${tipoChamado}"!`, true);
    }, 2500);
}
