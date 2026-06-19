const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { Pool } = require("pg");

const app = express();

const SAFE_LIFE_VERSION = "21.4.0";
const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PRODUCTION = NODE_ENV === "production";
const ADMIN_CPF = String(process.env.ADMIN_CPF || "45317828791").replace(/\D/g, "");
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "123456");
const ADMIN_TOKEN = String(process.env.ADMIN_TOKEN || "");
const APP_SECRET = String(
    process.env.APP_SECRET ||
    process.env.ADMIN_TOKEN ||
    "safelife-dev-secret-change-me"
);
const REQUIRE_USER_PASSWORD = process.env.REQUIRE_USER_PASSWORD === "true";
const PUBLIC_DIR = path.join(__dirname, "public");
const PUBLIC_INDEX = path.join(PUBLIC_DIR, "index.html");

if (IS_PRODUCTION && ADMIN_PASSWORD === "123456") {
    console.warn("⚠️ Configure ADMIN_PASSWORD no Render. A senha padrão não é segura.");
}

if (IS_PRODUCTION && APP_SECRET === "safelife-dev-secret-change-me") {
    console.warn("⚠️ Configure APP_SECRET no Render para proteger os tokens de sessão.");
}

/* =====================================================
   MIDDLEWARES
===================================================== */

app.disable("x-powered-by");
app.set("trust proxy", 1);

const origensPermitidas = String(process.env.FRONTEND_URL || "")
    .split(",")
    .map((origem) => origem.trim().replace(/\/$/, ""))
    .filter(Boolean);

app.use(cors({
    origin(origem, callback) {
        if (!origem || origensPermitidas.length === 0) {
            return callback(null, true);
        }

        const origemNormalizada = origem.replace(/\/$/, "");

        if (origensPermitidas.includes(origemNormalizada)) {
            return callback(null, true);
        }

        return callback(new Error("Origem não autorizada pelo CORS."));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Admin-Token",
        "X-Requested-With"
    ]
}));

app.use(express.json({
    limit: "18mb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "18mb"
}));

app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
});


app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(self), geolocation=(self)");
    next();
});

if (fs.existsSync(PUBLIC_DIR)) {
    app.use(express.static(PUBLIC_DIR));
}

/* =====================================================
   CONEXÃO COM POSTGRESQL / SUPABASE
===================================================== */

const possuiDatabaseUrl = Boolean(process.env.DATABASE_URL);

const configuracaoBanco = possuiDatabaseUrl
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DB_SSL === "false"
            ? false
            : { rejectUnauthorized: false },
        max: Number(process.env.DB_POOL_MAX) || 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000
    }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || "safelife",
        user: process.env.DB_USER || "postgres",
        password: process.env.DB_PASSWORD || "",
        max: Number(process.env.DB_POOL_MAX) || 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 15000
    };

const pool = new Pool(configuracaoBanco);

pool.on("connect", () => {
    console.log("🐘 Nova conexão aberta com o PostgreSQL.");
});

pool.on("error", (erro) => {
    console.error("❌ Erro inesperado no pool do PostgreSQL:", erro.message);
});

/* =====================================================
   FUNÇÕES AUXILIARES
===================================================== */

function limparCpf(cpf) {
    return String(cpf || "").replace(/\D/g, "");
}

function limparTexto(valor) {
    return String(valor || "").trim();
}

function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
}


function validarMidiaObrigatoria(valor) {
    const media = String(valor || "").trim();

    if (!media) {
        return {
            ok: false,
            error: "Envie obrigatoriamente uma imagem ou um vídeo."
        };
    }

    const match = media.match(
        /^data:(image\/[a-z0-9.+-]+|video\/[a-z0-9.+-]+);base64,([a-z0-9+/=\r\n]+)$/i
    );

    if (!match) {
        return {
            ok: false,
            error: "A comprovação precisa ser uma imagem ou vídeo válido enviado pelo aplicativo."
        };
    }

    const mimeType = String(match[1] || "").toLowerCase();
    const base64 = String(match[2] || "").replace(/\s+/g, "");
    const approximateBytes = Math.floor((base64.length * 3) / 4);
    const kind = mimeType.startsWith("video/") ? "video" : "image";
    const maxBytes = kind === "video"
        ? 9 * 1024 * 1024
        : 8 * 1024 * 1024;

    if (approximateBytes <= 0 || approximateBytes > maxBytes) {
        return {
            ok: false,
            error: kind === "video"
                ? "O vídeo deve ter no máximo 9 MB."
                : "A imagem processada ficou muito grande."
        };
    }

    return {
        ok: true,
        media,
        kind,
        mimeType,
        approximateBytes
    };
}


function hashSenha(senha) {
    const senhaTexto = String(senha || "");
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(senhaTexto, salt, 64).toString("hex");

    return `scrypt$${salt}$${hash}`;
}


function hashSenhaAsync(senha) {
    const senhaTexto = String(senha || "");
    const salt = crypto.randomBytes(16).toString("hex");

    return new Promise((resolve, reject) => {
        crypto.scrypt(senhaTexto, salt, 64, (erro, chaveDerivada) => {
            if (erro) {
                reject(erro);
                return;
            }

            resolve(
                `scrypt$${salt}$${Buffer.from(chaveDerivada).toString("hex")}`
            );
        });
    });
}

function gerarSenhaTemporariaProfissional() {
    const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    const bytes = crypto.randomBytes(10);
    let senha = "SL-";

    for (let index = 0; index < bytes.length; index += 1) {
        senha += caracteres[bytes[index] % caracteres.length];
    }

    return senha;
}

function validarSenhaProfissionalForte(senha) {
    const valor = String(senha || "");

    return (
        valor.length >= 8 &&
        /[a-z]/.test(valor) &&
        /[A-Z]/.test(valor) &&
        /\d/.test(valor)
    );
}

function senhaEstaHasheada(senhaHash) {
    return String(senhaHash || "").startsWith("scrypt$");
}

function verificarSenha(senha, senhaHash) {
    const senhaTexto = String(senha || "");
    const hashSalvo = String(senhaHash || "");

    if (!hashSalvo) return false;

    if (!senhaEstaHasheada(hashSalvo)) {
        const valorA = Buffer.from(senhaTexto);
        const valorB = Buffer.from(hashSalvo);

        if (valorA.length !== valorB.length) return false;
        return crypto.timingSafeEqual(valorA, valorB);
    }

    const partes = hashSalvo.split("$");

    if (partes.length !== 3) return false;

    const [, salt, hashEsperadoHex] = partes;
    const hashCalculado = crypto.scryptSync(senhaTexto, salt, 64);
    const hashEsperado = Buffer.from(hashEsperadoHex, "hex");

    if (hashCalculado.length !== hashEsperado.length) return false;
    return crypto.timingSafeEqual(hashCalculado, hashEsperado);
}

function base64UrlEncode(valor) {
    return Buffer.from(valor).toString("base64url");
}

function criarTokenSessao(usuario, duracaoHoras = 12) {
    const agora = Math.floor(Date.now() / 1000);
    const payload = {
        sub: usuario.id,
        cpf: usuario.cpf,
        tipo: usuario.tipo,
        sv: Number(usuario.session_version || 1),
        iat: agora,
        exp: agora + (duracaoHoras * 60 * 60)
    };

    const payloadCodificado = base64UrlEncode(JSON.stringify(payload));
    const assinatura = crypto
        .createHmac("sha256", APP_SECRET)
        .update(payloadCodificado)
        .digest("base64url");

    return `${payloadCodificado}.${assinatura}`;
}

function validarTokenSessao(token) {
    try {
        const [payloadCodificado, assinaturaRecebida] = String(token || "").split(".");

        if (!payloadCodificado || !assinaturaRecebida) return null;

        const assinaturaEsperada = crypto
            .createHmac("sha256", APP_SECRET)
            .update(payloadCodificado)
            .digest("base64url");

        const bufferRecebido = Buffer.from(assinaturaRecebida);
        const bufferEsperado = Buffer.from(assinaturaEsperada);

        if (bufferRecebido.length !== bufferEsperado.length) return null;

        if (!crypto.timingSafeEqual(bufferRecebido, bufferEsperado)) {
            return null;
        }

        const payload = JSON.parse(
            Buffer.from(payloadCodificado, "base64url").toString("utf8")
        );

        if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        return payload;
    } catch (erro) {
        return null;
    }
}

function extrairBearerToken(req) {
    const authorization = String(req.headers.authorization || "");
    const correspondencia = authorization.match(/^Bearer\s+(.+)$/i);
    return correspondencia ? correspondencia[1].trim() : "";
}

function detalhesErro(erro) {
    return IS_PRODUCTION ? undefined : erro.message;
}

function usuarioSeguro(usuario) {
    if (!usuario) return null;

    const onlineAte = usuario.online_ate
        ? new Date(usuario.online_ate)
        : null;

    const onlineAgora =
        typeof usuario.online_agora === "boolean"
            ? usuario.online_agora
            : Boolean(
                onlineAte &&
                !Number.isNaN(onlineAte.getTime()) &&
                onlineAte.getTime() > Date.now()
            );

    return {
        id: usuario.id,
        nome: usuario.nome,
        cpf: usuario.cpf,
        email: usuario.email,
        telefone: usuario.telefone,
        type: usuario.tipo,
        company: usuario.empresa || "Nenhum",
        foto: usuario.foto_perfil,
        ativo: usuario.ativo,
        bloqueadoAte: usuario.bloqueado_ate || null,
        bloqueadoEm: usuario.bloqueado_em || null,
        motivoBloqueio: usuario.motivo_bloqueio || null,
        excluidaEm: usuario.excluida_em || null,
        sessionVersion: Number(usuario.session_version || 1),
        mustChangePassword: Boolean(usuario.troca_senha_obrigatoria),
        onlineAgora,
        ultimaAtividadeEm: usuario.ultima_atividade_em || null,
        onlineAte: usuario.online_ate || null,
        cargo: usuario.cargo || null,
        nivelAcesso: usuario.nivel_acesso || null,
        registroProfissional: usuario.registro_profissional || null,
        especialidade: usuario.especialidade || null,
        regiaoAtendimento: usuario.regiao_atendimento || null,
        statusPlantao: usuario.status_plantao || null,
        veiculo: usuario.veiculo || null,
        equipe: usuario.equipe || null,
        bioProfissional: usuario.bio_profissional || null,
        criadoEm: usuario.criado_em,
        atualizadoEm: usuario.atualizado_em
    };
}

function montarGps(gps) {
    if (!gps) {
        return {
            latitude: null,
            longitude: null,
            enderecoCompleto: null,
            bairro: null,
            cidade: null,
            estado: null
        };
    }

    return {
        latitude: gps.latitude || null,
        longitude: gps.longitude || null,
        enderecoCompleto: gps.enderecoCompleto || gps.endereco_completo || null,
        bairro: gps.bairro || null,
        cidade: gps.cidade || null,
        estado: gps.estado || null
    };
}

async function buscarUsuarioPorCpf(cpf) {
    const cpfLimpo = limparCpf(cpf);

    const result = await pool.query(
        `
        SELECT
            u.*,
            f.cargo,
            f.nivel_acesso,
            f.registro_profissional,
            f.especialidade,
            f.regiao_atendimento,
            f.status_plantao,
            f.veiculo,
            f.equipe,
            f.bio_profissional
        FROM usuarios u
        LEFT JOIN funcionarios f
        ON f.usuario_id = u.id
        WHERE u.cpf = $1
        LIMIT 1
        `,
        [cpfLimpo]
    );

    return result.rows[0] || null;
}

async function garantirAdminNoBanco() {
    const adminExiste = await buscarUsuarioPorCpf(ADMIN_CPF);
    const senhaAdminHash = hashSenha(ADMIN_PASSWORD);

    if (adminExiste) {
        const precisaAtualizar =
            adminExiste.tipo !== "admin" ||
            adminExiste.ativo !== true ||
            !senhaEstaHasheada(adminExiste.senha_hash) ||
            !verificarSenha(ADMIN_PASSWORD, adminExiste.senha_hash);

        if (precisaAtualizar) {
            const result = await pool.query(
                `
                UPDATE usuarios
                SET
                    tipo = 'admin',
                    empresa = 'Safe Life Matriz',
                    ativo = TRUE,
                    senha_hash = $1,
                    foto_perfil = COALESCE(NULLIF(foto_perfil, ''), $3)
                WHERE cpf = $2
                RETURNING *
                `,
                [senhaAdminHash, ADMIN_CPF, process.env.ADMIN_PHOTO || "img/apenasumsiri.jpeg"]
            );

            return result.rows[0];
        }

        return adminExiste;
    }

    const result = await pool.query(
        `
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
        ($1,$2,$3,$4,$5,$6,$7,$8,TRUE)
        RETURNING *
        `,
        [
            process.env.ADMIN_NAME || "Gustavo Siri",
            ADMIN_CPF,
            senhaAdminHash,
            process.env.ADMIN_EMAIL || "gustavo.siriguejo@safelife.com",
            process.env.ADMIN_PHONE || "11977770000",
            "admin",
            "Safe Life Matriz",
            process.env.ADMIN_PHOTO || "img/apenasumsiri.jpeg"
        ]
    );

    return result.rows[0];
}


function estadoConta(usuario) {
    if (!usuario) {
        return {
            ok: false,
            status: 404,
            code: "ACCOUNT_NOT_FOUND",
            message: "Conta não encontrada."
        };
    }

    if (usuario.excluida_em) {
        return {
            ok: false,
            status: 410,
            code: "ACCOUNT_DELETED",
            message: "Esta conta foi excluída pelo administrador."
        };
    }

    const bloqueadoAte = usuario.bloqueado_ate
        ? new Date(usuario.bloqueado_ate)
        : null;

    if (bloqueadoAte && bloqueadoAte.getTime() > Date.now()) {
        return {
            ok: false,
            status: 423,
            code: "ACCOUNT_SUSPENDED",
            message: usuario.motivo_bloqueio
                ? `Conta suspensa: ${usuario.motivo_bloqueio}`
                : "Esta conta está temporariamente suspensa.",
            blockedUntil: bloqueadoAte.toISOString()
        };
    }

    if (usuario.ativo !== true) {
        return {
            ok: false,
            status: 403,
            code: "ACCOUNT_INACTIVE",
            message: "Esta conta está desativada."
        };
    }

    return { ok: true };
}

