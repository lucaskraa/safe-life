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
    var cases = [
        { id: 1, x: 47, y: 42, bairro: "Centro",        tipo: "Maus-tratos",       status: "progress", texto: "Denúncia de abandono de cão em terreno baldio. Equipe a caminho.", data: "há 2 h" },
        { id: 2, x: 30, y: 30, bairro: "Capela Velha",  tipo: "Resgate",           status: "open",     texto: "Pedido de resgate de gato ferido na via.", data: "há 25 min" },
        { id: 3, x: 66, y: 28, bairro: "Iguaçu",        tipo: "Emergência",        status: "open",     texto: "Cachorro atropelado. Aguardando equipe.", data: "há 8 min" },
        { id: 4, x: 58, y: 64, bairro: "Costeira",      tipo: "Pet desaparecido",  status: "progress", texto: "Cadela desaparecida há 2 dias. Divulgação em andamento.", data: "há 1 dia" },
        { id: 5, x: 24, y: 62, bairro: "Fazenda Velha", tipo: "Maus-tratos",       status: "done",     texto: "Animal resgatado e encaminhado para cuidados veterinários.", data: "ontem" },
        { id: 6, x: 78, y: 54, bairro: "Tindiquera",    tipo: "Resgate",           status: "done",     texto: "Filhote resgatado e liberado para adoção responsável.", data: "há 3 dias" },
        { id: 7, x: 40, y: 78, bairro: "Boqueirão",     tipo: "Emergência",        status: "done",     texto: "Ave ferida atendida e entregue a centro de reabilitação.", data: "há 5 dias" }
    ];

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
            b.innerHTML = PIN;
            b.addEventListener("click", function (e) {
                e.stopPropagation();
                openPopup(c, b);
            });
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
            '<div class="lp-popup-top"><h4>' + esc(c.tipo) + " · " + esc(c.bairro) + '</h4>' +
            '<button type="button" aria-label="Fechar">×</button></div>' +
            "<p>" + esc(c.texto) + "</p>" +
            '<span class="lp-badge ' + st.cls + '">' + st.label + "</span> " +
            '<small style="color:#8a94ad"> ' + esc(c.data) + "</small>";
        popupEl.querySelector("button").addEventListener("click", closePopup);
    }

    function closePopup() {
        popupEl.hidden = true;
        activeId = null;
        mapEl.querySelectorAll(".lp-pin").forEach(function (p) { p.classList.remove("is-active"); });
    }

    /* ---------- seção "Animais atendidos" ---------- */
    function renderCases() {
        var statsEl = document.getElementById("lpStats");
        var listEl = document.getElementById("lpCases-list");
        if (!statsEl || !listEl) return;

        var done = cases.filter(function (c) { return c.status === "done"; });
        var prog = cases.filter(function (c) { return c.status === "progress"; });

        statsEl.innerHTML =
            '<div class="lp-stat"><b>' + cases.length + "</b><span>Chamados registrados</span></div>" +
            '<div class="lp-stat"><b>' + prog.length + "</b><span>Em atendimento agora</span></div>" +
            '<div class="lp-stat"><b>' + done.length + "</b><span>Animais atendidos</span></div>";

        if (!done.length) {
            listEl.innerHTML = '<div class="lp-empty">Os primeiros atendimentos concluídos em Araucária – PR aparecerão aqui.</div>';
            return;
        }
        listEl.innerHTML = done.map(function (c) {
            return '<article class="lp-case"><small>' + esc(c.bairro) + " · " + esc(c.data) + "</small>" +
                "<h3>" + esc(c.tipo) + "</h3><p>" + esc(c.texto) + "</p>" +
                '<span class="lp-badge done">Concluído</span></article>';
        }).join("");
    }

    function renderAll() {
        if (!mapEl) return;
        renderMap();
        renderCases();
    }

    function init() {
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
