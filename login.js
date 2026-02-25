import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

let savedUsername = "";
let savedPassword = "";
const charRegex = /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]+$/;

function clearAllInputs() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.type === 'checkbox' ? input.checked = false : input.value = "";
    });
    document.getElementById('reg-pass').type = "password";
    document.getElementById('login-pass').type = "password";
    document.getElementById('reg-btn').disabled = true;
}

function navToLogin() {
    const reg = document.getElementById('register-section');
    const log = document.getElementById('login-section');
    reg.classList.replace('active', 'inactive');
    log.classList.replace('inactive', 'active');
    setTimeout(clearAllInputs, 200);
}

function navToRegister() {
    const reg = document.getElementById('register-section');
    const log = document.getElementById('login-section');
    log.classList.replace('active', 'inactive');
    reg.classList.replace('inactive', 'active');
    setTimeout(clearAllInputs, 200);
}

function togglePassword(id, cb) {
    document.getElementById(id).type = cb.checked ? "text" : "password";
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
}

// Logic (Register)
const regUser = document.getElementById('reg-user');
const regPass = document.getElementById('reg-pass');
const regBtn = document.getElementById('reg-btn');

const validate = () => {
    regBtn.disabled = !(regUser.value.length >= 3 && regPass.value.length >= 5 && charRegex.test(regPass.value));
};

regUser.addEventListener('input', validate);
regPass.addEventListener('input', validate);

// REGISTER LOGIC
document.getElementById('reg-btn').addEventListener('click', async () => {
    const email = document.getElementById('reg-user').value.trim() + "@game.com"; // Simulating email if you only want usernames
    const password = document.getElementById('reg-pass').value;

    try {
        const userCredential = await createUserWithEmailAndPassword(window.auth, email, password);
        const user = userCredential.user;

        // Initialize player data in Firestore
        await setDoc(doc(window.db, "players", user.uid), {
            username: document.getElementById('reg-user').value.trim(),
            email: email,
            totalArenaWins: 0,
            matchesPlayed: 0,
            matchHistory: [],
            joinDate: new Date().toISOString(),
            role: 'player'
        });

        alert("Account Created!");
        navToLogin();
    } catch (error) {
        alert(error.message);
    }
});

// LOGIN LOGIC
document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('login-user').value.trim() + "@game.com";
    const password = document.getElementById('login-pass').value;

    try {
        await signInWithEmailAndPassword(window.auth, email, password);
        window.location.href = "game.html";
    } catch (error) {
        alert("Login failed: " + error.message);
    }
});

// Expose functions used by inline handlers in HTML (module scope is not global)
window.clearAllInputs = clearAllInputs;
window.navToLogin = navToLogin;
window.navToRegister = navToRegister;
window.togglePassword = togglePassword;
window.toggleTheme = toggleTheme;

// Provide a logout helper that uses firebase signOut if available
window.logout = async function() {
    try {
        if (window.signOut && window.auth) await window.signOut(window.auth);
    } catch (e) {
        console.error('Logout failed', e);
    }
    window.location.href = 'index.html';
};