async function reativarBloqueioExpirado(usuario) {
    if (
        usuario &&
        !usuario.excluida_em &&
        usuario.bloqueado_ate &&
        new Date(usuario.bloqueado_ate).getTime() <= Date.now()
    ) {
        const result = await pool.query(
            `
            UPDATE usuarios
            SET
                ativo = TRUE,
                bloqueado_ate = NULL,
                bloqueado_em = NULL,
                motivo_bloqueio = NULL,
                bloqueado_por = NULL
            WHERE id = $1
            RETURNING *
            `,
            [usuario.id]
        );

        if (usuario.tipo === "professional") {
            await pool.query(
                "UPDATE funcionarios SET ativo = TRUE WHERE usuario_id = $1",
                [usuario.id]
            );
        }

        return result.rows[0] || usuario;
    }

    return usuario;
}

async function registrarAuditoria({
    administradorId = null,
    usuarioAlvoId = null,
    acao,
    detalhes = {},
    req = null
}) {
    try {
        await pool.query(
            `
            INSERT INTO auditoria_seguranca
            (
                administrador_id,
                usuario_alvo_id,
                acao,
                detalhes,
                ip_origem,
                user_agent
            )
            VALUES ($1,$2,$3,$4::jsonb,$5,$6)
            `,
            [
                administradorId,
                usuarioAlvoId,
                acao,
                JSON.stringify(detalhes || {}),
                req ? String(req.ip || "") : null,
                req ? String(req.headers["user-agent"] || "") : null
            ]
        );
    } catch (erro) {
        console.warn("⚠️ Não foi possível registrar auditoria:", erro.message);
    }
}

async function inserirNotificacao(client, {
    usuarioId,
    tipo,
    titulo,
    mensagem,
    foto = null,
    dados = {}
}) {
    const result = await client.query(
        `
        INSERT INTO notificacoes
        (usuario_id, tipo, titulo, mensagem, foto, dados)
        VALUES ($1,$2,$3,$4,$5,$6::jsonb)
        RETURNING id, usuario_id, tipo, titulo, mensagem, criado_em
        `,
        [
            usuarioId,
            tipo,
            titulo,
            mensagem,
            foto,
            JSON.stringify(dados || {})
        ]
    );

    const notification = result.rows[0];

    await publishRealtimeEvent({
        db: client,
        audience: "USER",
        audienceId: usuarioId,
        type: "user_notification",
        payload: {
            notificationId: notification.id,
            title: notification.titulo,
            message: notification.mensagem,
            notificationType: notification.tipo,
            createdAt: notification.criado_em
        }
    });

    return notification;
}

async function verificarAdmin(req, res, next) {
    try {
        const tokenBearer = extrairBearerToken(req);
        const tokenEmergencial = String(req.headers["x-admin-token"] || "");
        const payload = validarTokenSessao(tokenBearer);

        const tokenEmergencialValido =
            Boolean(ADMIN_TOKEN) && tokenEmergencial === ADMIN_TOKEN;

        if (!payload && !tokenEmergencialValido) {
            return res.status(403).json({
                error: "Acesso administrativo negado.",
                code: "ADMIN_AUTH_REQUIRED"
            });
        }

        const admin = await garantirAdminNoBanco();
        const estado = estadoConta(admin);

        if (!estado.ok) {
            return res.status(estado.status).json({
                error: estado.message,
                code: estado.code,
                blockedUntil: estado.blockedUntil || null
            });
        }

        if (!tokenEmergencialValido) {
            const tokenSessaoValido =
                payload &&
                payload.tipo === "admin" &&
                limparCpf(payload.cpf) === ADMIN_CPF &&
                Number(payload.sv || 1) === Number(admin.session_version || 1);

            if (!tokenSessaoValido) {
                return res.status(401).json({
                    error: "Sessão administrativa expirada ou revogada.",
                    code: "SESSION_REVOKED"
                });
            }
        }

        req.admin = admin;
        req.auth = payload || {
            cpf: ADMIN_CPF,
            tipo: "admin",
            emergency: true
        };

        return next();
    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao validar administrador.",
            details: detalhesErro(erro)
        });
    }
}


async function verificarSessaoUsuario(req, res, next) {
    try {
        const payload = validarTokenSessao(extrairBearerToken(req));
        if (!payload) {
            return res.status(401).json({ error: "Sessão necessária.", code: "AUTH_REQUIRED" });
        }
        const usuario = await buscarUsuarioPorCpf(payload.cpf);
        const estado = estadoConta(usuario);
        if (!estado.ok) {
            return res.status(estado.status).json({
                error: estado.message, code: estado.code, blockedUntil: estado.blockedUntil || null
            });
        }
        if (Number(payload.sv || 1) !== Number(usuario.session_version || 1)) {
            return res.status(401).json({ error: "Sessão expirada ou revogada.", code: "SESSION_REVOKED" });
        }

        const isPasswordChangeRoute =
            String(req.originalUrl || "").includes(
                "/api/auth/change-temporary-password"
            );

        if (
            usuario.troca_senha_obrigatoria === true &&
            !isPasswordChangeRoute
        ) {
            return res.status(428).json({
                error: "Crie sua senha definitiva antes de acessar o sistema.",
                code: "PASSWORD_CHANGE_REQUIRED"
            });
        }

        req.auth = payload;
        req.usuarioAutenticado = usuario;
        return next();
    } catch (erro) {
        return res.status(500).json({ error: "Erro ao validar sessão.", details: detalhesErro(erro) });
    }
}

/* =====================================================
   ROTA INICIAL / SAÚDE DA API
===================================================== */

app.get("/api/status", async (req, res) => {
    try {
        const resultado = await pool.query("SELECT NOW() AS horario_banco");

        return res.status(200).json({
            message: "API Safe Life Online",
            status: "OK",
            banco: "PostgreSQL conectado",
            horarioBanco: resultado.rows[0].horario_banco,
            ambiente: NODE_ENV
        });
    } catch (erro) {
        return res.status(503).json({
            message: "API Safe Life iniciada, mas o PostgreSQL não respondeu.",
            status: "ERRO_BANCO",
            details: detalhesErro(erro)
        });
    }
});

app.get("/api", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        return res.status(200).json({
            message: "🚀 API Safe Life Online",
            status: "OK",
            banco: "PostgreSQL conectado",
            rotas: {
                status: "GET /api/status",
                cadastro: "POST /api/auth/register",
                login: "POST /api/auth/login",
                usuarios: "GET /api/users",
                perfil: "GET /api/users/:cpf",
                atualizarPerfil: "PUT /api/users/:cpf",
                adminUsuarios: "GET /api/admin/users",
                adminBloquearReativar: "PATCH /api/admin/users/:cpf/status",
                empresas: "GET /api/empresas",
                cadastrarEmpresa: "POST /api/admin/empresas",
                cadastrarProfissionalAdmin: "POST /api/admin/profissionais",
                pets: "GET /api/pets",
                cadastrarPet: "POST /api/pets",
                ocorrencias: "GET /api/ocorrencias",
                criarOcorrencia: "POST /api/ocorrencias",
                denunciaAnonima: "POST /api/ocorrencias/anonima",
                painelProfissional: "GET /api/pro/ocorrencias",
                atualizarStatus: "PATCH /api/chamados/:origem/:id/status",
                deletarChamado: "DELETE /api/chamados/:origem/:id",
                dashboard: "GET /api/dashboard/resumo"
            }
        });
    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao conectar no PostgreSQL.",
            details: detalhesErro(erro)
        });
    }
});

app.get("/", async (req, res) => {
    if (fs.existsSync(PUBLIC_INDEX)) {
        return res.sendFile(PUBLIC_INDEX);
    }

    return res.redirect("/api");
});


const tentativasLoginMemoria = new Map();

app.use("/api/auth/login", (req, res, next) => {
    const cpf = limparCpf(req.body?.cpf);
    const ip = String(req.ip || req.socket?.remoteAddress || "desconhecido");
    const chave = `${ip}:${cpf}`;
    const agora = Date.now();
    const janela = 15 * 60 * 1000;
    const maximo = 10;
    const anteriores = (tentativasLoginMemoria.get(chave) || []).filter(
        (tempo) => agora - tempo < janela
    );

    if (anteriores.length >= maximo) {
        return res.status(429).json({
            error: "Muitas tentativas de login. Aguarde 15 minutos.",
            code: "LOGIN_RATE_LIMIT"
        });
    }

    res.on("finish", () => {
        const sucesso = res.statusCode >= 200 && res.statusCode < 300;

        if (sucesso) {
            tentativasLoginMemoria.delete(chave);
        } else {
            anteriores.push(Date.now());
            tentativasLoginMemoria.set(chave, anteriores);
        }

        pool.query(
            `
            INSERT INTO tentativas_login
            (cpf, sucesso, ip_origem, user_agent, motivo)
            VALUES ($1,$2,$3,$4,$5)
            `,
            [
                cpf || null,
                sucesso,
                ip,
                String(req.headers["user-agent"] || ""),
                sucesso ? "LOGIN_OK" : `HTTP_${res.statusCode}`
            ]
        ).catch(() => {});
    });

    next();
});


/* =====================================================
   TEMPO REAL ONLINE FIRST — SSE + POSTGRES LISTEN/NOTIFY
===================================================== */

const realtimeClients = new Map();
let realtimeListenerClient = null;
let realtimeListenerRetryTimer = null;

function normalizeRealtimePayload(payload) {
    const safe = payload && typeof payload === "object" ? { ...payload } : {};

    for (const key of ["foto", "photo", "fotoEncontrado", "foto_encontrado"]) {
        if (typeof safe[key] === "string" && safe[key].length > 1000) {
            safe[key] = null;
        }
    }

    return safe;
}

function realtimeClientCanReceive(client, event) {
    if (event.audience === "ALL") return true;
    if (event.audience === "PROFESSIONALS") {
        return client.type === "professional" || client.type === "admin";
    }
    if (event.audience === "ADMINS") return client.type === "admin";
    if (event.audience === "USER") {
        return Number(event.audienceId) === Number(client.userId);
    }
    return false;
}

function writeRealtimeEvent(client, event) {
    if (!client || client.closed || !realtimeClientCanReceive(client, event)) return;

    try {
        if (event.id) client.res.write(`id: ${event.id}\n`);
        client.res.write(`event: ${event.type}\n`);
        client.res.write(`data: ${JSON.stringify({
            id: event.id || null,
            type: event.type,
            payload: event.payload || {},
            sentAt: event.sentAt || new Date().toISOString()
        })}\n\n`);
    } catch (_) {
        client.closed = true;
        realtimeClients.delete(client.id);
    }
}

function deliverRealtimeEvent(event) {
    for (const client of realtimeClients.values()) {
        writeRealtimeEvent(client, event);
    }
}

async function publishRealtimeEvent({
    db = pool,
    audience = "ALL",
    audienceId = null,
    type,
    payload = {}
}) {
    const normalizedPayload = normalizeRealtimePayload(payload);

    try {
        const result = await db.query(
            `
            INSERT INTO eventos_tempo_real
            (audiencia, usuario_id, tipo_evento, payload)
            VALUES ($1,$2,$3,$4::jsonb)
            RETURNING id, audiencia, usuario_id, tipo_evento, payload, criado_em
            `,
            [
                audience,
                audienceId || null,
                String(type || "message").slice(0, 80),
                JSON.stringify(normalizedPayload)
            ]
        );

        const row = result.rows[0];
        const event = {
            id: Number(row.id),
            audience: row.audiencia,
            audienceId: row.usuario_id,
            type: row.tipo_evento,
            payload: row.payload || {},
            sentAt: row.criado_em
        };

        await db.query(
            "SELECT pg_notify('safe_life_events', $1)",
            [JSON.stringify(event)]
        );

        return event;
    } catch (error) {
        console.warn("⚠️ Evento em tempo real não persistido:", error.message);
        const fallbackEvent = {
            id: Date.now(),
            audience,
            audienceId,
            type,
            payload: normalizedPayload,
            sentAt: new Date().toISOString()
        };
        deliverRealtimeEvent(fallbackEvent);
        return fallbackEvent;
    }
}

function broadcastProfessionalEvent(type, payload = {}) {
    publishRealtimeEvent({
        audience: "PROFESSIONALS",
        type,
        payload
    }).catch((error) => {
        console.warn("⚠️ Falha ao publicar evento profissional:", error.message);
    });
}

async function connectRealtimeListener() {
    if (realtimeListenerClient) return;

    try {
        const client = await pool.connect();
        realtimeListenerClient = client;
        await client.query("LISTEN safe_life_events");

        client.on("notification", (message) => {
            if (message.channel !== "safe_life_events" || !message.payload) return;
            try {
                deliverRealtimeEvent(JSON.parse(message.payload));
            } catch (error) {
                console.warn("⚠️ Evento PostgreSQL inválido:", error.message);
            }
        });

        const reconnect = () => {
            try { client.release(); } catch (_) {}
            realtimeListenerClient = null;
            if (realtimeListenerRetryTimer) clearTimeout(realtimeListenerRetryTimer);
            realtimeListenerRetryTimer = setTimeout(connectRealtimeListener, 2500);
        };

        client.on("error", reconnect);
        client.on("end", reconnect);
        console.log("📡 Canal PostgreSQL de tempo real conectado.");
    } catch (error) {
        realtimeListenerClient = null;
        console.warn("⚠️ Canal PostgreSQL indisponível:", error.message);
        realtimeListenerRetryTimer = setTimeout(connectRealtimeListener, 2500);
    }
}

