// =========================
// MESSAGE
// =========================

function showMessage(msg, type = "success") {
    const box = document.getElementById("message");

    // safety check (VERY IMPORTANT)
    if (!box) return;

    box.innerText = msg;
    box.style.padding = "10px";
    box.style.margin = "10px 0";
    box.style.borderRadius = "6px";
    box.style.color = "white";
    box.style.background = (type === "success") ? "#22c55e" : "#ef4444";

    setTimeout(() => {
        box.innerText = "";
        box.style.padding = "0";
        box.style.background = "transparent";
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
// USERS UI
// =========================
function renderUsers(data) {
    const container = document.getElementById("users_table");

    if (!data.users) {
        container.innerHTML = "<p style='color:red'>No data found</p>";
        return;
    }

    let html = `
        <table>
        <tr>
            <th>License Key</th>
            <th>Bound Device</th>
            <th>Status</th>
            <th>Banned</th>
            <th>Days Left</th>
        </tr>
    `;

    data.users.forEach(u => {
        html += `
        <tr>
            <td>${u.license_key}</td>
            <td>${u.bound_device}</td>
            <td>${u.status}</td>
            <td>${u.banned}</td>
            <td>${u.days_left}</td>
        </tr>
        `;
    });

    html += `</table>`;
    container.innerHTML = html;
}