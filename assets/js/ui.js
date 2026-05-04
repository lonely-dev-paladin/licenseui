// =========================
// MESSAGE
// =========================

function showMessage(msg, type = "success") {
    const box = document.getElementById("message");
    if (!box) return;

    box.innerText = msg;

    box.style.background = (type === "success") ? "#22c55e" : "#ef4444";

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
            <th>Time Left</th>
            <th>State</th>
        </tr>
    `;

    data.users.forEach(u => {
        html += `
        <tr>
            <td class="key-cell"> ${u.license_key}<span class="copy-icon" onClick="copyKey('${u.license_key}')"> &#10064; </span></td>
            <td>${u.bound_device}</td>
            <td>${u.status}</td>
            <td>${u.banned}</td>
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