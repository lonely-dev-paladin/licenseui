const API = "https://license-system-e71k.onrender.com";

// =========================
// PLAN SELECTION
// =========================
const planCards = document.querySelectorAll(".planCard");
const selectedPlanInput = document.getElementById("selectedPlan");

planCards.forEach(card => {
    card.addEventListener("click", () => {
        planCards.forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        selectedPlanInput.value = card.dataset.plan;
    });
});

// =========================
// MESSAGE HELPER
// =========================
function setMsg(text, type = "error") {
    const el = document.getElementById("requestMsg");
    el.innerText = text;
    el.className = type;
}

// =========================
// FILE -> BASE64
// =========================
function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // reader.result looks like "data:image/png;base64,AAAA..."
            // strip the prefix, keep just the raw base64 payload
            const base64 = reader.result.split(",")[1];
            resolve(base64);
        };
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
    });
}

// =========================
// SUBMIT REQUEST
// =========================
document.getElementById("requestForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg("");

    const plan = selectedPlanInput.value;
    const username = document.getElementById("reqUsername").value.trim();
    const password = document.getElementById("reqPassword").value;
    const passwordConfirm = document.getElementById("reqPasswordConfirm").value;
    const gcashRef = document.getElementById("reqGcashRef").value.trim();
    const fileInput = document.getElementById("reqScreenshot");
    const file = fileInput.files[0];

    if (!plan) return setMsg("Please select a plan above.");
    if (username.length < 3) return setMsg("Username must be at least 3 characters.");
    if (password.length < 8) return setMsg("Password must be at least 8 characters.");
    if (password !== passwordConfirm) return setMsg("Passwords do not match.");
    if (!gcashRef) return setMsg("Please enter your GCash reference number.");

    // Screenshot is optional now — some WebView-based browsers can't open
    // the file picker, so buyers shouldn't be blocked from submitting
    // without one. If they did attach a file, it's still validated.
    let screenshot_base64 = null;
    let screenshot_mime = null;

    if (file) {
        const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            return setMsg("Screenshot must be PNG, JPG, or WEBP.");
        }
        if (file.size > 3 * 1024 * 1024) {
            return setMsg("Screenshot must be under 3MB.");
        }
    }

    const submitBtn = document.getElementById("submitRequestBtn");
    submitBtn.disabled = true;
    submitBtn.innerText = "Submitting...";

    try {
        if (file) {
            screenshot_base64 = await readFileAsBase64(file);
            screenshot_mime = file.type;
        }

        const res = await fetch(`${API}/admin-requests`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username, password, plan,
                gcash_reference: gcashRef,
                screenshot_base64,
                screenshot_mime
            })
        });

        const data = await res.json();

        if (!res.ok) {
            setMsg(data.error || "Something went wrong.", "error");
            return;
        }

        document.getElementById("requestForm").style.display = "none";
        document.getElementById("resultBox").style.display = "block";
        document.getElementById("resultCode").innerText = data.reference_code;
        setMsg("");

    } catch (err) {
        console.error(err);
        setMsg("Server error — please try again.", "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "Submit Request";
    }
});

// =========================
// STATUS CHECK
// =========================
document.getElementById("checkStatusBtn").addEventListener("click", async () => {
    const code = document.getElementById("statusRefCode").value.trim();
    const resultEl = document.getElementById("statusResult");

    if (!code) {
        resultEl.innerHTML = `<span class="error">Enter a reference code first.</span>`;
        return;
    }

    resultEl.innerHTML = "Checking...";

    try {
        const res = await fetch(`${API}/admin-requests/status?reference_code=${encodeURIComponent(code)}`);
        const data = await res.json();

        if (data.status === "not found") {
            resultEl.innerHTML = `<span class="error">No request found with that code.</span>`;
            return;
        }

        if (data.status === "pending") {
            resultEl.innerHTML = `<span style="color:#ffb347;">⏳ Still pending review.</span>`;
        } else if (data.status === "approved") {
            resultEl.innerHTML = `<span class="success">✔ Approved! <a href="login.html" style="color:#00f7ff;">Go to Login →</a></span>`;
        } else if (data.status === "rejected") {
            const reasonText = data.rejection_reason
                ? ` Owner reason: "${data.rejection_reason}"`
                : "";
            resultEl.innerHTML = `<span class="error">✘ Rejected.${reasonText}</span>`;
        }
    } catch (err) {
        console.error(err);
        resultEl.innerHTML = `<span class="error">Server error — please try again.</span>`;
    }
});