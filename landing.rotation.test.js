"use strict";
/* Safe Life — teste isolado de rotacao, privacidade e status da vitrine.
 * Todas as insercoes e atualizacoes do teste sao revertidas com ROLLBACK. */
const assert = require("node:assert/strict");
const { Pool } = require("pg");

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: false });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const before = await client.query("SELECT id, fonte FROM landing_casos_publicos ORDER BY id");
    assert.equal(before.rowCount, 12, "A vitrine deve conter exatamente 12 registros");
    const inserted = await client.query(`
      INSERT INTO denuncias_anonimas
       (tipo,categoria,assunto,localizacao,detalhes,bairro,cidade,estado,latitude,longitude)
      VALUES ('SOS teste', 'abandono', 'Rua privada e nome pessoal sigiloso',
              'Rua confidencial 22', 'Contato privado 99999', 'Centro',
              'Araucária', 'PR', -25.59212345, -49.41234567)
      RETURNING id
    `);
    const id = inserted.rows[0].id;
    const after = await client.query("SELECT * FROM landing_casos_publicos ORDER BY id");
    assert.equal(after.rowCount, 12, "Novo registro deve substituir exatamente uma posicao");
    const changed = after.rows.find((row) => row.fonte === "anonima" && row.origem_id === id);
    assert(changed, "Nova denuncia anonima nao entrou na vitrine");
    assert.notEqual(Number(changed.lat), -25.59212345, "GPS exato vazou");
    assert.notEqual(Number(changed.lng), -49.41234567, "GPS exato vazou");
    assert(!/confidencial|privad|sigiloso|99999|rua privada/i.test(
       JSON.stringify({ title:changed.titulo, description:changed.texto, action:changed.acao })
    ), "Texto privado vazou");
    await client.query("UPDATE denuncias_anonimas SET status='CONCLUIDA' WHERE id=$1", [id]);
    const status = await client.query("SELECT status FROM landing_casos_publicos WHERE fonte='anonima' AND origem_id=$1", [id]);
    assert.equal(status.rows[0]?.status, "done", "Conclusao deve atualizar status sem remover o registro");
    const retained = await client.query("SELECT count(*)::int AS total FROM landing_casos_publicos");
    assert.equal(retained.rows[0].total, 12, "Conclusao nao deve reduzir o numero de cartoes");
    await client.query("ROLLBACK");
    console.log("Vitrine: 12 posicoes, rotacao por nova denuncia, privacidade e status OK (rollback)");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