async function handleRealtimeStream(req, res) {
    const token = String(req.query.token || extrairBearerToken(req) || "");
    const payload = validarTokenSessao(token);

    if (!payload) {
        return res.status(401).json({
            error: "Sessão inválida para o canal em tempo real.",
            code: "REALTIME_AUTH_REQUIRED"
        });
    }

    let user = await buscarUsuarioPorCpf(payload.cpf);
    user = await reativarBloqueioExpirado(user);
    const accountState = estadoConta(user);

    if (!accountState.ok) {
        return res.status(accountState.status).json({
            error: accountState.message,
            code: accountState.code
        });
    }

    if (user.troca_senha_obrigatoria === true) {
        return res.status(428).json({
            error: "Crie sua senha definitiva antes de acessar o canal online.",
            code: "PASSWORD_CHANGE_REQUIRED"
        });
    }

    if (Number(payload.sv || 1) !== Number(user.session_version || 1)) {
        return res.status(401).json({
            error: "Sessão revogada.",
            code: "SESSION_REVOKED"
        });
    }

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    const client = {
        id: crypto.randomUUID(),
        res,
        userId: user.id,
        type: user.tipo,
        closed: false
    };

    realtimeClients.set(client.id, client);
    res.write("retry: 1500\n\n");

    const lastEventId = Math.max(
        0,
        Number(req.query.lastEventId || req.headers["last-event-id"] || 0) || 0
    );

    try {
        const replay = await pool.query(
            `
            SELECT id, audiencia, usuario_id, tipo_evento, payload, criado_em
            FROM eventos_tempo_real
            WHERE id > $1
              AND (
                    audiencia = 'ALL'
                 OR (audiencia = 'PROFESSIONALS' AND $2 IN ('professional', 'admin'))
                 OR (audiencia = 'ADMINS' AND $2 = 'admin')
                 OR (audiencia = 'USER' AND usuario_id = $3)
              )
            ORDER BY id ASC
            LIMIT 200
            `,
            [lastEventId, user.tipo, user.id]
        );

        for (const row of replay.rows) {
            writeRealtimeEvent(client, {
                id: Number(row.id),
                audience: row.audiencia,
                audienceId: row.usuario_id,
                type: row.tipo_evento,
                payload: row.payload || {},
                sentAt: row.criado_em
            });
        }
    } catch (error) {
        console.warn("⚠️ Replay de eventos indisponível:", error.message);
    }

    writeRealtimeEvent(client, {
        audience: "USER",
        audienceId: user.id,
        type: "connected",
        payload: {
            version: SAFE_LIFE_VERSION,
            userType: user.tipo
        },
        sentAt: new Date().toISOString()
    });

    const heartbeat = setInterval(() => {
        try {
            res.write(`: heartbeat ${Date.now()}\n\n`);
        } catch (_) {
            clearInterval(heartbeat);
        }
    }, 15000);

    req.on("close", () => {
        clearInterval(heartbeat);
        client.closed = true;
        realtimeClients.delete(client.id);
    });
}

app.get("/api/realtime/stream", handleRealtimeStream);
app.get("/api/realtime/professional", handleRealtimeStream);

connectRealtimeListener().catch(() => {});

/* =====================================================
   AUTENTICAÇÃO
===================================================== */

app.post("/api/auth/register", async (req, res) => {
    const client = await pool.connect();
    let transactionStarted = false;

    try {
        const {
            nome,
            cpf,
            email,
            telefone,
            type,
            role,
            foto,
            senha,
            password
        } = req.body || {};

        const nomeLimpo = limparTexto(nome);
        const cpfLimpo = limparCpf(cpf);
        const emailLimpo = limparTexto(email).toLowerCase();
        const telefoneLimpo = limparTexto(telefone);
        const tipoSolicitado = String(type || role || "citizen").toLowerCase();
        const senhaInformada = String(senha || password || "");

        if (tipoSolicitado !== "citizen") {
            return res.status(403).json({
                error:
                    "O cadastro público é exclusivo para cidadãos. " +
                    "Profissionais devem ser cadastrados pelo administrador.",
                code: "PROFESSIONAL_ADMIN_ONLY"
            });
        }

        if (!nomeLimpo) {
            return res.status(400).json({
                error: "Informe o nome completo."
            });
        }

        if (cpfLimpo.length !== 11) {
            return res.status(400).json({
                error: "Informe um CPF com 11 números."
            });
        }

        if (!validarEmail(emailLimpo)) {
            return res.status(400).json({
                error: "Informe um e-mail válido."
            });
        }

        if (!telefoneLimpo) {
            return res.status(400).json({
                error: "Informe o telefone/WhatsApp."
            });
        }

        if (senhaInformada.length < 6) {
            return res.status(400).json({
                error: "A senha precisa ter pelo menos 6 caracteres."
            });
        }

        const duplicado = await client.query(
            `
            SELECT id, cpf, email
            FROM usuarios
            WHERE cpf = $1
               OR LOWER(COALESCE(email, '')) = LOWER($2)
            LIMIT 1
            `,
            [cpfLimpo, emailLimpo]
        );

        if (duplicado.rows.length > 0) {
            const existente = duplicado.rows[0];

            if (existente.cpf === cpfLimpo) {
                return res.status(409).json({
                    error: "Este CPF já está cadastrado."
                });
            }

            return res.status(409).json({
                error: "Este e-mail já está cadastrado."
            });
        }

        const senhaHash = await hashSenhaAsync(senhaInformada);
        let fotoFinal = limparTexto(foto || "");

        if (
            fotoFinal &&
            !fotoFinal.startsWith("data:image/") &&
            !/^https?:\/\//i.test(fotoFinal)
        ) {
            fotoFinal = "";
        }

        if (fotoFinal.length > 1400000) {
            return res.status(413).json({
                error:
                    "A foto de perfil ficou muito grande. " +
                    "Escolha uma imagem menor."
            });
        }

        await client.query("BEGIN");
        transactionStarted = true;

        const usuarioResult = await client.query(
            `
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
                ativo,
                troca_senha_obrigatoria
            )
            VALUES
            ($1,$2,$3,$4,$5,'citizen',NULL,$6,TRUE,FALSE)
            RETURNING *
            `,
            [
                nomeLimpo,
                cpfLimpo,
                senhaHash,
                emailLimpo,
                telefoneLimpo,
                fotoFinal || null
            ]
        );

        await client.query("COMMIT");
        transactionStarted = false;

        const usuarioCompleto =
            (await buscarUsuarioPorCpf(cpfLimpo)) ||
            usuarioResult.rows[0];

        const token = criarTokenSessao(usuarioCompleto);

        publishRealtimeEvent({
            audience: "ADMINS",
            type: "admin_changed",
            payload: {
                action: "USER_REGISTERED",
                userId: usuarioCompleto.id,
                userType: "citizen",
                name: usuarioCompleto.nome
            }
        }).catch(() => {});

        return res.status(201).json({
            message: "Conta de cidadão criada com sucesso.",
            token,
            user: usuarioSeguro(usuarioCompleto)
        });
    } catch (erro) {
        if (transactionStarted) {
            try {
                await client.query("ROLLBACK");
            } catch (_) {}
        }

        console.error("❌ Erro no cadastro público:", erro);

        const conflito = erro.code === "23505";

        return res.status(conflito ? 409 : 500).json({
            error: conflito
                ? "CPF ou e-mail já cadastrado."
                : "Erro ao cadastrar cidadão.",
            details: detalhesErro(erro)
        });
    } finally {
        client.release();
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const {
            cpf,
            role,
            type,
            company,
            senha,
            password
        } = req.body;

        const cpfLimpo = limparCpf(cpf);
        const tipoAcesso = role || type;
        const senhaInformada = String(senha || password || "");

        if (!cpfLimpo || !tipoAcesso) {
            return res.status(400).json({
                error: "CPF e tipo de acesso são obrigatórios."
            });
        }

        if (!["citizen", "professional", "admin"].includes(tipoAcesso)) {
            return res.status(400).json({
                error: "Tipo de acesso inválido."
            });
        }

        if (cpfLimpo === ADMIN_CPF) {
            if (tipoAcesso !== "admin") {
                return res.status(401).json({
                    error: "Selecione o acesso de administrador."
                });
            }

            if (!senhaInformada) {
                return res.status(400).json({
                    error: "A senha do administrador é obrigatória."
                });
            }

            const admin = await garantirAdminNoBanco();

            if (!verificarSenha(senhaInformada, admin.senha_hash)) {
                return res.status(401).json({
                    error: "Senha do administrador incorreta."
                });
            }

            await pool.query(
                `
                UPDATE usuarios
                SET
                    ultimo_login = CURRENT_TIMESTAMP,
                    ultima_atividade_em = CURRENT_TIMESTAMP,
                    online_ate = CURRENT_TIMESTAMP + INTERVAL '45 seconds'
                WHERE cpf = $1
                `,
                [ADMIN_CPF]
            );

            const token = criarTokenSessao(admin, 8);

            return res.status(200).json({
                message: "Administrador autenticado com sucesso!",
                token,
                user: usuarioSeguro(admin)
            });
        }

        let usuario = await buscarUsuarioPorCpf(cpfLimpo);

        if (!usuario || usuario.tipo !== tipoAcesso) {
            return res.status(401).json({
                error: "CPF, senha ou perfil incorreto.",
                code: "INVALID_CREDENTIALS"
            });
        }

        usuario = await reativarBloqueioExpirado(usuario);
        const estado = estadoConta(usuario);

        if (!estado.ok) {
            return res.status(estado.status).json({
                error: estado.message,
                code: estado.code,
                blockedUntil: estado.blockedUntil || null,
                reason: usuario.motivo_bloqueio || null
            });
        }

        if (tipoAcesso === "professional" && company && usuario.empresa !== company) {
            return res.status(401).json({
                error: "Vínculo corporativo divergente para este funcionário."
            });
        }

        if (senhaInformada) {
            if (!verificarSenha(senhaInformada, usuario.senha_hash)) {
                return res.status(401).json({
                    error: "CPF ou senha incorretos."
                });
            }
        } else if (REQUIRE_USER_PASSWORD) {
            return res.status(400).json({
                error: "A senha é obrigatória para entrar."
            });
        }

        await pool.query(
            `
            UPDATE usuarios
            SET
                ultimo_login = CURRENT_TIMESTAMP,
                ultima_atividade_em = CURRENT_TIMESTAMP,
                online_ate = CURRENT_TIMESTAMP + INTERVAL '45 seconds'
            WHERE id = $1
            `,
            [usuario.id]
        );

        const usuarioCompleto = await buscarUsuarioPorCpf(cpfLimpo);
        const token = criarTokenSessao(usuarioCompleto || usuario);

        return res.status(200).json({
            message: "Autenticação bem-sucedida!",
            token,
            user: usuarioSeguro(usuarioCompleto || usuario)
        });
    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao realizar login.",
            details: detalhesErro(erro)
        });
    }
});


app.post(
    "/api/auth/change-temporary-password",
    verificarSessaoUsuario,
    async (req, res) => {
        try {
            const usuario = req.usuarioAutenticado;
            const newPassword = String(req.body?.newPassword || "");
            const confirmation = String(req.body?.confirmation || "");

            if (usuario.tipo !== "professional") {
                return res.status(403).json({
                    error:
                        "Esta troca obrigatória é exclusiva para contas profissionais.",
                    code: "PROFESSIONAL_ONLY"
                });
            }

            if (usuario.troca_senha_obrigatoria !== true) {
                return res.status(409).json({
                    error:
                        "Esta conta não possui uma senha temporária pendente.",
                    code: "PASSWORD_CHANGE_NOT_REQUIRED"
                });
            }

            if (newPassword !== confirmation) {
                return res.status(400).json({
                    error: "As duas senhas não são iguais."
                });
            }

            if (!validarSenhaProfissionalForte(newPassword)) {
                return res.status(400).json({
                    error:
                        "A senha precisa ter pelo menos 8 caracteres, " +
                        "com letra maiúscula, letra minúscula e número."
                });
            }

            if (verificarSenha(newPassword, usuario.senha_hash)) {
                return res.status(400).json({
                    error:
                        "A senha definitiva precisa ser diferente da senha temporária."
                });
            }

            const result = await pool.query(
                `
                UPDATE usuarios
                SET
                    senha_hash = $1,
                    troca_senha_obrigatoria = FALSE,
                    session_version = session_version + 1,
                    atualizado_em = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *
                `,
                [
                    await hashSenhaAsync(newPassword),
                    usuario.id
                ]
            );

            const atualizado =
                (await buscarUsuarioPorCpf(usuario.cpf)) ||
                result.rows[0];

            const token = criarTokenSessao(atualizado);

            await registrarAuditoria({
                usuarioAlvoId: atualizado.id,
                acao: "SENHA_TEMPORARIA_SUBSTITUIDA",
                detalhes: {
                    tipo: atualizado.tipo
                },
                req
            });

            return res.status(200).json({
                message:
                    "Senha definitiva criada. Acesso profissional liberado.",
                token,
                user: usuarioSeguro(atualizado)
            });
        } catch (erro) {
            return res.status(500).json({
                error: "Erro ao substituir a senha temporária.",
                details: detalhesErro(erro)
            });
        }
    }
);

app.get("/api/auth/session-status", async (req, res) => {
    try {
        const payload = validarTokenSessao(extrairBearerToken(req));

        if (!payload) {
            return res.status(401).json({
                error: "Sessão inválida ou expirada.",
                code: "SESSION_INVALID"
            });
        }

        let usuario = await buscarUsuarioPorCpf(payload.cpf);
        usuario = await reativarBloqueioExpirado(usuario);
        const estado = estadoConta(usuario);

        if (!estado.ok) {
            return res.status(estado.status).json({
                error: estado.message,
                code: estado.code,
                blockedUntil: estado.blockedUntil || null,
                reason: usuario?.motivo_bloqueio || null
            });
        }

        if (Number(payload.sv || 1) !== Number(usuario.session_version || 1)) {
            return res.status(401).json({
                error: "Sua sessão foi encerrada pelo administrador.",
                code: "SESSION_REVOKED"
            });
        }

        const presenceResult = await pool.query(
            `
            UPDATE usuarios
            SET
                ultima_atividade_em = CURRENT_TIMESTAMP,
                online_ate = CURRENT_TIMESTAMP + INTERVAL '45 seconds'
            WHERE id = $1
            RETURNING ultima_atividade_em, online_ate
            `,
            [usuario.id]
        );

        if (presenceResult.rows[0]) {
            usuario.ultima_atividade_em =
                presenceResult.rows[0].ultima_atividade_em;
            usuario.online_ate =
                presenceResult.rows[0].online_ate;
            usuario.online_agora = true;
        }

        return res.status(200).json({
            ok: true,
            user: usuarioSeguro(usuario)
        });
    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao verificar a sessão.",
            details: detalhesErro(erro)
        });
    }
});


