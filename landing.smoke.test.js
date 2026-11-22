"use strict";
// Safe Life: regressões essenciais da landing, sem alterar telas operacionais.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const html = fs.readFileSync("index.html", "utf8");
const css = fs.readFileSync("landing.css", "utf8");
const js = fs.readFileSync("landing.js", "utf8");
const server = fs.readFileSync("server.js", "utf8");
for (const id of ["welcomeScreen","slHeroImg","slMap","slCaseList","slToggleCases","locationScreen"]) {
  assert(html.includes('id="' + id + '"'), "Elemento ausente: " + id);
}
assert(html.includes("nextScreen('locationScreen')"), "A navegação original para GPS foi removida");
assert(html.includes('src="./hero-photo.jpg"'), "Foto local do hero ausente");
assert(css.includes("#welcomeScreen .sl-hero-media"), "Hero sem CSS isolado");
assert(css.includes("#welcomeScreen .sl-map"), "Mapa sem CSS isolado");
assert(js.includes("L.featureGroup().addTo(lmap)"), "Camada de mapa não suporta getBounds");
assert(js.includes("/api/landing/ocorrencias-demo"), "API da landing não ligada");
assert((js.match(/"bairro":/g) || []).length === 12, "Não há 12 casos demonstrativos de fallback");
assert(server.includes('app.get("/api/landing/ocorrencias-demo"'), "Endpoint demonstrativo ausente");
for(const file of ["hero-photo.jpg","about-photo.jpg","cta-cat-photo.jpg"]) {
  assert(fs.statSync(file).size > 15000, "Fotografia faltando: " + file);
}
console.log("Landing Safe Life: 12 ocorrências, imagem real, navegação e mapa verificados (checagem estática).");
