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

// clears a text/number field and refocuses it (used by the "x" clear icon)
function clearInput(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = "";
    el.focus();
}

// =========================
// DASHBOARD UI
// =========================
function renderStats(data) {
    document.getElementById("stat_total").innerText = data.total || 0;
    document.getElementById("stat_active").innerText = data.active || 0;
    document.getElementById("stat_banned").innerText = data.banned || 0;
    document.getElementById("stat_expired").innerText = data.expired || 0;
    document.getElementById("stat_pending").innerText = data.pending || 0;
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
        pending: ["badge-neutral", "Pending"],
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
    const singleContainer = document.getElementById("single_users_table");
    const multiContainer = document.getElementById("multi_users_table");

    if (!data.users) {
        singleContainer.innerHTML = "<p style='color:var(--danger)'>No data found</p>";
        multiContainer.innerHTML = "";
        return;
    }

    // A "single-device" license is one created with max_devices = 1;
    // anything above that goes in the multi-device table instead, so the
    // two license types never get mixed in the same list.
    const singleLicenses = data.users.filter(u => u.max_devices === 1);
    const multiLicenses = data.users.filter(u => u.max_devices > 1);

    singleContainer.innerHTML = buildUsersTable(singleLicenses, false);
    multiContainer.innerHTML = buildUsersTable(multiLicenses, true);
}

function buildUsersTable(users, isMulti) {
    if (!users.length) {
        const label = isMulti ? "multi-device" : "single-device";
        return `<p class="no-devices-label">No ${label} licenses yet.</p>`;
    }

    let html = `
        <table>
        <tr>
            <th>License Key</th>
            <th>${isMulti ? "Devices Connected" : "Device Connected"}</th>
            <th>Status</th>
            <th>Banned</th>
            <th>Time Left</th>
            <th>State</th>
        </tr>
    `;

    users.forEach(u => {
        html += `
        <tr>
            <td class="key-cell"> ${u.license_key}<span class="copy-icon" onClick="copyKey('${u.license_key}')"> &#10064; </span></td>
            <td>${renderDeviceChips(u, isMulti)}</td>
            <td>${statusBadge(u.status)}</td>
            <td>${statusBadge(u.banned)}</td>
            <td>${u.time_left}</td>
            <td>${statusBadge(u.state)}</td>
        </tr>
        `;
    });

    html += `</table>`;
    return html;
}

// Renders each bound device as a small clickable chip. Clicking one
// auto-fills the Reset Device form with that exact license + device id,
// since Reset Device needs the device id typed in manually otherwise.
// showCount is only true for the multi-device table — a 1/1 count on a
// single-device license doesn't tell the admin anything useful.
function renderDeviceChips(u, showCount) {
    if (!u.devices || !u.devices.length) {
        const countSuffix = showCount ? ` (0/${u.max_devices})` : "";
        return `<span class="no-devices-label">none bound${countSuffix}</span>`;
    }

    const chips = u.devices.map(d => `
        <span class="device-chip"
              title="Click to load into Reset Device form"
              onclick="useDeviceForReset('${u.license_key}', '${d}')">${d}</span>
    `).join("");

    const countLabel = showCount
        ? `<span class="device-count-label">${u.device_count}/${u.max_devices}</span>`
        : "";

    return `<div class="device-chip-wrap">${chips}${countLabel}</div>`;
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

// =========================
// PENDING ADMIN REQUESTS UI
// =========================
const PLAN_LABELS = { week: "1 Week", month: "1 Month", lifetime: "Lifetime" };

function renderAdminRequests(data) {
    const container = document.getElementById("requests_table");
    if (!container) return;

    if (!data.requests || !data.requests.length) {
        container.innerHTML =
            "<p style='color:var(--text-color); opacity:0.6;'>No pending requests.</p>";
        return;
    }

    let html = `
        <table>
        <tr>
            <th>Reference Code</th>
            <th>Username</th>
            <th>Plan</th>
            <th>GCash Ref</th>
            <th>Submitted</th>
            <th>Actions</th>
        </tr>
    `;

    data.requests.forEach(r => {
        const when = new Date(r.created_at).toLocaleString();
        const planLabel = PLAN_LABELS[r.plan] || r.plan;
        const safeUsername = r.username.replace(/'/g, "\\'");

        const proofButton = r.has_screenshot
            ? `<button onclick="viewRequestScreenshot(${r.id})">View Proof</button>`
            : `<span class="no-devices-label">No screenshot</span>`;

        html += `
        <tr>
            <td>${r.reference_code}</td>
            <td>${r.username}</td>
            <td><span class="badge badge-neutral"><span class="badge-dot"></span>${planLabel}</span></td>
            <td>${r.gcash_reference}</td>
            <td>${when}</td>
            <td>
                <div class="request-actions">
                    ${proofButton}
                    <button class="btn-primary" onclick="approveRequest(${r.id}, '${safeUsername}')">Approve</button>
                    <button class="btn-danger" onclick="rejectRequest(${r.id}, '${safeUsername}')">Reject</button>
                </div>
            </td>
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

// =========================
// PROMPT MODAL (reason-for-rejection, etc.)
// =========================
// Themed replacement for the native prompt() popup. Requires non-empty
// input — shows an inline error instead of submitting blank.
// Usage: const reason = await showPrompt("Why?"); if (reason === null) return; // cancelled
function showPrompt(message) {
    const overlay = document.getElementById("reject-overlay");
    const text = document.getElementById("reject-text");
    const input = document.getElementById("reject-reason-input");
    const errorEl = document.getElementById("reject-reason-error");
    const okBtn = document.getElementById("reject-ok");
    const cancelBtn = document.getElementById("reject-cancel");

    if (!overlay) return Promise.resolve(window.prompt(message)); // fallback

    text.innerText = message;
    input.value = "";
    errorEl.hidden = true;
    overlay.hidden = false;
    requestAnimationFrame(() => {
        overlay.classList.add("show");
        input.focus();
    });

    return new Promise(resolve => {
        function cleanup(result) {
            overlay.classList.remove("show");
            setTimeout(() => { overlay.hidden = true; }, 200);
            okBtn.removeEventListener("click", onOk);
            cancelBtn.removeEventListener("click", onCancel);
            overlay.removeEventListener("click", onOverlayClick);
            input.removeEventListener("keydown", onKeydown);
            resolve(result);
        }

        function onOk() {
            const value = input.value.trim();
            if (!value) {
                errorEl.hidden = false;
                input.focus();
                return;
            }
            cleanup(value);
        }

        function onCancel() { cleanup(null); }

        function onOverlayClick(e) {
            if (e.target === overlay) cleanup(null);
        }

        function onKeydown(e) {
            if (e.key === "Enter") onOk();
        }

        okBtn.addEventListener("click", onOk);
        cancelBtn.addEventListener("click", onCancel);
        overlay.addEventListener("click", onOverlayClick);
        input.addEventListener("keydown", onKeydown);
    });
}

//ui.js