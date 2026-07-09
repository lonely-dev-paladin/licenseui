// =========================
// MESSAGE
// =========================

function showMessage(msg, type = "success") {
    const box = document.getElementById("message");
    if (!box) return;

    box.innerText = msg;

    // use the CSS-defined success/error variants instead of inline colors,
    // so the toast matches the rest of the neon/glow theme
    box.classList.remove("success", "error");
    box.classList.add(type === "success" ? "success" : "error");

    box.classList.add("show");

    clearTimeout(box._timeout);
    box._timeout = setTimeout(() => {
        box.classList.remove("show");
    }, 2500);
}

// =========================
// INPUT HELPERS
// =========================
function get(id) {
    return document.getElementById(id).value;
}

function set(id, value) {
    document.getElementById(id).value = value;
}

// =========================
// DASHBOARD UI
// =========================
function renderStats(data) {
    document.getElementById("stat_total").innerText = data.total || 0;
    document.getElementById("stat_active").innerText = data.active || 0;
    document.getElementById("stat_banned").innerText = data.banned || 0;
    document.getElementById("stat_expired").innerText = data.expired || 0;
}

// =========================
// STATUS BADGE HELPER
// =========================
// Maps a raw status string to the .badge markup defined in main.css.
// Falls back to a neutral badge for unrecognized values instead of breaking.
function statusBadge(status) {
    const key = String(status).toLowerCase();

    const map = {
        active: ["badge-success", "Active"],
        banned: ["badge-danger", "Banned"],
        expired: ["badge-warning", "Expired"],
        true: ["badge-danger", "Banned"],
        false: ["badge-success", "Not Banned"],
    };

    const [cls, label] = map[key] || ["badge-neutral", status];
    return `<span class="badge ${cls}"><span class="badge-dot"></span>${label}</span>`;
}

// =========================
// USERS UI
// =========================
function renderUsers(data) {
    const container = document.getElementById("users_table");

    if (!data.users) {
        container.innerHTML = "<p style='color:var(--danger)'>No data found</p>";
        return;
    }

    let html = `
        <table>
        <tr>
            <th>License Key</th>
            <th>Bound Device</th>
            <th>Status</th>
            <th>Banned</th>
            <th>Time Left</th>
            <th>State</th>
        </tr>
    `;

    data.users.forEach(u => {
        html += `
        <tr>
            <td class="key-cell"> ${u.license_key}<span class="copy-icon" onClick="copyKey('${u.license_key}')"> &#10064; </span></td>
            <td>${u.bound_device}</td>
            <td>${statusBadge(u.status)}</td>
            <td>${statusBadge(u.banned)}</td>
            <td>${u.time_left}</td>
            <td>${u.state}</td>
        </tr>
        `;
    });

    html += `</table>`;
    container.innerHTML = html;
}

// =========================
// AUDIT LOG UI
// =========================
function renderAuditLog(data) {
    const container = document.getElementById("audit_table");
    if (!container) return;

    if (!data.entries || !data.entries.length) {
        container.innerHTML =
            "<p style='color:var(--text-color); opacity:0.6;'>No actions logged yet.</p>";
        return;
    }

    let html = `
        <table>
        <tr>
            <th>When</th>
            <th>Admin</th>
            <th>Action</th>
            <th>Target</th>
            <th>Details</th>
        </tr>
    `;

    data.entries.forEach(e => {
        const when = new Date(e.created_at).toLocaleString();

        html += `
        <tr>
            <td>${when}</td>
            <td>${e.username}</td>
            <td><span class="badge badge-neutral"><span class="badge-dot"></span>${e.action}</span></td>
            <td>${e.target || "—"}</td>
            <td>${e.details || "—"}</td>
        </tr>
        `;
    });

    html += `</table>`;
    container.innerHTML = html;
}

//COPY FUNCTION
function copyKey(key) {
    navigator.clipboard.writeText(key)
        .then(() => {
            showMessage("Copied to clipboard!", "success");
        })
        .catch(() => {
            showMessage("Failed to copy", "error");
        });
}

// =========================
// CONFIRM MODAL
// =========================
// Themed replacement for the native confirm() popup.
// Usage: if (await showConfirm("Delete this key?")) { ...do the thing... }
function showConfirm(message) {
    const overlay = document.getElementById("confirm-overlay");
    const text = document.getElementById("confirm-text");
    const okBtn = document.getElementById("confirm-ok");
    const cancelBtn = document.getElementById("confirm-cancel");

    if (!overlay) return Promise.resolve(window.confirm(message)); // fallback

    text.innerText = message;
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add("show"));

    return new Promise(resolve => {
        function cleanup(result) {
            overlay.classList.remove("show");
            setTimeout(() => { overlay.hidden = true; }, 200);
            okBtn.removeEventListener("click", onOk);
            cancelBtn.removeEventListener("click", onCancel);
            overlay.removeEventListener("click", onOverlayClick);
            resolve(result);
        }

        function onOk() { cleanup(true); }
        function onCancel() { cleanup(false); }
        function onOverlayClick(e) {
            if (e.target === overlay) cleanup(false);
        }

        okBtn.addEventListener("click", onOk);
        cancelBtn.addEventListener("click", onCancel);
        overlay.addEventListener("click", onOverlayClick);
    });
}

//ui.js