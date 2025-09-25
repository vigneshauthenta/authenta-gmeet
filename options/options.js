document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("login-form");
  const statusDiv = document.getElementById("status"); 
  chrome.storage.local.get(["token"], function (result) {
    if (result.token) {
      form.classList.add("hidden"); 
    } else {
      form.classList.remove("hidden");
    }
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const loginBtn = document.getElementById("loginBtn");
    const loginText = document.getElementById("loginText");
    const loginSpinner = document.getElementById("loginSpinner");

    loginBtn.disabled = true;
    loginText.classList.add("opacity-0");
    loginSpinner.classList.remove("hidden");

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
          statusDiv.textContent = "Your Meet DeepFake will be analyzed.";
          statusDiv.className = "text-purple-600 text-lg text-center mt-2";
          form.classList.add("hidden"); 
        });
      } else {
        statusDiv.textContent = `Login failed: ${data.message || "Invalid credentials"
          }`;
        statusDiv.className = "text-red-600 text-center mt-2";

        loginBtn.disabled = false;
        loginText.classList.remove("opacity-0");
        loginSpinner.classList.add("hidden");
      }
    } catch (error) {
      statusDiv.textContent = "Error connecting to server.";
      statusDiv.className = "text-red-600 text-center mt-2";
      console.error(error);

      loginBtn.disabled = false;
      loginText.classList.remove("opacity-0");
      loginSpinner.classList.add("hidden");
    }
  });
});