app.post("/api/auth/offline", async (req, res) => {
    try {
        const payload =
            validarTokenSessao(extrairBearerToken(req));

        if (!payload) {
            return res.status(204).end();
        }

        await pool.query(
            `
            UPDATE usuarios
            SET
                ultima_atividade_em = CURRENT_TIMESTAMP,
                online_ate = CURRENT_TIMESTAMP
            WHERE cpf = $1
            `,
            [limparCpf(payload.cpf)]
        );

        return res.status(204).end();
    } catch (_) {
        return res.status(204).end();
    }
});

/* =====================================================
   USUÁRIOS / PERFIL
===================================================== */

app.get("/api/users", async (req, res) => {
    try {
        await garantirAdminNoBanco();

        const result = await pool.query(
            `
            SELECT *
            FROM usuarios
            WHERE ativo = TRUE
            ORDER BY criado_em DESC
            `
        );

        return res.status(200).json(result.rows.map(usuarioSeguro));
    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao listar usuários.",
            details: erro.message
        });
    }
});

app.get("/api/users/:cpf", async (req, res) => {
    try {
        await garantirAdminNoBanco();

        const usuario = await buscarUsuarioPorCpf(req.params.cpf);

        if (!usuario) {
            return res.status(404).json({
                error: "Usuário não encontrado."
            });
        }

        return res.status(200).json(usuarioSeguro(usuario));
    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao buscar usuário.",
            details: erro.message
        });
    }
});

app.put("/api/users/:cpf", verificarSessaoUsuario, async (req, res) => {
    const client = await pool.connect();

    try {
        await garantirAdminNoBanco();

        const cpfAntigo = limparCpf(req.params.cpf);

        const solicitanteEhAdmin = req.usuarioAutenticado && req.usuarioAutenticado.tipo === "admin";
        const solicitanteEhDono = req.usuarioAutenticado && limparCpf(req.usuarioAutenticado.cpf) === cpfAntigo;
        if (!solicitanteEhAdmin && !solicitanteEhDono) {
            return res.status(403).json({ error: "Você não pode editar esta conta." });
        }

        const {
            nome,
            cpfNovo,
            email,
            telefone,
            foto,
            company,
            profissional
        } = req.body;

        const usuarioAtual = await buscarUsuarioPorCpf(cpfAntigo);

        if (!usuarioAtual) {
            return res.status(404).json({
                error: "Usuário não encontrado."
            });
        }

        let cpfFinal = usuarioAtual.cpf;

        if (cpfAntigo === ADMIN_CPF) {
            cpfFinal = ADMIN_CPF;
        } else if (cpfNovo !== undefined && cpfNovo !== null && String(cpfNovo).trim() !== "") {
            cpfFinal = limparCpf(cpfNovo);

            if (cpfFinal.length !== 11) {
                return res.status(400).json({
                    error: "CPF novo inválido. Digite exatamente 11 números."
                });
            }

            if (cpfFinal === ADMIN_CPF) {
                return res.status(403).json({
                    error: "Este CPF é reservado para o administrador master."
                });
            }

            if (cpfFinal !== usuarioAtual.cpf) {
                const cpfExiste = await buscarUsuarioPorCpf(cpfFinal);

                if (cpfExiste) {
                    return res.status(400).json({
                        error: "Este novo CPF já está em uso por outro usuário."
                    });
                }
            }
        }

        if (email && !validarEmail(email)) {
            return res.status(400).json({
                error: "E-mail inválido."
            });
        }

        await client.query("BEGIN");

        const tipoFinal = cpfAntigo === ADMIN_CPF ? "admin" : usuarioAtual.tipo;

        const empresaFinal =
            cpfAntigo === ADMIN_CPF
                ? "Safe Life Matriz"
                : usuarioAtual.tipo === "professional"
                    ? (company ? limparTexto(company) : usuarioAtual.empresa)
                    : null;

        const usuarioResult = await client.query(
            `
            UPDATE usuarios
            SET
                nome = COALESCE($1, nome),
                cpf = $2,
                email = COALESCE($3, email),
                telefone = COALESCE($4, telefone),
                foto_perfil = COALESCE($5, foto_perfil),
                empresa = $6,
                tipo = $7,
                ativo = CASE
                    WHEN cpf = $8 THEN TRUE
                    ELSE ativo
                END
            WHERE cpf = $9
            RETURNING *
            `,
            [
                nome ? limparTexto(nome) : null,
                cpfFinal,
                email ? limparTexto(email) : null,
                telefone ? limparTexto(telefone) : null,
                foto || null,
                empresaFinal,
                tipoFinal,
                ADMIN_CPF,
                cpfAntigo
            ]
        );

        const usuarioAtualizado = usuarioResult.rows[0];

        if (!usuarioAtualizado) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                error: "Usuário não encontrado para atualização."
            });
        }

        if (usuarioAtualizado.tipo === "professional") {
            const funcionarioExiste = await client.query(
                `
                SELECT *
                FROM funcionarios
                WHERE usuario_id = $1
                LIMIT 1
                `,
                [usuarioAtualizado.id]
            );

            const cargo = profissional?.cargo || "Agente Operacional";
            const especialidade = profissional?.especialidade || "Resgate e triagem animal";
            const regiaoAtendimento = profissional?.regiao || profissional?.regiaoAtendimento || "Região não informada";
            const statusPlantao = profissional?.plantao || profissional?.statusPlantao || "Disponível";
            const veiculo = profissional?.veiculo || "Veículo de apoio";
            const equipe = profissional?.equipe || "Equipe Safe Life";
            const registroProfissional = profissional?.registro || profissional?.registroProfissional || "";
            const bioProfissional = profissional?.observacoes || profissional?.bioProfissional || "";

            if (funcionarioExiste.rows.length > 0) {
                await client.query(
                    `
                    UPDATE funcionarios
                    SET
                        empresa = COALESCE($1, empresa),
                        cargo = COALESCE($2, cargo),
                        especialidade = COALESCE($3, especialidade),
                        regiao_atendimento = COALESCE($4, regiao_atendimento),
                        status_plantao = COALESCE($5, status_plantao),
                        veiculo = COALESCE($6, veiculo),
                        equipe = COALESCE($7, equipe),
                        registro_profissional = COALESCE($8, registro_profissional),
                        bio_profissional = COALESCE($9, bio_profissional)
                    WHERE usuario_id = $10
                    `,
                    [
                        empresaFinal,
                        cargo,
                        especialidade,
                        regiaoAtendimento,
                        statusPlantao,
                        veiculo,
                        equipe,
                        registroProfissional,
                        bioProfissional,
                        usuarioAtualizado.id
                    ]
                );
            } else {
                await client.query(
                    `
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
                    VALUES
                    ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,TRUE)
                    `,
                    [
                        usuarioAtualizado.id,
                        cargo,
                        empresaFinal || "Safe Life Matriz",
                        "operador",
                        registroProfissional,
                        especialidade,
                        regiaoAtendimento,
                        statusPlantao,
                        veiculo,
                        equipe,
                        bioProfissional
                    ]
                );
            }
        }

        await client.query("COMMIT");

        const usuarioCompleto = await buscarUsuarioPorCpf(cpfFinal);
        const usuarioPublico = usuarioSeguro(usuarioCompleto || usuarioAtualizado);

        await publishRealtimeEvent({
            audience: "USER",
            audienceId: usuarioAtualizado.id,
            type: "profile_updated",
            payload: { user: usuarioPublico }
        });
        await publishRealtimeEvent({
            audience: "ADMINS",
            type: "admin_changed",
            payload: { action: "profile_updated", cpf: cpfFinal }
        });

        return res.status(200).json({
            message: "Perfil atualizado com sucesso!",
            user: usuarioPublico
        });

    } catch (erro) {
        await client.query("ROLLBACK");

        return res.status(500).json({
            error: "Erro ao atualizar perfil.",
            details: erro.message
        });
    } finally {
        client.release();
    }
});

app.delete("/api/users/:cpf", verificarAdmin, async (req, res) => {
    try {
        const cpfLimpo = limparCpf(req.params.cpf);

        if (cpfLimpo === ADMIN_CPF) {
            return res.status(403).json({
                error: "A conta master do administrador não pode ser removida."
            });
        }

        const result = await pool.query(
            `
            UPDATE usuarios
            SET ativo = FALSE
            WHERE cpf = $1
            RETURNING *
            `,
            [cpfLimpo]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Usuário não encontrado."
            });
        }

        return res.status(200).json({
            message: "Usuário desativado com sucesso.",
            user: usuarioSeguro(result.rows[0])
        });

    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao desativar usuário.",
            details: erro.message
        });
    }
});

/* =====================================================
   ROTAS ADMINISTRATIVAS
===================================================== */

app.get("/api/admin/users", verificarAdmin, async (req, res) => {
    try {
        await garantirAdminNoBanco();

        const result = await pool.query(
            `
            SELECT
                u.*,
                (
                    u.online_ate IS NOT NULL
                    AND u.online_ate > CURRENT_TIMESTAMP
                ) AS online_agora,
                f.cargo,
                f.nivel_acesso,
                f.registro_profissional,
                f.especialidade,
                f.regiao_atendimento,
                f.status_plantao,
                f.veiculo,
                f.equipe,
                f.bio_profissional
            FROM usuarios u
            LEFT JOIN funcionarios f
            ON f.usuario_id = u.id
            ORDER BY
                CASE
                    WHEN u.cpf = $1 THEN 0
                    WHEN u.ativo = FALSE THEN 1
                    ELSE 2
                END,
                u.criado_em DESC
            `,
            [ADMIN_CPF]
        );

        return res.status(200).json(result.rows.map(usuarioSeguro));
    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao listar usuários administrativos.",
            details: erro.message
        });
    }
});

app.get("/api/admin/users/:cpf", verificarAdmin, async (req, res) => {
    try {
        const usuario = await buscarUsuarioPorCpf(req.params.cpf);

        if (!usuario) {
            return res.status(404).json({
                error: "Usuário não encontrado."
            });
        }

        return res.status(200).json(usuarioSeguro(usuario));
    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao buscar usuário administrativo.",
            details: erro.message
        });
    }
});

app.patch("/api/admin/users/:cpf/status", verificarAdmin, async (req, res) => {
    try {
        const cpfLimpo = limparCpf(req.params.cpf);
        const { ativo } = req.body;

        if (cpfLimpo === ADMIN_CPF) {
            return res.status(403).json({
                error: "A conta master do administrador não pode ser bloqueada."
            });
        }

        if (typeof ativo !== "boolean") {
            return res.status(400).json({
                error: "Informe ativo como true ou false."
            });
        }

        const result = await pool.query(
            `
            UPDATE usuarios
            SET ativo = $1
            WHERE cpf = $2
            RETURNING *
            `,
            [ativo, cpfLimpo]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Usuário não encontrado."
            });
        }

        if (result.rows[0].tipo === "professional") {
            await pool.query(
                `
                UPDATE funcionarios
                SET ativo = $1
                WHERE usuario_id = $2
                `,
                [ativo, result.rows[0].id]
            );
        }

        return res.status(200).json({
            message: ativo ? "Conta reativada com sucesso." : "Conta bloqueada com sucesso.",
            user: usuarioSeguro(result.rows[0])
        });

    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao alterar status da conta.",
            details: erro.message
        });
    }
});

app.delete("/api/admin/users/:cpf", verificarAdmin, async (req, res) => {
    const client = await pool.connect();

    try {
        const cpfLimpo = limparCpf(req.params.cpf);

        if (cpfLimpo === ADMIN_CPF) {
            return res.status(403).json({
                error: "A conta master do administrador não pode ser excluída."
            });
        }

        const usuario = await buscarUsuarioPorCpf(cpfLimpo);

        if (!usuario) {
            return res.status(404).json({
                error: "Usuário não encontrado."
            });
        }

        await client.query("BEGIN");

        await client.query(
            `
            UPDATE usuarios
            SET ativo = FALSE
            WHERE cpf = $1
            `,
            [cpfLimpo]
        );

        if (usuario.tipo === "professional") {
            await client.query(
                `
                UPDATE funcionarios
                SET ativo = FALSE
                WHERE usuario_id = $1
                `,
                [usuario.id]
            );
        }

        await client.query("COMMIT");

        return res.status(200).json({
            message: "Conta excluída/bloqueada com sucesso.",
            user: usuarioSeguro({
                ...usuario,
                ativo: false
            })
        });

    } catch (erro) {
        await client.query("ROLLBACK");

        return res.status(500).json({
            error: "Erro ao excluir conta.",
            details: erro.message
        });
    } finally {
        client.release();
    }
});

