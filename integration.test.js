"use strict";

const assert = require("assert");

const BASE = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const IMAGE_1PX = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

async function request(path, { method = "GET", token, body, expected = [200] } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
    });

    const text = await response.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch (_) {
        data = text;
    }

    assert(
        expected.includes(response.status),
        `${method} ${path} retornou ${response.status}, esperado ${expected.join("/")}. Resposta: ${text.slice(0, 500)}`
    );

    return { status: response.status, data };
}

async function login(cpf, role, password = "123456", extra = {}) {
    const { data } = await request("/api/auth/login", {
        method: "POST",
        expected: [200],
        body: { cpf, role, password, ...extra }
    });
    assert(data && data.token, `Login ${role} não retornou token.`);
    assert.strictEqual(data.user.type, role, `Perfil incorreto no login ${role}.`);
    return data;
}

(async () => {
    console.log("▶ Safe Life V26 integration smoke test");

    await request("/api/status", { expected: [200] });

    const citizen = await login("11111111111", "citizen");
    assert.strictEqual(citizen.user.nome, "Antonio Cidadão");

    await request("/api/auth/session-status", {
        token: citizen.token,
        expected: [200]
    });

    const citizenProfile = await request("/api/users/11111111111", {
        token: citizen.token,
        expected: [200]
    });
    assert.strictEqual(citizenProfile.data.nome, "Antonio Cidadão", "Perfil do cidadão retornou nome incorreto.");

    const publicCompanies = await request("/api/empresas", {
        expected: [200]
    });
    assert(Array.isArray(publicCompanies.data) && publicCompanies.data.length >= 1, "Lista de empresas não carregou.");

    await request("/api/admin/users", {
        token: citizen.token,
        expected: [403]
    });

    const petCreated = await request("/api/pets", {
        method: "POST",
        token: citizen.token,
        expected: [201],
        body: {
            nome: "Pet CI",
            idade: 2,
            especie: "Cachorro",
            raca: "SRD",
            sexo: "MACHO",
            cor: "Caramelo",
            local: "Curitiba",
            observacoes: "Criado pelo teste de integração."
        }
    });
    const petId = petCreated.data.pet.id;
    assert(petId, "Cadastro de pet não retornou ID.");

    await request(`/api/pets/${petId}/desaparecido`, {
        method: "PATCH",
        token: citizen.token,
        expected: [200],
        body: {
            desaparecido: true,
            localDesaparecimento: "Praça de teste",
            detalhesDesaparecimento: "Fluxo automatizado de CI"
        }
    });

    const occurrenceCreated = await request("/api/ocorrencias", {
        method: "POST",
        token: citizen.token,
        expected: [201],
        body: {
            tipo: "Resgate",
            categoria: "resgate",
            assunto: "Animal ferido - CI",
            opcaoEscolhida: "Animal ferido - CI",
            localizacao: "Rua de Teste, 100",
            detalhes: "Ocorrência criada para validar o fluxo completo do Safe Life.",
            foto: IMAGE_1PX,
            prioridade: "ALTA",
            gps: {
                latitude: -25.43,
                longitude: -49.27,
                enderecoCompleto: "Rua de Teste, 100, Curitiba - PR",
                bairro: "Centro",
                cidade: "Curitiba",
                estado: "PR"
            }
        }
    });

    const occurrence = occurrenceCreated.data.data;
    assert(occurrence.id, "Ocorrência não retornou ID.");
    assert(occurrence.previsao_atendimento, "Ocorrência não recebeu previsão inicial.");

    const initialNotifications = await request("/api/users/11111111111/notifications-v18", {
        token: citizen.token,
        expected: [200]
    });
    const initialNotice = initialNotifications.data.find(
        (item) => item.tipo === "OCORRENCIA_RECEBIDA" &&
                  Number(item.dados?.ocorrenciaId) === Number(occurrence.id)
    );
    assert(initialNotice, "Notificação inicial da ocorrência não foi criada.");
    assert(
        String(initialNotice.message).includes("5 dias úteis"),
        "Notificação inicial não informa o SLA de 5 dias úteis."
    );
    assert(
        String(initialNotice.message).includes("Solicitação registrada em"),
        "Notificação inicial não informa a data do pedido."
    );
    assert(
        String(initialNotice.message).includes("Prazo estimado de resolução"),
        "Notificação inicial não informa a data limite."
    );

    const anonymous = await request("/api/ocorrencias/anonima", {
        method: "POST",
        expected: [201],
        body: {
            tipo: "Denúncia Anônima",
            categoria: "maus-tratos",
            assunto: "Denúncia CI",
            opcaoEscolhida: "Maus-tratos - CI",
            localizacao: "Rua Anônima, 50",
            detalhes: "Denúncia criada pelo teste automatizado.",
            foto: IMAGE_1PX,
            prioridade: "NORMAL"
        }
    });
    assert(anonymous.data.data.id, "Denúncia anônima não retornou ID.");

    const professional = await login("22222222222", "professional", "123456", {
        company: "Safe Life Matriz"
    });
    assert.strictEqual(professional.user.nome, "Antonio Funcionário");

    const professionalProfile = await request("/api/users/22222222222", {
        token: professional.token,
        expected: [200]
    });
    assert.strictEqual(professionalProfile.data.nome, "Antonio Funcionário", "Perfil do funcionário retornou nome incorreto.");

    await request("/api/dashboard/resumo", {
        token: professional.token,
        expected: [403]
    });

    const queue = await request("/api/pro/ocorrencias", {
        token: professional.token,
        expected: [200]
    });
    assert(
        queue.data.some((item) => item.origem === "ocorrencia" && Number(item.id) === Number(occurrence.id)),
        "Ocorrência do cidadão não apareceu na fila profissional."
    );
    assert(
        queue.data.some((item) => item.origem === "anonima" && Number(item.id) === Number(anonymous.data.data.id)),
        "Denúncia anônima não apareceu na fila profissional."
    );

    await request(`/api/chamados/ocorrencia/${occurrence.id}/status`, {
        method: "PATCH",
        token: professional.token,
        expected: [200],
        body: {
            status: "EM_ATENDIMENTO",
            previsaoAtendimento: String(occurrence.previsao_atendimento).slice(0, 10),
            observacao: "Atendimento iniciado pelo CI"
        }
    });

    await request(`/api/chamados/ocorrencia/${occurrence.id}/status`, {
        method: "PATCH",
        token: professional.token,
        expected: [200],
        body: {
            status: "CONCLUIDA",
            observacao: "Atendimento concluído pelo CI"
        }
    });

    const citizenUpdates = await request("/api/users/11111111111/notifications-v18", {
        token: citizen.token,
        expected: [200]
    });
    assert(
        citizenUpdates.data.some(
            (item) => item.tipo === "OCORRENCIA_CONCLUIDA" &&
                      Number(item.dados?.ocorrenciaId) === Number(occurrence.id)
        ),
        "Cidadão não recebeu a notificação de conclusão."
    );

    const admin = await login("33333333333", "admin");
    assert.strictEqual(admin.user.nome, "Antonio Administrador");

    const adminProfile = await request("/api/admin/users/33333333333", {
        token: admin.token,
        expected: [200]
    });
    assert.strictEqual(adminProfile.data.nome, "Antonio Administrador", "Perfil do administrador retornou nome incorreto.");

    const adminUsers = await request("/api/admin/users", {
        token: admin.token,
        expected: [200]
    });
    for (const cpf of ["11111111111", "22222222222", "33333333333"]) {
        assert(adminUsers.data.some((user) => user.cpf === cpf), `Conta demo ${cpf} não apareceu no admin.`);
    }

    const dashboard = await request("/api/dashboard/resumo", {
        token: admin.token,
        expected: [200]
    });
    assert(Number.isInteger(dashboard.data.usuarios), "Dashboard admin não retornou contador de usuários.");
    assert(Number.isInteger(dashboard.data.ocorrencias), "Dashboard admin não retornou contador de ocorrências.");
    assert(Number.isInteger(dashboard.data.denunciasAnonimas), "Dashboard admin não retornou contador de denúncias.");

    const audit = await request("/api/admin/auditoria", {
        token: admin.token,
        expected: [200]
    });
    assert(Array.isArray(audit.data), "Auditoria administrativa não retornou lista.");

    await request("/api/admin/auditoria", {
        token: citizen.token,
        expected: [403]
    });

    await request("/api/debug/views", {
        token: admin.token,
        expected: [200]
    });

    const companyCreated = await request("/api/admin/empresas", {
        method: "POST",
        token: admin.token,
        expected: [201],
        body: {
            nome: "Base CI Safe Life",
            tipo: "Base de teste",
            telefone: "(41) 90000-9999",
            email: "ci@safelife.test",
            endereco: "Ambiente isolado de CI"
        }
    });

    await request(`/api/admin/empresas/${companyCreated.data.empresa.id}`, {
        method: "DELETE",
        token: admin.token,
        expected: [200]
    });

    await request(`/api/pets/${petId}`, {
        method: "DELETE",
        token: citizen.token,
        expected: [200]
    });

    console.log("✓ cidadão: login, sessão, perfil, empresas, pet, desaparecimento, ocorrência e notificações");
    console.log("✓ funcionário: login, perfil, fila, atendimento e conclusão");
    console.log("✓ admin: login, perfil, usuários, dashboard, auditoria, views e empresas");
    console.log("✓ autorização: cidadão/funcionário bloqueados em rotas administrativas");
    console.log("✓ SLA: notificação inicial informa data do pedido e resolução em até 5 dias úteis");
})().catch((error) => {
    console.error("✗ Falha no teste de integração:");
    console.error(error);
    process.exit(1);
});
