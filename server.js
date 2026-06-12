const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_CPF = "45317828791";

/* =====================================================
   MIDDLEWARES
===================================================== */

app.use(cors());

app.use(express.json({
    limit: "35mb"
}));

app.use(express.urlencoded({
    extended: true,
    limit: "35mb"
}));

/* =====================================================
   CONEXÃO COM POSTGRESQL
===================================================== */

const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "safelife",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "123456"
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

function usuarioSeguro(usuario) {
    if (!usuario) return null;

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

    if (adminExiste) {
        if (adminExiste.tipo !== "admin" || adminExiste.ativo !== true) {
            const result = await pool.query(
                `
                UPDATE usuarios
                SET
                    tipo = 'admin',
                    empresa = 'Safe Life Matriz',
                    ativo = TRUE
                WHERE cpf = $1
                RETURNING *
                `,
                [ADMIN_CPF]
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
            "Gustavo Siri",
            ADMIN_CPF,
            "123456",
            "gustavo.siriguejo@safelife.com",
            "11977770000",
            "admin",
            "Safe Life Matriz",
            "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80"
        ]
    );

    return result.rows[0];
}

async function verificarAdmin(req, res, next) {
    const adminCpf = limparCpf(
        req.headers["x-admin-cpf"] ||
        req.body.adminCpf ||
        req.query.adminCpf ||
        ADMIN_CPF
    );

    if (adminCpf !== ADMIN_CPF) {
        return res.status(403).json({
            error: "Acesso negado. Apenas o administrador master pode executar esta ação."
        });
    }

    try {
        const admin = await garantirAdminNoBanco();

        if (!admin || admin.cpf !== ADMIN_CPF) {
            return res.status(403).json({
                error: "Administrador master não encontrado."
            });
        }

        req.admin = admin;
        next();
    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao validar administrador.",
            details: erro.message
        });
    }
}

/* =====================================================
   ROTA INICIAL
===================================================== */

app.get("/", async (req, res) => {
    try {
        await pool.query("SELECT NOW()");
        await garantirAdminNoBanco();

        return res.status(200).json({
            message: "🚀 API Safe Life Online",
            status: "OK",
            banco: "PostgreSQL conectado",
            adminCpf: ADMIN_CPF,
            rotas: {
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
                dashboard: "GET /api/dashboard/resumo",
                debug: "GET /api/debug/db"
            }
        });
    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao conectar no PostgreSQL.",
            details: erro.message
        });
    }
});

/* =====================================================
   AUTENTICAÇÃO
===================================================== */

app.post("/api/auth/register", async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            nome,
            cpf,
            email,
            telefone,
            type,
            company,
            foto
        } = req.body;

        const cpfLimpo = limparCpf(cpf);

        if (!nome || !cpfLimpo || !email || !telefone || !type) {
            return res.status(400).json({
                error: "Preencha nome, CPF, e-mail, telefone e tipo de conta."
            });
        }

        if (cpfLimpo.length !== 11) {
            return res.status(400).json({
                error: "CPF inválido. Digite exatamente 11 números."
            });
        }

        if (cpfLimpo === ADMIN_CPF) {
            return res.status(403).json({
                error: "Este CPF é reservado para o administrador master."
            });
        }

        if (!validarEmail(email)) {
            return res.status(400).json({
                error: "E-mail inválido."
            });
        }

        if (type !== "citizen" && type !== "professional") {
            return res.status(400).json({
                error: "Tipo de conta inválido."
            });
        }

        if (type === "professional" && !company) {
            return res.status(400).json({
                error: "Funcionário precisa informar a empresa/base."
            });
        }

        const usuarioExiste = await buscarUsuarioPorCpf(cpfLimpo);

        if (usuarioExiste) {
            return res.status(400).json({
                error: "Este CPF já está cadastrado."
            });
        }

        await client.query("BEGIN");

        const fotoPadrao = "img/vitor-chineque.jpg";

        const usuarioResult = await client.query(
            `
            INSERT INTO usuarios
            (
                nome,
                cpf,
                email,
                telefone,
                tipo,
                empresa,
                foto_perfil,
                ativo
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,TRUE)
            RETURNING *
            `,
            [
                limparTexto(nome),
                cpfLimpo,
                limparTexto(email),
                limparTexto(telefone),
                type,
                type === "professional" ? limparTexto(company) : null,
                foto || fotoPadrao
            ]
        );

        const novoUsuario = usuarioResult.rows[0];

        if (type === "professional") {
            await client.query(
                `
                INSERT INTO funcionarios
                (
                    usuario_id,
                    cargo,
                    empresa,
                    nivel_acesso,
                    ativo
                )
                VALUES
                ($1,$2,$3,$4,TRUE)
                `,
                [
                    novoUsuario.id,
                    "Agente Operacional",
                    limparTexto(company),
                    "operador"
                ]
            );
        }

        await client.query("COMMIT");

        return res.status(201).json({
            message: "Usuário cadastrado com sucesso!",
            user: usuarioSeguro(novoUsuario)
        });

    } catch (erro) {
        await client.query("ROLLBACK");

        return res.status(500).json({
            error: "Erro ao cadastrar usuário.",
            details: erro.message
        });
    } finally {
        client.release();
    }
});

