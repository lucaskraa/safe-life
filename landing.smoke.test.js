"use strict";
// Safe Life: regressões essenciais da landing, sem alterar telas operacionais.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("landing.css", "utf8");
const js = fs.readFileSync("landing.js", "utf8");
const server = fs.readFileSync("server.js", "utf8");
const adminJs = fs.readFileSync("script.js", "utf8");
for (const id of ["welcomeScreen","slHeroImg","slMap","slCaseList","slToggleCases","locationScreen"]) {
  assert(html.includes('id="' + id + '"'), "Elemento ausente: " + id);
}
assert(html.includes("nextScreen('locationScreen')"), "A navegação original para GPS foi removida");
assert(html.includes('src="./landing-cao-abrigo-primeiro-plano.jpg"'), "Foto local do hero ausente");
assert(css.includes("#welcomeScreen .sl-hero-media"), "Hero sem CSS isolado");
assert(css.includes("#welcomeScreen .sl-map"), "Mapa sem CSS isolado");
assert(css.includes("#welcomeScreen .sl-hero::after {content:none!important"), "Curva clara do hero não removida");
assert(css.includes("#welcomeScreen.screen,") && css.includes("padding:0!important"), "Espaço inferior da landing não removido");
assert(js.includes("L.featureGroup().addTo(lmap)"), "Camada de mapa não suporta getBounds");
assert(js.includes("/api/landing/ocorrencias-demo"), "API da landing não ligada");
assert(html.includes('id="slCaseDialog"'), "Janela de detalhes da landing ausente");
assert(html.includes('id="adminOccurrenceDetailDialog"'), "Janela de detalhes admin ausente");
assert(js.includes("openCaseDialog(c)"), "Os cards da landing não abrem as fotos e detalhes");
assert(js.includes("sl-popup-photo"), "Fotos ausentes dos popups do mapa");
assert(server.includes("foto_url"), "API não retorna as fotos dos casos");
assert(adminJs.includes("abrirDetalheCentralOcorrenciasAdmin"), "Detalhes clicáveis do admin ausentes");
assert(!html.includes(">No mapa</button>"), "A central não deve exibir o filtro ilustrativo No mapa");
assert(html.includes(">SOS Emergência</button>") && html.includes(">Pets desaparecidos</button>"), "Categorias do cidadão devem aparecer na central");
assert(js.includes('item.status === "done"'), "Ocorrências concluídas devem ser filtradas do mapa público");
assert(!js.includes("sl-popup-detail-btn"), "Remover link de foto e detalhes do mapa");
assert(server.includes("WHERE status IS DISTINCT FROM 'done'"), "API pública deve ocultar concluídos");
assert(html.includes("É simples! É rápido! É por eles!"), "Título principal deve usar exclamações");
assert(!html.includes("Projeto acadêmico de TCC"), "Remover referência acadêmica da landing");

assert((js.match(/"bairro":/g) || []).length === 12, "Não há 12 casos demonstrativos de fallback");
assert(server.includes('app.get("/api/landing/ocorrencias-demo"'), "Endpoint demonstrativo ausente");
for(const file of ["landing-cao-abrigo-primeiro-plano.jpg","landing-abrigo-sobre.jpg","landing-abrigo-cta-opcao.jpg"]) {
  assert(fs.statSync(file).size > 15000, "Fotografia faltando: " + file);
}
for (const file of [
    "landing-abrigo-hero.jpg", "landing-abrigo-hero-opcao.jpg",
    "landing-abrigo-sobre.jpg", "landing-abrigo-cta.jpg",
    "landing-abrigo-cta-opcao.jpg", "landing-cao-abrigo-pb.jpg"
]) assert(fs.statSync(file).size > 15000, "Fotografia ilustrativa indisponível: " + file);
console.log("Landing e Admin: categorias do cidadão, casos ativos, fotos locais e integração com API verificados.");
