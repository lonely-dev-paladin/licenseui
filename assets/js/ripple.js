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
        // position: relative and overflow: hidden are now baked into
        // ripple.css directly for every target element, so there's nothing
        // to check or patch here at click-time — just measure and place.
        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height) * 1.6;

        // event.detail === 0 reliably means this click came from a keyboard
        // (Enter/Space on a focused button) rather than an actual mouse
        // click/tap — in that case clientX/clientY are 0, and since 0 isn't
        // null/undefined the old "?? fallback" never kicked in, placing the
        // ripple in the wrong corner instead of centering it.
        const isPointerClick = event.detail !== 0;
        const originX = isPointerClick ? event.clientX : rect.left + rect.width / 2;
        const originY = isPointerClick ? event.clientY : rect.top + rect.height / 2;

        const x = originX - rect.left - size / 2;
        const y = originY - rect.top - size / 2;

        const ripple = document.createElement("span");
        ripple.className = "ripple-effect";
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        el.appendChild(ripple);

        // Fallback removal in case animationend never fires for any reason
        // (e.g. the element gets removed/re-rendered mid-animation by a
        // table refresh) — avoids leaking orphaned ripple spans.
        const cleanup = () => ripple.remove();
        ripple.addEventListener("animationend", cleanup);
        setTimeout(cleanup, 700);
    }
})();