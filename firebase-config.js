// firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyCYjA5XncKDzRdb4qcJxIhBdcGJ0pgwgo0",
    authDomain: "babatillu-42cf1.firebaseapp.com",
    databaseURL: "https://babatillu-42cf1-default-rtdb.firebaseio.com",
    projectId: "babatillu-42cf1",
    storageBucket: "babatillu-42cf1.firebasestorage.app",
    messagingSenderId: "996168873659",
    appId: "1:996168873659:web:729ecf6b3842f166ec9b9e",
    measurementId: "G-9ZTN9WE4RQ"
  };

// ✅ Ensure Firebase is loaded before using it
if (typeof firebase !== "undefined") {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore(); // ✅ Make `db` globally accessible
    console.log("✅ Firebase initialized successfully");
} else {
    console.error("❌ Firebase SDK not loaded properly.");
}
