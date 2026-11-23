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
assert(js.includes("/api/landing/ocorrencias"), "API pública da landing não ligada");
assert(!html.includes('id="slCaseDialog"'), "A janela de foto e detalhes não deve existir no mapa público");
assert(html.includes('id="adminOccurrenceDetailDialog"'), "Janela de detalhes admin ausente");
assert(!js.includes("openCaseDialog("), "O mapa público não deve abrir galeria ou detalhes completos");
assert(js.includes("m.marker.openPopup()"), "Os cards devem localizar a ocorrência no mapa");
assert(!js.includes("wrap.appendChild(image)"), "Pop-ups não devem exibir fotos repetidas");
assert(server.includes("foto_url"), "API não retorna as fotos dos casos");
assert(adminJs.includes("abrirDetalheCentralOcorrenciasAdmin"), "Detalhes clicáveis do admin ausentes");
assert(!html.includes(">No mapa</button>"), "A central não deve exibir o filtro ilustrativo No mapa");
assert(html.includes(">SOS Emergência</button>") && html.includes(">Pets desaparecidos</button>"), "Categorias do cidadão devem aparecer na central");
assert(js.includes('item.status === "done"'), "Ocorrências concluídas devem ser filtradas do mapa público");
assert(!js.includes("sl-popup-detail-btn") && !js.includes("POPUP_DEMO"), "Não renderizar link ou aviso de exemplo no mapa");
assert(server.includes("o.status NOT IN ('CONCLUIDA','CANCELADA')"), "API pública deve ocultar concluídos");
assert(server.includes("p.fonte = 'ocorrencia'"), "API pública deve excluir denúncias anônimas");
assert(html.includes("É simples! É rápido! É por eles!"), "Título principal deve usar exclamações");
assert(!html.includes("Projeto acadêmico de TCC"), "Remover referência acadêmica da landing");

assert(!js.includes("DEMO_CASES"), "A landing não pode criar os 12 casos antigos sem consultar a API");
assert(js.includes("visibleCases().forEach") && js.includes("visible.forEach"), "Os filtros precisam atualizar o mapa e a lista");
assert(js.includes("initCategoryFilters()"), "Filtros da Central do Cidadão não estão ligados");
assert(html.includes("data-category=\"SOS Emergência\"") && html.includes("data-category=\"Solicitar Resgate\"") && html.includes("data-category=\"Reportar Ocorrência\""), "Filtros diferentes das opções reais do cidadão");
assert(html.includes("Aguardando atendimento") && html.includes("Em atendimento"), "Legenda com etapas públicas incorretas");
assert(!html.includes("sl-legend-done"), "Concluído não pode aparecer na legenda pública");
assert(css.includes('url("./about-photo.jpg")'), "Foto original da seção Sobre ausente");
assert(fs.statSync("about-photo.jpg").size > 20000, "A foto nova da seção Sobre está ausente");
assert(!html.includes("A proposta é aproximar a comunidade"), "Texto antigo da seção Sobre ainda presente");
assert(!/Ver foto e detalhes/i.test(html + js), "Botão indesejado ainda aparece na landing");
assert(!adminJs.includes('" · Exemplo"') && !adminJs.includes('" [EXEMPLO]"'), "Rótulos de exemplo continuam visíveis nos painéis");
assert(adminJs.includes("textoOcorrenciaVisivel"), "Os textos demonstrativos não são limpos antes de aparecer");
assert(fs.existsSync("migrations/20261123_ocorrencias_sem_rotulos_de_teste.sql"), "Migração de limpeza dos rótulos não existe");
assert(!/\bTCC\b/i.test(html + css + js + adminJs), "A interface não pode fazer referência ao TCC");
assert(server.includes('app.get(["/api/landing/ocorrencias", "/api/landing/ocorrencias-demo"]'), "Endpoint público de ocorrências ausente");
assert(server.includes("lower(coalesce(o.categoria"), "Tipos do mapa devem refletir as categorias do cidadão");
for(const file of ["landing-cao-abrigo-primeiro-plano.jpg","landing-abrigo-sobre.jpg","landing-abrigo-cta-opcao.jpg"]) {
  assert(fs.statSync(file).size > 15000, "Fotografia faltando: " + file);
}
for (const file of [
    "landing-abrigo-hero.jpg", "landing-abrigo-hero-opcao.jpg",
    "landing-abrigo-sobre.jpg", "landing-abrigo-cta.jpg",
    "landing-abrigo-cta-opcao.jpg", "landing-cao-abrigo-pb.jpg"
]) assert(fs.statSync(file).size > 15000, "Fotografia ilustrativa indisponível: " + file);
console.log("Landing e Admin: categorias do cidadão, casos ativos, fotos locais e integração com API verificados.");
