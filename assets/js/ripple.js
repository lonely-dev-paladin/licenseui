// Shared across index.html, login.html, and become-admin.html.
// Attaches a Material-style ripple to every button-like clickable element,
// including ones added to the DOM later (table row buttons rendered after
// a fetch, etc.) — event delegation on document means nothing needs to be
// re-attached whenever new content loads.
(function () {
    // "button" alone already covers every <button> tag site-wide (Generate,
    // Ban, Extend, Refresh, modal Cancel/Confirm, etc. — all real <button>
    // elements regardless of their class). The rest here are non-<button>
    // elements that still act like clickable buttons.
    const SELECTOR = "button, .planCard, .device-chip, .social-icons a";

    document.addEventListener("click", function (e) {
        const el = e.target.closest(SELECTOR);
        if (!el || el.disabled) return;

        spawnRipple(el, e);
    });

    function spawnRipple(el, event) {
        const style = getComputedStyle(el);

        // The ripple is absolutely positioned relative to its nearest
        // positioned ancestor, so the target element needs position + a
        // clip boundary matching its own rounded shape.
        if (style.position === "static") el.style.position = "relative";
        if (style.overflow === "visible") el.style.overflow = "hidden";

        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.6;
        const x = (event.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2;
        const y = (event.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2;

        const ripple = document.createElement("span");
        ripple.className = "ripple-effect";
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        el.appendChild(ripple);
        ripple.addEventListener("animationend", () => ripple.remove());
    }
})();