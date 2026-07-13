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
    const views = ["loginView", "superadminLoginView", "createAdminView"];
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
            window.location.href = "/";
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

//login.js