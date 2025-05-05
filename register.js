import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBk0CruJ4YLcA1nPMMa2slSKbeojxW2-R8",
  authDomain: "login-example-528be.firebaseapp.com",
  projectId: "login-example-528be",
  storageBucket: "login-example-528be.appspot.com",
  messagingSenderId: "861134293236",
  appId: "1:861134293236:web:c7ede80eeb3cb0d676f6a1",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Particles.js
document.addEventListener('DOMContentLoaded', function() {
  particlesJS('particles-js', {
    "particles": {
      "number": {
        "value": 80,
        "density": {
          "enable": true,
          "value_area": 800
        }
      },
      "color": {
        "value": "#FF6B6B"
      },
      "shape": {
        "type": "circle",
        "stroke": {
          "width": 0,
          "color": "#000000"
        },
        "polygon": {
          "nb_sides": 5
        }
      },
      "opacity": {
        "value": 0.3,
        "random": true,
        "anim": {
          "enable": true,
          "speed": 1,
          "opacity_min": 0.1,
          "sync": false
        }
      },
      "size": {
        "value": 3,
        "random": true,
        "anim": {
          "enable": true,
          "speed": 2,
          "size_min": 0.1,
          "sync": false
        }
      },
      "line_linked": {
        "enable": true,
        "distance": 150,
        "color": "#FF8E8E",
        "opacity": 0.2,
        "width": 1
      },
      "move": {
        "enable": true,
        "speed": 1,
        "direction": "none",
        "random": true,
        "straight": false,
        "out_mode": "out",
        "bounce": false,
        "attract": {
          "enable": true,
          "rotateX": 600,
          "rotateY": 1200
        }
      }
    },
    "interactivity": {
      "detect_on": "canvas",
      "events": {
        "onhover": {
          "enable": true,
          "mode": "grab"
        },
        "onclick": {
          "enable": true,
          "mode": "push"
        },
        "resize": true
      },
      "modes": {
        "grab": {
          "distance": 140,
          "line_linked": {
            "opacity": 0.5
          }
        },
        "push": {
          "particles_nb": 4
        }
      }
    },
    "retina_detect": true
  });

  // Animate elements with GSAP
  gsap.from(".food-showcase", {
    duration: 1,
    x: -50,
    opacity: 0,
    ease: "power3.out"
  });

  gsap.from(".form-card", {
    duration: 1,
    x: 50,
    opacity: 0,
    ease: "power3.out",
    delay: 0.2
  });

  // Add hover animations to food items
  document.querySelectorAll('.food-item').forEach(item => {
    item.addEventListener('mouseenter', () => {
      gsap.to(item, {
        scale: 1.1,
        duration: 0.3,
        ease: "back.out"
      });
    });
    item.addEventListener('mouseleave', () => {
      gsap.to(item, {
        scale: 1,
        duration: 0.3,
        ease: "back.out"
      });
    });
  });
});

// DOM Elements
const submit = document.getElementById("submit");
const passwordInput = document.getElementById("password");
const showPasswordBtn = document.querySelector(".show-password");
const strengthFill = document.querySelector(".strength-fill");
const strengthValue = document.querySelector(".strength-value");
const passwordStrength = document.querySelector(".password-strength");

// Password visibility toggle
showPasswordBtn.addEventListener("click", function() {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    showPasswordBtn.classList.remove("bxs-show");
    showPasswordBtn.classList.add("bxs-hide");
  } else {
    passwordInput.type = "password";
    showPasswordBtn.classList.remove("bxs-hide");
    showPasswordBtn.classList.add("bxs-show");
  }
});

// Password strength indicator
passwordInput.addEventListener("input", function() {
  const password = passwordInput.value;
  if (password.length > 0) {
    passwordStrength.style.display = "block";
    const strength = calculatePasswordStrength(password);
    updateStrengthIndicator(strength);
  } else {
    passwordStrength.style.display = "none";
  }
});

function calculatePasswordStrength(password) {
  let strength = 0;
  
  // Length check
  if (password.length >= 8) strength += 1;
  if (password.length >= 12) strength += 1;
  
  // Character diversity
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  
  return Math.min(strength, 5); // Max strength of 5
}

function updateStrengthIndicator(strength) {
  const width = (strength / 5) * 100;
  
  // Animate the strength bar with GSAP
  gsap.to(strengthFill, {
    width: `${width}%`,
    duration: 0.5,
    ease: "power2.out"
  });
  
  // Update color and text based on strength
  if (strength <= 2) {
    strengthFill.style.backgroundColor = "var(--error-color)";
    strengthValue.textContent = "Weak";
    strengthValue.style.color = "var(--error-color)";
  } else if (strength <= 3) {
    strengthFill.style.backgroundColor = "var(--warning-color)";
    strengthValue.textContent = "Moderate";
    strengthValue.style.color = "var(--warning-color)";
  } else {
    strengthFill.style.backgroundColor = "var(--success-color)";
    strengthValue.textContent = "Strong";
    strengthValue.style.color = "var(--success-color)";
  }
}

// Form submission
submit.addEventListener("click", function(event) {
  event.preventDefault();

  // Inputs
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const terms = document.getElementById("terms").checked;

  if (!terms) {
    showError("Please agree to the Terms of Service and Privacy Policy");
    return;
  }

  // Add loading state to button
  submit.classList.add("loading");
  
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      // Update the user's profile with their name
      updateProfile(user, {
        displayName: name,
      })
        .then(() => {
          // Success animation
          submit.classList.remove("loading");
          submit.classList.add("success");
          submit.innerHTML = '<i class="bx bxs-check-circle"></i> Account Created!';
          
          // Animate success
          gsap.fromTo(submit, 
            { scale: 1 }, 
            { 
              scale: 1.05, 
              duration: 0.3, 
              yoyo: true, 
              repeat: 1, 
              ease: "power1.inOut",
              onComplete: () => {
                setTimeout(() => {
                  window.location.href = "login.html";
                }, 1000);
              }
            }
          );
        })
        .catch((error) => {
          console.error("Error updating profile:", error.message);
          showError(error.message);
        });
    })
    .catch((error) => {
      console.error("Error creating account:", error.message);
      showError(error.message);
    });
});

function showError(message) {
  // Reset button state
  submit.classList.remove("loading");
  submit.innerHTML = '<span class="btn-text">Create Account</span><i class="bx bx-arrow-to-right btn-arrow"></i>';
  
  // Create error toast
  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.innerHTML = `
    <i class='bx bxs-error-circle'></i>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);
  
  // Animate toast
  gsap.fromTo(toast, 
    { y: 50, opacity: 0 }, 
    { 
      y: 0, 
      opacity: 1, 
      duration: 0.5, 
      ease: "back.out" 
    }
  );
  
  // Remove toast after delay
  setTimeout(() => {
    gsap.to(toast, {
      y: -50,
      opacity: 0,
      duration: 0.5,
      ease: "back.in",
      onComplete: () => toast.remove()
    });
  }, 5000);
}

// Add animation to social buttons
document.querySelectorAll('.social-btn').forEach(btn => {
  btn.addEventListener('mouseenter', () => {
    gsap.to(btn, {
      scale: 1.1,
      duration: 0.3,
      ease: "back.out"
    });
  });
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, {
      scale: 1,
      duration: 0.3,
      ease: "back.out"
    });
  });
});