app.post("/api/auth/login", async (req, res) => {
    try {
        const { cpf, role, company } = req.body;

        const cpfLimpo = limparCpf(cpf);

        if (!cpfLimpo || !role) {
            return res.status(400).json({
                error: "CPF e tipo de acesso são obrigatórios."
            });
        }

        if (cpfLimpo === ADMIN_CPF) {
            const admin = await garantirAdminNoBanco();

            await pool.query(
                `
                UPDATE usuarios
                SET ultimo_login = CURRENT_TIMESTAMP
                WHERE cpf = $1
                `,
                [ADMIN_CPF]
            );

            return res.status(200).json({
                message: "Administrador autenticado com sucesso!",
                user: usuarioSeguro(admin)
            });
        }

        if (role !== "citizen" && role !== "professional" && role !== "admin") {
            return res.status(400).json({
                error: "Tipo de acesso inválido."
            });
        }

        const result = await pool.query(
            `
            SELECT *
            FROM usuarios
            WHERE cpf = $1
            AND tipo = $2
            AND ativo = TRUE
            LIMIT 1
            `,
            [cpfLimpo, role]
        );

        const usuario = result.rows[0];

        if (!usuario) {
            return res.status(401).json({
                error: "Credenciais inválidas, perfil incorreto ou conta bloqueada."
            });
        }

        if (role === "professional" && company && usuario.empresa !== company) {
            return res.status(401).json({
                error: "Vínculo corporativo divergente para este funcionário."
            });
        }

        await pool.query(
            `
            UPDATE usuarios
            SET ultimo_login = CURRENT_TIMESTAMP
            WHERE id = $1
            `,
            [usuario.id]
        );

        const usuarioCompleto = await buscarUsuarioPorCpf(cpfLimpo);

        return res.status(200).json({
            message: "Autenticação bem-sucedida!",
            user: usuarioSeguro(usuarioCompleto || usuario)
        });

    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao realizar login.",
            details: erro.message
        });
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
});app.put("/api/users/:cpf", async (req, res) => {
    const client = await pool.connect();

    try {
        await garantirAdminNoBanco();

        const cpfAntigo = limparCpf(req.params.cpf);

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

        return res.status(200).json({
            message: "Perfil atualizado com sucesso!",
            user: usuarioSeguro(usuarioCompleto || usuarioAtualizado)
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

app.delete("/api/users/:cpf", async (req, res) => {
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
            profissional
        } = req.body;

        const cpfLimpo = limparCpf(cpf);

        if (!nome || !cpfLimpo || !email || !telefone || !company) {
            return res.status(400).json({
                error: "Preencha nome, CPF, e-mail, telefone e empresa."
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

        if (!validarEmail(email)) {
            return res.status(400).json({
                error: "E-mail inválido."
            });
        }

        const existe = await buscarUsuarioPorCpf(cpfLimpo);

        if (existe) {
            return res.status(400).json({
                error: "Este CPF já está cadastrado."
            });
        }

        await client.query("BEGIN");

        const usuarioResult = await client.query(
            `
            INSERT INTO usuarios
            (
                nome,
                cpf,
                email,
                telefone,
                tipo,
                empresa,
                foto_perfil,
                ativo
            )
            VALUES
            ($1,$2,$3,$4,'professional',$5,$6,TRUE)
            RETURNING *
            `,
            [
                limparTexto(nome),
                cpfLimpo,
                limparTexto(email),
                limparTexto(telefone),
                limparTexto(company),
                foto || "img/vitor-chineque.jpg"
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
                profissional?.cargo || "Agente Operacional",
                limparTexto(company),
                "operador",
                profissional?.registro || profissional?.registroProfissional || "",
                profissional?.especialidade || "Resgate e triagem animal",
                profissional?.regiao || profissional?.regiaoAtendimento || "Região não informada",
                profissional?.plantao || profissional?.statusPlantao || "Disponível",
                profissional?.veiculo || "Veículo de apoio",
                profissional?.equipe || "Equipe Safe Life",
                profissional?.observacoes || profissional?.bioProfissional || ""
            ]
        );

        await client.query("COMMIT");

        const usuarioCompleto = await buscarUsuarioPorCpf(cpfLimpo);

        return res.status(201).json({
            message: "Profissional cadastrado pelo administrador com sucesso.",
            user: usuarioSeguro(usuarioCompleto || usuario)
        });

    } catch (erro) {
        await client.query("ROLLBACK");

        return res.status(500).json({
            error: "Erro ao cadastrar profissional pelo administrador.",
            details: erro.message
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
});app.post("/api/admin/profissionais", verificarAdmin, async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            nome,
            cpf,
            email,
            telefone,
            company,
            cargo,
            registroProfissional,
            especialidade,
            regiaoAtendimento,
            statusPlantao,
            veiculo,
            equipe,
            bioProfissional
        } = req.body;

        const cpfLimpo = limparCpf(cpf);

        if (!nome || !cpfLimpo || !email || !telefone || !company) {
            return res.status(400).json({ error: "Preencha nome, CPF, e-mail, telefone e empresa." });
        }

        if (cpfLimpo.length !== 11) {
            return res.status(400).json({ error: "CPF inválido." });
        }

        if (cpfLimpo === ADMIN_CPF) {
            return res.status(403).json({ error: "CPF reservado para o administrador." });
        }

        if (!validarEmail(email)) {
            return res.status(400).json({ error: "E-mail inválido." });
        }

        const existe = await buscarUsuarioPorCpf(cpfLimpo);

        if (existe) {
            return res.status(400).json({ error: "Este CPF já está cadastrado." });
        }

        await client.query("BEGIN");

        const usuarioResult = await client.query(
            `
            INSERT INTO usuarios
            (nome, cpf, senha_hash, email, telefone, tipo, empresa, foto_perfil, ativo)
            VALUES ($1,$2,$3,$4,$5,'professional',$6,$7,TRUE)
            RETURNING *
            `,
            [
                limparTexto(nome),
                cpfLimpo,
                "123456",
                limparTexto(email),
                limparTexto(telefone),
                limparTexto(company),
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80"
            ]
        );

        const novoUsuario = usuarioResult.rows[0];

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
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,TRUE)
            `,
            [
                novoUsuario.id,
                cargo ? limparTexto(cargo) : "Agente Operacional",
                limparTexto(company),
                "operador",
                registroProfissional ? limparTexto(registroProfissional) : null,
                especialidade ? limparTexto(especialidade) : "Resgate de rua",
                regiaoAtendimento ? limparTexto(regiaoAtendimento) : null,
                statusPlantao ? limparTexto(statusPlantao) : "Disponível",
                veiculo ? limparTexto(veiculo) : "Carro de resgate",
                equipe ? limparTexto(equipe) : null,
                bioProfissional ? limparTexto(bioProfissional) : null
            ]
        );

        await client.query("COMMIT");

        const usuarioCompleto = await buscarUsuarioPorCpf(cpfLimpo);

        return res.status(201).json({
            message: "Profissional cadastrado com sucesso.",
            user: usuarioSeguro(usuarioCompleto || novoUsuario)
        });
    } catch (erro) {
        await client.query("ROLLBACK");
        return res.status(500).json({
            error: "Erro ao cadastrar profissional.",
            details: erro.message
        });
    } finally {
        client.release();
    }
});

app.delete("/api/admin/users/:cpf/permanent", verificarAdmin, async (req, res) => {
    try {
        const cpfLimpo = limparCpf(req.params.cpf);

        if (cpfLimpo === ADMIN_CPF) {
            return res.status(403).json({ error: "A conta master não pode ser excluída." });
        }

        const result = await pool.query(
            `
            DELETE FROM usuarios
            WHERE cpf = $1
            RETURNING *
            `,
            [cpfLimpo]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Usuário não encontrado." });
        }

        return res.status(200).json({ message: "Conta excluída permanentemente." });
    } catch (erro) {
        return res.status(500).json({
            error: "Erro ao excluir conta.",
            details: erro.message
        });
    }
});

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
                foto || null,
                gpsLimpo.latitude,
                gpsLimpo.longitude,
                gpsLimpo.enderecoCompleto || localizacao,
                gpsLimpo.bairro,
                gpsLimpo.cidade,
                gpsLimpo.estado,
                prioridade || "NORMAL"
            ]
        );

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
                foto || null,
                gpsLimpo.latitude,
                gpsLimpo.longitude,
                gpsLimpo.enderecoCompleto || localizacao,
                gpsLimpo.bairro,
                gpsLimpo.cidade,
                gpsLimpo.estado,
                prioridade || "NORMAL"
            ]
        );

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
        const { origem, id } = req.params;

        const {
            status,
            funcionarioCpf,
            observacao
        } = req.body;

        const statusPermitidos = [
            "PENDENTE",
            "EM_ATENDIMENTO",
            "CONCLUIDA",
            "CANCELADA"
        ];

        if (!statusPermitidos.includes(status)) {
            return res.status(400).json({
                error: "Status inválido."
            });
        }

        await client.query("BEGIN");

        let funcionarioId = null;

        if (funcionarioCpf) {
            const funcionario = await client.query(
                `
                SELECT f.id
                FROM funcionarios f
                INNER JOIN usuarios u
                ON u.id = f.usuario_id
                WHERE u.cpf = $1
                LIMIT 1
                `,
                [limparCpf(funcionarioCpf)]
            );

            if (funcionario.rows[0]) {
                funcionarioId = funcionario.rows[0].id;
            }
        }

        if (origem === "ocorrencia") {
            const atual = await client.query(
                `
                SELECT *
                FROM ocorrencias
                WHERE id = $1
                `,
                [id]
            );

            if (atual.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(404).json({
                    error: "Ocorrência não encontrada."
                });
            }

            const result = await client.query(
                `
                UPDATE ocorrencias
                SET
                    status = $1,
                    atendente_id = COALESCE($2, atendente_id),
                    concluido_em = CASE
                        WHEN $1 = 'CONCLUIDA' THEN CURRENT_TIMESTAMP
                        ELSE concluido_em
                    END
                WHERE id = $3
                RETURNING *
                `,
                [status, funcionarioId, id]
            );

            await client.query(
                `
                INSERT INTO historico_ocorrencias
                (
                    ocorrencia_id,
                    funcionario_id,
                    status_anterior,
                    status_novo,
                    acao,
                    observacao
                )
                VALUES
                ($1,$2,$3,$4,$5,$6)
                `,
                [
                    id,
                    funcionarioId,
                    atual.rows[0].status,
                    status,
                    "Alteração de status",
                    observacao || null
                ]
            );

            await client.query("COMMIT");

            return res.status(200).json({
                message: "Status da ocorrência atualizado.",
                data: result.rows[0]
            });
        }

        if (origem === "anonima") {
            const atual = await client.query(
                `
                SELECT *
                FROM denuncias_anonimas
                WHERE id = $1
                `,
                [id]
            );

            if (atual.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(404).json({
                    error: "Denúncia anônima não encontrada."
                });
            }

            const result = await client.query(
                `
                UPDATE denuncias_anonimas
                SET status = $1
                WHERE id = $2
                RETURNING *
                `,
                [status, id]
            );

            await client.query("COMMIT");

            return res.status(200).json({
                message: "Status da denúncia anônima atualizado.",
                data: result.rows[0]
            });
        }

        await client.query("ROLLBACK");

        return res.status(400).json({
            error: "Origem inválida. Use ocorrencia ou anonima."
        });

    } catch (erro) {
        await client.query("ROLLBACK");

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

app.get("/api/debug/db", async (req, res) => {
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

app.get("/api/debug/views", async (req, res) => {
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
   INICIALIZAÇÃO
===================================================== */

app.listen(PORT, async () => {
    console.log("====================================================");
    console.log(`🚀 SERVIDOR SAFE LIFE ONLINE EM: http://localhost:${PORT}`);
    console.log("🐘 PostgreSQL conectado ao Safe Life");
    console.log(`👑 CPF ADMIN MASTER: ${ADMIN_CPF}`);
    console.log("🔒 Endpoints da API prontos para receber requisições.");
    console.log("====================================================");

    try {
        await garantirAdminNoBanco();
        console.log("✅ Administrador master garantido no banco.");
    } catch (erro) {
        console.log("⚠️ Não foi possível criar/verificar o admin:", erro.message);
    }
});
