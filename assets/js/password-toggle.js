// =========================================================
// PASSWORD VISIBILITY TOGGLE (eye icon)
// =========================================================
// Automatically finds every <input type="password"> on the page and wraps
// it with a themed "show/hide" eye icon — no HTML changes needed per field.
// Works on login.html (password, saPassword, newAdminPass) and
// become-admin.html (reqPassword, reqPasswordConfirm) today, and will pick
// up any password field added later without touching this file.
(function () {
    const EYE_ICON =
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>' +
        '<circle cx="12" cy="12" r="3"></circle>' +
        "</svg>";

    const EYE_OFF_ICON =
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" ' +
        'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24"></path>' +
        '<line x1="1" y1="1" x2="23" y2="23"></line>' +
        "</svg>";

    function addToggle(input) {
        // Skip if already wrapped (e.g. this ever runs more than once)
        if (input.parentElement && input.parentElement.classList.contains("password-wrap")) {
            return;
        }

        const wrap = document.createElement("div");
        wrap.className = "password-wrap";

        input.parentNode.insertBefore(wrap, input);
        wrap.appendChild(input);

        const toggle = document.createElement("span");
        toggle.className = "password-toggle";
        toggle.setAttribute("role", "button");
        toggle.setAttribute("tabindex", "0");
        toggle.setAttribute("aria-label", "Show password");
        toggle.innerHTML = EYE_ICON;

        wrap.appendChild(toggle);

        let visible = false;

        function setVisible(next) {
            visible = next;
            input.type = visible ? "text" : "password";
            toggle.innerHTML = visible ? EYE_OFF_ICON : EYE_ICON;
            toggle.setAttribute("aria-label", visible ? "Hide password" : "Show password");
        }

        toggle.addEventListener("click", () => {
            setVisible(!visible);
            input.focus({ preventScroll: true });
        });

        // Keyboard accessibility, since the toggle is a <span role="button">
        // rather than a native <button> (a real button inside a <label>/form
        // here would risk triggering form submission on Enter).
        toggle.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle.click();
            }
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll('input[type="password"]').forEach(addToggle);
    });
})();