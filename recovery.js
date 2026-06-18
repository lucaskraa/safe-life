/* =====================================================
   SAFE LIFE V18.5 — RECUPERAÇÃO SEGURA DE SESSÃO
===================================================== */
(function () {
    "use strict";

    const USER_KEY = "safeLifeLoggedUser";
    const TOKEN_KEY = "safeLifeAuthToken";

    function removeSafeLifeStorage() {
        const localKeys = [];

        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);

            if (
                key &&
                (
                    key.toLowerCase().startsWith("safelife") ||
                    key === USER_KEY ||
                    key === TOKEN_KEY
                )
            ) {
                localKeys.push(key);
            }
        }

        localKeys.forEach(function (key) {
            localStorage.removeItem(key);
        });

        const sessionKeys = [];

        for (let index = 0; index < sessionStorage.length; index += 1) {
            const key = sessionStorage.key(index);

            if (
                key &&
                key.toLowerCase().startsWith("safelife")
            ) {
                sessionKeys.push(key);
            }
        }

        sessionKeys.forEach(function (key) {
            sessionStorage.removeItem(key);
        });
    }

    function readSavedUser() {
        const raw = localStorage.getItem(USER_KEY);

        if (!raw) return null;

        try {
            const parsed = JSON.parse(raw);

            if (!parsed || typeof parsed !== "object") {
                return null;
            }

            return parsed;
        } catch (_) {
            return null;
        }
    }

    function hasValidCpf(user) {
        return (
            user &&
            String(user.cpf || "").replace(/\D/g, "").length === 11
        );
    }

    const rawUser = localStorage.getItem(USER_KEY);
    const token = String(localStorage.getItem(TOKEN_KEY) || "");
    const user = readSavedUser();

    const invalidPair =
        (rawUser && !hasValidCpf(user)) ||
        (hasValidCpf(user) && !token) ||
        (!rawUser && token);

    if (invalidPair) {
        removeSafeLifeStorage();
    }

    window.safeLifeClearSavedSession = function () {
        removeSafeLifeStorage();

        if ("caches" in window) {
            caches.keys()
                .then(function (names) {
                    return Promise.all(
                        names.map(function (name) {
                            return caches.delete(name);
                        })
                    );
                })
                .finally(function () {
                    window.location.href = "index.html?v=18.5.0";
                });

            return;
        }

        window.location.href = "index.html?v=18.5.0";
    };

    /*
     * Só mostra o botão de recuperação quando existe uma sessão salva
     * e a tela continua presa nas boas-vindas por vários segundos.
     */
    window.addEventListener("DOMContentLoaded", function () {
        const hasSavedSession =
            Boolean(localStorage.getItem(USER_KEY)) ||
            Boolean(localStorage.getItem(TOKEN_KEY));

        if (!hasSavedSession) return;

        window.setTimeout(function () {
            const welcome = document.getElementById("welcomeScreen");

            if (
                !welcome ||
                !welcome.classList.contains("active") ||
                document.getElementById("safeLifeEmergencyRecovery")
            ) {
                return;
            }

            const button = document.createElement("button");

            button.id = "safeLifeEmergencyRecovery";
            button.type = "button";
            button.textContent = "Destravar login deste aparelho";
            button.style.position = "fixed";
            button.style.left = "16px";
            button.style.right = "16px";
            button.style.bottom = "18px";
            button.style.zIndex = "999999";
            button.style.padding = "14px 18px";
            button.style.border = "0";
            button.style.borderRadius = "16px";
            button.style.background = "#ef4444";
            button.style.color = "#ffffff";
            button.style.fontWeight = "800";
            button.style.boxShadow =
                "0 14px 34px rgba(15, 23, 42, 0.28)";

            button.addEventListener("click", function () {
                const confirmed = window.confirm(
                    "Isso limpará apenas o login salvo neste aparelho. " +
                    "Sua conta continuará cadastrada. Continuar?"
                );

                if (confirmed) {
                    window.safeLifeClearSavedSession();
                }
            });

            document.body.appendChild(button);
        }, 8000);
    });
})();
