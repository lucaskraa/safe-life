/* ==========================================================
   Safe Life — Landing v6 (redesign editorial)
   JavaScript da landing. Não altera o sistema de denúncias.

   Integração com dados reais (API pública, inalterada):
     window.SafeLifeLanding.setCases([
       { id, bairro, tipo, status, texto, data,
         titulo, acao, animal, lat, lng }  // lat/lng são opcionais
     ]);
   - lat/lng: referência aproximada do BAIRRO (nunca endereço).
   - status: "open" | "progress" | "done".
   - Só os campos acima são lidos; qualquer outro é ignorado.
   ========================================================== */
(function () {
    "use strict";

    /* ---------- constantes ---------- */

    var MAX_LEN = { bairro: 60, tipo: 60, animal: 60, titulo: 80, texto: 320, acao: 320 };
    var POPUP_DEMO = "Ocorrência fictícia. Ponto aproximado na região do bairro, não é um endereço.";
    var LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    var LEAFLET_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    var TILES = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    var TILES_ATTRIB = 'Dados &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>';
    var ARAUCARIA = [-25.593, -49.405];

    var STATUS = {
        open:     { label: "Em análise",      glyph: "!" },
        progress: { label: "Em atendimento", glyph: "…" },
        done:     { label: "Concluído",      glyph: "\u2713" }
    };

    /* Fotografias documentais (Unsplash, licença livre).
       A 1ª que carregar é usada; a última é a reserva offline. */
    var HERO_CANDIDATES = [
        "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1675701918017-fda8f5bcbf90?auto=format&fit=crop&w=1200&q=80"
    ];
    var HERO_PLACEHOLDER = ""; // sem ilustração genérica: mantém um fundo sóbrio se as fotos falharem.

    /* Quatro ocorrências FICTÍCIAS para demonstração (TCC).
       lat/lng = referência aproximada do bairro, arredondada. */
    var DEMO_CASES = [
        { id: "1", lat: -25.592, lng: -49.409, bairro: "Centro", tipo: "Abandono", status: "done", data: "2026-10-06",
          titulo: "Animal abandonado",
          texto: "Cão encontrado próximo a uma praça, aparentemente sem identificação e necessitando de cuidados.",
          acao: "Ocorrência registrada, equipe acionada e animal encaminhado para avaliação e acolhimento." },
        { id: "2", lat: -25.553, lng: -49.404, bairro: "Capela Velha", tipo: "Maus-tratos", status: "progress", data: "2026-10-20",
          titulo: "Suspeita de maus-tratos",
          texto: "Moradores relataram um cão mantido em condições inadequadas.",
          acao: "Denúncia registrada e encaminhada para verificação pela equipe responsável." },
        { id: "3", lat: -25.598, lng: -49.398, bairro: "Iguaçu", tipo: "Desaparecimento", status: "open", data: "2026-11-03",
          titulo: "Animal desaparecido",
          texto: "Gato rajado desaparecido. O tutor informou o local onde o animal foi visto pela última vez.",
          acao: "Informações organizadas para auxiliar na busca e facilitar a divulgação do desaparecimento." },
        { id: "4", lat: -25.606, lng: -49.372, bairro: "Costeira", tipo: "Resgate", status: "done", data: "2026-11-10",
          titulo: "Pedido de resgate",
          texto: "Filhote encontrado em uma situação de risco, necessitando de atendimento.",
          acao: "Pedido registrado e orientações fornecidas para o atendimento e encaminhamento do animal." }
    ];

    /* ---------- utilitários ---------- */

    function byId(id) { return document.getElementById(id); }
    function $(sel, root) { return (root || document).querySelector(sel); }

    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    }

    function hasOwn(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }

    function cleanStr(v, max) {
        if (v == null) return "";
        var s = String(v).replace(/\s+/g, " ").trim();
        return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
    }

    function fmtDate(v) {
        if (v == null || v === "") return "";
        if (typeof v === "string") {
            var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v.trim());
            if (m) return m[3] + "/" + m[2] + "/" + m[1];
            return cleanStr(v, 30);
        }
        if (v instanceof Date) {
            return isNaN(v.getTime()) ? "" : v.toLocaleDateString("pt-BR");
        }
        if (typeof v === "number" && isFinite(v)) {
            // APIs costumam enviar segundos; Date espera milissegundos.
            var stamp = Math.abs(v) < 100000000000 ? v * 1000 : v;
            var d = new Date(stamp);
            return isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR");
        }
        return cleanStr(v, 30);
    }

    function toCoord(v, lim) {
        if (typeof v === "string") {
            var value = v.trim();
            if (!/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(value)) return null;
            v = Number(value);
        }
        return typeof v === "number" && isFinite(v) && Math.abs(v) <= lim ? v : null;
    }

    /* Aceita só campos conhecidos (privacidade). */
    function sanitizeCase(raw, index) {
        if (!raw || typeof raw !== "object") return null;
        var lat = toCoord(raw.lat, 90), lng = toCoord(raw.lng, 180);
        if (lat === null || lng === null) { lat = null; lng = null; }
        return {
            id: raw.id != null && raw.id !== "" ? String(raw.id) : "caso-" + index,
            status: hasOwn(STATUS, raw.status) ? raw.status : "open",
            bairro: cleanStr(raw.bairro, MAX_LEN.bairro) || "Bairro não informado",
            tipo: cleanStr(raw.tipo, MAX_LEN.tipo) || "Ocorrência",
            animal: cleanStr(raw.animal, MAX_LEN.animal),
            titulo: cleanStr(raw.titulo, MAX_LEN.titulo) || "Ocorrência em " + cleanStr(raw.bairro, 40),
            acao: cleanStr(raw.acao, MAX_LEN.acao),
            lat: lat,
            lng: lng,
            texto: cleanStr(raw.texto, MAX_LEN.texto),
            data: fmtDate(raw.data)
        };
    }

    /* ---------- foto do hero (com fallback) ---------- */

    function initHero() {
        var img = byId("slHeroImg");
        if (!img) return;
        var frame = img.closest(".sl-hero-media") || img.parentElement;
        var index = 0;

        function loadNext() {
            if (index >= HERO_CANDIDATES.length) {
                img.onerror = null;
                img.removeAttribute("src");
                if (frame) frame.classList.add("is-image-fallback");
                return;
            }
            img.dataset.idx = String(index);
            img.src = HERO_CANDIDATES[index];
            index += 1;
        }

        img.onerror = loadNext;
        img.onload = function () {
            if (frame) frame.classList.remove("is-image-fallback");
        };
        if (frame) frame.classList.remove("is-image-fallback");
        loadNext();
    }

    /* ---------- estado das ocorrências ---------- */

    var cases = DEMO_CASES.map(sanitizeCase).filter(Boolean);

    var caseIndex = new Map();   // id -> case
    var cardEls = new Map();     // id -> <li>
    var markerObjs = new Map();  // id -> { marker, latlng }
    var activeId = null;

    function rebuildIndex() {
        caseIndex.clear();
        cases.forEach(function (c) { caseIndex.set(c.id, c); });
    }

    /* ---------- lista de cards ---------- */

    function renderCards() {
        var list = byId("slCaseList");
        if (!list) return;
        list.textContent = "";
        cardEls.clear();

        if (!cases.length) {
            var li = el("li", "sl-cases-empty", "Nenhuma ocorrência para exibir no momento.");
            list.appendChild(li);
            return;
        }

        cases.forEach(function (c) {
            var li = el("li", "sl-case");
            li.dataset.id = c.id;
            li.setAttribute("tabindex", "0");
            li.setAttribute("role", "button");
            li.setAttribute("aria-pressed", "false");
            li.setAttribute("aria-label", c.titulo + ", " + c.bairro + ", " + STATUS[c.status].label);

            var top = el("div", "sl-case-top");
            top.appendChild(el("span", "sl-case-bairro", c.bairro));
            var badge = el("span", "sl-badge", STATUS[c.status].label);
            badge.setAttribute("data-status", c.status);
            top.appendChild(badge);

            li.appendChild(top);
            li.appendChild(el("h3", null, c.titulo));
            li.appendChild(el("p", "sl-case-tipo", "Tipo: " + c.tipo + (c.animal ? " · Animal: " + c.animal : "")));
            if (c.texto) li.appendChild(el("p", "sl-case-texto", c.texto));

            if (c.acao) {
                var acao = el("p", "sl-case-acao");
                acao.appendChild(document.createTextNode("Providências: "));
                var strong = el("strong", null, c.acao);
                acao.appendChild(strong);
                li.appendChild(acao);
            }
            if (c.data) li.appendChild(el("p", "sl-case-data", "Registro: " + c.data));

            li.addEventListener("click", function () { selectCase(c.id, true); });
            li.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectCase(c.id, true); }
            });

            cardEls.set(c.id, li);
            list.appendChild(li);
        });
    }

    /* ---------- seleção integrada card <-> mapa ---------- */

    function setActive(id) {
        if (activeId === id) return;
        activeId = id;
        cardEls.forEach(function (li, key) {
            li.classList.toggle("is-active", key === id);
            li.setAttribute("aria-pressed", key === id ? "true" : "false");
        });
        markerObjs.forEach(function (m, key) {
            var pin = m.marker.getElement() && m.marker.getElement().querySelector(".sl-pin");
            if (pin) pin.classList.toggle("is-active", key === id);
        });
    }

    function selectCase(id, fromCard) {
        var c = caseIndex.get(id);
        if (!c) return;
        setActive(id);
        var m = markerObjs.get(id);
        if (m && window.L && lmap) {
            lmap.flyTo(m.latlng, Math.max(lmap.getZoom(), 13), { duration: .6 });
            m.marker.openPopup();
        }
    }

    /* ---------- mapa (Leaflet + OpenStreetMap) ---------- */

    var lmap = null;
    var mapStarted = false;

    var leafletPromise = null;
    var leafletCssPromise = null;

    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            var existing = document.querySelector('script[data-safelife-leaflet="true"]');
            if (window.L) { resolve(); return; }
            if (existing) {
                existing.addEventListener("load", resolve, { once: true });
                existing.addEventListener("error", reject, { once: true });
                return;
            }
            var s = document.createElement("script");
            s.src = src;
            s.async = true;
            s.dataset.safelifeLeaflet = "true";
            s.onload = resolve;
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    function loadCss(href) {
        if (leafletCssPromise) return leafletCssPromise;
        var existing = document.querySelector('link[data-safelife-leaflet="true"]');
        if (existing) {
            leafletCssPromise = Promise.resolve();
            return leafletCssPromise;
        }
        leafletCssPromise = new Promise(function (resolve, reject) {
            var link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = href;
            link.dataset.safelifeLeaflet = "true";
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
        return leafletCssPromise;
    }

    function ensureLeaflet() {
        if (window.L) return loadCss(LEAFLET_CSS);
        if (!leafletPromise) {
            leafletPromise = loadCss(LEAFLET_CSS)
                .then(function () { return loadScript(LEAFLET_JS); })
                .then(function () {
                    if (!window.L) throw new Error("Leaflet indisponível");
                })
                .catch(function (err) {
                    leafletPromise = null;
                    throw err;
                });
        }
        return leafletPromise;
    }

    function popupHtml(c) {
        var wrap = el("div");
        wrap.appendChild(el("p", "sl-popup-bairro", c.bairro + (c.data ? " · " + c.data : "")));
        wrap.appendChild(el("h3", null, c.titulo));
        wrap.appendChild(el("p", "sl-popup-text", "Tipo: " + c.tipo + (c.animal ? " · Animal: " + c.animal : "")));
        if (c.texto) wrap.appendChild(el("p", "sl-popup-text", c.texto));
        if (c.acao) {
            var acao = el("p", "sl-popup-acao");
            acao.appendChild(el("strong", null, "Providências: "));
            acao.appendChild(document.createTextNode(c.acao));
            wrap.appendChild(acao);
        }
        wrap.appendChild(el("p", "sl-popup-demo", POPUP_DEMO));
        return wrap;
    }

    var markerLayer = null;

    function renderMarkers() {
        if (!lmap || !window.L) return;
        if (markerLayer) markerLayer.clearLayers();
        markerObjs.clear();
        markerLayer = markerLayer || L.layerGroup().addTo(lmap);

        cases.forEach(function (c) {
            if (c.lat === null || c.lng === null) return;
            var latlng = [c.lat, c.lng];
            var icon = L.divIcon({
                className: "",
                html: '<span class="sl-pin" data-status="' + c.status + '" aria-hidden="true">' +
                      STATUS[c.status].glyph + "</span>",
                iconSize: [26, 26],
                iconAnchor: [13, 13],
                popupAnchor: [0, -16]
            });
            var marker = L.marker(latlng, {
                icon: icon,
                title: c.titulo + " — " + c.bairro,
                alt: c.titulo + " — " + c.bairro
            }).addTo(markerLayer);
            marker.bindPopup(popupHtml(c));
            marker.on("click", function () { setActive(c.id); });
            markerObjs.set(c.id, { marker: marker, latlng: latlng });
        });

        if (activeId && markerObjs.has(activeId)) {
            var activeMarker = markerObjs.get(activeId).marker;
            var activePin = activeMarker.getElement() && activeMarker.getElement().querySelector(".sl-pin");
            if (activePin) activePin.classList.add("is-active");
        }
    }

    function startMap() {
        var holder = byId("slMap");
        if (mapStarted || !holder) return;
        mapStarted = true;
        holder.classList.add("is-pending");

        ensureLeaflet().then(function () {
            if (!holder.isConnected) return;
            holder.classList.remove("is-pending");
            holder.textContent = "";

            lmap = L.map(holder, {
                center: ARAUCARIA,
                zoom: 12,
                scrollWheelZoom: false,
                attributionControl: true,
                zoomControl: true
            });

            L.tileLayer(TILES, {
                attribution: TILES_ATTRIB,
                maxZoom: 19,
                subdomains: "abcd"
            }).addTo(lmap);

            // O scroll do mapa só é ativado depois que a pessoa interage com ele.
            lmap.on("click", function () { lmap.scrollWheelZoom.enable(); });
            lmap.on("mouseout", function () { lmap.scrollWheelZoom.disable(); });

            renderMarkers();
            var refresh = window.requestAnimationFrame || function (fn) { return window.setTimeout(fn, 30); };
            refresh(function () { if (lmap) lmap.invalidateSize(); });

            if (window.ResizeObserver) {
                var ro = new ResizeObserver(function () { if (lmap) lmap.invalidateSize({ pan: false }); });
                ro.observe(holder);
                holder._slMapResizeObserver = ro;
            }
        }).catch(function () {
            holder.classList.remove("is-pending");
            holder.textContent = "Não foi possível carregar o mapa agora. Consulte as ocorrências na lista ao lado.";
            mapStarted = false;
        });
    }

    /* Carrega o mapa só quando a seção aparece (economiza dados no 4G) */
    function initMapLazy() {
        var section = byId("ocorrencias");
        if (!section) { startMap(); return; }
        if ("IntersectionObserver" in window) {
            var seen = false;
            var io = new IntersectionObserver(function (entries) {
                if (seen) return;
                if (entries[entries.length - 1].isIntersecting) { seen = true; io.disconnect(); startMap(); }
            }, { rootMargin: "400px 0px" });
            io.observe(section);
        } else {
            startMap();
        }
    }

    /* ---------- API pública (inalterada) ---------- */

    window.SafeLifeLanding = {
        setCases: function (list) {
            if (!Array.isArray(list)) return;
            var seen = new Set();
            var next = list.map(sanitizeCase).filter(function (item) {
                if (!item || seen.has(item.id)) return false;
                seen.add(item.id);
                return true;
            });

            // Se a API não entregar ocorrências válidas, mantém os quatro exemplos do TCC.
            cases = next.length ? next : DEMO_CASES.map(sanitizeCase).filter(Boolean);
            rebuildIndex();
            activeId = null;
            renderCards();

            // Atualiza somente os marcadores; não recria o mapa nem perde o zoom do usuário.
            if (lmap) renderMarkers();
        }
    };

    /* ---------- boot ---------- */

    function boot() {
        initHero();
        rebuildIndex();
        renderCards();
        var note = byId("slDemoNote");
        if (note) note.textContent = "Dados demonstrativos do TCC — ocorrências fictícias utilizadas para demonstração do projeto.";
        initMapLazy();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
