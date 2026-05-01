// =========================
// LOGIN ONLY
// =========================

async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
        showMessage("Please fill in all fields", "error");
        setErrorGlow();
        return;
    }

    try {
        const res = await loginAPI(username, password);
        const data = await res.json();

        if (!res.ok) {
            showMessage(data.error || "Login failed", "error");
            setErrorGlow();
            return;
        }

        // Save token
        localStorage.setItem("token", data.token);

        // Redirect to dashboard
        showMessage("Login successful", "success");

        setTimeout(() => {
            window.location.href = "index.html";
        }, 2500);

    } catch (err) {
        console.error(err);
        showMessage("Server error. Please try again.", "error");
        setErrorGlow();
    }
}

document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();
    login();
});

//HELPER FOR GLOW
function setErrorGlow() {
    const inputs = document.querySelectorAll("#username, #password");

    inputs.forEach(input => {
        input.classList.add("input-error");
    });

    setTimeout(() => {
        inputs.forEach(input => {
            input.classList.remove("input-error");
        });
    }, 2500);
}

// =========================
// CONNECT TO HTML
// =========================
window.login = login;