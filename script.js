
/* =====================================================
   CONFIGURAÇÃO DAS OPÇÕES VISUAIS ORIGINAIS
   Necessário para o cidadão marcar a opção do problema
===================================================== */

var currentFormConfig = null;

var FORM_CONFIGS = {
    emergency: {
        title: "Emergência Animal",
        subtitle: "Casos graves que precisam de atendimento rápido.",
        priority: "ALTA",
        options: [
            {
                icon: "🚑",
                title: "Animal atropelado",
                desc: "Cachorro, gato ou outro animal ferido na rua."
            },
            {
                icon: "🩸",
                title: "Animal machucado",
                desc: "Ferimento visível, sangramento ou dor."
            },
            {
                icon: "🔥",
                title: "Animal em risco imediato",
                desc: "Preso, desmaiado, sem conseguir se mover ou em perigo."
            },
            {
                icon: "☠️",
                title: "Animal morto",
                desc: "Animal encontrado morto em via pública ou residência."
            }
        ]
    },

    report: {
        title: "Denúncia de Maus-tratos",
        subtitle: "Escolha a situação que melhor descreve o problema.",
        priority: "NORMAL",
        options: [
            {
                icon: "🚫",
                title: "Vizinho agredindo cachorro",
                desc: "Agressão física ou violência contra animal."
            },
            {
                icon: "⛓️",
                title: "Animal preso em corrente",
                desc: "Animal sem espaço, preso ou sem abrigo adequado."
            },
            {
                icon: "🏚️",
                title: "Canil clandestino",
                desc: "Local com muitos animais em situação irregular."
            },
            {
                icon: "🍽️",
                title: "Animal sem comida ou água",
                desc: "Abandono, fome, sede ou negligência."
            }
        ]
    },

    rescue: {
        title: "Resgate Animal",
        subtitle: "Solicite apoio para resgatar um animal.",
        priority: "NORMAL",
        options: [
            {
                icon: "🐶",
                title: "Cachorro abandonado",
                desc: "Cachorro sozinho, perdido ou largado na rua."
            },
            {
                icon: "🐱",
                title: "Gato abandonado",
                desc: "Gato perdido, filhote ou em situação de risco."
            },
            {
                icon: "🪜",
                title: "Animal preso",
                desc: "Animal preso em árvore, bueiro, telhado ou terreno."
            },
            {
                icon: "🍼",
                title: "Filhotes abandonados",
                desc: "Ninhada sem mãe ou abandonada em local perigoso."
            }
        ]
    },

    anonymous: {
        title: "Denúncia Anônima",
        subtitle: "Sua identidade não será mostrada.",
        priority: "ALTA",
        options: [
            {
                icon: "🕵️",
                title: "Maus-tratos anônimo",
                desc: "Denunciar agressão ou negligência sem mostrar nome."
            },
            {
                icon: "🏚️",
                title: "Canil clandestino",
                desc: "Local suspeito com animais em situação irregular."
            },
            {
                icon: "⛓️",
                title: "Animal preso ou mal cuidado",
                desc: "Animal acorrentado, sem água, comida ou abrigo."
            },
            {
                icon: "☠️",
                title: "Animal morto",
                desc: "Animal morto em local público ou abandonado."
            }
        ]
    }
};



/* =====================================================
   PRELUDE DE CONSERTO - SAFE LIFE
   Este bloco foi adicionado SEM apagar seu código original.
   Ele corrige:
   - funções globais faltando
   - localStorage
   - CPFs padrão
   - fotos padrão
   - carrossel com 5 imagens reais
   - imagem padrão do cadastro variando
===================================================== */

const SAFE_LIFE_FIX_VERSION = "original-opcoes-perfis-fotos-certas-2026-06-09";
const ADMIN_CPF = "45317828791";

const IMAGENS_USUARIOS_PADRAO = {
    vitor: "img/pequenochinique.jpeg",
    zeca: "img/corredorzeca.jpeg",
    gustavo: "img/apenasumsiri.jpeg"
};

const imagensCarrosselSafeLife = [
    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=1200&q=85",
    "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=1200&q=85"
];

const imagensCadastroSafeLife = [
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=85",
    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=85",
    "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=800&q=85"
];

let indiceCarrosselSafeLife = 0;
let indiceCadastroSafeLife = 0;
let fotoCadastroBase64 = "";
let usuarioLogado = null;
let dbOcorrencias = carregarJsonSeguro("safeLifeOcorrencias", []);
let meusPets = carregarJsonSeguro("safeLifePets", []);
let empresasCadastradas = carregarJsonSeguro("safeLifeEmpresas", [
    {
        id: "empresa-matriz",
        nome: "Safe Life Matriz",
        telefone: "(41) 99999-0000",
        email: "contato@safelife.com",
        ativo: true
    },
    {
        id: "empresa-ong",
        nome: "ONG Patas Livres",
        telefone: "(41) 98888-0000",
        email: "pataslivres@safelife.com",
        ativo: true
    },
    {
        id: "empresa-ccz",
        nome: "Centro de Controle de Zoonoses",
        telefone: "(41) 97777-0000",
        email: "ccz@safelife.com",
        ativo: true
    }
]);

let usuarios = carregarJsonSeguro("safeLifeUsuarios", []);

function carregarJsonSeguro(chave, fallback) {
    try {
        const raw = localStorage.getItem(chave);
        if (!raw) return fallback;
        const valor = JSON.parse(raw);
        return valor ?? fallback;
    } catch (erro) {
        return fallback;
    }
}

function salvarJsonSeguro(chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor));
}

function gerarId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function limparCpf(valor) {
    return String(valor || "").replace(/\D/g, "");
}

function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function formatarHorarioAgora() {
    return new Date().toLocaleString("pt-BR");
}

function escaparHtml(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function preencherCampoSeExistir(id, valor) {
    const el = document.getElementById(id);
    if (el) el.textContent = valor ?? "";
}

function preencherInputSeExistir(id, valor) {
    const el = document.getElementById(id);
    if (el) el.value = valor ?? "";
}

function triggerToast(mensagem) {
    const toast = document.getElementById("toast");
    if (!toast) {
        console.log(mensagem);
        return;
    }

    toast.textContent = mensagem;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

function nextScreen(screenId) {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });

    const target = document.getElementById(screenId);

    if (!target) {
        console.error("Tela não encontrada:", screenId);
        triggerToast("Tela não encontrada: " + screenId);
        return;
    }

    target.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });

    if (screenId === "registerScreen") {
        atualizarImagemCadastroPadrao();
    }
}

function arquivoParaBase64(arquivo) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(arquivo);
    });
}

async function apiRequest(endpoint, options = {}) {
    const url = endpoint.startsWith("http")
        ? endpoint
        : "http://localhost:3000" + endpoint;

    const config = {
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        },
        ...options
    };

    const resposta = await fetch(url, config);

    if (!resposta.ok) {
        const texto = await resposta.text().catch(() => "");
        throw new Error(texto || "Erro na API");
    }

    return resposta.json();
}

function salvarUsuarios() {
    salvarJsonSeguro("safeLifeUsuarios", usuarios);
}

function salvarOcorrencias() {
    salvarJsonSeguro("safeLifeOcorrencias", dbOcorrencias);
}

function salvarPets() {
    salvarJsonSeguro("safeLifePets", meusPets);
}

function salvarEmpresas() {
    salvarJsonSeguro("safeLifeEmpresas", empresasCadastradas);
}

function atualizarUsuarioLocal(user) {
    if (!user || !user.cpf) return;

    const cpf = limparCpf(user.cpf);
    const index = usuarios.findIndex(item => limparCpf(item.cpf) === cpf);

    if (index >= 0) {
        usuarios[index] = {
            ...usuarios[index],
            ...user,
            cpf
        };
    } else {
        usuarios.push({
            ...user,
            cpf,
            id: user.id || gerarId()
        });
    }

    usuarioLogado = usuarios.find(item => limparCpf(item.cpf) === cpf) || user;
    salvarUsuarios();
}

function registrarAuditoria(acao, detalhe) {
    console.log("[AUDITORIA]", acao, detalhe || "");
}

function garantirAdminLocal() {
    const versaoAtual = localStorage.getItem("safeLifeFixVersion");

    if (versaoAtual !== SAFE_LIFE_FIX_VERSION) {
        usuarios = usuarios.filter(user => !["11111111111", "99999999999", ADMIN_CPF].includes(limparCpf(user.cpf)));
        localStorage.setItem("safeLifeFixVersion", SAFE_LIFE_FIX_VERSION);
    }

    const usuariosPadrao = [
        {
            id: "cidadao-vitor",
            nome: "Vitor Chineque",
            name: "Vitor Chineque",
            cpf: "11111111111",
            email: "vitor.chinequero@safelife.com",
            telefone: "(41) 99999-1111",
            type: "citizen",
            role: "citizen",
            company: "Nenhum",
            foto: IMAGENS_USUARIOS_PADRAO.vitor,
            avatar: IMAGENS_USUARIOS_PADRAO.vitor,
            ativo: true
        },
        {
            id: "profissional-zeca",
            nome: "Zeca do Santos",
            name: "Zeca do Santos",
            cpf: "99999999999",
            email: "zeca.dos.animais@safelife.com",
            telefone: "(41) 99999-9999",
            type: "professional",
            role: "professional",
            company: "Safe Life Matriz",
            empresa: "Safe Life Matriz",
            funcao: "Agente Operacional",
            status: "Disponível",
            foto: IMAGENS_USUARIOS_PADRAO.zeca,
            avatar: IMAGENS_USUARIOS_PADRAO.zeca,
            ativo: true
        },
        {
            id: "admin-gustavo",
            nome: "Gustavo Siri",
            name: "Gustavo Siri",
            cpf: ADMIN_CPF,
            email: "gustavo.siriguejo@safelife.com",
            telefone: "(41) 99999-4531",
            type: "admin",
            role: "admin",
            company: "Safe Life Administração",
            foto: IMAGENS_USUARIOS_PADRAO.gustavo,
            avatar: IMAGENS_USUARIOS_PADRAO.gustavo,
            ativo: true
        }
    ];

    usuariosPadrao.forEach(padrao => {
        const index = usuarios.findIndex(user => limparCpf(user.cpf) === limparCpf(padrao.cpf));

        if (index >= 0) {
            usuarios[index] = {
                ...usuarios[index],
                ...padrao,
                foto: padrao.foto,
                avatar: padrao.avatar,
                ativo: true
            };
        } else {
            usuarios.push({ ...padrao });
        }
    });

    salvarUsuarios();
}

function iniciarCarrossel() {
    const img = document.getElementById("welcomeCarouselImage");
    const thumb = document.getElementById("carouselSliderThumb");

    if (!img) return;

    function aplicarImagem() {
        const indice = indiceCarrosselSafeLife % imagensCarrosselSafeLife.length;
        img.src = imagensCarrosselSafeLife[indice];

        if (thumb) {
            const largura = 100 / imagensCarrosselSafeLife.length;
            thumb.style.width = largura + "%";
            thumb.style.marginLeft = (largura * indice) + "%";
        }
    }

    aplicarImagem();

    if (!window.__safeLifeCarouselTimer) {
        window.__safeLifeCarouselTimer = setInterval(() => {
            indiceCarrosselSafeLife = (indiceCarrosselSafeLife + 1) % imagensCarrosselSafeLife.length;
            aplicarImagem();
        }, 4200);
    }
}

function atualizarImagemCadastroPadrao() {
    if (fotoCadastroBase64) return;

    const preview = document.getElementById("regAvatarPreview");

    if (!preview) return;

    preview.src = imagensCadastroSafeLife[indiceCadastroSafeLife % imagensCadastroSafeLife.length];
    indiceCadastroSafeLife++;
}

function toggleRegCompanyField() {
    const tipo = document.getElementById("regType");
    const box = document.getElementById("regCompanyBox");

    if (!tipo || !box) return;

    box.style.display = tipo.value === "professional" ? "block" : "none";
}

function toggleLoginCompanyField() {
    const tipo = document.getElementById("loginRole");
    const box = document.getElementById("loginCompanyBox");

    if (!tipo || !box) return;

    box.style.display = tipo.value === "professional" ? "block" : "none";
}

function renderizarSelectEmpresas() {
    const selects = [
        "regCompany",
        "loginCompany",
        "editProCompany",
        "adminProCompany"
    ];

    const empresasAtivas = empresasCadastradas.filter(empresa => empresa.ativo !== false);

    selects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;

        const valorAtual = select.value || "Safe Life Matriz";
        select.innerHTML = "";

        empresasAtivas.forEach(empresa => {
            const option = document.createElement("option");
            option.value = empresa.nome;
            option.textContent = empresa.nome;
            select.appendChild(option);
        });

        if (empresasAtivas.some(empresa => empresa.nome === valorAtual)) {
            select.value = valorAtual;
        }
    });
}

window.addEventListener("load", () => {
    garantirAdminLocal();
    iniciarCarrossel();
    atualizarImagemCadastroPadrao();
});


/* =====================================================
   LOCALIZAÇÃO ATUAL
===================================================== */

function mostrarLoadingLocalizacao() {
    document.getElementById("locationLoading")?.classList.remove("hidden");
    document.getElementById("locationEmpty")?.classList.add("hidden");
    document.getElementById("locationResult")?.classList.add("hidden");

    const status = document.getElementById("gpsStatus");
    if (status) status.textContent = "📡 Buscando sua localização atual...";
}

function montarEnderecoCompleto(partes) {
    const ruaCompleta = partes.numero
        ? `${partes.rua}, ${partes.numero}`
        : partes.rua;

    return [
        ruaCompleta,
        partes.bairro,
        partes.cidade,
        partes.estado,
        partes.cep,
        partes.pais
    ]
        .filter(Boolean)
        .join(" - ");
}

function extrairPartesEndereco(data) {
    const a = data.address || {};

    return {
        rua: a.road || a.pedestrian || a.footway || a.residential || a.path || "Rua não identificada",
        numero: a.house_number || "",
        bairro: a.suburb || a.neighbourhood || a.quarter || a.city_district || a.district || "Bairro não identificado",
        cidade: a.city || a.town || a.village || a.municipality || a.county || "Cidade não identificada",
        estado: a.state || "Estado não identificado",
        cep: a.postcode || "",
        pais: a.country || "Brasil"
    };
}

async function buscarEndereco(latitude, longitude) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=pt-BR`;

    const resposta = await fetch(url, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    });

    if (!resposta.ok) {
        throw new Error("Falha ao buscar endereço.");
    }

    return resposta.json();
}

function renderizarLocalizacaoEncontrada(loc) {
    document.getElementById("locationLoading")?.classList.add("hidden");
    document.getElementById("locationEmpty")?.classList.add("hidden");
    document.getElementById("locationResult")?.classList.remove("hidden");

    preencherCampoSeExistir("gpsStatus", "✅ Localização atual encontrada com sucesso.");
    preencherCampoSeExistir("realAddressText", loc.enderecoCompleto);
    preencherCampoSeExistir("realStreet", loc.numero ? `${loc.rua}, ${loc.numero}` : loc.rua);
    preencherCampoSeExistir("realNeighborhood", loc.bairro);
    preencherCampoSeExistir("realCity", loc.cidade);
    preencherCampoSeExistir("realState", loc.estado);
    preencherCampoSeExistir("realCountry", loc.pais);

    preencherInputSeExistir("userLatitude", loc.latitude);
    preencherInputSeExistir("userLongitude", loc.longitude);
    preencherInputSeExistir("userFullAddress", loc.enderecoCompleto);
    preencherInputSeExistir("userNeighborhood", loc.bairro);
    preencherInputSeExistir("userCity", loc.cidade);
    preencherInputSeExistir("userState", loc.estado);

    const linkMapa = document.getElementById("openMapLink");

    if (linkMapa) {
        linkMapa.href = loc.mapa;
    }

    const continuarBtn = document.getElementById("continuarBtn");

    if (continuarBtn) {
        continuarBtn.style.display = "block";
    }
}

function renderizarErroLocalizacao(mensagem) {
    document.getElementById("locationLoading")?.classList.add("hidden");
    document.getElementById("locationResult")?.classList.add("hidden");

    const empty = document.getElementById("locationEmpty");

    if (empty) {
        empty.classList.remove("hidden");
        empty.textContent = mensagem;
    }

    preencherCampoSeExistir("gpsStatus", "❌ Não foi possível identificar sua localização atual.");
}

function solicitarLocalizacao(opcoes = {}) {
    const preencherCampo = opcoes.preencherCampo || null;
    const btn = document.getElementById("btnLocalizacao");

    mostrarLoadingLocalizacao();

    if (btn) {
        btn.disabled = true;
        btn.textContent = "Buscando localização...";
        btn.style.opacity = "0.75";
    }

    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            const msg = "Seu navegador não suporta localização.";
            renderizarErroLocalizacao(msg);

            if (btn) {
                btn.disabled = false;
                btn.textContent = "Ativar Minha Localização Atual 📡";
                btn.style.opacity = "1";
            }

            reject(new Error(msg));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const latitude = pos.coords.latitude;
                    const longitude = pos.coords.longitude;
                    const precisao = pos.coords.accuracy;

                    const dadosEndereco = await buscarEndereco(latitude, longitude);
                    const partes = extrairPartesEndereco(dadosEndereco);

                    localizacaoUsuario = {
                        latitude,
                        longitude,
                        precisao,
                        rua: partes.rua,
                        numero: partes.numero,
                        bairro: partes.bairro,
                        cidade: partes.cidade,
                        estado: partes.estado,
                        cep: partes.cep,
                        pais: partes.pais,
                        enderecoCompleto: montarEnderecoCompleto(partes),
                        mapa: `https://www.google.com/maps?q=${latitude},${longitude}`
                    };

                    renderizarLocalizacaoEncontrada(localizacaoUsuario);

                    if (preencherCampo) {
                        const campo = document.getElementById(preencherCampo);

                        if (campo) {
                            campo.value = localizacaoUsuario.enderecoCompleto;
                        }

                        const noteId =
                            preencherCampo === "formLocation"
                                ? "formLocationNote"
                                : preencherCampo === "anonLocation"
                                    ? "anonLocationNote"
                                    : null;

                        if (noteId) {
                            const note = document.getElementById(noteId);

                            if (note) {
                                note.textContent = `Localização atual preenchida: ${localizacaoUsuario.enderecoCompleto}`;
                            }
                        }

                        triggerToast("📍 Localização atual preenchida.");
                    } else {
                        triggerToast("📍 Endereço atual encontrado!");
                    }

                    resolve(localizacaoUsuario);

                } catch (erro) {
                    const msg = "O GPS foi ativado, mas o endereço não pôde ser convertido.";
                    renderizarErroLocalizacao(msg);
                    triggerToast("⚠️ GPS ativado, mas sem endereço atual.");
                    reject(erro);

                } finally {
                    if (btn) {
                        btn.disabled = false;
                        btn.textContent = "Atualizar Minha Localização Atual 📡";
                        btn.style.opacity = "1";
                    }
                }
            },

            (erro) => {
                let mensagem = "Não foi possível obter sua localização.";

                if (erro.code === 1) {
                    mensagem = "Permissão negada. Permita a localização no navegador e tente novamente.";
                } else if (erro.code === 2) {
                    mensagem = "Localização indisponível. Ative o GPS do seu aparelho.";
                } else if (erro.code === 3) {
                    mensagem = "Tempo esgotado ao buscar sua localização.";
                }

                renderizarErroLocalizacao(mensagem);

                if (btn) {
                    btn.disabled = false;
                    btn.textContent = "Ativar Minha Localização Atual 📡";
                    btn.style.opacity = "1";
                }

                reject(new Error(mensagem));
            },

            {
                enableHighAccuracy: true,
                timeout: 25000,
                maximumAge: 0
            }
        );
    });
}

async function usarMinhaLocalizacaoNoCampo(campoId) {
    const campo = document.getElementById(campoId);
    if (!campo) return;

    if (localizacaoUsuario && localizacaoUsuario.enderecoCompleto) {
        campo.value = localizacaoUsuario.enderecoCompleto;

        if (campoId === "formLocation") {
            const note = document.getElementById("formLocationNote");
            if (note) note.textContent = `Localização atual preenchida: ${localizacaoUsuario.enderecoCompleto}`;
        }

        if (campoId === "anonLocation") {
            const note = document.getElementById("anonLocationNote");
            if (note) note.textContent = `Localização atual preenchida: ${localizacaoUsuario.enderecoCompleto}`;
        }

        triggerToast("📍 Localização atual preenchida.");
        return;
    }

    try {
        await solicitarLocalizacao({ preencherCampo: campoId });
    } catch (erro) {
        console.log(erro);
    }
}

function renderizarSelectEmpresas() {
    const selects = [
        "regCompany",
        "loginCompany",
        "editProCompany",
        "adminProCompany"
    ];

    const empresasAtivas = empresasCadastradas.filter(empresa => empresa.ativo !== false);

    selects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;

        const valorAtual = select.value;
        select.innerHTML = "";

        empresasAtivas.forEach(empresa => {
            const option = document.createElement("option");
            option.value = empresa.nome;
            option.textContent = empresa.nome;
            select.appendChild(option);
        });

        if (valorAtual && empresasAtivas.some(empresa => empresa.nome === valorAtual)) {
            select.value = valorAtual;
        }
    });
}

/* =====================================================
   CADASTRO E LOGIN
===================================================== */

function toggleRegCompanyField() {
    const tipo = document.getElementById("regType");
    const wrapper = document.getElementById("companyRegWrapper");

    if (!tipo || !wrapper) return;

    wrapper.style.display = tipo.value === "professional" ? "block" : "none";
}

function toggleLoginCompanyField() {
    const role = document.getElementById("loginRole");
    const wrapper = document.getElementById("loginCompanyWrapper");

    if (!role || !wrapper) return;

    wrapper.style.display = role.value === "professional" ? "block" : "none";
}

async function previewFotoCadastro(input) {
    if (!input.files || !input.files[0]) return;

    const arquivo = input.files[0];

    if (!arquivo.type.startsWith("image/")) {
        alert("Selecione apenas arquivos de imagem.");
        input.value = "";
        return;
    }

    fotoCadastroBase64 = await arquivoParaBase64(arquivo);

    const preview = document.getElementById("regAvatarPreview");

    if (preview) {
        preview.src = fotoCadastroBase64;
    }
}

function limparFormularioCadastro() {
    ["regName", "regCpf", "regEmail", "regPhone"].forEach(id => {
        const campo = document.getElementById(id);
        if (campo) campo.value = "";
    });

    const foto = document.getElementById("regPhoto");
    if (foto) foto.value = "";

    const preview = document.getElementById("regAvatarPreview");

    if (preview) {
        preview.src = imagensCadastroSafeLife[indiceCadastroSafeLife % imagensCadastroSafeLife.length];
    }

    fotoCadastroBase64 = "";

    const regType = document.getElementById("regType");
    if (regType) regType.value = "citizen";

    toggleRegCompanyField();
}

async function efetuarCadastro() {
    const nome = document.getElementById("regName").value.trim();
    const cpf = limparCpf(document.getElementById("regCpf").value);
    const email = document.getElementById("regEmail").value.trim();
    const telefone = document.getElementById("regPhone").value.trim();
    const type = document.getElementById("regType").value;
    const company = document.getElementById("regCompany").value;

    if (!nome || !cpf || !email || !telefone) {
        alert("Preencha nome, CPF, e-mail e telefone.");
        return;
    }

    if (cpf.length !== 11) {
        alert("Digite um CPF válido com 11 números.");
        return;
    }

    if (cpf === ADMIN_CPF) {
        alert("Este CPF é reservado para o administrador do sistema.");
        return;
    }

    if (!validarEmail(email)) {
        alert("Digite um e-mail válido.");
        return;
    }

    if (type === "professional" && !company) {
        alert("Selecione a empresa do funcionário.");
        return;
    }

    const novoUsuarioPayload = {
        nome,
        cpf,
        email,
        telefone,
        type,
        company: type === "professional" ? company : "Nenhum",
        foto: fotoCadastroBase64 || "",
        ativo: true
    };

    try {
        const resposta = await apiRequest("/api/auth/register", {
            method: "POST",
            body: JSON.stringify(novoUsuarioPayload)
        });

        const user = resposta.user;
        user.ativo = true;
        atualizarUsuarioLocal(user);

        triggerToast("✅ Cadastro criado com sucesso!");
    } catch (erro) {
        const existeLocal = usuarios.some(u => u.cpf === cpf);

        if (existeLocal) {
            alert("Este CPF já está cadastrado.");
            return;
        }

        const usuarioLocal = {
            id: gerarId(),
            ...novoUsuarioPayload,
            foto: fotoCadastroBase64 || imagensCadastroSafeLife[(indiceCadastroSafeLife - 1 + imagensCadastroSafeLife.length) % imagensCadastroSafeLife.length]
        };

        usuarios.push(usuarioLocal);
        salvarUsuarios();

        triggerToast("✅ Cadastro criado com sucesso!");
    }

    document.getElementById("cpfInput").value = cpf;
    document.getElementById("loginRole").value = type;

    toggleLoginCompanyField();

    if (type === "professional") {
        const loginCompany = document.getElementById("loginCompany");
        if (loginCompany) loginCompany.value = company;
    }

    limparFormularioCadastro();
    nextScreen("loginScreen");
}

async function autenticar() {
    garantirAdminLocal();

    const cpf = limparCpf(document.getElementById("cpfInput").value);
    const role = document.getElementById("loginRole").value;
    const company = document.getElementById("loginCompany").value;

    if (!cpf) {
        alert("Digite seu CPF para entrar.");
        return;
    }

    if (cpf === ADMIN_CPF) {
        let admin = usuarios.find(user => user.cpf === ADMIN_CPF);

        if (!admin) {
            garantirAdminLocal();
            admin = usuarios.find(user => user.cpf === ADMIN_CPF);
        }

        admin.type = "admin";
        admin.ativo = true;
        usuarioLogado = admin;

        atualizarUsuarioLocal(usuarioLogado);
        registrarAuditoria("Login administrativo", "Administrador acessou a área administrativa.");
        inicializarPainelAdmin();
        triggerToast("👑 Área administrativa liberada.");
        return;
    }

    try {
        const resposta = await apiRequest("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ cpf, role, company })
        });

        usuarioLogado = resposta.user;
        usuarioLogado.ativo = true;
        atualizarUsuarioLocal(usuarioLogado);
    } catch (erro) {
        const usuario = usuarios.find(user => user.cpf === cpf && user.type === role);

        if (!usuario) {
            alert("Conta não encontrada. Verifique CPF e tipo de portal.");
            return;
        }

        if (usuario.ativo === false) {
            alert("Esta conta foi bloqueada pelo administrador.");
            return;
        }

        if (role === "professional" && usuario.company !== company) {
            alert("Empresa incorreta para este funcionário.");
            return;
        }

        usuarioLogado = usuario;
    }

    if (usuarioLogado.type === "professional") {
        inicializarPainelPro();
        triggerToast("🔒 Terminal profissional carregado.");
    } else {
        nextScreen("menuScreen");
        triggerToast(`👋 Olá, ${usuarioLogado.nome}!`);
    }
}

function logout() {
    usuarioLogado = null;
    triggerToast("Sessão encerrada.");
    nextScreen("loginScreen");
}

/* =====================================================
   OPÇÕES VISUAIS DOS FORMULÁRIOS
===================================================== */

function renderOptions(containerId, options, hiddenInputId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    options.forEach(option => {
        const card = document.createElement("div");
        card.className = "quick-option-card";

        card.innerHTML = `
            <div class="quick-option-icon">${option.icon}</div>
            <div class="quick-option-title">${escaparHtml(option.title)}</div>
            <div class="quick-option-desc">${escaparHtml(option.desc)}</div>
        `;

        card.addEventListener("click", () => {
            document
                .querySelectorAll(`#${containerId} .quick-option-card`)
                .forEach(c => c.classList.remove("selected"));

            card.classList.add("selected");

            const hidden = document.getElementById(hiddenInputId);

            if (hidden) {
                hidden.value = option.title;
            }
        });

        container.appendChild(card);
    });
}/* =====================================================
   LOCALIZAÇÃO ATUAL
===================================================== */

function mostrarLoadingLocalizacao() {
    document.getElementById("locationLoading")?.classList.remove("hidden");
    document.getElementById("locationEmpty")?.classList.add("hidden");
    document.getElementById("locationResult")?.classList.add("hidden");

    const status = document.getElementById("gpsStatus");
    if (status) status.textContent = "📡 Buscando sua localização atual...";
}

function montarEnderecoCompleto(partes) {
    const ruaCompleta = partes.numero
        ? `${partes.rua}, ${partes.numero}`
        : partes.rua;

    return [
        ruaCompleta,
        partes.bairro,
        partes.cidade,
        partes.estado,
        partes.cep,
        partes.pais
    ]
        .filter(Boolean)
        .join(" - ");
}

function extrairPartesEndereco(data) {
    const a = data.address || {};

    return {
        rua: a.road || a.pedestrian || a.footway || a.residential || a.path || "Rua não identificada",
        numero: a.house_number || "",
        bairro: a.suburb || a.neighbourhood || a.quarter || a.city_district || a.district || "Bairro não identificado",
        cidade: a.city || a.town || a.village || a.municipality || a.county || "Cidade não identificada",
        estado: a.state || "Estado não identificado",
        cep: a.postcode || "",
        pais: a.country || "Brasil"
    };
}

async function buscarEndereco(latitude, longitude) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=pt-BR`;

    const resposta = await fetch(url, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    });

    if (!resposta.ok) {
        throw new Error("Falha ao buscar endereço.");
    }

    return resposta.json();
}

function renderizarLocalizacaoEncontrada(loc) {
    document.getElementById("locationLoading")?.classList.add("hidden");
    document.getElementById("locationEmpty")?.classList.add("hidden");
    document.getElementById("locationResult")?.classList.remove("hidden");

    preencherCampoSeExistir("gpsStatus", "✅ Localização atual encontrada com sucesso.");
    preencherCampoSeExistir("realAddressText", loc.enderecoCompleto);
    preencherCampoSeExistir("realStreet", loc.numero ? `${loc.rua}, ${loc.numero}` : loc.rua);
    preencherCampoSeExistir("realNeighborhood", loc.bairro);
    preencherCampoSeExistir("realCity", loc.cidade);
    preencherCampoSeExistir("realState", loc.estado);
    preencherCampoSeExistir("realCountry", loc.pais);

    preencherInputSeExistir("userLatitude", loc.latitude);
    preencherInputSeExistir("userLongitude", loc.longitude);
    preencherInputSeExistir("userFullAddress", loc.enderecoCompleto);
    preencherInputSeExistir("userNeighborhood", loc.bairro);
    preencherInputSeExistir("userCity", loc.cidade);
    preencherInputSeExistir("userState", loc.estado);

    const linkMapa = document.getElementById("openMapLink");

    if (linkMapa) {
        linkMapa.href = loc.mapa;
    }

    const continuarBtn = document.getElementById("continuarBtn");

    if (continuarBtn) {
        continuarBtn.style.display = "block";
    }
}

function renderizarErroLocalizacao(mensagem) {
    document.getElementById("locationLoading")?.classList.add("hidden");
    document.getElementById("locationResult")?.classList.add("hidden");

    const empty = document.getElementById("locationEmpty");

    if (empty) {
        empty.classList.remove("hidden");
        empty.textContent = mensagem;
    }

    preencherCampoSeExistir("gpsStatus", "❌ Não foi possível identificar sua localização atual.");
}

function solicitarLocalizacao(opcoes = {}) {
    const preencherCampo = opcoes.preencherCampo || null;
    const btn = document.getElementById("btnLocalizacao");

    mostrarLoadingLocalizacao();

    if (btn) {
        btn.disabled = true;
        btn.textContent = "Buscando localização...";
        btn.style.opacity = "0.75";
    }

    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            const msg = "Seu navegador não suporta localização.";
            renderizarErroLocalizacao(msg);

            if (btn) {
                btn.disabled = false;
                btn.textContent = "Ativar Minha Localização Atual 📡";
                btn.style.opacity = "1";
            }

            reject(new Error(msg));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const latitude = pos.coords.latitude;
                    const longitude = pos.coords.longitude;
                    const precisao = pos.coords.accuracy;

                    const dadosEndereco = await buscarEndereco(latitude, longitude);
                    const partes = extrairPartesEndereco(dadosEndereco);

                    localizacaoUsuario = {
                        latitude,
                        longitude,
                        precisao,
                        rua: partes.rua,
                        numero: partes.numero,
                        bairro: partes.bairro,
                        cidade: partes.cidade,
                        estado: partes.estado,
                        cep: partes.cep,
                        pais: partes.pais,
                        enderecoCompleto: montarEnderecoCompleto(partes),
                        mapa: `https://www.google.com/maps?q=${latitude},${longitude}`
                    };

                    renderizarLocalizacaoEncontrada(localizacaoUsuario);

                    if (preencherCampo) {
                        const campo = document.getElementById(preencherCampo);

                        if (campo) {
                            campo.value = localizacaoUsuario.enderecoCompleto;
                        }

                        const noteId =
                            preencherCampo === "formLocation"
                                ? "formLocationNote"
                                : preencherCampo === "anonLocation"
                                    ? "anonLocationNote"
                                    : null;

                        if (noteId) {
                            const note = document.getElementById(noteId);

                            if (note) {
                                note.textContent = `Localização atual preenchida: ${localizacaoUsuario.enderecoCompleto}`;
                            }
                        }

                        triggerToast("📍 Localização atual preenchida.");
                    } else {
                        triggerToast("📍 Endereço atual encontrado!");
                    }

                    resolve(localizacaoUsuario);

                } catch (erro) {
                    const msg = "O GPS foi ativado, mas o endereço não pôde ser convertido.";
                    renderizarErroLocalizacao(msg);
                    triggerToast("⚠️ GPS ativado, mas sem endereço atual.");
                    reject(erro);

                } finally {
                    if (btn) {
                        btn.disabled = false;
                        btn.textContent = "Atualizar Minha Localização Atual 📡";
                        btn.style.opacity = "1";
                    }
                }
            },

            (erro) => {
                let mensagem = "Não foi possível obter sua localização.";

                if (erro.code === 1) {
                    mensagem = "Permissão negada. Permita a localização no navegador e tente novamente.";
                } else if (erro.code === 2) {
                    mensagem = "Localização indisponível. Ative o GPS do seu aparelho.";
                } else if (erro.code === 3) {
                    mensagem = "Tempo esgotado ao buscar sua localização.";
                }

                renderizarErroLocalizacao(mensagem);

                if (btn) {
                    btn.disabled = false;
                    btn.textContent = "Ativar Minha Localização Atual 📡";
                    btn.style.opacity = "1";
                }

                reject(new Error(mensagem));
            },

            {
                enableHighAccuracy: true,
                timeout: 25000,
                maximumAge: 0
            }
        );
    });
}

async function usarMinhaLocalizacaoNoCampo(campoId) {
    const campo = document.getElementById(campoId);
    if (!campo) return;

    if (localizacaoUsuario && localizacaoUsuario.enderecoCompleto) {
        campo.value = localizacaoUsuario.enderecoCompleto;

        if (campoId === "formLocation") {
            const note = document.getElementById("formLocationNote");
            if (note) note.textContent = `Localização atual preenchida: ${localizacaoUsuario.enderecoCompleto}`;
        }

        if (campoId === "anonLocation") {
            const note = document.getElementById("anonLocationNote");
            if (note) note.textContent = `Localização atual preenchida: ${localizacaoUsuario.enderecoCompleto}`;
        }

        triggerToast("📍 Localização atual preenchida.");
        return;
    }

    try {
        await solicitarLocalizacao({ preencherCampo: campoId });
    } catch (erro) {
        console.log(erro);
    }
}

function renderizarSelectEmpresas() {
    const selects = [
        "regCompany",
        "loginCompany",
        "editProCompany",
        "adminProCompany"
    ];

    const empresasAtivas = empresasCadastradas.filter(empresa => empresa.ativo !== false);

    selects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;

        const valorAtual = select.value;
        select.innerHTML = "";

        empresasAtivas.forEach(empresa => {
            const option = document.createElement("option");
            option.value = empresa.nome;
            option.textContent = empresa.nome;
            select.appendChild(option);
        });

        if (valorAtual && empresasAtivas.some(empresa => empresa.nome === valorAtual)) {
            select.value = valorAtual;
        }
    });
}

/* =====================================================
   CADASTRO E LOGIN
===================================================== */

function toggleRegCompanyField() {
    const tipo = document.getElementById("regType");
    const wrapper = document.getElementById("companyRegWrapper");

    if (!tipo || !wrapper) return;

    wrapper.style.display = tipo.value === "professional" ? "block" : "none";
}

function toggleLoginCompanyField() {
    const role = document.getElementById("loginRole");
    const wrapper = document.getElementById("loginCompanyWrapper");

    if (!role || !wrapper) return;

    wrapper.style.display = role.value === "professional" ? "block" : "none";
}

async function previewFotoCadastro(input) {
    if (!input.files || !input.files[0]) return;

    const arquivo = input.files[0];

    if (!arquivo.type.startsWith("image/")) {
        alert("Selecione apenas arquivos de imagem.");
        input.value = "";
        return;
    }

    fotoCadastroBase64 = await arquivoParaBase64(arquivo);

    const preview = document.getElementById("regAvatarPreview");

    if (preview) {
        preview.src = fotoCadastroBase64;
    }
}

function limparFormularioCadastro() {
    ["regName", "regCpf", "regEmail", "regPhone"].forEach(id => {
        const campo = document.getElementById(id);
        if (campo) campo.value = "";
    });

    const foto = document.getElementById("regPhoto");
    if (foto) foto.value = "";

    const preview = document.getElementById("regAvatarPreview");

    if (preview) {
        preview.src = imagensCadastroSafeLife[indiceCadastroSafeLife % imagensCadastroSafeLife.length];
    }

    fotoCadastroBase64 = "";

    const regType = document.getElementById("regType");
    if (regType) regType.value = "citizen";

    toggleRegCompanyField();
}

async function efetuarCadastro() {
    const nome = document.getElementById("regName").value.trim();
    const cpf = limparCpf(document.getElementById("regCpf").value);
    const email = document.getElementById("regEmail").value.trim();
    const telefone = document.getElementById("regPhone").value.trim();
    const type = document.getElementById("regType").value;
    const company = document.getElementById("regCompany").value;

    if (!nome || !cpf || !email || !telefone) {
        alert("Preencha nome, CPF, e-mail e telefone.");
        return;
    }

    if (cpf.length !== 11) {
        alert("Digite um CPF válido com 11 números.");
        return;
    }

    if (cpf === ADMIN_CPF) {
        alert("Este CPF é reservado para o administrador do sistema.");
        return;
    }

    if (!validarEmail(email)) {
        alert("Digite um e-mail válido.");
        return;
    }

    if (type === "professional" && !company) {
        alert("Selecione a empresa do funcionário.");
        return;
    }

    const novoUsuarioPayload = {
        nome,
        cpf,
        email,
        telefone,
        type,
        company: type === "professional" ? company : "Nenhum",
        foto: fotoCadastroBase64 || "",
        ativo: true
    };

    try {
        const resposta = await apiRequest("/api/auth/register", {
            method: "POST",
            body: JSON.stringify(novoUsuarioPayload)
        });

        const user = resposta.user;
        user.ativo = true;
        atualizarUsuarioLocal(user);

        triggerToast("✅ Cadastro criado com sucesso!");
    } catch (erro) {
        const existeLocal = usuarios.some(u => u.cpf === cpf);

        if (existeLocal) {
            alert("Este CPF já está cadastrado.");
            return;
        }

        const usuarioLocal = {
            id: gerarId(),
            ...novoUsuarioPayload,
            foto: fotoCadastroBase64 || imagensCadastroSafeLife[(indiceCadastroSafeLife - 1 + imagensCadastroSafeLife.length) % imagensCadastroSafeLife.length]
        };

        usuarios.push(usuarioLocal);
        salvarUsuarios();

        triggerToast("✅ Cadastro criado com sucesso!");
    }

    document.getElementById("cpfInput").value = cpf;
    document.getElementById("loginRole").value = type;

    toggleLoginCompanyField();

    if (type === "professional") {
        const loginCompany = document.getElementById("loginCompany");
        if (loginCompany) loginCompany.value = company;
    }

    limparFormularioCadastro();
    nextScreen("loginScreen");
}

async function autenticar() {
    garantirAdminLocal();

    const cpf = limparCpf(document.getElementById("cpfInput").value);
    const role = document.getElementById("loginRole").value;
    const company = document.getElementById("loginCompany").value;

    if (!cpf) {
        alert("Digite seu CPF para entrar.");
        return;
    }

    if (cpf === ADMIN_CPF) {
        let admin = usuarios.find(user => user.cpf === ADMIN_CPF);

        if (!admin) {
            garantirAdminLocal();
            admin = usuarios.find(user => user.cpf === ADMIN_CPF);
        }

        admin.type = "admin";
        admin.ativo = true;
        usuarioLogado = admin;

        atualizarUsuarioLocal(usuarioLogado);
        registrarAuditoria("Login administrativo", "Administrador acessou a área administrativa.");
        inicializarPainelAdmin();
        triggerToast("👑 Área administrativa liberada.");
        return;
    }

    try {
        const resposta = await apiRequest("/api/auth/login", {
            method: "POST",
            body: JSON.stringify({ cpf, role, company })
        });

        usuarioLogado = resposta.user;
        usuarioLogado.ativo = true;
        atualizarUsuarioLocal(usuarioLogado);
    } catch (erro) {
        const usuario = usuarios.find(user => user.cpf === cpf && user.type === role);

        if (!usuario) {
            alert("Conta não encontrada. Verifique CPF e tipo de portal.");
            return;
        }

        if (usuario.ativo === false) {
            alert("Esta conta foi bloqueada pelo administrador.");
            return;
        }

        if (role === "professional" && usuario.company !== company) {
            alert("Empresa incorreta para este funcionário.");
            return;
        }

        usuarioLogado = usuario;
    }

    if (usuarioLogado.type === "professional") {
        inicializarPainelPro();
        triggerToast("🔒 Terminal profissional carregado.");
    } else {
        nextScreen("menuScreen");
        triggerToast(`👋 Olá, ${usuarioLogado.nome}!`);
    }
}

function logout() {
    usuarioLogado = null;
    triggerToast("Sessão encerrada.");
    nextScreen("loginScreen");
}

/* =====================================================
   OPÇÕES VISUAIS DOS FORMULÁRIOS
===================================================== */

function renderOptions(containerId, options, hiddenInputId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    options.forEach(option => {
        const card = document.createElement("div");
        card.className = "quick-option-card";

        card.innerHTML = `
            <div class="quick-option-icon">${option.icon}</div>
            <div class="quick-option-title">${escaparHtml(option.title)}</div>
            <div class="quick-option-desc">${escaparHtml(option.desc)}</div>
        `;

        card.addEventListener("click", () => {
            document
                .querySelectorAll(`#${containerId} .quick-option-card`)
                .forEach(c => c.classList.remove("selected"));

            card.classList.add("selected");

            const hidden = document.getElementById(hiddenInputId);

            if (hidden) {
                hidden.value = option.title;
            }
        });

        container.appendChild(card);
    });
}/* =====================================================
   FORMULÁRIOS DE CHAMADO
===================================================== */

function limparFormularioOcorrencia() {
    const form = document.getElementById("citizenForm");
    if (form) form.reset();

    const selected = document.getElementById("selectedQuickOption");
    if (selected) selected.value = "";

    const note = document.getElementById("formLocationNote");

    if (note) {
        note.textContent = "Ao clicar no botão acima, a localização atual será preenchida.";
    }
}

function limparFormularioAnonimo() {
    const form = document.getElementById("anonForm");
    if (form) form.reset();

    const selected = document.getElementById("selectedAnonOption");
    if (selected) selected.value = "";

    const note = document.getElementById("anonLocationNote");

    if (note) {
        note.textContent = "A localização atual será enviada junto com a denúncia.";
    }
}

function openCitizenForm(typeKey) {
    currentFormConfig = FORM_CONFIGS[typeKey];

    if (!currentFormConfig) return;

    limparFormularioOcorrencia();

    document.getElementById("formKey").value = typeKey;
    document.getElementById("formTitle").textContent = currentFormConfig.title;
    document.getElementById("formSubtitle").textContent = currentFormConfig.subtitle;
    document.getElementById("selectedQuickOption").value = "";

    renderOptions("quickOptionsGrid", currentFormConfig.options, "selectedQuickOption");

    const localizacao = obterTextoLocalizacaoAtual();

    if (localizacao) {
        document.getElementById("formLocation").value = localizacao;

        const note = document.getElementById("formLocationNote");

        if (note) {
            note.textContent = `Localização atual preenchida: ${localizacao}`;
        }
    }

    nextScreen("scrForm");
}

function openAnonForm() {
    limparFormularioAnonimo();

    document.getElementById("selectedAnonOption").value = "";

    renderOptions("anonOptionsGrid", FORM_CONFIGS.anonymous.options, "selectedAnonOption");

    const localizacao = obterTextoLocalizacaoAtual();

    if (localizacao) {
        document.getElementById("anonLocation").value = localizacao;

        const note = document.getElementById("anonLocationNote");

        if (note) {
            note.textContent = `Localização atual preenchida: ${localizacao}`;
        }
    }

    nextScreen("scrAnonForm");
}

async function registrarAcao(event) {
    event.preventDefault();

    if (!usuarioLogado) {
        alert("Você precisa estar logado.");
        return;
    }

    const optionTitle = document.getElementById("selectedQuickOption").value;
    const formKey = document.getElementById("formKey").value;
    const localizacao = document.getElementById("formLocation").value.trim();
    const detalhes = document.getElementById("formDetails").value.trim();
    const arquivo = document.getElementById("formFile").files[0];
    const fotoBase64 = arquivo ? await arquivoParaBase64(arquivo) : "";

    if (!optionTitle) {
        alert("Escolha uma opção do problema.");
        return;
    }

    if (!localizacao || !detalhes) {
        alert("Preencha localização e descrição.");
        return;
    }

    const payload = {
        usuarioCpf: usuarioLogado.cpf,
        tipo: currentFormConfig.title,
        categoria: formKey,
        assunto: optionTitle,
        opcaoEscolhida: optionTitle,
        localizacao,
        detalhes,
        foto: fotoBase64,
        gps: obterLocalizacaoAtualObjeto(),
        prioridade: currentFormConfig.priority || "NORMAL"
    };

    const ocorrenciaLocal = {
        id: gerarId(),
        origem: "ocorrencia",
        tipo: payload.tipo,
        categoria: payload.categoria,
        assunto: payload.assunto,
        opcao_escolhida: payload.opcaoEscolhida,
        localizacao: payload.localizacao,
        endereco_completo: localizacao,
        detalhes: payload.detalhes,
        foto: payload.foto,
        fotoEvidencia: payload.foto,
        nome_usuario: usuarioLogado.nome,
        cpf_usuario: usuarioLogado.cpf,
        foto_usuario: usuarioLogado.foto,
        reporterName: usuarioLogado.nome,
        reporterCpf: usuarioLogado.cpf,
        reporterPhoto: usuarioLogado.foto,
        anonima: false,
        isAnonima: false,
        gps: obterLocalizacaoAtualObjeto(),
        prioridade: payload.prioridade,
        status: "PENDENTE",
        criado_em: new Date().toISOString(),
        timestamp: formatarHorarioAgora()
    };

    try {
        await apiRequest("/api/ocorrencias", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    } catch (erro) {
        dbOcorrencias.unshift(ocorrenciaLocal);
        salvarOcorrencias();
    }

    triggerToast("🚀 Chamado enviado com sucesso!");

    document.getElementById("confirmMsg").textContent =
        `Seu chamado "${optionTitle}" foi enviado com sucesso.`;

    event.target.reset();

    nextScreen("confirmationScreen");
}

async function registrarAcaoAnonima(event) {
    event.preventDefault();

    const optionTitle = document.getElementById("selectedAnonOption").value;
    const localizacao = document.getElementById("anonLocation").value.trim();
    const detalhes = document.getElementById("anonDetails").value.trim();
    const arquivo = document.getElementById("anonFile").files[0];
    const fotoBase64 = arquivo ? await arquivoParaBase64(arquivo) : "";

    if (!optionTitle) {
        alert("Escolha uma opção da denúncia.");
        return;
    }

    if (!localizacao || !detalhes) {
        alert("Preencha localização e descrição.");
        return;
    }

    const payload = {
        tipo: "Denúncia Anônima",
        categoria: "anonymous",
        assunto: optionTitle,
        opcaoEscolhida: optionTitle,
        localizacao,
        detalhes,
        foto: fotoBase64,
        gps: obterLocalizacaoAtualObjeto(),
        prioridade: "ALTA"
    };

    const denunciaLocal = {
        id: gerarId(),
        origem: "anonima",
        tipo: "Denúncia Anônima",
        categoria: "anonymous",
        assunto: optionTitle,
        opcao_escolhida: optionTitle,
        localizacao,
        endereco_completo: localizacao,
        detalhes,
        foto: fotoBase64,
        fotoEvidencia: fotoBase64,
        nome_usuario: "Anônimo",
        cpf_usuario: null,
        foto_usuario: null,
        reporterName: "Anônimo",
        reporterCpf: null,
        reporterPhoto: "",
        anonima: true,
        isAnonima: true,
        gps: obterLocalizacaoAtualObjeto(),
        prioridade: "ALTA",
        status: "PENDENTE",
        criado_em: new Date().toISOString(),
        timestamp: formatarHorarioAgora()
    };

    try {
        await apiRequest("/api/ocorrencias/anonima", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    } catch (erro) {
        dbOcorrencias.unshift(denunciaLocal);
        salvarOcorrencias();
    }

    triggerToast("🛡️ Denúncia enviada com sucesso!");

    document.getElementById("confirmMsg").textContent =
        "Sua denúncia anônima foi enviada com sucesso.";

    event.target.reset();

    nextScreen("confirmationScreen");
}

/* =====================================================
   PETS
===================================================== */

function openPetForm() {
    const form = document.getElementById("petForm");
    if (form) form.reset();

    const localizacao = obterTextoLocalizacaoAtual();

    if (localizacao) {
        document.getElementById("petLocation").value = localizacao;
    }

    nextScreen("scrPetForm");
}

async function registrarPet(event) {
    event.preventDefault();

    if (!usuarioLogado) {
        alert("Você precisa estar logado.");
        return;
    }

    const nome = document.getElementById("petName").value.trim();
    const idade = Number(document.getElementById("petAge").value || 0);
    const especie = document.getElementById("petSpecies").value.trim() || "Animal";
    const raca = document.getElementById("petBreed").value.trim() || "Não informado";
    const local = document.getElementById("petLocation").value.trim();
    const arquivo = document.getElementById("petPhoto").files[0];

    const fotoBase64 = arquivo
        ? await arquivoParaBase64(arquivo)
        : "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=150&q=80";

    if (!nome) {
        alert("Informe o nome do pet.");
        return;
    }

    const payload = {
        donoCpf: usuarioLogado.cpf,
        nome,
        idade,
        especie,
        raca,
        local,
        foto: fotoBase64
    };

    const petLocal = {
        id: gerarId(),
        donoCpf: usuarioLogado.cpf,
        nome,
        idade,
        especie,
        raca,
        local,
        foto: fotoBase64
    };

    try {
        const resposta = await apiRequest("/api/pets", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        if (resposta.pet) {
            meusPets.push({
                id: resposta.pet.id,
                donoCpf: usuarioLogado.cpf,
                nome: resposta.pet.nome,
                idade: resposta.pet.idade,
                especie: resposta.pet.especie,
                raca: resposta.pet.raca,
                local: resposta.pet.localizacao,
                foto: resposta.pet.foto
            });

            salvarPets();
        }
    } catch (erro) {
        meusPets.push(petLocal);
        salvarPets();
    }

    triggerToast("🐾 Pet cadastrado com sucesso!");

    document.getElementById("confirmMsg").textContent =
        `O pet "${nome}" foi cadastrado com sucesso.`;

    event.target.reset();

    nextScreen("confirmationScreen");
}

/* =====================================================
   PERFIL CIDADÃO
===================================================== */

async function carregarPetsDoUsuario() {
    if (!usuarioLogado) return [];

    try {
        const pets = await apiRequest(`/api/pets?donoCpf=${usuarioLogado.cpf}`);
        return pets;
    } catch (erro) {
        return meusPets.filter(pet => pet.donoCpf === usuarioLogado.cpf);
    }
}

async function renderPerfilCidadao() {
    if (!usuarioLogado) return;

    const nomePerfil = document.getElementById("citizenProfileName");
    const tipoPerfil = document.getElementById("citizenProfileType");
    const contatoPerfil = document.getElementById("citizenProfileContact");
    const avatar = document.getElementById("profileAvatar");
    const editName = document.getElementById("editName");
    const editEmail = document.getElementById("editEmail");
    const editPhone = document.getElementById("editPhone");

    if (nomePerfil) nomePerfil.textContent = usuarioLogado.nome;

    if (tipoPerfil) {
        tipoPerfil.textContent =
            usuarioLogado.type === "professional"
                ? `Funcionário - ${usuarioLogado.company}`
                : "Cidadão";
    }

    if (contatoPerfil) {
        contatoPerfil.innerHTML = `
            CPF: ${escaparHtml(usuarioLogado.cpf)}<br>
            E-mail: ${escaparHtml(usuarioLogado.email || "Não informado")}<br>
            Telefone: ${escaparHtml(usuarioLogado.telefone || "Não informado")}
        `;
    }

    if (avatar && usuarioLogado.foto) avatar.src = usuarioLogado.foto;
    if (editName) editName.value = usuarioLogado.nome || "";
    if (editEmail) editEmail.value = usuarioLogado.email || "";
    if (editPhone) editPhone.value = usuarioLogado.telefone || "";

    const pets = await carregarPetsDoUsuario();

    renderizarPetsDoUsuario(pets);

    nextScreen("citizenProfile");
}

function renderizarPetsDoUsuario(pets) {
    const container = document.getElementById("myPetsContainer");
    if (!container) return;

    container.innerHTML = "";

    if (!pets.length) {
        container.innerHTML = `<p class="empty-message">Nenhum pet cadastrado ainda.</p>`;
        return;
    }

    pets.forEach(pet => {
        const item = document.createElement("div");
        item.className = "pet-item-box";

        item.innerHTML = `
            <img src="${pet.foto}" alt="Foto do pet">

            <div>
                <strong style="font-size:15px;display:block;">
                    ${escaparHtml(pet.nome)} (${escaparHtml(pet.especie || "Animal")})
                </strong>

                <small style="font-size:12px;color:var(--text-light)">
                    Idade: ${escaparHtml(String(pet.idade || 0))} anos |
                    Local: ${escaparHtml(pet.local || pet.localizacao || "Não informado")}
                </small>
            </div>
        `;

        container.appendChild(item);
    });
}

async function salvarDadosPerfil() {
    if (!usuarioLogado) return;

    const nome = document.getElementById("editName").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const telefone = document.getElementById("editPhone").value.trim();

    if (!nome) {
        alert("Digite seu nome.");
        return;
    }

    if (email && !validarEmail(email)) {
        alert("Digite um e-mail válido.");
        return;
    }

    const payload = { nome, email, telefone };

    try {
        const resposta = await apiRequest(`/api/users/${usuarioLogado.cpf}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });

        usuarioLogado = resposta.user;
    } catch (erro) {
        usuarioLogado.nome = nome;
        usuarioLogado.email = email;
        usuarioLogado.telefone = telefone;
    }

    atualizarUsuarioLocal(usuarioLogado);

    triggerToast("💾 Perfil atualizado com sucesso!");
    renderPerfilCidadao();
}

async function atualizarFotoPerfil(input) {
    if (!usuarioLogado || !input.files || !input.files[0]) return;

    const fotoBase64 = await arquivoParaBase64(input.files[0]);

    try {
        const resposta = await apiRequest(`/api/users/${usuarioLogado.cpf}`, {
            method: "PUT",
            body: JSON.stringify({ foto: fotoBase64 })
        });

        usuarioLogado = resposta.user;
    } catch (erro) {
        usuarioLogado.foto = fotoBase64;
    }

    atualizarUsuarioLocal(usuarioLogado);

    const avatar = document.getElementById("profileAvatar");

    if (avatar) {
        avatar.src = usuarioLogado.foto;
    }

    triggerToast("📸 Foto atualizada com sucesso!");
}/* =====================================================
   PERFIL PROFISSIONAL
===================================================== */

function garantirDadosProfissionais(usuario) {
    if (!usuario) return usuario;

    if (!usuario.profissional) {
        usuario.profissional = {
            cargo: "Agente Operacional",
            especialidade: "Resgate e triagem animal",
            regiao: "Região não informada",
            plantao: "Disponível",
            veiculo: "Veículo de apoio",
            equipe: "Equipe Safe Life",
            registro: "",
            observacoes: "Profissional autorizado a atender chamados, denúncias e resgates."
        };
    }

    return usuario;
}

function renderPerfilProfissional() {
    if (!usuarioLogado) return;

    usuarioLogado = garantirDadosProfissionais(usuarioLogado);

    const avatar = document.getElementById("professionalProfileAvatar");
    const name = document.getElementById("professionalProfileName");
    const company = document.getElementById("professionalProfileCompany");

    const editProName = document.getElementById("editProName");
    const editProCpf = document.getElementById("editProCpf");
    const editProEmail = document.getElementById("editProEmail");
    const editProPhone = document.getElementById("editProPhone");
    const editProCompany = document.getElementById("editProCompany");

    const editProCargo = document.getElementById("editProCargo");
    const editProEspecialidade = document.getElementById("editProEspecialidade");
    const editProRegiao = document.getElementById("editProRegiao");
    const editProPlantao = document.getElementById("editProPlantao");
    const editProVeiculo = document.getElementById("editProVeiculo");
    const editProEquipe = document.getElementById("editProEquipe");
    const editProRegistro = document.getElementById("editProRegistro");
    const editProObservacoes = document.getElementById("editProObservacoes");

    const proCargoText = document.getElementById("professionalCargoText");
    const proEspecialidadeText = document.getElementById("professionalEspecialidadeText");
    const proRegiaoText = document.getElementById("professionalRegiaoText");
    const proPlantaoText = document.getElementById("professionalPlantaoText");
    const proVeiculoText = document.getElementById("professionalVeiculoText");
    const proEquipeText = document.getElementById("professionalEquipeText");

    const dados = usuarioLogado.profissional || {};

    if (avatar) avatar.src = usuarioLogado.foto || "img/vitor-chineque.jpg";
    if (name) name.textContent = usuarioLogado.nome || "Funcionário";
    if (company) company.textContent = usuarioLogado.company || "Empresa";

    if (editProName) editProName.value = usuarioLogado.nome || "";
    if (editProCpf) editProCpf.value = usuarioLogado.cpf || "";
    if (editProEmail) editProEmail.value = usuarioLogado.email || "";
    if (editProPhone) editProPhone.value = usuarioLogado.telefone || "";
    if (editProCompany) editProCompany.value = usuarioLogado.company || "Safe Life Matriz";

    if (editProCargo) editProCargo.value = dados.cargo || "Agente Operacional";
    if (editProEspecialidade) editProEspecialidade.value = dados.especialidade || "Resgate e triagem animal";
    if (editProRegiao) editProRegiao.value = dados.regiao || "";
    if (editProPlantao) editProPlantao.value = dados.plantao || "Disponível";
    if (editProVeiculo) editProVeiculo.value = dados.veiculo || "";
    if (editProEquipe) editProEquipe.value = dados.equipe || "";
    if (editProRegistro) editProRegistro.value = dados.registro || "";
    if (editProObservacoes) editProObservacoes.value = dados.observacoes || "";

    if (proCargoText) proCargoText.textContent = dados.cargo || "Agente Operacional";
    if (proEspecialidadeText) proEspecialidadeText.textContent = dados.especialidade || "Resgate e triagem animal";
    if (proRegiaoText) proRegiaoText.textContent = dados.regiao || "Região não informada";
    if (proPlantaoText) proPlantaoText.textContent = dados.plantao || "Disponível";
    if (proVeiculoText) proVeiculoText.textContent = dados.veiculo || "Não informado";
    if (proEquipeText) proEquipeText.textContent = dados.equipe || "Equipe Safe Life";

    nextScreen("professionalProfile");
}

async function salvarPerfilProfissional() {
    if (!usuarioLogado) return;

    const nome = document.getElementById("editProName").value.trim();
    const cpfNovo = limparCpf(document.getElementById("editProCpf").value);
    const email = document.getElementById("editProEmail").value.trim();
    const telefone = document.getElementById("editProPhone").value.trim();
    const company = document.getElementById("editProCompany").value;

    const cargo = document.getElementById("editProCargo")?.value.trim() || "Agente Operacional";
    const especialidade = document.getElementById("editProEspecialidade")?.value.trim() || "Resgate e triagem animal";
    const regiao = document.getElementById("editProRegiao")?.value.trim() || "";
    const plantao = document.getElementById("editProPlantao")?.value || "Disponível";
    const veiculo = document.getElementById("editProVeiculo")?.value.trim() || "";
    const equipe = document.getElementById("editProEquipe")?.value.trim() || "";
    const registro = document.getElementById("editProRegistro")?.value.trim() || "";
    const observacoes = document.getElementById("editProObservacoes")?.value.trim() || "";

    if (!nome) {
        alert("Digite o nome do profissional.");
        return;
    }

    if (cpfNovo.length !== 11) {
        alert("Digite um CPF válido com 11 números.");
        return;
    }

    if (cpfNovo === ADMIN_CPF && usuarioLogado.type !== "admin") {
        alert("Este CPF é reservado para o administrador.");
        return;
    }

    if (email && !validarEmail(email)) {
        alert("Digite um e-mail válido.");
        return;
    }

    if (!company) {
        alert("Selecione a empresa/base do profissional.");
        return;
    }

    const cpfAntigo = usuarioLogado.cpf;

    const payload = {
        nome,
        cpfNovo,
        email,
        telefone,
        company,
        profissional: {
            cargo,
            especialidade,
            regiao,
            plantao,
            veiculo,
            equipe,
            registro,
            observacoes
        }
    };

    try {
        const resposta = await apiRequest(`/api/users/${cpfAntigo}`, {
            method: "PUT",
            body: JSON.stringify(payload)
        });

        usuarioLogado = resposta.user;
    } catch (erro) {
        usuarioLogado.nome = nome;
        usuarioLogado.cpf = cpfNovo;
        usuarioLogado.email = email;
        usuarioLogado.telefone = telefone;
        usuarioLogado.company = company;
        usuarioLogado.profissional = payload.profissional;
    }

    atualizarUsuarioLocal(usuarioLogado, cpfAntigo);

    triggerToast("👤 Perfil profissional atualizado!");
    inicializarPainelPro();
}

async function atualizarFotoProfissional(input) {
    if (!usuarioLogado || !input.files || !input.files[0]) return;

    const fotoBase64 = await arquivoParaBase64(input.files[0]);

    try {
        const resposta = await apiRequest(`/api/users/${usuarioLogado.cpf}`, {
            method: "PUT",
            body: JSON.stringify({ foto: fotoBase64 })
        });

        usuarioLogado = resposta.user;
    } catch (erro) {
        usuarioLogado.foto = fotoBase64;
    }

    atualizarUsuarioLocal(usuarioLogado);

    const avatar = document.getElementById("professionalProfileAvatar");
    const proAvatar = document.getElementById("proAvatar");

    if (avatar) avatar.src = usuarioLogado.foto || "img/vitor-chineque.jpg";
    if (proAvatar) proAvatar.src = usuarioLogado.foto || "img/vitor-chineque.jpg";

    triggerToast("📸 Foto profissional atualizada!");
}

/* =====================================================
   PAINEL PROFISSIONAL
===================================================== */

function inicializarPainelPro() {
    if (!usuarioLogado) return;

    usuarioLogado = garantirDadosProfissionais(usuarioLogado);

    const nome = document.getElementById("proWelcomeName");
    const empresa = document.getElementById("proCompanyName");
    const avatar = document.getElementById("proAvatar");
    const cargo = document.getElementById("proCargoName");
    const plantao = document.getElementById("proPlantaoStatus");
    const regiao = document.getElementById("proRegiaoAtendimento");
    const btnVoltarAdmin = document.getElementById("btnVoltarAdminFromPro");

    if (nome) nome.textContent = usuarioLogado.nome;
    if (empresa) empresa.textContent = `🏢 ${usuarioLogado.company || "Safe Life Matriz"}`;
    if (avatar) avatar.src = usuarioLogado.foto || "img/vitor-chineque.jpg";

    if (cargo) cargo.textContent = usuarioLogado.profissional?.cargo || "Agente Operacional";
    if (plantao) plantao.textContent = usuarioLogado.profissional?.plantao || "Disponível";
    if (regiao) regiao.textContent = usuarioLogado.profissional?.regiao || "Região não informada";

    if (btnVoltarAdmin) {
        btnVoltarAdmin.style.display =
            usuarioLogado.cpf === ADMIN_CPF || usuarioLogado.type === "admin"
                ? "block"
                : "none";
    }

    atualizarStatsProfissional();

    nextScreen("proDashboard");
}

async function carregarOcorrenciasProfissional() {
    try {
        const dados = await apiRequest("/api/pro/ocorrencias");
        return dados;
    } catch (erro) {
        return dbOcorrencias;
    }
}

async function atualizarStatsProfissional() {
    const dados = await carregarOcorrenciasProfissional();

    const total = dados.length;
    const anon = dados.filter(item => item.anonima || item.isAnonima || item.origem === "anonima").length;
    const emergencia = dados.filter(item =>
        String(item.categoria || "").includes("emergency") ||
        String(item.tipo || "").toLowerCase().includes("emergência")
    ).length;

    preencherCampoSeExistir("statTotal", total);
    preencherCampoSeExistir("statAnon", anon);
    preencherCampoSeExistir("statEmergency", emergencia);
}

async function abrirOcorrenciasPro() {
    const container = document.getElementById("listaIntegradaPro");
    if (!container) return;

    const dados = await carregarOcorrenciasProfissional();

    container.innerHTML = "";

    if (!dados.length) {
        container.innerHTML = `
            <div class="occurrence-card" style="text-align:center;border-left-color:#94a3b8;">
                <p style="font-size:14px;color:var(--text-light);">
                    Fila vazia. Não há nenhum chamado pendente.
                </p>
            </div>
        `;

        nextScreen("proListScreen");
        return;
    }

    dados.forEach(chamado => {
        container.appendChild(criarCardProfissional(chamado));
    });

    nextScreen("proListScreen");
}

function criarCardProfissional(chamado) {
    const card = document.createElement("div");

    const anonimo = chamado.anonima || chamado.isAnonima || chamado.origem === "anonima";

    card.className = anonimo
        ? "prof-occurrence-card anon"
        : "prof-occurrence-card";

    const idDetalhes = `detalhes-${chamado.origem || "local"}-${chamado.id}`;

    const fotoUsuario = chamado.foto_usuario || chamado.reporterPhoto || "";
    const fotoEvidencia = chamado.foto || chamado.fotoEvidencia || "";
    const nomeUsuario = anonimo ? "Denúncia Anônima" : (chamado.nome_usuario || chamado.reporterName || "Usuário");
    const cpfUsuario = chamado.cpf_usuario || chamado.reporterCpf || "";
    const endereco = chamado.endereco_completo || chamado.localizacao || "Endereço não informado";

    const avatarHtml = anonimo
        ? `<div class="anon-avatar">🕶️</div>`
        : `<img class="reporter-avatar" src="${fotoUsuario || "img/vitor-chineque.jpg"}" alt="Foto do usuário">`;

    const badgeClass = anonimo ? "prof-occurrence-badge anon" : "prof-occurrence-badge";
    const badgeText = anonimo ? "ANÔNIMA" : "IDENTIFICADA";

    const evidenceHtml = fotoEvidencia
        ? `<img class="evidence-image" src="${fotoEvidencia}" alt="Foto enviada">`
        : `<div class="evidence-empty">Nenhuma foto foi enviada.</div>`;

    const mapaLink =
        chamado.latitude && chamado.longitude
            ? `<a class="map-link" href="https://www.google.com/maps?q=${chamado.latitude},${chamado.longitude}" target="_blank" rel="noopener noreferrer">Abrir no mapa 🗺️</a>`
            : "";

    card.innerHTML = `
        <div class="prof-occurrence-top">
            ${avatarHtml}

            <div class="prof-occurrence-meta">
                <h4>${escaparHtml(chamado.opcao_escolhida || chamado.assunto || "Chamado")}</h4>

                <p>
                    <strong>Nome:</strong>
                    ${escaparHtml(nomeUsuario)}
                </p>

                <small>
                    ${escaparHtml(chamado.tipo || "Chamado")} •
                    ${escaparHtml(chamado.status || "PENDENTE")}
                </small>

                <div class="${badgeClass}">
                    ${badgeText}
                </div>
            </div>
        </div>

        <div class="prof-occurrence-body">

            <div class="prof-line">
                <strong>Endereço atual:</strong><br>
                ${escaparHtml(endereco)}
            </div>

            <div>
                <strong style="display:block;margin-bottom:8px;">Foto enviada:</strong>
                ${evidenceHtml}
            </div>

            <div class="prof-details" id="${idDetalhes}">
                <div class="prof-line">
                    <strong>Descrição:</strong><br>
                    ${escaparHtml(chamado.detalhes || "Sem descrição.")}
                </div>

                ${!anonimo ? `
                    <div class="prof-line">
                        <strong>CPF do solicitante:</strong><br>
                        ${escaparHtml(cpfUsuario || "Não informado")}
                    </div>
                ` : ""}

                <div class="prof-line">
                    <strong>Bairro / Cidade / Estado:</strong><br>
                    ${escaparHtml(chamado.bairro || chamado.gps?.bairro || "---")} /
                    ${escaparHtml(chamado.cidade || chamado.gps?.cidade || "---")} /
                    ${escaparHtml(chamado.estado || chamado.gps?.estado || "---")}
                </div>

                <div class="prof-line">
                    <strong>Prioridade:</strong><br>
                    ${escaparHtml(chamado.prioridade || "NORMAL")}
                </div>

                <div class="prof-line">
                    <strong>Atendimento indicado:</strong><br>
                    ${escaparHtml(sugerirAtendimento(chamado))}
                </div>

                ${mapaLink}
            </div>

            <div class="prof-actions-inline">
                <button class="btn secondary-btn" type="button" onclick="toggleDetalhes('${idDetalhes}', this)">
                    Ver detalhes
                </button>

                <button class="btn" type="button" onclick="marcarEmAtendimento('${chamado.origem || "local"}', ${chamado.id})">
                    Em atendimento
                </button>

                <button class="btn" type="button" onclick="despacharEquipe('${chamado.origem || "local"}', ${chamado.id})">
                    Finalizar 🚒
                </button>
            </div>
        </div>
    `;

    return card;
}

function sugerirAtendimento(chamado) {
    const texto = `${chamado.tipo || ""} ${chamado.categoria || ""} ${chamado.assunto || ""} ${chamado.opcao_escolhida || ""}`.toLowerCase();

    if (texto.includes("atropelado") || texto.includes("ferido") || texto.includes("sangr")) {
        return "Enviar resgate com caixa de transporte, kit de primeiros socorros e apoio veterinário.";
    }

    if (texto.includes("maus") || texto.includes("agred") || texto.includes("briga") || texto.includes("rinha")) {
        return "Acionar equipe de fiscalização e registrar evidências do local com segurança.";
    }

    if (texto.includes("filhote") || texto.includes("mãe") || texto.includes("chuva") || texto.includes("frio")) {
        return "Providenciar abrigo temporário, alimento, água e avaliação básica.";
    }

    if (texto.includes("preso") || texto.includes("corrente") || texto.includes("acorrentado")) {
        return "Enviar equipe com equipamento de contenção e verificar situação de maus-tratos.";
    }

    return "Analisar local, prioridade, foto enviada e acionar o agente disponível mais próximo.";
}

function toggleDetalhes(id, btn) {
    const box = document.getElementById(id);
    if (!box) return;

    box.classList.toggle("show");

    btn.textContent = box.classList.contains("show")
        ? "Ocultar detalhes"
        : "Ver detalhes";
}

async function marcarEmAtendimento(origem, id) {
    try {
        if (origem === "ocorrencia" || origem === "anonima") {
            await apiRequest(`/api/chamados/${origem}/${id}/status`, {
                method: "PATCH",
                body: JSON.stringify({
                    status: "EM_ATENDIMENTO",
                    funcionarioCpf: usuarioLogado ? usuarioLogado.cpf : null,
                    observacao: "Chamado assumido pelo profissional no painel Safe Life."
                })
            });
        } else {
            const item = dbOcorrencias.find(chamado => chamado.id === id);

            if (item) {
                item.status = "EM_ATENDIMENTO";
                item.atendente = usuarioLogado ? usuarioLogado.nome : "Profissional";
                salvarOcorrencias();
            }
        }
    } catch (erro) {
        const item = dbOcorrencias.find(chamado => chamado.id === id);

        if (item) {
            item.status = "EM_ATENDIMENTO";
            item.atendente = usuarioLogado ? usuarioLogado.nome : "Profissional";
            salvarOcorrencias();
        }
    }

    triggerToast("🟡 Chamado marcado como em atendimento.");
    atualizarStatsProfissional();
    abrirOcorrenciasPro();
}

async function despacharEquipe(origem, id) {
    try {
        if (origem === "ocorrencia" || origem === "anonima") {
            await apiRequest(`/api/chamados/${origem}/${id}/status`, {
                method: "PATCH",
                body: JSON.stringify({
                    status: "CONCLUIDA",
                    funcionarioCpf: usuarioLogado ? usuarioLogado.cpf : null,
                    observacao: "Equipe despachada pelo painel profissional."
                })
            });
        } else {
            dbOcorrencias = dbOcorrencias.filter(item => item.id !== id);
            salvarOcorrencias();
        }
    } catch (erro) {
        dbOcorrencias = dbOcorrencias.filter(item => item.id !== id);
        salvarOcorrencias();
    }

    if (usuarioLogado && usuarioLogado.type === "admin") {
        registrarAuditoria("Despacho de equipe", `Chamado ${id} marcado como atendido.`);
    }

    triggerToast("🚒 Atendimento finalizado!");
    atualizarStatsProfissional();
    abrirOcorrenciasPro();
}/* =====================================================
   FERRAMENTAS DO PROFISSIONAL
===================================================== */

function abrirAgentesAtivos() {
    const container = document.getElementById("activeAgentsList");
    if (!container) return;

    container.innerHTML = "";

    agentesAtivos.forEach(agente => {
        const statusClass =
            agente.status === "Disponível"
                ? "green"
                : agente.status === "Em deslocamento"
                    ? "orange"
                    : "red";

        const card = document.createElement("div");
        card.className = "agent-card active";

        card.innerHTML = `
            <div class="agent-top">
                <img class="agent-avatar" src="${agente.foto}" alt="Agente">

                <div class="agent-info">
                    <h4>${escaparHtml(agente.nome)}</h4>
                    <p>${escaparHtml(agente.base)}</p>
                    <small>Região: ${escaparHtml(agente.regiao)}</small>
                </div>
            </div>

            <div class="agent-status-row">
                <span class="agent-chip ${statusClass}">
                    ${escaparHtml(agente.status)}
                </span>

                <span class="agent-chip">
                    ${escaparHtml(agente.distancia)}
                </span>

                <span class="agent-chip">
                    ${escaparHtml(agente.tempo)}
                </span>
            </div>

            <button
                class="btn small-btn"
                type="button"
                onclick="acionarAgente('${escaparHtml(agente.nome)}')"
            >
                Acionar agente
            </button>
        `;

        container.appendChild(card);
    });

    nextScreen("activeAgentsScreen");
}

function acionarAgente(nome) {
    if (usuarioLogado && usuarioLogado.type === "admin") {
        registrarAuditoria("Acionamento de agente", `${nome} foi acionado.`);
    }

    triggerToast(`🟢 ${nome} foi acionado para atendimento.`);
}

async function abrirOcorrenciaMaisProxima() {
    const container = document.getElementById("nearestOccurrenceBox");
    if (!container) return;

    const dados = await carregarOcorrenciasProfissional();

    if (!dados.length) {
        container.innerHTML = `
            <div class="occurrence-card" style="text-align:center;border-left-color:#94a3b8;">
                <p>Nenhuma ocorrência disponível no momento.</p>
            </div>
        `;

        nextScreen("nearestOccurrenceScreen");
        return;
    }

    const comPeso = dados.map(chamado => {
        let peso = 5;

        if (chamado.prioridade === "CRITICA") {
            peso = 1;
        } else if (chamado.prioridade === "ALTA") {
            peso = 2;
        } else if (chamado.prioridade === "NORMAL") {
            peso = 3;
        } else if (chamado.prioridade === "BAIXA") {
            peso = 4;
        }

        return {
            ...chamado,
            peso
        };
    });

    comPeso.sort((a, b) => {
        if (a.peso !== b.peso) {
            return a.peso - b.peso;
        }

        return new Date(a.criado_em || 0) - new Date(b.criado_em || 0);
    });

    const chamado = comPeso[0];
    const agente = agentesAtivos.find(a => a.status === "Disponível") || agentesAtivos[0];

    container.innerHTML = `
        <div class="nearest-card">
            <div class="nearest-top">
                <div class="nearest-icon">
                    📍
                </div>

                <div class="nearest-info">
                    <h4>
                        ${escaparHtml(chamado.opcao_escolhida || chamado.assunto || "Ocorrência")}
                    </h4>

                    <p>
                        ${escaparHtml(chamado.tipo || "Chamado")}
                    </p>

                    <small>
                        Prioridade: ${escaparHtml(chamado.prioridade || "NORMAL")}
                    </small>
                </div>
            </div>

            <div class="nearest-distance">
                <strong>Agente recomendado:</strong><br>
                ${escaparHtml(agente.nome)} — ${escaparHtml(agente.distancia)} de distância,
                tempo estimado de ${escaparHtml(agente.tempo)}.
            </div>

            <div class="prof-line" style="margin-top:12px;">
                <strong>Endereço atual:</strong><br>
                ${escaparHtml(chamado.endereco_completo || chamado.localizacao || "Não informado")}
            </div>

            <div class="prof-line" style="margin-top:12px;">
                <strong>Plano de ação:</strong><br>
                ${escaparHtml(sugerirAtendimento(chamado))}
            </div>

            <button
                class="btn"
                type="button"
                onclick="acionarAgente('${escaparHtml(agente.nome)}')"
            >
                Mandar ${escaparHtml(agente.nome)} para ocorrência
            </button>
        </div>
    `;

    nextScreen("nearestOccurrenceScreen");
}

async function abrirFilaPrioridade() {
    const container = document.getElementById("priorityQueueList");
    if (!container) return;

    const dados = await carregarOcorrenciasProfissional();

    if (!dados.length) {
        container.innerHTML = `
            <div class="occurrence-card" style="text-align:center;border-left-color:#94a3b8;">
                <p>Nenhum chamado na fila.</p>
            </div>
        `;

        nextScreen("priorityQueueScreen");
        return;
    }

    const prioridadePeso = {
        CRITICA: 1,
        ALTA: 2,
        NORMAL: 3,
        BAIXA: 4
    };

    dados.sort((a, b) => {
        const pesoA = prioridadePeso[a.prioridade] || 3;
        const pesoB = prioridadePeso[b.prioridade] || 3;

        if (pesoA !== pesoB) {
            return pesoA - pesoB;
        }

        return new Date(a.criado_em || 0) - new Date(b.criado_em || 0);
    });

    container.innerHTML = "";

    dados.forEach((chamado, index) => {
        const prioridade = chamado.prioridade || "NORMAL";

        const classe =
            prioridade === "CRITICA"
                ? "critical"
                : prioridade === "ALTA"
                    ? "high"
                    : "normal";

        const chip =
            prioridade === "CRITICA"
                ? "red"
                : prioridade === "ALTA"
                    ? "orange"
                    : "";

        const card = document.createElement("div");
        card.className = `priority-card ${classe}`;

        card.innerHTML = `
            <div class="priority-top">
                <div class="priority-icon">
                    ${index + 1}
                </div>

                <div class="priority-info">
                    <h4>
                        ${escaparHtml(chamado.opcao_escolhida || chamado.assunto || "Chamado")}
                    </h4>

                    <p>
                        ${escaparHtml(chamado.endereco_completo || chamado.localizacao || "Endereço não informado")}
                    </p>

                    <small>
                        ${escaparHtml(chamado.tipo || "Chamado")}
                    </small>
                </div>
            </div>

            <div class="agent-status-row">
                <span class="priority-chip ${chip}">
                    ${escaparHtml(prioridade)}
                </span>

                <span class="priority-chip">
                    ${escaparHtml(chamado.status || "PENDENTE")}
                </span>
            </div>
        `;

        container.appendChild(card);
    });

    nextScreen("priorityQueueScreen");
}

async function abrirRelatorioPlantao() {
    const container = document.getElementById("shiftReportBox");
    if (!container) return;

    const dados = await carregarOcorrenciasProfissional();

    const total = dados.length;
    const anon = dados.filter(item => item.anonima || item.isAnonima || item.origem === "anonima").length;
    const criticos = dados.filter(item => item.prioridade === "CRITICA").length;
    const alta = dados.filter(item => item.prioridade === "ALTA").length;
    const identificados = total - anon;
    const agentesDisponiveis = agentesAtivos.filter(a => a.status === "Disponível").length;

    container.innerHTML = `
        <div class="report-card">
            <div class="agent-top">
                <div class="report-icon">
                    📊
                </div>

                <div class="agent-info">
                    <h4>Resumo do plantão</h4>
                    <p>Dados rápidos para acompanhamento profissional.</p>
                </div>
            </div>

            <div class="report-grid">
                <div class="report-mini-card">
                    <strong>${total}</strong>
                    <span>Chamados</span>
                </div>

                <div class="report-mini-card">
                    <strong>${anon}</strong>
                    <span>Anônimos</span>
                </div>

                <div class="report-mini-card">
                    <strong>${identificados}</strong>
                    <span>Identificados</span>
                </div>

                <div class="report-mini-card">
                    <strong>${agentesDisponiveis}</strong>
                    <span>Agentes Livres</span>
                </div>

                <div class="report-mini-card">
                    <strong>${criticos}</strong>
                    <span>Críticos</span>
                </div>

                <div class="report-mini-card">
                    <strong>${alta}</strong>
                    <span>Alta prioridade</span>
                </div>
            </div>

            <div class="report-summary-text">
                O sistema recomenda priorizar emergências críticas, chamados com foto,
                denúncias anônimas de maus-tratos e locais onde o animal está em risco imediato.
            </div>
        </div>
    `;

    nextScreen("shiftReportScreen");
}

/* =====================================================
   ÁREA ADMINISTRATIVA
===================================================== */

async function inicializarPainelAdmin() {
    garantirAdminLocal();
    renderizarSelectEmpresas();

    if (!usuarioLogado || usuarioLogado.cpf !== ADMIN_CPF) {
        const admin = usuarios.find(user => user.cpf === ADMIN_CPF);
        usuarioLogado = admin;
    }

    const nome = document.getElementById("adminWelcomeName");
    const cpfText = document.getElementById("adminCpfText");
    const avatar = document.getElementById("adminAvatar");

    if (nome) {
        nome.textContent = usuarioLogado.nome || "Administrador Safe Life";
    }

    if (cpfText) {
        cpfText.textContent = `CPF: ${usuarioLogado.cpf}`;
    }

    if (avatar) {
        avatar.src = usuarioLogado.foto || "img/vitor-chineque.jpg";
    }

    await atualizarStatsAdmin();

    nextScreen("adminDashboard");
}

async function carregarTodosUsuariosAdmin() {
    try {
        const dados = await apiRequest("/api/admin/users");

        if (Array.isArray(dados)) {
            usuarios = dados.map(user => ({
                ...user,
                ativo: user.ativo !== false
            }));

            salvarUsuarios();
            return usuarios;
        }

        return usuarios;
    } catch (erro) {
        return usuarios;
    }
}

async function carregarResumoAdmin() {
    const chamados = await carregarOcorrenciasProfissional();
    const users = await carregarTodosUsuariosAdmin();

    return {
        usuarios: users.length,
        profissionais: users.filter(user => user.type === "professional").length,
        admins: users.filter(user => user.type === "admin").length,
        chamados: chamados.length,
        anonimos: chamados.filter(item => item.anonima || item.isAnonima || item.origem === "anonima").length,
        criticos: chamados.filter(item => item.prioridade === "CRITICA").length,
        contasSuspeitas: detectarContasSuspeitas(users, chamados).length,
        contasBloqueadas: users.filter(user => user.ativo === false).length,
        empresas: empresasCadastradas.length,
        empresasAtivas: empresasCadastradas.filter(empresa => empresa.ativo !== false).length
    };
}

async function atualizarStatsAdmin() {
    const resumo = await carregarResumoAdmin();

    preencherCampoSeExistir("adminStatUsers", resumo.usuarios);
    preencherCampoSeExistir("adminStatProfessionals", resumo.profissionais);
    preencherCampoSeExistir("adminStatReports", resumo.chamados);
    preencherCampoSeExistir("adminStatSuspicious", resumo.contasSuspeitas);
    preencherCampoSeExistir("adminStatCompanies", resumo.empresasAtivas);
}

function detectarContasSuspeitas(listaUsuarios = usuarios, chamados = dbOcorrencias) {
    return listaUsuarios.filter(user => {
        if (user.cpf === ADMIN_CPF) return false;

        const semEmail = !user.email;
        const semTelefone = !user.telefone;
        const semFoto = !user.foto;
        const cpfInvalido = limparCpf(user.cpf).length !== 11;
        const bloqueado = user.ativo === false;

        const chamadosUsuario = chamados.filter(item =>
            item.cpf_usuario === user.cpf ||
            item.reporterCpf === user.cpf
        );

        const muitosChamados = chamadosUsuario.length >= 4;

        return semEmail || semTelefone || semFoto || cpfInvalido || bloqueado || muitosChamados;
    });
}

function adminTipoLabel(type) {
    if (type === "admin") return "Administrador";
    if (type === "professional") return "Profissional";
    return "Cidadão";
}

function adminStatusLabel(user) {
    return user.ativo === false ? "Bloqueado" : "Ativo";
}

/* =====================================================
   ADMIN: EMPRESAS / BASES / ONGS
===================================================== */

function abrirEmpresasAdmin() {
    const container = document.getElementById("adminCompaniesList");
    if (!container) return;

    container.innerHTML = "";

    if (!empresasCadastradas.length) {
        container.innerHTML = `
            <div class="occurrence-card" style="text-align:center;">
                <p>Nenhuma empresa/base cadastrada ainda.</p>
            </div>
        `;

        nextScreen("adminCompaniesScreen");
        return;
    }

    empresasCadastradas.forEach(empresa => {
        container.appendChild(criarCardEmpresaAdmin(empresa));
    });

    nextScreen("adminCompaniesScreen");
}

function criarCardEmpresaAdmin(empresa) {
    const card = document.createElement("div");
    card.className = `admin-user-card ${empresa.ativo === false ? "inactive" : ""}`;

    const statusClass = empresa.ativo === false ? "red" : "green";
    const statusText = empresa.ativo === false ? "Inativa" : "Ativa";

    card.innerHTML = `
        <div class="admin-user-top">
            <div class="admin-audit-icon">
                🏢
            </div>

            <div class="admin-user-info">
                <h4>${escaparHtml(empresa.nome)}</h4>
                <p>${escaparHtml(empresa.tipo || "Empresa / Base")}</p>
                <small>
                    ${escaparHtml(empresa.email || "Sem e-mail")} •
                    ${escaparHtml(empresa.telefone || "Sem telefone")}
                </small>
            </div>
        </div>

        <div class="admin-chip-row">
            <span class="admin-chip ${statusClass}">
                ${statusText}
            </span>

            <span class="admin-chip gray">
                ${escaparHtml(empresa.cnpj || "Sem CNPJ")}
            </span>
        </div>

        <div class="admin-warning-box">
            <strong>Endereço / atuação:</strong>
            ${escaparHtml(empresa.endereco || "Não informado.")}
        </div>

        <div class="admin-actions">
            ${empresa.ativo === false ? `
                <button
                    class="btn admin-success-btn"
                    type="button"
                    onclick="alterarStatusEmpresaAdmin(${empresa.id}, true)"
                >
                    Ativar
                </button>
            ` : `
                <button
                    class="btn secondary-btn"
                    type="button"
                    onclick="alterarStatusEmpresaAdmin(${empresa.id}, false)"
                >
                    Desativar
                </button>
            `}

            <button
                class="btn admin-danger-btn"
                type="button"
                onclick="excluirEmpresaAdmin(${empresa.id})"
            >
                Excluir
            </button>
        </div>
    `;

    return card;
}

function limparFormularioEmpresaAdmin() {
    [
        "adminCompanyName",
        "adminCompanyCnpj",
        "adminCompanyPhone",
        "adminCompanyEmail",
        "adminCompanyAddress"
    ].forEach(id => {
        const campo = document.getElementById(id);
        if (campo) campo.value = "";
    });

    const tipo = document.getElementById("adminCompanyType");
    if (tipo) tipo.value = "Base Safe Life";
}

function cadastrarEmpresaAdmin(event) {
    if (event) event.preventDefault();

    const nome = document.getElementById("adminCompanyName")?.value.trim();
    const tipo = document.getElementById("adminCompanyType")?.value || "Base Safe Life";
    const cnpj = document.getElementById("adminCompanyCnpj")?.value.trim() || "";
    const telefone = document.getElementById("adminCompanyPhone")?.value.trim() || "";
    const email = document.getElementById("adminCompanyEmail")?.value.trim() || "";
    const endereco = document.getElementById("adminCompanyAddress")?.value.trim() || "";

    if (!nome) {
        alert("Digite o nome da empresa, base ou ONG.");
        return;
    }

    if (email && !validarEmail(email)) {
        alert("Digite um e-mail válido.");
        return;
    }

    const existe = empresasCadastradas.some(empresa =>
        empresa.nome.toLowerCase() === nome.toLowerCase()
    );

    if (existe) {
        alert("Já existe uma empresa/base com esse nome.");
        return;
    }

    const novaEmpresa = {
        id: gerarId(),
        nome,
        tipo,
        cnpj,
        telefone,
        email,
        endereco,
        ativo: true
    };

    empresasCadastradas.unshift(novaEmpresa);
    salvarEmpresas();
    renderizarSelectEmpresas();

    registrarAuditoria("Empresa cadastrada", `${nome} foi adicionada ao sistema.`);
    triggerToast("🏢 Empresa/base cadastrada com sucesso!");

    limparFormularioEmpresaAdmin();
    abrirEmpresasAdmin();
}

function alterarStatusEmpresaAdmin(id, ativo) {
    const empresa = empresasCadastradas.find(item => item.id === id);

    if (!empresa) {
        alert("Empresa não encontrada.");
        return;
    }

    empresa.ativo = ativo;
    salvarEmpresas();
    renderizarSelectEmpresas();

    registrarAuditoria(
        ativo ? "Empresa ativada" : "Empresa desativada",
        `${empresa.nome} teve o status alterado.`
    );

    triggerToast(ativo ? "✅ Empresa ativada." : "⏸️ Empresa desativada.");
    abrirEmpresasAdmin();
}

function excluirEmpresaAdmin(id) {
    const empresa = empresasCadastradas.find(item => item.id === id);

    if (!empresa) {
        alert("Empresa não encontrada.");
        return;
    }

    const vinculados = usuarios.filter(user => user.company === empresa.nome);

    if (vinculados.length > 0) {
        const confirma = confirm(
            `Existem ${vinculados.length} usuários vinculados a esta empresa. Deseja excluir mesmo assim?`
        );

        if (!confirma) return;
    } else {
        const confirma = confirm("Tem certeza que deseja excluir esta empresa/base?");
        if (!confirma) return;
    }

    empresasCadastradas = empresasCadastradas.filter(item => item.id !== id);
    salvarEmpresas();
    renderizarSelectEmpresas();

    registrarAuditoria("Empresa excluída", `${empresa.nome} foi removida do sistema.`);
    triggerToast("🗑️ Empresa/base excluída.");
    abrirEmpresasAdmin();
}

/* =====================================================
   ADMIN: CADASTRAR PROFISSIONAL
===================================================== */

function abrirCadastrarProfissionalAdmin() {
    renderizarSelectEmpresas();

    [
        "adminProName",
        "adminProCpf",
        "adminProEmail",
        "adminProPhone",
        "adminProRegion",
        "adminProTeam",
        "adminProRegister",
        "adminProObs"
    ].forEach(id => {
        const campo = document.getElementById(id);
        if (campo) campo.value = "";
    });

    const cargo = document.getElementById("adminProCargo");
    const especialidade = document.getElementById("adminProSpecialty");
    const plantao = document.getElementById("adminProShift");
    const veiculo = document.getElementById("adminProVehicle");

    if (cargo) cargo.value = "Agente Operacional";
    if (especialidade) especialidade.value = "Resgate e triagem animal";
    if (plantao) plantao.value = "Disponível";
    if (veiculo) veiculo.value = "Veículo de apoio";

    nextScreen("adminCreateProfessionalScreen");
}

function cadastrarProfissionalAdmin(event) {
    if (event) event.preventDefault();

    const nome = document.getElementById("adminProName")?.value.trim();
    const cpf = limparCpf(document.getElementById("adminProCpf")?.value);
    const email = document.getElementById("adminProEmail")?.value.trim();
    const telefone = document.getElementById("adminProPhone")?.value.trim();
    const company = document.getElementById("adminProCompany")?.value;
    const cargo = document.getElementById("adminProCargo")?.value.trim() || "Agente Operacional";
    const especialidade = document.getElementById("adminProSpecialty")?.value.trim() || "Resgate e triagem animal";
    const regiao = document.getElementById("adminProRegion")?.value.trim() || "";
    const plantao = document.getElementById("adminProShift")?.value || "Disponível";
    const veiculo = document.getElementById("adminProVehicle")?.value.trim() || "";
    const equipe = document.getElementById("adminProTeam")?.value.trim() || "";
    const registro = document.getElementById("adminProRegister")?.value.trim() || "";
    const observacoes = document.getElementById("adminProObs")?.value.trim() || "";

    if (!nome || !cpf || !email || !telefone || !company) {
        alert("Preencha nome, CPF, e-mail, telefone e empresa.");
        return;
    }

    if (cpf.length !== 11) {
        alert("Digite um CPF válido com 11 números.");
        return;
    }

    if (cpf === ADMIN_CPF) {
        alert("Este CPF pertence ao administrador master.");
        return;
    }

    if (!validarEmail(email)) {
        alert("Digite um e-mail válido.");
        return;
    }

    const existe = usuarios.some(user => user.cpf === cpf);

    if (existe) {
        alert("Este CPF já está cadastrado.");
        return;
    }

    const novoProfissional = {
        id: gerarId(),
        nome,
        cpf,
        email,
        telefone,
        type: "professional",
        company,
        foto: "img/vitor-chineque.jpg",
        ativo: true,
        profissional: {
            cargo,
            especialidade,
            regiao,
            plantao,
            veiculo,
            equipe,
            registro,
            observacoes
        }
    };

    usuarios.unshift(novoProfissional);
    salvarUsuarios();

    registrarAuditoria("Profissional cadastrado", `${nome} foi cadastrado pelo administrador.`);
    triggerToast("👷 Profissional cadastrado com sucesso!");

    abrirGerenciarUsuarios();
}function criarAdminUserCard(user, suspeito = false) {
    const card = document.createElement("div");

    card.className = `admin-user-card ${user.ativo === false ? "inactive" : ""} ${suspeito ? "suspicious" : ""}`;

    const foto = user.foto || "img/vitor-chineque.jpg";

    const chipStatus = user.ativo === false ? "red" : "green";
    const chipTipo = user.type === "admin" ? "" : user.type === "professional" ? "orange" : "gray";

    const podeMexer = user.cpf !== ADMIN_CPF;

    card.innerHTML = `
        <div class="admin-user-top">
            <img
                class="admin-user-avatar"
                src="${foto}"
                alt="Foto do usuário"
            >

            <div class="admin-user-info">
                <h4>${escaparHtml(user.nome || "Usuário")}</h4>
                <p>CPF: ${escaparHtml(user.cpf || "---")}</p>
                <small>
                    ${escaparHtml(user.email || "Sem e-mail")} •
                    ${escaparHtml(user.telefone || "Sem telefone")}
                </small>
            </div>
        </div>

        <div class="admin-chip-row">
            <span class="admin-chip ${chipStatus}">
                ${adminStatusLabel(user)}
            </span>

            <span class="admin-chip ${chipTipo}">
                ${adminTipoLabel(user.type)}
            </span>

            ${user.company ? `
                <span class="admin-chip gray">
                    ${escaparHtml(user.company)}
                </span>
            ` : ""}

            ${suspeito ? `<span class="admin-chip red">Suspeita</span>` : ""}
        </div>

        <div class="admin-warning-box">
            <strong>Análise:</strong>
            ${escaparHtml(motivoSuspeita(user))}
        </div>

        ${user.type === "professional" && user.profissional ? `
            <div class="admin-warning-box">
                <strong>Dados profissionais:</strong><br>
                Cargo: ${escaparHtml(user.profissional.cargo || "Não informado")}<br>
                Especialidade: ${escaparHtml(user.profissional.especialidade || "Não informado")}<br>
                Região: ${escaparHtml(user.profissional.regiao || "Não informada")}<br>
                Plantão: ${escaparHtml(user.profissional.plantao || "Não informado")}
            </div>
        ` : ""}

        ${podeMexer ? `
            <div class="admin-actions">
                ${user.ativo === false ? `
                    <button
                        class="btn admin-success-btn"
                        type="button"
                        onclick="reativarContaAdmin('${user.cpf}')"
                    >
                        Reativar
                    </button>
                ` : `
                    <button
                        class="btn secondary-btn"
                        type="button"
                        onclick="bloquearContaAdmin('${user.cpf}')"
                    >
                        Bloquear
                    </button>
                `}

                <button
                    class="btn admin-danger-btn"
                    type="button"
                    onclick="excluirContaAdmin('${user.cpf}')"
                >
                    Excluir
                </button>

                <button
                    class="btn"
                    type="button"
                    onclick="verDetalhesContaAdmin('${user.cpf}')"
                >
                    Detalhes
                </button>
            </div>
        ` : `
            <div class="admin-warning-box">
                <strong>Conta protegida:</strong>
                esta é a conta master do administrador e não pode ser bloqueada ou excluída.
            </div>
        `}
    `;

    return card;
}

function motivoSuspeita(user) {
    if (user.cpf === ADMIN_CPF) {
        return "Conta master protegida.";
    }

    if (user.ativo === false) {
        return "Conta bloqueada pelo administrador.";
    }

    if (!user.email && !user.telefone) {
        return "Conta sem e-mail e sem telefone.";
    }

    if (!user.email) {
        return "Conta sem e-mail cadastrado.";
    }

    if (!user.telefone) {
        return "Conta sem telefone cadastrado.";
    }

    if (!user.foto) {
        return "Conta sem foto de perfil.";
    }

    if (limparCpf(user.cpf).length !== 11) {
        return "CPF em formato inválido.";
    }

    if (user.type === "professional" && !user.company) {
        return "Profissional sem empresa/base vinculada.";
    }

    return "Nenhum risco alto encontrado.";
}

async function abrirGerenciarUsuarios() {
    const container = document.getElementById("adminUsersList");
    if (!container) return;

    const lista = await carregarTodosUsuariosAdmin();
    const chamados = await carregarOcorrenciasProfissional();
    const suspeitas = detectarContasSuspeitas(lista, chamados).map(user => user.cpf);

    container.innerHTML = "";

    if (!lista.length) {
        container.innerHTML = `
            <div class="occurrence-card">
                <p>Nenhuma conta cadastrada.</p>
            </div>
        `;

        nextScreen("adminUsersScreen");
        return;
    }

    lista.forEach(user => {
        container.appendChild(criarAdminUserCard(user, suspeitas.includes(user.cpf)));
    });

    nextScreen("adminUsersScreen");
}

async function abrirContasSuspeitas() {
    const container = document.getElementById("adminSuspiciousList");
    if (!container) return;

    const lista = await carregarTodosUsuariosAdmin();
    const chamados = await carregarOcorrenciasProfissional();
    const suspeitas = detectarContasSuspeitas(lista, chamados);

    container.innerHTML = "";

    if (!suspeitas.length) {
        container.innerHTML = `
            <div class="occurrence-card" style="text-align:center;border-left-color:var(--success-color);">
                <p>Nenhuma conta suspeita encontrada.</p>
            </div>
        `;

        nextScreen("adminSuspiciousScreen");
        return;
    }

    suspeitas.forEach(user => {
        container.appendChild(criarAdminUserCard(user, true));
    });

    nextScreen("adminSuspiciousScreen");
}

async function bloquearContaAdmin(cpf) {
    const cpfLimpo = limparCpf(cpf);

    if (cpfLimpo === ADMIN_CPF) {
        alert("A conta master do administrador não pode ser bloqueada.");
        return;
    }

    const confirma = confirm("Tem certeza que deseja bloquear esta conta?");

    if (!confirma) return;

    try {
        await apiRequest(`/api/admin/users/${cpfLimpo}/status`, {
            method: "PATCH",
            body: JSON.stringify({
                ativo: false,
                adminCpf: ADMIN_CPF
            })
        });
    } catch (erro) {
        const index = usuarios.findIndex(user => user.cpf === cpfLimpo);

        if (index !== -1) {
            usuarios[index].ativo = false;
            salvarUsuarios();
        }
    }

    registrarAuditoria("Conta bloqueada", `CPF ${cpfLimpo} foi bloqueado pelo administrador.`);
    triggerToast("🚫 Conta bloqueada.");
    abrirGerenciarUsuarios();
}

async function reativarContaAdmin(cpf) {
    const cpfLimpo = limparCpf(cpf);

    try {
        await apiRequest(`/api/admin/users/${cpfLimpo}/status`, {
            method: "PATCH",
            body: JSON.stringify({
                ativo: true,
                adminCpf: ADMIN_CPF
            })
        });
    } catch (erro) {
        const index = usuarios.findIndex(user => user.cpf === cpfLimpo);

        if (index !== -1) {
            usuarios[index].ativo = true;
            salvarUsuarios();
        }
    }

    registrarAuditoria("Conta reativada", `CPF ${cpfLimpo} foi reativado pelo administrador.`);
    triggerToast("✅ Conta reativada.");
    abrirGerenciarUsuarios();
}

async function excluirContaAdmin(cpf) {
    const cpfLimpo = limparCpf(cpf);

    if (cpfLimpo === ADMIN_CPF) {
        alert("A conta master do administrador não pode ser excluída.");
        return;
    }

    const user = usuarios.find(item => item.cpf === cpfLimpo);

    if (!user) {
        alert("Conta não encontrada.");
        return;
    }

    const confirma = confirm(
        `Tem certeza que deseja excluir a conta de ${user.nome}? Essa ação remove do painel local.`
    );

    if (!confirma) return;

    try {
        await apiRequest(`/api/admin/users/${cpfLimpo}`, {
            method: "DELETE",
            body: JSON.stringify({
                adminCpf: ADMIN_CPF
            })
        });
    } catch (erro) {
        usuarios = usuarios.filter(item => item.cpf !== cpfLimpo);
        salvarUsuarios();
    }

    registrarAuditoria("Conta excluída", `${user.nome} / CPF ${cpfLimpo} foi excluído pelo administrador.`);
    triggerToast("🗑️ Conta excluída.");
    abrirGerenciarUsuarios();
}

async function verDetalhesContaAdmin(cpf) {
    const cpfLimpo = limparCpf(cpf);
    const lista = await carregarTodosUsuariosAdmin();
    const user = lista.find(item => item.cpf === cpfLimpo);

    if (!user) {
        alert("Conta não encontrada.");
        return;
    }

    const profissional = user.profissional
        ? `\nCargo: ${user.profissional.cargo || "Não informado"}\nEspecialidade: ${user.profissional.especialidade || "Não informado"}\nRegião: ${user.profissional.regiao || "Não informado"}\nPlantão: ${user.profissional.plantao || "Não informado"}\nVeículo: ${user.profissional.veiculo || "Não informado"}\nEquipe: ${user.profissional.equipe || "Não informado"}\nRegistro: ${user.profissional.registro || "Não informado"}`
        : "";

    alert(
        `Dados da conta:\n\n` +
        `Nome: ${user.nome}\n` +
        `CPF: ${user.cpf}\n` +
        `Tipo: ${adminTipoLabel(user.type)}\n` +
        `E-mail: ${user.email || "Não informado"}\n` +
        `Telefone: ${user.telefone || "Não informado"}\n` +
        `Empresa: ${user.company || "Nenhuma"}\n` +
        `Status: ${adminStatusLabel(user)}` +
        profissional
    );
}

function renderPerfilAdmin() {
    if (!usuarioLogado) return;

    const avatar = document.getElementById("adminProfileAvatar");
    const nomeTela = document.getElementById("adminProfileName");
    const editName = document.getElementById("editAdminName");
    const editCpf = document.getElementById("editAdminCpf");
    const editEmail = document.getElementById("editAdminEmail");
    const editPhone = document.getElementById("editAdminPhone");

    if (avatar) {
        avatar.src = usuarioLogado.foto || "img/vitor-chineque.jpg";
    }

    if (nomeTela) {
        nomeTela.textContent = usuarioLogado.nome || "Administrador";
    }

    if (editName) {
        editName.value = usuarioLogado.nome || "";
    }

    if (editCpf) {
        editCpf.value = ADMIN_CPF;
    }

    if (editEmail) {
        editEmail.value = usuarioLogado.email || "";
    }

    if (editPhone) {
        editPhone.value = usuarioLogado.telefone || "";
    }

    nextScreen("adminProfileScreen");
}

async function salvarPerfilAdmin() {
    if (!usuarioLogado) return;

    const nome = document.getElementById("editAdminName").value.trim();
    const email = document.getElementById("editAdminEmail").value.trim();
    const telefone = document.getElementById("editAdminPhone").value.trim();

    if (!nome) {
        alert("Digite o nome do administrador.");
        return;
    }

    if (email && !validarEmail(email)) {
        alert("Digite um e-mail válido.");
        return;
    }

    try {
        const resposta = await apiRequest(`/api/users/${ADMIN_CPF}`, {
            method: "PUT",
            body: JSON.stringify({
                nome,
                email,
                telefone,
                company: "Safe Life Matriz"
            })
        });

        usuarioLogado = resposta.user;
        usuarioLogado.type = "admin";
    } catch (erro) {
        usuarioLogado.nome = nome;
        usuarioLogado.email = email;
        usuarioLogado.telefone = telefone;
        usuarioLogado.type = "admin";
        usuarioLogado.company = "Safe Life Matriz";
    }

    atualizarUsuarioLocal(usuarioLogado, ADMIN_CPF);
    registrarAuditoria("Perfil administrativo atualizado", "Administrador alterou seus dados pessoais.");

    triggerToast("👑 Perfil do administrador atualizado.");
    inicializarPainelAdmin();
}

async function atualizarFotoAdmin(input) {
    if (!usuarioLogado || !input.files || !input.files[0]) return;

    const fotoBase64 = await arquivoParaBase64(input.files[0]);

    try {
        const resposta = await apiRequest(`/api/users/${ADMIN_CPF}`, {
            method: "PUT",
            body: JSON.stringify({
                foto: fotoBase64
            })
        });

        usuarioLogado = resposta.user;
        usuarioLogado.type = "admin";
    } catch (erro) {
        usuarioLogado.foto = fotoBase64;
    }

    atualizarUsuarioLocal(usuarioLogado, ADMIN_CPF);
    registrarAuditoria("Foto administrativa atualizada", "Administrador alterou sua foto de perfil.");

    const avatar = document.getElementById("adminProfileAvatar");
    const avatarDash = document.getElementById("adminAvatar");

    if (avatar) {
        avatar.src = usuarioLogado.foto || "img/vitor-chineque.jpg";
    }

    if (avatarDash) {
        avatarDash.src = usuarioLogado.foto || "img/vitor-chineque.jpg";
    }

    triggerToast("📸 Foto do administrador atualizada.");
}

async function abrirRelatorioAdmin() {
    const container = document.getElementById("adminReportBox");
    if (!container) return;

    const resumo = await carregarResumoAdmin();

    container.innerHTML = `
        <div class="admin-report-card">
            <div class="admin-report-header">
                <div class="admin-report-icon">
                    📊
                </div>

                <div class="admin-report-title">
                    <h4>Relatório Geral Safe Life</h4>
                    <p>Resumo administrativo do sistema.</p>
                </div>
            </div>

            <div class="admin-report-grid">
                <div class="admin-report-mini">
                    <strong>${resumo.usuarios}</strong>
                    <span>Usuários</span>
                </div>

                <div class="admin-report-mini">
                    <strong>${resumo.profissionais}</strong>
                    <span>Profissionais</span>
                </div>

                <div class="admin-report-mini">
                    <strong>${resumo.admins}</strong>
                    <span>Admins</span>
                </div>

                <div class="admin-report-mini">
                    <strong>${resumo.empresasAtivas}</strong>
                    <span>Empresas</span>
                </div>

                <div class="admin-report-mini">
                    <strong>${resumo.chamados}</strong>
                    <span>Chamados</span>
                </div>

                <div class="admin-report-mini">
                    <strong>${resumo.anonimos}</strong>
                    <span>Anônimos</span>
                </div>

                <div class="admin-report-mini">
                    <strong>${resumo.criticos}</strong>
                    <span>Críticos</span>
                </div>

                <div class="admin-report-mini">
                    <strong>${resumo.contasBloqueadas}</strong>
                    <span>Bloqueadas</span>
                </div>
            </div>

            <div class="admin-report-text">
                <strong>Análise:</strong>
                o administrador master pode gerenciar usuários, profissionais, empresas,
                bases parceiras, auditoria e chamados críticos do Safe Life.
            </div>
        </div>
    `;

    registrarAuditoria("Relatório geral aberto", "Administrador visualizou o relatório geral.");
    nextScreen("adminReportScreen");
}

function abrirAuditoriaAdmin() {
    const container = document.getElementById("adminAuditList");
    if (!container) return;

    container.innerHTML = "";

    if (!auditoriaAdmin.length) {
        container.innerHTML = `
            <div class="occurrence-card" style="text-align:center;">
                <p>Nenhuma ação administrativa registrada ainda.</p>
            </div>
        `;

        nextScreen("adminAuditScreen");
        return;
    }

    auditoriaAdmin.forEach(item => {
        const card = document.createElement("div");
        card.className = "admin-audit-card";

        card.innerHTML = `
            <div class="admin-audit-top">
                <div class="admin-audit-icon">
                    🧾
                </div>

                <div class="admin-audit-info">
                    <h4>${escaparHtml(item.acao)}</h4>
                    <p>${escaparHtml(item.detalhes || "Sem detalhes.")}</p>
                    <small>
                        Admin: ${escaparHtml(item.adminNome || "Administrador")} •
                        ${escaparHtml(formatarDataHora(item.data))}
                    </small>
                </div>
            </div>
        `;

        container.appendChild(card);
    });

    nextScreen("adminAuditScreen");
}

function abrirPainelProfissionalComoAdmin() {
    if (!usuarioLogado || usuarioLogado.cpf !== ADMIN_CPF) {
        alert("Apenas o administrador master pode acessar esta função.");
        return;
    }

    usuarioLogado = {
        ...usuarioLogado,
        type: "admin",
        company: "Safe Life Matriz",
        profissional: {
            cargo: "Administrador Master",
            especialidade: "Gestão geral da plataforma",
            regiao: "Todas as regiões",
            plantao: "Supervisão",
            veiculo: "Gestão administrativa",
            equipe: "Central Safe Life",
            registro: "ADMIN-MASTER",
            observacoes: "Acesso total ao painel de operações."
        }
    };

    registrarAuditoria("Acesso ao painel profissional", "Administrador acessou o painel operacional.");
    inicializarPainelPro();
}

function voltarParaAdminDashboard() {
    if (!usuarioLogado) return;

    usuarioLogado.type = "admin";
    usuarioLogado.cpf = ADMIN_CPF;

    inicializarPainelAdmin();
}

/* =====================================================
   INICIALIZAÇÃO
===================================================== */

document.addEventListener("DOMContentLoaded", function() {
    garantirAdminLocal();

    iniciarCarrossel();
    renderizarSelectEmpresas();

    toggleRegCompanyField();
    toggleLoginCompanyField();

    const btnLocalizacao = document.getElementById("btnLocalizacao");

    if (btnLocalizacao) {
        btnLocalizacao.addEventListener("click", () => {
            solicitarLocalizacao().catch(() => {});
        });
    }

    const formEmpresaAdmin = document.getElementById("adminCompanyForm");

    if (formEmpresaAdmin) {
        formEmpresaAdmin.addEventListener("submit", cadastrarEmpresaAdmin);
    }

    const formProfissionalAdmin = document.getElementById("adminCreateProfessionalForm");

    if (formProfissionalAdmin) {
        formProfissionalAdmin.addEventListener("submit", cadastrarProfissionalAdmin);
    }
});


/* =====================================================
   PATCH FINAL V2 - PERFIS PADRÃO + OPÇÃO MARCADA + FOTO
   Fluxo esperado:
   Vitor cria ocorrência marcando uma opção visual.
   Zeca vê no painel profissional:
   - opção marcada
   - descrição
   - endereço
   - foto da ocorrência
   - foto/nome do Vitor
   Gustavo vê no admin.
===================================================== */

(function () {
    const USERS_KEY = "safeLifeUsuarios";
    const OCC_KEY = "safeLifeOcorrencias";
    const PET_KEY = "safeLifePets";
    const EMP_KEY = "safeLifeEmpresas";
    const LOGGED_KEY = "safeLifeLoggedUser";

    function get(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw) ?? fallback;
        } catch (e) {
            return fallback;
        }
    }

    function set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function cleanCpf(value) {
        return String(value || "").replace(/\D/g, "");
    }

    function el(id) {
        return document.getElementById(id);
    }

    function val(id) {
        const campo = el(id);
        return campo ? String(campo.value || "").trim() : "";
    }

    function setText(id, value) {
        const campo = el(id);
        if (campo) campo.textContent = value;
    }

    function setImg(id, value) {
        const campo = el(id);
        if (campo && value) campo.src = value;
    }

    function html(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function toast(msg) {
        if (typeof window.triggerToast === "function") {
            window.triggerToast(msg);
        } else {
            alert(msg);
        }
    }

    function readFile(inputId) {
        return new Promise(resolve => {
            const input = el(inputId);
            const file = input && input.files && input.files[0];

            if (!file) {
                resolve("");
                return;
            }

            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => resolve("");
            reader.readAsDataURL(file);
        });
    }

    function getDefaultUsers() {
        const users = get(USERS_KEY, []);

        return {
            vitor: users.find(u => cleanCpf(u.cpf) === "11111111111") || null,
            zeca: users.find(u => cleanCpf(u.cpf) === "99999999999") || null,
            gustavo: users.find(u => cleanCpf(u.cpf) === "45317828791") || null
        };
    }

    function currentUser() {
        // IMPORTANTE: usuarioLogado é variável do seu script original.
        try {
            if (typeof usuarioLogado !== "undefined" && usuarioLogado && usuarioLogado.cpf) {
                return usuarioLogado;
            }
        } catch (e) {}

        const saved = get(LOGGED_KEY, null);
        if (saved && saved.cpf) return saved;

        return getDefaultUsers().vitor;
    }

    function setCurrentUser(user) {
        try {
            usuarioLogado = user;
        } catch (e) {}

        window.usuarioLogado = user;
        set(LOGGED_KEY, user);
    }

    function ensureDefaults() {
        if (typeof window.garantirAdminLocal === "function") {
            try {
                window.garantirAdminLocal();
            } catch (e) {}
        }

        if (!localStorage.getItem(OCC_KEY)) set(OCC_KEY, []);
        if (!localStorage.getItem(PET_KEY)) set(PET_KEY, []);
        if (!localStorage.getItem(EMP_KEY)) {
            set(EMP_KEY, [
                { id: "empresa-matriz", nome: "Safe Life Matriz", ativo: true },
                { id: "ong-patas", nome: "ONG Patas Livres", ativo: true },
                { id: "ccz", nome: "Centro de Controle de Zoonoses", ativo: true }
            ]);
        }

        const users = get(USERS_KEY, []);
        const d = getDefaultUsers();

        // Se por algum motivo algum padrão sumiu, garante de novo.
        if (!d.vitor && typeof IMAGENS_USUARIOS_PADRAO !== "undefined") {
            users.push({
                id: "cidadao-vitor",
                nome: "Vitor Chineque",
                name: "Vitor Chineque",
                cpf: "11111111111",
                email: "vitor.chinequero@safelife.com",
                type: "citizen",
                foto: IMAGENS_USUARIOS_PADRAO.vitor,
                avatar: IMAGENS_USUARIOS_PADRAO.vitor,
                ativo: true
            });
        }

        if (!d.zeca && typeof IMAGENS_USUARIOS_PADRAO !== "undefined") {
            users.push({
                id: "profissional-zeca",
                nome: "Zeca do Santos",
                name: "Zeca do Santos",
                cpf: "99999999999",
                email: "zeca.dos.animais@safelife.com",
                type: "professional",
                company: "Safe Life Matriz",
                empresa: "Safe Life Matriz",
                foto: IMAGENS_USUARIOS_PADRAO.zeca,
                avatar: IMAGENS_USUARIOS_PADRAO.zeca,
                ativo: true
            });
        }

        if (!d.gustavo && typeof IMAGENS_USUARIOS_PADRAO !== "undefined") {
            users.push({
                id: "admin-gustavo",
                nome: "Gustavo Siri",
                name: "Gustavo Siri",
                cpf: "45317828791",
                email: "gustavo.siriguejo@safelife.com",
                type: "admin",
                foto: IMAGENS_USUARIOS_PADRAO.gustavo,
                avatar: IMAGENS_USUARIOS_PADRAO.gustavo,
                ativo: true
            });
        }

        set(USERS_KEY, users);
    }

    function selectedCardText(containerId, hiddenId) {
        const hidden = el(hiddenId);

        if (hidden && hidden.value) return hidden.value;

        const selected =
            document.querySelector(`#${containerId} .quick-option-card.selected`) ||
            document.querySelector(`#${containerId} .quick-option-card.active`) ||
            document.querySelector(`#${containerId} .selected`) ||
            document.querySelector(`#${containerId} .active`);

        if (selected) {
            const title = selected.querySelector(".quick-option-title");
            return title ? title.textContent.trim() : selected.textContent.trim();
        }

        return "";
    }

    function renderOptionsFixed(containerId, options, hiddenInputId) {
        const container = el(containerId);
        if (!container) return;

        container.innerHTML = "";

        options.forEach(option => {
            const card = document.createElement("div");
            card.className = "quick-option-card";
            card.setAttribute("tabindex", "0");

            card.innerHTML = `
                <div class="quick-option-icon">${option.icon}</div>
                <div class="quick-option-title">${html(option.title)}</div>
                <div class="quick-option-desc">${html(option.desc)}</div>
            `;

            card.addEventListener("click", () => {
                document
                    .querySelectorAll(`#${containerId} .quick-option-card`)
                    .forEach(c => c.classList.remove("selected", "active"));

                card.classList.add("selected", "active");

                const hidden = el(hiddenInputId);
                if (hidden) hidden.value = option.title;
            });

            container.appendChild(card);
        });
    }

    // Garante que as opções visuais sejam sempre as certas.
    window.renderOptions = renderOptionsFixed;

    window.openCitizenForm = function openCitizenForm(typeKey) {
        ensureDefaults();

        currentFormConfig = FORM_CONFIGS[typeKey];

        if (!currentFormConfig) {
            toast("Tipo de formulário não encontrado.");
            return;
        }

        const form = el("citizenForm");
        if (form) form.reset();

        if (el("formKey")) el("formKey").value = typeKey;
        if (el("formTitle")) el("formTitle").textContent = currentFormConfig.title;
        if (el("formSubtitle")) el("formSubtitle").textContent = currentFormConfig.subtitle;
        if (el("selectedQuickOption")) el("selectedQuickOption").value = "";

        renderOptionsFixed("quickOptionsGrid", currentFormConfig.options, "selectedQuickOption");

        if (typeof window.obterTextoLocalizacaoAtual === "function") {
            const local = window.obterTextoLocalizacaoAtual();
            if (local && el("formLocation")) {
                el("formLocation").value = local;
            }
        }

        window.nextScreen("scrForm");
    };

    window.openAnonForm = function openAnonForm() {
        ensureDefaults();

        const form = el("anonForm");
        if (form) form.reset();

        if (el("selectedAnonOption")) el("selectedAnonOption").value = "";

        renderOptionsFixed("anonOptionsGrid", FORM_CONFIGS.anonymous.options, "selectedAnonOption");

        if (typeof window.obterTextoLocalizacaoAtual === "function") {
            const local = window.obterTextoLocalizacaoAtual();
            if (local && el("anonLocation")) {
                el("anonLocation").value = local;
            }
        }

        window.nextScreen("scrAnonForm");
    };

    function buildOccurrence(isAnon, photo) {
        const user = currentUser() || {};
        const option = isAnon
            ? selectedCardText("anonOptionsGrid", "selectedAnonOption")
            : selectedCardText("quickOptionsGrid", "selectedQuickOption");

        const formKey = isAnon ? "anonymous" : val("formKey");
        const cfg = FORM_CONFIGS[formKey] || {};
        const desc = isAnon ? val("anonDetails") : val("formDetails");
        const address = isAnon ? val("anonLocation") : val("formLocation");

        const userName = isAnon ? "Denúncia anônima" : (user.nome || user.name || "Vitor Chineque");
        const userPhoto = isAnon ? "" : (user.foto || user.avatar || "");

        return {
            id: Date.now().toString(),
            origem: isAnon ? "anonima" : "ocorrencia",
            tipo: isAnon ? "Denúncia Anônima" : (cfg.title || "Ocorrência Animal"),
            type: isAnon ? "Denúncia Anônima" : (cfg.title || "Ocorrência Animal"),
            categoria: formKey,
            category: formKey,
            assunto: option,
            opcaoEscolhida: option,
            opcao_escolhida: option,
            optionTitle: option,
            detalhes: desc,
            descricao: desc,
            description: desc,
            localizacao: address,
            endereco_completo: address,
            endereco: address,
            address: address,
            local: address,
            foto: photo,
            fotoEvidencia: photo,
            fotoOcorrencia: photo,
            occurrencePhoto: photo,
            evidencePhoto: photo,
            nome_usuario: userName,
            cpf_usuario: isAnon ? null : user.cpf,
            foto_usuario: userPhoto,
            citizenName: userName,
            citizenCpf: isAnon ? "" : user.cpf,
            reporterName: userName,
            reporterCpf: isAnon ? "" : user.cpf,
            reporterPhoto: userPhoto,
            fotoSolicitante: userPhoto,
            anonima: isAnon,
            isAnonima: isAnon,
            status: "Pendente",
            prioridade: cfg.priority || (isAnon ? "ALTA" : "NORMAL"),
            timestamp: new Date().toLocaleString("pt-BR"),
            createdAt: new Date().toLocaleString("pt-BR")
        };
    }

    async function saveOccurrence(event, isAnon) {
        if (event && event.preventDefault) event.preventDefault();

        ensureDefaults();

        const option = isAnon
            ? selectedCardText("anonOptionsGrid", "selectedAnonOption")
            : selectedCardText("quickOptionsGrid", "selectedQuickOption");

        const desc = isAnon ? val("anonDetails") : val("formDetails");
        const address = isAnon ? val("anonLocation") : val("formLocation");

        if (!option) {
            toast("Escolha uma opção antes de enviar.");
            return;
        }

        if (!desc || !address) {
            toast("Preencha o endereço e a descrição.");
            return;
        }

        const photo = await readFile(isAnon ? "anonFile" : "formFile");
        const occurrence = buildOccurrence(isAnon, photo);

        const list = get(OCC_KEY, []);
        list.unshift(occurrence);
        set(OCC_KEY, list);

        try {
            dbOcorrencias = list;
        } catch (e) {
            window.dbOcorrencias = list;
        }

        const msg = el("confirmMsg");
        if (msg) {
            msg.textContent = `Chamado "${occurrence.opcaoEscolhida}" enviado. O profissional verá opção, descrição, endereço, foto da ocorrência e foto do cidadão.`;
        }

        if (event && event.target && event.target.reset) {
            event.target.reset();
        }

        toast("🚀 Ocorrência enviada para o painel do Zeca.");

        if (typeof window.nextScreen === "function") {
            window.nextScreen("confirmationScreen");
        }
    }

    window.registrarAcao = function registrarAcao(event) {
        return saveOccurrence(event, false);
    };

    window.registrarAcaoAnonima = function registrarAcaoAnonima(event) {
        return saveOccurrence(event, true);
    };

    async function savePet(event) {
        if (event && event.preventDefault) event.preventDefault();

        ensureDefaults();

        const user = currentUser() || {};
        const nome = val("petName");

        if (!nome) {
            toast("Digite o nome do pet.");
            return;
        }

        const photo = await readFile("petPhoto");

        const pet = {
            id: Date.now().toString(),
            donoCpf: user.cpf || "11111111111",
            donoNome: user.nome || user.name || "Vitor Chineque",
            nome,
            name: nome,
            idade: val("petAge"),
            age: val("petAge"),
            especie: val("petSpecies") || "Animal",
            species: val("petSpecies") || "Animal",
            raca: val("petBreed") || "Não informada",
            breed: val("petBreed") || "Não informada",
            local: val("petLocation") || "Local não informado",
            location: val("petLocation") || "Local não informado",
            foto: photo,
            photo,
            createdAt: new Date().toLocaleString("pt-BR")
        };

        const pets = get(PET_KEY, []);
        pets.unshift(pet);
        set(PET_KEY, pets);

        try {
            meusPets = pets;
        } catch (e) {
            window.meusPets = pets;
        }

        if (event && event.target && event.target.reset) {
            event.target.reset();
        }

        toast("🐾 Pet registrado no perfil do Vitor.");
        window.renderPerfilCidadao();
    }

    window.registrarPet = savePet;

    function photoBlock(item) {
        const src = item.fotoOcorrencia || item.fotoEvidencia || item.occurrencePhoto || item.evidencePhoto || item.foto || "";

        if (!src) {
            return `<div class="occ-photo-placeholder">📷 Sem foto da ocorrência</div>`;
        }

        return `<img class="occurrence-evidence-img" src="${src}" alt="Foto da ocorrência">`;
    }

    function reporterBlock(item) {
        const src = item.fotoSolicitante || item.foto_usuario || item.reporterPhoto || "";
        const name = item.citizenName || item.nome_usuario || item.reporterName || "Vitor Chineque";

        return `
            <div class="reporter-row">
                ${src ? `<img class="reporter-avatar" src="${src}" alt="Foto do cidadão">` : `<div class="reporter-avatar empty">👤</div>`}
                <div>
                    <strong>${html(name)}</strong>
                    <small>${item.anonima ? "Denúncia anônima" : `CPF: ${html(item.citizenCpf || item.cpf_usuario || "11111111111")}`}</small>
                </div>
            </div>
        `;
    }

    function occurrenceCard(item, mode) {
        const option = item.opcaoEscolhida || item.opcao_escolhida || item.assunto || item.optionTitle || "Opção não informada";
        const desc = item.detalhes || item.descricao || item.description || "Sem descrição";
        const address = item.localizacao || item.endereco_completo || item.endereco || item.address || "Sem endereço";
        const type = item.tipo || item.type || "Ocorrência";

        return `
            <article class="occurrence-card occurrence-full-card">
                <div class="occurrence-header">
                    <div>
                        <h4>${html(type)}</h4>
                        <small>${html(item.createdAt || item.timestamp || "")}</small>
                    </div>
                    <span class="status-badge">${html(item.status || "Pendente")}</span>
                </div>

                ${reporterBlock(item)}

                <div class="occurrence-photo-box">
                    ${photoBlock(item)}
                </div>

                <p><strong>Opção marcada:</strong> ${html(option)}</p>
                <p><strong>Descrição:</strong> ${html(desc)}</p>
                <p><strong>Endereço atual:</strong> ${html(address)}</p>
                <p><strong>Prioridade:</strong> ${html(item.prioridade || "NORMAL")}</p>

                ${mode === "pro" ? `
                    <button class="btn small-btn" type="button" onclick="marcarOcorrenciaAtendida('${item.id}')">
                        ✅ Marcar como atendida
                    </button>
                ` : ""}

                ${mode === "admin" ? `
                    <button class="btn secondary-btn small-btn" type="button" onclick="excluirOcorrenciaAdmin('${item.id}')">
                        🗑️ Excluir
                    </button>
                ` : ""}
            </article>
        `;
    }

    window.carregarOcorrenciasProfissional = async function carregarOcorrenciasProfissional() {
        ensureDefaults();
        return get(OCC_KEY, []);
    };

    window.abrirOcorrenciasPro = async function abrirOcorrenciasPro() {
        const container = el("listaIntegradaPro");
        const list = get(OCC_KEY, []);

        if (container) {
            container.innerHTML = list.length
                ? list.map(item => occurrenceCard(item, "pro")).join("")
                : `<div class="occurrence-card"><h4>Fila vazia</h4><p>Quando o Vitor enviar uma ocorrência, ela aparece aqui.</p></div>`;
        }

        window.nextScreen("proListScreen");
    };

    window.abrirOcorrenciaMaisProxima = function abrirOcorrenciaMaisProxima() {
        const container = el("nearestOccurrenceBox");
        const list = get(OCC_KEY, []);

        if (container) {
            container.innerHTML = list.length
                ? occurrenceCard(list[0], "pro")
                : `<div class="occurrence-card"><h4>Nenhuma ocorrência próxima</h4><p>Nenhum chamado enviado ainda.</p></div>`;
        }

        window.nextScreen("nearestOccurrenceScreen");
    };

    window.abrirFilaPrioridade = function abrirFilaPrioridade() {
        const container = el("priorityQueueList");
        const list = get(OCC_KEY, []).slice().sort((a, b) => {
            const aa = String(a.prioridade || "").toUpperCase() === "ALTA" ? 0 : 1;
            const bb = String(b.prioridade || "").toUpperCase() === "ALTA" ? 0 : 1;
            return aa - bb;
        });

        if (container) {
            container.innerHTML = list.length
                ? list.map(item => occurrenceCard(item, "pro")).join("")
                : `<div class="occurrence-card"><h4>Fila vazia</h4></div>`;
        }

        window.nextScreen("priorityQueueScreen");
    };

    window.abrirRelatorioPlantao = function abrirRelatorioPlantao() {
        const container = el("shiftReportBox");
        const list = get(OCC_KEY, []);
        const atendidas = list.filter(item => item.status === "Atendida").length;

        if (container) {
            container.innerHTML = `
                <div class="occurrence-card">
                    <h4>📊 Relatório do Zeca</h4>
                    <p><strong>Total:</strong> ${list.length}</p>
                    <p><strong>Pendentes:</strong> ${list.length - atendidas}</p>
                    <p><strong>Atendidas:</strong> ${atendidas}</p>
                </div>
                ${list.map(item => occurrenceCard(item, "pro")).join("")}
            `;
        }

        window.nextScreen("shiftReportScreen");
    };

    window.marcarOcorrenciaAtendida = function marcarOcorrenciaAtendida(id) {
        const list = get(OCC_KEY, []);
        const item = list.find(o => String(o.id) === String(id));

        if (item) {
            item.status = "Atendida";
            set(OCC_KEY, list);
            toast("✅ Ocorrência marcada como atendida.");
        }

        window.abrirOcorrenciasPro();
    };

    window.inicializarPainelPro = function inicializarPainelPro() {
        ensureDefaults();

        const zeca = getDefaultUsers().zeca || currentUser();

        setText("proWelcomeName", zeca.nome || zeca.name || "Zeca do Santos");
        setText("proCompanyName", zeca.company || zeca.empresa || "Safe Life Matriz");
        setImg("proAvatar", zeca.foto || zeca.avatar);

        const list = get(OCC_KEY, []);
        setText("statEmergency", list.filter(item => String(item.prioridade || "").toUpperCase() === "ALTA").length);

        window.nextScreen("proDashboard");
    };

    window.renderPerfilProfissional = function renderPerfilProfissional() {
        ensureDefaults();

        const zeca = getDefaultUsers().zeca || currentUser();

        setImg("professionalProfileAvatar", zeca.foto || zeca.avatar);
        setText("professionalProfileName", zeca.nome || zeca.name || "Zeca do Santos");
        setText("professionalProfileCompany", zeca.company || zeca.empresa || "Safe Life Matriz");

        if (el("editProName")) el("editProName").value = zeca.nome || zeca.name || "Zeca do Santos";
        if (el("editProCpf")) el("editProCpf").value = zeca.cpf || "99999999999";
        if (el("editProEmail")) el("editProEmail").value = zeca.email || "zeca.dos.animais@safelife.com";
        if (el("editProCompany")) el("editProCompany").value = zeca.company || zeca.empresa || "Safe Life Matriz";

        window.nextScreen("professionalProfile");
    };

    function renderPets() {
        const container = el("myPetsContainer");
        if (!container) return;

        const user = currentUser() || getDefaultUsers().vitor || {};
        const pets = get(PET_KEY, []).filter(pet => {
            const dono = cleanCpf(pet.donoCpf || pet.ownerCpf);
            return !dono || dono === cleanCpf(user.cpf || "11111111111");
        });

        if (!pets.length) {
            container.innerHTML = `<p class="empty-message">Nenhum pet cadastrado ainda.</p>`;
            return;
        }

        container.innerHTML = pets.map(pet => `
            <div class="occurrence-card pet-card">
                ${pet.foto || pet.photo ? `<img class="pet-card-img" src="${pet.foto || pet.photo}" alt="Foto do pet">` : ""}
                <h4>🐾 ${html(pet.nome || pet.name)}</h4>
                <p><strong>Espécie:</strong> ${html(pet.especie || pet.species || "Animal")}</p>
                <p><strong>Raça:</strong> ${html(pet.raca || pet.breed || "Não informada")}</p>
                <p><strong>Idade:</strong> ${html(pet.idade || pet.age || "Não informada")}</p>
                <p><strong>Local:</strong> ${html(pet.local || pet.location || "Não informado")}</p>
            </div>
        `).join("");
    }

    window.renderPerfilCidadao = function renderPerfilCidadao() {
        ensureDefaults();

        const vitor = currentUser() || getDefaultUsers().vitor || {};

        setImg("profileAvatar", vitor.foto || vitor.avatar);
        setText("citizenProfileName", vitor.nome || vitor.name || "Vitor Chineque");
        setText("citizenProfileType", "Cidadão");
        setText("citizenProfileContact", vitor.email || "vitor.chinequero@safelife.com");

        if (el("editName")) el("editName").value = vitor.nome || vitor.name || "Vitor Chineque";
        if (el("editEmail")) el("editEmail").value = vitor.email || "vitor.chinequero@safelife.com";
        if (el("editPhone")) el("editPhone").value = vitor.telefone || vitor.phone || "";

        renderPets();
        window.nextScreen("citizenProfile");
    };

    window.inicializarPainelAdmin = function inicializarPainelAdmin() {
        ensureDefaults();

        const gustavo = getDefaultUsers().gustavo || currentUser() || {};

        setImg("adminAvatar", gustavo.foto || gustavo.avatar);
        setText("adminWelcomeName", gustavo.nome || gustavo.name || "Gustavo Siri");
        setText("adminCpfText", "CPF: 45317828791");

        const users = get(USERS_KEY, []);
        const occ = get(OCC_KEY, []);

        setText("adminStatUsers", users.length);
        setText("adminStatProfessionals", users.filter(u => u.type === "professional").length);
        setText("adminStatReports", occ.length);
        setText("adminStatSuspicious", users.filter(u => u.ativo === false || !u.email).length);

        window.nextScreen("adminDashboard");
    };

    window.abrirRelatorioAdmin = function abrirRelatorioAdmin() {
        const box = el("adminReportBox");
        const list = get(OCC_KEY, []);

        if (box) {
            box.innerHTML = `
                <div class="occurrence-card">
                    <h4>📊 Relatório do Gustavo</h4>
                    <p><strong>Ocorrências:</strong> ${list.length}</p>
                </div>
                ${list.length ? list.map(item => occurrenceCard(item, "admin")).join("") : `<div class="occurrence-card"><h4>Nenhum chamado ainda</h4></div>`}
            `;
        }

        window.nextScreen("adminReportScreen");
    };

    window.excluirOcorrenciaAdmin = function excluirOcorrenciaAdmin(id) {
        const list = get(OCC_KEY, []).filter(item => String(item.id) !== String(id));
        set(OCC_KEY, list);
        toast("🗑️ Ocorrência removida.");
        window.abrirRelatorioAdmin();
    };

    function injectFunctionalCss() {
        if (el("safeLifeOptionFlowCss")) return;

        const style = document.createElement("style");
        style.id = "safeLifeOptionFlowCss";
        style.textContent = `
            .quick-option-card {
                cursor: pointer;
                transition: .2s ease;
            }

            .quick-option-card.selected,
            .quick-option-card.active {
                border-color: var(--purple-color, #7c3aed) !important;
                box-shadow: 0 0 0 4px rgba(124, 58, 237, .16) !important;
                transform: translateY(-2px);
            }

            .occurrence-full-card {
                overflow: hidden;
            }

            .occurrence-photo-box {
                margin: 14px 0;
                border-radius: 18px;
                overflow: hidden;
                background: #f1f5f9;
            }

            .occurrence-evidence-img {
                width: 100%;
                max-height: 260px;
                object-fit: cover;
                object-position: center;
                display: block;
            }

            .occ-photo-placeholder {
                text-align: center;
                padding: 28px;
                color: #64748b;
                font-weight: 700;
            }

            .reporter-row {
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 12px 0;
            }

            .reporter-avatar {
                width: 54px;
                height: 54px;
                border-radius: 50%;
                object-fit: cover;
                object-position: center;
                border: 3px solid rgba(124, 58, 237, .18);
                flex: 0 0 auto;
            }

            .reporter-avatar.empty {
                display: grid;
                place-items: center;
                background: #ede9fe;
            }

            .pet-card-img {
                width: 100%;
                max-height: 210px;
                object-fit: cover;
                object-position: center;
                border-radius: 18px;
                margin-bottom: 12px;
            }
        `;
        document.head.appendChild(style);
    }

    document.addEventListener("DOMContentLoaded", function () {
        ensureDefaults();
        injectFunctionalCss();

        const citizenForm = el("citizenForm");
        if (citizenForm) citizenForm.onsubmit = window.registrarAcao;

        const anonForm = el("anonForm");
        if (anonForm) anonForm.onsubmit = window.registrarAcaoAnonima;

        const petForm = el("petForm");
        if (petForm) petForm.onsubmit = window.registrarPet;
    });
})();


/* =====================================================
   PATCH FOTOS CERTAS - VITOR / ZECA / GUSTAVO
   Força atualizar as fotos dos usuários padrão.
===================================================== */

(function () {
    const FOTOS_PADRAO_CERTAS = {
        vitor: "img/pequenochinique.jpeg",
        zeca: "img/corredorzeca.jpeg",
        gustavo: "img/apenasumsiri.jpeg"
    };

    function getSafeLifeUsers() {
        try {
            return JSON.parse(localStorage.getItem("safeLifeUsuarios")) || [];
        } catch (e) {
            return [];
        }
    }

    function setSafeLifeUsers(users) {
        localStorage.setItem("safeLifeUsuarios", JSON.stringify(users));
    }

    function cpf(value) {
        return String(value || "").replace(/\D/g, "");
    }

    function atualizarFotosPadraoAgora() {
        let users = getSafeLifeUsers();

        const padroes = [
            {
                id: "cidadao-vitor",
                nome: "Vitor Chineque",
                name: "Vitor Chineque",
                cpf: "11111111111",
                email: "vitor.chinequero@safelife.com",
                type: "citizen",
                role: "citizen",
                foto: FOTOS_PADRAO_CERTAS.vitor,
                avatar: FOTOS_PADRAO_CERTAS.vitor,
                ativo: true
            },
            {
                id: "profissional-zeca",
                nome: "Zeca do Santos",
                name: "Zeca do Santos",
                cpf: "99999999999",
                email: "zeca.dos.animais@safelife.com",
                type: "professional",
                role: "professional",
                company: "Safe Life Matriz",
                empresa: "Safe Life Matriz",
                foto: FOTOS_PADRAO_CERTAS.zeca,
                avatar: FOTOS_PADRAO_CERTAS.zeca,
                ativo: true
            },
            {
                id: "admin-gustavo",
                nome: "Gustavo Siri",
                name: "Gustavo Siri",
                cpf: "45317828791",
                email: "gustavo.siriguejo@safelife.com",
                type: "admin",
                role: "admin",
                foto: FOTOS_PADRAO_CERTAS.gustavo,
                avatar: FOTOS_PADRAO_CERTAS.gustavo,
                ativo: true
            }
        ];

        padroes.forEach(padrao => {
            const index = users.findIndex(user => cpf(user.cpf) === cpf(padrao.cpf));

            if (index >= 0) {
                users[index] = {
                    ...users[index],
                    ...padrao,
                    foto: padrao.foto,
                    avatar: padrao.avatar,
                    ativo: true
                };
            } else {
                users.push({ ...padrao });
            }
        });

        setSafeLifeUsers(users);

        try {
            if (typeof usuarios !== "undefined") {
                usuarios = users;
            }
        } catch (e) {}

        try {
            if (typeof usuarioLogado !== "undefined" && usuarioLogado && usuarioLogado.cpf) {
                const atualizado = users.find(user => cpf(user.cpf) === cpf(usuarioLogado.cpf));
                if (atualizado) {
                    usuarioLogado = atualizado;
                    localStorage.setItem("safeLifeLoggedUser", JSON.stringify(atualizado));
                }
            }
        } catch (e) {}
    }

    document.addEventListener("DOMContentLoaded", atualizarFotosPadraoAgora);
    window.atualizarFotosPadraoAgora = atualizarFotosPadraoAgora;
})();


/* =====================================================
   PATCH FINAL PRO + ADMIN + SEM DELAY
   - Profissional conclui ocorrência
   - Sai da fila profissional
   - Aparece no perfil do cidadão como concluída
   - Admin funciona: empresas, profissionais, usuários, relatórios
   - Remove delay/travadas visuais
===================================================== */

(function () {
    const USERS_KEY = "safeLifeUsuarios";
    const OCC_KEY = "safeLifeOcorrencias";
    const PET_KEY = "safeLifePets";
    const EMP_KEY = "safeLifeEmpresas";
    const HISTORY_KEY = "safeLifeHistoricoOcorrencias";
    const LOGGED_KEY = "safeLifeLoggedUser";

    function get(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw) ?? fallback;
        } catch (e) {
            return fallback;
        }
    }

    function set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function cpf(value) {
        return String(value || "").replace(/\D/g, "");
    }

    function el(id) {
        return document.getElementById(id);
    }

    function val(id) {
        const campo = el(id);
        return campo ? String(campo.value || "").trim() : "";
    }

    function setText(id, value) {
        const campo = el(id);
        if (campo) campo.textContent = value;
    }

    function setImg(id, src) {
        const campo = el(id);
        if (campo && src) campo.src = src;
    }

    function esc(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function toast(msg) {
        if (typeof window.triggerToast === "function") {
            window.triggerToast(msg);
        } else {
            alert(msg);
        }
    }

    function allOccurrences() {
        return get(OCC_KEY, []);
    }

    function saveOccurrences(list) {
        set(OCC_KEY, list);
        try {
            dbOcorrencias = list;
        } catch (e) {
            window.dbOcorrencias = list;
        }
    }

    function history() {
        return get(HISTORY_KEY, []);
    }

    function saveHistory(list) {
        set(HISTORY_KEY, list);
    }

    function companies() {
        return get(EMP_KEY, [
            { id: "empresa-matriz", nome: "Safe Life Matriz", ativo: true },
            { id: "ong-patas", nome: "ONG Patas Livres", ativo: true },
            { id: "ccz", nome: "Centro de Controle de Zoonoses", ativo: true }
        ]);
    }

    function saveCompanies(list) {
        set(EMP_KEY, list);
        try {
            empresasCadastradas = list;
        } catch (e) {
            window.empresasCadastradas = list;
        }
    }

    function users() {
        return get(USERS_KEY, []);
    }

    function saveUsers(list) {
        set(USERS_KEY, list);
        try {
            usuarios = list;
        } catch (e) {
            window.usuarios = list;
        }
    }

    function currentUser() {
        try {
            if (typeof usuarioLogado !== "undefined" && usuarioLogado && usuarioLogado.cpf) {
                return usuarioLogado;
            }
        } catch (e) {}

        const saved = get(LOGGED_KEY, null);
        if (saved && saved.cpf) return saved;

        return users().find(u => cpf(u.cpf) === "11111111111") || null;
    }

    function getVitor() {
        return users().find(u => cpf(u.cpf) === "11111111111") || currentUser() || {};
    }

    function getZeca() {
        return users().find(u => cpf(u.cpf) === "99999999999") || {};
    }

    function getGustavo() {
        return users().find(u => cpf(u.cpf) === "45317828791") || {};
    }

    function ensureStorage() {
        if (!localStorage.getItem(OCC_KEY)) set(OCC_KEY, []);
        if (!localStorage.getItem(PET_KEY)) set(PET_KEY, []);
        if (!localStorage.getItem(HISTORY_KEY)) set(HISTORY_KEY, []);
        if (!localStorage.getItem(EMP_KEY)) saveCompanies(companies());

        if (typeof window.atualizarFotosPadraoAgora === "function") {
            try { window.atualizarFotosPadraoAgora(); } catch (e) {}
        }
    }

    function getOccPhoto(item) {
        return item.fotoOcorrencia || item.fotoEvidencia || item.occurrencePhoto || item.evidencePhoto || item.foto || "";
    }

    function getReporterPhoto(item) {
        return item.fotoSolicitante || item.foto_usuario || item.reporterPhoto || "";
    }

    function reporterBlock(item) {
        const foto = getReporterPhoto(item);
        const nome = item.citizenName || item.nome_usuario || item.reporterName || item.solicitante || "Vitor Chineque";

        return `
            <div class="reporter-row">
                ${foto ? `<img class="reporter-avatar" src="${foto}" alt="Foto do cidadão">` : `<div class="reporter-avatar empty">👤</div>`}
                <div>
                    <strong>${esc(nome)}</strong>
                    <small>${item.anonima ? "Denúncia anônima" : `CPF: ${esc(item.citizenCpf || item.cpf_usuario || "11111111111")}`}</small>
                </div>
            </div>
        `;
    }

    function occurrencePhotoBlock(item) {
        const foto = getOccPhoto(item);

        if (!foto) {
            return `<div class="occ-photo-placeholder">📷 Sem foto enviada</div>`;
        }

        return `<img class="occurrence-evidence-img" src="${foto}" alt="Foto da ocorrência">`;
    }

    function occurrenceCard(item, mode) {
        const option = item.opcaoEscolhida || item.opcao_escolhida || item.assunto || item.optionTitle || "Opção não informada";
        const desc = item.detalhes || item.descricao || item.description || "Sem descrição";
        const address = item.localizacao || item.endereco_completo || item.endereco || item.address || item.local || "Sem endereço";
        const tipo = item.tipo || item.type || "Ocorrência";
        const status = item.status || "Pendente";

        return `
            <article class="occurrence-card occurrence-full-card ${status === "Concluída" || status === "Atendida" ? "completed-occurrence" : ""}">
                <div class="occurrence-header">
                    <div>
                        <h4>${esc(tipo)}</h4>
                        <small>${esc(item.createdAt || item.timestamp || "")}</small>
                    </div>
                    <span class="status-badge ${status === "Concluída" || status === "Atendida" ? "success-badge" : ""}">
                        ${esc(status)}
                    </span>
                </div>

                ${reporterBlock(item)}

                <div class="occurrence-photo-box">
                    ${occurrencePhotoBlock(item)}
                </div>

                <p><strong>Opção marcada:</strong> ${esc(option)}</p>
                <p><strong>Descrição:</strong> ${esc(desc)}</p>
                <p><strong>Endereço:</strong> ${esc(address)}</p>
                <p><strong>Prioridade:</strong> ${esc(item.prioridade || "NORMAL")}</p>

                ${mode === "pro" ? `
                    <button class="btn small-btn" type="button" onclick="concluirOcorrenciaProfissional('${item.id}')">
                        ✅ Concluir / atendimento feito
                    </button>
                ` : ""}

                ${mode === "admin" ? `
                    <button class="btn secondary-btn small-btn" type="button" onclick="excluirOcorrenciaAdmin('${item.id}')">
                        🗑️ Excluir
                    </button>
                ` : ""}
            </article>
        `;
    }

    function renderEmpty(container, title, text) {
        if (!container) return;
        container.innerHTML = `
            <div class="occurrence-card">
                <h4>${title}</h4>
                <p>${text}</p>
            </div>
        `;
    }

    function pendingOccurrences() {
        return allOccurrences().filter(item => {
            const status = String(item.status || "Pendente").toLowerCase();
            return !status.includes("conclu") && !status.includes("atendida") && !status.includes("finalizada");
        });
    }

    function completedOccurrencesForCitizen(userCpf) {
        const clean = cpf(userCpf || "11111111111");

        return history().filter(item => {
            const occCpf = cpf(item.citizenCpf || item.cpf_usuario || item.reporterCpf);
            return !occCpf || occCpf === clean;
        });
    }

    // Remove delays e scroll smooth lento
    const originalNextScreen = window.nextScreen;
    window.nextScreen = function nextScreenFast(screenId) {
        document.querySelectorAll(".screen").forEach(screen => {
            screen.classList.remove("active");
        });

        const target = el(screenId);

        if (!target) {
            console.error("Tela não encontrada:", screenId);
            return;
        }

        target.classList.add("active");

        try {
            window.scrollTo(0, 0);
        } catch (e) {}

        if (screenId === "citizenProfile") {
            setTimeout(() => {
                if (typeof window.renderizarHistoricoCidadao === "function") window.renderizarHistoricoCidadao();
            }, 0);
        }
    };

    window.concluirOcorrenciaProfissional = function concluirOcorrenciaProfissional(idOcorrencia) {
        const list = allOccurrences();
        const index = list.findIndex(item => String(item.id) === String(idOcorrencia));

        if (index === -1) {
            toast("Ocorrência não encontrada.");
            return;
        }

        const zeca = getZeca();
        const item = list[index];

        const concluida = {
            ...item,
            status: "Concluída",
            statusProfissional: "Atendimento feito pelo profissional",
            profissionalNome: zeca.nome || zeca.name || "Zeca do Santos",
            profissionalCpf: zeca.cpf || "99999999999",
            empresaProfissional: zeca.company || zeca.empresa || "Safe Life Matriz",
            concluidaEm: new Date().toLocaleString("pt-BR"),
            completedAt: new Date().toLocaleString("pt-BR")
        };

        list.splice(index, 1);
        saveOccurrences(list);

        const hist = history();
        hist.unshift(concluida);
        saveHistory(hist);

        toast("✅ Ocorrência concluída. Ela saiu da fila do profissional e foi para o histórico do cidadão.");

        window.abrirOcorrenciasPro();
    };

    window.marcarOcorrenciaAtendida = window.concluirOcorrenciaProfissional;

    window.abrirOcorrenciasPro = function abrirOcorrenciasPro() {
        const container = el("listaIntegradaPro");
        const list = pendingOccurrences();

        if (container) {
            if (!list.length) {
                renderEmpty(
                    container,
                    "Nenhum chamado pendente",
                    "Quando o cidadão enviar uma denúncia/resgate, ela aparece aqui. Ocorrências concluídas saem desta fila."
                );
            } else {
                container.innerHTML = list.map(item => occurrenceCard(item, "pro")).join("");
            }
        }

        window.nextScreen("proListScreen");
    };

    window.renderizarOcorrenciasProfissional = function renderizarOcorrenciasProfissional() {
        const container = el("listaIntegradaPro");
        const list = pendingOccurrences();

        if (container) {
            container.innerHTML = list.length
                ? list.map(item => occurrenceCard(item, "pro")).join("")
                : `<div class="occurrence-card"><h4>Nenhum chamado pendente</h4><p>Fila limpa.</p></div>`;
        }
    };

    window.abrirOcorrenciaMaisProxima = function abrirOcorrenciaMaisProxima() {
        const container = el("nearestOccurrenceBox");
        const list = pendingOccurrences();

        if (container) {
            container.innerHTML = list.length
                ? occurrenceCard(list[0], "pro")
                : `<div class="occurrence-card"><h4>Nenhuma ocorrência próxima</h4><p>A fila está limpa.</p></div>`;
        }

        window.nextScreen("nearestOccurrenceScreen");
    };

    window.abrirFilaPrioridade = function abrirFilaPrioridade() {
        const container = el("priorityQueueList");
        const list = pendingOccurrences().slice().sort((a, b) => {
            const aa = String(a.prioridade || "").toUpperCase() === "ALTA" ? 0 : 1;
            const bb = String(b.prioridade || "").toUpperCase() === "ALTA" ? 0 : 1;
            return aa - bb;
        });

        if (container) {
            container.innerHTML = list.length
                ? list.map(item => occurrenceCard(item, "pro")).join("")
                : `<div class="occurrence-card"><h4>Fila vazia</h4><p>Nenhuma ocorrência pendente.</p></div>`;
        }

        window.nextScreen("priorityQueueScreen");
    };

    window.abrirRelatorioPlantao = function abrirRelatorioPlantao() {
        const container = el("shiftReportBox");
        const pendentes = pendingOccurrences();
        const concluidas = history();

        if (container) {
            container.innerHTML = `
                <div class="occurrence-card">
                    <h4>📊 Relatório do plantão</h4>
                    <p><strong>Pendentes:</strong> ${pendentes.length}</p>
                    <p><strong>Concluídas:</strong> ${concluidas.length}</p>
                    <p><strong>Profissional:</strong> Zeca do Santos</p>
                </div>
                ${pendentes.length ? pendentes.map(item => occurrenceCard(item, "pro")).join("") : `<div class="occurrence-card"><h4>Sem pendências</h4></div>`}
            `;
        }

        window.nextScreen("shiftReportScreen");
    };

    window.inicializarPainelPro = function inicializarPainelPro() {
        ensureStorage();

        const zeca = getZeca();

        setText("proWelcomeName", zeca.nome || zeca.name || "Zeca do Santos");
        setText("proCompanyName", zeca.company || zeca.empresa || "Safe Life Matriz");
        setImg("proAvatar", zeca.foto || zeca.avatar);

        const pendentes = pendingOccurrences();
        setText("statEmergency", pendentes.filter(item => String(item.prioridade || "").toUpperCase() === "ALTA").length);

        window.nextScreen("proDashboard");
    };

    function completedHistoryCard(item) {
        const option = item.opcaoEscolhida || item.assunto || item.optionTitle || "Ocorrência";
        const desc = item.detalhes || item.descricao || item.description || "Sem descrição";
        const address = item.localizacao || item.endereco || item.address || "Sem endereço";

        return `
            <div class="occurrence-card completed-occurrence">
                <div class="occurrence-header">
                    <h4>✅ ${esc(option)}</h4>
                    <span class="status-badge success-badge">Concluída</span>
                </div>

                <p><strong>Descrição:</strong> ${esc(desc)}</p>
                <p><strong>Endereço:</strong> ${esc(address)}</p>
                <p><strong>Profissional:</strong> ${esc(item.profissionalNome || "Zeca do Santos")}</p>
                <p><strong>Empresa:</strong> ${esc(item.empresaProfissional || "Safe Life Matriz")}</p>
                <small>Concluída em: ${esc(item.concluidaEm || item.completedAt || "")}</small>

                <div class="occurrence-photo-box">
                    ${occurrencePhotoBlock(item)}
                </div>
            </div>
        `;
    }

    window.renderizarHistoricoCidadao = function renderizarHistoricoCidadao() {
        const user = currentUser() || getVitor();
        const clean = cpf(user.cpf || "11111111111");

        const containers = [
            "citizenHistoryContainer",
            "completedOccurrencesContainer",
            "historyOccurrencesContainer",
            "myOccurrencesContainer",
            "citizenCompletedList",
            "myPetsContainer"
        ];

        const concluidas = completedOccurrencesForCitizen(clean);

        let target = null;

        // Preferir container próprio, mas se o HTML não tiver, coloca abaixo dos pets no perfil.
        for (const idName of containers) {
            const c = el(idName);
            if (c) {
                target = c;
                break;
            }
        }

        if (!target) return;

        const petsHtml = renderPetsHtml(user);

        const historyHtml = concluidas.length
            ? concluidas.map(completedHistoryCard).join("")
            : `<p class="empty-message">Nenhuma ocorrência concluída ainda.</p>`;

        target.innerHTML = `
            <div class="safe-life-profile-block">
                <h4>🐾 Meus Pets</h4>
                ${petsHtml}
            </div>

            <div class="safe-life-profile-block">
                <h4>✅ Ocorrências concluídas</h4>
                ${historyHtml}
            </div>
        `;
    };

    function renderPetsHtml(user) {
        const clean = cpf(user.cpf || "11111111111");
        const pets = get(PET_KEY, []).filter(pet => {
            const dono = cpf(pet.donoCpf || pet.ownerCpf);
            return !dono || dono === clean;
        });

        if (!pets.length) {
            return `<p class="empty-message">Nenhum pet cadastrado ainda.</p>`;
        }

        return pets.map(pet => `
            <div class="occurrence-card pet-card">
                ${pet.foto || pet.photo ? `<img class="pet-card-img" src="${pet.foto || pet.photo}" alt="Foto do pet">` : ""}
                <h4>${esc(pet.nome || pet.name || "Pet")}</h4>
                <p><strong>Espécie:</strong> ${esc(pet.especie || pet.species || "Animal")}</p>
                <p><strong>Raça:</strong> ${esc(pet.raca || pet.breed || "Não informada")}</p>
                <p><strong>Idade:</strong> ${esc(pet.idade || pet.age || "Não informada")}</p>
                <p><strong>Local:</strong> ${esc(pet.local || pet.location || "Não informado")}</p>
            </div>
        `).join("");
    }

    const oldRenderPerfilCidadao = window.renderPerfilCidadao;
    window.renderPerfilCidadao = function renderPerfilCidadaoFinal() {
        ensureStorage();

        const vitor = currentUser() || getVitor();

        setImg("profileAvatar", vitor.foto || vitor.avatar);
        setText("citizenProfileName", vitor.nome || vitor.name || "Vitor Chineque");
        setText("citizenProfileType", "Cidadão");
        setText("citizenProfileContact", vitor.email || "vitor.chinequero@safelife.com");

        if (el("editName")) el("editName").value = vitor.nome || vitor.name || "Vitor Chineque";
        if (el("editEmail")) el("editEmail").value = vitor.email || "vitor.chinequero@safelife.com";
        if (el("editPhone")) el("editPhone").value = vitor.telefone || vitor.phone || "";

        window.nextScreen("citizenProfile");

        setTimeout(window.renderizarHistoricoCidadao, 0);
    };

    // ADMIN
    function userCard(user) {
        return `
            <div class="occurrence-card">
                <div class="reporter-row">
                    ${user.foto || user.avatar ? `<img class="reporter-avatar" src="${user.foto || user.avatar}" alt="Foto do usuário">` : `<div class="reporter-avatar empty">👤</div>`}
                    <div>
                        <h4>${esc(user.nome || user.name || "Usuário")}</h4>
                        <small>${esc(user.type || "conta")}</small>
                    </div>
                </div>

                <p><strong>CPF:</strong> ${esc(user.cpf)}</p>
                <p><strong>E-mail:</strong> ${esc(user.email || "Não informado")}</p>
                <p><strong>Status:</strong> ${user.ativo === false ? "Bloqueado" : "Ativo"}</p>

                <button class="btn secondary-btn small-btn" onclick="alternarUsuarioAdminFinal('${user.cpf}')" type="button">
                    ${user.ativo === false ? "Ativar" : "Bloquear"}
                </button>
            </div>
        `;
    }

    window.abrirGerenciarUsuarios = function abrirGerenciarUsuariosFinal() {
        const container = el("adminUsersList");
        const list = users();

        if (container) {
            container.innerHTML = list.length
                ? list.map(userCard).join("")
                : `<div class="occurrence-card"><h4>Nenhum usuário cadastrado</h4></div>`;
        }

        window.nextScreen("adminUsersScreen");
    };

    window.alternarUsuarioAdminFinal = function alternarUsuarioAdminFinal(userCpf) {
        const clean = cpf(userCpf);

        if (["11111111111", "99999999999", "45317828791"].includes(clean)) {
            toast("Usuário padrão não pode ser bloqueado.");
            return;
        }

        const list = users();
        const user = list.find(item => cpf(item.cpf) === clean);

        if (user) {
            user.ativo = user.ativo === false;
            saveUsers(list);
            toast("Status atualizado.");
        }

        window.abrirGerenciarUsuarios();
    };

    window.abrirCadastroEmpresa = function abrirCadastroEmpresaFinal() {
        window.nextScreen("adminCompanyCreateScreen");
    };

    window.cadastrarEmpresaAdmin = function cadastrarEmpresaAdminFinal(event) {
        if (event && event.preventDefault) event.preventDefault();

        const nome = val("adminCompanyName");
        const tipo = val("adminCompanyType");
        const cnpj = val("adminCompanyCnpj");
        const telefone = val("adminCompanyPhone");
        const email = val("adminCompanyEmail");
        const endereco = val("adminCompanyAddress");

        if (!nome) {
            toast("Digite o nome da empresa.");
            return;
        }

        const list = companies();

        list.push({
            id: Date.now().toString(),
            nome,
            tipo,
            cnpj,
            telefone,
            email,
            endereco,
            ativo: true,
            criadaEm: new Date().toLocaleString("pt-BR")
        });

        saveCompanies(list);

        ["adminCompanyName", "adminCompanyCnpj", "adminCompanyPhone", "adminCompanyEmail", "adminCompanyAddress"].forEach(idName => {
            const campo = el(idName);
            if (campo) campo.value = "";
        });

        toast("🏢 Empresa cadastrada com sucesso.");
        window.abrirEmpresasAdmin();
    };

    window.abrirEmpresasAdmin = function abrirEmpresasAdminFinal() {
        const container = el("adminCompaniesList");
        const list = companies();

        if (container) {
            container.innerHTML = list.length
                ? list.map(company => `
                    <div class="occurrence-card">
                        <h4>🏢 ${esc(company.nome)}</h4>
                        <p><strong>Tipo:</strong> ${esc(company.tipo || "Parceira")}</p>
                        <p><strong>CNPJ:</strong> ${esc(company.cnpj || "Não informado")}</p>
                        <p><strong>Telefone:</strong> ${esc(company.telefone || "Não informado")}</p>
                        <p><strong>E-mail:</strong> ${esc(company.email || "Não informado")}</p>
                        <p><strong>Endereço:</strong> ${esc(company.endereco || "Não informado")}</p>
                    </div>
                `).join("")
                : `<div class="occurrence-card"><h4>Nenhuma empresa cadastrada</h4></div>`;
        }

        window.nextScreen("adminCompaniesScreen");
    };

    window.abrirCadastroProfissionalAdmin = function abrirCadastroProfissionalAdminFinal() {
        renderCompanySelectsFast();
        window.nextScreen("adminProfessionalCreateScreen");
    };

    function renderCompanySelectsFast() {
        const list = companies().filter(c => c.ativo !== false);
        ["adminProCompany", "regCompany", "loginCompany", "editProCompany"].forEach(idName => {
            const select = el(idName);
            if (!select) return;

            const current = select.value || "Safe Life Matriz";
            select.innerHTML = "";

            list.forEach(company => {
                const option = document.createElement("option");
                option.value = company.nome;
                option.textContent = company.nome;
                select.appendChild(option);
            });

            if (list.some(c => c.nome === current)) select.value = current;
        });
    }

    window.renderizarSelectEmpresas = renderCompanySelectsFast;

    window.cadastrarProfissionalAdmin = function cadastrarProfissionalAdminFinal(event) {
        if (event && event.preventDefault) event.preventDefault();

        const nome = val("adminProName");
        const proCpf = cpf(val("adminProCpf"));
        const email = val("adminProEmail");
        const phone = val("adminProPhone");
        const company = val("adminProCompany") || "Safe Life Matriz";
        const role = val("adminProRole") || "Agente Operacional";
        const specialty = val("adminProSpecialty") || "";
        const region = val("adminProRegion") || "";
        const vehicle = val("adminProVehicle") || "";
        const status = val("adminProShiftStatus") || "Disponível";
        const team = val("adminProTeam") || "";

        if (!nome || proCpf.length !== 11 || !email) {
            toast("Preencha nome, CPF com 11 números e e-mail.");
            return;
        }

        const list = users();

        if (list.some(user => cpf(user.cpf) === proCpf)) {
            toast("CPF já cadastrado.");
            return;
        }

        list.push({
            id: Date.now().toString(),
            nome,
            name: nome,
            cpf: proCpf,
            email,
            telefone: phone,
            phone,
            type: "professional",
            role: "professional",
            company,
            empresa: company,
            funcao: role,
            cargo: role,
            especialidade: specialty,
            regiao: region,
            veiculo: vehicle,
            status,
            equipe: team,
            ativo: true,
            criadoEm: new Date().toLocaleString("pt-BR")
        });

        saveUsers(list);

        ["adminProName", "adminProCpf", "adminProEmail", "adminProPhone", "adminProSpecialty", "adminProRegion", "adminProVehicle", "adminProTeam"].forEach(idName => {
            const campo = el(idName);
            if (campo) campo.value = "";
        });

        toast("👷 Profissional cadastrado com sucesso.");
        window.abrirGerenciarUsuarios();
    };

    window.abrirContasSuspeitas = function abrirContasSuspeitasFinal() {
        const container = el("adminSuspiciousList");
        const list = users().filter(user => user.ativo === false || !user.email || !user.telefone);

        if (container) {
            container.innerHTML = list.length
                ? list.map(user => `
                    <div class="occurrence-card">
                        <h4>${esc(user.nome || user.name || "Usuário")}</h4>
                        <p><strong>CPF:</strong> ${esc(user.cpf)}</p>
                        <p><strong>Motivo:</strong> ${user.ativo === false ? "Conta bloqueada" : "Cadastro incompleto"}</p>
                    </div>
                `).join("")
                : `<div class="occurrence-card"><h4>Nenhuma conta suspeita</h4></div>`;
        }

        window.nextScreen("adminSuspiciousScreen");
    };

    window.abrirRelatorioAdmin = function abrirRelatorioAdminFinal() {
        const box = el("adminReportBox");
        const pendentes = pendingOccurrences();
        const concluidas = history();
        const listUsers = users();
        const listCompanies = companies();

        if (box) {
            box.innerHTML = `
                <div class="occurrence-card">
                    <h4>📊 Relatório Geral do Gustavo</h4>
                    <p><strong>Usuários:</strong> ${listUsers.length}</p>
                    <p><strong>Profissionais:</strong> ${listUsers.filter(user => user.type === "professional").length}</p>
                    <p><strong>Empresas:</strong> ${listCompanies.length}</p>
                    <p><strong>Ocorrências pendentes:</strong> ${pendentes.length}</p>
                    <p><strong>Ocorrências concluídas:</strong> ${concluidas.length}</p>
                </div>

                <h3>Chamados Pendentes</h3>
                ${pendentes.length ? pendentes.map(item => occurrenceCard(item, "admin")).join("") : `<div class="occurrence-card"><h4>Nenhum chamado pendente</h4></div>`}

                <h3>Chamados Concluídos</h3>
                ${concluidas.length ? concluidas.map(completedHistoryCard).join("") : `<div class="occurrence-card"><h4>Nenhum chamado concluído</h4></div>`}
            `;
        }

        window.nextScreen("adminReportScreen");
    };

    window.abrirAuditoriaAdmin = function abrirAuditoriaAdminFinal() {
        const container = el("adminAuditList");

        if (container) {
            container.innerHTML = `
                <div class="occurrence-card">
                    <h4>📜 Auditoria Local</h4>
                    <p><strong>Última atualização:</strong> ${new Date().toLocaleString("pt-BR")}</p>
                    <p><strong>Pendentes:</strong> ${pendingOccurrences().length}</p>
                    <p><strong>Concluídas:</strong> ${history().length}</p>
                    <p><strong>Empresas:</strong> ${companies().length}</p>
                    <p><strong>Usuários:</strong> ${users().length}</p>
                </div>
            `;
        }

        window.nextScreen("adminAuditScreen");
    };

    window.inicializarPainelAdmin = function inicializarPainelAdminFinal() {
        ensureStorage();

        const gustavo = getGustavo();

        setImg("adminAvatar", gustavo.foto || gustavo.avatar);
        setText("adminWelcomeName", gustavo.nome || gustavo.name || "Gustavo Siri");
        setText("adminCpfText", "CPF: 45317828791");

        const listUsers = users();
        const pendentes = pendingOccurrences();

        setText("adminStatUsers", listUsers.length);
        setText("adminStatProfessionals", listUsers.filter(user => user.type === "professional").length);
        setText("adminStatReports", pendentes.length + history().length);
        setText("adminStatSuspicious", listUsers.filter(user => user.ativo === false || !user.email).length);

        renderCompanySelectsFast();

        window.nextScreen("adminDashboard");
    };

    // Corrigir forms admin que usam onclick e não submit
    document.addEventListener("DOMContentLoaded", function () {
        ensureStorage();
        renderCompanySelectsFast();
        injectFinalCss();

        // Tira animações pesadas e delays
        document.documentElement.classList.add("safe-life-no-delay");

        const companyButton = document.querySelector('[onclick="cadastrarEmpresaAdmin()"]');
        if (companyButton) {
            companyButton.onclick = window.cadastrarEmpresaAdmin;
        }

        const proButton = document.querySelector('[onclick="cadastrarProfissionalAdmin()"]');
        if (proButton) {
            proButton.onclick = window.cadastrarProfissionalAdmin;
        }
    });

    function injectFinalCss() {
        if (el("safeLifeFinalProAdminCss")) return;

        const style = document.createElement("style");
        style.id = "safeLifeFinalProAdminCss";
        style.textContent = `
            .safe-life-no-delay *,
            .safe-life-no-delay *::before,
            .safe-life-no-delay *::after {
                scroll-behavior: auto !important;
            }

            .occurrence-full-card {
                overflow: hidden;
            }

            .completed-occurrence {
                border-color: rgba(16, 185, 129, .35) !important;
                background: linear-gradient(180deg, #ffffff, #ecfdf5) !important;
            }

            .success-badge {
                background: rgba(16, 185, 129, .14) !important;
                color: #047857 !important;
            }

            .safe-life-profile-block {
                margin-top: 16px;
            }

            .occurrence-photo-box {
                margin: 14px 0;
                border-radius: 18px;
                overflow: hidden;
                background: #f1f5f9;
            }

            .occurrence-evidence-img {
                width: 100%;
                max-height: 260px;
                object-fit: cover;
                object-position: center;
                display: block;
            }

            .occ-photo-placeholder {
                text-align: center;
                padding: 28px;
                color: #64748b;
                font-weight: 700;
            }

            .reporter-row {
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 12px 0;
            }

            .reporter-avatar {
                width: 54px;
                height: 54px;
                border-radius: 50%;
                object-fit: cover;
                object-position: center;
                border: 3px solid rgba(124, 58, 237, .18);
                flex: 0 0 auto;
            }

            .reporter-avatar.empty {
                display: grid;
                place-items: center;
                background: #ede9fe;
            }

            .pet-card-img {
                width: 100%;
                max-height: 210px;
                object-fit: cover;
                object-position: center;
                border-radius: 18px;
                margin-bottom: 12px;
            }
        `;
        document.head.appendChild(style);
    }
})();


/* =====================================================
   PATCH FINAL - AGENTES ATIVOS + NOTIFICAÇÃO + PERFIL LIMPO
   - Agentes ativos funciona no painel profissional
   - Perfil cidadão não duplica Meus Pets
   - Ocorrência concluída aparece como notificação no perfil do cidadão
   - Confirmação de envio fica simples para a população entender
===================================================== */

(function () {
    const USERS_KEY = "safeLifeUsuarios";
    const OCC_KEY = "safeLifeOcorrencias";
    const PET_KEY = "safeLifePets";
    const HISTORY_KEY = "safeLifeHistoricoOcorrencias";
    const NOTIF_KEY = "safeLifeNotificacoes";

    function get(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw) ?? fallback;
        } catch (e) {
            return fallback;
        }
    }

    function set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function cpf(value) {
        return String(value || "").replace(/\D/g, "");
    }

    function el(id) {
        return document.getElementById(id);
    }

    function esc(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function toast(msg) {
        if (typeof window.triggerToast === "function") window.triggerToast(msg);
        else alert(msg);
    }

    function users() {
        return get(USERS_KEY, []);
    }

    function occurrences() {
        return get(OCC_KEY, []);
    }

    function history() {
        return get(HISTORY_KEY, []);
    }

    function pets() {
        return get(PET_KEY, []);
    }

    function notifications() {
        return get(NOTIF_KEY, []);
    }

    function setOccurrences(list) {
        set(OCC_KEY, list);
        try { dbOcorrencias = list; } catch (e) { window.dbOcorrencias = list; }
    }

    function setHistory(list) {
        set(HISTORY_KEY, list);
    }

    function setNotifications(list) {
        set(NOTIF_KEY, list);
    }

    function getVitor() {
        return users().find(user => cpf(user.cpf) === "11111111111") || {};
    }

    function getZeca() {
        return users().find(user => cpf(user.cpf) === "99999999999") || {};
    }

    function getCurrentCitizenCpf() {
        try {
            if (typeof usuarioLogado !== "undefined" && usuarioLogado && usuarioLogado.cpf) {
                return cpf(usuarioLogado.cpf);
            }
        } catch (e) {}

        const saved = get("safeLifeLoggedUser", null);
        if (saved && saved.cpf) return cpf(saved.cpf);

        return "11111111111";
    }

    function getOccTitle(item) {
        return item.opcaoEscolhida || item.opcao_escolhida || item.assunto || item.optionTitle || item.tipo || item.type || "Ocorrência";
    }

    function getOccDesc(item) {
        return item.detalhes || item.descricao || item.description || "Sem descrição";
    }

    function getOccAddress(item) {
        return item.localizacao || item.endereco_completo || item.endereco || item.address || item.local || "Sem endereço";
    }

    function getOccPhoto(item) {
        return item.fotoOcorrencia || item.fotoEvidencia || item.occurrencePhoto || item.evidencePhoto || item.foto || "";
    }

    function getReporterPhoto(item) {
        return item.fotoSolicitante || item.foto_usuario || item.reporterPhoto || "";
    }

    function notificationCard(item) {
        return `
            <div class="safe-notification-card">
                <div class="safe-notification-icon">✅</div>
                <div>
                    <strong>Sua ocorrência foi concluída</strong>
                    <p>
                        O profissional <b>${esc(item.profissionalNome || "Zeca do Santos")}</b>
                        concluiu o atendimento de <b>${esc(getOccTitle(item))}</b>.
                    </p>
                    <small>${esc(item.concluidaEm || item.completedAt || "")}</small>
                </div>
            </div>
        `;
    }

    function completedCard(item) {
        const foto = getOccPhoto(item);

        return `
            <div class="occurrence-card completed-occurrence">
                <div class="occurrence-header">
                    <h4>✅ ${esc(getOccTitle(item))}</h4>
                    <span class="status-badge success-badge">Concluída</span>
                </div>

                <p><strong>Descrição:</strong> ${esc(getOccDesc(item))}</p>
                <p><strong>Endereço:</strong> ${esc(getOccAddress(item))}</p>
                <p><strong>Profissional:</strong> ${esc(item.profissionalNome || "Zeca do Santos")}</p>
                <p><strong>Empresa:</strong> ${esc(item.empresaProfissional || "Safe Life Matriz")}</p>

                ${foto ? `
                    <div class="occurrence-photo-box">
                        <img class="occurrence-evidence-img" src="${foto}" alt="Foto da ocorrência">
                    </div>
                ` : ""}

                <small>Concluída em: ${esc(item.concluidaEm || item.completedAt || "")}</small>
            </div>
        `;
    }

    function petCard(pet) {
        return `
            <div class="occurrence-card pet-card">
                ${pet.foto || pet.photo ? `<img class="pet-card-img" src="${pet.foto || pet.photo}" alt="Foto do pet">` : ""}
                <h4>🐾 ${esc(pet.nome || pet.name || "Pet")}</h4>
                <p><strong>Espécie:</strong> ${esc(pet.especie || pet.species || "Animal")}</p>
                <p><strong>Raça:</strong> ${esc(pet.raca || pet.breed || "Não informada")}</p>
                <p><strong>Idade:</strong> ${esc(pet.idade || pet.age || "Não informada")}</p>
                <p><strong>Local:</strong> ${esc(pet.local || pet.location || "Não informado")}</p>
            </div>
        `;
    }

    function renderCitizenProfileClean() {
        const profileContainer = el("myPetsContainer");
        if (!profileContainer) return;

        const citizenCpf = getCurrentCitizenCpf();
        const userPets = pets().filter(pet => {
            const owner = cpf(pet.donoCpf || pet.ownerCpf);
            return !owner || owner === citizenCpf;
        });

        const completed = history().filter(item => {
            const occCpf = cpf(item.citizenCpf || item.cpf_usuario || item.reporterCpf);
            return !occCpf || occCpf === citizenCpf;
        });

        const notifs = notifications().filter(item => {
            const nCpf = cpf(item.citizenCpf);
            return !nCpf || nCpf === citizenCpf;
        });

        profileContainer.innerHTML = `
            <div class="safe-profile-section">
                <h4>🔔 Notificações</h4>
                ${
                    notifs.length
                        ? notifs.map(notificationCard).join("")
                        : `<p class="empty-message">Nenhuma notificação ainda.</p>`
                }
            </div>

            <div class="safe-profile-section">
                <h4>🐾 Meus Pets</h4>
                ${
                    userPets.length
                        ? userPets.map(petCard).join("")
                        : `<p class="empty-message">Nenhum pet cadastrado ainda.</p>`
                }
            </div>

            <div class="safe-profile-section">
                <h4>✅ Ocorrências realizadas</h4>
                ${
                    completed.length
                        ? completed.map(completedCard).join("")
                        : `<p class="empty-message">Nenhuma ocorrência concluída ainda.</p>`
                }
            </div>
        `;
    }

    const oldRenderPerfilCidadao = window.renderPerfilCidadao;
    window.renderPerfilCidadao = function renderPerfilCidadaoSemDuplicar() {
        const vitor = getVitor();

        if (el("profileAvatar")) el("profileAvatar").src = vitor.foto || vitor.avatar || el("profileAvatar").src;
        if (el("citizenProfileName")) el("citizenProfileName").textContent = vitor.nome || vitor.name || "Vitor Chineque";
        if (el("citizenProfileType")) el("citizenProfileType").textContent = "Cidadão";
        if (el("citizenProfileContact")) el("citizenProfileContact").textContent = vitor.email || "vitor.chinequero@safelife.com";

        if (el("editName")) el("editName").value = vitor.nome || vitor.name || "Vitor Chineque";
        if (el("editEmail")) el("editEmail").value = vitor.email || "vitor.chinequero@safelife.com";
        if (el("editPhone")) el("editPhone").value = vitor.telefone || vitor.phone || "";

        if (typeof window.nextScreen === "function") window.nextScreen("citizenProfile");

        setTimeout(renderCitizenProfileClean, 0);
    };

    function pendingOccurrences() {
        return occurrences().filter(item => {
            const status = String(item.status || "Pendente").toLowerCase();
            return !status.includes("conclu") && !status.includes("atendida") && !status.includes("finalizada");
        });
    }

    function proOccurrenceCard(item) {
        const reporterFoto = getReporterPhoto(item);
        const occFoto = getOccPhoto(item);

        return `
            <article class="occurrence-card occurrence-full-card">
                <div class="occurrence-header">
                    <div>
                        <h4>${esc(item.tipo || item.type || "Ocorrência")}</h4>
                        <small>${esc(item.createdAt || item.timestamp || "")}</small>
                    </div>
                    <span class="status-badge">${esc(item.status || "Pendente")}</span>
                </div>

                <div class="reporter-row">
                    ${
                        reporterFoto
                            ? `<img class="reporter-avatar" src="${reporterFoto}" alt="Foto do cidadão">`
                            : `<div class="reporter-avatar empty">👤</div>`
                    }
                    <div>
                        <strong>${esc(item.citizenName || item.nome_usuario || item.reporterName || "Vitor Chineque")}</strong>
                        <small>CPF: ${esc(item.citizenCpf || item.cpf_usuario || "11111111111")}</small>
                    </div>
                </div>

                <div class="occurrence-photo-box">
                    ${
                        occFoto
                            ? `<img class="occurrence-evidence-img" src="${occFoto}" alt="Foto da ocorrência">`
                            : `<div class="occ-photo-placeholder">📷 Sem foto enviada</div>`
                    }
                </div>

                <p><strong>Opção marcada:</strong> ${esc(getOccTitle(item))}</p>
                <p><strong>Descrição:</strong> ${esc(getOccDesc(item))}</p>
                <p><strong>Endereço:</strong> ${esc(getOccAddress(item))}</p>
                <p><strong>Prioridade:</strong> ${esc(item.prioridade || "NORMAL")}</p>

                <button class="btn small-btn" type="button" onclick="concluirOcorrenciaProfissional('${item.id}')">
                    ✅ Concluir atendimento
                </button>
            </article>
        `;
    }

    window.abrirOcorrenciasPro = function abrirOcorrenciasProFinal() {
        const container = el("listaIntegradaPro");
        const list = pendingOccurrences();

        if (container) {
            container.innerHTML = list.length
                ? list.map(proOccurrenceCard).join("")
                : `
                    <div class="occurrence-card">
                        <h4>Nenhum chamado pendente</h4>
                        <p>As ocorrências concluídas saem daqui e aparecem no perfil do cidadão.</p>
                    </div>
                `;
        }

        if (typeof window.nextScreen === "function") window.nextScreen("proListScreen");
    };

    window.concluirOcorrenciaProfissional = function concluirOcorrenciaProfissionalFinal(idOcorrencia) {
        const list = occurrences();
        const index = list.findIndex(item => String(item.id) === String(idOcorrencia));

        if (index === -1) {
            toast("Ocorrência não encontrada.");
            return;
        }

        const zeca = getZeca();
        const item = list[index];

        const completed = {
            ...item,
            status: "Concluída",
            profissionalNome: zeca.nome || zeca.name || "Zeca do Santos",
            profissionalCpf: zeca.cpf || "99999999999",
            empresaProfissional: zeca.company || zeca.empresa || "Safe Life Matriz",
            concluidaEm: new Date().toLocaleString("pt-BR"),
            completedAt: new Date().toLocaleString("pt-BR")
        };

        list.splice(index, 1);
        setOccurrences(list);

        const h = history();
        h.unshift(completed);
        setHistory(h);

        const n = notifications();
        n.unshift({
            id: Date.now().toString(),
            citizenCpf: completed.citizenCpf || completed.cpf_usuario || "11111111111",
            title: "Ocorrência concluída",
            message: `O profissional ${completed.profissionalNome} concluiu o atendimento de ${getOccTitle(completed)}.`,
            occurrenceId: completed.id,
            createdAt: new Date().toLocaleString("pt-BR"),
            ...completed
        });
        setNotifications(n);

        toast("✅ Atendimento concluído. O cidadão recebeu a notificação no perfil.");
        window.abrirOcorrenciasPro();
    };

    window.marcarOcorrenciaAtendida = window.concluirOcorrenciaProfissional;

    window.abrirAgentesAtivos = function abrirAgentesAtivosFinal() {
        const container = el("activeAgentsList");
        const zeca = getZeca();
        const list = pendingOccurrences();

        const agents = [
            {
                nome: zeca.nome || zeca.name || "Zeca do Santos",
                empresa: zeca.company || zeca.empresa || "Safe Life Matriz",
                status: "Disponível",
                tempo: "10 min",
                foto: zeca.foto || zeca.avatar || "",
                especialidade: "Resgate e atendimento animal"
            },
            {
                nome: "Equipe Patas Livres",
                empresa: "ONG Patas Livres",
                status: list.length ? "Em deslocamento" : "Disponível",
                tempo: list.length ? "15 min" : "12 min",
                foto: "",
                especialidade: "Apoio em denúncias"
            },
            {
                nome: "Equipe Zoonoses",
                empresa: "Centro de Controle de Zoonoses",
                status: "Disponível",
                tempo: "18 min",
                foto: "",
                especialidade: "Casos de risco e saúde pública"
            }
        ];

        if (container) {
            container.innerHTML = agents.map(agent => `
                <div class="occurrence-card agent-card">
                    <div class="reporter-row">
                        ${
                            agent.foto
                                ? `<img class="reporter-avatar" src="${agent.foto}" alt="Foto do agente">`
                                : `<div class="reporter-avatar empty">🚑</div>`
                        }
                        <div>
                            <h4>${esc(agent.nome)}</h4>
                            <small>${esc(agent.empresa)}</small>
                        </div>
                    </div>

                    <p><strong>Status:</strong> ${esc(agent.status)}</p>
                    <p><strong>Tempo estimado:</strong> ${esc(agent.tempo)}</p>
                    <p><strong>Especialidade:</strong> ${esc(agent.especialidade)}</p>

                    ${
                        list.length
                            ? `<p><strong>Chamados pendentes:</strong> ${list.length}</p>`
                            : `<p>Sem chamados pendentes no momento.</p>`
                    }
                </div>
            `).join("");
        }

        if (typeof window.nextScreen === "function") window.nextScreen("activeAgentsScreen");
    };

    // Mensagem de confirmação mais natural para cidadão
    const originalRegistrarAcao = window.registrarAcao;
    window.registrarAcao = async function registrarAcaoMensagemPublica(event) {
        if (typeof originalRegistrarAcao === "function") {
            await originalRegistrarAcao(event);
        }

        const msg = el("confirmMsg");
        if (msg) {
            msg.textContent = "Denúncia enviada com sucesso. Um profissional da Safe Life irá analisar o caso e acompanhar o atendimento.";
        }
    };

    const originalRegistrarAcaoAnonima = window.registrarAcaoAnonima;
    window.registrarAcaoAnonima = async function registrarAcaoAnonimaMensagemPublica(event) {
        if (typeof originalRegistrarAcaoAnonima === "function") {
            await originalRegistrarAcaoAnonima(event);
        }

        const msg = el("confirmMsg");
        if (msg) {
            msg.textContent = "Denúncia anônima enviada com sucesso. A equipe profissional irá analisar o caso com segurança.";
        }
    };

    function injectCss() {
        if (el("safeLifeNotificationFixCss")) return;

        const style = document.createElement("style");
        style.id = "safeLifeNotificationFixCss";
        style.textContent = `
            .safe-profile-section {
                margin-top: 18px;
            }

            .safe-profile-section h4 {
                margin-bottom: 12px;
            }

            .safe-notification-card {
                display: flex;
                gap: 14px;
                align-items: flex-start;
                padding: 16px;
                border-radius: 18px;
                background: linear-gradient(135deg, #ecfdf5, #ffffff);
                border: 1px solid rgba(16, 185, 129, .28);
                margin-bottom: 12px;
            }

            .safe-notification-icon {
                width: 42px;
                height: 42px;
                display: grid;
                place-items: center;
                border-radius: 14px;
                background: #10b981;
                color: white;
                font-size: 22px;
                flex: 0 0 auto;
            }

            .agent-card {
                border-left: 5px solid var(--success-color, #10b981);
            }
        `;
        document.head.appendChild(style);
    }

    document.addEventListener("DOMContentLoaded", function () {
        injectCss();

        const oldMyPets = el("myPetsContainer");
        if (oldMyPets) {
            // deixa o perfil limpo quando abrir depois
            oldMyPets.dataset.safeLifeCleanProfile = "1";
        }
    });
})();


/* =====================================================
   PATCH FLUIDEZ EXTRA + PERFIL PROFISSIONAL MAIS ÚTIL
   Adiciona:
   - Histórico de Atendimentos
   - Checklist de Resgate
   E deixa troca de telas/cliques mais fluidos.
===================================================== */

(function () {
    const HISTORY_KEY = "safeLifeHistoricoOcorrencias";
    const OCC_KEY = "safeLifeOcorrencias";

    function get(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw) ?? fallback;
        } catch (e) {
            return fallback;
        }
    }

    function el(id) {
        return document.getElementById(id);
    }

    function esc(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getTitle(item) {
        return item.opcaoEscolhida || item.opcao_escolhida || item.assunto || item.optionTitle || item.tipo || item.type || "Ocorrência";
    }

    function getDesc(item) {
        return item.detalhes || item.descricao || item.description || "Sem descrição";
    }

    function getAddress(item) {
        return item.localizacao || item.endereco_completo || item.endereco || item.address || item.local || "Sem endereço";
    }

    function getPhoto(item) {
        return item.fotoOcorrencia || item.fotoEvidencia || item.occurrencePhoto || item.evidencePhoto || item.foto || "";
    }

    function fastScreen(screenId) {
        document.querySelectorAll(".screen").forEach(screen => {
            screen.classList.remove("active");
        });

        const target = el(screenId);

        if (!target) {
            console.warn("Tela não encontrada:", screenId);
            return;
        }

        target.classList.add("active");
        window.scrollTo(0, 0);
    }

    // Sobrescreve nextScreen mais uma vez para ficar direto.
    window.nextScreen = fastScreen;

    window.abrirHistoricoAtendimentosPro = function abrirHistoricoAtendimentosPro() {
        const list = get(HISTORY_KEY, []);
        const container = el("proHistoryList");

        if (container) {
            container.innerHTML = list.length
                ? list.map(item => {
                    const foto = getPhoto(item);

                    return `
                        <article class="occurrence-card completed-occurrence">
                            <div class="occurrence-header">
                                <div>
                                    <h4>✅ ${esc(getTitle(item))}</h4>
                                    <small>${esc(item.concluidaEm || item.completedAt || "")}</small>
                                </div>
                                <span class="status-badge success-badge">Concluída</span>
                            </div>

                            <p><strong>Descrição:</strong> ${esc(getDesc(item))}</p>
                            <p><strong>Endereço:</strong> ${esc(getAddress(item))}</p>
                            <p><strong>Cidadão:</strong> ${esc(item.citizenName || item.nome_usuario || "Vitor Chineque")}</p>

                            ${foto ? `
                                <div class="occurrence-photo-box">
                                    <img class="occurrence-evidence-img" src="${foto}" alt="Foto da ocorrência">
                                </div>
                            ` : ""}
                        </article>
                    `;
                }).join("")
                : `
                    <div class="occurrence-card">
                        <h4>Nenhum atendimento concluído ainda</h4>
                        <p>Quando você concluir uma ocorrência, ela aparece aqui.</p>
                    </div>
                `;
        }

        fastScreen("proHistoryScreen");
    };

    window.abrirChecklistResgatePro = function abrirChecklistResgatePro() {
        const container = el("proChecklistBox");
        const pending = get(OCC_KEY, []).filter(item => {
            const status = String(item.status || "Pendente").toLowerCase();
            return !status.includes("conclu") && !status.includes("atendida");
        });

        if (container) {
            container.innerHTML = `
                <div class="occurrence-card">
                    <h4>🧰 Checklist rápido do profissional</h4>
                    <p>Use isso antes de concluir um chamado.</p>
                    <p><strong>Chamados pendentes:</strong> ${pending.length}</p>
                </div>

                <div class="checklist-item">
                    <div class="checklist-icon">1</div>
                    <div>
                        <strong>Conferir endereço e referência</strong>
                        <p>Veja bairro, rua, número ou ponto de referência informado pelo cidadão.</p>
                    </div>
                </div>

                <div class="checklist-item">
                    <div class="checklist-icon">2</div>
                    <div>
                        <strong>Ver foto da ocorrência</strong>
                        <p>Confirme se é emergência, denúncia, resgate ou maus-tratos.</p>
                    </div>
                </div>

                <div class="checklist-item">
                    <div class="checklist-icon">3</div>
                    <div>
                        <strong>Separar equipamento básico</strong>
                        <p>Caixa de transporte, luvas, guia, água, kit de primeiros cuidados e contato de apoio.</p>
                    </div>
                </div>

                <div class="checklist-item">
                    <div class="checklist-icon">4</div>
                    <div>
                        <strong>Concluir somente após atendimento</strong>
                        <p>Ao concluir, o chamado sai da sua fila e o cidadão recebe notificação no perfil.</p>
                    </div>
                </div>
            `;
        }

        fastScreen("proChecklistScreen");
    };

    function bindFastClicks() {
        document.querySelectorAll("button, .btn, .admin-tool-card, .pro-action-card").forEach(btn => {
            if (btn.dataset.fastBound === "1") return;
            btn.dataset.fastBound = "1";

            btn.addEventListener("touchstart", () => {}, { passive: true });
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        document.documentElement.classList.add("safe-life-no-delay");
        bindFastClicks();

        // garante que as 2 opções existam visualmente mesmo se o HTML antigo não renderizar no lugar certo
        const dashboard = el("proDashboard");
        const main = dashboard ? dashboard.querySelector("main") : null;

        if (main && !document.querySelector('[onclick="abrirHistoricoAtendimentosPro()"]')) {
            const wrap = document.createElement("section");
            wrap.className = "pro-extra-actions";
            wrap.innerHTML = `
                <button class="pro-action-card" onclick="abrirHistoricoAtendimentosPro()" type="button">
                    <span>✅</span>
                    <strong>Histórico de Atendimentos</strong>
                    <small>Veja ocorrências já concluídas por você.</small>
                </button>

                <button class="pro-action-card" onclick="abrirChecklistResgatePro()" type="button">
                    <span>🧰</span>
                    <strong>Checklist de Resgate</strong>
                    <small>Passos rápidos para atender com segurança.</small>
                </button>
            `;
            main.appendChild(wrap);
        }
    });
})();


/* =====================================================
   SAFE LIFE 10/10 - FLUXO PROFISSIONAL REAL + ADMIN FORTE
   Cidadão envia -> Zeca aceita -> Em atendimento -> Conclui
   -> Vitor recebe notificação -> Gustavo acompanha tudo.
===================================================== */

(function () {
    const USERS_KEY = "safeLifeUsuarios";
    const OCC_KEY = "safeLifeOcorrencias";
    const HISTORY_KEY = "safeLifeHistoricoOcorrencias";
    const NOTIF_KEY = "safeLifeNotificacoes";
    const AUDIT_KEY = "safeLifeAuditoria";
    const EMP_KEY = "safeLifeEmpresas";
    const PET_KEY = "safeLifePets";

    function get(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw) ?? fallback;
        } catch (e) {
            return fallback;
        }
    }

    function set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function cpf(value) {
        return String(value || "").replace(/\D/g, "");
    }

    function el(id) {
        return document.getElementById(id);
    }

    function esc(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function toast(msg) {
        if (typeof window.triggerToast === "function") window.triggerToast(msg);
        else alert(msg);
    }

    function users() {
        return get(USERS_KEY, []);
    }

    function occs() {
        return get(OCC_KEY, []);
    }

    function history() {
        return get(HISTORY_KEY, []);
    }

    function notifs() {
        return get(NOTIF_KEY, []);
    }

    function audits() {
        return get(AUDIT_KEY, []);
    }

    function pets() {
        return get(PET_KEY, []);
    }

    function companies() {
        return get(EMP_KEY, [
            { id: "empresa-matriz", nome: "Safe Life Matriz", ativo: true },
            { id: "ong-patas", nome: "ONG Patas Livres", ativo: true },
            { id: "ccz", nome: "Centro de Controle de Zoonoses", ativo: true }
        ]);
    }

    function saveOccs(list) {
        set(OCC_KEY, list);
        try { dbOcorrencias = list; } catch (e) { window.dbOcorrencias = list; }
    }

    function saveHistory(list) {
        set(HISTORY_KEY, list);
    }

    function saveNotifs(list) {
        set(NOTIF_KEY, list);
    }

    function saveAudit(action, detail) {
        const list = audits();
        list.unshift({
            id: Date.now().toString(),
            action,
            detail,
            createdAt: new Date().toLocaleString("pt-BR")
        });
        set(AUDIT_KEY, list);
    }

    function zeca() {
        return users().find(user => cpf(user.cpf) === "99999999999") || {
            nome: "Zeca do Santos",
            name: "Zeca do Santos",
            cpf: "99999999999",
            company: "Safe Life Matriz"
        };
    }

    function vitor() {
        return users().find(user => cpf(user.cpf) === "11111111111") || {
            nome: "Vitor Chineque",
            name: "Vitor Chineque",
            cpf: "11111111111"
        };
    }

    function gustavo() {
        return users().find(user => cpf(user.cpf) === "45317828791") || {
            nome: "Gustavo Siri",
            name: "Gustavo Siri",
            cpf: "45317828791"
        };
    }

    function title(item) {
        return item.opcaoEscolhida || item.opcao_escolhida || item.assunto || item.optionTitle || item.tipo || item.type || "Ocorrência";
    }

    function desc(item) {
        return item.detalhes || item.descricao || item.description || "Sem descrição";
    }

    function addr(item) {
        return item.localizacao || item.endereco_completo || item.endereco || item.address || item.local || "Sem endereço";
    }

    function occPhoto(item) {
        return item.fotoOcorrencia || item.fotoEvidencia || item.occurrencePhoto || item.evidencePhoto || item.foto || "";
    }

    function reporterPhoto(item) {
        return item.fotoSolicitante || item.foto_usuario || item.reporterPhoto || "";
    }

    function statusClass(status) {
        const s = String(status || "").toLowerCase();
        if (s.includes("concl")) return "safe-status-done";
        if (s.includes("atendimento")) return "safe-status-progress";
        if (s.includes("aceito")) return "safe-status-accepted";
        return "safe-status-pending";
    }

    function pending() {
        return occs().filter(item => {
            const s = String(item.status || "Pendente").toLowerCase();
            return !s.includes("conclu") && !s.includes("finalizada");
        });
    }

    function reporterBlock(item) {
        const foto = reporterPhoto(item);
        return `
            <div class="reporter-row">
                ${foto ? `<img class="reporter-avatar" src="${foto}" alt="Foto do cidadão">` : `<div class="reporter-avatar empty">👤</div>`}
                <div>
                    <strong>${esc(item.citizenName || item.nome_usuario || item.reporterName || "Vitor Chineque")}</strong>
                    <small>${item.anonima ? "Denúncia anônima" : `CPF: ${esc(item.citizenCpf || item.cpf_usuario || "11111111111")}`}</small>
                </div>
            </div>
        `;
    }

    function photoBlock(item) {
        const foto = occPhoto(item);
        if (!foto) return `<div class="occ-photo-placeholder">📷 Sem foto enviada</div>`;
        return `<img class="occurrence-evidence-img" src="${foto}" alt="Foto da ocorrência">`;
    }

    function professionalCard(item) {
        const status = item.status || "Pendente";
        const accepted = String(status).toLowerCase().includes("aceito") || String(status).toLowerCase().includes("atendimento");

        return `
            <article class="occurrence-card occurrence-full-card">
                <div class="occurrence-header">
                    <div>
                        <h4>${esc(title(item))}</h4>
                        <small>${esc(item.createdAt || item.timestamp || "")}</small>
                    </div>
                    <span class="status-badge ${statusClass(status)}">${esc(status)}</span>
                </div>

                ${reporterBlock(item)}

                <div class="occurrence-photo-box">${photoBlock(item)}</div>

                <p><strong>Opção marcada:</strong> ${esc(title(item))}</p>
                <p><strong>Descrição:</strong> ${esc(desc(item))}</p>
                <p><strong>Endereço:</strong> ${esc(addr(item))}</p>
                <p><strong>Prioridade:</strong> ${esc(item.prioridade || "NORMAL")}</p>

                <div class="safe-action-row">
                    <button class="btn secondary-btn small-btn" type="button" onclick="aceitarChamadoProfissional('${item.id}')">
                        🤝 Aceitar
                    </button>

                    <button class="btn secondary-btn small-btn" type="button" onclick="marcarEmAtendimentoProfissional('${item.id}')">
                        🚑 Em atendimento
                    </button>

                    <button class="btn small-btn" type="button" onclick="concluirOcorrenciaProfissional('${item.id}')">
                        ✅ Concluir
                    </button>
                </div>
            </article>
        `;
    }

    function notifyCitizen(item, message) {
        const list = notifs();
        list.unshift({
            id: Date.now().toString(),
            citizenCpf: item.citizenCpf || item.cpf_usuario || "11111111111",
            title: "Atualização da ocorrência",
            message,
            occurrenceId: item.id,
            createdAt: new Date().toLocaleString("pt-BR"),
            ...item
        });
        saveNotifs(list);
    }

    function updateOccurrenceStatus(id, status, notificationMessage, auditAction) {
        const list = occs();
        const item = list.find(occ => String(occ.id) === String(id));

        if (!item) {
            toast("Ocorrência não encontrada.");
            return null;
        }

        const pro = zeca();

        item.status = status;
        item.profissionalNome = pro.nome || pro.name || "Zeca do Santos";
        item.profissionalCpf = pro.cpf || "99999999999";
        item.empresaProfissional = pro.company || pro.empresa || "Safe Life Matriz";
        item.updatedAt = new Date().toLocaleString("pt-BR");

        saveOccs(list);

        if (notificationMessage) notifyCitizen(item, notificationMessage);
        if (auditAction) saveAudit(auditAction, `${title(item)} - ${item.profissionalNome}`);

        return item;
    }

    window.aceitarChamadoProfissional = function aceitarChamadoProfissional(id) {
        const item = updateOccurrenceStatus(
            id,
            "Aceito pelo profissional",
            `O profissional Zeca do Santos aceitou sua ocorrência: ${title(occs().find(o => String(o.id) === String(id)) || {})}.`,
            "Chamado aceito"
        );

        if (item) {
            toast("🤝 Chamado aceito. O cidadão recebeu uma atualização.");
            window.abrirOcorrenciasPro();
        }
    };

    window.marcarEmAtendimentoProfissional = function marcarEmAtendimentoProfissional(id) {
        const item = updateOccurrenceStatus(
            id,
            "Em atendimento",
            `O profissional Zeca do Santos está em atendimento da sua ocorrência: ${title(occs().find(o => String(o.id) === String(id)) || {})}.`,
            "Chamado em atendimento"
        );

        if (item) {
            toast("🚑 Ocorrência marcada como em atendimento.");
            window.abrirOcorrenciasPro();
        }
    };

    window.concluirOcorrenciaProfissional = function concluirOcorrenciaProfissional10(id) {
        const list = occs();
        const index = list.findIndex(item => String(item.id) === String(id));

        if (index === -1) {
            toast("Ocorrência não encontrada.");
            return;
        }

        const pro = zeca();
        const item = list[index];

        const completed = {
            ...item,
            status: "Concluída",
            profissionalNome: pro.nome || pro.name || "Zeca do Santos",
            profissionalCpf: pro.cpf || "99999999999",
            empresaProfissional: pro.company || pro.empresa || "Safe Life Matriz",
            concluidaEm: new Date().toLocaleString("pt-BR"),
            completedAt: new Date().toLocaleString("pt-BR")
        };

        list.splice(index, 1);
        saveOccs(list);

        const hist = history();
        hist.unshift(completed);
        saveHistory(hist);

        notifyCitizen(completed, `Sua ocorrência "${title(completed)}" foi concluída pelo profissional Zeca do Santos.`);
        saveAudit("Chamado concluído", `${title(completed)} - Zeca do Santos`);

        toast("✅ Ocorrência concluída. O cidadão recebeu a notificação.");
        window.abrirOcorrenciasPro();
    };

    window.marcarOcorrenciaAtendida = window.concluirOcorrenciaProfissional;

    window.abrirOcorrenciasPro = function abrirOcorrenciasPro10() {
        const container = document.getElementById("listaIntegradaPro");
        const list = pending();

        if (container) {
            container.innerHTML = list.length
                ? list.map(professionalCard).join("")
                : `
                    <div class="occurrence-card">
                        <h4>Fila limpa</h4>
                        <p>Nenhum chamado pendente. Os atendimentos concluídos ficam no histórico.</p>
                    </div>
                `;
        }

        window.nextScreen("proListScreen");
    };

    window.abrirRelatorioPlantao = function abrirRelatorioPlantao10() {
        const box = document.getElementById("shiftReportBox");
        const pend = pending();
        const hist = history();

        if (box) {
            box.innerHTML = `
                <div class="occurrence-card">
                    <h4>📊 Relatório do plantão</h4>
                    <p><strong>Profissional:</strong> Zeca do Santos</p>
                    <p><strong>Pendentes:</strong> ${pend.length}</p>
                    <p><strong>Concluídas:</strong> ${hist.length}</p>
                    <p><strong>Empresas de apoio:</strong> ${companies().length}</p>
                </div>
                ${pend.length ? pend.map(professionalCard).join("") : `<div class="occurrence-card"><h4>Sem pendências</h4></div>`}
            `;
        }

        window.nextScreen("shiftReportScreen");
    };

    function notificationCard(item) {
        return `
            <div class="safe-notification-card">
                <div class="safe-notification-icon">🔔</div>
                <div>
                    <strong>${esc(item.title || "Atualização")}</strong>
                    <p>${esc(item.message || "Sua ocorrência recebeu uma atualização.")}</p>
                    <small>${esc(item.createdAt || "")}</small>
                </div>
            </div>
        `;
    }

    function completedCard(item) {
        return `
            <div class="occurrence-card completed-occurrence">
                <div class="occurrence-header">
                    <h4>✅ ${esc(title(item))}</h4>
                    <span class="status-badge safe-status-done">Concluída</span>
                </div>

                <p><strong>Descrição:</strong> ${esc(desc(item))}</p>
                <p><strong>Endereço:</strong> ${esc(addr(item))}</p>
                <p><strong>Profissional:</strong> ${esc(item.profissionalNome || "Zeca do Santos")}</p>
                <p><strong>Empresa:</strong> ${esc(item.empresaProfissional || "Safe Life Matriz")}</p>

                <div class="occurrence-photo-box">${photoBlock(item)}</div>

                <small>Concluída em: ${esc(item.concluidaEm || item.completedAt || "")}</small>
            </div>
        `;
    }

    function petCard(pet) {
        return `
            <div class="occurrence-card pet-card">
                ${pet.foto || pet.photo ? `<img class="pet-card-img" src="${pet.foto || pet.photo}" alt="Foto do pet">` : ""}
                <h4>🐾 ${esc(pet.nome || pet.name || "Pet")}</h4>
                <p><strong>Espécie:</strong> ${esc(pet.especie || pet.species || "Animal")}</p>
                <p><strong>Raça:</strong> ${esc(pet.raca || pet.breed || "Não informada")}</p>
                <p><strong>Idade:</strong> ${esc(pet.idade || pet.age || "Não informada")}</p>
                <p><strong>Local:</strong> ${esc(pet.local || pet.location || "Não informado")}</p>
            </div>
        `;
    }

    window.renderPerfilCidadao = function renderPerfilCidadao10() {
        const user = vitor();
        const container = document.getElementById("myPetsContainer");

        if (document.getElementById("profileAvatar")) document.getElementById("profileAvatar").src = user.foto || user.avatar || document.getElementById("profileAvatar").src;
        if (document.getElementById("citizenProfileName")) document.getElementById("citizenProfileName").textContent = user.nome || user.name || "Vitor Chineque";
        if (document.getElementById("citizenProfileType")) document.getElementById("citizenProfileType").textContent = "Cidadão";
        if (document.getElementById("citizenProfileContact")) document.getElementById("citizenProfileContact").textContent = user.email || "vitor.chinequero@safelife.com";

        if (document.getElementById("editName")) document.getElementById("editName").value = user.nome || user.name || "Vitor Chineque";
        if (document.getElementById("editEmail")) document.getElementById("editEmail").value = user.email || "vitor.chinequero@safelife.com";
        if (document.getElementById("editPhone")) document.getElementById("editPhone").value = user.telefone || user.phone || "";

        if (container) {
            const clean = cpf(user.cpf || "11111111111");

            const userNotifs = notifs().filter(n => !n.citizenCpf || cpf(n.citizenCpf) === clean);
            const userPets = pets().filter(p => !p.donoCpf || cpf(p.donoCpf || p.ownerCpf) === clean);
            const userHistory = history().filter(h => !h.citizenCpf || cpf(h.citizenCpf || h.cpf_usuario || h.reporterCpf) === clean);

            container.innerHTML = `
                <div class="safe-profile-section">
                    <h4>🔔 Notificações</h4>
                    ${userNotifs.length ? userNotifs.map(notificationCard).join("") : `<p class="empty-message">Nenhuma notificação ainda.</p>`}
                </div>

                <div class="safe-profile-section">
                    <h4>🐾 Meus Pets</h4>
                    ${userPets.length ? userPets.map(petCard).join("") : `<p class="empty-message">Nenhum pet cadastrado ainda.</p>`}
                </div>

                <div class="safe-profile-section">
                    <h4>✅ Ocorrências realizadas</h4>
                    ${userHistory.length ? userHistory.map(completedCard).join("") : `<p class="empty-message">Nenhuma ocorrência concluída ainda.</p>`}
                </div>
            `;
        }

        window.nextScreen("citizenProfile");
    };

    window.abrirRelatorioAdmin = function abrirRelatorioAdmin10() {
        const box = document.getElementById("adminReportBox");
        const pend = pending();
        const hist = history();

        if (box) {
            box.innerHTML = `
                <div class="occurrence-card">
                    <h4>📊 Relatório Geral do Gustavo</h4>
                    <p><strong>Usuários:</strong> ${users().length}</p>
                    <p><strong>Profissionais:</strong> ${users().filter(u => u.type === "professional").length}</p>
                    <p><strong>Empresas:</strong> ${companies().length}</p>
                    <p><strong>Ocorrências pendentes:</strong> ${pend.length}</p>
                    <p><strong>Ocorrências concluídas:</strong> ${hist.length}</p>
                </div>

                <h3>Pendentes / em atendimento</h3>
                ${pend.length ? pend.map(professionalCard).join("") : `<div class="occurrence-card"><h4>Nenhum chamado pendente</h4></div>`}

                <h3>Concluídas</h3>
                ${hist.length ? hist.map(completedCard).join("") : `<div class="occurrence-card"><h4>Nenhuma concluída ainda</h4></div>`}
            `;
        }

        window.nextScreen("adminReportScreen");
    };

    window.abrirAuditoriaAdmin = function abrirAuditoriaAdmin10() {
        const container = document.getElementById("adminAuditList");
        const list = audits();

        if (container) {
            container.innerHTML = list.length
                ? list.map(item => `
                    <div class="occurrence-card">
                        <h4>${esc(item.action)}</h4>
                        <p>${esc(item.detail)}</p>
                        <small>${esc(item.createdAt)}</small>
                    </div>
                `).join("")
                : `<div class="occurrence-card"><h4>Nenhuma ação registrada ainda</h4></div>`;
        }

        window.nextScreen("adminAuditScreen");
    };

    window.inicializarPainelAdmin = function inicializarPainelAdmin10() {
        const admin = gustavo();

        if (document.getElementById("adminAvatar")) document.getElementById("adminAvatar").src = admin.foto || admin.avatar || document.getElementById("adminAvatar").src;
        if (document.getElementById("adminWelcomeName")) document.getElementById("adminWelcomeName").textContent = admin.nome || admin.name || "Gustavo Siri";
        if (document.getElementById("adminCpfText")) document.getElementById("adminCpfText").textContent = "CPF: 45317828791";

        const pend = pending();
        const hist = history();

        if (document.getElementById("adminStatUsers")) document.getElementById("adminStatUsers").textContent = users().length;
        if (document.getElementById("adminStatProfessionals")) document.getElementById("adminStatProfessionals").textContent = users().filter(u => u.type === "professional").length;
        if (document.getElementById("adminStatReports")) document.getElementById("adminStatReports").textContent = pend.length + hist.length;
        if (document.getElementById("adminStatSuspicious")) document.getElementById("adminStatSuspicious").textContent = users().filter(u => u.ativo === false || !u.email).length;

        window.nextScreen("adminDashboard");
    };

    function inject10Css() {
        if (document.getElementById("safeLife10Css")) return;

        const style = document.createElement("style");
        style.id = "safeLife10Css";
        style.textContent = `
            .safe-action-row {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
                margin-top: 14px;
            }

            .safe-status-pending {
                background: rgba(245, 158, 11, .14) !important;
                color: #b45309 !important;
            }

            .safe-status-accepted {
                background: rgba(59, 130, 246, .14) !important;
                color: #1d4ed8 !important;
            }

            .safe-status-progress {
                background: rgba(124, 58, 237, .14) !important;
                color: #6d28d9 !important;
            }

            .safe-status-done {
                background: rgba(16, 185, 129, .14) !important;
                color: #047857 !important;
            }

            @media (max-width: 720px) {
                .safe-action-row {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.addEventListener("DOMContentLoaded", inject10Css);
})();

(function () {
    const USERS_KEY = "safeLifeUsuarios";
    const LOGGED_KEY = "safeLifeLoggedUser";
    const PET_KEY = "safeLifePets";
    const OCC_KEY = "safeLifeOcorrencias";
    const HISTORY_KEY = "safeLifeHistoricoOcorrencias";
    const NOTIF_KEY = "safeLifeNotificacoes";
    const ADMIN = "45317828791";
    const DEFAULT_PET_PHOTO = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=85";
    const DEFAULT_USER_PHOTO = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=85";

    function get(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw) ?? fallback;
        } catch (e) {
            return fallback;
        }
    }

    function set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function cpf(value) {
        return String(value || "").replace(/\D/g, "");
    }

    function el(id) {
        return document.getElementById(id);
    }

    function val(id) {
        const campo = el(id);
        return campo ? String(campo.value || "").trim() : "";
    }

    function esc(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function toast(message) {
        if (typeof triggerToast === "function") triggerToast(message);
        else alert(message);
    }

    async function fileToBase64(inputId) {
        const input = el(inputId);
        const file = input && input.files && input.files[0];
        if (!file) return "";
        if (typeof arquivoParaBase64 === "function") return await arquivoParaBase64(file);
        return await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result || "");
            reader.onerror = () => resolve("");
            reader.readAsDataURL(file);
        });
    }

    async function api(endpoint, options) {
        if (typeof apiRequest === "function") return await apiRequest(endpoint, options);
        const response = await fetch(`http://localhost:3000${endpoint}`, {
            headers: { "Content-Type": "application/json" },
            ...options
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Erro na API");
        return data;
    }

    function normalizeUser(user, fallbackType) {
        const type = user.type || user.tipo || fallbackType || "citizen";
        const company = user.company || user.empresa || (type === "professional" ? "Safe Life Matriz" : "");
        const name = user.nome || user.name || "Usuário";
        const photo = user.foto || user.foto_perfil || user.avatar || DEFAULT_USER_PHOTO;
        return {
            ...user,
            id: user.id || `${type}-${cpf(user.cpf) || Date.now()}`,
            nome: name,
            name,
            cpf: cpf(user.cpf),
            email: user.email || "",
            telefone: user.telefone || user.phone || "",
            phone: user.telefone || user.phone || "",
            type,
            tipo: type,
            company,
            empresa: company,
            foto: photo,
            avatar: photo,
            ativo: user.ativo !== false,
            profissional: user.profissional || {
                cargo: user.cargo || "Agente Operacional",
                especialidade: user.especialidade || "Resgate e triagem animal",
                regiao: user.regiaoAtendimento || user.regiao_atendimento || "Região não informada",
                plantao: user.statusPlantao || user.status_plantao || "Disponível",
                veiculo: user.veiculo || "Veículo de apoio",
                equipe: user.equipe || "Equipe Safe Life",
                registro: user.registroProfissional || user.registro_profissional || "",
                observacoes: user.bioProfissional || user.bio_profissional || ""
            }
        };
    }

    function users() {
        return get(USERS_KEY, []);
    }

    function saveUsers(list) {
        set(USERS_KEY, list);
        try { usuarios = list; } catch (e) { window.usuarios = list; }
    }

    function upsertUser(user) {
        const normalized = normalizeUser(user);
        const list = users().filter(item => cpf(item.cpf) !== cpf(normalized.cpf));
        list.unshift(normalized);
        saveUsers(list);
        return normalized;
    }

    function setCurrent(user) {
        const normalized = normalizeUser(user);
        try { usuarioLogado = normalized; } catch (e) { window.usuarioLogado = normalized; }
        set(LOGGED_KEY, normalized);
        upsertUser(normalized);
        return normalized;
    }

    function currentUser() {
        try {
            if (usuarioLogado && usuarioLogado.cpf) return normalizeUser(usuarioLogado);
        } catch (e) {}
        const saved = get(LOGGED_KEY, null);
        if (saved && saved.cpf) return normalizeUser(saved);
        return null;
    }

    function uniqueBy(list, keyFn) {
        const seen = new Set();
        const out = [];
        list.forEach(item => {
            const key = keyFn(item);
            if (seen.has(key)) return;
            seen.add(key);
            out.push(item);
        });
        return out;
    }

    function normalizePet(pet, ownerCpf) {
        const donoCpf = cpf(pet.donoCpf || pet.ownerCpf || pet.dono_cpf || ownerCpf || "");
        const desaparecido = Boolean(
            pet.desaparecido ||
            String(pet.status_pet || pet.statusPet || pet.status || "").toUpperCase() === "DESAPARECIDO"
        );
        return {
            ...pet,
            id: pet.id || pet.localId || `${donoCpf}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            donoCpf,
            ownerCpf: donoCpf,
            donoNome: pet.donoNome || pet.dono_nome || pet.ownerName || "",
            nome: pet.nome || pet.name || "Pet",
            name: pet.nome || pet.name || "Pet",
            idade: pet.idade ?? pet.age ?? 0,
            especie: pet.especie || pet.species || "Animal",
            raca: pet.raca || pet.breed || "Não informada",
            sexo: pet.sexo || "NAO_INFORMADO",
            cor: pet.cor || pet.color || "Não informada",
            peso: pet.peso || pet.weight || "",
            local: pet.local || pet.localizacao || pet.location || "Não informado",
            localizacao: pet.localizacao || pet.local || pet.location || "Não informado",
            observacoes: pet.observacoes || pet.notes || "",
            foto: pet.foto || pet.photo || DEFAULT_PET_PHOTO,
            photo: pet.foto || pet.photo || DEFAULT_PET_PHOTO,
            desaparecido,
            statusPet: desaparecido ? "DESAPARECIDO" : "CADASTRADO",
            status_pet: desaparecido ? "DESAPARECIDO" : "CADASTRADO",
            localDesaparecimento: pet.localDesaparecimento || pet.local_desaparecimento || "",
            local_desaparecimento: pet.local_desaparecimento || pet.localDesaparecimento || "",
            detalhesDesaparecimento: pet.detalhesDesaparecimento || pet.detalhes_desaparecimento || "",
            detalhes_desaparecimento: pet.detalhes_desaparecimento || pet.detalhesDesaparecimento || "",
            desaparecidoEm: pet.desaparecidoEm || pet.desaparecido_em || "",
            desaparecido_em: pet.desaparecido_em || pet.desaparecidoEm || "",
            ativo: pet.ativo !== false
        };
    }

    function petKey(pet) {
        const normalized = normalizePet(pet);
        return String(normalized.id || `${normalized.donoCpf}-${normalized.nome}-${normalized.especie}-${normalized.raca}-${normalized.local}`).toLowerCase();
    }

    function localPets() {
        return get(PET_KEY, []).map(pet => normalizePet(pet)).filter(pet => pet.ativo !== false);
    }

    function savePets(list) {
        const clean = uniqueBy(list.map(pet => normalizePet(pet)), petKey);
        set(PET_KEY, clean);
        try { meusPets = clean; } catch (e) { window.meusPets = clean; }
        return clean;
    }

    function upsertPet(pet) {
        const normalized = normalizePet(pet);
        const list = localPets().filter(item => petKey(item) !== petKey(normalized));
        list.unshift(normalized);
        savePets(list);
        return normalized;
    }

    async function loadPets(params = {}) {
        const local = localPets();
        try {
            const query = params.donoCpf ? `?donoCpf=${encodeURIComponent(params.donoCpf)}` : "";
            const remote = await api(`/api/pets${query}`);
            const merged = uniqueBy([
                ...(Array.isArray(remote) ? remote.map(p => normalizePet(p, params.donoCpf)) : []),
                ...local
            ], petKey);
            savePets(merged);
            return params.donoCpf
                ? merged.filter(p => cpf(p.donoCpf) === cpf(params.donoCpf))
                : merged;
        } catch (e) {
            return params.donoCpf
                ? local.filter(p => cpf(p.donoCpf) === cpf(params.donoCpf))
                : local;
        }
    }

    function occurrenceKey(item) {
        return `${item.origem || "local"}-${item.id}`;
    }

    function normalizeOccurrence(item) {
        const user = currentUser() || {};
        return {
            ...item,
            id: item.id || Date.now().toString(),
            origem: item.origem || "local",
            tipo: item.tipo || item.type || "Ocorrência",
            assunto: item.assunto || item.opcao_escolhida || item.opcaoEscolhida || "Ocorrência",
            opcaoEscolhida: item.opcaoEscolhida || item.opcao_escolhida || item.assunto || "Ocorrência",
            opcao_escolhida: item.opcao_escolhida || item.opcaoEscolhida || item.assunto || "Ocorrência",
            localizacao: item.localizacao || item.endereco_completo || item.endereco || item.address || "Não informado",
            detalhes: item.detalhes || item.descricao || item.description || "Sem descrição",
            foto: item.foto || item.fotoEvidencia || item.occurrencePhoto || "",
            fotoEvidencia: item.fotoEvidencia || item.foto || "",
            nome_usuario: item.nome_usuario || item.citizenName || item.reporterName || user.nome || "Cidadão",
            cpf_usuario: cpf(item.cpf_usuario || item.citizenCpf || item.reporterCpf || user.cpf || ""),
            foto_usuario: item.foto_usuario || item.citizenPhoto || item.reporterPhoto || user.foto || "",
            citizenName: item.citizenName || item.nome_usuario || item.reporterName || user.nome || "Cidadão",
            citizenCpf: cpf(item.citizenCpf || item.cpf_usuario || item.reporterCpf || user.cpf || ""),
            citizenPhoto: item.citizenPhoto || item.foto_usuario || item.reporterPhoto || user.foto || "",
            reporterName: item.reporterName || item.nome_usuario || item.citizenName || user.nome || "Cidadão",
            reporterCpf: cpf(item.reporterCpf || item.cpf_usuario || item.citizenCpf || user.cpf || ""),
            reporterPhoto: item.reporterPhoto || item.foto_usuario || item.citizenPhoto || user.foto || "",
            status: item.status || "PENDENTE",
            prioridade: item.prioridade || "NORMAL",
            criado_em: item.criado_em || new Date().toISOString(),
            timestamp: item.timestamp || new Date().toLocaleString("pt-BR")
        };
    }

    function localOccurrences() {
        return get(OCC_KEY, []).map(normalizeOccurrence);
    }

    function saveOccurrences(list) {
        const clean = uniqueBy(list.map(normalizeOccurrence), occurrenceKey);
        set(OCC_KEY, clean);
        try { dbOcorrencias = clean; } catch (e) { window.dbOcorrencias = clean; }
        return clean;
    }

    async function loadOccurrences() {
        const local = localOccurrences();
        try {
            const remote = await api("/api/pro/ocorrencias");
            const merged = uniqueBy([
                ...(Array.isArray(remote) ? remote.map(normalizeOccurrence) : []),
                ...local
            ], occurrenceKey);
            saveOccurrences(merged);
            return merged;
        } catch (e) {
            return local;
        }
    }

    function isPending(item) {
        const status = String(item.status || "PENDENTE").toLowerCase();
        return !status.includes("conclu") && !status.includes("atendida") && !status.includes("cancel");
    }

    function getGps() {
        if (typeof obterLocalizacaoAtualObjeto === "function") return obterLocalizacaoAtualObjeto();
        return {
            latitude: val("userLatitude"),
            longitude: val("userLongitude"),
            enderecoCompleto: val("userFullAddress"),
            bairro: val("userNeighborhood"),
            cidade: val("userCity"),
            estado: val("userState")
        };
    }

    function selectedOption() {
        const hidden = el("selectedQuickOption");
        if (hidden && hidden.value) return hidden.value;
        const selected = document.querySelector("#quickOptionsGrid .quick-option-card.selected");
        if (!selected) return "";
        const title = selected.querySelector(".quick-option-title");
        return title ? title.textContent.trim() : selected.textContent.trim();
    }

    function selectedAnonOption() {
        const hidden = el("selectedAnonOption");
        if (hidden && hidden.value) return hidden.value;
        const selected = document.querySelector("#anonOptionsGrid .quick-option-card.selected");
        if (!selected) return "";
        const title = selected.querySelector(".quick-option-title");
        return title ? title.textContent.trim() : selected.textContent.trim();
    }

    window.efetuarCadastro = async function efetuarCadastroAtualizado() {
        const nome = val("regName");
        const userCpf = cpf(val("regCpf"));
        const email = val("regEmail");
        const telefone = val("regPhone");
        const type = val("regType") || "citizen";
        const company = val("regCompany") || "Safe Life Matriz";

        if (!nome || !userCpf || !email || !telefone) {
            alert("Preencha nome, CPF, e-mail e telefone.");
            return;
        }

        if (userCpf.length !== 11) {
            alert("Digite um CPF válido com 11 números.");
            return;
        }

        if (userCpf === ADMIN) {
            alert("Este CPF é reservado para o administrador.");
            return;
        }

        if (typeof validarEmail === "function" && !validarEmail(email)) {
            alert("Digite um e-mail válido.");
            return;
        }

        if (users().some(user => cpf(user.cpf) === userCpf)) {
            alert("Este CPF já está cadastrado.");
            return;
        }

        const payload = {
            nome,
            cpf: userCpf,
            email,
            telefone,
            type,
            company: type === "professional" ? company : null,
            foto: fotoCadastroBase64 || DEFAULT_USER_PHOTO
        };

        let user = payload;
        try {
            const response = await api("/api/auth/register", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            user = response.user || payload;
        } catch (e) {}

        const logged = setCurrent(normalizeUser(user, type));

        if (typeof limparFormularioCadastro === "function") limparFormularioCadastro();
        toast("✅ Cadastro criado com sucesso!");

        if (logged.type === "professional") {
            inicializarPainelPro();
        } else {
            nextScreen("menuScreen");
        }
    };

    window.autenticar = async function autenticarAtualizado() {
        const loginCpf = cpf(val("cpfInput"));
        const role = val("loginRole") || "citizen";
        const company = val("loginCompany") || "Safe Life Matriz";

        if (!loginCpf) {
            alert("Digite o CPF.");
            return;
        }

        let user = null;
        try {
            const response = await api("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ cpf: loginCpf, role, company })
            });
            user = response.user;
        } catch (e) {
            user = users().find(item => cpf(item.cpf) === loginCpf && (role === "admin" ? cpf(item.cpf) === ADMIN : (item.type || item.tipo) === role));
        }

        if (!user) {
            alert("Conta não encontrada, tipo de acesso incorreto ou conta bloqueada.");
            return;
        }

        const logged = setCurrent(normalizeUser(user, role));
        toast("🚀 Login realizado com sucesso!");

        if (logged.type === "admin" || cpf(logged.cpf) === ADMIN) {
            inicializarPainelAdmin();
        } else if (logged.type === "professional") {
            inicializarPainelPro();
        } else {
            nextScreen("menuScreen");
        }
    };

    window.registrarAcao = async function registrarAcaoAtualizada(event) {
        if (event && event.preventDefault) event.preventDefault();
        const user = currentUser();
        if (!user) {
            alert("Você precisa estar logado.");
            return;
        }

        const option = selectedOption();
        const formKey = val("formKey") || "report";
        const localizacao = val("formLocation");
        const detalhes = val("formDetails");
        const foto = await fileToBase64("formFile");
        const config = typeof currentFormConfig !== "undefined" && currentFormConfig ? currentFormConfig : { title: "Chamado", priority: "NORMAL" };

        if (!option) {
            alert("Escolha uma opção do problema.");
            return;
        }

        if (!localizacao || !detalhes) {
            alert("Preencha localização e descrição.");
            return;
        }

        let occurrence = normalizeOccurrence({
            id: Date.now().toString(),
            origem: "local",
            tipo: config.title || "Chamado",
            categoria: formKey,
            assunto: option,
            opcaoEscolhida: option,
            opcao_escolhida: option,
            localizacao,
            endereco_completo: localizacao,
            detalhes,
            foto,
            fotoEvidencia: foto,
            nome_usuario: user.nome,
            cpf_usuario: user.cpf,
            foto_usuario: user.foto,
            citizenName: user.nome,
            citizenCpf: user.cpf,
            citizenPhoto: user.foto,
            reporterName: user.nome,
            reporterCpf: user.cpf,
            reporterPhoto: user.foto,
            anonima: false,
            prioridade: config.priority || "NORMAL",
            status: "PENDENTE",
            gps: getGps()
        });

        try {
            const response = await api("/api/ocorrencias", {
                method: "POST",
                body: JSON.stringify({
                    usuarioCpf: user.cpf,
                    tipo: occurrence.tipo,
                    categoria: formKey,
                    assunto: option,
                    opcaoEscolhida: option,
                    localizacao,
                    detalhes,
                    foto,
                    gps: getGps(),
                    prioridade: occurrence.prioridade
                })
            });
            if (response && response.data && response.data.id) {
                occurrence.id = response.data.id;
                occurrence.origem = "ocorrencia";
            }
        } catch (e) {}

        saveOccurrences([occurrence, ...localOccurrences()]);
        toast("🚀 Chamado enviado com sucesso!");
        if (el("confirmMsg")) el("confirmMsg").textContent = `Seu chamado "${option}" foi enviado com sucesso.`;
        if (event && event.target && event.target.reset) event.target.reset();
        nextScreen("confirmationScreen");
    };

    window.registrarAcaoAnonima = async function registrarAcaoAnonimaAtualizada(event) {
        if (event && event.preventDefault) event.preventDefault();
        const option = selectedAnonOption();
        const localizacao = val("anonLocation");
        const detalhes = val("anonDetails");
        const foto = await fileToBase64("anonFile");

        if (!option) {
            alert("Escolha uma opção da denúncia.");
            return;
        }

        if (!localizacao || !detalhes) {
            alert("Preencha localização e descrição.");
            return;
        }

        let occurrence = normalizeOccurrence({
            id: Date.now().toString(),
            origem: "local-anonima",
            tipo: "Denúncia Anônima",
            categoria: "anonymous",
            assunto: option,
            opcaoEscolhida: option,
            opcao_escolhida: option,
            localizacao,
            endereco_completo: localizacao,
            detalhes,
            foto,
            fotoEvidencia: foto,
            nome_usuario: "Anônimo",
            cpf_usuario: "",
            citizenName: "Anônimo",
            citizenCpf: "",
            reporterName: "Anônimo",
            reporterCpf: "",
            anonima: true,
            prioridade: "ALTA",
            status: "PENDENTE",
            gps: getGps()
        });

        try {
            const response = await api("/api/ocorrencias/anonima", {
                method: "POST",
                body: JSON.stringify({
                    tipo: "Denúncia Anônima",
                    categoria: "anonymous",
                    assunto: option,
                    opcaoEscolhida: option,
                    localizacao,
                    detalhes,
                    foto,
                    gps: getGps(),
                    prioridade: "ALTA"
                })
            });
            if (response && response.data && response.data.id) {
                occurrence.id = response.data.id;
                occurrence.origem = "anonima";
            }
        } catch (e) {}

        saveOccurrences([occurrence, ...localOccurrences()]);
        toast("🛡️ Denúncia enviada com sucesso!");
        if (el("confirmMsg")) el("confirmMsg").textContent = "Sua denúncia anônima foi enviada com sucesso.";
        if (event && event.target && event.target.reset) event.target.reset();
        nextScreen("confirmationScreen");
    };

    function ensurePetFields() {
        const form = el("petForm");
        if (!form || el("petSex")) return;
        const locationLabel = form.querySelector('label[for="petLocation"]');
        const wrap = document.createElement("div");
        wrap.innerHTML = `
            <label for="petSex">Sexo</label>
            <select id="petSex">
                <option value="NAO_INFORMADO">Não informado</option>
                <option value="MACHO">Macho</option>
                <option value="FEMEA">Fêmea</option>
            </select>
            <label for="petColor">Cor principal</label>
            <input type="text" id="petColor" placeholder="Ex: preto, caramelo, cinza">
            <label for="petWeight">Peso aproximado</label>
            <input type="number" id="petWeight" step="0.1" placeholder="Ex: 4.5">
            <label for="petMissingStatus">Situação do Pet</label>
            <select id="petMissingStatus" onchange="alternarCamposDesaparecido()">
                <option value="CADASTRADO">Pet cadastrado normalmente</option>
                <option value="DESAPARECIDO">Meu pet está desaparecido</option>
            </select>
            <div id="petMissingFields" class="pet-missing-fields hidden">
                <label for="petMissingLocation">Local onde desapareceu</label>
                <input type="text" id="petMissingLocation" placeholder="Rua, bairro ou ponto de referência">
                <button class="btn location-small-btn" type="button" onclick="usarMinhaLocalizacaoNoCampo('petMissingLocation')">Usar minha localização atual 📍</button>
                <label for="petMissingDetails">Detalhes do desaparecimento</label>
                <textarea id="petMissingDetails" placeholder="Coleira, comportamento, última vez visto..."></textarea>
            </div>
            <label for="petObservations">Observações</label>
            <textarea id="petObservations" placeholder="Temperamento, saúde, marcas, coleira..."></textarea>
        `;
        if (locationLabel) form.insertBefore(wrap, locationLabel);
    }

    window.alternarCamposDesaparecido = function alternarCamposDesaparecido() {
        const box = el("petMissingFields");
        const status = val("petMissingStatus");
        if (box) box.classList.toggle("hidden", status !== "DESAPARECIDO");
    };

    window.openPetForm = function openPetFormAtualizado() {
        ensurePetFields();
        const form = el("petForm");
        if (form) form.reset();
        const localizacao = typeof obterTextoLocalizacaoAtual === "function" ? obterTextoLocalizacaoAtual() : val("userFullAddress");
        if (localizacao && el("petLocation")) el("petLocation").value = localizacao;
        if (el("petMissingStatus")) el("petMissingStatus").value = "CADASTRADO";
        alternarCamposDesaparecido();
        nextScreen("scrPetForm");
    };

    window.abrirPetDesaparecido = function abrirPetDesaparecido() {
        openPetForm();
        if (el("petMissingStatus")) el("petMissingStatus").value = "DESAPARECIDO";
        const localizacao = typeof obterTextoLocalizacaoAtual === "function" ? obterTextoLocalizacaoAtual() : val("userFullAddress");
        if (localizacao && el("petMissingLocation")) el("petMissingLocation").value = localizacao;
        alternarCamposDesaparecido();
        toast("Preencha os dados do pet desaparecido.");
    };

    window.registrarPet = async function registrarPetAtualizado(event) {
        if (event && event.preventDefault) event.preventDefault();
        ensurePetFields();
        const user = currentUser();
        if (!user) {
            alert("Você precisa estar logado.");
            return;
        }

        const nome = val("petName");
        if (!nome) {
            alert("Informe o nome do pet.");
            return;
        }

        const desaparecido = val("petMissingStatus") === "DESAPARECIDO";
        const foto = await fileToBase64("petPhoto") || DEFAULT_PET_PHOTO;
        const pet = normalizePet({
            id: Date.now().toString(),
            donoCpf: user.cpf,
            donoNome: user.nome,
            nome,
            idade: Number(val("petAge") || 0),
            especie: val("petSpecies") || "Animal",
            raca: val("petBreed") || "Não informada",
            sexo: val("petSex") || "NAO_INFORMADO",
            cor: val("petColor") || "Não informada",
            peso: val("petWeight") || null,
            local: val("petLocation") || "Não informado",
            observacoes: val("petObservations"),
            foto,
            desaparecido,
            statusPet: desaparecido ? "DESAPARECIDO" : "CADASTRADO",
            localDesaparecimento: val("petMissingLocation"),
            detalhesDesaparecimento: val("petMissingDetails"),
            desaparecidoEm: desaparecido ? new Date().toISOString() : ""
        }, user.cpf);

        try {
            const response = await api("/api/pets", {
                method: "POST",
                body: JSON.stringify({
                    donoCpf: user.cpf,
                    nome: pet.nome,
                    idade: pet.idade,
                    especie: pet.especie,
                    raca: pet.raca,
                    sexo: pet.sexo,
                    cor: pet.cor,
                    peso: pet.peso,
                    local: pet.local,
                    observacoes: pet.observacoes,
                    foto: pet.foto,
                    desaparecido: pet.desaparecido,
                    statusPet: pet.statusPet,
                    localDesaparecimento: pet.localDesaparecimento,
                    detalhesDesaparecimento: pet.detalhesDesaparecimento
                })
            });
            if (response && response.pet && response.pet.id) {
                pet.id = response.pet.id;
            }
        } catch (e) {}

        upsertPet(pet);
        toast(pet.desaparecido ? "🚨 Pet desaparecido cadastrado e enviado aos profissionais." : "🐾 Pet cadastrado com sucesso!");
        if (el("confirmMsg")) el("confirmMsg").textContent = pet.desaparecido ? `O desaparecimento de "${pet.nome}" foi registrado.` : `O pet "${pet.nome}" foi cadastrado com sucesso.`;
        if (event && event.target && event.target.reset) event.target.reset();
        nextScreen("confirmationScreen");
    };

    function petCard(pet, mode) {
        const p = normalizePet(pet);
        const missing = p.desaparecido;
        const owner = p.donoNome || users().find(u => cpf(u.cpf) === cpf(p.donoCpf))?.nome || "Dono não informado";
        return `
            <div class="safe-life-pet-card ${missing ? "missing" : ""}">
                <div class="safe-life-pet-top">
                    <img class="safe-life-pet-photo" src="${esc(p.foto)}" alt="Foto do pet">
                    <div class="safe-life-pet-info">
                        <h4>${missing ? "🚨" : "🐾"} ${esc(p.nome)}</h4>
                        <small>${esc(p.especie)} • ${esc(p.raca)}</small><br>
                        <span class="${missing ? "safe-life-alert-badge" : "safe-life-normal-badge"}">${missing ? "DESAPARECIDO" : "CADASTRADO"}</span>
                    </div>
                </div>
                <div class="safe-life-pet-lines">
                    <div class="safe-life-pet-line"><strong>Idade:</strong> ${esc(p.idade || "Não informada")} anos</div>
                    <div class="safe-life-pet-line"><strong>Sexo:</strong> ${esc(p.sexo || "Não informado")}</div>
                    <div class="safe-life-pet-line"><strong>Cor:</strong> ${esc(p.cor || "Não informada")}</div>
                    <div class="safe-life-pet-line"><strong>Endereço:</strong> ${esc(p.local || p.localizacao || "Não informado")}</div>
                    ${mode === "professional" ? `<div class="safe-life-pet-line"><strong>Dono:</strong> ${esc(owner)} ${p.donoCpf ? `• CPF: ${esc(p.donoCpf)}` : ""}</div>` : ""}
                    ${p.observacoes ? `<div class="safe-life-pet-line"><strong>Observações:</strong> ${esc(p.observacoes)}</div>` : ""}
                    ${missing ? `<div class="safe-life-pet-line"><strong>Último local visto:</strong> ${esc(p.localDesaparecimento || p.local_desaparecimento || p.local || "Não informado")}</div>` : ""}
                    ${missing && (p.detalhesDesaparecimento || p.detalhes_desaparecimento) ? `<div class="safe-life-pet-line"><strong>Detalhes:</strong> ${esc(p.detalhesDesaparecimento || p.detalhes_desaparecimento)}</div>` : ""}
                </div>
                ${mode === "citizen" ? `
                    <div class="safe-life-pet-actions">
                        <button class="btn ${missing ? "secondary-btn" : ""}" type="button" onclick="marcarPetDesaparecidoDireto('${esc(String(p.id))}')">${missing ? "Marcar encontrado" : "Pet desapareceu"}</button>
                        <button class="btn secondary-btn" type="button" onclick="renderPerfilCidadao()">Atualizar</button>
                    </div>
                ` : ""}
            </div>
        `;
    }

    window.marcarPetDesaparecidoDireto = async function marcarPetDesaparecidoDireto(id) {
        const list = localPets();
        const index = list.findIndex(pet => String(pet.id) === String(id));
        if (index === -1) return;
        const pet = list[index];
        const next = !pet.desaparecido;
        pet.desaparecido = next;
        pet.statusPet = next ? "DESAPARECIDO" : "CADASTRADO";
        pet.status_pet = pet.statusPet;
        if (next) {
            pet.localDesaparecimento = prompt("Onde o pet desapareceu?", pet.local || "") || pet.local || "Não informado";
            pet.detalhesDesaparecimento = prompt("Algum detalhe importante?", pet.detalhesDesaparecimento || "") || "";
            pet.desaparecidoEm = new Date().toISOString();
        } else {
            pet.encontradoEm = new Date().toISOString();
        }
        savePets(list);
        try {
            await api(`/api/pets/${pet.id}/desaparecido`, {
                method: "PATCH",
                body: JSON.stringify({
                    desaparecido: pet.desaparecido,
                    localDesaparecimento: pet.localDesaparecimento,
                    detalhesDesaparecimento: pet.detalhesDesaparecimento
                })
            });
        } catch (e) {}
        toast(next ? "🚨 Pet marcado como desaparecido." : "✅ Pet marcado como encontrado.");
        renderPerfilCidadao();
    };

    window.renderPerfilCidadao = async function renderPerfilCidadaoAtualizado() {
        const user = currentUser();
        if (!user) {
            nextScreen("loginScreen");
            return;
        }
        if (el("profileAvatar")) el("profileAvatar").src = user.foto || DEFAULT_USER_PHOTO;
        if (el("citizenProfileName")) el("citizenProfileName").textContent = user.nome || "Cidadão";
        if (el("citizenProfileType")) el("citizenProfileType").textContent = "Cidadão";
        if (el("citizenProfileContact")) {
            el("citizenProfileContact").innerHTML = `CPF: ${esc(user.cpf)}<br>E-mail: ${esc(user.email || "Não informado")}<br>Telefone: ${esc(user.telefone || "Não informado")}`;
        }
        if (el("editName")) el("editName").value = user.nome || "";
        if (el("editEmail")) el("editEmail").value = user.email || "";
        if (el("editPhone")) el("editPhone").value = user.telefone || "";

        const pets = await loadPets({ donoCpf: user.cpf });
        const notifications = get(NOTIF_KEY, []).filter(item => !item.citizenCpf || cpf(item.citizenCpf) === cpf(user.cpf));
        const history = get(HISTORY_KEY, []).filter(item => !item.citizenCpf || cpf(item.citizenCpf || item.cpf_usuario || item.reporterCpf) === cpf(user.cpf));
        const container = el("myPetsContainer");
        if (container) {
            container.innerHTML = `
                <div class="safe-life-profile-block">
                    <h4>🔔 Notificações</h4>
                    ${notifications.length ? notifications.map(n => `<div class="safe-notification-card"><div class="safe-notification-icon">🔔</div><div><strong>${esc(n.title || "Atualização")}</strong><p>${esc(n.message || "Sua ocorrência recebeu uma atualização.")}</p><small>${esc(n.createdAt || "")}</small></div></div>`).join("") : `<p class="empty-message">Nenhuma notificação ainda.</p>`}
                </div>
                <div class="safe-life-profile-block">
                    <h4>🐾 Meus Pets</h4>
                    <div class="safe-life-pet-grid">${pets.length ? pets.map(p => petCard(p, "citizen")).join("") : `<p class="empty-message">Nenhum pet cadastrado ainda.</p>`}</div>
                </div>
                <div class="safe-life-profile-block">
                    <h4>✅ Ocorrências realizadas</h4>
                    ${history.length ? history.map(h => `<div class="occurrence-card"><h4>✅ ${esc(h.opcaoEscolhida || h.assunto || "Ocorrência")}</h4><p><strong>Descrição:</strong> ${esc(h.detalhes || "Sem descrição")}</p><p><strong>Profissional:</strong> ${esc(h.profissionalNome || "Profissional")}</p><small>${esc(h.concluidaEm || h.completedAt || "")}</small></div>`).join("") : `<p class="empty-message">Nenhuma ocorrência concluída ainda.</p>`}
                </div>
            `;
        }
        nextScreen("citizenProfile");
    };

    window.inicializarPainelPro = async function inicializarPainelProAtualizado() {
        const user = currentUser();
        if (!user) {
            nextScreen("loginScreen");
            return;
        }
        if (el("proWelcomeName")) el("proWelcomeName").textContent = user.nome || "Profissional";
        if (el("proCompanyName")) el("proCompanyName").textContent = `🏢 ${user.company || "Safe Life Matriz"}`;
        if (el("proAvatar")) el("proAvatar").src = user.foto || DEFAULT_USER_PHOTO;
        const list = (await loadOccurrences()).filter(isPending);
        if (el("statTotal")) el("statTotal").textContent = list.length;
        if (el("statAnon")) el("statAnon").textContent = list.filter(o => o.anonima || o.origem === "anonima").length;
        if (el("statEmergency")) el("statEmergency").textContent = list.filter(o => String(o.prioridade || "").toUpperCase() === "ALTA" || String(o.prioridade || "").toUpperCase() === "CRITICA").length;
        nextScreen("proDashboard");
    };

    window.renderPerfilProfissional = function renderPerfilProfissionalAtualizado() {
        const user = currentUser();
        if (!user) return;
        if (el("professionalProfileAvatar")) el("professionalProfileAvatar").src = user.foto || DEFAULT_USER_PHOTO;
        if (el("professionalProfileName")) el("professionalProfileName").textContent = user.nome || "Profissional";
        if (el("professionalProfileCompany")) el("professionalProfileCompany").textContent = user.company || "Safe Life Matriz";
        if (el("editProName")) el("editProName").value = user.nome || "";
        if (el("editProCpf")) el("editProCpf").value = user.cpf || "";
        if (el("editProEmail")) el("editProEmail").value = user.email || "";
        if (el("editProPhone")) el("editProPhone").value = user.telefone || "";
        if (el("editProCompany")) el("editProCompany").value = user.company || "Safe Life Matriz";
        nextScreen("professionalProfile");
    };

    function occurrenceCard(item) {
        const o = normalizeOccurrence(item);
        const photo = o.foto || o.fotoEvidencia;
        const reporter = o.anonima || o.origem === "anonima" ? "Denúncia Anônima" : o.nome_usuario;
        return `
            <article class="prof-occurrence-card ${o.anonima || o.origem === "anonima" ? "anon" : ""}">
                <div class="prof-occurrence-top">
                    ${o.anonima || o.origem === "anonima" ? `<div class="anon-avatar">🕶️</div>` : `<img class="reporter-avatar" src="${esc(o.foto_usuario || DEFAULT_USER_PHOTO)}" alt="Foto do cidadão">`}
                    <div class="prof-occurrence-meta">
                        <h4>${esc(o.opcaoEscolhida || o.assunto)}</h4>
                        <p><strong>Nome:</strong> ${esc(reporter)}</p>
                        <small>${esc(o.tipo)} • ${esc(o.status)}</small>
                    </div>
                </div>
                <div class="prof-occurrence-body">
                    <div class="prof-line"><strong>Endereço atual:</strong><br>${esc(o.localizacao)}</div>
                    <div class="prof-line"><strong>Descrição:</strong><br>${esc(o.detalhes)}</div>
                    ${photo ? `<img class="evidence-image" src="${esc(photo)}" alt="Foto enviada">` : `<div class="evidence-empty">Nenhuma foto enviada.</div>`}
                    <div class="prof-actions-inline">
                        <button class="btn secondary-btn" type="button" onclick="marcarEmAtendimentoAtualizado('${esc(String(o.origem))}', '${esc(String(o.id))}')">Em atendimento</button>
                        <button class="btn" type="button" onclick="concluirOcorrenciaProfissional('${esc(String(o.origem))}', '${esc(String(o.id))}')">Concluir</button>
                    </div>
                </div>
            </article>
        `;
    }

    window.abrirOcorrenciasPro = async function abrirOcorrenciasProAtualizado() {
        const container = el("listaIntegradaPro");
        const list = (await loadOccurrences()).filter(isPending);
        if (container) {
            container.innerHTML = list.length ? list.map(occurrenceCard).join("") : `<div class="occurrence-card"><h4>Nenhum chamado pendente</h4><p>Quando um cidadão enviar uma ocorrência, ela aparece aqui.</p></div>`;
        }
        nextScreen("proListScreen");
    };

    window.marcarEmAtendimentoAtualizado = async function marcarEmAtendimentoAtualizado(origem, id) {
        const list = localOccurrences();
        const item = list.find(o => String(o.id) === String(id) && String(o.origem) === String(origem));
        if (item) item.status = "EM_ATENDIMENTO";
        saveOccurrences(list);
        try {
            if (origem === "ocorrencia" || origem === "anonima") {
                await api(`/api/chamados/${origem}/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: "EM_ATENDIMENTO", funcionarioCpf: currentUser()?.cpf || null }) });
            }
        } catch (e) {}
        toast("🚑 Chamado marcado como em atendimento.");
        abrirOcorrenciasPro();
    };

    window.concluirOcorrenciaProfissional = async function concluirOcorrenciaProfissionalAtualizada(origem, id) {
        const user = currentUser() || { nome: "Profissional", cpf: "", company: "Safe Life Matriz" };
        const list = localOccurrences();
        const index = list.findIndex(o => String(o.id) === String(id) && String(o.origem) === String(origem));
        if (index === -1) {
            toast("Ocorrência não encontrada.");
            return;
        }
        const item = normalizeOccurrence(list[index]);
        const completed = {
            ...item,
            status: "CONCLUIDA",
            profissionalNome: user.nome,
            profissionalCpf: user.cpf,
            empresaProfissional: user.company || "Safe Life Matriz",
            concluidaEm: new Date().toLocaleString("pt-BR"),
            completedAt: new Date().toLocaleString("pt-BR")
        };
        list.splice(index, 1);
        saveOccurrences(list);
        const hist = get(HISTORY_KEY, []);
        hist.unshift(completed);
        set(HISTORY_KEY, hist);
        const notifs = get(NOTIF_KEY, []);
        if (completed.citizenCpf || completed.cpf_usuario) {
            notifs.unshift({
                id: Date.now().toString(),
                citizenCpf: completed.citizenCpf || completed.cpf_usuario,
                title: "Ocorrência concluída",
                message: `O profissional ${user.nome} concluiu o atendimento de ${completed.opcaoEscolhida || completed.assunto}.`,
                occurrenceId: completed.id,
                createdAt: new Date().toLocaleString("pt-BR")
            });
            set(NOTIF_KEY, notifs);
        }
        try {
            if (origem === "ocorrencia" || origem === "anonima") {
                await api(`/api/chamados/${origem}/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: "CONCLUIDA", funcionarioCpf: user.cpf }) });
            }
        } catch (e) {}
        toast("✅ Atendimento concluído. O cidadão recebeu a notificação.");
        abrirOcorrenciasPro();
    };

    window.abrirPetsCadastradosPro = async function abrirPetsCadastradosPro() {
        const title = document.querySelector("#shiftReportScreen header h1");
        const subtitle = document.querySelector("#shiftReportScreen header p");
        const container = el("shiftReportBox");
        const pets = await loadPets();
        const sorted = pets.slice().sort((a, b) => Number(normalizePet(b).desaparecido) - Number(normalizePet(a).desaparecido));
        if (title) title.textContent = "Pets Cadastrados";
        if (subtitle) subtitle.textContent = "Pets dos cidadãos e alertas de desaparecimento";
        if (container) {
            container.innerHTML = `
                <div class="occurrence-card">
                    <h4>🐾 Pets cadastrados no Safe Life</h4>
                    <p><strong>Total:</strong> ${sorted.length}</p>
                    <p><strong>Desaparecidos:</strong> ${sorted.filter(p => normalizePet(p).desaparecido).length}</p>
                </div>
                <div class="safe-life-pet-grid">${sorted.length ? sorted.map(p => petCard(p, "professional")).join("") : `<p class="empty-message">Nenhum pet cadastrado ainda.</p>`}</div>
            `;
        }
        nextScreen("shiftReportScreen");
    };

    window.abrirRelatorioPlantao = window.abrirPetsCadastradosPro;

    window.abrirAgentesAtivos = async function abrirAgentesAtivosAtualizado() {
        const container = el("activeAgentsList");
        const pro = currentUser() || { nome: "Profissional", company: "Safe Life Matriz", foto: "" };
        const chamados = (await loadOccurrences()).filter(isPending);
        if (container) {
            container.innerHTML = `
                <div class="agent-card active"><div class="agent-top"><img class="agent-avatar" src="${esc(pro.foto || DEFAULT_USER_PHOTO)}" alt="Agente"><div class="agent-info"><h4>${esc(pro.nome)}</h4><p>${esc(pro.company || "Safe Life Matriz")}</p><small>Chamados pendentes: ${chamados.length}</small></div></div><div class="agent-status-row"><span class="agent-chip green">Disponível</span><span class="agent-chip">10 min</span></div></div>
                <div class="agent-card active"><div class="agent-top"><div class="nearest-icon">🚑</div><div class="agent-info"><h4>Equipe de Apoio</h4><p>Base parceira</p><small>Disponível para reforço</small></div></div><div class="agent-status-row"><span class="agent-chip green">Ativo</span><span class="agent-chip">15 min</span></div></div>
            `;
        }
        nextScreen("activeAgentsScreen");
    };

    window.abrirOcorrenciaMaisProxima = async function abrirOcorrenciaMaisProximaAtualizada() {
        const container = el("nearestOccurrenceBox");
        const list = (await loadOccurrences()).filter(isPending);
        if (container) container.innerHTML = list.length ? occurrenceCard(list[0]) : `<div class="occurrence-card"><h4>Nenhuma ocorrência próxima</h4><p>A fila está vazia.</p></div>`;
        nextScreen("nearestOccurrenceScreen");
    };

    window.abrirFilaPrioridade = async function abrirFilaPrioridadeAtualizada() {
        const container = el("priorityQueueList");
        const weight = { CRITICA: 1, ALTA: 2, NORMAL: 3, BAIXA: 4 };
        const list = (await loadOccurrences()).filter(isPending).sort((a, b) => (weight[String(a.prioridade || "NORMAL").toUpperCase()] || 3) - (weight[String(b.prioridade || "NORMAL").toUpperCase()] || 3));
        if (container) container.innerHTML = list.length ? list.map(occurrenceCard).join("") : `<div class="occurrence-card"><h4>Fila vazia</h4><p>Nenhum chamado pendente.</p></div>`;
        nextScreen("priorityQueueScreen");
    };

    window.inicializarPainelAdmin = function inicializarPainelAdminAtualizado() {
        let admin = users().find(user => cpf(user.cpf) === ADMIN);
        if (!admin) {
            admin = upsertUser({ nome: "Gustavo Siri", cpf: ADMIN, email: "gustavo.siriguejo@safelife.com", type: "admin", company: "Safe Life Matriz", foto: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80" });
        }
        setCurrent(admin);
        if (el("adminAvatar")) el("adminAvatar").src = admin.foto || DEFAULT_USER_PHOTO;
        if (el("adminWelcomeName")) el("adminWelcomeName").textContent = admin.nome || "Gustavo Siri";
        if (el("adminCpfText")) el("adminCpfText").textContent = `CPF: ${ADMIN}`;
        if (el("adminStatUsers")) el("adminStatUsers").textContent = users().length;
        if (el("adminStatProfessionals")) el("adminStatProfessionals").textContent = users().filter(u => (u.type || u.tipo) === "professional").length;
        if (el("adminStatReports")) el("adminStatReports").textContent = localOccurrences().length + get(HISTORY_KEY, []).length;
        if (el("adminStatSuspicious")) el("adminStatSuspicious").textContent = users().filter(u => u.ativo === false || !u.email).length;
        document.querySelectorAll(".admin-tool-card").forEach(card => {
            const text = card.textContent || "";
            if (text.includes("Painel Profissional") || text.includes("Auditoria")) card.remove();
        });
        nextScreen("adminDashboard");
    };

    function boot() {
        ensurePetFields();
        document.querySelectorAll(".admin-tool-card").forEach(card => {
            const text = card.textContent || "";
            if (text.includes("Painel Profissional") || text.includes("Auditoria")) card.remove();
        });
        const proButtons = document.querySelectorAll(".professional-tool-card");
        proButtons.forEach(button => {
            if ((button.textContent || "").includes("Relatório")) {
                button.setAttribute("onclick", "abrirPetsCadastradosPro()");
                const span = button.querySelector("span");
                const strong = button.querySelector("strong");
                const small = button.querySelector("small");
                if (span) span.textContent = "🐾";
                if (strong) strong.textContent = "Ver Pets Cadastrados";
                if (small) small.textContent = "Ver pets dos cidadãos e desaparecidos.";
            }
        });
        const petForm = el("petForm");
        if (petForm) petForm.onsubmit = window.registrarPet;
        const citizenForm = el("citizenForm");
        if (citizenForm) citizenForm.onsubmit = window.registrarAcao;
        const anonForm = el("anonForm");
        if (anonForm) anonForm.onsubmit = window.registrarAcaoAnonima;
    }

    document.addEventListener("DOMContentLoaded", boot);
})();


(function () {
    function field(id) { return document.getElementById(id); }
    function petMode() { return (field('petMode')?.value || 'CADASTRO').toUpperCase(); }
    function locationText() {
        try {
            if (typeof window.obterTextoLocalizacaoAtual === 'function') {
                const txt = window.obterTextoLocalizacaoAtual();
                if (txt) return txt;
            }
        } catch (e) {}
        try {
            if (window.localizacaoUsuario && window.localizacaoUsuario.enderecoCompleto) return window.localizacaoUsuario.enderecoCompleto;
        } catch (e) {}
        const full = field('userFullAddress')?.value || field('realAddressText')?.textContent || '';
        return String(full).trim();
    }

    function configurePetForm(mode) {
        const missing = mode === 'DESAPARECIDO';
        if (field('petMode')) field('petMode').value = missing ? 'DESAPARECIDO' : 'CADASTRO';
        const headerTitle = document.querySelector('#scrPetForm header h1');
        const headerSub = document.querySelector('#scrPetForm header p');
        const shell = field('petFormShell');
        const chip = field('petFormChip');
        const innerTitle = field('petFormInnerTitle');
        const innerSub = field('petFormInnerSubtitle');
        const sideIcon = field('petFormSideIcon');
        const missingFields = field('petMissingFields');
        const submitBtn = field('petSubmitButton');
        if (headerTitle) headerTitle.textContent = missing ? 'Pet Desaparecido' : 'Cadastrar Pet';
        if (headerSub) headerSub.textContent = missing ? 'Informe os dados para ajudar os profissionais na busca' : 'Cadastre o seu animal de forma rápida e bonita';
        if (chip) chip.textContent = missing ? '🚨 Alerta de desaparecimento' : '🐾 Cadastro bonito e rápido';
        if (innerTitle) innerTitle.textContent = missing ? 'Informações do pet desaparecido' : 'Cadastro do pet';
        if (innerSub) innerSub.textContent = missing ? 'Preencha os dados principais e o último local onde ele foi visto.' : 'Preencha as informações principais do seu animal.';
        if (sideIcon) sideIcon.textContent = missing ? '🚨' : '🐾';
        if (submitBtn) submitBtn.textContent = missing ? 'Registrar alerta 🚨' : 'Salvar Pet 🐾';
        if (missingFields) missingFields.classList.toggle('hidden', !missing);
        if (shell) shell.classList.toggle('is-missing', missing);
    }

    window.usarMinhaLocalizacaoNoCampo = async function usarMinhaLocalizacaoNoCampoNovo(campoId) {
        const campo = field(campoId);
        if (!campo) return;
        const cached = locationText();
        if (cached) {
            campo.value = cached;
            if (typeof triggerToast === 'function') triggerToast('📍 Localização atual preenchida.');
            else if (typeof toast === 'function') toast('📍 Localização atual preenchida.');
            return;
        }
        try {
            if (typeof solicitarLocalizacao === 'function') {
                await solicitarLocalizacao({ preencherCampo: campoId });
                const updated = locationText();
                if (updated && !campo.value) campo.value = updated;
            }
            if (!campo.value) {
                const fallback = locationText();
                if (fallback) campo.value = fallback;
            }
            if (campo.value && typeof triggerToast === 'function') triggerToast('📍 Localização atual preenchida.');
        } catch (erro) {
            console.log(erro);
            if (typeof toast === 'function') toast('Não foi possível preencher a localização atual.');
        }
    };

    window.openPetForm = function openPetFormFinal() {
        const form = field('petForm');
        if (form) form.reset();
        configurePetForm('CADASTRO');
        const local = locationText();
        if (local && field('petLocation')) field('petLocation').value = local;
        nextScreen('scrPetForm');
    };

    window.abrirPetDesaparecido = function abrirPetDesaparecidoFinal() {
        const form = field('petForm');
        if (form) form.reset();
        configurePetForm('DESAPARECIDO');
        const local = locationText();
        if (local && field('petLocation')) field('petLocation').value = local;
        if (local && field('petMissingLocation')) field('petMissingLocation').value = local;
        nextScreen('scrPetForm');
    };

    window.registrarPet = async function registrarPetFinal(event) {
        if (event && event.preventDefault) event.preventDefault();
        const user = currentUser();
        if (!user) {
            alert('Você precisa estar logado.');
            return;
        }
        const nome = val('petName');
        if (!nome) {
            alert('Informe o nome do pet.');
            return;
        }
        const missing = petMode() === 'DESAPARECIDO';
        if (missing && !val('petMissingLocation')) {
            alert('Informe o último local visto do pet.');
            return;
        }
        const foto = await fileToBase64('petPhoto') || DEFAULT_PET_PHOTO;
        const pet = normalizePet({
            id: Date.now().toString(),
            donoCpf: user.cpf,
            donoNome: user.nome,
            nome,
            idade: Number(val('petAge') || 0),
            especie: val('petSpecies') || 'Animal',
            raca: val('petBreed') || 'Não informada',
            sexo: val('petSex') || 'NAO_INFORMADO',
            cor: val('petColor') || 'Não informada',
            local: val('petLocation') || 'Não informado',
            observacoes: val('petObservations'),
            foto,
            desaparecido: missing,
            statusPet: missing ? 'DESAPARECIDO' : 'CADASTRADO',
            localDesaparecimento: missing ? val('petMissingLocation') : '',
            detalhesDesaparecimento: missing ? val('petMissingDetails') : '',
            desaparecidoEm: missing ? new Date().toISOString() : ''
        }, user.cpf);
        try {
            const response = await api('/api/pets', {
                method: 'POST',
                body: JSON.stringify({
                    donoCpf: user.cpf,
                    nome: pet.nome,
                    idade: pet.idade,
                    especie: pet.especie,
                    raca: pet.raca,
                    sexo: pet.sexo,
                    cor: pet.cor,
                    peso: null,
                    local: pet.local,
                    observacoes: pet.observacoes,
                    foto: pet.foto,
                    desaparecido: pet.desaparecido,
                    statusPet: pet.statusPet,
                    localDesaparecimento: pet.localDesaparecimento,
                    detalhesDesaparecimento: pet.detalhesDesaparecimento
                })
            });
            if (response && response.pet && response.pet.id) pet.id = response.pet.id;
        } catch (e) {}
        upsertPet(pet);
        if (typeof toast === 'function') toast(missing ? '🚨 Alerta de pet desaparecido registrado.' : '🐾 Pet cadastrado com sucesso!');
        if (event && event.target && event.target.reset) event.target.reset();
        configurePetForm('CADASTRO');
        nextScreen('confirmationScreen');
    };

    function missingPetCard(pet) {
        const p = normalizePet(pet);
        const owner = p.donoNome || users().find(u => cpf(u.cpf) === cpf(p.donoCpf))?.nome || 'Dono não informado';
        return `
            <div class="missing-pet-card">
                <div class="missing-pet-header">
                    <img class="missing-pet-photo" src="${esc(p.foto)}" alt="Foto do pet">
                    <div>
                        <h4>🚨 ${esc(p.nome)}</h4>
                        <p>${esc(p.especie)} • ${esc(p.raca || 'Raça não informada')}</p>
                        <span class="missing-pet-badge">PET DESAPARECIDO</span>
                    </div>
                </div>
                <div class="missing-pet-lines">
                    <div class="missing-pet-line"><strong>Dono:</strong> ${esc(owner)}</div>
                    <div class="missing-pet-line"><strong>Último local visto:</strong> ${esc(p.localDesaparecimento || p.local || 'Não informado')}</div>
                    <div class="missing-pet-line"><strong>Cor:</strong> ${esc(p.cor || 'Não informada')} • <strong>Idade:</strong> ${esc(p.idade || 'Não informada')} anos</div>
                    ${(p.detalhesDesaparecimento || p.detalhes_desaparecimento) ? `<div class="missing-pet-line"><strong>Detalhes:</strong> ${esc(p.detalhesDesaparecimento || p.detalhes_desaparecimento)}</div>` : ''}
                </div>
            </div>
        `;
    }

    window.abrirAgentesAtivos = async function abrirPetsDesaparecidosFinal() {
        const headTitle = document.querySelector('#activeAgentsScreen header h1');
        const headText = document.querySelector('#activeAgentsScreen header p');
        const introTitle = document.querySelector('#activeAgentsScreen .occurrence-card h4');
        const introText = document.querySelector('#activeAgentsScreen .occurrence-card p');
        const container = field('activeAgentsList');
        const pets = (await loadPets()).map(normalizePet).filter(p => p.desaparecido);
        if (headTitle) headTitle.textContent = 'Pets Desaparecidos';
        if (headText) headText.textContent = 'Área rápida para visualizar os pets desaparecidos com foto e detalhes';
        if (introTitle) introTitle.textContent = '🚨 Alertas de pets desaparecidos';
        if (introText) introText.textContent = 'Veja os pets desaparecidos e as informações principais para ajudar na busca.';
        if (container) {
            container.innerHTML = pets.length ? `
                <div class="professional-missing-wrapper">
                    <div class="professional-missing-summary">
                        <div class="professional-summary-card"><strong>${pets.length}</strong><span>Pets desaparecidos</span></div>
                        <div class="professional-summary-card"><strong>${new Set(pets.map(p => p.donoCpf)).size}</strong><span>Tutores aguardando ajuda</span></div>
                    </div>
                    <div class="missing-pet-grid">${pets.map(missingPetCard).join('')}</div>
                </div>
            ` : '<div class="occurrence-card"><h4>Nenhum pet desaparecido</h4><p>No momento não há alertas ativos.</p></div>';
        }
        nextScreen('activeAgentsScreen');
    };

    function refreshProfessionalButton() {
        const buttons = document.querySelectorAll('.professional-tool-card');
        if (buttons[0]) {
            buttons[0].setAttribute('onclick', 'abrirAgentesAtivos()');
            const icon = buttons[0].querySelector('span');
            const title = buttons[0].querySelector('strong');
            const text = buttons[0].querySelector('small');
            if (icon) icon.textContent = '🚨';
            if (title) title.textContent = 'Pets Desaparecidos';
            if (text) text.textContent = 'Ver cards com foto e detalhes dos pets desaparecidos.';
        }
    }

    function setup() {
        configurePetForm('CADASTRO');
        refreshProfessionalButton();
        const petForm = field('petForm');
        if (petForm) petForm.onsubmit = window.registrarPet;
        const missingMenuBtn = Array.from(document.querySelectorAll('#menuScreen .action-card span:last-child')).find(el => el.textContent.includes('Pet Desaparecido') || el.textContent.includes('Meu Pet'));
        if (missingMenuBtn) missingMenuBtn.textContent = 'Pet Desaparecido';
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
    else setup();
})();


(function () {
    function currentAddressText() {
        try {
            if (typeof localizacaoUsuario !== 'undefined' && localizacaoUsuario && localizacaoUsuario.enderecoCompleto) return localizacaoUsuario.enderecoCompleto;
        } catch (e) {}
        var full = val('userFullAddress');
        if (full) return full;
        var parts = [val('realStreet'), val('realNeighborhood'), val('realCity'), val('realState')].filter(Boolean);
        return parts.join(', ');
    }

    window.obterTextoLocalizacaoAtual = function () {
        return currentAddressText();
    };

    window.obterLocalizacaoAtualObjeto = function () {
        return {
            enderecoCompleto: currentAddressText(),
            latitude: val('userLatitude') || '',
            longitude: val('userLongitude') || '',
            bairro: val('userNeighborhood') || val('realNeighborhood') || '',
            cidade: val('userCity') || val('realCity') || '',
            estado: val('userState') || val('realState') || ''
        };
    };

    window.usarMinhaLocalizacaoNoCampo = async function (campoId) {
        var campo = document.getElementById(campoId);
        if (!campo) return;
        var before = currentAddressText();
        if (before) {
            campo.value = before;
            if (typeof triggerToast === 'function') triggerToast('📍 Localização preenchida.');
            else if (typeof toast === 'function') toast('📍 Localização preenchida.');
            return;
        }
        try {
            if (typeof solicitarLocalizacao === 'function') {
                await solicitarLocalizacao({ preencherCampo: campoId });
            }
        } catch (e) {}
        var after = currentAddressText();
        if (after) {
            campo.value = after;
            if (typeof triggerToast === 'function') triggerToast('📍 Localização preenchida.');
            else if (typeof toast === 'function') toast('📍 Localização preenchida.');
        } else {
            alert('Ative a localização primeiro para preencher o endereço.');
        }
    };

    function setPetMode(mode) {
        var form = el('petForm');
        if (form) form.dataset.mode = mode;
        var box = el('petMissingFields');
        if (box) box.classList.toggle('hidden', mode !== 'missing');
        var heroTitle = el('petFormHeroTitle');
        var heroText = el('petFormHeroText');
        var submit = el('petSubmitButton');
        var headerTitle = document.querySelector('#scrPetForm header h1');
        var headerText = document.querySelector('#scrPetForm header p');
        if (mode === 'missing') {
            if (headerTitle) headerTitle.textContent = 'Pet Desaparecido';
            if (headerText) headerText.textContent = 'Informe a foto e os dados para ajudar na busca';
            if (heroTitle) heroTitle.textContent = 'Alerta de Pet Desaparecido';
            if (heroText) heroText.textContent = 'Preencha as informações para os profissionais verem rápido e ajudarem na busca.';
            if (submit) submit.textContent = 'Enviar Alerta 🚨';
        } else {
            if (headerTitle) headerTitle.textContent = 'Cadastrar Meu Pet';
            if (headerText) headerText.textContent = 'Registre seu animal no Safe Life';
            if (heroTitle) heroTitle.textContent = 'Cadastro do Pet';
            if (heroText) heroText.textContent = 'Preencha os dados principais para deixar o cadastro bonito e completo.';
            if (submit) submit.textContent = 'Salvar Pet 🐾';
        }
    }

    window.openPetForm = function () {
        var form = el('petForm');
        if (form) form.reset();
        setPetMode('register');
        var local = currentAddressText();
        if (local && el('petLocation')) el('petLocation').value = local;
        nextScreen('scrPetForm');
    };

    window.abrirPetDesaparecido = function () {
        var form = el('petForm');
        if (form) form.reset();
        setPetMode('missing');
        var local = currentAddressText();
        if (local && el('petMissingLocation')) el('petMissingLocation').value = local;
        if (local && el('petLocation')) el('petLocation').value = local;
        nextScreen('scrPetForm');
    };

    window.registrarPet = async function (event) {
        if (event && event.preventDefault) event.preventDefault();
        var user = currentUser();
        if (!user) {
            alert('Você precisa estar logado.');
            return;
        }
        var form = el('petForm');
        var isMissing = form && form.dataset.mode === 'missing';
        var nome = val('petName');
        if (!nome) return alert('Informe o nome do pet.');
        if (isMissing && !val('petMissingLocation')) return alert('Informe o último local visto do pet.');
        var foto = await fileToBase64('petPhoto') || DEFAULT_PET_PHOTO;
        var pet = normalizePet({
            id: Date.now().toString(),
            donoCpf: user.cpf,
            donoNome: user.nome,
            nome: nome,
            idade: Number(val('petAge') || 0),
            especie: val('petSpecies') || 'Animal',
            raca: val('petBreed') || 'Não informada',
            sexo: val('petSex') || 'NAO_INFORMADO',
            cor: val('petColor') || 'Não informada',
            peso: null,
            local: val('petLocation') || 'Não informado',
            observacoes: val('petObservations'),
            foto: foto,
            desaparecido: isMissing,
            statusPet: isMissing ? 'DESAPARECIDO' : 'CADASTRADO',
            localDesaparecimento: isMissing ? val('petMissingLocation') : '',
            detalhesDesaparecimento: isMissing ? val('petMissingDetails') : '',
            desaparecidoEm: isMissing ? new Date().toISOString() : ''
        }, user.cpf);
        try {
            var response = await api('/api/pets', {
                method: 'POST',
                body: JSON.stringify({
                    donoCpf: user.cpf,
                    nome: pet.nome,
                    idade: pet.idade,
                    especie: pet.especie,
                    raca: pet.raca,
                    sexo: pet.sexo,
                    cor: pet.cor,
                    peso: null,
                    local: pet.local,
                    observacoes: pet.observacoes,
                    foto: pet.foto,
                    desaparecido: pet.desaparecido,
                    statusPet: pet.statusPet,
                    localDesaparecimento: pet.localDesaparecimento,
                    detalhesDesaparecimento: pet.detalhesDesaparecimento
                })
            });
            if (response && response.pet && response.pet.id) pet.id = response.pet.id;
        } catch (e) {}
        upsertPet(pet);
        if (typeof toast === 'function') toast(isMissing ? '🚨 Alerta de pet desaparecido enviado.' : '🐾 Pet cadastrado com sucesso!');
        if (el('confirmMsg')) el('confirmMsg').textContent = isMissing ? 'O alerta do pet desaparecido foi enviado.' : 'O pet foi cadastrado com sucesso.';
        nextScreen('confirmationScreen');
    };

    window.abrirAgentesAtivos = async function () {
        var headTitle = document.querySelector('#activeAgentsScreen header h1');
        var headText = document.querySelector('#activeAgentsScreen header p');
        var introTitle = document.querySelector('#activeAgentsScreen .occurrence-card h4');
        var introText = document.querySelector('#activeAgentsScreen .occurrence-card p');
        var container = el('activeAgentsList');
        var pets = (await loadPets()).map(normalizePet).filter(function (p) { return p.desaparecido; });
        if (headTitle) headTitle.textContent = 'Pets Desaparecidos';
        if (headText) headText.textContent = 'Veja os pets que desapareceram com foto e informações importantes.';
        if (introTitle) introTitle.textContent = '🚨 Alertas de pets desaparecidos';
        if (introText) introText.textContent = 'Veja os pets que desapareceram, com foto e informações importantes para ajudar na busca.';
        if (container) {
            container.innerHTML = pets.length ? '<div class="safe-life-pet-grid">' + pets.map(function (p) { return petCard(p, 'professional'); }).join('') + '</div>' : '<div class="occurrence-card"><h4>Nenhum pet desaparecido</h4><p>Quando um cidadão marcar um pet como desaparecido, ele aparecerá aqui.</p></div>';
        }
        nextScreen('activeAgentsScreen');
    };

    window.nextScreen = function (screenId) {
        document.querySelectorAll('.screen').forEach(function (screen) {
            screen.classList.remove('active');
            screen.style.display = 'none';
        });
        var target = document.getElementById(screenId);
        if (!target) return;
        target.style.display = 'block';
        requestAnimationFrame(function () {
            target.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { setPetMode('register'); });
    } else {
        setPetMode('register');
    }
})();


(function(){
  function g(id){return document.getElementById(id);}
  function cachedLocation(){
    try{if(typeof window.obterTextoLocalizacaoAtual==='function'){const t=window.obterTextoLocalizacaoAtual(); if(t) return t;}}catch(e){}
    try{if(window.localizacaoUsuario && window.localizacaoUsuario.enderecoCompleto) return window.localizacaoUsuario.enderecoCompleto;}catch(e){}
    return (g('userFullAddress')?.value || g('realAddressText')?.textContent || '').trim();
  }
  function setMode(mode){
    const missing = mode==='DESAPARECIDO';
    if(g('petMode')) g('petMode').value = missing ? 'DESAPARECIDO' : 'CADASTRO';
    const shell=g('petFormShell'); if(shell) shell.classList.toggle('is-missing', missing);
    const missingFields=g('petMissingFields'); if(missingFields) missingFields.classList.toggle('hidden', !missing);
    const headTitle=document.querySelector('#scrPetForm header h1');
    const headText=document.querySelector('#scrPetForm header p');
    const chip=g('petFormChip'); const title=g('petFormInnerTitle'); const text=g('petFormInnerSubtitle'); const icon=g('petFormSideIcon'); const submit=g('petSubmitButton');
    if(headTitle) headTitle.textContent = missing ? 'Pet Desaparecido' : 'Cadastrar Pet';
    if(headText) headText.textContent = missing ? 'Informe os dados para ajudar na busca do pet' : 'Cadastre o seu animal de forma rápida e bonita';
    if(chip) chip.textContent = missing ? '🚨 Alerta de desaparecimento' : '🐾 Cadastro bonito e rápido';
    if(title) title.textContent = missing ? 'Dados do pet desaparecido' : 'Cadastro do pet';
    if(text) text.textContent = missing ? 'Preencha as informações do pet e o último lugar onde ele foi visto.' : 'Preencha as informações principais do seu animal.';
    if(icon) icon.textContent = missing ? '🚨' : '🐾';
    if(submit) submit.textContent = missing ? 'Registrar alerta 🚨' : 'Salvar Pet 🐾';
    const form=g('petForm'); if(form) form.dataset.mode = missing ? 'missing' : 'register';
  }
  window.usarMinhaLocalizacaoNoCampo = async function(campoId){
    const campo=g(campoId); if(!campo) return;
    const loc=cachedLocation();
    if(loc){ campo.value=loc; if(typeof toast==='function') toast('📍 Localização atual preenchida.'); return; }
    try{ if(typeof solicitarLocalizacao==='function') await solicitarLocalizacao({preencherCampo: campoId}); }catch(e){ console.log(e); }
    const after=cachedLocation(); if(after) campo.value=after;
    if(campo.value && typeof toast==='function') toast('📍 Localização atual preenchida.');
  };
  window.openPetForm = function(){ const f=g('petForm'); if(f) f.reset(); setMode('CADASTRO'); const loc=cachedLocation(); if(loc && g('petLocation')) g('petLocation').value=loc; nextScreen('scrPetForm'); };
  window.abrirPetDesaparecido = function(){ const f=g('petForm'); if(f) f.reset(); setMode('DESAPARECIDO'); const loc=cachedLocation(); if(loc && g('petLocation')) g('petLocation').value=loc; if(loc && g('petMissingLocation')) g('petMissingLocation').value=loc; nextScreen('scrPetForm'); };
  window.registrarPet = async function(event){
    if(event && event.preventDefault) event.preventDefault();
    const user=currentUser(); if(!user) return alert('Você precisa estar logado.');
    const missing=(g('petForm')?.dataset.mode||'register')==='missing';
    const nome=val('petName'); if(!nome) return alert('Informe o nome do pet.');
    if(missing && !val('petMissingLocation')) return alert('Informe o último local visto do pet.');
    const foto=await fileToBase64('petPhoto') || DEFAULT_PET_PHOTO;
    const pet=normalizePet({id:Date.now().toString(),donoCpf:user.cpf,donoNome:user.nome,nome,idade:Number(val('petAge')||0),especie:val('petSpecies')||'Animal',raca:val('petBreed')||'Não informada',sexo:val('petSex')||'NAO_INFORMADO',cor:val('petColor')||'Não informada',local:val('petLocation')||'Não informado',observacoes:val('petObservations'),foto,desaparecido:missing,statusPet:missing?'DESAPARECIDO':'CADASTRADO',localDesaparecimento:missing?val('petMissingLocation'):'',detalhesDesaparecimento:missing?val('petMissingDetails'):'',desaparecidoEm:missing?new Date().toISOString():''},user.cpf);
    try{const response=await api('/api/pets',{method:'POST',body:JSON.stringify({donoCpf:user.cpf,nome:pet.nome,idade:pet.idade,especie:pet.especie,raca:pet.raca,sexo:pet.sexo,cor:pet.cor,peso:null,local:pet.local,observacoes:pet.observacoes,foto:pet.foto,desaparecido:pet.desaparecido,statusPet:pet.statusPet,localDesaparecimento:pet.localDesaparecimento,detalhesDesaparecimento:pet.detalhesDesaparecimento})}); if(response && response.pet && response.pet.id) pet.id=response.pet.id;}catch(e){}
    upsertPet(pet);
    if(typeof toast==='function') toast(missing?'🚨 Alerta de pet desaparecido registrado.':'🐾 Pet cadastrado com sucesso!');
    if(g('confirmMsg')) g('confirmMsg').textContent = missing ? 'O alerta do pet desaparecido foi registrado.' : 'O pet foi cadastrado com sucesso.';
    setMode('CADASTRO');
    nextScreen('confirmationScreen');
  };
  function missingCard(p){ const owner=p.donoNome || users().find(u=>cpf(u.cpf)===cpf(p.donoCpf))?.nome || 'Dono não informado'; return `<div class="missing-pet-card"><div class="missing-pet-header"><img class="missing-pet-photo" src="${esc(p.foto)}" alt="Foto do pet"><div><h4>🚨 ${esc(p.nome)}</h4><p>${esc(p.especie)} • ${esc(p.raca||'Raça não informada')}</p><span class="missing-pet-badge">PET DESAPARECIDO</span></div></div><div class="missing-pet-lines"><div class="missing-pet-line"><strong>Dono:</strong> ${esc(owner)}</div><div class="missing-pet-line"><strong>Último local visto:</strong> ${esc(p.localDesaparecimento||p.local||'Não informado')}</div><div class="missing-pet-line"><strong>Cor:</strong> ${esc(p.cor||'Não informada')} • <strong>Idade:</strong> ${esc(p.idade||'Não informada')} anos</div>${(p.detalhesDesaparecimento||p.detalhes_desaparecimento)?`<div class="missing-pet-line"><strong>Detalhes:</strong> ${esc(p.detalhesDesaparecimento||p.detalhes_desaparecimento)}</div>`:''}</div></div>`; }
  window.abrirAgentesAtivos = async function(){ const headTitle=document.querySelector('#activeAgentsScreen header h1'); const headText=document.querySelector('#activeAgentsScreen header p'); const introTitle=document.querySelector('#activeAgentsScreen .occurrence-card h4'); const introText=document.querySelector('#activeAgentsScreen .occurrence-card p'); const container=g('activeAgentsList'); const pets=(await loadPets()).map(normalizePet).filter(p=>p.desaparecido); if(headTitle) headTitle.textContent='Pets Desaparecidos'; if(headText) headText.textContent='Área rápida para visualizar os pets desaparecidos com foto e detalhes'; if(introTitle) introTitle.textContent='🚨 Alertas de pets desaparecidos'; if(introText) introText.textContent='Veja os pets desaparecidos e as informações principais para ajudar na busca.'; if(container){ container.innerHTML = pets.length ? `<div class="professional-missing-wrapper"><div class="professional-missing-summary"><div class="professional-summary-card"><strong>${pets.length}</strong><span>Pets desaparecidos</span></div><div class="professional-summary-card"><strong>${new Set(pets.map(p=>p.donoCpf)).size}</strong><span>Tutores aguardando ajuda</span></div></div><div class="missing-pet-grid">${pets.map(missingCard).join('')}</div></div>` : '<div class="occurrence-card"><h4>Nenhum pet desaparecido</h4><p>No momento não há alertas ativos.</p></div>'; } nextScreen('activeAgentsScreen'); };
  function fixButtons(){ const proButtons=document.querySelectorAll('.professional-tool-card'); if(proButtons[0]){ const icon=proButtons[0].querySelector('span'); const title=proButtons[0].querySelector('strong'); const text=proButtons[0].querySelector('small'); proButtons[0].setAttribute('onclick','abrirAgentesAtivos()'); if(icon) icon.textContent='🚨'; if(title) title.textContent='Pets Desaparecidos'; if(text) text.textContent='Ver cards com foto e detalhes dos pets desaparecidos.'; } const rescue=document.querySelector('#menuScreen .rescue-card'); if(rescue){ rescue.style.justifySelf='center'; rescue.style.margin='0 auto'; } }
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',function(){setMode('CADASTRO'); fixButtons();}); } else { setMode('CADASTRO'); fixButtons(); }
})();


(function () {
    function g(id) { return document.getElementById(id); }

    function fastScreen(screenId) {
        document.querySelectorAll('.screen').forEach(function (screen) {
            screen.classList.remove('active');
            screen.style.display = 'none';
        });
        var target = g(screenId);
        if (!target) return;
        target.style.display = 'block';
        target.classList.add('active');
        try { window.scrollTo(0, 0); } catch (e) {}
    }

    window.nextScreen = fastScreen;

    function currentAddressTextFinal() {
        try {
            if (window.localizacaoUsuario && window.localizacaoUsuario.enderecoCompleto) return window.localizacaoUsuario.enderecoCompleto;
        } catch (e) {}
        var ids = ['userFullAddress', 'realAddressText'];
        for (var i = 0; i < ids.length; i++) {
            var node = g(ids[i]);
            if (!node) continue;
            var txt = ('value' in node ? node.value : node.textContent || '').trim();
            if (txt) return txt;
        }
        var parts = ['realStreet', 'realNeighborhood', 'realCity', 'realState'].map(function (id) {
            var n = g(id); return n ? ((n.value || n.textContent || '').trim()) : '';
        }).filter(Boolean);
        return parts.join(', ');
    }

    window.obterTextoLocalizacaoAtual = currentAddressTextFinal;
    window.obterLocalizacaoAtualObjeto = function () {
        return {
            enderecoCompleto: currentAddressTextFinal(),
            latitude: g('userLatitude') ? g('userLatitude').value : '',
            longitude: g('userLongitude') ? g('userLongitude').value : '',
            bairro: g('userNeighborhood') ? g('userNeighborhood').value : '',
            cidade: g('userCity') ? g('userCity').value : '',
            estado: g('userState') ? g('userState').value : ''
        };
    };

    window.usarMinhaLocalizacaoNoCampo = async function (campoId) {
        var campo = g(campoId);
        if (!campo) return;
        var addr = currentAddressTextFinal();
        if (!addr && typeof solicitarLocalizacao === 'function') {
            try { await solicitarLocalizacao({ preencherCampo: campoId }); } catch (e) {}
            addr = currentAddressTextFinal();
        }
        if (addr) {
            campo.value = addr;
            if (typeof triggerToast === 'function') triggerToast('📍 Localização preenchida.');
            else if (typeof toast === 'function') toast('📍 Localização preenchida.');
        } else {
            alert('Ative a localização para preencher o endereço.');
        }
    };

    function setCitizenMenuTexts() {
        var cards = document.querySelectorAll('#menuScreen .action-card');
        if (cards[0]) {
            var txt = cards[0].querySelector('span:last-child');
            if (txt) txt.textContent = 'Cadastrar Meu Pet';
        }
        if (cards[1]) {
            var txt2 = cards[1].querySelector('span:last-child');
            if (txt2) txt2.textContent = 'Pet Desaparecido';
        }
    }

    function setPetModeFinal(mode) {
        var form = g('petForm');
        if (form) form.dataset.mode = mode;
        var missing = mode === 'missing';
        var box = g('petMissingFields');
        if (box) box.classList.toggle('hidden', !missing);
        var heroTitle = g('petFormHeroTitle');
        var heroText = g('petFormHeroText');
        var submit = g('petSubmitButton');
        var headerTitle = document.querySelector('#scrPetForm header h1');
        var headerText = document.querySelector('#scrPetForm header p');
        if (missing) {
            if (headerTitle) headerTitle.textContent = 'Pet Desaparecido';
            if (headerText) headerText.textContent = 'Informe a foto e os dados principais para ajudar na busca';
            if (heroTitle) heroTitle.textContent = 'Alerta de Pet Desaparecido';
            if (heroText) heroText.textContent = 'Preencha as informações principais para os profissionais verem rápido.';
            if (submit) submit.textContent = 'Enviar Alerta 🚨';
        } else {
            if (headerTitle) headerTitle.textContent = 'Cadastrar Meu Pet';
            if (headerText) headerText.textContent = 'Registre seu animal no Safe Life';
            if (heroTitle) heroTitle.textContent = 'Cadastro do Pet';
            if (heroText) heroText.textContent = 'Preencha os dados principais do seu pet.';
            if (submit) submit.textContent = 'Salvar Pet 🐾';
        }
    }

    window.openPetForm = function () {
        var form = g('petForm');
        if (form) form.reset();
        setPetModeFinal('register');
        var local = currentAddressTextFinal();
        if (local && g('petLocation')) g('petLocation').value = local;
        fastScreen('scrPetForm');
    };

    window.abrirPetDesaparecido = function () {
        var form = g('petForm');
        if (form) form.reset();
        setPetModeFinal('missing');
        var local = currentAddressTextFinal();
        if (local && g('petLocation')) g('petLocation').value = local;
        if (local && g('petMissingLocation')) g('petMissingLocation').value = local;
        fastScreen('scrPetForm');
    };

    window.registrarPet = async function (event) {
        if (event && event.preventDefault) event.preventDefault();
        var user = currentUser();
        if (!user) return alert('Você precisa estar logado.');
        var form = g('petForm');
        var isMissing = !!(form && form.dataset.mode === 'missing');
        var nome = g('petName') ? g('petName').value.trim() : '';
        if (!nome) return alert('Informe o nome do pet.');
        if (isMissing && g('petMissingLocation') && !g('petMissingLocation').value.trim()) return alert('Informe o último local visto do pet.');
        var foto = typeof fileToBase64 === 'function' ? (await fileToBase64('petPhoto')) : '';
        if (!foto) foto = typeof DEFAULT_PET_PHOTO !== 'undefined' ? DEFAULT_PET_PHOTO : '';
        var petData = {
            id: Date.now().toString(),
            donoCpf: user.cpf,
            donoNome: user.nome,
            nome: nome,
            idade: Number(g('petAge') && g('petAge').value ? g('petAge').value : 0),
            especie: g('petSpecies') && g('petSpecies').value ? g('petSpecies').value : 'Animal',
            raca: g('petBreed') && g('petBreed').value ? g('petBreed').value : 'Não informada',
            sexo: g('petSex') && g('petSex').value ? g('petSex').value : 'NAO_INFORMADO',
            cor: g('petColor') && g('petColor').value ? g('petColor').value : 'Não informada',
            peso: null,
            local: g('petLocation') && g('petLocation').value ? g('petLocation').value : 'Não informado',
            observacoes: g('petObservations') ? g('petObservations').value : '',
            foto: foto,
            desaparecido: isMissing,
            statusPet: isMissing ? 'DESAPARECIDO' : 'CADASTRADO',
            localDesaparecimento: isMissing && g('petMissingLocation') ? g('petMissingLocation').value : '',
            detalhesDesaparecimento: isMissing && g('petMissingDetails') ? g('petMissingDetails').value : '',
            desaparecidoEm: isMissing ? new Date().toISOString() : ''
        };
        var pet = normalizePet(petData, user.cpf);
        try {
            var response = await api('/api/pets', {
                method: 'POST',
                body: JSON.stringify({
                    donoCpf: pet.donoCpf,
                    nome: pet.nome,
                    idade: pet.idade,
                    especie: pet.especie,
                    raca: pet.raca,
                    sexo: pet.sexo,
                    cor: pet.cor,
                    peso: null,
                    local: pet.local,
                    observacoes: pet.observacoes,
                    foto: pet.foto,
                    desaparecido: pet.desaparecido,
                    statusPet: pet.statusPet,
                    localDesaparecimento: pet.localDesaparecimento,
                    detalhesDesaparecimento: pet.detalhesDesaparecimento
                })
            });
            if (response && response.pet && response.pet.id) pet.id = response.pet.id;
        } catch (e) {}
        upsertPet(pet);
        if (typeof toast === 'function') toast(isMissing ? '🚨 Alerta de pet desaparecido enviado.' : '🐾 Pet cadastrado com sucesso!');
        if (g('confirmMsg')) g('confirmMsg').textContent = isMissing ? 'O alerta do pet desaparecido foi enviado.' : 'O pet foi cadastrado com sucesso.';
        fastScreen('confirmationScreen');
    };

    window.openCitizenForm = function (typeKey) {
        ensureDefaults();
        if (!FORM_CONFIGS || !FORM_CONFIGS[typeKey]) {
            if (typeof toast === 'function') toast('Tipo de formulário não encontrado.');
            return;
        }
        currentFormConfig = FORM_CONFIGS[typeKey];
        var form = g('citizenForm');
        if (form) form.reset();
        if (g('formKey')) g('formKey').value = typeKey;
        if (g('formTitle')) g('formTitle').textContent = currentFormConfig.title;
        if (g('formSubtitle')) g('formSubtitle').textContent = currentFormConfig.subtitle;
        if (g('selectedQuickOption')) g('selectedQuickOption').value = '';
        if (typeof renderOptionsFixed === 'function') renderOptionsFixed('quickOptionsGrid', currentFormConfig.options, 'selectedQuickOption');
        var local = currentAddressTextFinal();
        if (local && g('formLocation')) g('formLocation').value = local;
        fastScreen('scrForm');
    };

    window.openAnonForm = function () {
        ensureDefaults();
        var form = g('anonForm');
        if (form) form.reset();
        if (g('selectedAnonOption')) g('selectedAnonOption').value = '';
        if (typeof renderOptionsFixed === 'function') renderOptionsFixed('anonOptionsGrid', FORM_CONFIGS.anonymous.options, 'selectedAnonOption');
        var local = currentAddressTextFinal();
        if (local && g('anonLocation')) g('anonLocation').value = local;
        fastScreen('scrAnonForm');
    };

    window.abrirAgentesAtivos = async function () {
        var container = g('activeAgentsList');
        var headTitle = document.querySelector('#activeAgentsScreen header h1');
        var headText = document.querySelector('#activeAgentsScreen header p');
        var boxTitle = document.querySelector('#activeAgentsScreen .occurrence-card h4');
        var boxText = document.querySelector('#activeAgentsScreen .occurrence-card p');
        if (headTitle) headTitle.textContent = 'Pets Desaparecidos';
        if (headText) headText.textContent = 'Veja os pets desaparecidos com foto e detalhes.';
        if (boxTitle) boxTitle.textContent = '🚨 Alertas de pets desaparecidos';
        if (boxText) boxText.textContent = 'Veja os pets que desapareceram, com foto e informações importantes para ajudar na busca.';
        var pets = [];
        try { pets = await loadPets(); } catch (e) {}
        pets = (pets || []).map(function (p) { return normalizePet(p); }).filter(function (p) { return p.desaparecido; });
        if (container) {
            container.innerHTML = pets.length
                ? '<div class="safe-life-pet-grid">' + pets.map(function (p) { return petCard(p, 'professional'); }).join('') + '</div>'
                : '<div class="occurrence-card"><h4>Nenhum pet desaparecido</h4><p>Quando um cidadão registrar um pet desaparecido, ele aparecerá aqui.</p></div>';
        }
        fastScreen('activeAgentsScreen');
    };

    function bootFinalFixes() {
        setCitizenMenuTexts();
        setPetModeFinal('register');
        var petForm = g('petForm');
        if (petForm) petForm.onsubmit = window.registrarPet;
        var proButtons = document.querySelectorAll('.professional-tool-card');
        if (proButtons[0]) {
            var strong = proButtons[0].querySelector('strong');
            var small = proButtons[0].querySelector('small');
            var icon = proButtons[0].querySelector('span');
            if (strong) strong.textContent = 'Pets Desaparecidos';
            if (small) small.textContent = 'Ver cards com foto e detalhes dos pets desaparecidos.';
            if (icon) icon.textContent = '🚨';
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootFinalFixes);
    else bootFinalFixes();
})();


(function () {
  function byId(id){ return document.getElementById(id); }
  function cleanText(v){ return String(v || '').replace(/\s+/g, ' ').trim(); }
  function goodAddress(v){
    var txt = cleanText(v);
    if(!txt) return '';
    var bad = ['---','não informado','nao informado','localização não informada','localizacao nao informada','indefinido'];
    return bad.includes(txt.toLowerCase()) ? '' : txt;
  }
  function fastTop(){ try { window.scrollTo(0,0); } catch(e){} }
  function fastShow(screenId){
    document.querySelectorAll('.screen').forEach(function(s){ s.classList.remove('active'); s.style.display='none'; });
    var target = byId(screenId); if(!target) return; target.style.display='block'; target.classList.add('active'); fastTop();
  }
  window.nextScreen = fastShow;

  function currentAddress(){
    try {
      if (typeof localizacaoUsuario !== 'undefined' && localizacaoUsuario && goodAddress(localizacaoUsuario.enderecoCompleto)) return goodAddress(localizacaoUsuario.enderecoCompleto);
    } catch(e) {}
    var ids = ['userFullAddress','userAddress','realAddressText'];
    for (var i=0;i<ids.length;i++){
      var node = byId(ids[i]); if(!node) continue;
      var raw = 'value' in node ? node.value : node.textContent;
      raw = goodAddress(raw); if(raw) return raw;
    }
    var parts = ['realStreet','userStreet','realNeighborhood','userNeighborhood','realCity','userCity','realState','userState'].map(function(id){ var n=byId(id); return n ? goodAddress('value' in n ? n.value : n.textContent) : ''; }).filter(Boolean);
    return parts.join(', ');
  }

  window.obterTextoLocalizacaoAtual = function(){ return currentAddress(); };
  window.obterLocalizacaoAtualObjeto = function(){ return { enderecoCompleto: currentAddress() }; };

  window.usarMinhaLocalizacaoNoCampo = async function(campoId){
    var campo = byId(campoId); if(!campo) return;
    var addr = currentAddress();
    if(!addr && typeof solicitarLocalizacao === 'function'){
      try { await solicitarLocalizacao({ preencherCampo: campoId }); } catch(e) {}
      addr = currentAddress();
    }
    if(addr){
      campo.value = addr;
      if(typeof triggerToast === 'function') triggerToast('📍 Localização preenchida.');
      else if(typeof toast === 'function') toast('📍 Localização preenchida.');
      return;
    }
    alert('Ative a localização para preencher o endereço.');
  };

  function markPetCards(){
    var cards = document.querySelectorAll('#menuScreen .action-card');
    if(cards[0]) cards[0].classList.add('pet-primary');
    if(cards[1]) cards[1].classList.add('pet-primary');
    var rescue = document.querySelector('#menuScreen .rescue-card');
    if(rescue){ rescue.style.gridColumn='1 / -1'; rescue.style.placeSelf='center'; rescue.style.justifySelf='center'; rescue.style.margin='0 auto'; }
  }

  function setPetMode(mode){
    var form = byId('petForm'); if(form) form.dataset.mode = mode;
    var missing = mode === 'missing';
    var missingBox = byId('petMissingFields'); if(missingBox) missingBox.classList.toggle('hidden', !missing);
    var headerTitle = document.querySelector('#scrPetForm header h1');
    var headerSub = document.querySelector('#scrPetForm header p');
    var heroTitle = byId('petFormHeroTitle');
    var heroText = byId('petFormHeroText');
    var submit = byId('petSubmitButton');
    var heroIcon = document.querySelector('#scrPetForm .pet-form-hero-icon');
    if(missing){
      if(headerTitle) headerTitle.textContent = 'Pet Desaparecido';
      if(headerSub) headerSub.textContent = 'Envie os dados para ajudar os profissionais na busca';
      if(heroTitle) heroTitle.textContent = 'Alerta de Pet Desaparecido';
      if(heroText) heroText.textContent = 'Preencha as informações mais importantes e o último local onde ele foi visto.';
      if(submit) submit.textContent = 'Enviar Alerta 🚨';
      if(heroIcon) heroIcon.textContent = '🚨';
    } else {
      if(headerTitle) headerTitle.textContent = 'Cadastrar Meu Pet';
      if(headerSub) headerSub.textContent = 'Registre seu animal no Safe Life';
      if(heroTitle) heroTitle.textContent = 'Cadastro do Pet';
      if(heroText) heroText.textContent = 'Preencha os dados principais do seu pet em um cadastro bonito e rápido.';
      if(submit) submit.textContent = 'Salvar Pet 🐾';
      if(heroIcon) heroIcon.textContent = '🐾';
    }
  }

  window.openPetForm = function(){
    var form = byId('petForm'); if(form) form.reset();
    setPetMode('register');
    var addr = currentAddress(); if(addr && byId('petLocation')) byId('petLocation').value = addr;
    fastShow('scrPetForm');
  };

  window.abrirPetDesaparecido = function(){
    var form = byId('petForm'); if(form) form.reset();
    setPetMode('missing');
    var addr = currentAddress();
    if(addr && byId('petLocation')) byId('petLocation').value = addr;
    if(addr && byId('petMissingLocation')) byId('petMissingLocation').value = addr;
    fastShow('scrPetForm');
  };

  window.openCitizenForm = function(typeKey){
    if(!window.FORM_CONFIGS || !FORM_CONFIGS[typeKey]){ if(typeof toast==='function') toast('Tipo de formulário não encontrado.'); return; }
    window.currentFormConfig = FORM_CONFIGS[typeKey];
    var form = byId('citizenForm'); if(form) form.reset();
    if(byId('formKey')) byId('formKey').value = typeKey;
    if(byId('formTitle')) byId('formTitle').textContent = currentFormConfig.title;
    if(byId('formSubtitle')) byId('formSubtitle').textContent = currentFormConfig.subtitle;
    if(byId('selectedQuickOption')) byId('selectedQuickOption').value = '';
    if(typeof renderOptions === 'function') renderOptions('quickOptionsGrid', currentFormConfig.options, 'selectedQuickOption');
    else if(typeof renderOptionsFixed === 'function') renderOptionsFixed('quickOptionsGrid', currentFormConfig.options, 'selectedQuickOption');
    var addr = currentAddress(); if(addr && byId('formLocation')) byId('formLocation').value = addr;
    fastShow('scrForm');
  };

  window.openAnonForm = function(){
    var form = byId('anonForm'); if(form) form.reset();
    if(byId('selectedAnonOption')) byId('selectedAnonOption').value = '';
    if(window.FORM_CONFIGS && FORM_CONFIGS.anonymous){
      if(typeof renderOptions === 'function') renderOptions('anonOptionsGrid', FORM_CONFIGS.anonymous.options, 'selectedAnonOption');
      else if(typeof renderOptionsFixed === 'function') renderOptionsFixed('anonOptionsGrid', FORM_CONFIGS.anonymous.options, 'selectedAnonOption');
    }
    var addr = currentAddress(); if(addr && byId('anonLocation')) byId('anonLocation').value = addr;
    fastShow('scrAnonForm');
  };

  window.registrarPet = async function(event){
    if(event && event.preventDefault) event.preventDefault();
    var user = typeof currentUser === 'function' ? currentUser() : null;
    if(!user) return alert('Você precisa estar logado.');
    var form = byId('petForm');
    var missing = !!(form && form.dataset.mode === 'missing');
    var nome = cleanText(byId('petName') ? byId('petName').value : '');
    if(!nome) return alert('Informe o nome do pet.');
    if(missing && !cleanText(byId('petMissingLocation') && byId('petMissingLocation').value)) return alert('Informe o último local visto do pet.');
    var foto = typeof fileToBase64 === 'function' ? await fileToBase64('petPhoto') : '';
    if(!foto && typeof DEFAULT_PET_PHOTO !== 'undefined') foto = DEFAULT_PET_PHOTO;
    var pet = normalizePet({
      id: Date.now().toString(),
      donoCpf: user.cpf,
      donoNome: user.nome,
      nome: nome,
      idade: Number(byId('petAge') && byId('petAge').value ? byId('petAge').value : 0),
      especie: cleanText(byId('petSpecies') && byId('petSpecies').value) || 'Animal',
      raca: cleanText(byId('petBreed') && byId('petBreed').value) || 'Não informada',
      sexo: cleanText(byId('petSex') && byId('petSex').value) || 'NAO_INFORMADO',
      cor: cleanText(byId('petColor') && byId('petColor').value) || 'Não informada',
      local: cleanText(byId('petLocation') && byId('petLocation').value) || 'Não informado',
      observacoes: cleanText(byId('petObservations') && byId('petObservations').value),
      foto: foto,
      desaparecido: missing,
      statusPet: missing ? 'DESAPARECIDO' : 'CADASTRADO',
      localDesaparecimento: missing ? cleanText(byId('petMissingLocation') && byId('petMissingLocation').value) : '',
      detalhesDesaparecimento: missing ? cleanText(byId('petMissingDetails') && byId('petMissingDetails').value) : '',
      desaparecidoEm: missing ? new Date().toISOString() : ''
    }, user.cpf);
    try {
      if(typeof api === 'function'){
        var res = await api('/api/pets', { method:'POST', body: JSON.stringify({
          donoCpf: pet.donoCpf, nome: pet.nome, idade: pet.idade, especie: pet.especie, raca: pet.raca, sexo: pet.sexo, cor: pet.cor,
          local: pet.local, observacoes: pet.observacoes, foto: pet.foto, desaparecido: pet.desaparecido,
          statusPet: pet.statusPet, localDesaparecimento: pet.localDesaparecimento, detalhesDesaparecimento: pet.detalhesDesaparecimento
        })});
        if(res && res.pet && res.pet.id) pet.id = res.pet.id;
      }
    } catch(e){}
    if(typeof upsertPet === 'function') upsertPet(pet);
    if(typeof toast === 'function') toast(missing ? '🚨 Alerta de pet desaparecido enviado.' : '🐾 Pet cadastrado com sucesso!');
    if(byId('confirmMsg')) byId('confirmMsg').textContent = missing ? 'O alerta do pet desaparecido foi enviado.' : 'O pet foi cadastrado com sucesso.';
    fastShow('confirmationScreen');
  };

  function esc(v){ return String(v||'').replace(/[&<>\"']/g,function(s){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]); }); }
  function missingCard(p){
    var owner = p.donoNome || '';
    return '<div class="missing-pet-card">'
      + '<div class="missing-pet-head">'
      + '<img class="missing-pet-photo" src="'+esc(p.foto || (typeof DEFAULT_PET_PHOTO!=='undefined'?DEFAULT_PET_PHOTO:''))+'" alt="Pet">'
      + '<div class="missing-pet-meta"><h4>🚨 '+esc(p.nome)+'</h4><small>'+esc((p.especie||'Animal')+' • '+(p.raca||'Raça não informada'))+'</small><div class="missing-pet-badge">DESAPARECIDO</div></div>'
      + '</div>'
      + '<div class="missing-pet-lines">'
      + '<div><strong>Dono:</strong> '+esc(owner || 'Não informado')+'</div>'
      + '<div><strong>Último local:</strong> '+esc(p.localDesaparecimento || p.local_desaparecimento || p.local || 'Não informado')+'</div>'
      + '<div><strong>Características:</strong> '+esc(p.observacoes || p.detalhesDesaparecimento || p.detalhes_desaparecimento || 'Sem detalhes')+'</div>'
      + '</div></div>';
  }

  window.abrirAgentesAtivos = async function(){
    var pets = [];
    try { if(typeof loadPets === 'function') pets = await loadPets(); } catch(e){}
    pets = (pets || []).map(function(p){ return typeof normalizePet==='function' ? normalizePet(p) : p; }).filter(function(p){ return !!p.desaparecido; });
    var headTitle = document.querySelector('#activeAgentsScreen header h1');
    var headText = document.querySelector('#activeAgentsScreen header p');
    var introTitle = document.querySelector('#activeAgentsScreen .occurrence-card h4');
    var introText = document.querySelector('#activeAgentsScreen .occurrence-card p');
    var container = byId('activeAgentsList');
    if(headTitle) headTitle.textContent = 'Pets Desaparecidos';
    if(headText) headText.textContent = 'Área rápida para visualizar os pets desaparecidos com foto e detalhes';
    if(introTitle) introTitle.textContent = '🚨 Alertas de pets desaparecidos';
    if(introText) introText.textContent = 'Veja os pets desaparecidos e as informações principais para ajudar na busca.';
    if(container){
      container.innerHTML = pets.length
        ? '<div class="professional-missing-wrapper"><div class="professional-missing-summary"><div class="professional-summary-card"><strong>'+pets.length+'</strong><span>Pets desaparecidos</span></div><div class="professional-summary-card"><strong>'+new Set(pets.map(function(p){return p.donoCpf || '';}).filter(Boolean)).size+'</strong><span>Tutores aguardando ajuda</span></div></div><div class="missing-pet-grid">'+pets.map(missingCard).join('')+'</div></div>'
        : '<div class="occurrence-card"><h4>Nenhum pet desaparecido</h4><p>No momento não há alertas ativos.</p></div>';
    }
    fastShow('activeAgentsScreen');
  };

  function finalBoot(){
    document.querySelectorAll('.screen').forEach(function(s){ s.style.animation='none'; });
    markPetCards();
    setPetMode('register');
    var petForm = byId('petForm'); if(petForm) petForm.onsubmit = window.registrarPet;
    var proBtn = document.querySelector('.professional-tool-card');
    if(proBtn){ proBtn.setAttribute('onclick','abrirAgentesAtivos()'); var icon=proBtn.querySelector('span'); var title=proBtn.querySelector('strong'); var txt=proBtn.querySelector('small'); if(icon) icon.textContent='🚨'; if(title) title.textContent='Pets Desaparecidos'; if(txt) txt.textContent='Ver cards com foto e detalhes dos pets desaparecidos.'; }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', finalBoot);
  else finalBoot();
})();




(function () {
    function g(id) {
        return document.getElementById(id);
    }

    function fastScreen(screenId) {
        document.querySelectorAll(".screen").forEach(function (screen) {
            screen.classList.remove("active");
            screen.style.display = "none";
        });

        var target = g(screenId);
        if (!target) return;

        target.style.display = "block";
        target.classList.add("active");

        try {
            window.scrollTo(0, 0);
        } catch (e) {}
    }

    window.nextScreen = fastScreen;

    function centerRescueCard() {
        var rescue = document.querySelector("#menuScreen .rescue-card");
        if (!rescue) return;

        rescue.style.gridColumn = "1 / -1";
        rescue.style.width = "220px";
        rescue.style.maxWidth = "220px";
        rescue.style.justifySelf = "center";
        rescue.style.placeSelf = "center";
        rescue.style.marginLeft = "auto";
        rescue.style.marginRight = "auto";
        rescue.style.textAlign = "center";
        rescue.style.alignItems = "center";
    }

    function cleanDuplicatedPetsTitle() {
        var title = document.querySelector(".pets-profile-card > h4");
        if (title) title.remove();

        var container = g("myPetsContainer");
        if (!container) return;

        var directTitle = container.querySelector(":scope > h4:first-child");
        if (directTitle) directTitle.remove();
    }

    function safeEsc(value) {
        return String(value || "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char];
        });
    }

    function simplePetCard(pet) {
        var p = typeof normalizePet === "function" ? normalizePet(pet) : pet;
        var missing = !!p.desaparecido;

        return `
            <div class="safe-life-pet-card ${missing ? "missing" : ""}">
                <div class="safe-life-pet-top">
                    <img class="safe-life-pet-photo" src="${safeEsc(p.foto || p.photo || "")}" alt="Foto do pet">
                    <div class="safe-life-pet-info">
                        <h4>${missing ? "🚨" : "🐾"} ${safeEsc(p.nome || "Pet")}</h4>
                        <small>${safeEsc(p.especie || "Animal")} • ${safeEsc(p.raca || "Raça não informada")}</small><br>
                        <span class="${missing ? "safe-life-alert-badge" : "safe-life-normal-badge"}">${missing ? "DESAPARECIDO" : "CADASTRADO"}</span>
                    </div>
                </div>
                <div class="safe-life-pet-lines">
                    <div class="safe-life-pet-line"><strong>Idade:</strong> ${safeEsc(p.idade || "Não informada")} anos</div>
                    <div class="safe-life-pet-line"><strong>Endereço:</strong> ${safeEsc(p.local || p.localizacao || "Não informado")}</div>
                    ${p.cor ? `<div class="safe-life-pet-line"><strong>Cor:</strong> ${safeEsc(p.cor)}</div>` : ""}
                    ${p.observacoes ? `<div class="safe-life-pet-line"><strong>Características:</strong> ${safeEsc(p.observacoes)}</div>` : ""}
                </div>
            </div>
        `;
    }

    window.renderPerfilCidadao = async function () {
        var user = typeof currentUser === "function" ? currentUser() : null;

        if (!user) {
            fastScreen("loginScreen");
            return;
        }

        if (g("profileAvatar")) g("profileAvatar").src = user.foto || (typeof DEFAULT_USER_PHOTO !== "undefined" ? DEFAULT_USER_PHOTO : "");
        if (g("citizenProfileName")) g("citizenProfileName").textContent = user.nome || "Cidadão";
        if (g("citizenProfileType")) g("citizenProfileType").textContent = "Cidadão";

        if (g("citizenProfileContact")) {
            g("citizenProfileContact").innerHTML =
                "CPF: " + safeEsc(user.cpf) +
                "<br>E-mail: " + safeEsc(user.email || "Não informado") +
                "<br>Telefone: " + safeEsc(user.telefone || "Não informado");
        }

        if (g("editName")) g("editName").value = user.nome || "";
        if (g("editEmail")) g("editEmail").value = user.email || "";
        if (g("editPhone")) g("editPhone").value = user.telefone || "";

        var pets = [];
        try {
            if (typeof loadPets === "function") {
                pets = await loadPets({ donoCpf: user.cpf });
            }
        } catch (e) {
            pets = [];
        }

        var notifications = [];
        try {
            notifications = get(NOTIF_KEY, []).filter(function (item) {
                return !item.citizenCpf || cpf(item.citizenCpf) === cpf(user.cpf);
            });
        } catch (e) {}

        var history = [];
        try {
            history = get(HISTORY_KEY, []).filter(function (item) {
                return !item.citizenCpf || cpf(item.citizenCpf || item.cpf_usuario || item.reporterCpf) === cpf(user.cpf);
            });
        } catch (e) {}

        var container = g("myPetsContainer");

        if (container) {
            container.innerHTML = `
                <div class="safe-life-profile-block">
                    <h4>🔔 Notificações</h4>
                    ${notifications.length
                        ? notifications.map(function (n) {
                            return `<div class="safe-notification-card"><div class="safe-notification-icon">🔔</div><div><strong>${safeEsc(n.title || "Atualização")}</strong><p>${safeEsc(n.message || "Sua ocorrência recebeu uma atualização.")}</p><small>${safeEsc(n.createdAt || "")}</small></div></div>`;
                        }).join("")
                        : `<p class="empty-message">Nenhuma notificação ainda.</p>`
                    }
                </div>

                <div class="safe-life-profile-block">
                    <h4>🐾 Meus Pets</h4>
                    <div class="safe-life-pet-grid">
                        ${pets.length
                            ? pets.map(simplePetCard).join("")
                            : `<p class="empty-message">Nenhum pet cadastrado ainda.</p>`
                        }
                    </div>
                </div>

                <div class="safe-life-profile-block">
                    <h4>✅ Ocorrências realizadas</h4>
                    ${history.length
                        ? history.map(function (h) {
                            return `<div class="occurrence-card"><h4>✅ ${safeEsc(h.opcaoEscolhida || h.assunto || "Ocorrência")}</h4><p><strong>Descrição:</strong> ${safeEsc(h.detalhes || "Sem descrição")}</p><p><strong>Profissional:</strong> ${safeEsc(h.profissionalNome || "Profissional")}</p><small>${safeEsc(h.concluidaEm || h.completedAt || "")}</small></div>`;
                        }).join("")
                        : `<p class="empty-message">Nenhuma ocorrência concluída ainda.</p>`
                    }
                </div>
            `;
        }

        cleanDuplicatedPetsTitle();
        fastScreen("citizenProfile");
    };

    function finalBootTcc() {
        centerRescueCard();
        cleanDuplicatedPetsTitle();

        document.querySelectorAll(".screen, .btn, .action-card, .professional-tool-card, .occurrence-card").forEach(function (el) {
            el.style.transition = "none";
            el.style.animation = "none";
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", finalBootTcc);
    } else {
        finalBootTcc();
    }
})();


(function () {
    function g(id) {
        return document.getElementById(id);
    }

    function escFinal(value) {
        return String(value || "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char];
        });
    }

    function getJsonFinal(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw) || fallback;
        } catch (e) {
            return fallback;
        }
    }

    function saveLoggedFinal(user) {
        if (!user || !user.cpf) return user;

        try {
            usuarioLogado = user;
        } catch (e) {
            window.usuarioLogado = user;
        }

        try {
            localStorage.setItem("safeLifeLoggedUser", JSON.stringify(user));
        } catch (e) {}

        return user;
    }

    function getLoggedFinal() {
        try {
            if (typeof usuarioLogado !== "undefined" && usuarioLogado && usuarioLogado.cpf) {
                return saveLoggedFinal(usuarioLogado);
            }
        } catch (e) {}

        try {
            if (window.usuarioLogado && window.usuarioLogado.cpf) {
                return saveLoggedFinal(window.usuarioLogado);
            }
        } catch (e) {}

        var saved = getJsonFinal("safeLifeLoggedUser", null);
        if (saved && saved.cpf) return saveLoggedFinal(saved);

        var users = getJsonFinal("safeLifeUsuarios", []);
        var lastCpf = localStorage.getItem("safeLifeLastCpf");
        if (lastCpf) {
            var found = users.find(function (user) {
                return String(user.cpf || "").replace(/\D/g, "") === String(lastCpf).replace(/\D/g, "");
            });
            if (found) return saveLoggedFinal(found);
        }

        return null;
    }

    function fastScreenFinal(screenId) {
        document.querySelectorAll(".screen").forEach(function (screen) {
            screen.classList.remove("active");
            screen.style.display = "none";
        });

        var target = g(screenId);
        if (!target) return;

        target.style.display = "block";
        target.classList.add("active");

        try {
            window.scrollTo(0, 0);
        } catch (e) {}
    }

    window.nextScreen = fastScreenFinal;

    function centerRescueFinal() {
        var rescue = document.querySelector("#menuScreen .action-card[onclick*=\"rescue\"]");
        if (!rescue) return;

        rescue.classList.add("rescue-card");
        rescue.style.gridColumn = "1 / -1";
        rescue.style.width = "220px";
        rescue.style.maxWidth = "220px";
        rescue.style.justifySelf = "center";
        rescue.style.alignSelf = "center";
        rescue.style.marginLeft = "auto";
        rescue.style.marginRight = "auto";
        rescue.style.textAlign = "center";
        rescue.style.alignItems = "center";
    }

    function cleanPetsTitleFinal() {
        var oldTitle = document.querySelector(".pets-profile-card > h4");
        if (oldTitle) oldTitle.remove();

        var container = g("myPetsContainer");
        if (!container) return;

        var directTitle = container.querySelector(":scope > h4:first-child");
        if (directTitle) directTitle.remove();
    }

    function simplePetCardFinal(pet) {
        var p = pet;

        try {
            if (typeof normalizePet === "function") p = normalizePet(pet);
        } catch (e) {}

        var missing = !!p.desaparecido;

        return `
            <div class="safe-life-pet-card ${missing ? "missing" : ""}">
                <div class="safe-life-pet-top">
                    <img class="safe-life-pet-photo" src="${escFinal(p.foto || p.photo || "")}" alt="Foto do pet">
                    <div class="safe-life-pet-info">
                        <h4>${missing ? "🚨" : "🐾"} ${escFinal(p.nome || "Pet")}</h4>
                        <small>${escFinal(p.especie || "Animal")} • ${escFinal(p.raca || "Raça não informada")}</small><br>
                        <span class="${missing ? "safe-life-alert-badge" : "safe-life-normal-badge"}">${missing ? "DESAPARECIDO" : "CADASTRADO"}</span>
                    </div>
                </div>
                <div class="safe-life-pet-lines">
                    <div class="safe-life-pet-line"><strong>Idade:</strong> ${escFinal(p.idade || "Não informada")} anos</div>
                    <div class="safe-life-pet-line"><strong>Endereço:</strong> ${escFinal(p.local || p.localizacao || "Não informado")}</div>
                    ${p.cor ? `<div class="safe-life-pet-line"><strong>Cor:</strong> ${escFinal(p.cor)}</div>` : ""}
                </div>
            </div>
        `;
    }

    window.renderPerfilCidadao = async function () {
        var user = getLoggedFinal();

        if (!user) {
            alert("Sessão não encontrada. Entre novamente.");
            fastScreenFinal("loginScreen");
            return;
        }

        saveLoggedFinal(user);

        if (g("profileAvatar")) g("profileAvatar").src = user.foto || user.avatar || "";
        if (g("citizenProfileName")) g("citizenProfileName").textContent = user.nome || user.name || "Cidadão";
        if (g("citizenProfileType")) g("citizenProfileType").textContent = "Cidadão";

        if (g("citizenProfileContact")) {
            g("citizenProfileContact").innerHTML =
                "CPF: " + escFinal(user.cpf) +
                "<br>E-mail: " + escFinal(user.email || "Não informado") +
                "<br>Telefone: " + escFinal(user.telefone || user.phone || "Não informado");
        }

        if (g("editName")) g("editName").value = user.nome || user.name || "";
        if (g("editEmail")) g("editEmail").value = user.email || "";
        if (g("editPhone")) g("editPhone").value = user.telefone || user.phone || "";

        var pets = [];

        try {
            if (typeof loadPets === "function") {
                pets = await loadPets({ donoCpf: user.cpf });
            }
        } catch (e) {
            pets = [];
        }

        if (!pets || !pets.length) {
            try {
                var localPets = getJsonFinal("safeLifePets", []);
                pets = localPets.filter(function (pet) {
                    var petCpf = String(pet.donoCpf || pet.ownerCpf || pet.dono_cpf || "").replace(/\D/g, "");
                    var userCpf = String(user.cpf || "").replace(/\D/g, "");
                    return petCpf === userCpf;
                });
            } catch (e) {
                pets = [];
            }
        }

        var notifications = [];
        try {
            notifications = getJsonFinal("safeLifeNotificacoes", []).filter(function (item) {
                var itemCpf = String(item.citizenCpf || "").replace(/\D/g, "");
                var userCpf = String(user.cpf || "").replace(/\D/g, "");
                return !itemCpf || itemCpf === userCpf;
            });
        } catch (e) {}

        var history = [];
        try {
            history = getJsonFinal("safeLifeHistoricoOcorrencias", []).filter(function (item) {
                var itemCpf = String(item.citizenCpf || item.cpf_usuario || item.reporterCpf || "").replace(/\D/g, "");
                var userCpf = String(user.cpf || "").replace(/\D/g, "");
                return !itemCpf || itemCpf === userCpf;
            });
        } catch (e) {}

        var container = g("myPetsContainer");

        if (container) {
            container.innerHTML = `
                <div class="safe-life-profile-block">
                    <h4>🔔 Notificações</h4>
                    ${notifications.length
                        ? notifications.map(function (n) {
                            return `<div class="safe-notification-card"><div class="safe-notification-icon">🔔</div><div><strong>${escFinal(n.title || "Atualização")}</strong><p>${escFinal(n.message || "Sua ocorrência recebeu uma atualização.")}</p><small>${escFinal(n.createdAt || "")}</small></div></div>`;
                        }).join("")
                        : `<p class="empty-message">Nenhuma notificação ainda.</p>`
                    }
                </div>

                <div class="safe-life-profile-block">
                    <h4>🐾 Meus Pets</h4>
                    <div class="safe-life-pet-grid">
                        ${pets.length
                            ? pets.map(simplePetCardFinal).join("")
                            : `<p class="empty-message">Nenhum pet cadastrado ainda.</p>`
                        }
                    </div>
                </div>

                <div class="safe-life-profile-block">
                    <h4>✅ Ocorrências realizadas</h4>
                    ${history.length
                        ? history.map(function (h) {
                            return `<div class="occurrence-card"><h4>✅ ${escFinal(h.opcaoEscolhida || h.assunto || "Ocorrência")}</h4><p><strong>Descrição:</strong> ${escFinal(h.detalhes || "Sem descrição")}</p><p><strong>Profissional:</strong> ${escFinal(h.profissionalNome || "Profissional")}</p><small>${escFinal(h.concluidaEm || h.completedAt || "")}</small></div>`;
                        }).join("")
                        : `<p class="empty-message">Nenhuma ocorrência concluída ainda.</p>`
                    }
                </div>
            `;
        }

        cleanPetsTitleFinal();
        fastScreenFinal("citizenProfile");
    };

    var originalAutenticarFinal = window.autenticar;

    if (typeof originalAutenticarFinal === "function") {
        window.autenticar = async function () {
            await originalAutenticarFinal();

            try {
                if (typeof usuarioLogado !== "undefined" && usuarioLogado && usuarioLogado.cpf) {
                    localStorage.setItem("safeLifeLoggedUser", JSON.stringify(usuarioLogado));
                    localStorage.setItem("safeLifeLastCpf", usuarioLogado.cpf);
                }
            } catch (e) {}
        };
    }

    function bootFinalV10() {
        centerRescueFinal();
        cleanPetsTitleFinal();

        document.querySelectorAll(".screen, .btn, .action-card, .professional-tool-card, .occurrence-card").forEach(function (item) {
            item.style.transition = "none";
            item.style.animation = "none";
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootFinalV10);
    } else {
        bootFinalV10();
    }
})();




(function () {
    function g(id) {
        return document.getElementById(id);
    }

    function fastScreen(screenId) {
        document.querySelectorAll(".screen").forEach(function (screen) {
            screen.classList.remove("active");
            screen.style.display = "none";
        });

        var target = g(screenId);
        if (!target) return;

        target.style.display = "block";
        target.classList.add("active");

        try {
            window.scrollTo(0, 0);
        } catch (e) {}
    }

    window.nextScreen = fastScreen;

    function centerRescueCard() {
        var rescue = document.querySelector("#menuScreen .rescue-card");
        if (!rescue) return;

        rescue.style.gridColumn = "1 / -1";
        rescue.style.width = "220px";
        rescue.style.maxWidth = "220px";
        rescue.style.justifySelf = "center";
        rescue.style.placeSelf = "center";
        rescue.style.marginLeft = "auto";
        rescue.style.marginRight = "auto";
        rescue.style.textAlign = "center";
        rescue.style.alignItems = "center";
    }

    function cleanDuplicatedPetsTitle() {
        var title = document.querySelector(".pets-profile-card > h4");
        if (title) title.remove();

        var container = g("myPetsContainer");
        if (!container) return;

        var directTitle = container.querySelector(":scope > h4:first-child");
        if (directTitle) directTitle.remove();
    }

    function safeEsc(value) {
        return String(value || "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char];
        });
    }

    function simplePetCard(pet) {
        var p = typeof normalizePet === "function" ? normalizePet(pet) : pet;
        var missing = !!p.desaparecido;

        return `
            <div class="safe-life-pet-card ${missing ? "missing" : ""}">
                <div class="safe-life-pet-top">
                    <img class="safe-life-pet-photo" src="${safeEsc(p.foto || p.photo || "")}" alt="Foto do pet">
                    <div class="safe-life-pet-info">
                        <h4>${missing ? "🚨" : "🐾"} ${safeEsc(p.nome || "Pet")}</h4>
                        <small>${safeEsc(p.especie || "Animal")} • ${safeEsc(p.raca || "Raça não informada")}</small><br>
                        <span class="${missing ? "safe-life-alert-badge" : "safe-life-normal-badge"}">${missing ? "DESAPARECIDO" : "CADASTRADO"}</span>
                    </div>
                </div>
                <div class="safe-life-pet-lines">
                    <div class="safe-life-pet-line"><strong>Idade:</strong> ${safeEsc(p.idade || "Não informada")} anos</div>
                    <div class="safe-life-pet-line"><strong>Endereço:</strong> ${safeEsc(p.local || p.localizacao || "Não informado")}</div>
                    ${p.cor ? `<div class="safe-life-pet-line"><strong>Cor:</strong> ${safeEsc(p.cor)}</div>` : ""}
                    ${p.observacoes ? `<div class="safe-life-pet-line"><strong>Características:</strong> ${safeEsc(p.observacoes)}</div>` : ""}
                </div>
            </div>
        `;
    }

    window.renderPerfilCidadao = async function () {
        var user = typeof currentUser === "function" ? currentUser() : null;

        if (!user) {
            fastScreen("loginScreen");
            return;
        }

        if (g("profileAvatar")) g("profileAvatar").src = user.foto || (typeof DEFAULT_USER_PHOTO !== "undefined" ? DEFAULT_USER_PHOTO : "");
        if (g("citizenProfileName")) g("citizenProfileName").textContent = user.nome || "Cidadão";
        if (g("citizenProfileType")) g("citizenProfileType").textContent = "Cidadão";

        if (g("citizenProfileContact")) {
            g("citizenProfileContact").innerHTML =
                "CPF: " + safeEsc(user.cpf) +
                "<br>E-mail: " + safeEsc(user.email || "Não informado") +
                "<br>Telefone: " + safeEsc(user.telefone || "Não informado");
        }

        if (g("editName")) g("editName").value = user.nome || "";
        if (g("editEmail")) g("editEmail").value = user.email || "";
        if (g("editPhone")) g("editPhone").value = user.telefone || "";

        var pets = [];
        try {
            if (typeof loadPets === "function") {
                pets = await loadPets({ donoCpf: user.cpf });
            }
        } catch (e) {
            pets = [];
        }

        var notifications = [];
        try {
            notifications = get(NOTIF_KEY, []).filter(function (item) {
                return !item.citizenCpf || cpf(item.citizenCpf) === cpf(user.cpf);
            });
        } catch (e) {}

        var history = [];
        try {
            history = get(HISTORY_KEY, []).filter(function (item) {
                return !item.citizenCpf || cpf(item.citizenCpf || item.cpf_usuario || item.reporterCpf) === cpf(user.cpf);
            });
        } catch (e) {}

        var container = g("myPetsContainer");

        if (container) {
            container.innerHTML = `
                <div class="safe-life-profile-block">
                    <h4>🔔 Notificações</h4>
                    ${notifications.length
                        ? notifications.map(function (n) {
                            return `<div class="safe-notification-card"><div class="safe-notification-icon">🔔</div><div><strong>${safeEsc(n.title || "Atualização")}</strong><p>${safeEsc(n.message || "Sua ocorrência recebeu uma atualização.")}</p><small>${safeEsc(n.createdAt || "")}</small></div></div>`;
                        }).join("")
                        : `<p class="empty-message">Nenhuma notificação ainda.</p>`
                    }
                </div>

                <div class="safe-life-profile-block">
                    <h4>🐾 Meus Pets</h4>
                    <div class="safe-life-pet-grid">
                        ${pets.length
                            ? pets.map(simplePetCard).join("")
                            : `<p class="empty-message">Nenhum pet cadastrado ainda.</p>`
                        }
                    </div>
                </div>

                <div class="safe-life-profile-block">
                    <h4>✅ Ocorrências realizadas</h4>
                    ${history.length
                        ? history.map(function (h) {
                            return `<div class="occurrence-card"><h4>✅ ${safeEsc(h.opcaoEscolhida || h.assunto || "Ocorrência")}</h4><p><strong>Descrição:</strong> ${safeEsc(h.detalhes || "Sem descrição")}</p><p><strong>Profissional:</strong> ${safeEsc(h.profissionalNome || "Profissional")}</p><small>${safeEsc(h.concluidaEm || h.completedAt || "")}</small></div>`;
                        }).join("")
                        : `<p class="empty-message">Nenhuma ocorrência concluída ainda.</p>`
                    }
                </div>
            `;
        }

        cleanDuplicatedPetsTitle();
        fastScreen("citizenProfile");
    };

    function finalBootTcc() {
        centerRescueCard();
        cleanDuplicatedPetsTitle();

        document.querySelectorAll(".screen, .btn, .action-card, .professional-tool-card, .occurrence-card").forEach(function (el) {
            el.style.transition = "none";
            el.style.animation = "none";
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", finalBootTcc);
    } else {
        finalBootTcc();
    }
})();


(function () {
    function q(id) {
        return document.getElementById(id);
    }

    function safeText(value) {
        return String(value || "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char];
        });
    }

    function onlyCpf(value) {
        return String(value || "").replace(/\D/g, "");
    }

    function getJson(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw) || fallback;
        } catch (e) {
            return fallback;
        }
    }

    function setJson(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {}
    }

    function saveLogged(user) {
        if (!user || !user.cpf) return user;

        try {
            usuarioLogado = user;
        } catch (e) {
            window.usuarioLogado = user;
        }

        try {
            window.usuarioLogado = user;
        } catch (e) {}

        setJson("safeLifeLoggedUser", user);
        try {
            localStorage.setItem("safeLifeLastCpf", user.cpf);
        } catch (e) {}

        return user;
    }

    function getLogged() {
        try {
            if (typeof usuarioLogado !== "undefined" && usuarioLogado && usuarioLogado.cpf) {
                return saveLogged(usuarioLogado);
            }
        } catch (e) {}

        try {
            if (window.usuarioLogado && window.usuarioLogado.cpf) {
                return saveLogged(window.usuarioLogado);
            }
        } catch (e) {}

        var saved = getJson("safeLifeLoggedUser", null);
        if (saved && saved.cpf) return saveLogged(saved);

        var users = getJson("safeLifeUsuarios", []);
        var lastCpf = "";
        try {
            lastCpf = localStorage.getItem("safeLifeLastCpf") || "";
        } catch (e) {}

        if (lastCpf) {
            var found = users.find(function (user) {
                return onlyCpf(user.cpf) === onlyCpf(lastCpf);
            });

            if (found) return saveLogged(found);
        }

        var cpfInput = q("cpfInput");
        if (cpfInput && cpfInput.value) {
            var fromInput = users.find(function (user) {
                return onlyCpf(user.cpf) === onlyCpf(cpfInput.value);
            });

            if (fromInput) return saveLogged(fromInput);
        }

        var citizen = users.find(function (user) {
            return (user.type || user.tipo || user.role) === "citizen";
        });

        if (citizen) return saveLogged(citizen);

        return null;
    }

    function showScreen(screenId) {
        document.querySelectorAll(".screen").forEach(function (screen) {
            screen.classList.remove("active");
            screen.style.display = "none";
        });

        var target = q(screenId);
        if (!target) return;

        target.style.display = "block";
        target.classList.add("active");

        try {
            window.scrollTo(0, 0);
        } catch (e) {}
    }

    window.nextScreen = showScreen;

    function selectedOptionText() {
        var hidden = q("selectedQuickOption");
        if (hidden && hidden.value) return hidden.value;

        var selected = document.querySelector("#quickOptionsGrid .selected, #quickOptionsGrid .active");
        if (selected) {
            var title = selected.querySelector(".quick-option-title");
            return (title ? title.textContent : selected.textContent || "").trim();
        }

        return "";
    }

    function renderOptionsSimple(containerId, options, hiddenId) {
        var container = q(containerId);
        if (!container) return;

        container.innerHTML = "";

        (options || []).forEach(function (option) {
            var card = document.createElement("button");
            card.type = "button";
            card.className = "quick-option-card";
            card.innerHTML =
                '<div class="quick-option-icon">' + safeText(option.icon || "🐾") + "</div>" +
                '<div class="quick-option-title">' + safeText(option.title || "Opção") + "</div>" +
                '<div class="quick-option-desc">' + safeText(option.desc || "") + "</div>";

            card.onclick = function () {
                container.querySelectorAll(".quick-option-card").forEach(function (item) {
                    item.classList.remove("selected", "active");
                });

                card.classList.add("selected", "active");

                var hidden = q(hiddenId);
                if (hidden) hidden.value = option.title || "";
            };

            container.appendChild(card);
        });
    }

    window.openCitizenForm = function (typeKey) {
        var configs = null;

        try {
            configs = FORM_CONFIGS;
        } catch (e) {
            configs = window.FORM_CONFIGS || null;
        }

        if (!configs || !configs[typeKey]) {
            alert("Tipo de chamado não encontrado.");
            return;
        }

        try {
            currentFormConfig = configs[typeKey];
            window.currentFormConfig = configs[typeKey];
        } catch (e) {
            window.currentFormConfig = configs[typeKey];
        }

        var form = q("citizenForm");
        if (form) form.reset();

        if (q("formKey")) q("formKey").value = typeKey;
        if (q("formTitle")) q("formTitle").textContent = configs[typeKey].title || "Abrir Chamado";
        if (q("formSubtitle")) q("formSubtitle").textContent = configs[typeKey].subtitle || "Preencha os dados do chamado.";
        if (q("selectedQuickOption")) q("selectedQuickOption").value = "";

        try {
            if (typeof renderOptions === "function") {
                renderOptions("quickOptionsGrid", configs[typeKey].options, "selectedQuickOption");
            } else {
                renderOptionsSimple("quickOptionsGrid", configs[typeKey].options, "selectedQuickOption");
            }
        } catch (e) {
            renderOptionsSimple("quickOptionsGrid", configs[typeKey].options, "selectedQuickOption");
        }

        var locationText = "";
        try {
            if (typeof obterTextoLocalizacaoAtual === "function") locationText = obterTextoLocalizacaoAtual();
        } catch (e) {}

        if (locationText && q("formLocation")) q("formLocation").value = locationText;

        showScreen("scrForm");
    };

    window.registrarAcao = async function (event) {
        if (event && event.preventDefault) event.preventDefault();

        var user = getLogged();
        var typeKey = q("formKey") ? q("formKey").value : "report";
        var configs = null;

        try {
            configs = FORM_CONFIGS;
        } catch (e) {
            configs = window.FORM_CONFIGS || {};
        }

        var config = configs && configs[typeKey] ? configs[typeKey] : { title: "Chamado", priority: "NORMAL" };
        var option = selectedOptionText() || "Chamado geral";
        var location = q("formLocation") ? q("formLocation").value.trim() : "";
        var details = q("formDetails") ? q("formDetails").value.trim() : "";

        if (!location) {
            alert("Informe a localização.");
            return;
        }

        if (!details) {
            alert("Informe a descrição.");
            return;
        }

        var photo = "";
        try {
            if (typeof fileToBase64 === "function") photo = await fileToBase64("formFile");
        } catch (e) {}

        var item = {
            id: Date.now().toString(),
            origem: "local",
            tipo: config.title || "Chamado",
            categoria: typeKey,
            assunto: option,
            opcaoEscolhida: option,
            opcao_escolhida: option,
            localizacao: location,
            detalhes: details,
            foto: photo,
            status: "PENDENTE",
            prioridade: config.priority || "NORMAL",
            anonima: false,
            citizenName: user ? (user.nome || user.name || "Cidadão") : "Cidadão",
            citizenCpf: user ? user.cpf : "",
            citizenPhoto: user ? (user.foto || user.avatar || "") : "",
            reporterName: user ? (user.nome || user.name || "Cidadão") : "Cidadão",
            reporterCpf: user ? user.cpf : "",
            timestamp: new Date().toLocaleString("pt-BR"),
            criado_em: new Date().toISOString()
        };

        try {
            var list = getJson("safeLifeOcorrencias", []);
            list.unshift(item);
            setJson("safeLifeOcorrencias", list);

            try {
                dbOcorrencias = list;
            } catch (e) {}
        } catch (e) {}

        try {
            if (typeof api === "function") {
                await api("/api/ocorrencias", {
                    method: "POST",
                    body: JSON.stringify(item)
                });
            }
        } catch (e) {}

        if (q("confirmMsg")) {
            q("confirmMsg").textContent = "Chamado enviado com sucesso.";
        }

        try {
            if (typeof toast === "function") toast("✅ Chamado enviado.");
            else if (typeof triggerToast === "function") triggerToast("✅ Chamado enviado.");
        } catch (e) {}

        showScreen("confirmationScreen");
    };

    function centerRescue() {
        var rescue = document.querySelector("#menuScreen .action-card[onclick*='rescue'], #menuScreen .rescue-card");

        if (!rescue) {
            var cards = Array.from(document.querySelectorAll("#menuScreen .action-card"));
            rescue = cards.find(function (card) {
                return (card.textContent || "").includes("Solicitar Resgate");
            });
        }

        if (!rescue) return;

        rescue.classList.add("rescue-card");
        rescue.onclick = function () {
            window.openCitizenForm("rescue");
        };

        rescue.style.gridColumn = "1 / -1";
        rescue.style.width = "220px";
        rescue.style.maxWidth = "220px";
        rescue.style.justifySelf = "center";
        rescue.style.placeSelf = "center";
        rescue.style.marginLeft = "auto";
        rescue.style.marginRight = "auto";
        rescue.style.textAlign = "center";
        rescue.style.alignItems = "center";
    }

    function cleanPetsTitle() {
        var title = document.querySelector(".pets-profile-card > h4");
        if (title) title.remove();

        var container = q("myPetsContainer");
        if (!container) return;

        var direct = container.querySelector(":scope > h4:first-child");
        if (direct) direct.remove();
    }

    function petCard(pet) {
        var p = pet;

        try {
            if (typeof normalizePet === "function") p = normalizePet(pet);
        } catch (e) {}

        var missing = !!p.desaparecido;

        return `
            <div class="safe-life-pet-card ${missing ? "missing" : ""}">
                <div class="safe-life-pet-top">
                    <img class="safe-life-pet-photo" src="${safeText(p.foto || p.photo || "")}" alt="Foto do pet">
                    <div class="safe-life-pet-info">
                        <h4>${missing ? "🚨" : "🐾"} ${safeText(p.nome || "Pet")}</h4>
                        <small>${safeText(p.especie || "Animal")} • ${safeText(p.raca || "Raça não informada")}</small>
                    </div>
                </div>
                <div class="safe-life-pet-lines">
                    <div class="safe-life-pet-line"><strong>Endereço:</strong> ${safeText(p.local || p.localizacao || "Não informado")}</div>
                    ${p.cor ? `<div class="safe-life-pet-line"><strong>Cor:</strong> ${safeText(p.cor)}</div>` : ""}
                </div>
            </div>
        `;
    }

    window.renderPerfilCidadao = async function () {
        var user = getLogged();

        if (!user) {
            alert("Entre na conta novamente.");
            showScreen("loginScreen");
            return;
        }

        saveLogged(user);

        if (q("profileAvatar")) q("profileAvatar").src = user.foto || user.avatar || "";
        if (q("citizenProfileName")) q("citizenProfileName").textContent = user.nome || user.name || "Cidadão";
        if (q("citizenProfileType")) q("citizenProfileType").textContent = "Cidadão";
        if (q("citizenProfileContact")) {
            q("citizenProfileContact").innerHTML =
                "CPF: " + safeText(user.cpf) +
                "<br>E-mail: " + safeText(user.email || "Não informado") +
                "<br>Telefone: " + safeText(user.telefone || user.phone || "Não informado");
        }

        if (q("editName")) q("editName").value = user.nome || user.name || "";
        if (q("editEmail")) q("editEmail").value = user.email || "";
        if (q("editPhone")) q("editPhone").value = user.telefone || user.phone || "";

        var pets = [];
        try {
            if (typeof loadPets === "function") pets = await loadPets({ donoCpf: user.cpf });
        } catch (e) {}

        if (!pets.length) {
            pets = getJson("safeLifePets", []).filter(function (pet) {
                return onlyCpf(pet.donoCpf || pet.ownerCpf || pet.dono_cpf) === onlyCpf(user.cpf);
            });
        }

        var notifications = getJson("safeLifeNotificacoes", []).filter(function (item) {
            return !item.citizenCpf || onlyCpf(item.citizenCpf) === onlyCpf(user.cpf);
        });

        var history = getJson("safeLifeHistoricoOcorrencias", []).filter(function (item) {
            return !item.citizenCpf || onlyCpf(item.citizenCpf || item.cpf_usuario || item.reporterCpf) === onlyCpf(user.cpf);
        });

        var container = q("myPetsContainer");
        if (container) {
            container.innerHTML = `
                <div class="safe-life-profile-block">
                    <h4>🔔 Notificações</h4>
                    ${notifications.length ? notifications.map(function (n) {
                        return `<div class="safe-notification-card"><div class="safe-notification-icon">🔔</div><div><strong>${safeText(n.title || "Atualização")}</strong><p>${safeText(n.message || "Sua ocorrência recebeu uma atualização.")}</p><small>${safeText(n.createdAt || "")}</small></div></div>`;
                    }).join("") : `<p class="empty-message">Nenhuma notificação ainda.</p>`}
                </div>

                <div class="safe-life-profile-block">
                    <h4>🐾 Meus Pets</h4>
                    <div class="safe-life-pet-grid">
                        ${pets.length ? pets.map(petCard).join("") : `<p class="empty-message">Nenhum pet cadastrado ainda.</p>`}
                    </div>
                </div>

                <div class="safe-life-profile-block">
                    <h4>✅ Ocorrências realizadas</h4>
                    ${history.length ? history.map(function (h) {
                        return `<div class="occurrence-card"><h4>✅ ${safeText(h.opcaoEscolhida || h.assunto || "Ocorrência")}</h4><p>${safeText(h.detalhes || "Sem descrição")}</p></div>`;
                    }).join("") : `<p class="empty-message">Nenhuma ocorrência concluída ainda.</p>`}
                </div>
            `;
        }

        cleanPetsTitle();
        showScreen("citizenProfile");
    };

    var originalLogin = window.autenticar;

    if (typeof originalLogin === "function") {
        window.autenticar = async function () {
            await originalLogin();

            try {
                if (typeof usuarioLogado !== "undefined" && usuarioLogado && usuarioLogado.cpf) {
                    saveLogged(usuarioLogado);
                }
            } catch (e) {}
        };
    }

    function boot() {
        centerRescue();
        cleanPetsTitle();

        var profileButtons = Array.from(document.querySelectorAll("button")).filter(function (button) {
            return (button.textContent || "").includes("Perfil");
        });

        profileButtons.forEach(function (button) {
            if (button.closest("#menuScreen") || button.closest("#citizenProfile")) {
                button.onclick = function () {
                    window.renderPerfilCidadao();
                };
            }
        });

        document.querySelectorAll(".screen, .btn, .action-card, .professional-tool-card, .occurrence-card").forEach(function (item) {
            item.style.transition = "none";
            item.style.animation = "none";
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();


/* SAFE LIFE V13 - patch pontual sem remover funções antigas */
(function () {
    function byId(id) {
        return document.getElementById(id);
    }

    function cleanCpf(value) {
        return String(value || "").replace(/\D/g, "");
    }

    function getJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw) ?? fallback;
        } catch (e) {
            return fallback;
        }
    }

    function setJson(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {}
    }

    function escapeHtml(value) {
        return String(value || "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char];
        });
    }

    function saveLoggedV13(user) {
        if (!user || !user.cpf) return null;

        try {
            usuarioLogado = user;
        } catch (e) {
            window.usuarioLogado = user;
        }

        try {
            window.usuarioLogado = user;
        } catch (e) {}

        setJson("safeLifeLoggedUser", user);

        try {
            localStorage.setItem("safeLifeLastCpf", user.cpf);
        } catch (e) {}

        return user;
    }

    function getLoggedV13() {
        try {
            if (typeof usuarioLogado !== "undefined" && usuarioLogado && usuarioLogado.cpf) {
                return saveLoggedV13(usuarioLogado);
            }
        } catch (e) {}

        try {
            if (window.usuarioLogado && window.usuarioLogado.cpf) {
                return saveLoggedV13(window.usuarioLogado);
            }
        } catch (e) {}

        const saved = getJson("safeLifeLoggedUser", null);
        if (saved && saved.cpf) return saveLoggedV13(saved);

        const users = getJson("safeLifeUsuarios", []);
        const lastCpf = localStorage.getItem("safeLifeLastCpf") || "";

        if (lastCpf) {
            const found = users.find(user => cleanCpf(user.cpf) === cleanCpf(lastCpf));
            if (found) return saveLoggedV13(found);
        }

        const cpfInput = byId("cpfInput");
        if (cpfInput && cpfInput.value) {
            const foundByInput = users.find(user => cleanCpf(user.cpf) === cleanCpf(cpfInput.value));
            if (foundByInput) return saveLoggedV13(foundByInput);
        }

        return null;
    }

    function fastScreenV13(screenId) {
        document.querySelectorAll(".screen").forEach(function (screen) {
            screen.classList.remove("active");
            screen.style.display = "";
        });

        const target = byId(screenId);

        if (!target) return;

        target.classList.add("active");

        try {
            window.scrollTo(0, 0);
        } catch (e) {}
    }

    window.nextScreen = fastScreenV13;

    function centerRescueV13() {
        let rescue = document.querySelector("#menuScreen .rescue-card");

        if (!rescue) {
            rescue = document.querySelector("#menuScreen button[onclick*='rescue']");
        }

        if (!rescue) {
            rescue = Array.from(document.querySelectorAll("#menuScreen .action-card")).find(function (card) {
                return (card.textContent || "").includes("Solicitar Resgate");
            });
        }

        if (!rescue) return;

        rescue.classList.add("rescue-card");
        rescue.setAttribute("onclick", "openCitizenForm('rescue')");

        rescue.style.gridColumn = "1 / -1";
        rescue.style.width = "220px";
        rescue.style.maxWidth = "220px";
        rescue.style.justifySelf = "center";
        rescue.style.placeSelf = "center";
        rescue.style.marginLeft = "auto";
        rescue.style.marginRight = "auto";
        rescue.style.textAlign = "center";
        rescue.style.alignItems = "center";
    }

    function cleanPetsTitleV13() {
        const outsideTitle = document.querySelector(".pets-profile-card > h4");
        if (outsideTitle) outsideTitle.remove();

        const container = byId("myPetsContainer");
        if (!container) return;

        const directTitle = container.querySelector(":scope > h4:first-child");
        if (directTitle) directTitle.remove();
    }

    function optionsRenderV13(containerId, options, hiddenId) {
        const container = byId(containerId);
        if (!container) return;

        container.innerHTML = "";

        (options || []).forEach(function (option) {
            const card = document.createElement("button");
            card.type = "button";
            card.className = "quick-option-card";
            card.innerHTML = `
                <div class="quick-option-icon">${escapeHtml(option.icon || "🐾")}</div>
                <div class="quick-option-title">${escapeHtml(option.title || "Opção")}</div>
                <div class="quick-option-desc">${escapeHtml(option.desc || "")}</div>
            `;

            card.onclick = function () {
                container.querySelectorAll(".quick-option-card").forEach(function (item) {
                    item.classList.remove("selected", "active");
                });

                card.classList.add("selected", "active");

                const hidden = byId(hiddenId);
                if (hidden) hidden.value = option.title || "";
            };

            container.appendChild(card);
        });
    }

    window.openCitizenForm = function (typeKey) {
        let configs = null;

        try {
            configs = FORM_CONFIGS;
        } catch (e) {
            configs = window.FORM_CONFIGS || null;
        }

        if (!configs || !configs[typeKey]) {
            alert("Tipo de chamado não encontrado.");
            return;
        }

        try {
            currentFormConfig = configs[typeKey];
        } catch (e) {
            window.currentFormConfig = configs[typeKey];
        }

        const form = byId("citizenForm");
        if (form) form.reset();

        const title = byId("formTitle");
        const subtitle = byId("formSubtitle");
        const key = byId("formKey");
        const hidden = byId("selectedQuickOption");

        if (key) key.value = typeKey;
        if (title) title.textContent = configs[typeKey].title || "Abrir Chamado";
        if (subtitle) subtitle.textContent = configs[typeKey].subtitle || "Preencha os dados do chamado.";
        if (hidden) hidden.value = "";

        try {
            if (typeof renderOptions === "function") {
                renderOptions("quickOptionsGrid", configs[typeKey].options, "selectedQuickOption");
            } else {
                optionsRenderV13("quickOptionsGrid", configs[typeKey].options, "selectedQuickOption");
            }
        } catch (e) {
            optionsRenderV13("quickOptionsGrid", configs[typeKey].options, "selectedQuickOption");
        }

        try {
            if (typeof obterTextoLocalizacaoAtual === "function") {
                const location = obterTextoLocalizacaoAtual();
                if (location && byId("formLocation")) byId("formLocation").value = location;
            }
        } catch (e) {}

        fastScreenV13("scrForm");
    };

    function petCardV13(pet) {
        let p = pet;

        try {
            if (typeof normalizePet === "function") p = normalizePet(pet);
        } catch (e) {}

        const missing = Boolean(p.desaparecido);

        return `
            <div class="safe-life-pet-card ${missing ? "missing" : ""}">
                <div class="safe-life-pet-top">
                    <img class="safe-life-pet-photo" src="${escapeHtml(p.foto || p.photo || "")}" alt="Foto do pet">
                    <div class="safe-life-pet-info">
                        <h4>${missing ? "🚨" : "🐾"} ${escapeHtml(p.nome || "Pet")}</h4>
                        <small>${escapeHtml(p.especie || "Animal")} • ${escapeHtml(p.raca || "Raça não informada")}</small><br>
                        <span class="${missing ? "safe-life-alert-badge" : "safe-life-normal-badge"}">${missing ? "DESAPARECIDO" : "CADASTRADO"}</span>
                    </div>
                </div>
                <div class="safe-life-pet-lines">
                    <div class="safe-life-pet-line"><strong>Endereço:</strong> ${escapeHtml(p.local || p.localizacao || "Não informado")}</div>
                    ${p.cor ? `<div class="safe-life-pet-line"><strong>Cor:</strong> ${escapeHtml(p.cor)}</div>` : ""}
                </div>
            </div>
        `;
    }

    window.renderPerfilCidadao = async function () {
        const user = getLoggedV13();

        if (!user) {
            alert("Sessão não encontrada. Entre novamente.");
            fastScreenV13("loginScreen");
            return;
        }

        saveLoggedV13(user);

        const avatar = byId("profileAvatar");
        if (avatar) avatar.src = user.foto || user.avatar || "";

        const name = byId("citizenProfileName");
        if (name) name.textContent = user.nome || user.name || "Cidadão";

        const type = byId("citizenProfileType");
        if (type) type.textContent = "Cidadão";

        const contact = byId("citizenProfileContact");
        if (contact) {
            contact.innerHTML =
                "CPF: " + escapeHtml(user.cpf) +
                "<br>E-mail: " + escapeHtml(user.email || "Não informado") +
                "<br>Telefone: " + escapeHtml(user.telefone || user.phone || "Não informado");
        }

        const editName = byId("editName");
        const editEmail = byId("editEmail");
        const editPhone = byId("editPhone");

        if (editName) editName.value = user.nome || user.name || "";
        if (editEmail) editEmail.value = user.email || "";
        if (editPhone) editPhone.value = user.telefone || user.phone || "";

        let pets = [];

        try {
            if (typeof loadPets === "function") {
                pets = await loadPets({ donoCpf: user.cpf });
            }
        } catch (e) {
            pets = [];
        }

        if (!pets || !pets.length) {
            pets = getJson("safeLifePets", []).filter(function (pet) {
                return cleanCpf(pet.donoCpf || pet.ownerCpf || pet.dono_cpf) === cleanCpf(user.cpf);
            });
        }

        const notifications = getJson("safeLifeNotificacoes", []).filter(function (item) {
            return !item.citizenCpf || cleanCpf(item.citizenCpf) === cleanCpf(user.cpf);
        });

        const history = getJson("safeLifeHistoricoOcorrencias", []).filter(function (item) {
            return !item.citizenCpf || cleanCpf(item.citizenCpf || item.cpf_usuario || item.reporterCpf) === cleanCpf(user.cpf);
        });

        const container = byId("myPetsContainer");

        if (container) {
            container.innerHTML = `
                <div class="safe-life-profile-block">
                    <h4>🔔 Notificações</h4>
                    ${notifications.length ? notifications.map(function (n) {
                        return `<div class="safe-notification-card"><div class="safe-notification-icon">🔔</div><div><strong>${escapeHtml(n.title || "Atualização")}</strong><p>${escapeHtml(n.message || "Sua ocorrência recebeu uma atualização.")}</p><small>${escapeHtml(n.createdAt || "")}</small></div></div>`;
                    }).join("") : `<p class="empty-message">Nenhuma notificação ainda.</p>`}
                </div>

                <div class="safe-life-profile-block">
                    <h4>🐾 Meus Pets</h4>
                    <div class="safe-life-pet-grid">
                        ${pets.length ? pets.map(petCardV13).join("") : `<p class="empty-message">Nenhum pet cadastrado ainda.</p>`}
                    </div>
                </div>

                <div class="safe-life-profile-block">
                    <h4>✅ Ocorrências realizadas</h4>
                    ${history.length ? history.map(function (h) {
                        return `<div class="occurrence-card"><h4>✅ ${escapeHtml(h.opcaoEscolhida || h.assunto || "Ocorrência")}</h4><p>${escapeHtml(h.detalhes || "Sem descrição")}</p></div>`;
                    }).join("") : `<p class="empty-message">Nenhuma ocorrência concluída ainda.</p>`}
                </div>
            `;
        }

        cleanPetsTitleV13();
        fastScreenV13("citizenProfile");
    };

    const oldLogin = window.autenticar;

    if (typeof oldLogin === "function") {
        window.autenticar = async function () {
            await oldLogin();

            try {
                if (typeof usuarioLogado !== "undefined" && usuarioLogado && usuarioLogado.cpf) {
                    saveLoggedV13(usuarioLogado);
                }
            } catch (e) {}
        };
    }

    function bootV13() {
        centerRescueV13();
        cleanPetsTitleV13();

        const profileButtons = Array.from(document.querySelectorAll("button")).filter(function (button) {
            return (button.textContent || "").includes("Perfil");
        });

        profileButtons.forEach(function (button) {
            if (button.closest("#menuScreen") || button.closest("#citizenProfile")) {
                button.onclick = function () {
                    window.renderPerfilCidadao();
                };
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootV13);
    } else {
        bootV13();
    }
})();
/* =====================================================
   SAFE LIFE V14 — INTEGRAÇÃO ONLINE / LOGIN / ADMIN
   Compatível com:
   - HTML com campos de senha
   - Render
   - Supabase/PostgreSQL
   - server.js com token Bearer
   - GitHub Pages
===================================================== */

(function () {
    "use strict";

    const DEFAULT_API_URL = "https://safe-life.onrender.com";
    const API_URL_STORAGE_KEY = "safeLifeApiUrl";
    const AUTH_TOKEN_STORAGE_KEY = "safeLifeAuthToken";
    const LOGGED_USER_STORAGE_KEY = "safeLifeLoggedUser";
    const USERS_STORAGE_KEY = "safeLifeUsuarios";
    const COMPANIES_STORAGE_KEY = "safeLifeEmpresas";
    const ADMIN_MASTER_CPF = "45317828791";

    const nativeFetch = window.fetch.bind(window);

    function byId(id) {
        return document.getElementById(id);
    }

    function textValue(id) {
        const element = byId(id);
        return element ? String(element.value || "").trim() : "";
    }

    function cleanCpf(value) {
        return String(value || "").replace(/\D/g, "");
    }

    function normalizeApiBase(value) {
        return String(value || "")
            .trim()
            .replace(/\/+$/, "")
            .replace(/\/api$/i, "");
    }

    function readJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function writeJson(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn("Não foi possível salvar no navegador:", key);
        }
    }

    function toastV14(message) {
        if (typeof window.triggerToast === "function") {
            window.triggerToast(message);
            return;
        }

        const toast = byId("toast");

        if (!toast) {
            console.log(message);
            return;
        }

        toast.textContent = message;
        toast.classList.add("show");

        window.setTimeout(function () {
            toast.classList.remove("show");
        }, 2600);
    }

    function discoverApiBase(interactive) {
        const fixedApiUrl = normalizeApiBase(DEFAULT_API_URL);
        localStorage.setItem(API_URL_STORAGE_KEY, fixedApiUrl);
        window.SAFE_LIFE_API_URL = fixedApiUrl;
        return fixedApiUrl;


        const fromWindow = normalizeApiBase(window.SAFE_LIFE_API_URL);

        if (fromWindow) {
            localStorage.setItem(API_URL_STORAGE_KEY, fromWindow);
            return fromWindow;
        }

        const meta = document.querySelector('meta[name="safe-life-api-url"]');
        const fromMeta = normalizeApiBase(meta ? meta.getAttribute("content") : "");

        if (fromMeta) {
            localStorage.setItem(API_URL_STORAGE_KEY, fromMeta);
            return fromMeta;
        }

        const fromStorage = normalizeApiBase(localStorage.getItem(API_URL_STORAGE_KEY));

        if (fromStorage) {
            return fromStorage;
        }

        const host = String(window.location.hostname || "").toLowerCase();

        if (
            host === "localhost" ||
            host === "127.0.0.1" ||
            host === "0.0.0.0"
        ) {
            return "http://localhost:3000";
        }

        if (host.endsWith(".onrender.com")) {
            return normalizeApiBase(window.location.origin);
        }

        if (interactive && host.endsWith(".github.io")) {
            const informed = window.prompt(
                "Cole o endereço do servidor no Render.\n\nExemplo:\nhttps://safe-life-xxxx.onrender.com"
            );

            const normalized = normalizeApiBase(informed);

            if (normalized) {
                localStorage.setItem(API_URL_STORAGE_KEY, normalized);
                window.SAFE_LIFE_API_URL = normalized;
                return normalized;
            }
        }

        return "";
    }

    window.configurarServidorSafeLife = function configurarServidorSafeLife(url) {
        const normalized = normalizeApiBase(url);

        if (!normalized || !/^https?:\/\//i.test(normalized)) {
            throw new Error("Informe uma URL válida começando com http:// ou https://.");
        }

        localStorage.setItem(API_URL_STORAGE_KEY, normalized);
        window.SAFE_LIFE_API_URL = normalized;
        toastV14("✅ Servidor do Safe Life configurado.");
        return normalized;
    };

    window.removerServidorSafeLife = function removerServidorSafeLife() {
        localStorage.removeItem(API_URL_STORAGE_KEY);
        delete window.SAFE_LIFE_API_URL;
        toastV14("Configuração do servidor removida.");
    };

    function isApiUrl(url) {
        const value = String(url || "");

        return (
            value.startsWith("/api/") ||
            value === "/api" ||
            value.startsWith("http://localhost:3000/api/") ||
            value.startsWith("https://localhost:3000/api/") ||
            /\/api(?:\/|$)/i.test(value)
        );
    }

    function buildApiUrl(inputUrl, interactive) {
        let url = String(inputUrl || "");

        if (!isApiUrl(url)) {
            return url;
        }

        const apiBase = discoverApiBase(interactive);

        if (!apiBase) {
            if (url.startsWith("/api")) {
                return url;
            }

            return url.replace(/^https?:\/\/localhost:3000/i, "");
        }

        if (/^https?:\/\/localhost:3000/i.test(url)) {
            return apiBase + url.replace(/^https?:\/\/localhost:3000/i, "");
        }

        if (url.startsWith("/api")) {
            return apiBase + url;
        }

        try {
            const parsed = new URL(url);
            return apiBase + parsed.pathname + parsed.search + parsed.hash;
        } catch (error) {
            return url;
        }
    }

    function getAuthToken() {
        return String(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "");
    }

    function saveAuthToken(token) {
        if (token) {
            localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, String(token));
        } else {
            localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        }
    }

    function withApiHeaders(inputHeaders) {
        const headers = new Headers(inputHeaders || {});

        if (!headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
        }

        const token = getAuthToken();

        if (token && !headers.has("Authorization")) {
            headers.set("Authorization", "Bearer " + token);
        }

        return headers;
    }

    window.fetch = async function safeLifeFetch(input, init) {
        const config = { ...(init || {}) };

        let originalUrl = "";

        if (typeof input === "string") {
            originalUrl = input;
        } else if (input && typeof input.url === "string") {
            originalUrl = input.url;
        }

        if (!isApiUrl(originalUrl)) {
            return nativeFetch(input, config);
        }

        const finalUrl = buildApiUrl(originalUrl, true);
        config.headers = withApiHeaders(config.headers);

        return nativeFetch(finalUrl, config);
    };

    async function parseApiResponse(response) {
        const contentType = String(response.headers.get("content-type") || "");
        let data = null;

        if (contentType.includes("application/json")) {
            data = await response.json().catch(function () {
                return null;
            });
        } else {
            const text = await response.text().catch(function () {
                return "";
            });

            data = text ? { message: text } : null;
        }

        if (!response.ok) {
            const message =
                (data && (data.error || data.message || data.details)) ||
                "Não foi possível concluir a operação.";

            const error = new Error(String(message));
            error.status = response.status;
            error.data = data;
            throw error;
        }

        return data;
    }

    async function safeLifeApi(endpoint, options) {
        const apiBase = discoverApiBase(true);

        if (!apiBase && String(window.location.hostname || "").endsWith(".github.io")) {
            throw new Error(
                "O endereço do Render ainda não foi configurado. Recarregue a página e cole a URL do servidor."
            );
        }

        const response = await window.fetch(endpoint, {
            ...(options || {}),
            headers: withApiHeaders(options && options.headers)
        });

        return parseApiResponse(response);
    }

    window.safeLifeApi = safeLifeApi;

    try {
        apiRequest = safeLifeApi;
    } catch (error) {}

    window.apiRequest = safeLifeApi;

    function normalizeUser(user, fallbackType) {
        if (!user) return null;

        const type = user.type || user.tipo || fallbackType || "citizen";
        const company = user.company || user.empresa || (type === "professional" ? "Safe Life Matriz" : null);

        const originalPhotoByCpf = {
            "11111111111": "img/pequenochinique.jpeg",
            "99999999999": "img/corredorzeca.jpeg",
            "45317828791": "img/apenasumsiri.jpeg"
        };

        const originalPhoto = originalPhotoByCpf[cleanCpf(user.cpf)] || "";

        const professional = {
            cargo: user.cargo || (user.profissional && user.profissional.cargo) || "Agente Operacional",
            especialidade:
                user.especialidade ||
                (user.profissional && user.profissional.especialidade) ||
                "Resgate e triagem animal",
            regiao:
                user.regiaoAtendimento ||
                user.regiao_atendimento ||
                (user.profissional && (user.profissional.regiao || user.profissional.regiaoAtendimento)) ||
                "",
            plantao:
                user.statusPlantao ||
                user.status_plantao ||
                (user.profissional && (user.profissional.plantao || user.profissional.statusPlantao)) ||
                "Disponível",
            veiculo: user.veiculo || (user.profissional && user.profissional.veiculo) || "",
            equipe: user.equipe || (user.profissional && user.profissional.equipe) || "",
            registro:
                user.registroProfissional ||
                user.registro_profissional ||
                (user.profissional && (user.profissional.registro || user.profissional.registroProfissional)) ||
                "",
            observacoes:
                user.bioProfissional ||
                user.bio_profissional ||
                (user.profissional && (user.profissional.observacoes || user.profissional.bioProfissional)) ||
                ""
        };

        return {
            ...user,
            cpf: cleanCpf(user.cpf),
            type,
            tipo: type,
            company,
            empresa: company,
            foto: originalPhoto || user.foto || user.foto_perfil || user.avatar || "",
            telefone: user.telefone || user.phone || "",
            ativo: user.ativo !== false,
            profissional: type === "professional" || type === "admin"
                ? professional
                : user.profissional
        };
    }

    function upsertLocalUser(user) {
        const normalized = normalizeUser(user);

        if (!normalized || !normalized.cpf) return normalized;

        const users = readJson(USERS_STORAGE_KEY, []);
        const index = users.findIndex(function (item) {
            return cleanCpf(item.cpf) === normalized.cpf;
        });

        if (index >= 0) {
            users[index] = {
                ...users[index],
                ...normalized
            };
        } else {
            users.unshift(normalized);
        }

        writeJson(USERS_STORAGE_KEY, users);
        return normalized;
    }

    function saveLoggedUser(user, token) {
        const normalized = upsertLocalUser(user);

        if (!normalized) return null;

        saveAuthToken(token);
        writeJson(LOGGED_USER_STORAGE_KEY, normalized);
        localStorage.setItem("safeLifeLastCpf", normalized.cpf);

        try {
            usuarioLogado = normalized;
        } catch (error) {
            window.usuarioLogado = normalized;
        }

        window.usuarioLogado = normalized;
        return normalized;
    }

    function clearLoggedUser() {
        saveAuthToken("");
        localStorage.removeItem(LOGGED_USER_STORAGE_KEY);
        localStorage.removeItem("safeLifeLastCpf");

        try {
            usuarioLogado = null;
        } catch (error) {}

        window.usuarioLogado = null;
    }

    function setButtonBusy(button, busy, busyText) {
        if (!button) return;

        if (busy) {
            button.dataset.originalText = button.textContent;
            button.disabled = true;
            button.textContent = busyText || "Aguarde...";
        } else {
            button.disabled = false;

            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
            }
        }
    }

    function findActionButton(onclickPart) {
        return document.querySelector('button[onclick*="' + onclickPart + '"]');
    }

    function routeLoggedUser(user) {
        if (!user) return;

        if (user.type === "admin" || user.cpf === ADMIN_MASTER_CPF) {
            if (typeof window.inicializarPainelAdmin === "function") {
                window.inicializarPainelAdmin();
            } else if (typeof window.nextScreen === "function") {
                window.nextScreen("adminDashboard");
            }

            return;
        }

        if (user.type === "professional") {
            if (typeof window.inicializarPainelPro === "function") {
                window.inicializarPainelPro();
            } else if (typeof window.nextScreen === "function") {
                window.nextScreen("proDashboard");
            }

            return;
        }

        if (typeof window.nextScreen === "function") {
            window.nextScreen("menuScreen");
        }
    }

    window.efetuarCadastro = async function efetuarCadastroV14() {
        const button = findActionButton("efetuarCadastro");

        const nome = textValue("regName");
        const userCpf = cleanCpf(textValue("regCpf"));
        const email = textValue("regEmail");
        const telefone = textValue("regPhone");
        const senha = textValue("regPassword");
        const confirmarSenha = textValue("regPasswordConfirm");
        const type = textValue("regType") || "citizen";
        const company = textValue("regCompany");

        if (!nome || !userCpf || !email || !telefone || !senha || !confirmarSenha) {
            alert("Preencha nome, CPF, e-mail, telefone e senha.");
            return;
        }

        if (userCpf.length !== 11) {
            alert("Digite um CPF válido com 11 números.");
            return;
        }

        if (userCpf === ADMIN_MASTER_CPF) {
            alert("Este CPF é reservado para o administrador.");
            return;
        }

        if (senha.length < 6) {
            alert("A senha precisa ter pelo menos 6 caracteres.");
            return;
        }

        if (senha !== confirmarSenha) {
            alert("As duas senhas precisam ser iguais.");
            return;
        }

        if (
            typeof window.validarEmail === "function" &&
            !window.validarEmail(email)
        ) {
            alert("Digite um e-mail válido.");
            return;
        }

        if (type === "professional" && !company) {
            alert("Selecione a empresa do profissional.");
            return;
        }

        const payload = {
            nome,
            cpf: userCpf,
            email,
            telefone,
            senha,
            type,
            company: type === "professional" ? company : null,
            foto:
                typeof fotoCadastroBase64 !== "undefined" && fotoCadastroBase64
                    ? fotoCadastroBase64
                    : ""
        };

        try {
            setButtonBusy(button, true, "Criando cadastro...");

            const response = await safeLifeApi("/api/auth/register", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            const user = saveLoggedUser(response.user || payload, response.token);

            if (typeof window.limparFormularioCadastro === "function") {
                window.limparFormularioCadastro();
            } else {
                [
                    "regName",
                    "regCpf",
                    "regEmail",
                    "regPhone",
                    "regPassword",
                    "regPasswordConfirm"
                ].forEach(function (id) {
                    const field = byId(id);
                    if (field) field.value = "";
                });
            }

            toastV14("✅ Cadastro criado e conectado ao banco!");
            routeLoggedUser(user);
        } catch (error) {
            console.error("Erro no cadastro:", error);
            alert(error.message || "Não foi possível criar o cadastro.");
        } finally {
            setButtonBusy(button, false);
        }
    };

    window.autenticar = async function autenticarV14() {
        const button = findActionButton("autenticar");

        const userCpf = cleanCpf(textValue("cpfInput"));
        const senha = textValue("loginPassword");
        const role = textValue("loginRole") || "citizen";
        const company = textValue("loginCompany");

        if (!userCpf || !senha) {
            alert("Digite o CPF e a senha.");
            return;
        }

        if (userCpf.length !== 11) {
            alert("Digite um CPF válido com 11 números.");
            return;
        }

        if (userCpf === ADMIN_MASTER_CPF && role !== "admin") {
            alert("Selecione a Área Administrativa para entrar com esse CPF.");
            return;
        }

        try {
            setButtonBusy(button, true, "Entrando...");

            const response = await safeLifeApi("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    cpf: userCpf,
                    senha,
                    role,
                    company: role === "professional" ? company : null
                })
            });

            const user = saveLoggedUser(response.user, response.token);

            if (!user) {
                throw new Error("O servidor não devolveu os dados do usuário.");
            }

            const passwordField = byId("loginPassword");
            if (passwordField) passwordField.value = "";

            toastV14("🚀 Login realizado com sucesso!");
            routeLoggedUser(user);
        } catch (error) {
            console.error("Erro no login:", error);
            alert(error.message || "Não foi possível entrar.");
        } finally {
            setButtonBusy(button, false);
        }
    };

    window.logout = function logoutV14() {
        clearLoggedUser();
        toastV14("Sessão encerrada.");

        if (typeof window.nextScreen === "function") {
            window.nextScreen("loginScreen");
        }
    };

    function escapeHtml(value) {
        return String(value || "").replace(/[&<>"']/g, function (char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char];
        });
    }

    function adminUserCard(user) {
        const normalized = normalizeUser(user);
        const inactive = normalized.ativo === false;

        return `
            <article class="admin-user-card ${inactive ? "inactive" : ""}">
                <div class="admin-user-top">
                    ${
                        normalized.foto
                            ? `<img class="admin-user-avatar" src="${escapeHtml(normalized.foto)}" alt="Foto de ${escapeHtml(normalized.nome)}">`
                            : `<div class="admin-user-avatar">👤</div>`
                    }
                    <div class="admin-user-info">
                        <h4>${escapeHtml(normalized.nome || "Usuário")}</h4>
                        <p>${escapeHtml(normalized.email || "E-mail não informado")}</p>
                        <small>CPF: ${escapeHtml(normalized.cpf)}</small>
                    </div>
                </div>

                <div class="admin-chip-row">
                    <span class="admin-chip">${escapeHtml(normalized.type || "citizen")}</span>
                    <span class="admin-chip ${inactive ? "red" : "green"}">
                        ${inactive ? "Bloqueado" : "Ativo"}
                    </span>
                    ${
                        normalized.company
                            ? `<span class="admin-chip gray">${escapeHtml(normalized.company)}</span>`
                            : ""
                    }
                </div>

                ${
                    normalized.cpf !== ADMIN_MASTER_CPF
                        ? `
                            <div class="admin-actions">
                                <button
                                    type="button"
                                    class="btn ${inactive ? "admin-success-btn" : "admin-danger-btn"}"
                                    onclick="alternarUsuarioAdminFinal('${escapeHtml(normalized.cpf)}', ${inactive ? "true" : "false"})"
                                >
                                    ${inactive ? "Reativar" : "Bloquear"}
                                </button>

                                <button
                                    type="button"
                                    class="btn admin-delete-btn"
                                    onclick="excluirContaAdmin('${escapeHtml(normalized.cpf)}')"
                                >
                                    Excluir
                                </button>
                            </div>
                        `
                        : ""
                }
            </article>
        `;
    }

    async function fetchAdminUsers() {
        const response = await safeLifeApi("/api/admin/users");
        const users = Array.isArray(response) ? response : [];
        writeJson(USERS_STORAGE_KEY, users.map(function (user) {
            return normalizeUser(user);
        }));
        return users;
    }

    window.abrirGerenciarUsuarios = async function abrirGerenciarUsuariosV14() {
        const container = byId("adminUsersList");

        if (container) {
            container.innerHTML = `
                <div class="occurrence-card">
                    <h4>Carregando usuários...</h4>
                </div>
            `;
        }

        try {
            const users = await fetchAdminUsers();

            if (container) {
                container.innerHTML = users.length
                    ? users.map(adminUserCard).join("")
                    : `<div class="occurrence-card"><h4>Nenhum usuário cadastrado.</h4></div>`;
            }

            if (typeof window.nextScreen === "function") {
                window.nextScreen("adminUsersScreen");
            }
        } catch (error) {
            console.error("Erro ao listar usuários:", error);
            alert(error.message || "Não foi possível carregar os usuários.");
        }
    };

    window.alternarUsuarioAdminFinal = async function alternarUsuarioAdminFinalV14(
        userCpf,
        ativo
    ) {
        const cleaned = cleanCpf(userCpf);

        if (!cleaned || cleaned === ADMIN_MASTER_CPF) return;

        try {
            await safeLifeApi("/api/admin/users/" + encodeURIComponent(cleaned) + "/status", {
                method: "PATCH",
                body: JSON.stringify({
                    ativo: Boolean(ativo)
                })
            });

            toastV14(ativo ? "Conta reativada." : "Conta bloqueada.");
            await window.abrirGerenciarUsuarios();
        } catch (error) {
            console.error("Erro ao alterar conta:", error);
            alert(error.message || "Não foi possível alterar a conta.");
        }
    };

    window.bloquearContaAdmin = async function bloquearContaAdminV14(userCpf) {
        const cleaned = cleanCpf(userCpf);
        const users = readJson(USERS_STORAGE_KEY, []);
        const user = users.find(function (item) {
            return cleanCpf(item.cpf) === cleaned;
        });

        await window.alternarUsuarioAdminFinal(
            cleaned,
            user ? user.ativo === false : false
        );
    };

    window.excluirContaAdmin = async function excluirContaAdminV14(userCpf) {
        const cleaned = cleanCpf(userCpf);

        if (!cleaned || cleaned === ADMIN_MASTER_CPF) {
            alert("A conta do administrador master não pode ser excluída.");
            return;
        }

        if (!window.confirm("Excluir permanentemente esta conta?")) {
            return;
        }

        try {
            await safeLifeApi(
                "/api/admin/users/" + encodeURIComponent(cleaned) + "/permanent",
                {
                    method: "DELETE"
                }
            );

            toastV14("🗑️ Conta excluída.");
            await window.abrirGerenciarUsuarios();
        } catch (error) {
            console.error("Erro ao excluir conta:", error);
            alert(error.message || "Não foi possível excluir a conta.");
        }
    };

    window.cadastrarProfissionalAdmin = async function cadastrarProfissionalAdminV14(event) {
        if (event && typeof event.preventDefault === "function") {
            event.preventDefault();
        }

        const button = findActionButton("cadastrarProfissionalAdmin");

        const nome = textValue("adminProName");
        const userCpf = cleanCpf(textValue("adminProCpf"));
        const email = textValue("adminProEmail");
        const telefone = textValue("adminProPhone");
        const senha = textValue("adminProPassword");
        const confirmarSenha = textValue("adminProPasswordConfirm");
        const company = textValue("adminProCompany");
        const cargo = textValue("adminProRole") || "Agente Operacional";
        const especialidade = textValue("adminProSpecialty");
        const regiaoAtendimento = textValue("adminProRegion");
        const veiculo = textValue("adminProVehicle");
        const statusPlantao = textValue("adminProShiftStatus") || "Disponível";
        const equipe = textValue("adminProTeam");

        if (!nome || !userCpf || !email || !telefone || !senha || !confirmarSenha || !company) {
            alert("Preencha todos os dados obrigatórios do profissional.");
            return;
        }

        if (userCpf.length !== 11) {
            alert("Digite um CPF válido com 11 números.");
            return;
        }

        if (senha.length < 6) {
            alert("A senha inicial precisa ter pelo menos 6 caracteres.");
            return;
        }

        if (senha !== confirmarSenha) {
            alert("As duas senhas iniciais precisam ser iguais.");
            return;
        }

        try {
            setButtonBusy(button, true, "Criando profissional...");

            const response = await safeLifeApi("/api/admin/profissionais", {
                method: "POST",
                body: JSON.stringify({
                    nome,
                    cpf: userCpf,
                    email,
                    telefone,
                    senha,
                    company,
                    profissional: {
                        cargo,
                        especialidade,
                        regiaoAtendimento,
                        statusPlantao,
                        veiculo,
                        equipe
                    }
                })
            });

            upsertLocalUser(response.user);

            [
                "adminProName",
                "adminProCpf",
                "adminProEmail",
                "adminProPhone",
                "adminProPassword",
                "adminProPasswordConfirm",
                "adminProRegion",
                "adminProTeam"
            ].forEach(function (id) {
                const field = byId(id);
                if (field) field.value = "";
            });

            toastV14("👷 Profissional cadastrado no banco!");
            await window.abrirGerenciarUsuarios();
        } catch (error) {
            console.error("Erro ao cadastrar profissional:", error);
            alert(error.message || "Não foi possível cadastrar o profissional.");
        } finally {
            setButtonBusy(button, false);
        }
    };

    function companyCard(company) {
        const inactive = company.ativo === false;

        return `
            <article class="company-card ${inactive ? "inactive" : ""}">
                <div class="company-top">
                    <div class="company-icon">🏢</div>
                    <div class="company-info">
                        <h4>${escapeHtml(company.nome || "Empresa")}</h4>
                        <p>${escapeHtml(company.tipo || "Parceira")}</p>
                        <small>${escapeHtml(company.email || "E-mail não informado")}</small>
                    </div>
                </div>

                <div class="admin-chip-row">
                    <span class="admin-chip ${inactive ? "red" : "green"}">
                        ${inactive ? "Inativa" : "Ativa"}
                    </span>
                    ${
                        company.telefone
                            ? `<span class="admin-chip gray">${escapeHtml(company.telefone)}</span>`
                            : ""
                    }
                </div>

                <div class="admin-warning-box">
                    <strong>Endereço:</strong>
                    ${escapeHtml(company.endereco || "Não informado")}
                </div>

                <div class="admin-actions">
                    <button
                        type="button"
                        class="btn ${inactive ? "admin-success-btn" : "admin-danger-btn"}"
                        onclick="alterarStatusEmpresaAdmin('${escapeHtml(company.id)}', ${inactive ? "true" : "false"})"
                    >
                        ${inactive ? "Ativar" : "Desativar"}
                    </button>

                    <button
                        type="button"
                        class="btn admin-delete-btn"
                        onclick="excluirEmpresaAdmin('${escapeHtml(company.id)}')"
                    >
                        Excluir
                    </button>
                </div>
            </article>
        `;
    }

    async function fetchCompanies() {
        const response = await safeLifeApi("/api/empresas");
        const companies = Array.isArray(response) ? response : [];
        writeJson(COMPANIES_STORAGE_KEY, companies);
        return companies;
    }

    window.abrirEmpresasAdmin = async function abrirEmpresasAdminV14() {
        const container = byId("adminCompaniesList");

        if (container) {
            container.innerHTML = `
                <div class="occurrence-card">
                    <h4>Carregando empresas...</h4>
                </div>
            `;
        }

        try {
            const companies = await fetchCompanies();

            if (container) {
                container.innerHTML = companies.length
                    ? companies.map(companyCard).join("")
                    : `<div class="occurrence-card"><h4>Nenhuma empresa cadastrada.</h4></div>`;
            }

            if (typeof window.renderizarSelectEmpresas === "function") {
                window.renderizarSelectEmpresas();
            }

            if (typeof window.nextScreen === "function") {
                window.nextScreen("adminCompaniesScreen");
            }
        } catch (error) {
            console.error("Erro ao listar empresas:", error);
            alert(error.message || "Não foi possível carregar as empresas.");
        }
    };

    window.cadastrarEmpresaAdmin = async function cadastrarEmpresaAdminV14(event) {
        if (event && typeof event.preventDefault === "function") {
            event.preventDefault();
        }

        const button = findActionButton("cadastrarEmpresaAdmin");

        const nome = textValue("adminCompanyName");
        const tipo = textValue("adminCompanyType") || "Empresa parceira";
        const cnpj = textValue("adminCompanyCnpj");
        const telefone = textValue("adminCompanyPhone");
        const email = textValue("adminCompanyEmail");
        const endereco = textValue("adminCompanyAddress");

        if (!nome) {
            alert("Digite o nome da empresa.");
            return;
        }

        try {
            setButtonBusy(button, true, "Salvando empresa...");

            await safeLifeApi("/api/admin/empresas", {
                method: "POST",
                body: JSON.stringify({
                    nome,
                    tipo,
                    cnpj,
                    telefone,
                    email,
                    endereco
                })
            });

            [
                "adminCompanyName",
                "adminCompanyCnpj",
                "adminCompanyPhone",
                "adminCompanyEmail",
                "adminCompanyAddress"
            ].forEach(function (id) {
                const field = byId(id);
                if (field) field.value = "";
            });

            toastV14("🏢 Empresa cadastrada no banco!");
            await window.abrirEmpresasAdmin();
        } catch (error) {
            console.error("Erro ao cadastrar empresa:", error);
            alert(error.message || "Não foi possível cadastrar a empresa.");
        } finally {
            setButtonBusy(button, false);
        }
    };

    window.alterarStatusEmpresaAdmin = async function alterarStatusEmpresaAdminV14(
        companyId,
        ativo
    ) {
        try {
            await safeLifeApi(
                "/api/admin/empresas/" + encodeURIComponent(companyId) + "/status",
                {
                    method: "PATCH",
                    body: JSON.stringify({
                        ativo: Boolean(ativo)
                    })
                }
            );

            toastV14(ativo ? "Empresa ativada." : "Empresa desativada.");
            await window.abrirEmpresasAdmin();
        } catch (error) {
            console.error("Erro ao alterar empresa:", error);
            alert(error.message || "Não foi possível alterar a empresa.");
        }
    };

    window.excluirEmpresaAdmin = async function excluirEmpresaAdminV14(companyId) {
        if (!window.confirm("Excluir esta empresa/base?")) {
            return;
        }

        try {
            await safeLifeApi(
                "/api/admin/empresas/" + encodeURIComponent(companyId),
                {
                    method: "DELETE"
                }
            );

            toastV14("Empresa excluída.");
            await window.abrirEmpresasAdmin();
        } catch (error) {
            console.error("Erro ao excluir empresa:", error);
            alert(error.message || "Não foi possível excluir a empresa.");
        }
    };

    async function refreshCompanySelects() {
        try {
            const companies = await fetchCompanies();
            const activeCompanies = companies.filter(function (company) {
                return company.ativo !== false;
            });

            [
                "regCompany",
                "loginCompany",
                "adminProCompany",
                "editProCompany"
            ].forEach(function (id) {
                const select = byId(id);
                if (!select) return;

                const current = select.value;
                select.innerHTML = "";

                activeCompanies.forEach(function (company) {
                    const option = document.createElement("option");
                    option.value = company.nome;
                    option.textContent = company.nome;
                    select.appendChild(option);
                });

                if (
                    current &&
                    activeCompanies.some(function (company) {
                        return company.nome === current;
                    })
                ) {
                    select.value = current;
                }
            });
        } catch (error) {
            console.warn("Não foi possível atualizar as empresas:", error.message);
        }
    }

    function fixRescueCard() {
        const rescue =
            document.querySelector("#menuScreen .rescue-card") ||
            document.querySelector('#menuScreen button[onclick*="rescue"]');

        if (!rescue) return;

        rescue.classList.add("rescue-card");
        rescue.style.gridColumn = "1 / -1";
        rescue.style.width = "100%";
        rescue.style.maxWidth = "none";
        rescue.style.minWidth = "0";
        rescue.style.justifySelf = "stretch";
        rescue.style.alignSelf = "stretch";
        rescue.style.placeSelf = "stretch";
        rescue.style.margin = "0";
        rescue.style.textAlign = "center";
        rescue.style.alignItems = "center";
        rescue.style.justifyContent = "center";
    }

    function bindEnterToLogin() {
        const password = byId("loginPassword");
        const cpfField = byId("cpfInput");

        [password, cpfField].forEach(function (field) {
            if (!field || field.dataset.safeLifeEnterBound === "true") return;

            field.dataset.safeLifeEnterBound = "true";
            field.addEventListener("keydown", function (event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    window.autenticar();
                }
            });
        });
    }

    function bootV14() {
        fixRescueCard();
        bindEnterToLogin();
        refreshCompanySelects();

        window.setTimeout(fixRescueCard, 0);
        window.setTimeout(fixRescueCard, 150);
        window.setTimeout(fixRescueCard, 500);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootV14);
    } else {
        bootV14();
    }
})();

/* =====================================================
   SAFE LIFE — FILA REAL ONLINE
   - Nunca mostra denúncias de demonstração/localStorage.
   - O profissional vê somente registros salvos no Supabase.
   - Novos chamados só confirmam sucesso após o servidor salvar.
===================================================== */

(function () {
    "use strict";

    const REAL_QUEUE_MIGRATION = "safeLifeRealQueueOnlyV1";
    const FIXED_API_URL = "https://safe-life.onrender.com";

    window.SAFE_LIFE_API_URL = FIXED_API_URL;

    try {
        localStorage.setItem("safeLifeApiUrl", FIXED_API_URL);

        if (localStorage.getItem(REAL_QUEUE_MIGRATION) !== "done") {
            localStorage.removeItem("safeLifeOcorrencias");
            localStorage.setItem(REAL_QUEUE_MIGRATION, "done");
        }
    } catch (error) {
        console.warn("Não foi possível limpar o cache antigo de ocorrências.");
    }

    function getElement(id) {
        return document.getElementById(id);
    }

    function getValue(id) {
        const element = getElement(id);
        return element ? String(element.value || "").trim() : "";
    }

    function cleanCpf(value) {
        return String(value || "").replace(/\D/g, "");
    }

    function readLoggedUser() {
        try {
            const stored = localStorage.getItem("safeLifeLoggedUser");
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            return null;
        }
    }

    function fileAsDataUrl(inputId) {
        return new Promise(function (resolve, reject) {
            const input = getElement(inputId);
            const file = input && input.files ? input.files[0] : null;

            if (!file) {
                resolve("");
                return;
            }

            const reader = new FileReader();
            reader.onload = function () {
                resolve(String(reader.result || ""));
            };
            reader.onerror = function () {
                reject(new Error("Não foi possível ler a foto."));
            };
            reader.readAsDataURL(file);
        });
    }

    function selectedCardText(containerSelector, hiddenId) {
        const hidden = getElement(hiddenId);
        if (hidden && hidden.value) return hidden.value.trim();

        const selected = document.querySelector(containerSelector + " .quick-option-card.selected");
        if (!selected) return "";

        const title = selected.querySelector(".quick-option-title");
        return title ? title.textContent.trim() : selected.textContent.trim();
    }

    function currentGps() {
        return {
            latitude: getValue("userLatitude") || null,
            longitude: getValue("userLongitude") || null,
            enderecoCompleto: getValue("userFullAddress") || null,
            bairro: getValue("userNeighborhood") || null,
            cidade: getValue("userCity") || null,
            estado: getValue("userState") || null
        };
    }

    function displayToast(message) {
        if (typeof window.triggerToast === "function") {
            window.triggerToast(message);
            return;
        }

        const toast = getElement("toast");
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("show");
        setTimeout(function () {
            toast.classList.remove("show");
        }, 2600);
    }

    async function request(endpoint, options) {
        if (typeof window.safeLifeApi === "function") {
            return window.safeLifeApi(endpoint, options || {});
        }

        const token = localStorage.getItem("safeLifeAuthToken") || "";
        const headers = new Headers((options && options.headers) || {});
        headers.set("Content-Type", "application/json");
        if (token) headers.set("Authorization", "Bearer " + token);

        const response = await fetch(FIXED_API_URL + endpoint, {
            ...(options || {}),
            headers
        });

        const data = await response.json().catch(function () {
            return null;
        });

        if (!response.ok) {
            throw new Error((data && (data.error || data.message || data.details)) || "Erro no servidor.");
        }

        return data;
    }

    function setBusy(button, busy, text) {
        if (!button) return;

        if (busy) {
            button.dataset.previousText = button.textContent;
            button.disabled = true;
            button.textContent = text;
        } else {
            button.disabled = false;
            if (button.dataset.previousText) {
                button.textContent = button.dataset.previousText;
            }
        }
    }

    window.carregarOcorrenciasProfissional = async function carregarOcorrenciasProfissionalReal() {
        const data = await request("/api/pro/ocorrencias");
        return Array.isArray(data) ? data : [];
    };

    window.atualizarStatsProfissional = async function atualizarStatsProfissionalReal() {
        try {
            const data = await window.carregarOcorrenciasProfissional();
            const pending = data.filter(function (item) {
                const status = String(item.status || "PENDENTE").toUpperCase();
                return status !== "CONCLUIDA" && status !== "CANCELADA";
            });

            const anonymous = pending.filter(function (item) {
                return item.anonima || item.origem === "anonima";
            }).length;

            const emergency = pending.filter(function (item) {
                return String(item.categoria || "").toLowerCase().includes("emergency") ||
                    String(item.tipo || "").toLowerCase().includes("emergência");
            }).length;

            const total = getElement("statTotal");
            const anon = getElement("statAnon");
            const urgent = getElement("statEmergency");

            if (total) total.textContent = String(pending.length);
            if (anon) anon.textContent = String(anonymous);
            if (urgent) urgent.textContent = String(emergency);
        } catch (error) {
            console.error("Erro ao atualizar estatísticas:", error);
        }
    };

    window.abrirOcorrenciasPro = async function abrirOcorrenciasProReal() {
        const container = getElement("listaIntegradaPro");
        if (!container) return;

        container.innerHTML = `
            <div class="occurrence-card" style="text-align:center;border-left-color:#2563eb;">
                <p style="font-size:14px;color:var(--text-light);">Carregando chamados reais...</p>
            </div>
        `;

        try {
            const data = await window.carregarOcorrenciasProfissional();
            const pending = data.filter(function (item) {
                const status = String(item.status || "PENDENTE").toUpperCase();
                return status !== "CONCLUIDA" && status !== "CANCELADA";
            });

            container.innerHTML = "";

            if (!pending.length) {
                container.innerHTML = `
                    <div class="occurrence-card" style="text-align:center;border-left-color:#94a3b8;">
                        <p style="font-size:14px;color:var(--text-light);">
                            Fila vazia. Os chamados aparecerão aqui quando alguém enviar uma denúncia ou pedido de resgate.
                        </p>
                    </div>
                `;
            } else {
                pending.forEach(function (item) {
                    if (typeof window.criarCardProfissional === "function") {
                        container.appendChild(window.criarCardProfissional(item));
                    }
                });
            }

            if (typeof window.nextScreen === "function") {
                window.nextScreen("proListScreen");
            }

            await window.atualizarStatsProfissional();
        } catch (error) {
            console.error("Erro ao carregar chamados reais:", error);
            container.innerHTML = `
                <div class="occurrence-card" style="text-align:center;border-left-color:#ef4444;">
                    <p style="font-size:14px;color:var(--text-light);">
                        Não foi possível consultar o servidor. Tente novamente em alguns segundos.
                    </p>
                </div>
            `;

            if (typeof window.nextScreen === "function") {
                window.nextScreen("proListScreen");
            }
        }
    };

    window.registrarAcao = async function registrarAcaoSomenteServidor(event) {
        if (event && typeof event.preventDefault === "function") event.preventDefault();

        const user = readLoggedUser();
        if (!user) {
            alert("Entre novamente na sua conta.");
            return;
        }

        const formKey = getValue("formKey") || "report";
        const option = selectedCardText("#quickOptionsGrid", "selectedQuickOption");
        const location = getValue("formLocation");
        const details = getValue("formDetails");
        const submitButton = document.querySelector('#citizenForm button[type="submit"]');

        if (!option) {
            alert("Escolha uma opção do problema.");
            return;
        }

        if (!location || !details) {
            alert("Informe a localização e a descrição.");
            return;
        }

        try {
            setBusy(submitButton, true, "Enviando ao servidor...");
            const photo = await fileAsDataUrl("formFile");
            const config = window.FORM_CONFIGS && window.FORM_CONFIGS[formKey]
                ? window.FORM_CONFIGS[formKey]
                : { title: "Chamado", priority: "NORMAL" };

            await request("/api/ocorrencias", {
                method: "POST",
                body: JSON.stringify({
                    usuarioCpf: cleanCpf(user.cpf),
                    tipo: config.title || "Chamado",
                    categoria: formKey,
                    assunto: option,
                    opcaoEscolhida: option,
                    localizacao: location,
                    detalhes: details,
                    foto: photo || null,
                    gps: currentGps(),
                    prioridade: config.priority || "NORMAL"
                })
            });

            const form = getElement("citizenForm");
            if (form) form.reset();
            const hidden = getElement("selectedQuickOption");
            if (hidden) hidden.value = "";

            const confirmation = getElement("confirmMsg");
            if (confirmation) confirmation.textContent = "Chamado salvo no banco e enviado aos profissionais.";

            displayToast("✅ Chamado enviado aos profissionais.");
            if (typeof window.nextScreen === "function") window.nextScreen("confirmationScreen");
        } catch (error) {
            console.error("Erro ao enviar chamado:", error);
            alert(error.message || "Não foi possível enviar o chamado.");
        } finally {
            setBusy(submitButton, false);
        }
    };

    window.registrarAcaoAnonima = async function registrarAcaoAnonimaSomenteServidor(event) {
        if (event && typeof event.preventDefault === "function") event.preventDefault();

        const option = selectedCardText("#anonOptionsGrid", "selectedAnonOption");
        const location = getValue("anonLocation");
        const details = getValue("anonDetails");
        const submitButton = document.querySelector('#anonForm button[type="submit"]');

        if (!option) {
            alert("Escolha uma opção da denúncia.");
            return;
        }

        if (!location || !details) {
            alert("Informe a localização e a descrição.");
            return;
        }

        try {
            setBusy(submitButton, true, "Enviando denúncia...");
            const photo = await fileAsDataUrl("anonFile");

            await request("/api/ocorrencias/anonima", {
                method: "POST",
                body: JSON.stringify({
                    tipo: "Denúncia Anônima",
                    categoria: "anonymous",
                    assunto: option,
                    opcaoEscolhida: option,
                    localizacao: location,
                    detalhes: details,
                    foto: photo || null,
                    gps: currentGps(),
                    prioridade: "ALTA"
                })
            });

            const form = getElement("anonForm");
            if (form) form.reset();
            const hidden = getElement("selectedAnonOption");
            if (hidden) hidden.value = "";

            const confirmation = getElement("confirmMsg");
            if (confirmation) confirmation.textContent = "Denúncia anônima salva no banco e enviada aos profissionais.";

            displayToast("🛡️ Denúncia anônima enviada.");
            if (typeof window.nextScreen === "function") window.nextScreen("confirmationScreen");
        } catch (error) {
            console.error("Erro ao enviar denúncia anônima:", error);
            alert(error.message || "Não foi possível enviar a denúncia.");
        } finally {
            setBusy(submitButton, false);
        }
    };

    function applyOriginalProfilePhotos() {
        const photoByCpf = {
            "11111111111": "img/pequenochinique.jpeg",
            "99999999999": "img/corredorzeca.jpeg",
            "45317828791": "img/apenasumsiri.jpeg"
        };

        try {
            const users = JSON.parse(localStorage.getItem("safeLifeUsuarios") || "[]");
            const updated = users.map(function (user) {
                const original = photoByCpf[cleanCpf(user.cpf)];
                return original ? { ...user, foto: original, avatar: original, foto_perfil: original } : user;
            });
            localStorage.setItem("safeLifeUsuarios", JSON.stringify(updated));

            const logged = readLoggedUser();
            if (logged) {
                const original = photoByCpf[cleanCpf(logged.cpf)];
                if (original) {
                    const fixed = { ...logged, foto: original, avatar: original, foto_perfil: original };
                    localStorage.setItem("safeLifeLoggedUser", JSON.stringify(fixed));
                    window.usuarioLogado = fixed;
                }
            }
        } catch (error) {
            console.warn("Não foi possível atualizar as fotos locais.");
        }

        const fixedImages = {
            profileAvatar: "img/pequenochinique.jpeg",
            proAvatar: "img/corredorzeca.jpeg",
            professionalProfileAvatar: "img/corredorzeca.jpeg",
            adminAvatar: "img/apenasumsiri.jpeg",
            adminProfileAvatar: "img/apenasumsiri.jpeg"
        };

        Object.keys(fixedImages).forEach(function (id) {
            const image = getElement(id);
            if (image) image.src = fixedImages[id];
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyOriginalProfilePhotos);
    } else {
        applyOriginalProfilePhotos();
    }
})();
