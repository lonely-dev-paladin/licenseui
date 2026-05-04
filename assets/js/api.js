const API = "https://license-system-e71k.onrender.com"; /*  remove the quote when uploading to database*/ 
/*const API = "http://127.0.0.1:5000"; /*COMMENT THIS WHEN UPDATING DB*/

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

async function addKeyAPI(key, days) {
    return safeFetch(API + "/add", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ license_key: key, days })
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

async function getStatsAPI() {
    return safeFetch(API + "/stats", { headers: headers() });
}

async function getUsersAPI() {
    return safeFetch(API + "/users", { headers: headers() });
}

// LOGOUT
async function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}