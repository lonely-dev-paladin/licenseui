// NOTE: api.js + ui.js must be loaded BEFORE this file

// set once loadAdminContext() resolves; used by renderAdmins() to hide the
// "Terminate" button on your own account row
let currentAdminUsername = null;

let sessionHeartbeatId = null;      // periodic "am I still an admin?" check
let isHandlingTermination = false;  // guards against showing the popup twice
// if several requests 403 at once

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
// Prefix map for the Generate Key card's key-type dropdown. "default" keeps
// the original plain random format (no prefix) exactly as before; every
// other type just prepends its own tag onto the same random suffix logic.
const KEY_TYPE_PREFIXES = {
    default: "",
    CODM: "CODM-",
    MLBB: "MLBB-",
    BS: "BS-",
    CF: "CF-"
};

// Generates a random N-digit numeric string, e.g. genDigits(4) -> "9898".
// Zero-padded so it's always exactly `length` digits (e.g. never "098" for 4).
function genDigits(length) {
    let out = "";
    for (let i = 0; i < length; i++) {
        out += Math.floor(Math.random() * 10);
    }
    return out;
}

// Default keeps the exact original format (unchanged): "XXXXX-XXXX" from
// base-36 random characters, matching the backend's minimum license key
// length. Every prefixed type (CODM/MLBB/BS/CF) instead gets a short,
// clean 4-digit numeric suffix, e.g. "CODM-9898", "BS-9090", "CF-9879".
function generateKey() {
    const typeSelect = document.getElementById("key_type");
    const type = typeSelect ? typeSelect.value : "default";
    const prefix = KEY_TYPE_PREFIXES[type] || "";

    let key;
    if (type === "default") {
        key =
            Math.random().toString(36).substring(2, 7).toUpperCase() + "-" +
            Math.random().toString(36).substring(2, 6).toUpperCase();
    } else {
        key = prefix + genDigits(4);
    }

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
// BLOCK / UNBLOCK DEVICE (global per-admin HWID blocklist)
// =========================
// Unlike Ban (disables the whole key) or Reset Device (just unbinds so any
// device can rebind), this stops one specific device from reconnecting to
// ANY of this admin's keys — even a different one, even after a reset.
async function blockDevice() {
    const key = get("block_key");
    const deviceId = get("block_device_id");
    const reason = get("block_reason");

    if (!key) return showMessage("License key is required", "error");
    if (!deviceId) return showMessage("Device ID is required", "error");

    const res = await blockDeviceAPI(key, deviceId, reason);
    const data = await res.json();

    showMessage(data.message || data.error, res.ok ? "success" : "error");

    if (res.ok) {
        set("block_key", "");
        set("block_device_id", "");
        set("block_reason", "");
    }

    loadUsers();
    loadBlockedDevices();
}

// deviceIdArg lets the "Unblock" button in the Blocked Devices table call
// this directly with a known device id, bypassing the manual-entry field
// used when unblocking from the License Management card instead.
async function unblockDevice(deviceIdArg) {
    const deviceId = deviceIdArg || get("block_device_id");

    if (!deviceId) return showMessage("Device ID is required", "error");

    const confirmed = await showConfirm(`Unblock device "${deviceId}"?`);
    if (!confirmed) return;

    const res = await unblockDeviceAPI(deviceId);
    const data = await res.json();

    showMessage(data.message || data.error, res.ok ? "success" : "error");

    if (res.ok && !deviceIdArg) set("block_device_id", "");

    loadBlockedDevices();
}

async function loadBlockedDevices() {
    if (!localStorage.getItem("token")) return;

    const res = await getBlockedDevicesAPI();
    const data = await res.json();

    renderBlockedDevices(data);
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
// PENDING ADMIN REQUESTS (superadmin only)
// =========================
async function loadAdminRequests() {
    if (!localStorage.getItem("token")) return;

    const res = await getAdminRequestsAPI("pending");
    const data = await res.json();

    renderAdminRequests(data);
}

async function viewRequestScreenshot(id) {
    const res = await getAdminRequestScreenshotAPI(id);
    const data = await res.json();

    if (!res.ok) {
        showMessage(data.error || "Could not load screenshot", "error");
        return;
    }

    const img = document.getElementById("screenshot-img");
    img.src = `data:${data.screenshot_mime};base64,${data.screenshot_base64}`;

    const overlay = document.getElementById("screenshot-overlay");
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("show"));
}

function closeScreenshot() {
    const overlay = document.getElementById("screenshot-overlay");
    overlay.classList.remove("show");
    setTimeout(() => { overlay.hidden = true; }, 200);
}

async function approveRequest(id, username) {
    const confirmed = await showConfirm(`Approve admin request for "${username}"?`);
    if (!confirmed) return;

    const res = await approveAdminRequestAPI(id);
    const data = await res.json();

    showMessage(data.message || data.error, res.ok ? "success" : "error");

    loadAdminRequests();
}

async function rejectRequest(id, username) {
    const reason = await showPrompt(`Reject admin request for "${username}"? Please state the reason of rejection.`);
    if (reason === null) return; // cancelled

    const res = await rejectAdminRequestAPI(id, reason);
    const data = await res.json();

    showMessage(data.message || data.error, res.ok ? "success" : "error");

    loadAdminRequests();
}

// =========================
// ADMIN MANAGEMENT (superadmin only)
// =========================
async function loadAdmins() {
    if (!localStorage.getItem("token")) return;

    const res = await getAdminsAPI();
    const data = await res.json();

    renderAdmins(data);
}

async function terminateAdmin(id, username, role, keyCount, logCount) {
    const message =
        `This will permanently delete "${username}" (${role}), along with ` +
        `${keyCount} license key(s) and ${logCount} audit log entr${logCount === 1 ? "y" : "ies"}. ` +
        `This cannot be undone.`;

    const confirmed = await showTypedConfirm(message, username);
    if (!confirmed) return;

    const res = await terminateAdminAPI(id);
    const data = await res.json();

    showMessage(data.message || data.error, res.ok ? "success" : "error");

    loadAdmins();
}

// =========================
// PASSWORD RESET REQUESTS (superadmin only)
// =========================
async function loadPasswordResets() {
    if (!localStorage.getItem("token")) return;

    const res = await getPasswordResetsAPI("pending");
    const data = await res.json();

    renderPasswordResets(data);
}

async function approvePasswordReset(id, username) {
    const confirmed = await showConfirm(
        `Approve password reset for "${username}"? A new password will be generated.`
    );
    if (!confirmed) return;

    const res = await approvePasswordResetAPI(id);
    const data = await res.json();

    if (!res.ok) {
        showMessage(data.error || "Something went wrong", "error");
        return;
    }

    // Show the new password once, in its own modal — it's never retrievable
    // again after this, since the backend never exposes it through any
    // other endpoint.
    await showNewPassword(data.username, data.new_password);

    loadPasswordResets();
}

async function rejectPasswordReset(id, username) {
    const reason = await showPrompt(`Reject password reset for "${username}"? Please state the reason of rejection.`);
    if (reason === null) return; // cancelled

    const res = await rejectPasswordResetAPI(id, reason);
    const data = await res.json();

    showMessage(data.message || data.error, res.ok ? "success" : "error");

    loadPasswordResets();
}

function showNewPassword(username, password) {
    const overlay = document.getElementById("new-password-overlay");
    const text = document.getElementById("new-password-text");
    const codeEl = document.getElementById("new-password-code");
    const closeBtn = document.getElementById("new-password-close");

    if (!overlay) {
        alert(`New password for ${username}: ${password}`);
        return Promise.resolve();
    }

    text.innerText = `New password for "${username}":`;
    codeEl.innerText = password;
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("show"));

    return new Promise(resolve => {
        function cleanup() {
            overlay.classList.remove("show");
            setTimeout(() => { overlay.hidden = true; }, 200);
            closeBtn.removeEventListener("click", onClose);
            resolve();
        }
        function onClose() { cleanup(); }

        closeBtn.addEventListener("click", onClose);
    });
}

