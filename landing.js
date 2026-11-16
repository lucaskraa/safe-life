/* ==========================================================
   Safe Life — Landing v5
   Mapa ilustrativo de Araucária + carrossel + seção de casos.
   JavaScript puro, sem dependências.

   Integração com dados reais (API pública, inalterada):
     window.SafeLifeLanding.setCases([
       { id, x, y, bairro, tipo, status, texto, data }   // animal é opcional
     ]);
   - x / y: posição em % dentro do mapa (0–100). O mapa é ilustrativo.
   - status: "open" | "progress" | "done".
   - Use sempre localização aproximada por bairro, nunca endereço.
   - Só os campos acima são lidos; qualquer outro campo é ignorado.
   ========================================================== */
(function () {
    "use strict";

    /* ---------- constantes e dados de exemplo ---------- */

    var CAROUSEL_DELAY = 5000;
    var MAX_LEN = { bairro: 60, tipo: 60, animal: 60, texto: 320 };

    var STATUS = {
        open:     { label: "Aberta",       stat: "Chamados abertos",        glyph: "!" },
        progress: { label: "Em andamento", stat: "Em andamento",            glyph: "…" },
        done:     { label: "Concluída",    stat: "Atendimentos concluídos", glyph: "✓" }
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

    // Dados demonstrativos (substituídos quando setCases for chamado).
    var cases = [
        { id: "1", x: 14, y: 62, bairro: "Capela Velha", tipo: "Maus-tratos", status: "done",     animal: "Thor",       texto: "Cão encontrado acorrentado e sem água. Resgatado, tratado e adotado." },
        { id: "2", x: 38, y: 38, bairro: "Centro",       tipo: "Abandono",    status: "progress", animal: "Mel",        texto: "Gata abandonada em terreno baldio. Em recuperação com a equipe." },
        { id: "3", x: 62, y: 62, bairro: "Iguaçu",       tipo: "Cativeiro",   status: "done",     animal: "Piu e Pipo", texto: "Periquitos presos em gaiola pequena. Resgatados e reabilitados." },
        { id: "4", x: 86, y: 38, bairro: "Costeira",     tipo: "Maus-tratos", status: "open",     animal: "Tico",       texto: "Galinha mantida em gaiola apertada. Aguardando a equipe." }
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

    // Aceita só campos conhecidos; descarta qualquer outra informação (privacidade).
    function sanitizeCase(raw, index) {
        if (!raw || typeof raw !== "object") return null;
        var x = toPct(raw.x), y = toPct(raw.y);
        if (x === null || y === null) return null;
        return {
            id: raw.id != null && raw.id !== "" ? String(raw.id) : "caso-" + index,
            x: x,
            y: y,
            status: hasOwn(STATUS, raw.status) ? raw.status : "open",
            bairro: cleanStr(raw.bairro, MAX_LEN.bairro) || "Bairro não informado",
            tipo: cleanStr(raw.tipo, MAX_LEN.tipo) || "Ocorrência",
            animal: cleanStr(raw.animal, MAX_LEN.animal),
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

    var ICON = {
        prev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
        next: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
        pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
        play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>'
    };

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

        // Controles criados via DOM (nenhuma alteração de HTML necessária)
        function makeBtn(cls, label, svg) {
            var b = el("button", "lp-car-btn " + cls);
            b.type = "button";
            b.setAttribute("aria-label", label);
            b.innerHTML = svg; // SVG estático definido neste arquivo
            return b;
        }
        var prevBtn = makeBtn("lp-car-prev", "Slide anterior", ICON.prev);
        var nextBtn = makeBtn("lp-car-next", "Próximo slide", ICON.next);
        var pauseBtn = makeBtn("lp-car-pause", "Pausar apresentação de slides", ICON.pause);
        root.append(prevBtn, nextBtn, pauseBtn);

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
            var playing = !flags.user;
            pauseBtn.innerHTML = playing ? ICON.pause : ICON.play;
            pauseBtn.setAttribute("aria-label", playing ? "Pausar apresentação de slides" : "Iniciar apresentação de slides");
            if (capEl) capEl.setAttribute("aria-live", playing ? "off" : "polite");
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

        // Navegação manual
        prevBtn.addEventListener("click", function () { go(index - 1); });
        nextBtn.addEventListener("click", function () { go(index + 1); });
        pauseBtn.addEventListener("click", function () {
            flags.user = !flags.user;
            updateControls();
            schedule();
        });
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
    var detail, dBadgeSlot, dClose, dBairro, dTitle, dAnimalValue, dText, dDate;
    var listEl, noteEl;
    var pinEls = new Map();
    var caseIndex = new Map();
    var selectedId = null;
    var mapReady = false;
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
        var animalRow = el("p", "lp-detail-animal");
        dAnimalValue = el("span", "lp-detail-v");
        animalRow.append(el("span", "lp-detail-k", "Animal:"), dAnimalValue);
        dText = el("p", "lp-detail-text");
        dDate = el("p", "lp-detail-date");
        detail.append(top, dBairro, dTitle, animalRow, dText, dDate);

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
        noteEl.textContent = "Mapa ilustrativo, com posições aproximadas por bairro." + (demo ? " Dados demonstrativos." : "");
    }

    function fillDetail(c) {
        dBadgeSlot.replaceWith(dBadgeSlot = badgeEl(c.status));
        dBairro.textContent = c.bairro;
        dTitle.textContent = c.tipo;
        dAnimalValue.textContent = c.animal || "Não identificado";
        dText.textContent = c.texto;
        dText.hidden = !c.texto;
        dDate.textContent = c.data ? "Registrado em " + c.data : "";
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
        var key = sel ? normKey(sel.bairro) : null;
        Array.prototype.forEach.call(labelLayer.children, function (s) {
            s.classList.toggle("is-active", s.dataset.key === key);
        });
    }

    // Posiciona o balão sem ultrapassar o mapa nem a janela
    function placeDetail() {
        if (!selectedId || detail.hidden) return;
        if (isMobile.matches) {
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
        if (isMobile.matches) {
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
            var pin = e.target.closest(".lp-pin");
            if (!pin) { if (selectedId) closeDetail(false); return; }
            if (pin.dataset.id === selectedId) closeDetail(false);
            else selectCase(pin.dataset.id, { focusDetail: e.detail === 0 });
        });
        listEl.addEventListener("click", function (e) {
            var b = e.target.closest(".lp-list-item");
            if (b) selectCase(b.dataset.id, {});
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
        demoTag = el("span", "lp-demo-tag", "Dados demonstrativos");
        filtersEl.appendChild(demoTag);
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
            selectCase(b.dataset.id, {});
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
            statsEl.appendChild(el("p", "lp-stats-note", "Valores demonstrativos, calculados a partir dos exemplos exibidos."));
        }
        statsEl.setAttribute("data-live", "");
    }

    function caseCard(c) {
        var card = el("article", "lp-case");
        card.setAttribute("data-status", c.status);

        var top = el("div", "lp-case-top");
        top.append(el("span", "lp-case-type", c.tipo), badgeEl(c.status));

        var meta = c.bairro + (c.data ? ", " + c.data : "");
        card.append(top, el("h3", null, c.animal || c.tipo), el("p", "lp-case-meta", meta));
        if (c.texto) card.appendChild(el("p", null, c.texto));

        if (mapEl) {
            var link = el("button", "lp-case-link", "Ver no mapa");
            link.type = "button";
            link.dataset.id = c.id;
            link.setAttribute("data-keep-map", "");
            link.setAttribute("aria-label", "Ver no mapa: " + c.tipo + " em " + c.bairro);
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