app.post("/api/admin/profissionais", verificarAdmin, async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            nome,
            cpf,
            email,
            telefone,
            company,
            foto,
            profissional = {},
            cargo,
            registroProfissional,
            especialidade,
            regiaoAtendimento,
            statusPlantao,
            veiculo,
            equipe,
            bioProfissional
        } = req.body || {};

        const cpfLimpo = limparCpf(cpf);
        const emailLimpo = limparTexto(email).toLowerCase();
        const telefoneLimpo = limparTexto(telefone);

        const dadosProfissionais = {
            cargo:
                profissional.cargo ||
                cargo ||
                "Agente Operacional",
            registro:
                profissional.registro ||
                profissional.registroProfissional ||
                registroProfissional ||
                "",
            especialidade:
                profissional.especialidade ||
                especialidade ||
                "Resgate e triagem animal",
            regiao:
                profissional.regiao ||
                profissional.regiaoAtendimento ||
                regiaoAtendimento ||
                "Região não informada",
            plantao:
                profissional.plantao ||
                profissional.statusPlantao ||
                statusPlantao ||
                "Disponível",
            veiculo:
                profissional.veiculo ||
                veiculo ||
                "Veículo de apoio",
            equipe:
                profissional.equipe ||
                equipe ||
                "Equipe Safe Life",
            bio:
                profissional.observacoes ||
                profissional.bioProfissional ||
                bioProfissional ||
                ""
        };

        if (
            !nome ||
            !cpfLimpo ||
            !emailLimpo ||
            !telefoneLimpo ||
            !company
        ) {
            return res.status(400).json({
                error:
                    "Preencha nome, CPF, e-mail, telefone e empresa."
            });
        }

        if (!dadosProfissionais.registro) {
            return res.status(400).json({
                error:
                    "A identificação funcional ou matrícula da empresa é obrigatória."
            });
        }

        if (cpfLimpo.length !== 11) {
            return res.status(400).json({
                error: "CPF inválido. Digite exatamente 11 números."
            });
        }

        if (cpfLimpo === ADMIN_CPF) {
            return res.status(403).json({
                error: "Este CPF pertence ao administrador master."
            });
        }

        if (!validarEmail(emailLimpo)) {
            return res.status(400).json({
                error: "E-mail inválido."
            });
        }

        const empresaResult = await client.query(
            `
            SELECT id, nome
            FROM empresas
            WHERE LOWER(nome) = LOWER($1)
              AND ativo = TRUE
            LIMIT 1
            `,
            [limparTexto(company)]
        );

        if (empresaResult.rows.length === 0) {
            return res.status(400).json({
                error:
                    "A empresa selecionada não está cadastrada ou está inativa."
            });
        }

        const empresa = empresaResult.rows[0];

        const duplicado = await client.query(
            `
            SELECT
                EXISTS(
                    SELECT 1
                    FROM usuarios
                    WHERE cpf = $1
                       OR LOWER(email) = LOWER($2)
                ) AS usuario_duplicado,
                EXISTS(
                    SELECT 1
                    FROM funcionarios
                    WHERE LOWER(BTRIM(registro_profissional)) =
                          LOWER(BTRIM($3))
                ) AS registro_duplicado
            `,
            [
                cpfLimpo,
                emailLimpo,
                limparTexto(dadosProfissionais.registro)
            ]
        );

        if (duplicado.rows[0].usuario_duplicado) {
            return res.status(409).json({
                error: "CPF ou e-mail já cadastrado."
            });
        }

        if (duplicado.rows[0].registro_duplicado) {
            return res.status(409).json({
                error:
                    "Esta identificação funcional já pertence a outro profissional."
            });
        }

        let fotoFinal = limparTexto(foto || "");

        if (
            fotoFinal &&
            !fotoFinal.startsWith("data:image/") &&
            !/^https?:\/\//i.test(fotoFinal)
        ) {
            fotoFinal = "";
        }

        if (fotoFinal.length > 1400000) {
            return res.status(413).json({
                error:
                    "A foto do profissional ficou muito grande."
            });
        }

        const senhaTemporaria =
            gerarSenhaTemporariaProfissional();

        await client.query("BEGIN");

        const usuarioResult = await client.query(
            `
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
                ativo,
                troca_senha_obrigatoria
            )
            VALUES
            ($1,$2,$3,$4,$5,'professional',$6,$7,TRUE,TRUE)
            RETURNING *
            `,
            [
                limparTexto(nome),
                cpfLimpo,
                await hashSenhaAsync(senhaTemporaria),
                emailLimpo,
                telefoneLimpo,
                empresa.nome,
                fotoFinal || null
            ]
        );

        const usuario = usuarioResult.rows[0];

        await client.query(
            `
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
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,TRUE)
            `,
            [
                usuario.id,
                limparTexto(dadosProfissionais.cargo),
                empresa.nome,
                "operador",
                limparTexto(dadosProfissionais.registro),
                limparTexto(dadosProfissionais.especialidade),
                limparTexto(dadosProfissionais.regiao),
                limparTexto(dadosProfissionais.plantao),
                limparTexto(dadosProfissionais.veiculo),
                limparTexto(dadosProfissionais.equipe),
                limparTexto(dadosProfissionais.bio)
            ]
        );

        await client.query("COMMIT");

        const usuarioCompleto =
            await buscarUsuarioPorCpf(cpfLimpo);

        await registrarAuditoria({
            administradorId: req.admin.id,
            usuarioAlvoId: usuario.id,
            acao: "PROFISSIONAL_CADASTRADO",
            detalhes: {
                empresa: empresa.nome,
                registroProfissional:
                    limparTexto(dadosProfissionais.registro)
            },
            req
        });

        await publishRealtimeEvent({
            audience: "ADMINS",
            type: "admin_changed",
            payload: {
                action: "professional_created",
                userId: usuario.id,
                company: empresa.nome
            }
        });

        return res.status(201).json({
            message:
                "Profissional cadastrado. Entregue a senha temporária e a identificação ao funcionário.",
            senhaTemporaria,
            identificacaoFuncional:
                limparTexto(dadosProfissionais.registro),
            trocaSenhaObrigatoria: true,
            user: usuarioSeguro(usuarioCompleto || usuario)
        });
    } catch (erro) {
        try {
            await client.query("ROLLBACK");
        } catch (_) {}

        const conflito = erro.code === "23505";

        return res.status(conflito ? 409 : 500).json({
            error: conflito
                ? "CPF, e-mail ou identificação funcional já cadastrados."
                : "Erro ao cadastrar profissional pelo administrador.",
            details: detalhesErro(erro)
        });
    } finally {
        client.release();
    }
});

/* =====================================================
   EMPRESAS / BASES / ONGS
===================================================== */

app.get("/api/empresas", async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT *
            FROM empresas
            ORDER BY ativo DESC, nome ASC
            `
        );

        return res.status(200).json(result.rows);

    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao listar empresas.",
            details: erro.message
        });
    }
});

app.post("/api/admin/empresas", verificarAdmin, async (req, res) => {
    try {
        const {
            nome,
            tipo,
            cnpj,
            telefone,
            email,
            endereco
        } = req.body;

        if (!nome) {
            return res.status(400).json({
                error: "Nome da empresa/base é obrigatório."
            });
        }

        if (email && !validarEmail(email)) {
            return res.status(400).json({
                error: "E-mail inválido."
            });
        }

        const result = await pool.query(
            `
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
            ($1,$2,$3,$4,$5,$6,TRUE)
            RETURNING *
            `,
            [
                limparTexto(nome),
                limparTexto(tipo || "Base Safe Life"),
                limparTexto(cnpj || ""),
                limparTexto(telefone || ""),
                limparTexto(email || ""),
                limparTexto(endereco || "")
            ]
        );

        return res.status(201).json({
            message: "Empresa/base cadastrada com sucesso.",
            empresa: result.rows[0]
        });

    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao cadastrar empresa/base.",
            details: erro.message
        });
    }
});

app.patch("/api/admin/empresas/:id/status", verificarAdmin, async (req, res) => {
    try {
        const { ativo } = req.body;

        if (typeof ativo !== "boolean") {
            return res.status(400).json({
                error: "Informe ativo como true ou false."
            });
        }

        const result = await pool.query(
            `
            UPDATE empresas
            SET ativo = $1
            WHERE id = $2
            RETURNING *
            `,
            [ativo, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Empresa/base não encontrada."
            });
        }

        return res.status(200).json({
            message: ativo ? "Empresa ativada com sucesso." : "Empresa desativada com sucesso.",
            empresa: result.rows[0]
        });

    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao alterar status da empresa/base.",
            details: erro.message
        });
    }
});

app.delete("/api/admin/empresas/:id", verificarAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            `
            DELETE FROM empresas
            WHERE id = $1
            RETURNING *
            `,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Empresa/base não encontrada."
            });
        }

        return res.status(200).json({
            message: "Empresa/base excluída com sucesso.",
            empresa: result.rows[0]
        });

    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao excluir empresa/base.",
            details: erro.message
        });
    }
});

async function excluirContaPermanentemente(req, res) {
    const client = await pool.connect();

    try {
        const cpfLimpo = limparCpf(req.params.cpf);
        const confirmacao = String(req.body?.confirmacao || "")
            .trim()
            .toUpperCase();

        if (cpfLimpo === ADMIN_CPF) {
            return res.status(403).json({
                error: "A conta principal do administrador não pode ser excluída."
            });
        }

        if (confirmacao !== "EXCLUIR") {
            return res.status(400).json({
                error: "Confirmação inválida. Digite EXCLUIR para apagar permanentemente."
            });
        }

        await client.query("BEGIN");

        const usuarioResult = await client.query(
            `
            SELECT id, nome, cpf, email, tipo
            FROM usuarios
            WHERE cpf = $1
            FOR UPDATE
            `,
            [cpfLimpo]
        );

        if (usuarioResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                error: "Conta não encontrada ou já excluída permanentemente."
            });
        }

        const usuario = usuarioResult.rows[0];

        /*
         * resgates_pets usa ON DELETE RESTRICT para o funcionário.
         * Como a exclusão é permanente, os registros dependentes do
         * profissional também são removidos antes da conta.
         */
        const funcionarios = await client.query(
            `
            SELECT id
            FROM funcionarios
            WHERE usuario_id = $1
            `,
            [usuario.id]
        );

        const funcionarioIds = funcionarios.rows.map((row) => Number(row.id));

        if (funcionarioIds.length > 0) {
            await client.query(
                `
                DELETE FROM resgates_pets
                WHERE funcionario_id = ANY($1::int[])
                `,
                [funcionarioIds]
            );
        }

        const deleteResult = await client.query(
            `
            DELETE FROM usuarios
            WHERE id = $1
            RETURNING id
            `,
            [usuario.id]
        );

        if (deleteResult.rows.length === 0) {
            throw new Error("A conta não pôde ser removida.");
        }

        await client.query("COMMIT");

        /*
         * A sessão conectada recebe o aviso mesmo após o registro ter
         * sido removido. Nas próximas validações o login deixa de existir.
         */
        deliverRealtimeEvent({
            id: Date.now(),
            audience: "USER",
            audienceId: usuario.id,
            type: "account_status",
            payload: {
                code: "ACCOUNT_PERMANENTLY_DELETED",
                message: "Sua conta foi excluída permanentemente pelo administrador."
            },
            sentAt: new Date().toISOString()
        });

        await registrarAuditoria({
            administradorId: req.admin.id,
            usuarioAlvoId: null,
            acao: "CONTA_EXCLUIDA_PERMANENTEMENTE",
            detalhes: {
                usuarioId: usuario.id,
                nome: usuario.nome,
                cpf: usuario.cpf,
                email: usuario.email,
                tipo: usuario.tipo
            },
            req
        });

        await publishRealtimeEvent({
            audience: "ADMINS",
            type: "admin_changed",
            payload: {
                action: "account_permanently_deleted",
                cpf: usuario.cpf
            }
        });

        return res.status(200).json({
            message: "Conta excluída permanentemente do banco. Não é possível reativá-la.",
            cpf: usuario.cpf
        });
    } catch (erro) {
        try {
            await client.query("ROLLBACK");
        } catch (_) {}

        return res.status(500).json({
            error: "Erro ao excluir permanentemente a conta.",
            details: detalhesErro(erro)
        });
    } finally {
        client.release();
    }
}

app.delete(
    "/api/admin/users/:cpf/permanent",
    verificarAdmin,
    excluirContaPermanentemente
);

app.delete(
    "/api/admin/accounts/:cpf/permanent",
    verificarAdmin,
    excluirContaPermanentemente
);

/* =====================================================
   PETS
===================================================== */

app.get("/api/pets", async (req, res) => {
    try {
        const { donoCpf } = req.query;

        if (donoCpf) {
            const cpfLimpo = limparCpf(donoCpf);

            const result = await pool.query(
                `
                SELECT
                    p.*,
                    u.cpf AS dono_cpf,
                    u.nome AS dono_nome
                FROM pets p
                INNER JOIN usuarios u
                ON u.id = p.usuario_id
                WHERE u.cpf = $1
                AND p.ativo = TRUE
                ORDER BY p.criado_em DESC
                `,
                [cpfLimpo]
            );

            return res.status(200).json(result.rows);
        }

        const result = await pool.query(
            `
            SELECT
                p.*,
                u.nome AS dono_nome,
                u.cpf AS dono_cpf
            FROM pets p
            INNER JOIN usuarios u
            ON u.id = p.usuario_id
            WHERE p.ativo = TRUE
            ORDER BY p.criado_em DESC
            `
        );

        return res.status(200).json(result.rows);

    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao listar pets.",
            details: erro.message
        });
    }
});


app.get("/api/pets/desaparecidos", async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                p.*,
                u.nome AS dono_nome,
                u.cpf AS dono_cpf,
                u.email AS dono_email,
                u.telefone AS dono_telefone
            FROM pets p
            INNER JOIN usuarios u
            ON u.id = p.usuario_id
            WHERE p.ativo = TRUE
            AND p.desaparecido = TRUE
            ORDER BY p.desaparecido_em DESC NULLS LAST, p.criado_em DESC
            `
        );

        return res.status(200).json(result.rows);
    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao listar pets desaparecidos.",
            details: erro.message
        });
    }
});

