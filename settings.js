// Import Firebase Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { 
  getAuth, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// Firebase Config
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
const db = getFirestore(app);

// DOM Elements
const userName = document.getElementById("user-name");
const userEmail = document.getElementById("user-email");
const firstName = document.getElementById("first-name");
const lastName = document.getElementById("last-name");
const email = document.getElementById("email");
const mobile = document.getElementById("mobile");
const address = document.getElementById("address");
const city = document.getElementById("city");
const state = document.getElementById("state");
const zip = document.getElementById("zip");
const bio = document.getElementById("bio");
const saveBtn = document.getElementById("save-btn");
const cancelBtn = document.getElementById("cancel-btn");
const logoutBtn = document.getElementById("logout-btn");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toast-message");

// Form state
let isEditing = false;
let originalData = {};

// Initialize the page
function init() {
  setupEventListeners();
  checkAuthState();
}

// Set up event listeners
function setupEventListeners() {
  saveBtn.addEventListener("click", saveProfile);
  cancelBtn.addEventListener("click", cancelEdit);
  logoutBtn.addEventListener("click", logoutUser);
  
  // Enable form when any field is clicked
  const formInputs = document.querySelectorAll('#account-form input, #account-form textarea');
  formInputs.forEach(input => {
    input.addEventListener('focus', () => {
      if (!isEditing) {
        enableForm();
      }
    });
  });
}

// Check auth state and load user data
function checkAuthState() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Update profile section
      userName.textContent = user.displayName || "No name provided";
      userEmail.textContent = user.email;
      email.value = user.email;

      // Load user data from Firestore
      await loadUserData(user.uid);
    } else {
      window.location.href = "login.html";
    }
  });
}

// Load user data from Firestore
async function loadUserData(uid) {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      
      // Update form fields
      firstName.value = userData.firstName || "";
      lastName.value = userData.lastName || "";
      mobile.value = userData.mobile || "";
      address.value = userData.address || "";
      city.value = userData.city || "";
      state.value = userData.state || "";
      zip.value = userData.zip || "";
      bio.value = userData.bio || "";
      
      // Store original data for cancel
      originalData = { ...userData };
    }
  } catch (error) {
    console.error("Error loading user data:", error);
    showToast("Error loading profile data");
  }
}

// Enable form editing
function enableForm() {
  isEditing = true;
  firstName.disabled = false;
  lastName.disabled = false;
  mobile.disabled = false;
  address.disabled = false;
  city.disabled = false;
  state.disabled = false;
  zip.disabled = false;
  bio.disabled = false;
  
  saveBtn.disabled = false;
  cancelBtn.style.display = 'inline-block';
}

// Disable form editing
function disableForm() {
  isEditing = false;
  firstName.disabled = true;
  lastName.disabled = true;
  mobile.disabled = true;
  address.disabled = true;
  city.disabled = true;
  state.disabled = true;
  zip.disabled = true;
  bio.disabled = true;
  
  saveBtn.disabled = true;
  cancelBtn.style.display = 'none';
}

// Save profile data
async function saveProfile() {
  const user = auth.currentUser;
  if (!user) return;

  try {
    // Get form values
    const userData = {
      firstName: firstName.value.trim(),
      lastName: lastName.value.trim(),
      mobile: mobile.value.trim(),
      address: address.value.trim(),
      city: city.value.trim(),
      state: state.value.trim(),
      zip: zip.value.trim(),
      bio: bio.value.trim(),
      updatedAt: new Date().toISOString()
    };

    // Update in Firestore
    await setDoc(doc(db, "users", user.uid), userData, { merge: true });
    
    // Update display name if firstName changed
    if (firstName.value.trim() !== originalData.firstName) {
      await updateProfile(user, {
        displayName: firstName.value.trim()
      });
      userName.textContent = firstName.value.trim();
    }

    // Update original data
    originalData = { ...userData };
    
    // Disable form
    disableForm();
    
    // Show success message
    showToast("Profile updated successfully!");
  } catch (error) {
    console.error("Error saving profile:", error);
    showToast("Error saving profile data");
  }
}

// Cancel editing
function cancelEdit() {
  // Restore original values
  firstName.value = originalData.firstName || "";
  lastName.value = originalData.lastName || "";
  mobile.value = originalData.mobile || "";
  address.value = originalData.address || "";
  city.value = originalData.city || "";
  state.value = originalData.state || "";
  zip.value = originalData.zip || "";
  bio.value = originalData.bio || "";
  
  // Disable form
  disableForm();
}

// Logout user
function logoutUser() {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  }).catch((error) => {
    console.error("Logout error:", error);
    showToast("Error logging out");
  });
}

// Show toast notification
function showToast(message) {
  toastMessage.textContent = message;
  toast.classList.add("show");
  
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Initialize the app
init();