// =========================
// UTILITIES
// =========================
function parseJwt(token) {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );

        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

// =========================
// VIEW SWITCHING
// =========================
function showView(viewId) {
    const views = ["loginView", "superadminLoginView", "createAdminView", "forgotPasswordView"];
    views.forEach(v => {
        const el = document.getElementById(v);
        if (el) el.style.display = "none";
    });

    const target = document.getElementById(viewId);
    if (target) target.style.display = "flex";
}

// =========================
// MESSAGE HELPERS
// =========================
function setMsg(el, text, type = "error") {
    if (!el) return;
    el.innerText = text;
    el.className = type;
}

function showMessage(message, type = "error") {
    setMsg(document.getElementById("message"), message, type);
}

function setErrorGlow() {
    const inputs = document.querySelectorAll("#username, #password");

    inputs.forEach(i => i.classList.add("input-error"));

    setTimeout(() => {
        inputs.forEach(i => i.classList.remove("input-error"));
    }, 2500);
}

// =========================
// ENTER-KEY-TO-SUBMIT HELPER
// =========================
// Several views on this page (superadmin login, create admin, forgot
// password, reset-status check) are plain inputs + a button with only an
// onclick handler — not a real <form> — so pressing Enter did nothing by
// default. This wires Enter in a given field to trigger the same button's
// click handler, without needing to restructure the markup into <form>s.
function onEnterClick(inputId, buttonId) {
    const input = document.getElementById(inputId);
    const button = document.getElementById(buttonId);
    if (!input || !button) return;

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            button.click();
        }
    });
}

// =========================
// LOGIN
// =========================
async function login() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        showMessage("Please fill in all fields", "error");
        setErrorGlow();
        return;
    }

    try {
        const res = await loginAPI(username, password);
        const data = await res.json();

        if (!res.ok) {
            showMessage(data.error || "Login failed", "error");
            setErrorGlow();
            return;
        }

        localStorage.setItem("token", data.token);

        showMessage("Login successful", "success");

        // Let the success message register for a moment, then play the
        // card's exit animation, then navigate — instead of a flat pause
        // followed by an abrupt cut to the dashboard.
        setTimeout(() => {
            const card = document.getElementById("loginCard");
            if (card) card.classList.add("login-success-exit");
        }, 500);

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1100);

    } catch (err) {
        console.error(err);
        showMessage("Server error. Please try again.", "error");
        setErrorGlow();
    }
}

// =========================
// INIT LOGIN FORM
// =========================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");

    if (form) {
        form.addEventListener("submit", e => {
            e.preventDefault();
            login();
        });
    }

    // AUTO SESSION CHECK
    const token = localStorage.getItem("token");

    if (token) {
        const user = parseJwt(token);

        if (user?.role === "superadmin") {
            showView("createAdminView");
            return;
        }
    }

    showView("loginView");
});

// =========================
// NAVIGATION
// =========================
document.getElementById("openSuperadminLogin")?.addEventListener("click", e => {
    e.preventDefault();
    showView("superadminLoginView");
});

document.getElementById("backToLogin")?.addEventListener("click", e => {
    e.preventDefault();
    showView("loginView");
});

// =========================
// SUPERADMIN LOGIN
// =========================
document.getElementById("superadminLoginBtn")?.addEventListener("click", async () => {
    const username = document.getElementById("saUsername").value.trim();
    const password = document.getElementById("saPassword").value.trim();
    const msg = document.getElementById("saLoginMsg");

    if (!username || !password) {
        setMsg(msg, "Fill all fields", "error");
        setErrorGlow();
        return;
    }

    try {
        const res = await loginAPI(username, password);
        const data = await res.json().catch(() => null);

        if (!res.ok || !data) {
            setMsg(msg, data?.error || "Login failed", "error");
            setErrorGlow();
            return;
        }

        const user = parseJwt(data.token);

        if (!user || user.role !== "superadmin") {
            setMsg(msg, "Not superadmin", "error");
            setErrorGlow();
            return;
        }

        localStorage.setItem("token", data.token);

        setMsg(msg, "Access granted", "success");

        setTimeout(() => {
            showView("createAdminView");
        }, 500);

    } catch (err) {
        console.error(err);
        setMsg(msg, "Server error", "error");
    }
});

// =========================
// CREATE ADMIN
// =========================
document.getElementById("createAdminBtn")?.addEventListener("click", async () => {
    const username = document.getElementById("newAdminUser").value.trim();
    const password = document.getElementById("newAdminPass").value.trim();
    const role = document.getElementById("newAdminRole").value;
    const msg = document.getElementById("createMsg");

    if (!username || !password) {
        setMsg(msg, "Fill all fields", "error");
        setErrorGlow();
        return;
    }

    try {
        const res = await fetch(API + "/create-admin", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify({ username, password, role })
        });

        const data = await res.json();

        if (!res.ok) {
            setMsg(msg, data.error || "Failed to create admin", "error");
            return;
        }

        setMsg(msg, data.message, "success");

        document.getElementById("newAdminUser").value = "";
        document.getElementById("newAdminPass").value = "";

    } catch (err) {
        console.error(err);
        setMsg(msg, "Server error", "error");
    }
});

