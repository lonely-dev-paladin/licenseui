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