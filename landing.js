/* ==========================================================
   Safe Life — Landing v2
   Mapa cinza de Araucária com pins de chamados + seção de casos.
   Sem dependências externas.

   Para ligar aos dados reais:
     window.SafeLifeLanding.setCases([
       { id, x, y, bairro, tipo, status, texto, data }
     ]);
   x / y = posição em % dentro do mapa (0–100).
   status = "open" | "progress" | "done".
   (use sempre localização aproximada por bairro, nunca o endereço)
   ========================================================== */
(function () {
    "use strict";


    // Dados de exemplo — substitua pelos chamados reais (sem endereço).
    // Coloque as fotos na pasta ./img/ com estes nomes (veja LEIA-ME-IMAGENS.txt).
    // Se um arquivo não existir, aparece a imagem reserva (FALLBACK).
    var FALLBACK = "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80";
    // Fotos do Unsplash (licença livre, sem marca d'água). Créditos:
    // cão: 12photostory | aves: Abhinav Anand | gato: yurii liu | galinha: Timothy McAuliffe
    var IMG = {
        cao: "https://images.unsplash.com/photo-1675701918017-fda8f5bcbf90?auto=format&fit=crop&w=1400&q=80",
        ave: "https://images.unsplash.com/photo-1696256369476-59e07ddbe76c?auto=format&fit=crop&w=1400&q=80",
        gato: "https://images.unsplash.com/photo-1600822089051-b16e78f5708a?auto=format&fit=crop&w=1400&q=80",
        silvestre: "https://images.unsplash.com/photo-1570818929648-83af2b199822?auto=format&fit=crop&w=1400&q=80"
    };
    // x / y em % dentro do mapa. side: "top" ou "bottom" (lado do balão).
    // status: open | progress | done. Use localização aproximada (bairro).
    var cases = [
        { id: 1, x: 14, y: 62, side: "top",    bairro: "Capela Velha", tipo: "Maus-tratos", status: "done",     animal: "Thor", texto: "Cão encontrado acorrentado e sem água. Resgatado, tratado e adotado." },
        { id: 2, x: 38, y: 38, side: "bottom", bairro: "Centro",       tipo: "Abandono",    status: "progress", animal: "Mel",  texto: "Gata abandonada em terreno baldio. Em recuperação com a equipe." },
        { id: 3, x: 62, y: 62, side: "top",    bairro: "Iguaçu",       tipo: "Cativeiro",   status: "done",     animal: "Piu e Pipo", texto: "Periquitos presos em gaiola pequena. Resgatados e reabilitados." },
        { id: 4, x: 86, y: 38, side: "bottom", bairro: "Costeira",     tipo: "Maus-tratos", status: "open",     animal: "Tico", texto: "Galinha mantida em gaiola apertada. Aguardando a equipe." }
    ];
    var SLIDES = [
        { src: IMG.cao, tag: "Abandono e maus-tratos", text: "Viu um animal abandonado ou maltratado? Denuncie e a equipe vai até o local." },
        { src: IMG.ave, tag: "Aves em cativeiro", text: "Aves presas em gaiolas pequenas também podem ser resgatadas." },
        { src: IMG.gato, tag: "Gatos abandonados", text: "Cada chamado vira um atendimento acompanhado do início ao fim." },
        { src: IMG.silvestre, tag: "Maus-tratos", text: "Ajude a dar uma segunda chance a quem foi deixado para trás." }
    ];

    function fallbackImg(el) {
        el.addEventListener("error", function () {
            if (el.src.indexOf("unsplash.com") === -1) el.src = FALLBACK;
        });
    }

    function esc(x) {
        return String(x == null ? "" : x).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    /* ---------- mapa base (SVG cinza, formato esticado) ---------- */
    function baseMap() {
        var blocks = "";
        for (var r = 0; r < 8; r++) {
            for (var c = 0; c < 26; c++) {
                var x = 12 + c * 46 + (r % 2) * 8;
                var y = 8 + r * 50;
                var w = 34 + ((c * 7 + r * 3) % 8);
                var h = 32 + ((c * 5 + r * 11) % 8);
                blocks += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="#eceff4"/>';
            }
        }
        return '<svg viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden="true">' +
            '<rect width="1200" height="400" fill="#dde1e9"/>' + blocks +
            '<rect x="860" y="250" width="150" height="70" rx="16" fill="#d6e3da"/>' +
            '<rect x="120" y="290" width="130" height="60" rx="16" fill="#d6e3da"/>' +
            '<path d="M-10 330 C 200 290, 380 370, 620 335 S 980 290, 1210 345" fill="none" stroke="#c3d2e5" stroke-width="30" stroke-linecap="round"/>' +
            '<path d="M-10 330 C 200 290, 380 370, 620 335 S 980 290, 1210 345" fill="none" stroke="#d3deec" stroke-width="16" stroke-linecap="round"/>' +
            '<path d="M-10 190 L 1210 170" stroke="#fff" stroke-width="14" fill="none"/>' +
            '<path d="M-10 90 C 300 120, 700 60, 1210 110" stroke="#fff" stroke-width="8" fill="none"/>' +
            '<path d="M300 -10 C 320 120, 280 280, 310 410" stroke="#fff" stroke-width="10" fill="none"/>' +
            '<path d="M600 -10 C 590 120, 620 280, 600 410" stroke="#fff" stroke-width="14" fill="none"/>' +
            '<path d="M900 -10 C 920 120, 880 280, 910 410" stroke="#fff" stroke-width="10" fill="none"/>' +
            '</svg>';
    }

    var LABELS = [
        ["CAPELA VELHA", 8, 22], ["CENTRO", 30, 78], ["IGUAÇU", 56, 22],
        ["COSTEIRA", 80, 78], ["FAZENDA VELHA", 3, 88], ["TINDIQUERA", 88, 22]
    ];

    var STATUS = { open: "open", progress: "progress", done: "done" };
    var mapEl;

    function renderMap() {
        var html = '<div class="lp-map-base">' + baseMap() + "</div>";
        LABELS.forEach(function (l) {
            html += '<span class="lp-label" style="left:' + l[1] + "%;top:" + l[2] + '%">' + l[0] + "</span>";
        });
        cases.forEach(function (c) {
            html += '<div class="lp-spot ' + (STATUS[c.status] || "open") + " " + (c.side === "bottom" ? "below" : "above") +
                '" style="left:' + c.x + "%;top:" + c.y + '%" data-id="' + c.id + '">' +
                '<button type="button" class="lp-dot" aria-label="' + esc(c.tipo + " em " + c.bairro) + '"></button>' +
                '<div class="lp-bubble"><small>' + esc(c.bairro) + "</small>" +
                "<strong>" + esc(c.tipo) + " · " + esc(c.animal) + "</strong>" +
                "<p>" + esc(c.texto) + "</p></div></div>";
        });
        mapEl.innerHTML = html;
        mapEl.querySelectorAll(".lp-spot").forEach(function (sp) {
            sp.querySelector(".lp-dot").addEventListener("click", function (e) {
                e.stopPropagation();
                var was = sp.classList.contains("is-open");
                mapEl.querySelectorAll(".lp-spot").forEach(function (o) { o.classList.remove("is-open"); });
                if (!was) sp.classList.add("is-open");
            });
        });
    }

    /* ---------- carrossel ---------- */
    function initCarousel() {
        var img = document.getElementById("lpCarouselImg");
        if (!img) return;
        var tag = document.getElementById("lpCarouselTag"), txt = document.getElementById("lpCarouselText"), dots = document.getElementById("lpDots");
        var i = 0, t;
        fallbackImg(img);
        dots.innerHTML = SLIDES.map(function (_, k) { return '<button type="button" aria-label="Slide ' + (k + 1) + '"></button>'; }).join("");
        function show(k) {
            i = (k + SLIDES.length) % SLIDES.length;
            img.classList.add("is-fading");
            setTimeout(function () {
                img.src = SLIDES[i].src; img.alt = SLIDES[i].tag;
                tag.textContent = SLIDES[i].tag; txt.textContent = SLIDES[i].text;
                img.classList.remove("is-fading");
            }, 200);
            [].forEach.call(dots.children, function (d, j) { d.classList.toggle("on", j === i); });
        }
        function start() { clearInterval(t); t = setInterval(function () { show(i + 1); }, 4800); }
        [].forEach.call(dots.children, function (d, j) { d.addEventListener("click", function () { show(j); start(); }); });
        show(0); start();
    }

    function init() {
        initCarousel();
        mapEl = document.getElementById("lpMap");
        if (!mapEl) return;
        renderMap();
        mapEl.addEventListener("click", function () {
            mapEl.querySelectorAll(".lp-spot").forEach(function (o) { o.classList.remove("is-open"); });
        });
    }

    window.SafeLifeLanding = {
        setCases: function (list) {
            if (Array.isArray(list) && mapEl) { cases = list; renderMap(); }
        }
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
