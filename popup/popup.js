 
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("login-form");
  const statusDiv = document.getElementById("status");
  const analyzeMsg = document.getElementById("analyze-message");
  const loginBtn = document.getElementById("loginBtn");
  const loginSpinner = document.getElementById("loginSpinner");

  // Check login state
  chrome.storage.local.get(["token"], function (result) {
    if (result.token) {
      form.classList.add("hidden");
      analyzeMsg.classList.remove("hidden");
    } else {
      form.classList.remove("hidden");
      analyzeMsg.classList.add("hidden");
    }
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    loginBtn.disabled = true;
    loginSpinner.classList.remove("hidden");
    statusDiv.textContent = "";

    try {
      const response = await fetch(
        "https://platform.authenta.ai/api/auth/signin",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      const data = await response.json();
      if (response.ok && data.token) {
        chrome.storage.local.set({ token: data.token }, () => {
          form.classList.add("hidden");
          analyzeMsg.classList.remove("hidden");
          statusDiv.textContent = "";
        });
      } else {
        statusDiv.textContent = `Login failed: ${data.message || "Invalid credentials"}`;
        loginBtn.disabled = false;
        loginSpinner.classList.add("hidden");
      }
    } catch (error) {
      statusDiv.textContent = "Error connecting to server.";
      loginBtn.disabled = false;
      loginSpinner.classList.add("hidden");
    }
  });
});