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

    var STATUS = {
        open:     { label: "Pedido realizado", cls: "open" },
        progress: { label: "Em atendimento",   cls: "progress" },
        done:     { label: "Concluído",        cls: "done" }
    };

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
    var cases = [
        { id: 1, x: 24, y: 30, bairro: "Capela Velha", tipo: "Maus-tratos", status: "done", animal: "Thor", tutor: "Marcos S.", foto: IMG.cao, texto: "Encontrado acorrentado sem água. Resgatado, tratado e adotado.", data: "há 2 dias" },
        { id: 2, x: 50, y: 52, bairro: "Centro", tipo: "Abandono", status: "progress", animal: "Mel", tutor: "Ana P.", foto: IMG.gato, texto: "Gata abandonada em terreno baldio, em recuperação com a equipe.", data: "há 1 dia" },
        { id: 3, x: 76, y: 28, bairro: "Iguaçu", tipo: "Resgate", status: "done", animal: "Piu e Pipo", tutor: "Carlos R.", foto: IMG.ave, texto: "Periquitos mantidos presos em gaiola pequena. Resgatados e encaminhados à reabilitação.", data: "há 4 dias" },
        { id: 4, x: 62, y: 74, bairro: "Costeira", tipo: "Maus-tratos", status: "open", animal: "Tico", tutor: "Julia M.", foto: IMG.silvestre, texto: "Galinha mantida em gaiola apertada. Aguardando a equipe.", data: "há 20 min" }
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

    var PIN = '<svg viewBox="0 0 24 32" aria-hidden="true"><path d="M12 0C5.4 0 0 5.2 0 11.7 0 20 12 32 12 32s12-12 12-20.3C24 5.2 18.6 0 12 0z"/><circle cx="12" cy="11.5" r="4.4" fill="#fff"/></svg>';

    function esc(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }

    /* ---------- mapa base (SVG cinza) ---------- */
    function baseMap() {
        var blocks = "";
        // quadras em grade, ligeiramente irregulares
        for (var r = 0; r < 9; r++) {
            for (var c = 0; c < 12; c++) {
                var x = 18 + c * 48 + (r % 2) * 6;
                var y = 14 + r * 48;
                var w = 36 + ((c * 7 + r * 3) % 8);
                var h = 34 + ((c * 5 + r * 11) % 8);
                blocks += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5" fill="#f1f3f7"/>';
            }
        }
        return '' +
            '<svg viewBox="0 0 600 460" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Mapa estilizado de Araucária">' +
            '<rect width="600" height="460" fill="#dfe3ea"/>' +
            blocks +
            // áreas verdes
            '<rect x="404" y="214" width="92" height="62" rx="14" fill="#dbe6df"/>' +
            '<rect x="64"  y="300" width="84" height="56" rx="14" fill="#dbe6df"/>' +
            // rio
            '<path d="M-10 330 C 90 300, 170 380, 280 350 S 470 290, 620 340" fill="none" stroke="#c4d3e6" stroke-width="26" stroke-linecap="round"/>' +
            '<path d="M-10 330 C 90 300, 170 380, 280 350 S 470 290, 620 340" fill="none" stroke="#d3deec" stroke-width="14" stroke-linecap="round"/>' +
            // avenidas
            '<path d="M-10 210 L 620 190" stroke="#fff" stroke-width="12" fill="none"/>' +
            '<path d="M290 -10 C 300 120, 270 300, 310 470" stroke="#fff" stroke-width="12" fill="none"/>' +
            '<path d="M-10 90 C 150 130, 330 60, 620 120" stroke="#fff" stroke-width="7" fill="none"/>' +
            '<path d="M120 -10 C 150 140, 90 300, 130 470" stroke="#fff" stroke-width="7" fill="none"/>' +
            '<path d="M470 -10 C 440 150, 520 300, 480 470" stroke="#fff" stroke-width="7" fill="none"/>' +
            // rótulos
            '<g font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="700" fill="#8f98ab" letter-spacing=".08em">' +
            '<text x="262" y="226">CENTRO</text>' +
            '<text x="46"  y="150">CAPELA VELHA</text>' +
            '<text x="410" y="124">IGUAÇU</text>' +
            '<text x="326" y="296">COSTEIRA</text>' +
            '<text x="70"  y="290">FAZENDA VELHA</text>' +
            '<text x="448" y="250">TINDIQUERA</text>' +
            '<text x="216" y="396">BOQUEIRÃO</text>' +
            '</g>' +
            '</svg>';
    }

    /* ---------- render do mapa ---------- */
    var mapEl, popupEl, activeId = null;

    function renderMap() {
        mapEl.innerHTML = baseMap();
        cases.forEach(function (c) {
            var st = STATUS[c.status] || STATUS.open;
            var b = document.createElement("button");
            b.type = "button";
            b.className = "lp-pin " + st.cls;
            b.style.left = c.x + "%";
            b.style.top = c.y + "%";
            b.setAttribute("aria-label", c.tipo + " em " + c.bairro + " — " + st.label);
            b.innerHTML = '<img src="' + esc(c.foto) + '" alt="' + esc(c.animal) + '"><b>' + esc(c.animal) + "</b>";
            b.addEventListener("click", function (e) {
                e.stopPropagation();
                openPopup(c, b);
            });
            fallbackImg(b.querySelector("img"));
            mapEl.appendChild(b);
        });
    }

    function openPopup(c, pin) {
        var st = STATUS[c.status] || STATUS.open;
        activeId = c.id;
        mapEl.querySelectorAll(".lp-pin").forEach(function (p) { p.classList.remove("is-active"); });
        pin.classList.add("is-active");
        popupEl.hidden = false;
        popupEl.innerHTML =
            '<img src="' + esc(c.foto) + '" alt="' + esc(c.animal) + '">' +
            '<button type="button" class="lp-x" aria-label="Fechar">×</button>' +
            '<div class="lp-popup-body"><h4>' + esc(c.animal) + " · " + esc(c.bairro) + "</h4>" +
            "<p>" + esc(c.texto) + "</p><p><small>Tutor(a): " + esc(c.tutor) + "</small></p>" +
            '<span class="lp-badge ' + st.cls + '">' + (c.status === "done" ? "Resgatado" : st.label) + "</span> <small>" + esc(c.data) + "</small></div>";
        fallbackImg(popupEl.querySelector("img"));
        popupEl.querySelector(".lp-x").addEventListener("click", closePopup);
    }

    function closePopup() {
        popupEl.hidden = true;
        activeId = null;
        mapEl.querySelectorAll(".lp-pin").forEach(function (p) { p.classList.remove("is-active"); });
    }

    /* ---------- seção "Animais atendidos" ---------- */
    function renderCases() {
        var el = document.getElementById("lpStats");
        if (!el) return;
        var n = function (f) { return cases.filter(f).length; };
        el.innerHTML =
            '<div class="lp-stat"><b>' + n(function (c) { return c.status === "done"; }) + "</b><span>Animais resgatados</span></div>" +
            '<div class="lp-stat"><b>' + n(function (c) { return c.tipo === "Maus-tratos"; }) + "</b><span>Casos de maus-tratos</span></div>" +
            '<div class="lp-stat"><b>' + n(function (c) { return c.tipo === "Abandono"; }) + "</b><span>Casos de abandono</span></div>";
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

    function renderAll() {
        if (!mapEl) return;
        renderMap();
        renderCases();
    }

    function init() {
        initCarousel();
        mapEl = document.getElementById("lpMap");
        popupEl = document.getElementById("lpPopup");
        if (!mapEl || !popupEl) return;
        mapEl.addEventListener("click", closePopup);
        document.addEventListener("keydown", function (e) { if (e.key === "Escape") closePopup(); });
        renderAll();
    }

    window.SafeLifeLanding = {
        setCases: function (list) {
            if (Array.isArray(list)) { cases = list; closePopup(); renderAll(); }
        }
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
