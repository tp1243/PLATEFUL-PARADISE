import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

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

const submit = document.getElementById("submit");
submit.addEventListener("click", function (event) {
  event.preventDefault();

  // Inputs
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      // Update the user's profile with their name
      updateProfile(user, {
        displayName: name,
      })
        .then(() => {
          alert("Account created successfully! Redirecting to login...");
          // Redirect to login form
          window.location.href = "login.html";
        })
        .catch((error) => {
          console.error("Error updating profile:", error.message);
          alert(error.message);
        });
    })
    .catch((error) => {
      console.error("Error creating account:", error.message);
      alert(error.message);
    });
});
