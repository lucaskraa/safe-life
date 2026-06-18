/* =====================================================
   SAFE LIFE V18.4 — PRELOAD DE RECUPERAÇÃO MOBILE
===================================================== */
(function () {
    "use strict";

    window.SAFE_LIFE_API_URL = "https://safe-life.onrender.com";

    const USER_KEY = "safeLifeLoggedUser";
    const TOKEN_KEY = "safeLifeAuthToken";

    function parseUser() {
        try {
            return JSON.parse(localStorage.getItem(USER_KEY) || "null");
        } catch (_) {
            return null;
        }
    }

    function clearBrokenSession() {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem("safeLifeLastCpf");
        localStorage.removeItem("safeLifeCadastroPendente");
    }

    const user = parseUser();
    const token = String(localStorage.getItem(TOKEN_KEY) || "");

    const validUser =
        user &&
        typeof user === "object" &&
        String(user.cpf || "").replace(/\D/g, "").length === 11;

    if ((user && !validUser) || (validUser && !token) || (!validUser && token)) {
        clearBrokenSession();
    }

    window.safeLifeNavigate = function safeLifeNavigate(screenId) {
        document.querySelectorAll(".screen").forEach(function (screen) {
            screen.classList.remove("active");
        });

        const target = document.getElementById(screenId);

        if (target) {
            target.classList.add("active");
            window.scrollTo({ top: 0, behavior: "auto" });
        }
    };

    window.safeLifeResetLocalSession = function safeLifeResetLocalSession() {
        clearBrokenSession();
        window.location.reload();
    };

    /*
     * Evita que versões antigas criem vários timers iguais no celular.
     */
    const nativeSetInterval = window.setInterval.bind(window);
    const intervalSignatures = new Map();

    window.setInterval = function safeLifeSetInterval(callback, delay) {
        const normalizedDelay = Math.max(Number(delay) || 0, 2500);
        const signature =
            normalizedDelay +
            ":" +
            String(callback).replace(/\s+/g, " ").slice(0, 180);

        if (intervalSignatures.has(signature)) {
            return intervalSignatures.get(signature);
        }

        const id = nativeSetInterval(callback, normalizedDelay);
        intervalSignatures.set(signature, id);
        return id;
    };
})();