// Tap-to-copy for the newly generated password (same pattern used elsewhere)
function copyNewPassword() {
    const el = document.getElementById("new-password-code");
    const password = el.innerText.trim();
    if (!password || password === "—") return;

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
        navigator.clipboard.writeText(password).then(showCopied).catch(() => fallbackCopyPassword(password, showCopied));
    } else {
        fallbackCopyPassword(password, showCopied);
    }
}

function fallbackCopyPassword(text, onSuccess) {
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

    currentAdminUsername = data.user; // used by renderAdmins to hide "Terminate" on your own row

    if (data.role === "superadmin") {
        const requestsNav = document.getElementById("pendingRequestsNav");
        if (requestsNav) requestsNav.style.display = "";

        const adminsNav = document.getElementById("adminsNav");
        if (adminsNav) adminsNav.style.display = "";

        const passwordResetsNav = document.getElementById("passwordResetsNav");
        if (passwordResetsNav) passwordResetsNav.style.display = "";
    }
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

    stopSessionHeartbeat();
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

// =========================
// TERMINATION HANDLING (superadmin deleted this account)
// =========================
// Called from safeFetch() the moment ANY authenticated request comes back
// with the "terminated" flag — whether that's from clicking something, or
// from the idle heartbeat below catching it while the person wasn't doing
// anything at all.
async function forceLogoutTerminated(message) {
    if (isHandlingTermination) return; // don't stack multiple popups
    isHandlingTermination = true;

    stopSessionHeartbeat();

    await showAlert(message || "You have been terminated by the owner.");

    localStorage.removeItem("token");
    window.location.href = "login.html";
}

// Periodically re-checks that this session is still valid even if the
// person isn't clicking anything — otherwise a terminated admin could sit
// on the dashboard indefinitely with no indication anything happened until
// they next tried an action.
function startSessionHeartbeat() {
    if (sessionHeartbeatId) return; // already running
    sessionHeartbeatId = setInterval(() => {
        if (!localStorage.getItem("token")) return;
        getMeAPI(); // safeFetch() inside this call triggers forceLogoutTerminated if needed
    }, 20000); // every 20s
}

function stopSessionHeartbeat() {
    if (sessionHeartbeatId) {
        clearInterval(sessionHeartbeatId);
        sessionHeartbeatId = null;
    }
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
window.blockDevice = blockDevice;
window.unblockDevice = unblockDevice;
window.loadBlockedDevices = loadBlockedDevices;

window.loadStats = loadStats;
window.loadUsers = loadUsers;
window.loadAuditLog = loadAuditLog;
window.clearAuditLog = clearAuditLog;
window.loadAdminRequests = loadAdminRequests;
window.viewRequestScreenshot = viewRequestScreenshot;
window.closeScreenshot = closeScreenshot;
window.approveRequest = approveRequest;
window.rejectRequest = rejectRequest;
window.loadAdmins = loadAdmins;
window.terminateAdmin = terminateAdmin;
window.loadPasswordResets = loadPasswordResets;
window.approvePasswordReset = approvePasswordReset;
window.rejectPasswordReset = rejectPasswordReset;
window.copyNewPassword = copyNewPassword;

window.logout = logout;
window.forceLogoutTerminated = forceLogoutTerminated;
window.startSessionHeartbeat = startSessionHeartbeat;
window.stopSessionHeartbeat = stopSessionHeartbeat;

document.addEventListener("DOMContentLoaded", () => {
    loadAdminContext(); //load admin context as you can see
    startSessionHeartbeat();
});

// =========================
// ENTER-KEY-TO-SUBMIT WIRING
// =========================
// None of the License Management cards are real <form> elements — each is
// just inputs next to a button with an onclick — so Enter did nothing in
// any of them by default. This wires Enter in a given field to trigger the
// same action its card's button already performs.
//
// Ban / Unban Key is deliberately left unwired: that field has two opposite
// actions (Ban vs. Unban) and neither has a confirmation step, so picking
// one to fire on a stray Enter risks an unintended ban/unban. Wire it
// explicitly (e.g. to ban()) if you'd like a default here.
function onEnterAction(inputId, handler) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handler();
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Generate Key card -> "Send to Database"
    onEnterAction("add_key", addKey);
    onEnterAction("add_days", addKey);
    onEnterAction("add_max_devices", addKey);

    // Extend Key card
    onEnterAction("ext_key", extend);
    onEnterAction("ext_days", extend);

    // Reset Device card
    onEnterAction("reset_key", resetDevice);
    onEnterAction("reset_device_id", resetDevice);

    // Delete Key card (already protected by its own showConfirm() modal)
    onEnterAction("del_key", del);
});

// main.js