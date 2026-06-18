/* =============================================================
   SAFE LIFE V19 — FRONTEND LIMPO E ESTÁVEL
   Uma única implementação, sem versões antigas empilhadas.
============================================================= */
(function () {
    "use strict";

    const API_BASE = "https://safe-life.onrender.com";
    const STORAGE_USER = "safeLifeLoggedUser";
    const STORAGE_TOKEN = "safeLifeAuthToken";
    const ADMIN_CPF = "45317828791";

    const FALLBACK_USER_PHOTO = "img/pequenochinique.jpeg";
    const FALLBACK_PRO_PHOTO = "img/corredorzeca.jpeg";
    const FALLBACK_ADMIN_PHOTO = "img/apenasumsiri.jpeg";
    const FALLBACK_PET_PHOTO = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80";

    const state = {
        user: null,
        token: "",
        gps: {
            latitude: null,
            longitude: null,
            enderecoCompleto: "",
            bairro: "",
            cidade: "",
            estado: ""
        },
        companies: [],
        queue: [],
        queueLoadedAt: 0,
        missingPets: [],
        registeredPets: [],
        selectedRescuePet: null,
        pendingAvatar: "",
        pendingProfessionalAvatar: "",
        pendingAdminAvatar: "",
        eventSource: null,
        fallbackTimer: null,
        sessionTimer: null,
        refreshDebounce: null,
        busy: new Set()
    };

    const citizenConfigs = {
        emergency: {
            title: "SOS Emergência Imediata",
            subtitle: "Envie uma ocorrência urgente para a equipe profissional.",
            tipo: "Emergência Animal",
            categoria: "emergency",
            prioridade: "ALTA",
            options: [
                "Animal ferido",
                "Animal atropelado",
                "Maus-tratos em andamento",
                "Animal preso ou em risco"
            ]
        },
        report: {
            title: "Reportar Ocorrência",
            subtitle: "Informe uma situação que precisa de acompanhamento.",
            tipo: "Ocorrência Animal",
            categoria: "report",
            prioridade: "NORMAL",
            options: [
                "Animal na rua",
                "Abandono",
                "Sem água e comida",
                "Suspeita de maus-tratos"
            ]
        },
        rescue: {
            title: "Solicitar Resgate",
            subtitle: "Peça apoio para retirar um animal de uma situação de risco.",
            tipo: "Solicitar Resgate",
            categoria: "rescue",
            prioridade: "ALTA",
            options: [
                "Animal ferido",
                "Ninhada abandonada",
                "Animal em local perigoso",
                "Transporte para atendimento"
            ]
        }
    };

    const anonymousOptions = [
        "Maus-tratos",
        "Abandono",
        "Animal acorrentado",
        "Sem água e comida",
        "Criação irregular"
    ];

    function byId(id) {
        return document.getElementById(id);
    }

    function text(id, value) {
        const node = byId(id);
        if (node) node.textContent = value == null ? "" : String(value);
    }

    function value(id) {
        const node = byId(id);
        return node ? String(node.value || "").trim() : "";
    }

    function setValue(id, nextValue) {
        const node = byId(id);
        if (node) node.value = nextValue == null ? "" : String(nextValue);
    }

    function escapeHtml(input) {
        return String(input == null ? "" : input).replace(/[&<>"']/g, function (character) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[character];
        });
    }

    function cleanCpf(input) {
        return String(input || "").replace(/\D/g, "").slice(0, 11);
    }

    function formatCpf(input) {
        const digits = cleanCpf(input);
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
        if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    }

    function formatPhone(input) {
        const digits = String(input || "").replace(/\D/g, "").slice(0, 11);
        if (!digits) return "";
        if (digits.length <= 2) return `(${digits}`;
        if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        if (digits.length <= 10) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
        }
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }

    function isEmail(input) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(input || ""));
    }

    function safeImage(input, fallback) {
        const source = String(input || "").trim();
        if (source.startsWith("data:image/") || source.startsWith("https://") || source.startsWith("http://") || source.startsWith("img/")) {
            return source;
        }
        return fallback;
    }

    function dateTime(input) {
        if (!input) return "Data não informada";
        const parsed = new Date(input);
        if (Number.isNaN(parsed.getTime())) return String(input);
        return parsed.toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short"
        });
    }

    function toast(message, type) {
        const node = byId("toast");
        if (!node) {
            window.alert(message);
            return;
        }
        node.textContent = message;
        node.dataset.type = type || "info";
        node.classList.add("show");
        window.clearTimeout(node._safeLifeTimer);
        node._safeLifeTimer = window.setTimeout(function () {
            node.classList.remove("show");
        }, 3200);
    }

    function showError(error, fallback) {
        console.error(error);
        const message = error && error.message ? error.message : fallback || "Não foi possível concluir a operação.";
        window.alert(message);
    }

    function setBusy(button, busy, label) {
        if (!button) return;
        if (busy) {
            if (!button.dataset.originalText) button.dataset.originalText = button.textContent;
            button.disabled = true;
            button.setAttribute("aria-busy", "true");
            button.textContent = label || "Aguarde...";
        } else {
            button.disabled = false;
            button.removeAttribute("aria-busy");
            if (button.dataset.originalText) button.textContent = button.dataset.originalText;
        }
    }

    async function api(path, options, timeoutMs) {
        const controller = new AbortController();
        const timer = window.setTimeout(function () {
            controller.abort();
        }, timeoutMs || 35000);

        const headers = new Headers((options && options.headers) || {});
        if (!headers.has("Content-Type") && !(options && options.body instanceof FormData)) {
            headers.set("Content-Type", "application/json");
        }
        if (state.token && !headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${state.token}`);
        }

        try {
            const response = await fetch(API_BASE + path, {
                ...(options || {}),
                headers,
                signal: controller.signal
            });

            const contentType = String(response.headers.get("content-type") || "");
            const payload = contentType.includes("application/json")
                ? await response.json().catch(function () { return null; })
                : await response.text().catch(function () { return ""; });

            if (!response.ok) {
                const message = payload && typeof payload === "object"
                    ? payload.details || payload.error || payload.message
                    : payload;
                const error = new Error(message || `Erro ${response.status}.`);
                error.status = response.status;
                error.payload = payload;
                throw error;
            }

            return payload;
        } catch (error) {
            if (error.name === "AbortError") {
                throw new Error("O servidor demorou para responder. Aguarde alguns segundos e tente novamente.");
            }
            throw error;
        } finally {
            window.clearTimeout(timer);
        }
    }

    function saveSession(user, token) {
        state.user = normalizeUser(user);
        state.token = String(token || "");
        localStorage.setItem(STORAGE_USER, JSON.stringify(state.user));
        localStorage.setItem(STORAGE_TOKEN, state.token);
        window.usuarioLogado = state.user;
        startSessionWatcher();
    }

    function normalizeUser(user) {
        if (!user) return null;
        const type = user.type || user.tipo || "citizen";
        return {
            ...user,
            cpf: cleanCpf(user.cpf),
            type,
            tipo: type,
            company: user.company || user.empresa || "Nenhum",
            foto: user.foto || user.foto_perfil || ""
        };
    }

    function restoreSession() {
        try {
            const user = JSON.parse(localStorage.getItem(STORAGE_USER) || "null");
            const token = String(localStorage.getItem(STORAGE_TOKEN) || "");
            if (!user || !token || cleanCpf(user.cpf).length !== 11) return;
            state.user = normalizeUser(user);
            state.token = token;
            window.usuarioLogado = state.user;
        } catch (_) {
            clearSession();
        }
    }

    function clearSession() {
        localStorage.removeItem(STORAGE_USER);
        localStorage.removeItem(STORAGE_TOKEN);
        state.user = null;
        state.token = "";
        window.usuarioLogado = null;
        stopProfessionalRealtime();
        if (state.sessionTimer) {
            window.clearInterval(state.sessionTimer);
            state.sessionTimer = null;
        }
    }

    function requireUser(expectedType) {
        if (!state.user || !state.token) {
            toast("Entre na sua conta para continuar.", "warning");
            nextScreen("loginScreen");
            return false;
        }
        if (expectedType && state.user.type !== expectedType && state.user.type !== "admin") {
            toast("Seu perfil não possui acesso a esta área.", "warning");
            return false;
        }
        return true;
    }

    function nextScreen(screenId) {
        document.querySelectorAll(".screen").forEach(function (screen) {
            screen.classList.remove("active");
        });
        const target = byId(screenId);
        if (!target) {
            console.warn("Tela não encontrada:", screenId);
            return;
        }
        target.classList.add("active");
        window.scrollTo({ top: 0, behavior: "auto" });

        if (screenId === "registerScreen" || screenId === "loginScreen") {
            loadCompanies(false);
        }
    }

    function routeByUser() {
        if (!state.user) {
            nextScreen("loginScreen");
            return;
        }
        if (state.user.type === "admin") {
            inicializarPainelAdmin();
            return;
        }
        if (state.user.type === "professional") {
            inicializarPainelPro();
            return;
        }
        nextScreen("menuScreen");
    }

    async function validateSession(showModal) {
        if (!state.token || !state.user) return false;
        try {
            const response = await api("/api/auth/session-status", {}, 18000);
            if (response && response.user) {
                state.user = normalizeUser(response.user);
                localStorage.setItem(STORAGE_USER, JSON.stringify(state.user));
                window.usuarioLogado = state.user;
            }
            return true;
        } catch (error) {
            if ([401, 403, 410, 423].includes(error.status)) {
                const payload = error.payload || {};
                showAccountStatus(payload.code, payload.error || error.message, payload.blockedUntil);
                clearSession();
                return false;
            }
            if (showModal) showError(error);
            return false;
        }
    }

    function startSessionWatcher() {
        if (state.sessionTimer) window.clearInterval(state.sessionTimer);
        state.sessionTimer = window.setInterval(function () {
            validateSession(false);
        }, 45000);
    }

    function showAccountStatus(code, message, blockedUntil) {
        const modal = byId("accountStatusModal");
        if (!modal) {
            window.alert(message || "Sua conta não está disponível.");
            return;
        }
        text("accountStatusIcon", code === "ACCOUNT_DELETED" ? "🗑️" : "⛔");
        text("accountStatusTitle", code === "ACCOUNT_DELETED" ? "Conta excluída" : "Conta suspensa");
        let finalMessage = message || "Sua conta está temporariamente indisponível.";
        if (blockedUntil) finalMessage += `\nBloqueio válido até ${dateTime(blockedUntil)}.`;
        text("accountStatusMessage", finalMessage);
        modal.classList.remove("hidden");
    }

    function encerrarSessaoPorStatus() {
        const modal = byId("accountStatusModal");
        if (modal) modal.classList.add("hidden");
        clearSession();
        nextScreen("loginScreen");
    }

    async function compressImage(file, maxSide, quality) {
        if (!file) return "";
        if (!String(file.type || "").startsWith("image/")) {
            throw new Error("Escolha um arquivo de imagem válido.");
        }
        if (file.size > 12 * 1024 * 1024) {
            throw new Error("A imagem deve ter no máximo 12 MB.");
        }

        const source = await new Promise(function (resolve, reject) {
            const reader = new FileReader();
            reader.onload = function () { resolve(String(reader.result || "")); };
            reader.onerror = function () { reject(new Error("Não foi possível ler a imagem.")); };
            reader.readAsDataURL(file);
        });

        const image = await new Promise(function (resolve, reject) {
            const node = new Image();
            node.onload = function () { resolve(node); };
            node.onerror = function () { reject(new Error("Não foi possível processar a imagem.")); };
            node.src = source;
        });

        const limit = maxSide || 960;
        const scale = Math.min(1, limit / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { alpha: false });
        context.drawImage(image, 0, 0, width, height);
        return canvas.toDataURL("image/jpeg", quality || 0.78);
    }

    function installMasks() {
        ["regCpf", "cpfInput", "adminProCpf", "editProCpf"].forEach(function (id) {
            const field = byId(id);
            if (!field) return;
            field.addEventListener("input", function () {
                if (id === "editProCpf" || id === "adminProCpf") {
                    field.value = cleanCpf(field.value);
                } else {
                    field.value = formatCpf(field.value);
                }
            });
        });

        ["regPhone", "editPhone", "editProPhone", "editAdminPhone", "adminCompanyPhone", "adminProPhone"].forEach(function (id) {
            const field = byId(id);
            if (!field) return;
            field.addEventListener("input", function () {
                field.value = formatPhone(field.value);
            });
        });
    }

    function previewFotoCadastro(input) {
        const file = input && input.files ? input.files[0] : null;
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function () {
            const preview = byId("regAvatarPreview");
            if (preview) preview.src = String(reader.result || FALLBACK_USER_PHOTO);
        };
        reader.readAsDataURL(file);
    }

    function atualizarFotoPerfil(input) {
        const file = input && input.files ? input.files[0] : null;
        if (!file) return;
        compressImage(file, 720, 0.78).then(function (data) {
            state.pendingAvatar = data;
            const image = byId("profileAvatar");
            if (image) image.src = data;
        }).catch(showError);
    }

    function atualizarFotoProfissional(input) {
        const file = input && input.files ? input.files[0] : null;
        if (!file) return;
        compressImage(file, 720, 0.78).then(function (data) {
            state.pendingProfessionalAvatar = data;
            const image = byId("professionalProfileAvatar");
            if (image) image.src = data;
        }).catch(showError);
    }

    function atualizarFotoAdmin(input) {
        const file = input && input.files ? input.files[0] : null;
        if (!file) return;
        compressImage(file, 720, 0.78).then(function (data) {
            state.pendingAdminAvatar = data;
            const image = byId("adminProfileAvatar");
            if (image) image.src = data;
        }).catch(showError);
    }

    async function loadCompanies(force) {
        if (!force && state.companies.length) {
            populateCompanySelects();
            return state.companies;
        }
        try {
            const companies = await api("/api/empresas", {}, 15000);
            state.companies = Array.isArray(companies)
                ? companies.filter(function (company) { return company.ativo !== false; })
                : [];
            populateCompanySelects();
        } catch (error) {
            console.warn("Empresas não carregadas; mantendo opções locais.", error);
        }
        return state.companies;
    }

    function populateCompanySelects() {
        if (!state.companies.length) return;
        const ids = ["regCompany", "loginCompany", "editProCompany", "adminProCompany"];
        ids.forEach(function (id) {
            const select = byId(id);
            if (!select) return;
            const current = select.value;
            select.innerHTML = state.companies.map(function (company) {
                return `<option value="${escapeHtml(company.nome)}">${escapeHtml(company.nome)}</option>`;
            }).join("");
            if (current && Array.from(select.options).some(function (option) { return option.value === current; })) {
                select.value = current;
            }
        });
    }

    function toggleRegCompanyField() {
        const wrapper = byId("companyRegWrapper");
        if (!wrapper) return;
        wrapper.classList.toggle("hidden", value("regType") !== "professional");
    }

    function toggleLoginCompanyField() {
        const wrapper = byId("loginCompanyWrapper");
        if (!wrapper) return;
        wrapper.classList.toggle("hidden", value("loginRole") !== "professional");
    }

    async function efetuarCadastro() {
        if (state.busy.has("register")) return;
        const button = document.querySelector('button[onclick="efetuarCadastro()"]');

        const nome = value("regName");
        const cpf = cleanCpf(value("regCpf"));
        const email = value("regEmail").toLowerCase();
        const telefone = formatPhone(value("regPhone"));
        const senha = value("regPassword");
        const confirmacao = value("regPasswordConfirm");
        const type = value("regType") || "citizen";
        const company = value("regCompany");

        if (!nome) return window.alert("Informe o nome completo.");
        if (cpf.length !== 11) return window.alert("Informe um CPF com 11 números.");
        if (!isEmail(email)) return window.alert("Informe um e-mail válido.");
        if (telefone.replace(/\D/g, "").length < 10) return window.alert("Informe um telefone com DDD.");
        if (senha.length < 6) return window.alert("A senha precisa ter pelo menos 6 caracteres.");
        if (senha !== confirmacao) return window.alert("As senhas não são iguais.");
        if (type === "professional" && !company) return window.alert("Selecione a empresa/base.");

        state.busy.add("register");
        setBusy(button, true, "Criando conta...");

        try {
            const photoInput = byId("regPhoto");
            const foto = photoInput && photoInput.files && photoInput.files[0]
                ? await compressImage(photoInput.files[0], 720, 0.76)
                : "";

            const response = await api("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({ nome, cpf, email, telefone, senha, type, company, foto })
            }, 65000);

            saveSession(response.user, response.token);
            toast("Conta criada com sucesso.", "success");
            routeByUser();
        } catch (error) {
            showError(error, "Não foi possível criar a conta.");
        } finally {
            state.busy.delete("register");
            setBusy(button, false);
        }
    }

    async function autenticar() {
        if (state.busy.has("login")) return;
        const button = document.querySelector('button[onclick="autenticar()"]');
        const role = value("loginRole") || "citizen";
        const company = value("loginCompany");
        const cpf = cleanCpf(value("cpfInput"));
        const senha = value("loginPassword");

        if (cpf.length !== 11) return window.alert("Informe um CPF com 11 números.");
        if (!senha) return window.alert("Informe a senha.");
        if (role === "professional" && !company) return window.alert("Selecione a empresa/base.");

        state.busy.add("login");
        setBusy(button, true, "Entrando...");

        try {
            const response = await api("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ cpf, role, company, senha })
            }, 45000);
            saveSession(response.user, response.token);
            toast("Login realizado com sucesso.", "success");
            routeByUser();
        } catch (error) {
            if ([403, 410, 423].includes(error.status)) {
                const payload = error.payload || {};
                showAccountStatus(payload.code, payload.error || error.message, payload.blockedUntil);
            } else {
                showError(error, "Não foi possível entrar.");
            }
        } finally {
            state.busy.delete("login");
            setBusy(button, false);
        }
    }

    function logout() {
        clearSession();
        nextScreen("welcomeScreen");
        toast("Sessão encerrada.", "info");
    }

    function renderQuickOptions(containerId, hiddenId, options) {
        const container = byId(containerId);
        if (!container) return;
        container.innerHTML = options.map(function (option) {
            return `<button class="quick-option-btn" type="button" data-option="${escapeHtml(option)}">${escapeHtml(option)}</button>`;
        }).join("");
        container.querySelectorAll(".quick-option-btn").forEach(function (button) {
            button.addEventListener("click", function () {
                container.querySelectorAll(".quick-option-btn").forEach(function (item) {
                    item.classList.remove("selected");
                });
                button.classList.add("selected");
                setValue(hiddenId, button.dataset.option || "");
            });
        });
    }

    function openCitizenForm(kind) {
        if (!requireUser("citizen")) return;
        const config = citizenConfigs[kind] || citizenConfigs.report;
        text("formTitle", config.title);
        text("formSubtitle", config.subtitle);
        setValue("formKey", kind);
        setValue("selectedQuickOption", "");
        setValue("formLocation", state.gps.enderecoCompleto || value("userFullAddress"));
        setValue("formDetails", "");
        const file = byId("formFile");
        if (file) file.value = "";
        renderQuickOptions("quickOptionsGrid", "selectedQuickOption", config.options);
        nextScreen("scrForm");
    }

    function openPetForm() {
        if (!requireUser("citizen")) return;
        const form = byId("petForm");
        if (form) form.reset();
        setValue("petLocation", state.gps.enderecoCompleto || value("userFullAddress"));
        nextScreen("scrPetForm");
    }

    function abrirPetDesaparecido() {
        if (!requireUser("citizen")) return;
        const form = byId("missingPetForm");
        if (form) form.reset();
        setValue("missingPetLastSeen", state.gps.enderecoCompleto || value("userFullAddress"));
        nextScreen("scrMissingPetForm");
    }

    function openAnonForm() {
        setValue("selectedAnonOption", "");
        setValue("anonLocation", state.gps.enderecoCompleto || value("userFullAddress"));
        setValue("anonDetails", "");
        const file = byId("anonFile");
        if (file) file.value = "";
        renderQuickOptions("anonOptionsGrid", "selectedAnonOption", anonymousOptions);
        nextScreen("scrAnonForm");
    }

    function currentGps() {
        return {
            latitude: state.gps.latitude,
            longitude: state.gps.longitude,
            enderecoCompleto: state.gps.enderecoCompleto || value("userFullAddress"),
            bairro: state.gps.bairro || value("userNeighborhood"),
            cidade: state.gps.cidade || value("userCity"),
            estado: state.gps.estado || value("userState")
        };
    }

    async function registrarAcao(event) {
        event.preventDefault();
        if (!requireUser("citizen") || state.busy.has("occurrence")) return;

        const kind = value("formKey") || "report";
        const config = citizenConfigs[kind] || citizenConfigs.report;
        const selected = value("selectedQuickOption");
        const location = value("formLocation");
        const details = value("formDetails");
        const submit = event.currentTarget.querySelector('button[type="submit"]');

        if (!selected) return window.alert("Escolha o problema.");
        if (!location) return window.alert("Informe a localização.");
        if (!details) return window.alert("Descreva o que está acontecendo.");

        state.busy.add("occurrence");
        setBusy(submit, true, "Enviando chamado...");

        try {
            const fileInput = byId("formFile");
            const foto = fileInput && fileInput.files && fileInput.files[0]
                ? await compressImage(fileInput.files[0], 1100, 0.78)
                : "";

            await api("/api/ocorrencias", {
                method: "POST",
                body: JSON.stringify({
                    usuarioCpf: state.user.cpf,
                    tipo: config.tipo,
                    categoria: config.categoria,
                    assunto: selected,
                    opcaoEscolhida: selected,
                    localizacao: location,
                    detalhes: details,
                    foto,
                    gps: currentGps(),
                    prioridade: config.prioridade
                })
            }, 65000);

            text("confirmMsg", "Seu chamado foi enviado para os profissionais disponíveis.");
            nextScreen("confirmationScreen");
            event.currentTarget.reset();
            setValue("selectedQuickOption", "");
        } catch (error) {
            showError(error, "Não foi possível enviar o chamado.");
        } finally {
            state.busy.delete("occurrence");
            setBusy(submit, false);
        }
    }

    async function registrarPet(event) {
        event.preventDefault();
        if (!requireUser("citizen") || state.busy.has("pet")) return;
        const submit = event.currentTarget.querySelector('button[type="submit"]');

        const nome = value("petName");
        const especie = value("petSpecies");
        if (!nome || !especie) return window.alert("Informe o nome e a espécie do pet.");

        state.busy.add("pet");
        setBusy(submit, true, "Salvando pet...");

        try {
            const photoInput = byId("petPhoto");
            const foto = photoInput && photoInput.files && photoInput.files[0]
                ? await compressImage(photoInput.files[0], 1000, 0.78)
                : "";

            await api("/api/pets", {
                method: "POST",
                body: JSON.stringify({
                    donoCpf: state.user.cpf,
                    nome,
                    idade: Number(value("petAge")) || 0,
                    especie,
                    raca: value("petBreed"),
                    sexo: value("petSex") || "NAO_INFORMADO",
                    cor: value("petColor"),
                    peso: Number(value("petWeight")) || null,
                    local: value("petLocation") || "Não informado",
                    observacoes: value("petObservations"),
                    foto,
                    desaparecido: false,
                    statusPet: "CADASTRADO"
                })
            }, 65000);

            toast("Pet cadastrado com sucesso.", "success");
            event.currentTarget.reset();
            nextScreen("menuScreen");
        } catch (error) {
            showError(error, "Não foi possível cadastrar o pet.");
        } finally {
            state.busy.delete("pet");
            setBusy(submit, false);
        }
    }

    async function registrarPetDesaparecido(event) {
        event.preventDefault();
        if (!requireUser("citizen") || state.busy.has("missing-pet")) return;
        const submit = event.currentTarget.querySelector('button[type="submit"]');

        const nome = value("missingPetName");
        const especie = value("missingPetSpecies");
        const lastSeen = value("missingPetLastSeen");
        const details = value("missingPetDetails");
        const photoInput = byId("missingPetPhoto");

        if (!nome || !especie || !lastSeen || !details) {
            return window.alert("Preencha nome, espécie, último local visto e detalhes.");
        }
        if (!photoInput || !photoInput.files || !photoInput.files[0]) {
            return window.alert("Envie uma foto recente do pet.");
        }

        state.busy.add("missing-pet");
        setBusy(submit, true, "Publicando alerta...");

        try {
            const foto = await compressImage(photoInput.files[0], 1100, 0.78);
            await api("/api/pets", {
                method: "POST",
                body: JSON.stringify({
                    donoCpf: state.user.cpf,
                    nome,
                    idade: Number(value("missingPetAge")) || 0,
                    especie,
                    raca: value("missingPetBreed"),
                    sexo: value("missingPetSex") || "NAO_INFORMADO",
                    cor: value("missingPetColor"),
                    local: "Não informado",
                    observacoes: "Pet registrado como desaparecido.",
                    foto,
                    desaparecido: true,
                    statusPet: "DESAPARECIDO",
                    localDesaparecimento: lastSeen,
                    detalhesDesaparecimento: details
                })
            }, 65000);

            toast("Alerta de pet desaparecido publicado.", "success");
            event.currentTarget.reset();
            nextScreen("menuScreen");
        } catch (error) {
            showError(error, "Não foi possível publicar o alerta.");
        } finally {
            state.busy.delete("missing-pet");
            setBusy(submit, false);
        }
    }

    async function registrarAcaoAnonima(event) {
        event.preventDefault();
        if (state.busy.has("anonymous")) return;
        const submit = event.currentTarget.querySelector('button[type="submit"]');
        const selected = value("selectedAnonOption");
        const location = value("anonLocation");
        const details = value("anonDetails");

        if (!selected) return window.alert("Escolha o problema.");
        if (!location || !details) return window.alert("Informe o local e a descrição.");

        state.busy.add("anonymous");
        setBusy(submit, true, "Enviando denúncia...");
        try {
            const fileInput = byId("anonFile");
            const foto = fileInput && fileInput.files && fileInput.files[0]
                ? await compressImage(fileInput.files[0], 1100, 0.78)
                : "";
            await api("/api/ocorrencias/anonima", {
                method: "POST",
                body: JSON.stringify({
                    tipo: "Denúncia Anônima",
                    categoria: "anonymous",
                    assunto: selected,
                    opcaoEscolhida: selected,
                    localizacao: location,
                    detalhes: details,
                    foto,
                    gps: currentGps(),
                    prioridade: selected.toLowerCase().includes("maus") ? "ALTA" : "NORMAL"
                })
            }, 65000);
            text("confirmMsg", "Sua denúncia anônima foi enviada com segurança.");
            nextScreen("confirmationScreen");
            event.currentTarget.reset();
            setValue("selectedAnonOption", "");
        } catch (error) {
            showError(error, "Não foi possível enviar a denúncia.");
        } finally {
            state.busy.delete("anonymous");
            setBusy(submit, false);
        }
    }

    async function reverseGeocode(latitude, longitude) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&accept-language=pt-BR`);
            if (!response.ok) throw new Error("Geocodificação indisponível.");
            const data = await response.json();
            const address = data.address || {};
            return {
                enderecoCompleto: data.display_name || `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                bairro: address.suburb || address.neighbourhood || address.city_district || "",
                cidade: address.city || address.town || address.village || address.municipality || "",
                estado: address.state || "",
                pais: address.country || ""
            };
        } catch (_) {
            return {
                enderecoCompleto: `Localização atual: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                bairro: "",
                cidade: "",
                estado: "",
                pais: ""
            };
        }
    }

    async function requestLocation() {
        if (!navigator.geolocation) throw new Error("Este aparelho não oferece geolocalização.");
        return new Promise(function (resolve, reject) {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 30000
            });
        });
    }

    async function updateCurrentLocation(targetFieldId) {
        const loading = byId("locationLoading");
        const empty = byId("locationEmpty");
        const resultBox = byId("locationResult");
        if (loading) loading.classList.remove("hidden");
        if (empty) empty.classList.add("hidden");
        try {
            const position = await requestLocation();
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const address = await reverseGeocode(latitude, longitude);
            state.gps = { latitude, longitude, ...address };

            setValue("userLatitude", latitude);
            setValue("userLongitude", longitude);
            setValue("userFullAddress", address.enderecoCompleto);
            setValue("userNeighborhood", address.bairro);
            setValue("userCity", address.cidade);
            setValue("userState", address.estado);

            text("realAddressText", address.enderecoCompleto);
            text("realStreet", address.enderecoCompleto.split(",")[0] || "Endereço atual");
            text("realNeighborhood", address.bairro || "Bairro não identificado");
            text("realCity", address.cidade || "Cidade não identificada");
            text("realState", address.estado || "Estado não identificado");
            text("realCountry", address.pais || "Brasil");
            text("gpsStatus", "Localização encontrada com sucesso.");
            if (resultBox) resultBox.classList.remove("hidden");
            if (targetFieldId) setValue(targetFieldId, address.enderecoCompleto);
            return address.enderecoCompleto;
        } finally {
            if (loading) loading.classList.add("hidden");
        }
    }

    async function usarMinhaLocalizacaoNoCampo(fieldId) {
        try {
            const address = await updateCurrentLocation(fieldId);
            toast(`Localização preenchida: ${address}`, "success");
        } catch (error) {
            showError(error, "Não foi possível acessar sua localização.");
        }
    }

    async function renderPerfilCidadao() {
        if (!requireUser("citizen")) return;
        nextScreen("citizenProfile");
        const user = state.user;
        text("citizenProfileName", user.nome || "Usuário");
        text("citizenProfileType", "Cidadão");
        text("citizenProfileContact", `${user.email || "Sem e-mail"} • ${formatPhone(user.telefone) || "Sem telefone"}`);
        setValue("editName", user.nome);
        setValue("editEmail", user.email);
        setValue("editPhone", formatPhone(user.telefone));
        const avatar = byId("profileAvatar");
        if (avatar) avatar.src = safeImage(user.foto, FALLBACK_USER_PHOTO);

        await Promise.allSettled([loadCitizenPets(), loadCitizenNotifications()]);
    }

    async function loadCitizenPets() {
        const container = byId("myPetsContainer");
        if (!container) return;
        container.innerHTML = '<p class="empty-message">Carregando pets...</p>';
        try {
            const pets = await api(`/api/pets?donoCpf=${encodeURIComponent(state.user.cpf)}`, {}, 25000);
            if (!Array.isArray(pets) || !pets.length) {
                container.innerHTML = '<p class="empty-message">Nenhum pet cadastrado ainda.</p>';
                return;
            }
            container.innerHTML = `<h4>🐾 Meus pets</h4><div class="safe-v19-pet-grid">${pets.map(renderCitizenPetCard).join("")}</div>`;
        } catch (error) {
            container.innerHTML = `<p class="empty-message">${escapeHtml(error.message)}</p>`;
        }
    }

    function renderCitizenPetCard(pet) {
        const status = String(pet.status_pet || (pet.desaparecido ? "DESAPARECIDO" : "CADASTRADO")).toUpperCase();
        return `
            <article class="safe-v19-pet-card ${status === "DESAPARECIDO" ? "is-missing" : ""}">
                <img src="${escapeHtml(safeImage(pet.foto, FALLBACK_PET_PHOTO))}" alt="Foto de ${escapeHtml(pet.nome)}">
                <div>
                    <h4>${escapeHtml(pet.nome || "Pet")}</h4>
                    <p>${escapeHtml(pet.especie || "Animal")} • ${escapeHtml(pet.raca || "SRD")}</p>
                    <span class="safe-v19-status ${status.toLowerCase()}">${escapeHtml(status)}</span>
                    ${status === "DESAPARECIDO" ? `<small>Último local: ${escapeHtml(pet.local_desaparecimento || "Não informado")}</small>` : ""}
                </div>
            </article>`;
    }

    async function loadCitizenNotifications() {
        let section = byId("citizenNotificationsV19");
        const petsCard = byId("myPetsContainer") ? byId("myPetsContainer").parentElement : null;
        if (!section && petsCard && petsCard.parentElement) {
            section = document.createElement("div");
            section.id = "citizenNotificationsV19";
            section.className = "occurrence-card";
            petsCard.parentElement.insertBefore(section, petsCard);
        }
        if (!section) return;
        section.innerHTML = "<h4>🔔 Notificações</h4><p>Carregando atualizações...</p>";
        try {
            let notifications = [];
            try {
                notifications = await api(`/api/users/${encodeURIComponent(state.user.cpf)}/notifications-v18`, {}, 25000);
            } catch (_) {
                notifications = await api(`/api/users/${encodeURIComponent(state.user.cpf)}/notifications`, {}, 25000);
            }
            if (!Array.isArray(notifications) || !notifications.length) {
                section.innerHTML = "<h4>🔔 Notificações</h4><p>Nenhuma atualização no momento.</p>";
                return;
            }
            section.innerHTML = `<h4>🔔 Notificações</h4><div class="safe-v19-notification-list">${notifications.slice(0, 12).map(function (item) {
                return `<article class="safe-v19-notification">
                    ${item.foto ? `<img src="${escapeHtml(safeImage(item.foto, FALLBACK_PET_PHOTO))}" alt="Foto da atualização">` : ""}
                    <div><strong>${escapeHtml(item.title || item.titulo || "Atualização")}</strong><p>${escapeHtml(item.message || item.mensagem || "")}</p><small>${escapeHtml(dateTime(item.createdAt || item.criado_em))}</small></div>
                </article>`;
            }).join("")}</div>`;
        } catch (error) {
            section.innerHTML = `<h4>🔔 Notificações</h4><p>${escapeHtml(error.message)}</p>`;
        }
    }

    async function salvarDadosPerfil() {
        if (!requireUser("citizen") || state.busy.has("profile")) return;
        const button = document.querySelector('#citizenProfile button[onclick="salvarDadosPerfil()"]');
        const nome = value("editName");
        const email = value("editEmail");
        const telefone = formatPhone(value("editPhone"));
        if (!nome || !isEmail(email)) return window.alert("Informe nome e e-mail válidos.");
        state.busy.add("profile");
        setBusy(button, true, "Salvando...");
        try {
            const response = await api(`/api/users/${encodeURIComponent(state.user.cpf)}`, {
                method: "PUT",
                body: JSON.stringify({ nome, email, telefone, foto: state.pendingAvatar || null })
            });
            state.user = normalizeUser(response.user);
            localStorage.setItem(STORAGE_USER, JSON.stringify(state.user));
            state.pendingAvatar = "";
            toast("Perfil atualizado.", "success");
            renderPerfilCidadao();
        } catch (error) {
            showError(error, "Não foi possível salvar o perfil.");
        } finally {
            state.busy.delete("profile");
            setBusy(button, false);
        }
    }

    async function fetchProfessionalQueue(force) {
        const now = Date.now();
        if (!force && state.queue.length && now - state.queueLoadedAt < 2500) return state.queue;
        const queue = await api("/api/pro/ocorrencias", {}, 30000);
        state.queue = Array.isArray(queue) ? queue : [];
        state.queueLoadedAt = now;
        return state.queue;
    }

    async function inicializarPainelPro() {
        if (!requireUser("professional")) return;
        nextScreen("proDashboard");
        const user = state.user;
        text("proWelcomeName", user.nome || "Profissional");
        text("proCompanyName", user.company || "Safe Life");
        const avatar = byId("proAvatar");
        if (avatar) avatar.src = safeImage(user.foto, FALLBACK_PRO_PHOTO);
        const adminButton = byId("btnVoltarAdminFromPro");
        if (adminButton) adminButton.style.display = user.type === "admin" ? "block" : "none";

        try {
            const queue = await fetchProfessionalQueue(true);
            text("statTotal", queue.length);
            text("statAnon", queue.filter(function (item) { return item.origem === "anonima" || item.anonima; }).length);
            text("statEmergency", queue.filter(function (item) { return String(item.prioridade).toUpperCase() === "ALTA" || String(item.categoria).toLowerCase() === "emergency"; }).length);
        } catch (error) {
            toast(error.message, "warning");
        }
        startProfessionalRealtime();
    }

    function startProfessionalRealtime() {
        stopProfessionalRealtime();
        if (!state.user || state.user.type !== "professional") return;

        if ("EventSource" in window) {
            try {
                state.eventSource = new EventSource(`${API_BASE}/api/realtime/professional`);
                ["new_occurrence", "queue_changed", "new_missing_pet", "missing_pet_resolved"].forEach(function (eventName) {
                    state.eventSource.addEventListener(eventName, function () {
                        scheduleProfessionalRefresh(eventName === "new_occurrence" || eventName === "new_missing_pet");
                    });
                });
                state.eventSource.onerror = function () {
                    startProfessionalFallback();
                };
            } catch (_) {
                startProfessionalFallback();
            }
        } else {
            startProfessionalFallback();
        }
    }

    function startProfessionalFallback() {
        if (state.fallbackTimer) return;
        state.fallbackTimer = window.setInterval(function () {
            scheduleProfessionalRefresh(false);
        }, 5000);
    }

    function stopProfessionalRealtime() {
        if (state.eventSource) {
            state.eventSource.close();
            state.eventSource = null;
        }
        if (state.fallbackTimer) {
            window.clearInterval(state.fallbackTimer);
            state.fallbackTimer = null;
        }
    }

    function scheduleProfessionalRefresh(notify) {
        window.clearTimeout(state.refreshDebounce);
        state.refreshDebounce = window.setTimeout(async function () {
            state.queueLoadedAt = 0;
            const active = document.querySelector(".screen.active");
            try {
                if (active && active.id === "proListScreen") await abrirOcorrenciasPro();
                else if (active && active.id === "nearestOccurrenceScreen") await abrirOcorrenciaMaisProxima();
                else if (active && active.id === "priorityQueueScreen") await abrirFilaPrioridade();
                else if (active && active.id === "activeAgentsScreen") await abrirPetsDesaparecidosPro();
                else await fetchProfessionalQueue(true);
                if (notify) toast("Novo chamado recebido.", "warning");
            } catch (error) {
                console.warn(error);
            }
        }, 220);
    }

    function occurrencePhoto(item) {
        return safeImage(item.foto, "");
    }

    function occurrenceCard(item, compact) {
        const origin = item.origem || (item.anonima ? "anonima" : "ocorrencia");
        const title = item.opcao_escolhida || item.assunto || item.tipo || "Chamado";
        const reporter = origin === "anonima" ? "Anônimo" : item.nome_usuario || "Cidadão";
        const userPhoto = safeImage(item.foto_usuario, FALLBACK_USER_PHOTO);
        const photo = occurrencePhoto(item);
        const status = String(item.status || "PENDENTE").toUpperCase();
        const priority = String(item.prioridade || "NORMAL").toUpperCase();
        return `<article class="safe-v19-occurrence-card priority-${priority.toLowerCase()}">
            <div class="safe-v19-occurrence-head">
                <img src="${escapeHtml(userPhoto)}" alt="Foto de ${escapeHtml(reporter)}">
                <div><h4>${escapeHtml(title)}</h4><p><strong>Nome:</strong> ${escapeHtml(reporter)}</p><small>${escapeHtml(item.tipo || item.categoria || "Ocorrência")} • ${escapeHtml(status)}</small></div>
                <span class="safe-v19-priority">${escapeHtml(priority)}</span>
            </div>
            <div class="safe-v19-data"><strong>Endereço:</strong> ${escapeHtml(item.endereco_completo || item.localizacao || "Não informado")}</div>
            <div class="safe-v19-data"><strong>Descrição:</strong> ${escapeHtml(item.detalhes || "Sem descrição")}</div>
            ${photo ? `<img class="safe-v19-occurrence-photo" src="${escapeHtml(photo)}" alt="Foto da ocorrência">` : ""}
            ${compact ? "" : `<div class="safe-v19-actions">
                <button type="button" class="btn secondary-btn" ${status === "EM_ATENDIMENTO" ? "disabled" : ""} onclick="atualizarChamado('${escapeHtml(origin)}', ${Number(item.id)}, 'EM_ATENDIMENTO')">Em atendimento</button>
                <button type="button" class="btn" onclick="atualizarChamado('${escapeHtml(origin)}', ${Number(item.id)}, 'CONCLUIDA')">Concluir</button>
            </div>`}
        </article>`;
    }

    async function abrirOcorrenciasPro() {
        if (!requireUser("professional")) return;
        nextScreen("proListScreen");
        const container = byId("listaIntegradaPro");
        if (!container) return;
        container.innerHTML = '<div class="occurrence-card"><p>Carregando chamados...</p></div>';
        try {
            const queue = await fetchProfessionalQueue(true);
            container.innerHTML = queue.length
                ? queue.map(function (item) { return occurrenceCard(item, false); }).join("")
                : '<div class="occurrence-card"><h4>Nenhum chamado pendente</h4><p>A fila está vazia.</p></div>';
        } catch (error) {
            container.innerHTML = `<div class="occurrence-card"><p>${escapeHtml(error.message)}</p></div>`;
        }
    }

    async function atualizarChamado(origin, id, status) {
        if (!requireUser("professional")) return;
        const key = `call-${origin}-${id}`;
        if (state.busy.has(key)) return;
        state.busy.add(key);
        try {
            const response = await api(`/api/chamados/${encodeURIComponent(origin)}/${encodeURIComponent(id)}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status, funcionarioCpf: state.user.cpf })
            }, 35000);
            toast(response.message || "Chamado atualizado.", "success");
            state.queueLoadedAt = 0;
            const active = document.querySelector(".screen.active");
            if (active && active.id === "nearestOccurrenceScreen") await abrirOcorrenciaMaisProxima();
            else if (active && active.id === "priorityQueueScreen") await abrirFilaPrioridade();
            else await abrirOcorrenciasPro();
        } catch (error) {
            showError(error, "Não foi possível atualizar o chamado.");
        } finally {
            state.busy.delete(key);
        }
    }

    function distanceKm(lat1, lon1, lat2, lon2) {
        const values = [lat1, lon1, lat2, lon2].map(Number);
        if (values.some(Number.isNaN)) return Number.POSITIVE_INFINITY;
        const toRad = function (value) { return value * Math.PI / 180; };
        const earth = 6371;
        const dLat = toRad(values[2] - values[0]);
        const dLon = toRad(values[3] - values[1]);
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(values[0])) * Math.cos(toRad(values[2])) * Math.sin(dLon / 2) ** 2;
        return earth * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    async function abrirOcorrenciaMaisProxima() {
        if (!requireUser("professional")) return;
        nextScreen("nearestOccurrenceScreen");
        const container = byId("nearestOccurrenceBox");
        if (!container) return;
        container.innerHTML = '<div class="occurrence-card"><p>Calculando ocorrência mais próxima...</p></div>';
        try {
            const queue = await fetchProfessionalQueue(true);
            if (!queue.length) {
                container.innerHTML = '<div class="occurrence-card"><p>Nenhum chamado pendente.</p></div>';
                return;
            }
            let selected = queue[0];
            if (state.gps.latitude != null && state.gps.longitude != null) {
                selected = queue.slice().sort(function (a, b) {
                    return distanceKm(state.gps.latitude, state.gps.longitude, a.latitude, a.longitude) - distanceKm(state.gps.latitude, state.gps.longitude, b.latitude, b.longitude);
                })[0];
            }
            container.innerHTML = occurrenceCard(selected, false);
        } catch (error) {
            container.innerHTML = `<div class="occurrence-card"><p>${escapeHtml(error.message)}</p></div>`;
        }
    }

    async function abrirFilaPrioridade() {
        if (!requireUser("professional")) return;
        nextScreen("priorityQueueScreen");
        const container = byId("priorityQueueList");
        if (!container) return;
        container.innerHTML = '<div class="occurrence-card"><p>Organizando prioridade...</p></div>';
        try {
            const queue = await fetchProfessionalQueue(true);
            const score = function (item) {
                const priority = String(item.prioridade || "NORMAL").toUpperCase();
                if (priority === "CRITICA" || priority === "CRÍTICA") return 4;
                if (priority === "ALTA") return 3;
                if (priority === "MEDIA" || priority === "MÉDIA") return 2;
                return 1;
            };
            const sorted = queue.slice().sort(function (a, b) {
                return score(b) - score(a) || new Date(a.criado_em) - new Date(b.criado_em);
            });
            container.innerHTML = sorted.length
                ? sorted.map(function (item) { return occurrenceCard(item, false); }).join("")
                : '<div class="occurrence-card"><p>Nenhum chamado pendente.</p></div>';
        } catch (error) {
            container.innerHTML = `<div class="occurrence-card"><p>${escapeHtml(error.message)}</p></div>`;
        }
    }

    async function abrirPetsCadastradosPro() {
        if (!requireUser("professional")) return;
        nextScreen("proPetsScreen");
        const container = byId("proPetsList");
        if (!container) return;
        container.innerHTML = '<div class="occurrence-card"><p>Carregando pets cadastrados...</p></div>';
        try {
            const pets = await api("/api/pro/pets/cadastrados", {}, 30000);
            state.registeredPets = Array.isArray(pets) ? pets : [];
            container.innerHTML = state.registeredPets.length
                ? `<div class="safe-v19-pet-grid">${state.registeredPets.map(function (pet) {
                    return `<article class="safe-v19-pet-card"><img src="${escapeHtml(safeImage(pet.foto, FALLBACK_PET_PHOTO))}" alt="Foto do pet"><div><h4>${escapeHtml(pet.nome)}</h4><p>${escapeHtml(pet.especie || "Animal")} • ${escapeHtml(pet.raca || "SRD")}</p><small><strong>Dono:</strong> ${escapeHtml(pet.nome_dono || "Não informado")}</small><small><strong>Telefone:</strong> ${escapeHtml(formatPhone(pet.telefone_dono) || "Não informado")}</small></div></article>`;
                }).join("")}</div>`
                : '<div class="occurrence-card"><p>Nenhum pet cadastrado normalmente.</p></div>';
        } catch (error) {
            container.innerHTML = `<div class="occurrence-card"><p>${escapeHtml(error.message)}</p></div>`;
        }
    }

    async function abrirPetsDesaparecidosPro() {
        if (!requireUser("professional")) return;
        nextScreen("activeAgentsScreen");
        const container = byId("activeAgentsList");
        if (!container) return;
        container.innerHTML = '<div class="occurrence-card"><p>Carregando pets desaparecidos...</p></div>';
        try {
            const pets = await api("/api/pro/pets/desaparecidos", {}, 30000);
            state.missingPets = Array.isArray(pets) ? pets : [];
            container.innerHTML = state.missingPets.length
                ? state.missingPets.map(function (pet) {
                    return `<article class="safe-v19-missing-card">
                        <div class="safe-v19-pet-head"><img src="${escapeHtml(safeImage(pet.foto, FALLBACK_PET_PHOTO))}" alt="Foto de ${escapeHtml(pet.nome)}"><div><h4>🚨 ${escapeHtml(pet.nome || "Pet")}</h4><p>${escapeHtml(pet.especie || "Animal")} • ${escapeHtml(pet.raca || "SRD")}</p><span class="safe-v19-status desaparecido">DESAPARECIDO</span></div></div>
                        <div class="safe-v19-data"><strong>Dono:</strong> ${escapeHtml(pet.nome_dono || "Não informado")}</div>
                        <div class="safe-v19-data"><strong>Telefone:</strong> ${escapeHtml(formatPhone(pet.telefone_dono) || "Não informado")}</div>
                        <div class="safe-v19-data"><strong>Último local visto:</strong> ${escapeHtml(pet.local_desaparecimento || "Não informado")}</div>
                        <div class="safe-v19-data"><strong>Detalhes:</strong> ${escapeHtml(pet.detalhes_desaparecimento || "Sem detalhes")}</div>
                        <button type="button" class="btn" onclick="abrirConclusaoResgatePet(${Number(pet.id)})">Encontrei este pet</button>
                    </article>`;
                }).join("")
                : '<div class="occurrence-card"><h4>Nenhum pet desaparecido</h4><p>Não há alertas ativos no momento.</p></div>';
        } catch (error) {
            container.innerHTML = `<div class="occurrence-card"><p>${escapeHtml(error.message)}</p></div>`;
        }
    }

    async function abrirConclusaoResgatePet(petId) {
        let pet = state.missingPets.find(function (item) { return Number(item.id) === Number(petId); });
        if (!pet) pet = await api(`/api/pets/${encodeURIComponent(petId)}`);
        state.selectedRescuePet = pet;
        setValue("rescuePetId", pet.id);
        const summary = byId("rescuePetSummary");
        if (summary) {
            summary.innerHTML = `<div class="safe-v19-pet-head"><img src="${escapeHtml(safeImage(pet.foto, FALLBACK_PET_PHOTO))}" alt="Foto do pet"><div><h4>${escapeHtml(pet.nome || "Pet")}</h4><p>${escapeHtml(pet.especie || "Animal")} • Último local: ${escapeHtml(pet.local_desaparecimento || "Não informado")}</p></div></div>`;
        }
        const form = byId("petRescueCompletionForm");
        if (form) form.reset();
        setValue("rescuePetId", pet.id);
        alternarDestinoResgatePet();
        nextScreen("petRescueCompletionScreen");
    }

    function alternarDestinoResgatePet() {
        const type = value("rescueDestinationType");
        const professional = byId("rescueProfessionalDestination");
        const institution = byId("rescueInstitutionDestination");
        if (professional) professional.classList.toggle("hidden", type !== "PROFISSIONAL");
        if (institution) institution.classList.toggle("hidden", type !== "INSTITUICAO");
    }

    async function concluirResgatePet(event) {
        event.preventDefault();
        if (!requireUser("professional") || state.busy.has("pet-rescue")) return;
        const submit = event.currentTarget.querySelector('button[type="submit"]');
        const petId = Number(value("rescuePetId"));
        const destinationType = value("rescueDestinationType");
        const professionalAddress = value("rescueProfessionalAddress");
        const institutionName = value("rescueInstitutionName");
        const institutionAddress = value("rescueInstitutionAddress");
        const instructions = value("rescuePickupInstructions");
        const photoInput = byId("rescueFoundPhoto");
        const address = destinationType === "INSTITUICAO" ? institutionAddress : professionalAddress;

        if (!petId) return window.alert("Pet inválido.");
        if (!photoInput || !photoInput.files || !photoInput.files[0]) return window.alert("Envie uma foto atual do pet encontrado.");
        if (!destinationType) return window.alert("Escolha onde o pet ficará.");
        if (destinationType === "INSTITUICAO" && !institutionName) return window.alert("Informe o nome da instituição.");
        if (!address) return window.alert("Informe o endereço de retirada.");
        if (!instructions) return window.alert("Informe as instruções para retirada.");

        state.busy.add("pet-rescue");
        setBusy(submit, true, "Concluindo resgate...");
        try {
            const photo = await compressImage(photoInput.files[0], 1000, 0.8);
            const response = await api(`/api/pro/pets/${encodeURIComponent(petId)}/concluir-resgate`, {
                method: "POST",
                body: JSON.stringify({
                    funcionarioCpf: state.user.cpf,
                    fotoEncontrado: photo,
                    destinoTipo: destinationType,
                    destinoNome: destinationType === "INSTITUICAO" ? institutionName : state.user.nome,
                    destinoEndereco: address,
                    instrucoesRetirada: instructions
                })
            }, 65000);
            toast(response.message || "Resgate concluído e tutor notificado.", "success");
            event.currentTarget.reset();
            state.selectedRescuePet = null;
            await abrirPetsDesaparecidosPro();
        } catch (error) {
            showError(error, "Não foi possível concluir o resgate.");
        } finally {
            state.busy.delete("pet-rescue");
            setBusy(submit, false);
        }
    }

    async function renderPerfilProfissional() {
        if (!requireUser("professional")) return;
        await loadCompanies(false);
        const user = state.user;
        text("professionalProfileName", user.nome || "Profissional");
        text("professionalProfileCompany", user.company || "Safe Life");
        setValue("editProName", user.nome);
        setValue("editProCpf", user.cpf);
        setValue("editProEmail", user.email);
        setValue("editProPhone", formatPhone(user.telefone));
        setValue("editProCompany", user.company);
        setValue("editProRole", user.cargo || "Agente Operacional");
        setValue("editProSpecialty", user.especialidade || "Resgate de rua");
        setValue("editProRegion", user.regiaoAtendimento || "");
        setValue("editProShiftStatus", user.statusPlantao || "Disponível");
        setValue("editProVehicle", user.veiculo || "Carro de resgate");
        setValue("editProTeam", user.equipe || "");
        setValue("editProBio", user.bioProfissional || "");
        const avatar = byId("professionalProfileAvatar");
        if (avatar) avatar.src = safeImage(user.foto, FALLBACK_PRO_PHOTO);
        nextScreen("professionalProfile");
    }

    async function salvarPerfilProfissional() {
        if (!requireUser("professional") || state.busy.has("pro-profile")) return;
        const button = document.querySelector('#professionalProfile button[onclick="salvarPerfilProfissional()"]');
        const oldCpf = state.user.cpf;
        const cpfNovo = cleanCpf(value("editProCpf"));
        if (cpfNovo.length !== 11) return window.alert("Informe um CPF com 11 números.");
        state.busy.add("pro-profile");
        setBusy(button, true, "Salvando...");
        try {
            const response = await api(`/api/users/${encodeURIComponent(oldCpf)}`, {
                method: "PUT",
                body: JSON.stringify({
                    nome: value("editProName"),
                    cpfNovo,
                    email: value("editProEmail"),
                    telefone: formatPhone(value("editProPhone")),
                    foto: state.pendingProfessionalAvatar || null,
                    company: value("editProCompany"),
                    profissional: {
                        cargo: value("editProRole"),
                        especialidade: value("editProSpecialty"),
                        regiaoAtendimento: value("editProRegion"),
                        statusPlantao: value("editProShiftStatus"),
                        veiculo: value("editProVehicle"),
                        equipe: value("editProTeam"),
                        bioProfissional: value("editProBio")
                    }
                })
            });
            state.user = normalizeUser(response.user);
            localStorage.setItem(STORAGE_USER, JSON.stringify(state.user));
            state.pendingProfessionalAvatar = "";
            toast("Perfil profissional atualizado.", "success");
            inicializarPainelPro();
        } catch (error) {
            showError(error, "Não foi possível salvar o perfil profissional.");
        } finally {
            state.busy.delete("pro-profile");
            setBusy(button, false);
        }
    }

    async function inicializarPainelAdmin() {
        if (!requireUser("admin")) return;
        nextScreen("adminDashboard");
        const user = state.user;
        text("adminWelcomeName", user.nome || "Administrador");
        text("adminCpfText", `CPF: ${formatCpf(user.cpf)}`);
        const avatar = byId("adminAvatar");
        if (avatar) avatar.src = safeImage(user.foto, FALLBACK_ADMIN_PHOTO);
        try {
            const summary = await api("/api/dashboard/resumo", {}, 25000);
            Object.entries(summary || {}).forEach(function ([key, item]) {
                const node = byId(key);
                if (node) node.textContent = item;
            });
        } catch (error) {
            console.warn(error);
        }
    }

    async function renderPerfilAdmin() {
        if (!requireUser("admin")) return;
        const user = state.user;
        text("adminProfileName", user.nome || "Administrador");
        setValue("editAdminName", user.nome);
        setValue("editAdminCpf", user.cpf);
        setValue("editAdminEmail", user.email);
        setValue("editAdminPhone", formatPhone(user.telefone));
        const avatar = byId("adminProfileAvatar");
        if (avatar) avatar.src = safeImage(user.foto, FALLBACK_ADMIN_PHOTO);
        nextScreen("adminProfileScreen");
    }

    async function salvarPerfilAdmin() {
        if (!requireUser("admin") || state.busy.has("admin-profile")) return;
        const button = document.querySelector('#adminProfileScreen button[onclick="salvarPerfilAdmin()"]');
        state.busy.add("admin-profile");
        setBusy(button, true, "Salvando...");
        try {
            const response = await api(`/api/users/${encodeURIComponent(ADMIN_CPF)}`, {
                method: "PUT",
                body: JSON.stringify({
                    nome: value("editAdminName"),
                    email: value("editAdminEmail"),
                    telefone: formatPhone(value("editAdminPhone")),
                    foto: state.pendingAdminAvatar || null
                })
            });
            state.user = normalizeUser(response.user);
            localStorage.setItem(STORAGE_USER, JSON.stringify(state.user));
            state.pendingAdminAvatar = "";
            toast("Perfil do administrador atualizado.", "success");
            inicializarPainelAdmin();
        } catch (error) {
            showError(error, "Não foi possível salvar o perfil.");
        } finally {
            state.busy.delete("admin-profile");
            setBusy(button, false);
        }
    }

    function abrirCadastroEmpresa() {
        if (!requireUser("admin")) return;
        nextScreen("adminCompanyCreateScreen");
    }

    async function cadastrarEmpresaAdmin() {
        if (!requireUser("admin") || state.busy.has("company-create")) return;
        const button = document.querySelector('#adminCompanyCreateScreen button[onclick="cadastrarEmpresaAdmin()"]');
        const nome = value("adminCompanyName");
        if (!nome) return window.alert("Informe o nome da empresa.");
        state.busy.add("company-create");
        setBusy(button, true, "Salvando empresa...");
        try {
            const response = await api("/api/admin/empresas", {
                method: "POST",
                body: JSON.stringify({
                    nome,
                    tipo: value("adminCompanyType"),
                    cnpj: value("adminCompanyCnpj"),
                    telefone: formatPhone(value("adminCompanyPhone")),
                    email: value("adminCompanyEmail"),
                    endereco: value("adminCompanyAddress")
                })
            });
            toast(response.message || "Empresa cadastrada.", "success");
            ["adminCompanyName", "adminCompanyCnpj", "adminCompanyPhone", "adminCompanyEmail", "adminCompanyAddress"].forEach(function (id) { setValue(id, ""); });
            state.companies = [];
            await abrirEmpresasAdmin();
        } catch (error) {
            showError(error, "Não foi possível cadastrar a empresa.");
        } finally {
            state.busy.delete("company-create");
            setBusy(button, false);
        }
    }

    async function abrirEmpresasAdmin() {
        if (!requireUser("admin")) return;
        nextScreen("adminCompaniesScreen");
        const container = byId("adminCompaniesList");
        if (!container) return;
        container.innerHTML = '<div class="occurrence-card"><p>Carregando empresas...</p></div>';
        try {
            const companies = await api("/api/empresas", {}, 25000);
            state.companies = Array.isArray(companies) ? companies : [];
            container.innerHTML = state.companies.length
                ? state.companies.map(function (company) {
                    return `<article class="safe-v19-admin-card"><div><h4>${escapeHtml(company.nome)}</h4><p>${escapeHtml(company.tipo || "Empresa parceira")}</p><small>${escapeHtml(company.endereco || "Endereço não informado")}</small></div><div class="safe-v19-actions"><button type="button" class="btn secondary-btn" onclick="alterarStatusEmpresaAdmin(${Number(company.id)}, ${company.ativo === false ? "true" : "false"})">${company.ativo === false ? "Ativar" : "Desativar"}</button><button type="button" class="btn admin-danger-btn" onclick="excluirEmpresaAdmin(${Number(company.id)}, '${escapeHtml(company.nome).replace(/'/g, "&#39;")}')">Excluir</button></div></article>`;
                }).join("")
                : '<div class="occurrence-card"><p>Nenhuma empresa cadastrada.</p></div>';
        } catch (error) {
            container.innerHTML = `<div class="occurrence-card"><p>${escapeHtml(error.message)}</p></div>`;
        }
    }

    async function alterarStatusEmpresaAdmin(id, ativo) {
        try {
            await api(`/api/admin/empresas/${id}/status`, {
                method: "PATCH",
                body: JSON.stringify({ ativo: Boolean(ativo) })
            });
            toast("Status da empresa atualizado.", "success");
            await abrirEmpresasAdmin();
        } catch (error) {
            showError(error);
        }
    }

    async function excluirEmpresaAdmin(id, nome) {
        if (!window.confirm(`Excluir a empresa ${nome}?`)) return;
        try {
            await api(`/api/admin/empresas/${id}`, { method: "DELETE" });
            toast("Empresa excluída.", "success");
            await abrirEmpresasAdmin();
        } catch (error) {
            showError(error);
        }
    }

    async function abrirCadastroProfissionalAdmin() {
        if (!requireUser("admin")) return;
        await loadCompanies(false);
        nextScreen("adminProfessionalCreateScreen");
    }

    async function cadastrarProfissionalAdmin() {
        if (!requireUser("admin") || state.busy.has("pro-create")) return;
        const button = document.querySelector('#adminProfessionalCreateScreen button[onclick="cadastrarProfissionalAdmin()"]');
        const senha = value("adminProPassword");
        const confirmacao = value("adminProPasswordConfirm");
        const cpf = cleanCpf(value("adminProCpf"));
        if (!value("adminProName") || cpf.length !== 11 || !isEmail(value("adminProEmail")) || !value("adminProCompany")) {
            return window.alert("Preencha nome, CPF, e-mail e empresa corretamente.");
        }
        if (senha.length < 6 || senha !== confirmacao) return window.alert("Informe duas senhas iguais com pelo menos 6 caracteres.");

        state.busy.add("pro-create");
        setBusy(button, true, "Criando profissional...");
        try {
            const response = await api("/api/admin/profissionais", {
                method: "POST",
                body: JSON.stringify({
                    nome: value("adminProName"),
                    cpf,
                    email: value("adminProEmail"),
                    telefone: formatPhone(value("adminProPhone")),
                    senha,
                    company: value("adminProCompany"),
                    profissional: {
                        cargo: value("adminProRole"),
                        especialidade: value("adminProSpecialty"),
                        regiaoAtendimento: value("adminProRegion"),
                        veiculo: value("adminProVehicle"),
                        statusPlantao: value("adminProShiftStatus"),
                        equipe: value("adminProTeam")
                    }
                })
            }, 45000);
            toast(response.message || "Profissional criado.", "success");
            ["adminProName", "adminProCpf", "adminProEmail", "adminProPhone", "adminProPassword", "adminProPasswordConfirm", "adminProRegion", "adminProTeam"].forEach(function (id) { setValue(id, ""); });
            await abrirGerenciarUsuarios();
        } catch (error) {
            showError(error, "Não foi possível criar o profissional.");
        } finally {
            state.busy.delete("pro-create");
            setBusy(button, false);
        }
    }

    async function abrirGerenciarUsuarios() {
        if (!requireUser("admin")) return;
        nextScreen("adminUsersScreen");
        const container = byId("adminUsersList");
        if (!container) return;
        container.innerHTML = '<div class="occurrence-card"><p>Carregando contas...</p></div>';
        try {
            const users = await api("/api/admin/users", {}, 30000);
            container.innerHTML = Array.isArray(users) && users.length
                ? users.map(renderAdminUserCard).join("")
                : '<div class="occurrence-card"><p>Nenhuma conta cadastrada.</p></div>';
        } catch (error) {
            container.innerHTML = `<div class="occurrence-card"><p>${escapeHtml(error.message)}</p></div>`;
        }
    }

    function renderAdminUserCard(user) {
        const isMaster = cleanCpf(user.cpf) === ADMIN_CPF;
        const deleted = Boolean(user.excluidaEm || user.excluida_em);
        const active = user.ativo !== false && !deleted;
        const displayName = escapeHtml(user.nome || "Usuário");
        return `<article class="safe-v19-admin-card ${active ? "" : "is-blocked"}">
            <div class="safe-v19-admin-user"><img src="${escapeHtml(safeImage(user.foto, user.type === "professional" ? FALLBACK_PRO_PHOTO : FALLBACK_USER_PHOTO))}" alt="Foto"><div><h4>${displayName}</h4><p>${escapeHtml(user.type || user.tipo || "citizen")} • CPF ${escapeHtml(formatCpf(user.cpf))}</p><small>${escapeHtml(user.email || "Sem e-mail")} • ${escapeHtml(formatPhone(user.telefone) || "Sem telefone")}</small><span class="safe-v19-status ${active ? "cadastrado" : "desaparecido"}">${deleted ? "EXCLUÍDA" : active ? "ATIVA" : "SUSPENSA"}</span></div></div>
            ${isMaster ? "" : `<div class="safe-v19-actions">${active ? `<button type="button" class="btn secondary-btn" onclick="abrirSuspensaoAdmin('${cleanCpf(user.cpf)}', '${displayName.replace(/'/g, "&#39;")}')">Suspender</button>` : `<button type="button" class="btn" onclick="reativarContaAdmin('${cleanCpf(user.cpf)}')">Reativar</button>`}<button type="button" class="btn admin-danger-btn" onclick="excluirContaAdmin('${cleanCpf(user.cpf)}', '${displayName.replace(/'/g, "&#39;")}')">Excluir conta</button></div>`}
        </article>`;
    }

    function abrirSuspensaoAdmin(cpf, nome) {
        setValue("adminSuspendCpf", cleanCpf(cpf));
        setValue("adminSuspendDays", 7);
        setValue("adminSuspendReason", "");
        text("adminSuspendUserText", `Escolha por quanto tempo ${nome} ficará bloqueado.`);
        const modal = byId("adminSuspendModal");
        if (modal) modal.classList.remove("hidden");
    }

    function fecharModalSuspensaoAdmin() {
        const modal = byId("adminSuspendModal");
        if (modal) modal.classList.add("hidden");
    }

    async function confirmarSuspensaoAdmin() {
        const cpf = cleanCpf(value("adminSuspendCpf"));
        const dias = Number(value("adminSuspendDays"));
        const motivo = value("adminSuspendReason");
        if (!cpf || !Number.isInteger(dias) || dias < 1 || dias > 365 || !motivo) {
            return window.alert("Informe de 1 a 365 dias e o motivo da suspensão.");
        }
        try {
            const response = await api(`/api/admin/accounts/${cpf}/suspend`, {
                method: "PATCH",
                body: JSON.stringify({ dias, motivo })
            });
            toast(response.message || "Conta suspensa.", "success");
            fecharModalSuspensaoAdmin();
            await abrirGerenciarUsuarios();
        } catch (error) {
            showError(error);
        }
    }

    async function reativarContaAdmin(cpf) {
        try {
            const response = await api(`/api/admin/accounts/${cleanCpf(cpf)}/reactivate`, { method: "PATCH", body: "{}" });
            toast(response.message || "Conta reativada.", "success");
            await abrirGerenciarUsuarios();
        } catch (error) {
            showError(error);
        }
    }

    async function excluirContaAdmin(cpf, nome) {
        const reason = window.prompt(`Motivo da exclusão da conta de ${nome}:`, "Conta excluída pelo administrador.");
        if (reason == null) return;
        if (!window.confirm(`Confirmar exclusão da conta de ${nome}? A sessão será encerrada imediatamente.`)) return;
        try {
            const response = await api(`/api/admin/accounts/${cleanCpf(cpf)}/delete`, {
                method: "DELETE",
                body: JSON.stringify({ motivo: reason || "Conta excluída pelo administrador." })
            });
            toast(response.message || "Conta excluída.", "success");
            await abrirGerenciarUsuarios();
        } catch (error) {
            showError(error);
        }
    }

    async function abrirContasSuspeitas() {
        if (!requireUser("admin")) return;
        nextScreen("adminSuspiciousScreen");
        const container = byId("adminSuspiciousList");
        if (!container) return;
        container.innerHTML = '<div class="occurrence-card"><p>Analisando contas...</p></div>';
        try {
            const users = await api("/api/admin/users", {}, 30000);
            const suspicious = (Array.isArray(users) ? users : []).filter(function (user) {
                return user.ativo === false || user.motivoBloqueio || user.excluidaEm || !user.email || !user.telefone;
            });
            container.innerHTML = suspicious.length
                ? suspicious.map(renderAdminUserCard).join("")
                : '<div class="occurrence-card"><h4>Nenhuma conta suspeita</h4><p>Não foram encontrados perfis com alerta.</p></div>';
        } catch (error) {
            container.innerHTML = `<div class="occurrence-card"><p>${escapeHtml(error.message)}</p></div>`;
        }
    }

    async function abrirRelatorioAdmin() {
        if (!requireUser("admin")) return;
        nextScreen("adminReportScreen");
        const container = byId("adminReportBox");
        if (!container) return;
        container.innerHTML = '<div class="occurrence-card"><p>Montando relatório...</p></div>';
        try {
            const summary = await api("/api/dashboard/resumo", {}, 30000);
            const entries = Object.entries(summary || {});
            container.innerHTML = entries.length
                ? `<div class="safe-v19-report-grid">${entries.map(function ([key, number]) {
                    const title = key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").trim();
                    return `<article class="stat-card"><strong>${escapeHtml(number)}</strong><span>${escapeHtml(title)}</span></article>`;
                }).join("")}</div>`
                : '<div class="occurrence-card"><p>Sem dados para o relatório.</p></div>';
        } catch (error) {
            container.innerHTML = `<div class="occurrence-card"><p>${escapeHtml(error.message)}</p></div>`;
        }
    }

    function abrirRelatorioPlantao() {
        nextScreen("shiftReportScreen");
        const container = byId("shiftReportBox");
        if (container) {
            container.innerHTML = `<div class="occurrence-card"><h4>Resumo do plantão</h4><p>Chamados atuais: ${state.queue.length}</p><p>Atualizado em ${escapeHtml(dateTime(new Date()))}</p></div>`;
        }
    }

    function setupCarousel() {
        const image = byId("welcomeCarouselImage");
        if (!image) return;
        const images = [
            "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=85",
            "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=1200&q=85"
        ];
        let index = 0;
        window.setInterval(function () {
            index = (index + 1) % images.length;
            image.src = images[index];
        }, 6000);
    }

    function installLocationButton() {
        const button = byId("btnLocalizacao");
        if (!button) return;
        button.addEventListener("click", async function () {
            setBusy(button, true, "Buscando localização...");
            try {
                await updateCurrentLocation("");
                const continueButton = byId("continuarBtn");
                if (continueButton) continueButton.disabled = false;
            } catch (error) {
                showError(error, "Não foi possível obter a localização.");
            } finally {
                setBusy(button, false);
            }
        });
    }

    function installGlobalErrorHandling() {
        window.addEventListener("error", function (event) {
            console.error("Erro global Safe Life:", event.error || event.message);
        });
        window.addEventListener("unhandledrejection", function (event) {
            console.error("Promessa rejeitada Safe Life:", event.reason);
        });
    }

    function boot() {
        restoreSession();
        installMasks();
        installLocationButton();
        setupCarousel();
        installGlobalErrorHandling();
        toggleRegCompanyField();
        toggleLoginCompanyField();
        renderQuickOptions("anonOptionsGrid", "selectedAnonOption", anonymousOptions);
        renderQuickOptions("quickOptionsGrid", "selectedQuickOption", citizenConfigs.report.options);

        const destination = byId("rescueDestinationType");
        if (destination) destination.addEventListener("change", alternarDestinoResgatePet);

        if (state.user && state.token) startSessionWatcher();
        document.body.classList.add("safe-life-ready");
    }

    Object.assign(window, {
        nextScreen,
        previewFotoCadastro,
        atualizarFotoPerfil,
        atualizarFotoProfissional,
        atualizarFotoAdmin,
        toggleRegCompanyField,
        toggleLoginCompanyField,
        efetuarCadastro,
        autenticar,
        logout,
        openCitizenForm,
        openPetForm,
        abrirPetDesaparecido,
        openAnonForm,
        registrarAcao,
        registrarPet,
        registrarPetDesaparecido,
        registrarAcaoAnonima,
        usarMinhaLocalizacaoNoCampo,
        renderPerfilCidadao,
        salvarDadosPerfil,
        inicializarPainelPro,
        renderPerfilProfissional,
        salvarPerfilProfissional,
        abrirOcorrenciasPro,
        abrirOcorrenciaMaisProxima,
        abrirFilaPrioridade,
        abrirPetsCadastradosPro,
        abrirPetsDesaparecidosPro,
        abrirConclusaoResgatePet,
        alternarDestinoResgatePet,
        concluirResgatePet,
        atualizarChamado,
        inicializarPainelAdmin,
        renderPerfilAdmin,
        salvarPerfilAdmin,
        abrirCadastroEmpresa,
        cadastrarEmpresaAdmin,
        abrirEmpresasAdmin,
        alterarStatusEmpresaAdmin,
        excluirEmpresaAdmin,
        abrirCadastroProfissionalAdmin,
        cadastrarProfissionalAdmin,
        abrirGerenciarUsuarios,
        abrirSuspensaoAdmin,
        fecharModalSuspensaoAdmin,
        confirmarSuspensaoAdmin,
        reativarContaAdmin,
        excluirContaAdmin,
        abrirContasSuspeitas,
        abrirRelatorioAdmin,
        abrirRelatorioPlantao,
        encerrarSessaoPorStatus
    });

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot, { once: true });
    } else {
        boot();
    }
})();
