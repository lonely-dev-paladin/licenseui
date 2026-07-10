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
    const maxDevices = get("add_max_devices") || 1;

    if (!key) return showMessage("License key is required", "error");

    const res = await addKeyAPI(key, days, maxDevices);
    const data = await res.json();

    showMessage(data.message || data.error, res.ok ? "success" : "error");

    if (res.ok) {
        set("add_key", "");
        set("add_days", "");
        set("add_max_devices", "");
    }

    loadStats();
    loadUsers();
}

// =========================
// KEY GENERATOR
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

    if (res.ok) set("ban_key", "");

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

    if (res.ok) set("ban_key", "");

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

    if (res.ok) {
        set("ext_key", "");
        set("ext_days", "");
    }

    loadStats();
    loadUsers();
}

// =========================
// RESET DEVICE
// =========================
async function resetDevice() {
    const key = get("reset_key");
    const deviceId = get("reset_device_id");

    if (!key) return showMessage("License key is required", "error");

    const res = await resetDeviceAPI(key, deviceId);
    const data = await res.json();

    showMessage(data.message || data.error, res.ok ? "success" : "error");

    if (res.ok) {
        set("reset_key", "");
        set("reset_device_id", "");
    }

    loadUsers();
}

// Called by clicking a device chip in the Users table — jumps to the
// License Management tab with the Reset Device form pre-filled, so you
// don't have to manually retype a device id you can already see on screen.
function useDeviceForReset(key, deviceId) {
    set("reset_key", key);
    set("reset_device_id", deviceId);

    if (typeof showSection === "function") showSection("keys");

    showMessage(`Loaded device into Reset Device form`, "success");
}

// =========================
// DELETE
// =========================
async function del() {
    const key = get("del_key");

    if (!key) return showMessage("License key is required", "error");

    const confirmed = await showConfirm(
        `Delete "${key}" permanently? This cannot be undone.`
    );
    if (!confirmed) return;

    const res = await deleteAPI(key);
    const data = await res.json();

    showMessage(data.message || data.error, res.ok ? "success" : "error");

    if (res.ok) set("del_key", "");

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
// AUDIT LOG
// =========================
async function loadAuditLog() {
    if (!localStorage.getItem("token")) return;

    const res = await getAuditLogAPI(200);
    const data = await res.json();

    renderAuditLog(data);
}

async function clearAuditLog() {
    const confirmed = await showConfirm(
        "Clear your entire audit log? This cannot be undone."
    );
    if (!confirmed) return;

    const res = await clearAuditLogAPI();
    const data = await res.json();

    showMessage(data.message || data.error, res.ok ? "success" : "error");

    loadAuditLog();
}

// =========================
// ADMIN CONTEXT
// =========================
async function loadAdminContext() {
    const res = await getMeAPI();

    if (!res) return; // handled by safeFetch (redirects if needed)

    const data = await res.json();

    document.getElementById("adminName").innerText =
        "Logged in as: " + data.user;

    document.getElementById("adminRole").innerText =
        "Role: " + data.role.charAt(0).toUpperCase() + data.role.slice(1);
}

// =========================
// LOGOUT
// =========================
async function logout() {
    const confirmed = await showConfirm("Log out of the admin panel?");
    if (!confirmed) return;

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
window.resetDevice = resetDevice;
window.useDeviceForReset = useDeviceForReset;

window.loadStats = loadStats;
window.loadUsers = loadUsers;
window.loadAuditLog = loadAuditLog;
window.clearAuditLog = clearAuditLog;

window.logout = logout;

document.addEventListener("DOMContentLoaded", () => {
    loadAdminContext(); //load admin context as you can see
});

// main.js