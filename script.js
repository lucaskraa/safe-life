// --- ESTADO CENTRALIZADO DA APLICAÇÃO ---
let dbOcorrencias = [];
let estatisticasPro = { atendimentos: 0 };
const counters = { emergency: 0, register: 0, report: 0, anonymous: 0, rescue: 0 };
let cadastrosSimulados = []; 

// --- MOTOR DE NAVEGAÇÃO INTERNA ---
function nextScreen(id) {
    // Esconde todas as telas ativas
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    // Ativa a tela desejada
    const target = document.getElementById(id);
    if(target) {
        target.classList.add('active');
        window.scrollTo(0,0);
    }
}

// --- CONTROLE DE EXIBIÇÃO DE EMPRESAS NO CADASTRO ---
function toggleCompanyField() {
    const type = document.getElementById('regType').value;
    const wrapper = document.getElementById('companySelectionWrapper');
    
    // Se for profissional, exibe o seletor de instituições parceiras
    if (wrapper) {
        wrapper.style.display = (type === 'professional') ? 'block' : 'none';
    }
}

// --- LÓGICA DE CADASTRO ---
function efetuarCadastro() {
    const nome = document.getElementById('regName').value;
    const cpf = document.getElementById('regCpf').value;
    const type = document.getElementById('regType').value;
    const company = document.getElementById('regCompany').value;

    if(!nome || !cpf) {
        alert("Preencha Nome e CPF para continuar."); 
        return;
    }

    // Armazena temporariamente no array de cadastros local
    cadastrosSimulados.push({
        nome, 
        cpf, 
        type, 
        company: type === 'professional' ? company : 'Nenhum'
    });

    alert(`Cadastro de ${nome} realizado com sucesso! Prossiga com o seu login.`);
    
    // Preenche o campo de login automaticamente para facilitar
    const cpfInput = document.getElementById('cpfInput');
    if (cpfInput) cpfInput.value = cpf;
    
    nextScreen('loginScreen');
}

// --- AUTENTICAÇÃO E DIRECIONAMENTO (Bifurcação de Perfil) ---
function autenticar() {
    const cpf = document.getElementById('cpfInput').value;
    
    // Mocks / Atalhos rápidos para testes solicitados
    if(cpf === '11111111111') { 
        nextScreen('menuScreen'); 
        return; 
    }
    if(cpf === '99999999999') { 
        document.getElementById('proWelcomeName').innerText = "Olá, Agente";
        document.getElementById('proCompanyName').innerText = "Safe Life Matriz";
        nextScreen('proDashboard'); 
        return; 
    }

    // Validação nos cadastros criados dinamicamente
    const usuario = cadastrosSimulados.find(u => u.cpf === cpf);
    if(usuario) {
        if(usuario.type === 'citizen') { 
            nextScreen('menuScreen'); 
        } else {
            document.getElementById('proWelcomeName').innerText = `Olá, ${usuario.nome}`;
            document.getElementById('proCompanyName').innerText = usuario.company;
            nextScreen('proDashboard');
        }
    } else {
        alert("CPF não encontrado na base de dados local!");
    }
}

// --- LOGOUT ---
function logout() {
    const cpfInput = document.getElementById('cpfInput');
    if (cpfInput) cpfInput.value = '';
    nextScreen('loginScreen');
}

// --- FLUXO DO CIDADÃO (Envio de Formulários) ---
function openCitizenForm(title, key) {
    document.getElementById('formTitle').innerText = title;
    document.getElementById('formKey').value = key;
    nextScreen('scrForm');
}

function registrarAcao(event) {
    event.preventDefault();
    const tipo = document.getElementById('formTitle').innerText;
    const chave = document.getElementById('formKey').value;
    
    // Adiciona o chamado na fila global que o profissional enxerga
    dbOcorrencias.push({
        id: Date.now(), 
        tipo: tipo,
        descricao: document.getElementById('formDetails').value,
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });

    // Incrementa os contadores de controle
    if (counters[chave] !== undefined) counters[chave]++;
    
    // Dispara a animação do Toast superior de 10 min
    mostrarToast(); 

    // Altera a mensagem de sucesso dinamicamente
    const confirmMsg = document.getElementById('confirmMsg');
    if (confirmMsg) confirmMsg.innerText = `Ocorrência de ${tipo} registrada com sucesso.`;
    
    // Limpa o formulário e envia para a tela de confirmação
    event.target.reset();
    nextScreen('confirmationScreen');
}

// --- FLUXO DO PROFISSIONAL (Visualização e Atendimento) ---
function abrirOcorrencias() {
    const container = document.getElementById('listaIntegrada');
    if (!container) return;
    
    container.innerHTML = '';
    
    if(dbOcorrencias.length === 0) {
        container.innerHTML = '<div class="occurrence-card" style="text-align:center;"><p>Nenhuma ocorrência operacional pendente no momento.</p></div>';
    } else {
        // Renderiza os cards dinamicamente baseados nas denúncias dos cidadãos
        dbOcorrencias.forEach(item => {
            const card = document.createElement('div');
            card.className = 'occurrence-card';
            card.innerHTML = `
                <strong>🚨 ${item.tipo}</strong><br>
                <small>Horário: ${item.hora}</small>
                <p style="background: #f8f9fa; padding: 10px; border-radius: 10px; margin-top: 8px;">${item.descricao}</p>
                <button class="btn" style="padding: 12px; font-size: 13px; margin: 5px 0 0 0;" onclick="atender(${item.id})">Assumir e Enviar Equipe 🚗</button>
            `;
            container.appendChild(card);
        });
    }
    nextScreen('proListScreen');
}

function atender(id) {
    // Remove o chamado resolvido do banco de dados
    dbOcorrencias = dbOcorrencias.filter(i => i.id !== id);
    
    // Alimenta as metas internas do profissional
    estatisticasPro.atendimentos++;
    
    alert("Chamado assumido! Ordem de serviço enviada para a viatura de campo.");
    abrirOcorrencias();
}

function abrirPerfilPro() {
    const totalAtendimentos = document.getElementById('totalAtendimentos');
    if (totalAtendimentos) totalAtendimentos.innerText = estatisticasPro.atendimentos;
    nextScreen('proProfile');
}

// --- PUSH TOAST NOTIFICATION SUPERIOR ---
function mostrarToast() {
    const toast = document.getElementById('toast') || document.getElementById('notificationToast');
    if (toast) {
        toast.style.top = '24px';
        setTimeout(() => { 
            toast.style.top = '-100px'; 
        }, 4500);
    }
}