// =========================
// LOGOUT
// =========================
document.getElementById("logoutSuperadmin")?.addEventListener("click", e => {
    e.preventDefault();

    localStorage.removeItem("token");

    ["saUsername", "saPassword", "newAdminUser", "newAdminPass"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    ["saLoginMsg", "createMsg"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = "";
    });

    showView("loginView");
});

// =========================
// FORGOT PASSWORD
// =========================
document.getElementById("openForgotPassword")?.addEventListener("click", e => {
    e.preventDefault();
    showView("forgotPasswordView");
});

document.getElementById("backToLoginFromReset")?.addEventListener("click", e => {
    e.preventDefault();
    showView("loginView");
});

document.getElementById("submitResetBtn")?.addEventListener("click", async () => {
    const username = document.getElementById("resetUsername").value.trim();
    const msgEl = document.getElementById("resetRequestMsg");

    if (!username) {
        setMsg(msgEl, "Enter your username first", "error");
        return;
    }

    try {
        const res = await fetch(API + "/password-reset-requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });
        const data = await res.json().catch(() => null);

        if (!res.ok || !data) {
            setMsg(msgEl, data?.error || "Something went wrong", "error");
            return;
        }

        setMsg(msgEl, "", "success");
        document.getElementById("resetResultBox").style.display = "block";
        document.getElementById("resetResultCode").innerText = data.reference_code;
        document.getElementById("resetUsername").value = "";

    } catch (err) {
        console.error(err);
        setMsg(msgEl, "Server error — please try again", "error");
    }
});

document.getElementById("checkResetStatusBtn")?.addEventListener("click", async () => {
    const code = document.getElementById("resetStatusRefCode").value.trim();
    const resultEl = document.getElementById("resetStatusResult");

    if (!code) {
        resultEl.innerHTML = `<span class="error">Enter a reference code first.</span>`;
        return;
    }

    resultEl.innerHTML = "Checking...";

    try {
        const res = await fetch(API + `/password-reset-requests/status?reference_code=${encodeURIComponent(code)}`);
        const data = await res.json();

        if (data.status === "not found") {
            resultEl.innerHTML = `<span class="error">No request found with that code.</span>`;
        } else if (data.status === "pending") {
            resultEl.innerHTML = `<span style="color:#ffb347;">⏳ Still pending review.</span>`;
        } else if (data.status === "approved") {
            resultEl.innerHTML = `<span class="success">✔ Approved! Contact the owner to receive your new password.</span>`;
        } else if (data.status === "rejected") {
            const reason = data.rejection_reason ? ` (${data.rejection_reason})` : "";
            resultEl.innerHTML = `<span class="error">✘ Rejected${reason}</span>`;
        }
    } catch (err) {
        console.error(err);
        resultEl.innerHTML = `<span class="error">Server error — please try again.</span>`;
    }
});

// Tap-to-copy for the reset reference code (same pattern as become-admin.js)
function copyResetCode() {
    const el = document.getElementById("resetResultCode");
    const code = el.innerText.trim();
    if (!code || code === "—") return;

    const showCopied = () => {
        const original = el.innerText;
        el.innerText = "Copied!";
        el.classList.add("copied");
        setTimeout(() => {
            el.innerText = original;
            el.classList.remove("copied");
        }, 1200);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(showCopied).catch(() => fallbackCopyResetCode(code, showCopied));
    } else {
        fallbackCopyResetCode(code, showCopied);
    }
}

function fallbackCopyResetCode(text, onSuccess) {
    try {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        onSuccess();
    } catch (err) {
        console.error("Copy failed:", err);
    }
}

// =========================
// ENTER-KEY-TO-SUBMIT WIRING
// =========================
// #loginForm is already a real <form> (handled above via its own submit
// listener), so it already submits on Enter. Everything below is NOT a
// <form> in the markup, so each needs its own explicit wiring.
document.addEventListener("DOMContentLoaded", () => {
    onEnterClick("saUsername", "superadminLoginBtn");
    onEnterClick("saPassword", "superadminLoginBtn");

    onEnterClick("newAdminUser", "createAdminBtn");
    onEnterClick("newAdminPass", "createAdminBtn");

    onEnterClick("resetUsername", "submitResetBtn");
    onEnterClick("resetStatusRefCode", "checkResetStatusBtn");
});

//login.js