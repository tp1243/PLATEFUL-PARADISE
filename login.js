import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBk0CruJ4YLcA1nPMMa2slSKbeojxW2-R8",
  authDomain: "login-example-528be.firebaseapp.com",
  projectId: "login-example-528be",
  storageBucket: "login-example-528be.firebasestorage.app",
  messagingSenderId: "861134293236",
  appId: "1:861134293236:web:c7ede80eeb3cb0d676f6a1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginButton = document.getElementById("login");
loginButton.addEventListener("click", function (event) {
  event.preventDefault();

  // Inputs
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      // Store login details in localStorage
      localStorage.setItem("user", JSON.stringify({
        displayName: user.displayName,
        email: user.email,
      }));

      // Redirect to dashboard
      window.location.href = `dashboard.html?name=${encodeURIComponent(user.displayName)}`;
    })
    .catch((error) => {
      console.error("Login error:", error.message);
      alert(error.message);
    });
});
