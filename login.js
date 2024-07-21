function showSignupForm() {
  document.getElementById("signup-form").style.display = "block";
  document.getElementById("login-form").style.display = "none";
}
function showLoginForm() {
  document.getElementById("signup-form").style.display = "none";
  document.getElementById("login-form").style.display = "block";
}
function signup() {
  const username = document.getElementById("signup-username").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  if (username && password && email) {
    localStorage.setItem("user", JSON.stringify({ username, password, email }));
    alert("Signup successful! Please login.");
    showLoginForm();
  } else {
    alert("Please enter a username , email and password.");
  }
}
function login() {
  const username = document.getElementById("login-username").value;
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  const user = JSON.parse(localStorage.getItem("user"));
  if (
    user &&
    user.username === username &&
    user.password === password &&
    user.email === email
  ) {
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("username", username);
    window.location.href = "user.html";
  } else {
    alert("Invalid username or password.");
  }
}
window.onload = function () {
  if (localStorage.getItem("loggedIn") === "true") {
    window.location.href = "user.html";
  }
};
