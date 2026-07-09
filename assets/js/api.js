const API = "https://license-system-e71k.onrender.com"; /*  remove comment when uploading to database*/
/*const API = "http://127.0.0.1:5000"; /* use for local testing bago i-push sa db*/

function headers() {
    return {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + localStorage.getItem("token")
    };
}

// =========================
// API ONLY
// =========================
async function safeFetch(url, options) {
    const res = await fetch(url, options);

    if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "login.html";
        return null;
    }

    return res;
}

async function loginAPI(username, password) {
    return safeFetch(API + "/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });
}

async function addKeyAPI(key, days, maxDevices) {
    return safeFetch(API + "/add", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ license_key: key, days, max_devices: maxDevices })
    });
}

async function banAPI(key) {
    return safeFetch(API + "/ban", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ license_key: key })
    });
}

async function unbanAPI(key) {
    return safeFetch(API + "/unban", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ license_key: key })
    });
}

async function extendAPI(key, days) {
    return safeFetch(API + "/extend", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ license_key: key, days })
    });
}

async function deleteAPI(key) {
    return safeFetch(API + "/delete", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ license_key: key })
    });
}

// unbind a license from its currently bound device(s) (new backend endpoint)
// pass deviceId to unbind just that one device, or omit it to reset all
async function resetDeviceAPI(key, deviceId) {
    return safeFetch(API + "/reset-device", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ license_key: key, device_id: deviceId || undefined })
    });
}

async function getStatsAPI() {
    return safeFetch(API + "/stats", { headers: headers() });
}

async function getUsersAPI() {
    return safeFetch(API + "/users", { headers: headers() });
}

// history of admin actions (ban/unban/extend/delete/create/reset-device)
async function getAuditLogAPI(limit = 100) {
    return safeFetch(API + `/audit-log?limit=${limit}`, { headers: headers() });
}

// wipes the current admin's own audit history
async function clearAuditLogAPI() {
    return safeFetch(API + "/audit-log", {
        method: "DELETE",
        headers: headers()
    });
}

//ADMIN CONTEXT
async function getMeAPI() {
    return safeFetch(API + "/me", {
        headers: headers()
    });
}

//api.js