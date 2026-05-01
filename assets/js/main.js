// NOTE: api.js + ui.js must be loaded BEFORE this file

// =========================
// ADD KEY
// =========================
if (!localStorage.getItem("token")) {
    window.location.href = "login.html";
}

async function addKey() {
    const key = get("add_key");
    const days = get("add_days");

    if (!key) return showMessage("License key is required", "error");

    const res = await addKeyAPI(key, days);
    const data = await res.json();

    showMessage(data.message || data.error, res.ok ? "success" : "error");

    loadStats();
    loadUsers();
}

// =========================
// GENERATE KEY
// =========================
function generateKey() {
    const key =
        Math.random().toString(36).substring(2, 6).toUpperCase() + "-" +
        Math.random().toString(36).substring(2, 6).toUpperCase() + "-" +
        Math.random().toString(36).substring(2, 6).toUpperCase();

    set("add_key", key);
}

// =========================
// BAN
// =========================
async function ban() {
    const key = get("ban_key");

    const res = await banAPI(key);
    const data = await res.json();

    showMessage(data.message || data.error, res.ok ? "success" : "error");

    loadStats();
    loadUsers();
}

// =========================
// UNBAN
// =========================
async function unban() {
    const key = get("ban_key");

    const res = await unbanAPI(key);
    const data = await res.json();

    showMessage(data.message || data.error, res.ok ? "success" : "error");

    loadStats();
    loadUsers();
}

// =========================
// EXTEND
// =========================
async function extend() {
    const key = get("ext_key");
    const days = get("ext_days");

    const res = await extendAPI(key, days);
    const data = await res.json();

    showMessage(data.message || data.error, res.ok ? "success" : "error");

    loadStats();
    loadUsers();
}

// =========================
// DELETE
// =========================
async function del() {
    const key = get("del_key");

    const res = await deleteAPI(key);
    const data = await res.json();

    showMessage(data.message || data.error, res.ok ? "success" : "error");

    loadStats();
    loadUsers();
}

// =========================
// LOADERS (SAFE)
// =========================
async function loadStats() {
    if (!localStorage.getItem("token")) return;

    const res = await getStatsAPI();
    const data = await res.json();

    renderStats(data);
}

async function loadUsers() {
    if (!localStorage.getItem("token")) return;

    const res = await getUsersAPI();
    const data = await res.json();

    renderUsers(data);
}

// =========================
// LOGOUT
// =========================
async function logout() {
    try {
        await logoutAPI();
    } catch (e) {
        console.log("logout API failed, continuing frontend logout");
    }

    localStorage.removeItem("token");
    window.location.href = "login.html";
}

// =========================
// INIT (DASHBOARD ONLY)
// =========================
window.onload = () => {
    loadStats();
    loadUsers();
};

// =========================
// CONNECT TO HTML
// =========================
window.addKey = addKey;
window.generateKey = generateKey;

window.ban = ban;
window.unban = unban;
window.extend = extend;
window.del = del;

window.loadStats = loadStats;
window.loadUsers = loadUsers;

window.logout = logout;