app.get("/api/pets/:id", async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                p.*,
                u.nome AS dono_nome,
                u.cpf AS dono_cpf
            FROM pets p
            INNER JOIN usuarios u
            ON u.id = p.usuario_id
            WHERE p.id = $1
            LIMIT 1
            `,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Pet não encontrado."
            });
        }

        return res.status(200).json(result.rows[0]);

    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao buscar pet.",
            details: erro.message
        });
    }
});

app.post("/api/pets", async (req, res) => {
    try {
        const {
            donoCpf,
            nome,
            idade,
            especie,
            raca,
            sexo,
            cor,
            peso,
            local,
            observacoes,
            foto,
            desaparecido,
            statusPet,
            localDesaparecimento,
            detalhesDesaparecimento
        } = req.body;

        if (!nome) {
            return res.status(400).json({
                error: "Nome do animal é obrigatório."
            });
        }

        const usuario = await buscarUsuarioPorCpf(donoCpf);

        if (!usuario) {
            return res.status(404).json({
                error: "Usuário dono do pet não encontrado."
            });
        }

        if (usuario.ativo === false) {
            return res.status(403).json({
                error: "Esta conta está bloqueada e não pode cadastrar pets."
            });
        }

        const fotoPadrao = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=150&q=80";

        const result = await pool.query(
            `
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
                desaparecido,
                status_pet,
                local_desaparecimento,
                detalhes_desaparecimento,
                desaparecido_em
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
            RETURNING *
            `,
            [
                usuario.id,
                limparTexto(nome),
                Number(idade) || 0,
                especie ? limparTexto(especie) : "Animal",
                raca ? limparTexto(raca) : null,
                sexo || "NAO_INFORMADO",
                cor ? limparTexto(cor) : null,
                peso || null,
                local ? limparTexto(local) : "Não informado",
                observacoes ? limparTexto(observacoes) : null,
                foto || fotoPadrao,
                Boolean(desaparecido) || statusPet === "DESAPARECIDO",
                Boolean(desaparecido) || statusPet === "DESAPARECIDO" ? "DESAPARECIDO" : "CADASTRADO",
                localDesaparecimento ? limparTexto(localDesaparecimento) : null,
                detalhesDesaparecimento ? limparTexto(detalhesDesaparecimento) : null,
                Boolean(desaparecido) || statusPet === "DESAPARECIDO" ? new Date() : null
            ]
        );

        if (
            result.rows[0].desaparecido === true ||
            String(result.rows[0].status_pet || "").toUpperCase() === "DESAPARECIDO"
        ) {
            broadcastProfessionalEvent("new_missing_pet", {
                id: result.rows[0].id,
                name: result.rows[0].nome
            });
        }

        return res.status(201).json({
            message: "Pet cadastrado com sucesso!",
            pet: result.rows[0]
        });

    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao cadastrar pet.",
            details: erro.message
        });
    }
});

app.put("/api/pets/:id", async (req, res) => {
    try {
        const {
            nome,
            idade,
            especie,
            raca,
            sexo,
            cor,
            peso,
            local,
            observacoes,
            foto,
            desaparecido,
            statusPet,
            localDesaparecimento,
            detalhesDesaparecimento,
            ativo
        } = req.body;

        const result = await pool.query(
            `
            UPDATE pets
            SET
                nome = COALESCE($1, nome),
                idade = COALESCE($2, idade),
                especie = COALESCE($3, especie),
                raca = COALESCE($4, raca),
                sexo = COALESCE($5, sexo),
                cor = COALESCE($6, cor),
                peso = COALESCE($7, peso),
                localizacao = COALESCE($8, localizacao),
                observacoes = COALESCE($9, observacoes),
                foto = COALESCE($10, foto),
                desaparecido = COALESCE($11, desaparecido),
                status_pet = COALESCE($12, status_pet),
                local_desaparecimento = COALESCE($13, local_desaparecimento),
                detalhes_desaparecimento = COALESCE($14, detalhes_desaparecimento),
                desaparecido_em = CASE
                    WHEN $11 = TRUE THEN COALESCE(desaparecido_em, CURRENT_TIMESTAMP)
                    ELSE desaparecido_em
                END,
                encontrado_em = CASE
                    WHEN $11 = FALSE THEN CURRENT_TIMESTAMP
                    ELSE encontrado_em
                END,
                ativo = COALESCE($15, ativo)
            WHERE id = $16
            RETURNING *
            `,
            [
                nome ? limparTexto(nome) : null,
                idade !== undefined ? Number(idade) : null,
                especie ? limparTexto(especie) : null,
                raca ? limparTexto(raca) : null,
                sexo || null,
                cor ? limparTexto(cor) : null,
                peso || null,
                local ? limparTexto(local) : null,
                observacoes ? limparTexto(observacoes) : null,
                foto || null,
                typeof desaparecido === "boolean" ? desaparecido : null,
                typeof desaparecido === "boolean" ? (desaparecido ? "DESAPARECIDO" : "CADASTRADO") : (statusPet || null),
                localDesaparecimento ? limparTexto(localDesaparecimento) : null,
                detalhesDesaparecimento ? limparTexto(detalhesDesaparecimento) : null,
                typeof ativo === "boolean" ? ativo : null,
                req.params.id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Pet não encontrado."
            });
        }

        return res.status(200).json({
            message: "Pet atualizado com sucesso.",
            pet: result.rows[0]
        });

    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao atualizar pet.",
            details: erro.message
        });
    }
});


app.patch("/api/pets/:id/desaparecido", async (req, res) => {
    try {
        const {
            desaparecido,
            localDesaparecimento,
            detalhesDesaparecimento
        } = req.body;

        if (typeof desaparecido !== "boolean") {
            return res.status(400).json({
                error: "Informe desaparecido como true ou false."
            });
        }

        const result = await pool.query(
            `
            UPDATE pets
            SET
                desaparecido = $1,
                status_pet = CASE WHEN $1 = TRUE THEN 'DESAPARECIDO' ELSE 'CADASTRADO' END,
                local_desaparecimento = COALESCE($2, local_desaparecimento),
                detalhes_desaparecimento = COALESCE($3, detalhes_desaparecimento),
                desaparecido_em = CASE
                    WHEN $1 = TRUE THEN COALESCE(desaparecido_em, CURRENT_TIMESTAMP)
                    ELSE desaparecido_em
                END,
                encontrado_em = CASE
                    WHEN $1 = FALSE THEN CURRENT_TIMESTAMP
                    ELSE encontrado_em
                END
            WHERE id = $4
            RETURNING *
            `,
            [
                desaparecido,
                localDesaparecimento ? limparTexto(localDesaparecimento) : null,
                detalhesDesaparecimento ? limparTexto(detalhesDesaparecimento) : null,
                req.params.id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Pet não encontrado."
            });
        }

        return res.status(200).json({
            message: desaparecido ? "Pet marcado como desaparecido." : "Pet marcado como encontrado.",
            pet: result.rows[0]
        });
    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao atualizar desaparecimento do pet.",
            details: erro.message
        });
    }
});

app.delete("/api/pets/:id", async (req, res) => {
    try {
        const result = await pool.query(
            `
            UPDATE pets
            SET ativo = FALSE
            WHERE id = $1
            RETURNING *
            `,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Pet não encontrado."
            });
        }

        return res.status(200).json({
            message: "Pet removido com sucesso.",
            pet: result.rows[0]
        });

    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao remover pet.",
            details: erro.message
        });
    }
});/* =====================================================
   OCORRÊNCIAS IDENTIFICADAS
===================================================== */

app.post("/api/ocorrencias", async (req, res) => {
    try {
        const {
            usuarioCpf,
            tipo,
            categoria,
            assunto,
            opcaoEscolhida,
            localizacao,
            detalhes,
            foto,
            gps,
            prioridade
        } = req.body;

        if (!assunto && !opcaoEscolhida) {
            return res.status(400).json({
                error: "Escolha uma opção do problema."
            });
        }

        if (!localizacao || !detalhes) {
            return res.status(400).json({
                error: "Localização e descrição são obrigatórias."
            });
        }

        const midiaValidada = validarMidiaObrigatoria(foto);

        if (!midiaValidada.ok) {
            return res.status(400).json({
                error: midiaValidada.error,
                code: "EVIDENCE_REQUIRED"
            });
        }

        let usuario = null;

        if (usuarioCpf) {
            usuario = await buscarUsuarioPorCpf(usuarioCpf);
        }

        if (usuario && usuario.ativo === false) {
            return res.status(403).json({
                error: "Esta conta está bloqueada e não pode abrir chamados."
            });
        }

        const gpsLimpo = montarGps(gps);

        const result = await pool.query(
            `
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
                prioridade,
                anonima
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,FALSE)
            RETURNING *
            `,
            [
                usuario ? usuario.id : null,
                tipo || "Chamado Geral",
                categoria || "geral",
                limparTexto(assunto || opcaoEscolhida),
                limparTexto(opcaoEscolhida || assunto),
                limparTexto(localizacao),
                limparTexto(detalhes),
                midiaValidada.media,
                gpsLimpo.latitude,
                gpsLimpo.longitude,
                gpsLimpo.enderecoCompleto || localizacao,
                gpsLimpo.bairro,
                gpsLimpo.cidade,
                gpsLimpo.estado,
                prioridade || "NORMAL"
            ]
        );

        broadcastProfessionalEvent("new_occurrence", {
            origin: "ocorrencia",
            id: result.rows[0].id,
            priority: result.rows[0].prioridade,
            category: result.rows[0].categoria,
            mediaType: midiaValidada.kind
        });

        return res.status(201).json({
            message: "Chamado enviado com sucesso.",
            data: result.rows[0]
        });

    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao registrar chamado.",
            details: erro.message
        });
    }
});

app.get("/api/ocorrencias", async (req, res) => {
    try {
        const { status, categoria, usuarioCpf } = req.query;

        const params = [];
        const filtros = [];

        if (status) {
            params.push(status);
            filtros.push(`status = $${params.length}`);
        }

        if (categoria) {
            params.push(categoria);
            filtros.push(`categoria = $${params.length}`);
        }

        if (usuarioCpf) {
            params.push(limparCpf(usuarioCpf));
            filtros.push(`cpf_usuario = $${params.length}`);
        }

        const where = filtros.length > 0
            ? `WHERE ${filtros.join(" AND ")}`
            : "";

        const result = await pool.query(
            `
            SELECT *
            FROM view_ocorrencias_completas
            ${where}
            ORDER BY criado_em DESC
            `,
            params
        );

        return res.status(200).json(result.rows);

    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao listar ocorrências.",
            details: erro.message
        });
    }
});

app.get("/api/ocorrencias/:id", async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT *
            FROM view_ocorrencias_completas
            WHERE id = $1
            LIMIT 1
            `,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Ocorrência não encontrada."
            });
        }

        return res.status(200).json(result.rows[0]);

    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao buscar ocorrência.",
            details: erro.message
        });
    }
});

/* =====================================================
   DENÚNCIA ANÔNIMA
===================================================== */

app.post("/api/ocorrencias/anonima", async (req, res) => {
    try {
        const {
            tipo,
            categoria,
            assunto,
            opcaoEscolhida,
            localizacao,
            detalhes,
            foto,
            gps,
            prioridade
        } = req.body;

        if (!assunto && !opcaoEscolhida) {
            return res.status(400).json({
                error: "Escolha uma opção da denúncia."
            });
        }

        if (!localizacao || !detalhes) {
            return res.status(400).json({
                error: "Localização e descrição são obrigatórias."
            });
        }

        const midiaValidada = validarMidiaObrigatoria(foto);

        if (!midiaValidada.ok) {
            return res.status(400).json({
                error: midiaValidada.error,
                code: "EVIDENCE_REQUIRED"
            });
        }

        const gpsLimpo = montarGps(gps);

        const result = await pool.query(
            `
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
                prioridade
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
            RETURNING *
            `,
            [
                tipo || "Denúncia Anônima",
                categoria || "anonymous",
                limparTexto(assunto || opcaoEscolhida),
                limparTexto(opcaoEscolhida || assunto),
                limparTexto(localizacao),
                limparTexto(detalhes),
                midiaValidada.media,
                gpsLimpo.latitude,
                gpsLimpo.longitude,
                gpsLimpo.enderecoCompleto || localizacao,
                gpsLimpo.bairro,
                gpsLimpo.cidade,
                gpsLimpo.estado,
                prioridade || "NORMAL"
            ]
        );

        broadcastProfessionalEvent("new_occurrence", {
            origin: "anonima",
            id: result.rows[0].id,
            priority: result.rows[0].prioridade,
            category: result.rows[0].categoria,
            mediaType: midiaValidada.kind
        });

        return res.status(201).json({
            message: "Denúncia anônima enviada com sucesso.",
            data: result.rows[0]
        });

    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao registrar denúncia anônima.",
            details: erro.message
        });
    }
});

app.get("/api/denuncias-anonimas", async (req, res) => {
    try {
        const { status, categoria } = req.query;

        const params = [];
        const filtros = [];

        if (status) {
            params.push(status);
            filtros.push(`status = $${params.length}`);
        }

        if (categoria) {
            params.push(categoria);
            filtros.push(`categoria = $${params.length}`);
        }

        const where = filtros.length > 0
            ? `WHERE ${filtros.join(" AND ")}`
            : "";

        const result = await pool.query(
            `
            SELECT *
            FROM denuncias_anonimas
            ${where}
            ORDER BY criado_em DESC
            `,
            params
        );

        return res.status(200).json(result.rows);

    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao listar denúncias anônimas.",
            details: erro.message
        });
    }
});


/* =====================================================
   NOTIFICAÇÕES REAIS DO CIDADÃO
   Derivadas do status salvo no PostgreSQL.
===================================================== */

app.get("/api/users/:cpf/notifications", async (req, res) => {
    try {
        const cpfLimpo = limparCpf(req.params.cpf);

        if (cpfLimpo.length !== 11) {
            return res.status(400).json({
                error: "CPF inválido."
            });
        }

        const result = await pool.query(
            `
            SELECT
                o.id,
                o.tipo,
                o.categoria,
                o.assunto,
                o.opcao_escolhida,
                o.localizacao,
                o.detalhes,
                o.status,
                o.prioridade,
                o.criado_em,
                o.atualizado_em,
                o.concluido_em,
                uf.nome AS nome_profissional,
                f.empresa AS empresa_profissional
            FROM ocorrencias o
            INNER JOIN usuarios u
                ON u.id = o.usuario_id
            LEFT JOIN funcionarios f
                ON f.id = o.atendente_id
            LEFT JOIN usuarios uf
                ON uf.id = f.usuario_id
            WHERE u.cpf = $1
              AND o.status IN ('EM_ATENDIMENTO', 'CONCLUIDA', 'CANCELADA')
            ORDER BY
                COALESCE(o.concluido_em, o.atualizado_em, o.criado_em) DESC,
                o.id DESC
            LIMIT 50
            `,
            [cpfLimpo]
        );

        const notifications = result.rows.map((item) => {
            const tituloOcorrencia =
                item.opcao_escolhida ||
                item.assunto ||
                item.tipo ||
                "Ocorrência";

            const profissional =
                item.nome_profissional ||
                "Equipe Safe Life";

            let title = "Atualização da ocorrência";
            let message = `Sua ocorrência "${tituloOcorrencia}" recebeu uma atualização.`;

            if (item.status === "EM_ATENDIMENTO") {
                title = "Profissional em atendimento";
                message = `${profissional} iniciou o atendimento da ocorrência "${tituloOcorrencia}".`;
            }

            if (item.status === "CONCLUIDA") {
                title = "Ocorrência concluída";
                message = `${profissional} concluiu o atendimento da ocorrência "${tituloOcorrencia}".`;
            }

            if (item.status === "CANCELADA") {
                title = "Ocorrência cancelada";
                message = `A ocorrência "${tituloOcorrencia}" foi cancelada.`;
            }

            return {
                id: `${item.id}-${item.status}`,
                occurrenceId: item.id,
                status: item.status,
                title,
                message,
                occurrenceTitle: tituloOcorrencia,
                professionalName: profissional,
                professionalCompany: item.empresa_profissional || null,
                createdAt:
                    item.concluido_em ||
                    item.atualizado_em ||
                    item.criado_em
            };
        });

        return res.status(200).json(notifications);
    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao carregar notificações do cidadão.",
            details: erro.message
        });
    }
});

