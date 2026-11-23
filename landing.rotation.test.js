"use strict";
/* Teste transacional: só chamados identificados entram na vitrine pública.
 * Dados reais preservados: todas as operações deste teste sofrem ROLLBACK. */
const assert = require("node:assert/strict");
const { Pool } = require("pg");

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const citizen = await client.query("SELECT id FROM usuarios WHERE cpf='11111111111' AND tipo='citizen' LIMIT 1");
    assert(citizen.rowCount === 1, "A conta demonstrativa de cidadão precisa existir no CI");

    // Denúncias anônimas continuam operacionais, mas NÃO entram no mapa.
    const anonymous = await client.query(`
      INSERT INTO denuncias_anonimas
       (tipo,categoria,assunto,localizacao,detalhes,bairro,cidade,estado,latitude,longitude)
      VALUES ('Denúncia Anônima','anonymous','Caso sigiloso',
              'Rua privada 22','Contato privado 99999','Centro',
              'Araucária','PR',-25.59212345,-49.41234567)
      RETURNING id
    `);
    const anonymousId = anonymous.rows[0].id;
    const noAnonymous = await client.query(
      "SELECT id FROM landing_casos_publicos WHERE fonte='anonima' AND origem_id=$1",[anonymousId]
    );
    assert.equal(noAnonymous.rowCount,0,"Denúncia anônima apareceu no mapa");

    // O mapa, o profissional e o perfil do cidadão passam a referir
    // a MESMA ocorrência em ocorrencias.usuario_id.
    const inserted = await client.query(`
      INSERT INTO ocorrencias
      (usuario_id,tipo,categoria,assunto,opcao_escolhida,localizacao,detalhes,
       bairro,cidade,estado,latitude,longitude,prioridade,anonima)
      VALUES ($1,'Ocorrência Animal','report','Animal ferido','Animal ferido',
              'Endereço privado 12','Nome privado e telefone 99999',
              'Centro','Araucária','PR',-25.59212345,-49.41234567,'NORMAL',FALSE)
      RETURNING id,usuario_id
    `,[citizen.rows[0].id]);
    const caseId = inserted.rows[0].id;
    assert.equal(inserted.rows[0].usuario_id,citizen.rows[0].id);

    const publicCase = await client.query(
      "SELECT * FROM landing_casos_publicos WHERE fonte='ocorrencia' AND origem_id=$1",[caseId]
    );
    assert.equal(publicCase.rowCount,1,"Chamado identificado não atualizou mapa");
    const row = publicCase.rows[0];
    assert.notEqual(Number(row.lat),-25.59212345,"Coordenada precisa foi publicada");
    assert.notEqual(Number(row.lng),-49.41234567,"Coordenada precisa foi publicada");
    assert.equal(row.tipo,"Reportar Ocorrência","Categoria pública não coincide com a do cidadão");
    assert(!/privado|99999/i.test(JSON.stringify({texto:row.texto,titulo:row.titulo,acao:row.acao})),
      "O mapa divulgou informação confidencial");

    await client.query("UPDATE ocorrencias SET status='EM_ATENDIMENTO' WHERE id=$1",[caseId]);
    let status = await client.query("SELECT status FROM landing_casos_publicos WHERE origem_id=$1 AND fonte='ocorrencia'",[caseId]);
    assert.equal(status.rows[0]?.status,"progress","Status da vitrine não acompanhou atendimento");
    await client.query("UPDATE ocorrencias SET status='CONCLUIDA' WHERE id=$1",[caseId]);
    status = await client.query("SELECT status FROM landing_casos_publicos WHERE origem_id=$1 AND fonte='ocorrencia'",[caseId]);
    assert.equal(status.rows[0]?.status,"done","Histórico da vitrine deve preservar status concluído");
    const visible = await client.query(
      "SELECT id FROM landing_casos_publicos WHERE origem_id=$1 AND fonte='ocorrencia' AND status <> 'done'",[caseId]
    );
    assert.equal(visible.rowCount,0,"Concluído não pode continuar visível no mapa");

    const seeded = await client.query(`
       SELECT o.id, o.usuario_id FROM ocorrencias o
       WHERE o.demonstrativo AND o.demo_origem_id IS NOT NULL
    `);
    assert(seeded.rowCount>=1,"Os exemplos não foram vinculados à conta de demonstração");
    assert(seeded.rows.every(x=>x.usuario_id===citizen.rows[0].id),
      "Exemplo vinculado à conta errada");
    const labels = await client.query(`
      SELECT count(*)::int AS total FROM ocorrencias
      WHERE demonstrativo=TRUE
        AND (detalhes ~* 'exemplo ilustrativo'
          OR localizacao ~* '\\(exemplo\\)'
          OR endereco_completo ~* '\\(exemplo\\)')
    `);
    assert.equal(labels.rows[0].total,0,"Rótulos de exemplo ainda estão gravados nos registros de demonstração");

    await client.query("ROLLBACK");
    console.log("Mapa: novo chamado identificado, autoria, privacidade, anonimato e conclusão OK (rollback)");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
