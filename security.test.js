"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert");

const server = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");

const checks = [
    ['users list requires admin', 'app.get("/api/users", verificarAdmin'],
    ['user detail requires session and ownership/admin', 'app.get("/api/users/:cpf", verificarSessaoUsuario, verificarMesmoUsuarioOuAdmin'],
    ['pet creation requires session', 'app.post("/api/pets", verificarSessaoUsuario'],
    ['pet update checks ownership', 'app.put("/api/pets/:id", verificarSessaoUsuario, verificarProprietarioPetOuAdmin'],
    ['pet delete checks ownership', 'app.delete("/api/pets/:id", verificarSessaoUsuario, verificarProprietarioPetOuAdmin'],
    ['identified occurrence requires session', 'app.post("/api/ocorrencias", verificarSessaoUsuario'],
    ['anonymous reports listing is professional/admin only', 'app.get("/api/denuncias-anonimas", verificarSessaoUsuario, exigirPerfis("professional", "admin")'],
    ['professional queue requires role', 'app.get("/api/pro/ocorrencias", verificarSessaoUsuario, exigirPerfis("professional", "admin")'],
    ['case status requires role', 'app.patch("/api/chamados/:origem/:id/status", verificarSessaoUsuario, exigirPerfis("professional", "admin")'],
    ['case deletion requires role', 'app.delete("/api/chamados/:origem/:id", verificarSessaoUsuario, exigirPerfis("professional", "admin")'],
    ['dashboard summary requires admin', 'app.get("/api/dashboard/resumo", verificarAdmin'],
    ['password bypass removed', 'const REQUIRE_USER_PASSWORD = true;']
];

for (const [label, fragment] of checks) {
    assert(server.includes(fragment), `Falhou: ${label}`);
}

assert(!server.includes('u.cpf AS dono_cpf,\n                u.email AS dono_email,\n                u.telefone AS dono_telefone'), 'Falhou: rota pública ainda expõe contato do dono.');

console.log(`✓ ${checks.length + 1} verificações de segurança passaram.`);
