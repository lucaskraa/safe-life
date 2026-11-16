/* ==========================================================
   Safe Life — Landing v5
   Mapa ilustrativo de Araucária + carrossel + seção de casos.
   JavaScript puro, sem dependências.

   Integração com dados reais (API pública, inalterada):
     window.SafeLifeLanding.setCases([
       { id, x, y, bairro, tipo, status, texto, data,
         titulo, acao, lat, lng, animal }   // os 5 últimos são opcionais
     ]);
   - x / y: posição em % no mapa ilustrativo (0–100), usado quando não há lat/lng.
   - lat / lng: posição aproximada do BAIRRO (nunca do endereço). Se TODOS os chamados
     tiverem lat/lng, o mapa real (Leaflet + OpenStreetMap) é carregado.
   - status: "open" | "progress" | "done".
   - Use sempre localização aproximada por bairro, nunca endereço.
   - Só os campos acima são lidos; qualquer outro campo é ignorado.
   ========================================================== */
(function () {
    "use strict";

    /* ---------- constantes e dados de exemplo ---------- */

    var CAROUSEL_DELAY = 5000;
    var MAX_LEN = { bairro: 60, tipo: 60, animal: 60, titulo: 80, texto: 320, acao: 320 };
    var DEMO_TEXT = "Dados demonstrativos do TCC — ocorrências fictícias utilizadas para apresentar as funcionalidades do Safe Life.";
    var LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    var LEAFLET_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    var ARAUCARIA = [-25.593, -49.405];

    var STATUS = {
        open:     { label: "Em análise",   stat: "Em análise",              glyph: "!" },
        progress: { label: "Em atendimento", stat: "Em atendimento",        glyph: "…" },
        done:     { label: "Concluído",    stat: "Concluídos",              glyph: "✓" }
    };
    var STATUS_ORDER = ["open", "progress", "done"];

    // Rótulos de bairros no mapa ilustrativo: [nome, x%, y%] (centro do rótulo)
    var LABELS = [
        ["Capela Velha", 14, 22], ["Centro", 38, 80], ["Iguaçu", 62, 22],
        ["Costeira", 86, 80], ["Fazenda Velha", 17, 90], ["Tindiquera", 86, 22]
    ];

    // Imagem reserva embutida (funciona offline).
    var PLACEHOLDER = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 640">' +
        '<rect width="800" height="640" fill="#dfe6f6"/>' +
        '<g fill="#b9c6e6"><ellipse cx="400" cy="400" rx="110" ry="85"/>' +
        '<ellipse cx="270" cy="270" rx="42" ry="56"/><ellipse cx="360" cy="195" rx="42" ry="56"/>' +
        '<ellipse cx="440" cy="195" rx="42" ry="56"/><ellipse cx="530" cy="270" rx="42" ry="56"/></g></svg>'
    );

    // Fotos do Unsplash (licença livre). Créditos:
    // cão: 12photostory | aves: Abhinav Anand | gato: yurii liu | galinha: Timothy McAuliffe
    var IMG = {
        cao: "https://images.unsplash.com/photo-1675701918017-fda8f5bcbf90?auto=format&fit=crop&w=1400&q=80",
        ave: "https://images.unsplash.com/photo-1696256369476-59e07ddbe76c?auto=format&fit=crop&w=1400&q=80",
        gato: "https://images.unsplash.com/photo-1600822089051-b16e78f5708a?auto=format&fit=crop&w=1400&q=80",
        silvestre: "https://images.unsplash.com/photo-1570818929648-83af2b199822?auto=format&fit=crop&w=1400&q=80"
    };
    var SLIDES = [
        { src: IMG.cao, tag: "Abandono e maus-tratos", text: "Viu um animal abandonado ou maltratado? Denuncie e a equipe vai até o local." },
        { src: IMG.ave, tag: "Aves em cativeiro", text: "Aves presas em gaiolas pequenas também podem ser resgatadas." },
        { src: IMG.gato, tag: "Gatos abandonados", text: "Cada chamado vira um atendimento acompanhado do início ao fim." },
        { src: IMG.silvestre, tag: "Maus-tratos", text: "Ajude a dar uma segunda chance a quem foi deixado para trás." }
    ];

    // Quatro denúncias FICTÍCIAS, só para demonstração (TCC).
    // lat/lng = referência aproximada do bairro (arredondada), não o local de uma denúncia real.
    var cases = [
        { id: "1", x: 38, y: 40, lat: -25.592, lng: -49.409, bairro: "Centro", tipo: "Abandono", status: "done", data: "2026-10-06",
          titulo: "Animal abandonado",
          texto: "Cão encontrado próximo a uma praça, aparentemente sem identificação e necessitando de cuidados.",
          acao: "A ocorrência foi registrada, a equipe foi acionada e o animal foi encaminhado para avaliação e acolhimento." },
        { id: "2", x: 14, y: 30, lat: -25.553, lng: -49.404, bairro: "Capela Velha", tipo: "Maus-tratos", status: "progress", data: "2026-10-20",
          titulo: "Suspeita de maus-tratos",
          texto: "Moradores relataram um cão mantido em condições inadequadas.",
          acao: "A denúncia foi registrada e encaminhada para verificação pela equipe responsável." },
        { id: "3", x: 62, y: 62, lat: -25.598, lng: -49.398, bairro: "Iguaçu", tipo: "Desaparecimento", status: "open", data: "2026-11-03",
          titulo: "Animal desaparecido",
          texto: "Gato rajado desaparecido. O tutor informou o local onde o animal foi visto pela última vez.",
          acao: "As informações foram organizadas para auxiliar na busca e facilitar a divulgação do desaparecimento." },
        { id: "4", x: 86, y: 60, lat: -25.606, lng: -49.372, bairro: "Costeira", tipo: "Resgate", status: "done", data: "2026-11-10",
          titulo: "Pedido de resgate",
          texto: "Filhote encontrado em uma situação de risco, necessitando de atendimento.",
          acao: "O pedido foi registrado e foram fornecidas orientações para o atendimento e encaminhamento do animal." }
    ];
    var demo = true;

    /* ---------- utilitários ---------- */

    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function byId(id) { return document.getElementById(id); }

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    }

    function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }

    function hasOwn(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }

    function cleanStr(v, max) {
        if (v == null) return "";
        var s = String(v).replace(/\s+/g, " ").trim();
        return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
    }

    function normKey(s) {
        return String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    }

    function toPct(v) {
        var n = typeof v === "string" ? parseFloat(v) : v;
        return typeof n === "number" && isFinite(n) ? clamp(n, 0, 100) : null;
    }

    function fmtDate(v) {
        if (v == null || v === "") return "";
        if (typeof v === "string") {
            var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
            if (m) return m[3] + "/" + m[2] + "/" + m[1];
        }
        var d = v instanceof Date ? v : (typeof v === "number" ? new Date(v) : null);
        if (d && !isNaN(d.getTime())) return d.toLocaleDateString("pt-BR");
        return cleanStr(v, 30);
    }

    function toCoord(v, lim) {
        var n = typeof v === "string" ? parseFloat(v) : v;
        return typeof n === "number" && isFinite(n) && Math.abs(n) <= lim ? n : null;
    }

    // Aceita só campos conhecidos; descarta qualquer outra informação (privacidade).
    function sanitizeCase(raw, index) {
        if (!raw || typeof raw !== "object") return null;
        var x = toPct(raw.x), y = toPct(raw.y);
        if (x === null || y === null) return null;
        var lat = toCoord(raw.lat, 90), lng = toCoord(raw.lng, 180);
        if (lat === null || lng === null) { lat = null; lng = null; }
        return {
            id: raw.id != null && raw.id !== "" ? String(raw.id) : "caso-" + index,
            x: x,
            y: y,
            status: hasOwn(STATUS, raw.status) ? raw.status : "open",
            bairro: cleanStr(raw.bairro, MAX_LEN.bairro) || "Bairro não informado",
            tipo: cleanStr(raw.tipo, MAX_LEN.tipo) || "Ocorrência",
            animal: cleanStr(raw.animal, MAX_LEN.animal),
            titulo: cleanStr(raw.titulo, MAX_LEN.titulo),
            acao: cleanStr(raw.acao, MAX_LEN.acao),
            lat: lat,
            lng: lng,
            texto: cleanStr(raw.texto, MAX_LEN.texto),
            data: fmtDate(raw.data)
        };
    }

    function glyphEl(status, cls) {
        var g = el("span", cls || "lp-glyph", STATUS[status].glyph);
        g.setAttribute("aria-hidden", "true");
        return g;
    }

    function badgeEl(status) {
        var b = el("span", "lp-badge", STATUS[status].label);
        b.setAttribute("data-status", status);
        return b;
    }

    /* ==========================================================
       CARROSSEL
       ========================================================== */

    function initCarousel() {
        var img = byId("lpCarouselImg");
        if (!img || !SLIDES.length) return;

        var root = img.closest(".lp-carousel") || img.parentNode;
        var tagEl = byId("lpCarouselTag");
        var textEl = byId("lpCarouselText");
        var dotsEl = byId("lpDots");
        var capEl = textEl ? textEl.parentNode : null;

        var index = -1, timer = 0, fadeTimer = 0, loadToken = 0;
        var failed = Object.create(null);
        var flags = { user: reducedMotion.matches, hover: false, focus: false, hidden: document.hidden, offscreen: false };

        root.setAttribute("role", "region");
        root.setAttribute("aria-roledescription", "carrossel");
        root.setAttribute("aria-label", "Imagens sobre a causa animal");
        img.decoding = "async";

        if (dotsEl) {
            dotsEl.textContent = "";
            dotsEl.setAttribute("role", "group");
            dotsEl.setAttribute("aria-label", "Escolher slide");
            SLIDES.forEach(function (s, k) {
                var b = el("button");
                b.type = "button";
                b.dataset.i = String(k);
                b.setAttribute("aria-label", "Slide " + (k + 1) + " de " + SLIDES.length + ": " + s.tag);
                dotsEl.appendChild(b);
            });
        }

        function canPlay() {
            return SLIDES.length > 1 && !(flags.user || flags.hover || flags.focus || flags.hidden || flags.offscreen);
        }

        function schedule() {
            clearTimeout(timer);
            timer = 0;
            if (canPlay()) {
                timer = setTimeout(function () { show(index + 1); schedule(); }, CAROUSEL_DELAY);
            }
        }

        function updateControls() {
            if (capEl) capEl.setAttribute("aria-live", "off");
        }

        function updateDots() {
            if (!dotsEl) return;
            Array.prototype.forEach.call(dotsEl.children, function (d, j) {
                if (j === index) d.setAttribute("aria-current", "true");
                else d.removeAttribute("aria-current");
            });
        }

        function preload(src, cb) {
            if (failed[src]) { cb(false); return; }
            var p = new Image();
            p.onload = function () { cb(true); };
            p.onerror = function () { failed[src] = true; cb(false); };
            p.src = src;
        }

        function setImage(src) {
            if (src === PLACEHOLDER) img.dataset.fallback = "1";
            else delete img.dataset.fallback;
            img.src = src;
        }

        // Rede de segurança caso a imagem atual falhe depois de aplicada
        img.addEventListener("error", function () {
            if (!img.dataset.fallback) setImage(PLACEHOLDER);
        });

        function show(k) {
            var n = SLIDES.length;
            var next = ((k % n) + n) % n;
            if (next === index) return;
            var first = index === -1;
            index = next;
            var slide = SLIDES[index];
            var token = ++loadToken;
            clearTimeout(fadeTimer);
            updateDots();

            preload(slide.src, function (ok) {
                if (token !== loadToken) return;
                function apply() {
                    if (token !== loadToken) return;
                    setImage(ok ? slide.src : PLACEHOLDER);
                    img.alt = slide.tag;
                    if (tagEl) tagEl.textContent = slide.tag;
                    if (textEl) textEl.textContent = slide.text;
                    root.classList.remove("is-fading");
                    var upcoming = SLIDES[(index + 1) % n];
                    if (upcoming && upcoming !== slide) preload(upcoming.src, function () {});
                }
                if (first || reducedMotion.matches) {
                    apply();
                } else {
                    root.classList.add("is-fading");
                    fadeTimer = setTimeout(apply, 200);
                }
            });
        }

        function go(k) { show(k); schedule(); }

        // Apenas as bolinhas e o gesto de arrastar; sem botões extras
        if (dotsEl) {
            dotsEl.addEventListener("click", function (e) {
                var b = e.target.closest("button");
                if (b && dotsEl.contains(b)) go(parseInt(b.dataset.i, 10));
            });
        }
        root.addEventListener("keydown", function (e) {
            if (e.key === "ArrowLeft") { e.preventDefault(); go(index - 1); }
            else if (e.key === "ArrowRight") { e.preventDefault(); go(index + 1); }
        });

        // Gesto de arrastar (toque e mouse)
        var startX = null;
        root.addEventListener("pointerdown", function (e) {
            if (!e.target.closest("button")) startX = e.clientX;
        });
        root.addEventListener("pointerup", function (e) {
            if (startX === null) return;
            var dx = e.clientX - startX;
            startX = null;
            if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        });
        root.addEventListener("pointercancel", function () { startX = null; });

        // Pausas automáticas: mouse, foco, aba em segundo plano, fora da tela
        root.addEventListener("pointerenter", function (e) {
            if (e.pointerType === "mouse") { flags.hover = true; schedule(); }
        });
        root.addEventListener("pointerleave", function () { flags.hover = false; schedule(); });
        root.addEventListener("focusin", function () { flags.focus = true; schedule(); });
        root.addEventListener("focusout", function (e) {
            if (!root.contains(e.relatedTarget)) { flags.focus = false; schedule(); }
        });
        document.addEventListener("visibilitychange", function () {
            flags.hidden = document.hidden;
            schedule();
        });
        if ("IntersectionObserver" in window) {
            new IntersectionObserver(function (entries) {
                flags.offscreen = !entries[entries.length - 1].isIntersecting;
                schedule();
            }, { threshold: 0.2 }).observe(root);
        }
        reducedMotion.addEventListener("change", function (e) {
            flags.user = e.matches;
            updateControls();
            schedule();
        });

        updateControls();
        show(0);
        schedule();
    }

    /* ==========================================================
       MAPA
       ========================================================== */

    var mapEl = null, stage, pinLayer, labelLayer, emptyEl;
    var detail, dBadgeSlot, dClose, dBairro, dTitle, dTipoValue, dAnimalRow, dAnimalValue, dText, dAction, dActionBody, dDate;
    var listEl, noteEl;
    var pinEls = new Map();
    var caseIndex = new Map();
    var selectedId = null;
    var mapReady = false;
    var leafletActive = false, leafletPromise = null, lmap = null, lLayer = null;
    var markers = new Map();
    var isMobile = window.matchMedia("(max-width: 720px)");

    function buildBaseMap() {
        var blocks = "";
        for (var r = 0; r < 8; r++) {
            for (var c = 0; c < 26; c++) {
                var x = 12 + c * 46 + (r % 2) * 8;
                var y = 8 + r * 50;
                var w = 34 + ((c * 7 + r * 3) % 8);
                var h = 32 + ((c * 5 + r * 11) % 8);
                blocks += '<rect class="m-block" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="5"/>';
            }
        }
        var river = "M-10 330 C 200 290, 380 370, 620 335 S 980 290, 1210 345";
        return '<svg class="lp-map-svg" viewBox="0 0 1200 400" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
            '<rect class="m-bg" width="1200" height="400"/>' + blocks +
            '<rect class="m-park" x="860" y="250" width="150" height="70" rx="16"/>' +
            '<rect class="m-park" x="120" y="290" width="130" height="60" rx="16"/>' +
            '<path class="m-water-a" d="' + river + '" stroke-width="30"/>' +
            '<path class="m-water-b" d="' + river + '" stroke-width="16"/>' +
            '<path class="m-road" d="M-10 190 L 1210 170" stroke-width="14"/>' +
            '<path class="m-road" d="M-10 90 C 300 120, 700 60, 1210 110" stroke-width="8"/>' +
            '<path class="m-road" d="M300 -10 C 320 120, 280 280, 310 410" stroke-width="10"/>' +
            '<path class="m-road" d="M600 -10 C 590 120, 620 280, 600 410" stroke-width="14"/>' +
            '<path class="m-road" d="M900 -10 C 920 120, 880 280, 910 410" stroke-width="10"/>' +
            '</svg>';
    }

    function buildMapDom() {
        mapEl.textContent = "";

        stage = el("div", "lp-stage");
        stage.setAttribute("role", "group");
        stage.setAttribute("aria-label", "Mapa ilustrativo de ocorrências em Araucária");

        var base = el("div", "lp-map-base");
        base.setAttribute("aria-hidden", "true");
        base.innerHTML = buildBaseMap(); // marcação estática, sem dados externos

        labelLayer = el("div", "lp-labels");
        LABELS.forEach(function (l) {
            var s = el("span", "lp-label", l[0]);
            s.dataset.key = normKey(l[0]);
            s.style.left = l[1] + "%";
            s.style.top = l[2] + "%";
            s.setAttribute("aria-hidden", "true");
            labelLayer.appendChild(s);
        });

        pinLayer = el("div", "lp-pins");
        emptyEl = el("p", "lp-map-empty", "Nenhum chamado para exibir no momento.");
        emptyEl.hidden = true;
        stage.append(base, labelLayer, pinLayer, emptyEl);

        // Painel de detalhe (balão no desktop; cartão abaixo do mapa no celular)
        detail = el("div", "lp-detail");
        detail.id = "lpDetail";
        detail.hidden = true;
        detail.setAttribute("role", "region");
        detail.setAttribute("aria-labelledby", "lpDetailTitle");

        var top = el("div", "lp-detail-top");
        dBadgeSlot = el("span");
        dClose = el("button", "lp-detail-close", "×");
        dClose.type = "button";
        dClose.setAttribute("aria-label", "Fechar detalhes da ocorrência");
        top.append(dBadgeSlot, dClose);

        dBairro = el("p", "lp-detail-bairro");
        dTitle = el("h3", "lp-detail-title");
        dTitle.id = "lpDetailTitle";
        var tipoRow = el("p", "lp-detail-animal");
        dTipoValue = el("span", "lp-detail-v");
        tipoRow.append(el("span", "lp-detail-k", "Tipo:"), dTipoValue);
        dAnimalRow = el("p", "lp-detail-animal");
        dAnimalValue = el("span", "lp-detail-v");
        dAnimalRow.append(el("span", "lp-detail-k", "Animal:"), dAnimalValue);
        dText = el("p", "lp-detail-text");
        dAction = el("p", "lp-detail-action");
        dActionBody = el("span");
        dAction.append(el("strong", null, "O que foi feito: "), dActionBody);
        dDate = el("p", "lp-detail-date");
        detail.append(top, dBairro, dTitle, tipoRow, dAnimalRow, dText, dAction, dDate);

        // Lista alternativa (visível apenas no celular via CSS)
        var listWrap = el("div", "lp-list-wrap");
        listWrap.append(el("p", "lp-list-title", "Chamados no mapa"));
        listEl = el("ul", "lp-list");
        listWrap.appendChild(listEl);

        // Legenda e nota
        var foot = el("div", "lp-map-foot");
        if (!mapEl.parentNode.querySelector(".lp-legend")) {
            var legend = el("ul", "lp-legend");
            legend.setAttribute("aria-label", "Legenda dos status");
            STATUS_ORDER.forEach(function (s) {
                var li = el("li");
                li.setAttribute("data-status", s);
                li.append(glyphEl(s), document.createTextNode(STATUS[s].label));
                legend.appendChild(li);
            });
            foot.appendChild(legend);
        }
        noteEl = el("p", "lp-map-note");
        foot.appendChild(noteEl);

        mapEl.append(stage, detail, listWrap, foot);
    }

    function pinLabel(c) {
        return c.tipo + " em " + c.bairro + ", " + STATUS[c.status].label.toLowerCase();
    }

    function createPin(id) {
        var b = el("button", "lp-pin");
        b.type = "button";
        b.dataset.id = id;
        b.setAttribute("aria-controls", "lpDetail");
        b.setAttribute("aria-expanded", "false");
        var dot = el("span", "lp-pin-dot");
        dot.setAttribute("aria-hidden", "true");
        b.appendChild(dot);
        return b;
    }

    function updatePin(b, c) {
        b.setAttribute("data-status", c.status);
        b.style.left = c.x + "%";
        b.style.top = c.y + "%";
        b.setAttribute("aria-label", pinLabel(c));
        b.firstChild.textContent = STATUS[c.status].glyph;
    }

    // Atualiza pins por id, sem recriar os que já existem
    function renderPins() {
        var seen = new Set();
        cases.forEach(function (c) {
            var b = pinEls.get(c.id);
            if (!b) {
                b = createPin(c.id);
                pinEls.set(c.id, b);
                pinLayer.appendChild(b);
            }
            updatePin(b, c);
            seen.add(c.id);
        });
        pinEls.forEach(function (b, id) {
            if (!seen.has(id)) { b.remove(); pinEls.delete(id); }
        });
        emptyEl.hidden = cases.length > 0;
    }

    function renderList() {
        listEl.textContent = "";
        cases.forEach(function (c) {
            var li = el("li");
            var b = el("button", "lp-list-item");
            b.type = "button";
            b.dataset.id = c.id;
            b.setAttribute("data-status", c.status);
            var text = el("span", "lp-list-text");
            text.append(el("strong", null, c.tipo), el("small", null, c.bairro));
            b.append(glyphEl(c.status), text, badgeEl(c.status));
            li.appendChild(b);
            listEl.appendChild(li);
        });
    }

    function renderNote() {
        var t = leafletActive
            ? "Marcadores indicam a região do bairro, nunca o endereço."
            : "Representação ilustrativa, sem localização real.";
        noteEl.textContent = t + (demo ? " " + DEMO_TEXT : "");
    }

    function fillDetail(c) {
        dBadgeSlot.replaceWith(dBadgeSlot = badgeEl(c.status));
        dBairro.textContent = c.bairro;
        dTitle.textContent = c.titulo || c.tipo;
        dTipoValue.textContent = c.tipo;
        dAnimalValue.textContent = c.animal;
        dAnimalRow.hidden = !c.animal;
        dText.textContent = c.texto;
        dText.hidden = !c.texto;
        dActionBody.textContent = c.acao;
        dAction.hidden = !c.acao;
        dDate.textContent = c.data ? (demo ? "Data demonstrativa: " : "Registrado em ") + c.data : "";
        dDate.hidden = !c.data;
    }

    function syncSelection() {
        var sel = selectedId ? caseIndex.get(selectedId) : null;
        pinEls.forEach(function (b, id) {
            var on = id === selectedId;
            b.classList.toggle("is-selected", on);
            b.setAttribute("aria-expanded", on ? "true" : "false");
        });
        Array.prototype.forEach.call(listEl.querySelectorAll(".lp-list-item"), function (b) {
            if (b.dataset.id === selectedId) b.setAttribute("aria-current", "true");
            else b.removeAttribute("aria-current");
        });
        markers.forEach(function (m, id) {
            var node = m.getElement();
            if (node) node.classList.toggle("is-selected", id === selectedId);
            m.setZIndexOffset(id === selectedId ? 1000 : 0);
        });
        if (casesEl) {
            Array.prototype.forEach.call(casesEl.querySelectorAll(".lp-case"), function (card) {
                card.classList.toggle("is-selected", card.dataset.id === selectedId);
            });
        }
        var key = sel ? normKey(sel.bairro) : null;
        Array.prototype.forEach.call(labelLayer.children, function (s) {
            s.classList.toggle("is-active", s.dataset.key === key);
        });
    }

    // Posiciona o balão sem ultrapassar o mapa nem a janela
    function placeDetail() {
        if (!selectedId || detail.hidden) return;
        if (isMobile.matches || leafletActive) {
            detail.style.left = detail.style.top = "";
            detail.removeAttribute("data-place");
            return;
        }
        var c = caseIndex.get(selectedId);
        if (!c) return;
        var sw = stage.clientWidth, sh = stage.clientHeight;
        var w = detail.offsetWidth, h = detail.offsetHeight;
        var px = c.x / 100 * sw, py = c.y / 100 * sh;
        var gap = 22, edge = 8;

        var above = py - gap - edge;
        var below = sh - py - gap - edge;
        var place = above >= h || above >= below ? "above" : "below";
        var top = place === "above" ? Math.max(4, py - gap - h) : py + gap;

        var rect = mapEl.getBoundingClientRect();
        var minLeft = Math.max(edge, edge - rect.left);
        var maxLeft = Math.min(sw - w - edge, window.innerWidth - edge - rect.left - w);
        var left = clamp(px - w / 2, minLeft, Math.max(minLeft, maxLeft));

        detail.style.left = Math.round(left) + "px";
        detail.style.top = Math.round(top) + "px";
        detail.style.setProperty("--arrow", Math.round(clamp(px - left, 18, w - 18)) + "px");
        detail.setAttribute("data-place", place);
    }

    function selectCase(id, opts) {
        opts = opts || {};
        var c = caseIndex.get(id);
        if (!c) { closeDetail(false); return; }
        selectedId = id;
        fillDetail(c);
        detail.hidden = false;
        syncSelection();
        placeDetail();
        if (opts.pan && leafletActive && lmap && c.lat != null) lmap.panTo([c.lat, c.lng]);
        if (isMobile.matches || leafletActive) {
            detail.scrollIntoView({ block: "nearest", behavior: reducedMotion.matches ? "auto" : "smooth" });
        }
        if (opts.focusDetail) dClose.focus({ preventScroll: true });
    }

    function closeDetail(returnFocus) {
        var pin = selectedId ? pinEls.get(selectedId) : null;
        selectedId = null;
        detail.hidden = true;
        syncSelection();
        if (returnFocus && pin) pin.focus();
    }

    function bindMapEvents() {
        stage.addEventListener("click", function (e) {
            if (leafletActive) return; // no mapa real, quem trata é o Leaflet
            var pin = e.target.closest(".lp-pin");
            if (!pin) { if (selectedId) closeDetail(false); return; }
            if (pin.dataset.id === selectedId) closeDetail(false);
            else selectCase(pin.dataset.id, { focusDetail: e.detail === 0 });
        });
        listEl.addEventListener("click", function (e) {
            var b = e.target.closest(".lp-list-item");
            if (b) selectCase(b.dataset.id, { pan: true });
        });
        dClose.addEventListener("click", function () { closeDetail(true); });

        // Registrados uma única vez
        document.addEventListener("keydown", function (e) {
            if (e.key !== "Escape" || !selectedId) return;
            var focusInside = mapEl.contains(document.activeElement);
            closeDetail(focusInside);
        });
        document.addEventListener("click", function (e) {
            if (!selectedId || mapEl.contains(e.target) || e.target.closest("[data-keep-map]")) return;
            closeDetail(false);
        });

        var raf = 0;
        window.addEventListener("resize", function () {
            if (raf) return;
            raf = requestAnimationFrame(function () { raf = 0; placeDetail(); });
        });
        isMobile.addEventListener("change", placeDetail);
    }

    function initMap() {
        mapEl = byId("lpMap");
        if (!mapEl) return;
        buildMapDom();
        bindMapEvents();
        mapReady = true;
    }

    /* ---------- mapa real (Leaflet + OpenStreetMap), com fallback ilustrativo ---------- */

    function ensureLeaflet() {
        if (window.L && window.L.map) return Promise.resolve(true);
        if (!leafletPromise) {
            leafletPromise = new Promise(function (resolve) {
                var link = document.createElement("link");
                link.rel = "stylesheet";
                link.href = LEAFLET_CSS;
                var script = document.createElement("script");
                script.src = LEAFLET_JS;
                script.async = true;
                script.onload = function () { resolve(!!(window.L && window.L.map)); };
                script.onerror = function () { resolve(false); };
                document.head.append(link, script);
                setTimeout(function () { resolve(false); }, 8000);
            });
        }
        return leafletPromise;
    }

    function wantLeaflet() {
        return cases.length > 0 && cases.every(function (c) { return c.lat != null && c.lng != null; });
    }

    function createLeafletMap() {
        var host = el("div", "lp-leaflet");
        stage.appendChild(host);
        lmap = L.map(host, {
            scrollWheelZoom: false,
            dragging: !L.Browser.mobile,
            worldCopyJump: false
        }).setView(ARAUCARIA, 12);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 18,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
        }).addTo(lmap);
        lLayer = L.layerGroup().addTo(lmap);
        lmap.on("click", function () { if (selectedId) closeDetail(false); });
    }

    function renderMarkers() {
        var seen = new Set();
        cases.forEach(function (c) {
            var label = pinLabel(c);
            var icon = L.divIcon({
                className: "lp-lmark",
                iconSize: [32, 32],
                // marcação montada só com constantes e status validado
                html: '<span class="lp-pin-dot" data-status="' + c.status + '" aria-hidden="true">' + STATUS[c.status].glyph + "</span>"
            });
            var m = markers.get(c.id);
            if (!m) {
                m = L.marker([c.lat, c.lng], { icon: icon, title: label, alt: label, keyboard: true });
                (function (id) {
                    m.on("click", function () {
                        if (id === selectedId) closeDetail(false);
                        else selectCase(id, {});
                    });
                })(c.id);
                m.addTo(lLayer);
                markers.set(c.id, m);
            } else {
                m.setLatLng([c.lat, c.lng]);
                m.setIcon(icon);
            }
            seen.add(c.id);
        });
        markers.forEach(function (m, id) {
            if (!seen.has(id)) { lLayer.removeLayer(m); markers.delete(id); }
        });
    }

    function fitMarkers() {
        var pts = cases.map(function (c) { return [c.lat, c.lng]; });
        if (pts.length === 1) lmap.setView(pts[0], 14);
        else lmap.fitBounds(pts, { padding: [48, 48], maxZoom: 14 });
    }

    function setLeaflet(on) {
        if (on === leafletActive && !on) return;
        leafletActive = on;
        mapEl.classList.toggle("is-leaflet", on);
        if (on) {
            if (!lmap) createLeafletMap();
            renderMarkers();
            lmap.invalidateSize();
            fitMarkers();
        }
        renderNote();
        syncSelection();
        placeDetail();
    }

    function applyMode() {
        if (!mapReady) return;
        if (!wantLeaflet()) { setLeaflet(false); return; }
        ensureLeaflet().then(function (ok) {
            try { setLeaflet(ok && wantLeaflet()); }
            catch (err) { console.error("[SafeLifeLanding] mapa real indisponível, usando mapa ilustrativo:", err); setLeaflet(false); }
        });
    }

    /* ==========================================================
       SEÇÃO DE CASOS E INDICADORES (opcional: usa .lp-cases e .lp-stats se existirem)
       ========================================================== */

    var casesEl = null, statsEl = null, filtersEl = null, demoTag = null;
    var filter = "all";

    function initSections() {
        var scope = byId("welcomeScreen") || document;
        casesEl = scope.querySelector(".lp-cases");
        statsEl = scope.querySelector(".lp-stats");
        if (!casesEl) return;

        filtersEl = el("div", "lp-filters");
        filtersEl.setAttribute("role", "group");
        filtersEl.setAttribute("aria-label", "Filtrar casos por status");
        [["all", "Todos"]].concat(STATUS_ORDER.map(function (s) { return [s, STATUS[s].label]; }))
            .forEach(function (f) {
                var b = el("button", "lp-filter");
                b.type = "button";
                b.dataset.filter = f[0];
                b.dataset.label = f[1];
                filtersEl.appendChild(b);
            });
        demoTag = el("p", "lp-demo-note", DEMO_TEXT);
        casesEl.parentNode.insertBefore(demoTag, casesEl);
        casesEl.parentNode.insertBefore(filtersEl, casesEl);

        filtersEl.addEventListener("click", function (e) {
            var b = e.target.closest(".lp-filter");
            if (!b) return;
            filter = b.dataset.filter;
            renderCases();
        });
        casesEl.addEventListener("click", function (e) {
            var b = e.target.closest(".lp-case-link");
            if (!b || !mapEl) return;
            selectCase(b.dataset.id, { pan: true });
            mapEl.scrollIntoView({ block: "center", behavior: reducedMotion.matches ? "auto" : "smooth" });
        });
    }

    function countBy(status) {
        return cases.filter(function (c) { return c.status === status; }).length;
    }

    function renderStats() {
        if (!statsEl) return;
        statsEl.textContent = "";
        ["done", "progress", "open"].forEach(function (s) {
            var box = el("div", "lp-stat");
            box.setAttribute("data-status", s);
            var label = el("span");
            label.append(glyphEl(s), document.createTextNode(STATUS[s].stat));
            box.append(el("b", null, String(countBy(s))), label);
            statsEl.appendChild(box);
        });
        if (demo) {
            statsEl.appendChild(el("p", "lp-stats-note", "Valores demonstrativos, calculados a partir das quatro ocorrências fictícias."));
        }
        statsEl.setAttribute("data-live", "");
    }

    function caseCard(c) {
        var card = el("article", "lp-case");
        card.setAttribute("data-status", c.status);
        card.dataset.id = c.id;

        var top = el("div", "lp-case-top");
        top.append(el("span", "lp-case-type", c.tipo), badgeEl(c.status));

        var meta = c.bairro + (c.data ? ", " + (demo ? "data demonstrativa " : "") + c.data : "");
        card.append(top, el("h3", null, c.titulo || c.animal || c.tipo), el("p", "lp-case-meta", meta));
        if (c.texto) card.appendChild(el("p", null, c.texto));
        if (c.acao) {
            var act = el("p", "lp-case-action");
            act.append(el("strong", null, "Providência: "), document.createTextNode(c.acao));
            card.appendChild(act);
        }

        if (mapEl) {
            var link = el("button", "lp-case-link", "Ver detalhes no mapa");
            link.type = "button";
            link.dataset.id = c.id;
            link.setAttribute("data-keep-map", "");
            link.setAttribute("aria-label", "Ver detalhes no mapa: " + (c.titulo || c.tipo) + ", " + c.bairro);
            card.appendChild(link);
        }
        return card;
    }

    function renderCases() {
        if (!casesEl) return;
        Array.prototype.forEach.call(filtersEl.querySelectorAll(".lp-filter"), function (b) {
            var f = b.dataset.filter;
            var n = f === "all" ? cases.length : countBy(f);
            b.textContent = b.dataset.label + " (" + n + ")";
            b.setAttribute("aria-pressed", f === filter ? "true" : "false");
        });
        demoTag.hidden = !demo;

        casesEl.textContent = "";
        var list = cases.filter(function (c) { return filter === "all" || c.status === filter; });
        if (!list.length) {
            casesEl.appendChild(el("p", "lp-empty", "Nenhum caso nesta categoria no momento."));
            return;
        }
        list.forEach(function (c) { casesEl.appendChild(caseCard(c)); });
    }

    /* ==========================================================
       ATUALIZAÇÃO GERAL E API PÚBLICA
       ========================================================== */

    function refreshAll() {
        caseIndex = new Map(cases.map(function (c) { return [c.id, c]; }));
        if (mapReady) {
            renderPins();
            renderList();
            renderNote();
            applyMode();
            if (selectedId && !caseIndex.has(selectedId)) {
                closeDetail(false);
            } else if (selectedId) {
                fillDetail(caseIndex.get(selectedId));
                syncSelection();
                placeDetail();
            } else {
                syncSelection();
            }
        }
        renderStats();
        renderCases();
    }

    function safely(name, fn) {
        try { fn(); } catch (err) { console.error("[SafeLifeLanding] erro em " + name + ":", err); }
    }

    var started = false;
    function init() {
        if (started) return;
        started = true;
        safely("carrossel", initCarousel);
        safely("mapa", initMap);
        safely("seção de casos", initSections);
        safely("renderização", refreshAll);
    }

    window.SafeLifeLanding = {
        setCases: function (list) {
            try {
                if (!Array.isArray(list)) {
                    console.warn("[SafeLifeLanding] setCases espera um array.");
                    return false;
                }
                var clean = [], used = Object.create(null);
                list.forEach(function (raw, i) {
                    var c = sanitizeCase(raw, i);
                    if (!c) {
                        console.warn("[SafeLifeLanding] chamado ignorado (x e y precisam ser números):", raw);
                        return;
                    }
                    var base = c.id, n = 1;
                    while (used[c.id]) c.id = base + "-" + (++n);
                    used[c.id] = true;
                    clean.push(c);
                });
                cases = clean;
                demo = false;
                if (started) refreshAll();
                return true;
            } catch (err) {
                console.error("[SafeLifeLanding] falha em setCases:", err);
                return false;
            }
        }
    };

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
