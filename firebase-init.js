// Centralized Firebase initialization (used by pages/modules)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAbUBPJmGTI_2YGlpuDLCqhdsb0wCKAGhw",
  authDomain: "bato-bato-pick-5ecf4.firebaseapp.com",
  projectId: "bato-bato-pick-5ecf4",
  storageBucket: "bato-bato-pick-5ecf4.firebasestorage.app",
  messagingSenderId: "873944990141",
  appId: "1:873944990141:web:ae0774df19cbf6d45292d4"
};

const app = initializeApp(firebaseConfig);
try { getAnalytics(app); } catch (e) { /* Analytics may fail in some environments */ }

// Expose common Firebase handles to window for existing code
window.firebaseApp = app;
window.auth = getAuth(app);
window.db = getFirestore(app);
window.signOut = signOut;

export { app };
