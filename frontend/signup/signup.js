document.getElementById("signupForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!name || !email || !phone || !password) {
    showMessage("Please fill in all fields.", "error");
    return;
  }

  // Save signup info to localStorage
  localStorage.setItem("userName", name);
  localStorage.setItem("userEmail", email);
  localStorage.setItem("userPhone", phone);
  localStorage.setItem("userPassword", password);

  showMessage("Signup successful! Redirecting to login page...", "success");

  setTimeout(() => {
    window.location.href = "../Login/login.html";
  }, 1500);
});

function showMessage(text, type) {
  const msg = document.createElement("div");
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
