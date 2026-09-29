"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const server = fs.readFileSync(path.join(__dirname, "server.js"), "utf8");
const database = fs.readFileSync(path.join(__dirname, "database.sql"), "utf8");

const checks = [
    ["users list requires admin", 'app.get("/api/users", verificarAdmin'],
    ["user detail requires ownership/admin", 'app.get("/api/users/:cpf", verificarSessaoUsuario, verificarMesmoUsuarioOuAdmin'],
    ["pet creation requires session", 'app.post("/api/pets", verificarSessaoUsuario'],
    ["pet update checks ownership", 'app.put("/api/pets/:id", verificarSessaoUsuario, verificarProprietarioPetOuAdmin'],
    ["pet delete checks ownership", 'app.delete("/api/pets/:id", verificarSessaoUsuario, verificarProprietarioPetOuAdmin'],
    ["identified occurrence requires session", 'app.post("/api/ocorrencias", verificarSessaoUsuario'],
    ["anonymous reports listing is restricted", 'app.get("/api/denuncias-anonimas", verificarSessaoUsuario, exigirPerfis("professional", "admin")'],
    ["professional queue requires role", 'app.get("/api/pro/ocorrencias", verificarSessaoUsuario, exigirPerfis("professional", "admin")'],
    ["case status requires role", 'app.patch("/api/chamados/:origem/:id/status", verificarSessaoUsuario, exigirPerfis("professional", "admin")'],
    ["case deletion requires role", 'app.delete("/api/chamados/:origem/:id", verificarSessaoUsuario, exigirPerfis("professional", "admin")'],
    ["dashboard summary requires admin", 'app.get("/api/dashboard/resumo", verificarAdmin'],
    ["password bypass stays disabled", "const REQUIRE_USER_PASSWORD = true;"],
    ["demo admin uses the fixed new CPF", 'const ADMIN_CPF = "33333333333";'],
    ["citizen receives the five-business-day notice", "Ele será resolvido em até 5 dias úteis."],
    ["database has business-day helper", "CREATE OR REPLACE FUNCTION adicionar_dias_uteis"],
    ["occurrence default is five business days", "DEFAULT adicionar_dias_uteis(CURRENT_DATE, 5)"]
];

for (const [label, fragment] of checks) {
    assert(server.includes(fragment) || database.includes(fragment), `Falhou: ${label}`);
}

assert(
    !server.includes('u.cpf AS dono_cpf,\n                u.email AS dono_email,\n                u.telefone AS dono_telefone'),
    "Falhou: rota pública ainda expõe contato do dono."
);

assert(
    server.includes('buscarUsuarioPorCpf("45317828791")') &&
    server.includes('buscarUsuarioPorCpf("99999999999")'),
    "Falhou: migração das contas demo antigas não está disponível."
);

assert(
    server.includes('process.env.ENABLE_DEBUG_ROUTES !== "true"'),
    "Falhou: rotas de debug não estão protegidas em produção."
);

console.log(`✓ ${checks.length + 3} verificações de segurança/integridade passaram.`);