/* =====================================================
   PAINEL PROFISSIONAL
===================================================== */

app.get("/api/pro/ocorrencias", async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT *
            FROM
            (
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
                FROM denuncias_anonimas
            ) chamados
            WHERE status <> 'CONCLUIDA'
              AND status <> 'CANCELADA'
              AND NOT (
                    (LOWER(COALESCE(assunto, '')) = 'animal na rua'
                     AND LOWER(COALESCE(localizacao, '')) LIKE 'rua das flores%')
                 OR (LOWER(COALESCE(assunto, '')) = 'animal ferido'
                     AND LOWER(COALESCE(localizacao, '')) LIKE 'avenida principal%')
                 OR (LOWER(COALESCE(assunto, '')) = 'sem água e comida'
                     AND LOWER(COALESCE(localizacao, '')) LIKE 'rua esperança%')
                 OR (LOWER(COALESCE(assunto, '')) = 'animal acorrentado'
                     AND LOWER(COALESCE(localizacao, '')) LIKE 'travessa das palmeiras%')
                 OR COALESCE(foto, '') LIKE '%photo-1558788353-f76d92427f16%'
                 OR COALESCE(foto, '') LIKE '%photo-1574158622682-e40e69881006%'
                 OR COALESCE(foto, '') LIKE '%photo-1583512603805-3cc6b41f3edb%'
                 OR COALESCE(foto, '') LIKE '%photo-1596492784531-6e6eb5ea9993%'
              )
            ORDER BY criado_em DESC
            `
        );

        return res.status(200).json(result.rows);

    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao listar chamados para profissional.",
            details: erro.message
        });
    }
});

/* =====================================================
   STATUS / DESPACHO
===================================================== */

app.patch("/api/chamados/:origem/:id/status", async (req, res) => {
    const client = await pool.connect();

    try {
        const origem = String(req.params.origem || "").toLowerCase();
        const id = Number(req.params.id);
        const status = String(req.body.status || "").toUpperCase();
        const funcionarioCpf = limparCpf(req.body.funcionarioCpf);
        const observacao = limparTexto(req.body.observacao || "");

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "ID do chamado inválido." });
        }

        if (!["PENDENTE", "EM_ATENDIMENTO", "CONCLUIDA", "CANCELADA"].includes(status)) {
            return res.status(400).json({ error: "Status inválido." });
        }

        let funcionario = null;

        if (funcionarioCpf) {
            const funcionarioResult = await client.query(
                `
                SELECT f.id, f.empresa, u.nome, u.cpf
                FROM funcionarios f
                INNER JOIN usuarios u ON u.id = f.usuario_id
                WHERE u.cpf = $1
                  AND u.ativo = TRUE
                  AND u.excluida_em IS NULL
                  AND f.ativo = TRUE
                LIMIT 1
                `,
                [funcionarioCpf]
            );
            funcionario = funcionarioResult.rows[0] || null;
        }

        await client.query("BEGIN");

        if (origem === "ocorrencia") {
            const anteriorResult = await client.query(
                `
                SELECT o.*
                FROM ocorrencias o
                WHERE o.id = $1
                FOR UPDATE OF o
                `,
                [id]
            );

            if (anteriorResult.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({ error: "Ocorrência não encontrada." });
            }

            const anterior = anteriorResult.rows[0];

            const atualizadoResult = await client.query(
                `
                UPDATE ocorrencias
                SET
                    status = $1::status_ocorrencia_enum,
                    atendente_id = COALESCE($2::INTEGER, atendente_id),
                    concluido_em = CASE
                        WHEN $1::status_ocorrencia_enum = 'CONCLUIDA'::status_ocorrencia_enum
                            THEN CURRENT_TIMESTAMP
                        WHEN $1::status_ocorrencia_enum = 'PENDENTE'::status_ocorrencia_enum
                            THEN NULL
                        ELSE concluido_em
                    END,
                    atualizado_em = CURRENT_TIMESTAMP
                WHERE id = $3::INTEGER
                RETURNING *
                `,
                [status, funcionario?.id || null, id]
            );

            try {
                await client.query(
                    `
                    INSERT INTO historico_ocorrencias
                    (ocorrencia_id, funcionario_id, status_anterior, status_novo, acao, observacao)
                    VALUES
                    ($1::INTEGER,$2::INTEGER,$3::status_ocorrencia_enum,$4::status_ocorrencia_enum,$5,$6)
                    `,
                    [
                        id,
                        funcionario?.id || null,
                        anterior.status,
                        status,
                        "Alteração de status",
                        observacao || null
                    ]
                );
            } catch (historicoErro) {
                console.warn("⚠️ Histórico não gravado:", historicoErro.message);
            }

            if (anterior.usuario_id && ["EM_ATENDIMENTO", "CONCLUIDA", "CANCELADA"].includes(status)) {
                const tituloChamado = anterior.opcao_escolhida || anterior.assunto || anterior.tipo || "Ocorrência";
                const profissionalNome = funcionario?.nome || "Equipe Safe Life";
                let titulo = "Ocorrência atualizada";
                let mensagem = `A ocorrência “${tituloChamado}” recebeu uma atualização.`;

                if (status === "EM_ATENDIMENTO") {
                    titulo = "Atendimento iniciado";
                    mensagem = `${profissionalNome} iniciou o atendimento da ocorrência “${tituloChamado}”.`;
                } else if (status === "CONCLUIDA") {
                    titulo = "Atendimento concluído";
                    mensagem = `${profissionalNome} concluiu a ocorrência “${tituloChamado}”.`;
                } else if (status === "CANCELADA") {
                    titulo = "Ocorrência cancelada";
                    mensagem = `A ocorrência “${tituloChamado}” foi cancelada.`;
                }

                await inserirNotificacao(client, {
                    usuarioId: anterior.usuario_id,
                    tipo: `OCORRENCIA_${status}`,
                    titulo,
                    mensagem,
                    foto: anterior.foto || null,
                    dados: {
                        ocorrenciaId: id,
                        status,
                        profissional: profissionalNome,
                        empresa: funcionario?.empresa || null
                    }
                });
            }

            await client.query("COMMIT");

            broadcastProfessionalEvent("queue_changed", {
                origin: "ocorrencia",
                id,
                status
            });

            return res.status(200).json({
                message: status === "CONCLUIDA"
                    ? "Ocorrência concluída com sucesso."
                    : "Status da ocorrência atualizado.",
                data: atualizadoResult.rows[0]
            });
        }

        if (origem === "anonima") {
            const atualizadoResult = await client.query(
                `
                UPDATE denuncias_anonimas
                SET
                    status = $1::status_ocorrencia_enum,
                    concluido_em = CASE
                        WHEN $1::status_ocorrencia_enum = 'CONCLUIDA'::status_ocorrencia_enum
                            THEN CURRENT_TIMESTAMP
                        WHEN $1::status_ocorrencia_enum = 'PENDENTE'::status_ocorrencia_enum
                            THEN NULL
                        ELSE concluido_em
                    END,
                    atualizado_em = CURRENT_TIMESTAMP
                WHERE id = $2::INTEGER
                RETURNING *
                `,
                [status, id]
            );

            if (atualizadoResult.rows.length === 0) {
                await client.query("ROLLBACK");
                return res.status(404).json({ error: "Denúncia anônima não encontrada." });
            }

            await client.query("COMMIT");

            broadcastProfessionalEvent("queue_changed", {
                origin: "anonima",
                id,
                status
            });

            return res.status(200).json({
                message: status === "CONCLUIDA"
                    ? "Denúncia anônima concluída com sucesso."
                    : "Status da denúncia atualizado.",
                data: atualizadoResult.rows[0]
            });
        }

        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Origem inválida." });
    } catch (erro) {
        try { await client.query("ROLLBACK"); } catch (_) {}
        console.error("❌ Erro ao atualizar chamado:", erro);
        return res.status(500).json({
            error: "Erro ao atualizar status.",
            details: erro.message
        });
    } finally {
        client.release();
    }
});

app.delete("/api/chamados/:origem/:id", async (req, res) => {
    try {
        const { origem, id } = req.params;

        let result;

        if (origem === "ocorrencia") {
            result = await pool.query(
                `
                DELETE FROM ocorrencias
                WHERE id = $1
                RETURNING *
                `,
                [id]
            );
        } else if (origem === "anonima") {
            result = await pool.query(
                `
                DELETE FROM denuncias_anonimas
                WHERE id = $1
                RETURNING *
                `,
                [id]
            );
        } else {
            return res.status(400).json({
                error: "Origem inválida. Use ocorrencia ou anonima."
            });
        }

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Chamado não encontrado."
            });
        }

        return res.status(200).json({
            message: "Chamado removido com sucesso."
        });

    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao remover chamado.",
            details: erro.message
        });
    }
});


/* =====================================================
   SAFE LIFE V19 — PETS, NOTIFICAÇÕES E ADMINISTRAÇÃO
===================================================== */

app.get("/api/pro/pets/cadastrados", async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                p.*,
                u.nome AS nome_dono,
                u.cpf AS cpf_dono,
                u.telefone AS telefone_dono,
                u.foto_perfil AS foto_dono
            FROM pets p
            INNER JOIN usuarios u ON u.id = p.usuario_id
            WHERE p.ativo = TRUE
              AND p.desaparecido = FALSE
              AND p.status_pet = 'CADASTRADO'
              AND u.excluida_em IS NULL
            ORDER BY p.criado_em DESC
            `
        );
        return res.status(200).json(result.rows);
    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao listar pets cadastrados.",
            details: erro.message
        });
    }
});

