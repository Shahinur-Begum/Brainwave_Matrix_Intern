document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value.trim();

    if (email === "" || password === "") {
        showMessage("Please fill in all fields", "error");
        return;
    }

    // Get stored signup info
    let storedEmail = localStorage.getItem("userEmail");
    let storedPassword = localStorage.getItem("userPassword");

    if (email === storedEmail && password === storedPassword) {
        showMessage("Login successful! Redirecting...", "success");
        setTimeout(() => {
            window.location.href = "../taskPage/task.html";
        }, 1500);
    } else {
        showMessage("Invalid email or password", "error");
    }
});

function loginWithGoogle() {
    window.open("https://accounts.google.com/signin", "_blank");
}

function loginWithFacebook() {
    window.open("https://www.facebook.com/login", "_blank");
}

document.querySelector(".forgot-link").addEventListener("click", function(e) {
    e.preventDefault();
    document.getElementById("forgotPopup").style.display = "flex";
});

function closeForgotPopup() {
    document.getElementById("forgotPopup").style.display = "none";
}

function sendResetLink() {
    let email = document.getElementById("resetEmail").value.trim();
    if (email === "") {
        showMessage("Please enter your email", "error");
        return;
    }
    closeForgotPopup();
    showMessage("Password reset link sent to " + email, "success");
}

function showMessage(text, type) {
    let msg = document.createElement("div");
    msg.className = `popup-message ${type}`;
    msg.innerText = text;
    document.body.appendChild(msg);

    setTimeout(() => {
        msg.classList.add("show");
    }, 10);

    setTimeout(() => {
        msg.classList.remove("show");
        setTimeout(() => msg.remove(), 300);
    }, 3000);
}