app.get("/api/pro/pets/desaparecidos", async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                p.*,
                u.nome AS nome_dono,
                u.cpf AS cpf_dono,
                u.telefone AS telefone_dono,
                u.email AS email_dono,
                u.foto_perfil AS foto_dono
            FROM pets p
            INNER JOIN usuarios u ON u.id = p.usuario_id
            WHERE p.ativo = TRUE
              AND p.desaparecido = TRUE
              AND p.status_pet = 'DESAPARECIDO'
              AND u.excluida_em IS NULL
            ORDER BY p.desaparecido_em DESC NULLS LAST, p.criado_em DESC
            `
        );
        return res.status(200).json(result.rows);
    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao listar pets desaparecidos.",
            details: erro.message
        });
    }
});

app.post("/api/pro/pets/:id/concluir-resgate", async (req, res) => {
    const client = await pool.connect();

    try {
        const petId = Number(req.params.id);
        const funcionarioCpf = limparCpf(req.body.funcionarioCpf);
        const fotoEncontrado = limparTexto(req.body.fotoEncontrado);
        const destinoTipo = limparTexto(req.body.destinoTipo).toUpperCase();
        const destinoNome = limparTexto(req.body.destinoNome || "");
        const destinoEndereco = limparTexto(req.body.destinoEndereco);
        const instrucoesRetirada = limparTexto(req.body.instrucoesRetirada);

        if (!Number.isInteger(petId) || petId <= 0) {
            return res.status(400).json({ error: "Pet inválido." });
        }

        if (!fotoEncontrado || !fotoEncontrado.startsWith("data:image/")) {
            return res.status(400).json({
                error: "É obrigatório enviar uma foto atual do pet encontrado."
            });
        }

        if (!["PROFISSIONAL", "INSTITUICAO"].includes(destinoTipo)) {
            return res.status(400).json({ error: "Escolha onde o pet ficará." });
        }

        if (!destinoEndereco || !instrucoesRetirada) {
            return res.status(400).json({
                error: "Informe o endereço e as instruções para retirada."
            });
        }

        if (destinoTipo === "INSTITUICAO" && !destinoNome) {
            return res.status(400).json({
                error: "Informe o nome da instituição."
            });
        }

        const funcionarioResult = await client.query(
            `
            SELECT f.id, f.empresa, u.nome, u.cpf
            FROM funcionarios f
            INNER JOIN usuarios u ON u.id = f.usuario_id
            WHERE u.cpf = $1
              AND u.ativo = TRUE
              AND u.excluida_em IS NULL
              AND f.ativo = TRUE
            LIMIT 1
            `,
            [funcionarioCpf]
        );

        if (funcionarioResult.rows.length === 0) {
            return res.status(403).json({
                error: "Profissional não encontrado ou sem permissão."
            });
        }

        const funcionario = funcionarioResult.rows[0];
        await client.query("BEGIN");

        const petResult = await client.query(
            `
            SELECT p.*
            FROM pets p
            WHERE p.id = $1
              AND p.ativo = TRUE
            FOR UPDATE OF p
            `,
            [petId]
        );

        if (petResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({ error: "Pet não encontrado." });
        }

        const pet = petResult.rows[0];

        if (!pet.desaparecido || pet.status_pet !== "DESAPARECIDO") {
            await client.query("ROLLBACK");
            return res.status(409).json({
                error: "Este pet não está mais marcado como desaparecido."
            });
        }

        const resgateResult = await client.query(
            `
            INSERT INTO resgates_pets
            (
                pet_id,
                funcionario_id,
                foto_encontrado,
                destino_tipo,
                destino_nome,
                destino_endereco,
                instrucoes_retirada,
                status,
                concluido_em
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,'CONCLUIDO',CURRENT_TIMESTAMP)
            RETURNING *
            `,
            [
                petId,
                funcionario.id,
                fotoEncontrado,
                destinoTipo,
                destinoTipo === "INSTITUICAO" ? destinoNome : funcionario.nome,
                destinoEndereco,
                instrucoesRetirada
            ]
        );

        const petAtualizado = await client.query(
            `
            UPDATE pets
            SET
                desaparecido = FALSE,
                status_pet = 'ENCONTRADO',
                encontrado_em = CURRENT_TIMESTAMP,
                atualizado_em = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
            `,
            [petId]
        );

        const localNome = destinoTipo === "INSTITUICAO"
            ? destinoNome
            : `endereço de ${funcionario.nome}`;

        await inserirNotificacao(client, {
            usuarioId: pet.usuario_id,
            tipo: "PET_ENCONTRADO",
            titulo: `${pet.nome} foi encontrado!`,
            mensagem: `${funcionario.nome} encontrou ${pet.nome}. O animal ficará em ${localNome}, no endereço: ${destinoEndereco}.`,
            foto: fotoEncontrado,
            dados: {
                petId,
                petNome: pet.nome,
                profissional: funcionario.nome,
                empresa: funcionario.empresa,
                destinoTipo,
                destinoNome: destinoTipo === "INSTITUICAO" ? destinoNome : funcionario.nome,
                destinoEndereco,
                instrucoesRetirada,
                resgateId: resgateResult.rows[0].id
            }
        });

        await client.query("COMMIT");

        broadcastProfessionalEvent("missing_pet_resolved", {
            id: petId,
            name: pet.nome
        });

        return res.status(200).json({
            message: "Resgate concluído e cidadão notificado.",
            pet: petAtualizado.rows[0],
            resgate: resgateResult.rows[0]
        });
    } catch (erro) {
        try { await client.query("ROLLBACK"); } catch (_) {}
        return res.status(500).json({
            error: "Erro ao concluir o resgate do pet.",
            details: erro.message
        });
    } finally {
        client.release();
    }
});

app.get("/api/users/:cpf/notifications-v18", async (req, res) => {
    try {
        const cpf = limparCpf(req.params.cpf);
        const result = await pool.query(
            `
            SELECT
                n.id,
                n.tipo,
                n.titulo AS title,
                n.mensagem AS message,
                n.foto,
                n.dados,
                n.lida,
                n.criado_em AS "createdAt"
            FROM notificacoes n
            INNER JOIN usuarios u ON u.id = n.usuario_id
            WHERE u.cpf = $1
            ORDER BY n.criado_em DESC
            LIMIT 100
            `,
            [cpf]
        );
        return res.status(200).json(result.rows);
    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao carregar notificações.",
            details: erro.message
        });
    }
});

app.patch("/api/admin/accounts/:cpf/suspend", verificarAdmin, async (req, res) => {
    try {
        const cpf = limparCpf(req.params.cpf);
        const dias = Number(req.body.dias);
        const motivo = limparTexto(req.body.motivo);

        if (cpf === ADMIN_CPF) {
            return res.status(403).json({ error: "O administrador master não pode ser suspenso." });
        }

        if (!Number.isInteger(dias) || dias < 1 || dias > 365) {
            return res.status(400).json({ error: "Informe entre 1 e 365 dias." });
        }

        if (!motivo) {
            return res.status(400).json({ error: "Informe o motivo da suspensão." });
        }

        const result = await pool.query(
            `
            UPDATE usuarios
            SET
                ativo = FALSE,
                bloqueado_em = CURRENT_TIMESTAMP,
                bloqueado_ate = CURRENT_TIMESTAMP + ($1::INTEGER * INTERVAL '1 day'),
                motivo_bloqueio = $2,
                bloqueado_por = $3,
                session_version = session_version + 1,
                atualizado_em = CURRENT_TIMESTAMP
            WHERE cpf = $4
              AND excluida_em IS NULL
            RETURNING *
            `,
            [dias, motivo, req.admin.id, cpf]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Conta não encontrada." });
        }

        if (result.rows[0].tipo === "professional") {
            await pool.query("UPDATE funcionarios SET ativo = FALSE WHERE usuario_id = $1", [result.rows[0].id]);
        }

        await pool.query(
            `
            INSERT INTO bloqueios_conta
            (usuario_id, administrador_id, inicio_em, fim_em, motivo, ativo)
            VALUES ($1,$2,CURRENT_TIMESTAMP,$3,$4,TRUE)
            `,
            [result.rows[0].id, req.admin.id, result.rows[0].bloqueado_ate, motivo]
        );

        await registrarAuditoria({
            administradorId: req.admin.id,
            usuarioAlvoId: result.rows[0].id,
            acao: "CONTA_SUSPENSA",
            detalhes: { dias, motivo, bloqueadoAte: result.rows[0].bloqueado_ate },
            req
        });

        await publishRealtimeEvent({
            audience: "USER",
            audienceId: result.rows[0].id,
            type: "account_status",
            payload: {
                code: "ACCOUNT_SUSPENDED",
                message: motivo,
                blockedUntil: result.rows[0].bloqueado_ate
            }
        });

        return res.status(200).json({
            message: `Conta suspensa por ${dias} dia(s).`,
            user: usuarioSeguro(result.rows[0])
        });
    } catch (erro) {
        return res.status(500).json({ error: "Erro ao suspender conta.", details: erro.message });
    }
});

app.patch("/api/admin/accounts/:cpf/reactivate", verificarAdmin, async (req, res) => {
    try {
        const cpf = limparCpf(req.params.cpf);
        const result = await pool.query(
            `
            UPDATE usuarios
            SET
                ativo = TRUE,
                bloqueado_em = NULL,
                bloqueado_ate = NULL,
                motivo_bloqueio = NULL,
                bloqueado_por = NULL,
                session_version = session_version + 1,
                atualizado_em = CURRENT_TIMESTAMP
            WHERE cpf = $1
              AND excluida_em IS NULL
            RETURNING *
            `,
            [cpf]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Conta não encontrada ou já excluída." });
        }

        if (result.rows[0].tipo === "professional") {
            await pool.query("UPDATE funcionarios SET ativo = TRUE WHERE usuario_id = $1", [result.rows[0].id]);
        }

        await pool.query("UPDATE bloqueios_conta SET ativo = FALSE, revogado_em = CURRENT_TIMESTAMP WHERE usuario_id = $1 AND ativo = TRUE", [result.rows[0].id]);

        await registrarAuditoria({
            administradorId: req.admin.id,
            usuarioAlvoId: result.rows[0].id,
            acao: "CONTA_REATIVADA",
            req
        });

        await publishRealtimeEvent({
            audience: "USER",
            audienceId: result.rows[0].id,
            type: "account_status",
            payload: { code: "ACCOUNT_REACTIVATED", message: "Conta reativada." }
        });

        return res.status(200).json({ message: "Conta reativada.", user: usuarioSeguro(result.rows[0]) });
    } catch (erro) {
        return res.status(500).json({ error: "Erro ao reativar conta.", details: erro.message });
    }
});

app.delete("/api/admin/accounts/:cpf/delete", verificarAdmin, async (req, res) => {
    try {
        const cpf = limparCpf(req.params.cpf);
        const motivo = limparTexto(req.body?.motivo || "Conta excluída pelo administrador.");

        if (cpf === ADMIN_CPF) {
            return res.status(403).json({ error: "O administrador master não pode ser excluído." });
        }

        const result = await pool.query(
            `
            UPDATE usuarios
            SET
                ativo = FALSE,
                excluida_em = CURRENT_TIMESTAMP,
                motivo_bloqueio = $1,
                session_version = session_version + 1,
                atualizado_em = CURRENT_TIMESTAMP
            WHERE cpf = $2
              AND excluida_em IS NULL
            RETURNING *
            `,
            [motivo, cpf]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Conta não encontrada ou já excluída." });
        }

        if (result.rows[0].tipo === "professional") {
            await pool.query("UPDATE funcionarios SET ativo = FALSE WHERE usuario_id = $1", [result.rows[0].id]);
        }

        await registrarAuditoria({
            administradorId: req.admin.id,
            usuarioAlvoId: result.rows[0].id,
            acao: "CONTA_EXCLUIDA",
            detalhes: { motivo },
            req
        });

        await publishRealtimeEvent({
            audience: "USER",
            audienceId: result.rows[0].id,
            type: "account_status",
            payload: { code: "ACCOUNT_DELETED", message: motivo }
        });

        return res.status(200).json({ message: "Conta excluída e sessões revogadas." });
    } catch (erro) {
        return res.status(500).json({ error: "Erro ao excluir conta.", details: erro.message });
    }
});

/* =====================================================
   DASHBOARD / RELATÓRIOS
===================================================== */

app.get("/api/dashboard/resumo", async (req, res) => {
    try {
        const totalUsuarios = await pool.query(
            "SELECT COUNT(*)::int AS total FROM usuarios WHERE ativo = TRUE"
        );

        const totalFuncionarios = await pool.query(
            `
            SELECT COUNT(*)::int AS total
            FROM usuarios
            WHERE ativo = TRUE
            AND tipo = 'professional'
            `
        );

        const totalPets = await pool.query(
            "SELECT COUNT(*)::int AS total FROM pets WHERE ativo = TRUE"
        );

        const totalOcorrencias = await pool.query(
            "SELECT COUNT(*)::int AS total FROM ocorrencias"
        );

        const totalDenunciasAnonimas = await pool.query(
            "SELECT COUNT(*)::int AS total FROM denuncias_anonimas"
        );

        const pendentes = await pool.query(
            `
            SELECT COUNT(*)::int AS total
            FROM
            (
                SELECT status FROM ocorrencias
                UNION ALL
                SELECT status FROM denuncias_anonimas
            ) todos
            WHERE status = 'PENDENTE'
            `
        );

        const concluidas = await pool.query(
            `
            SELECT COUNT(*)::int AS total
            FROM
            (
                SELECT status FROM ocorrencias
                UNION ALL
                SELECT status FROM denuncias_anonimas
            ) todos
            WHERE status = 'CONCLUIDA'
            `
        );

        const criticas = await pool.query(
            `
            SELECT COUNT(*)::int AS total
            FROM
            (
                SELECT prioridade FROM ocorrencias
                UNION ALL
                SELECT prioridade FROM denuncias_anonimas
            ) todos
            WHERE prioridade = 'CRITICA'
            `
        );

        const alta = await pool.query(
            `
            SELECT COUNT(*)::int AS total
            FROM
            (
                SELECT prioridade FROM ocorrencias
                UNION ALL
                SELECT prioridade FROM denuncias_anonimas
            ) todos
            WHERE prioridade = 'ALTA'
            `
        );

        return res.status(200).json({
            usuarios: totalUsuarios.rows[0].total,
            funcionarios: totalFuncionarios.rows[0].total,
            pets: totalPets.rows[0].total,
            ocorrencias: totalOcorrencias.rows[0].total,
            denunciasAnonimas: totalDenunciasAnonimas.rows[0].total,
            pendentes: pendentes.rows[0].total,
            concluidas: concluidas.rows[0].total,
            criticas: criticas.rows[0].total,
            altaPrioridade: alta.rows[0].total
        });

    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao gerar resumo do dashboard.",
            details: erro.message
        });
    }
});

/* =====================================================
   DEBUG
===================================================== */

app.get("/api/debug/db", verificarAdmin, async (req, res) => {
    try {
        await garantirAdminNoBanco();

        const usuarios = await pool.query("SELECT * FROM usuarios ORDER BY id");
        const funcionarios = await pool.query("SELECT * FROM funcionarios ORDER BY id");
        const pets = await pool.query("SELECT * FROM pets ORDER BY id");
        const ocorrencias = await pool.query("SELECT * FROM ocorrencias ORDER BY id");
        const denuncias = await pool.query("SELECT * FROM denuncias_anonimas ORDER BY id");
        const historico = await pool.query("SELECT * FROM historico_ocorrencias ORDER BY id");

        return res.status(200).json({
            usuarios: usuarios.rows,
            funcionarios: funcionarios.rows,
            pets: pets.rows,
            ocorrencias: ocorrencias.rows,
            denunciasAnonimas: denuncias.rows,
            historicoOcorrencias: historico.rows
        });
    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao consultar debug.",
            details: erro.message
        });
    }
});

app.get("/api/debug/views", verificarAdmin, async (req, res) => {
    try {
        await garantirAdminNoBanco();

        const usuarios = await pool.query("SELECT * FROM view_usuarios_completos ORDER BY id");
        const ocorrencias = await pool.query("SELECT * FROM view_ocorrencias_completas ORDER BY id");
        const chamados = await pool.query("SELECT * FROM view_chamados_profissionais ORDER BY criado_em DESC");

        return res.status(200).json({
            usuariosCompletos: usuarios.rows,
            ocorrenciasCompletas: ocorrencias.rows,
            chamadosProfissionais: chamados.rows
        });
    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao consultar views.",
            details: erro.message
        });
    }
});

/* =====================================================
   FALLBACK DO FRONTEND / ERROS
===================================================== */

app.use((req, res, next) => {
    if (
        req.method === "GET" &&
        !req.path.startsWith("/api/") &&
        fs.existsSync(PUBLIC_INDEX)
    ) {
        return res.sendFile(PUBLIC_INDEX);
    }

    return next();
});

app.use((req, res) => {
    return res.status(404).json({
        error: "Rota não encontrada.",
        metodo: req.method,
        rota: req.originalUrl
    });
});

app.use((erro, req, res, next) => {
    console.error("❌ Erro não tratado:", erro);

    if (res.headersSent) {
        return next(erro);
    }

    const erroCors = erro.message === "Origem não autorizada pelo CORS.";

    return res.status(erroCors ? 403 : 500).json({
        error: erroCors
            ? "Origem não autorizada."
            : "Erro interno do servidor.",
        details: detalhesErro(erro)
    });
});

/* =====================================================
   INICIALIZAÇÃO
===================================================== */

async function iniciarServidor() {
    try {
        if (!possuiDatabaseUrl && IS_PRODUCTION) {
            throw new Error(
                "DATABASE_URL não foi configurada. Copie a Connection String do Supabase para o Render."
            );
        }

        const testeBanco = await pool.query("SELECT NOW() AS agora");
        console.log(`✅ PostgreSQL conectado: ${testeBanco.rows[0].agora}`);

        await garantirAdminNoBanco();
        console.log("✅ Administrador master verificado no banco.");

        app.listen(PORT, "0.0.0.0", () => {
            console.log("====================================================");
            console.log(`🚀 SERVIDOR SAFE LIFE ONLINE NA PORTA ${PORT}`);
            console.log(`🌎 Ambiente: ${NODE_ENV}`);
            console.log("🔎 Status: /api/status");
            console.log("====================================================");
        });
    } catch (erro) {
        console.error("====================================================");
        console.error("❌ NÃO FOI POSSÍVEL INICIAR O SAFE LIFE");
        console.error(erro.message);
        console.error("====================================================");
        process.exit(1);
    }
}

async function encerrarServidor(sinal) {
    console.log(`\n${sinal} recebido. Encerrando conexões...`);

    try {
        await pool.end();
        console.log("✅ Pool do PostgreSQL encerrado.");
        process.exit(0);
    } catch (erro) {
        console.error("❌ Erro ao encerrar o pool:", erro.message);
        process.exit(1);
    }
}

process.on("SIGTERM", () => encerrarServidor("SIGTERM"));
process.on("SIGINT", () => encerrarServidor("SIGINT"));

iniciarServidor();
