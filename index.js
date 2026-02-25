import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { doc, onSnapshot, updateDoc, increment, getDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

let currentUserRef = null;

onAuthStateChanged(window.auth, (user) => {
    if (user) {
        // We create a reference to the player's specific document in the database
        currentUserRef = doc(window.db, "players", user.uid);
        
        // This 'onSnapshot' acts like a live wire. 
        // Whenever the wins change in the database, the screen updates automatically.
        onSnapshot(currentUserRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                totalWinsDisplay.textContent = `Legendary Wins: ${data.totalArenaWins || 0}`;
                
                // Show admin link if user is admin
                if (data.role === 'admin') {
                    const adminLink = document.getElementById('adminLink');
                    if (adminLink) adminLink.style.display = 'inline-block';
                }
            }
        });
    } else {
        // If no one is logged in, kick them back to the login page
        window.location.replace("index.html");
    }
});




// LOGOUT FUNCTION
window.logout = function() {
  if (window.signOut && window.auth) {
    window.signOut(window.auth).then(() => {
      window.location.href = "index.html"; // Redirect
    }).catch(() => { window.location.href = "index.html"; });
  } else {
    window.location.href = "index.html";
  }
};


const choices = ["rock", "paper", "scissors"];
const playerDisplay = document.getElementById("playerDisplay");
const computerDisplay = document.getElementById("computerDisplay");
const resultDisplay = document.getElementById("resultDisplay");
const playerScoreDisplay = document.getElementById("playerScoreDisplay");
const computerScoreDisplay = document.getElementById("computerScoreDisplay");
const matchStatus = document.getElementById("matchStatus");
const streakDisplay = document.getElementById("streakDisplay");
const resetBtn = document.getElementById("resetBtn");
const helpModal = document.getElementById("helpModal");
const soundToggle = document.getElementById("soundToggle");
const totalWinsDisplay = document.getElementById("totalWinsDisplay");

let playerScore = 0;
let computerScore = 0;
let winStreak = 0;
let isGameOver = false;

// Local Persistence
let soundEnabled = localStorage.getItem('rps_sound') === 'true';
totalWinsDisplay.textContent = `Legendary Wins: 0`;
soundToggle.setAttribute('aria-pressed', String(!!soundEnabled));


// --- MODAL CONTROL FUNCTIONS ---

window.openHelp = function() {
  const helpModal = document.getElementById("helpModal");
  if (helpModal) {
    helpModal.style.display = "flex"; // Show the modal
    trapFocus(helpModal);
  }
};

window.closeHelp = function() {
  const helpModal = document.getElementById("helpModal");
  if (helpModal) {
    helpModal.style.display = "none"; // Hide the modal
    releaseFocus();
  }
};

function playSfx(type) {
  if (!soundEnabled) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type === 'win' ? 'sine' : 'square';
    o.frequency.value = type === 'win' ? 880 : 220;
    o.connect(g); g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
    setTimeout(() => { o.stop(); ctx.close(); }, 180);
  } catch (e) {}
}

function confettiBurst() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);
  const colors = ['#ff6b6b','#ffd166','#06d6a0','#4d96ff','#c77dff'];
  for (let i=0; i<24; i++) {
    const p = document.createElement('div');
    p.className = 'confetti-piece';
    p.style.background = colors[i % colors.length];
    p.style.left = Math.random() * 100 + '%';
    p.style.transform = `rotate(${Math.random()*360}deg)`;
    container.appendChild(p);
  }
  setTimeout(() => container.remove(), 1400);
}

window.playGame = function playGame(playerChoice) {
  if (isGameOver) return;

  resultDisplay.textContent = 'THINKING...';
  resultDisplay.classList.remove('greenText','redText');
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) resultDisplay.classList.add('shaking');
  toggleButtons(true);

  setTimeout(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) resultDisplay.classList.remove('shaking');
    const computerChoice = choices[Math.floor(Math.random() * choices.length)];
    let result;

    if (playerChoice === computerChoice) { result = "IT'S A TIE!"; winStreak = 0; }
    else {
      switch (playerChoice) {
        case 'rock': result = (computerChoice === 'scissors') ? 'YOU WIN!' : 'YOU LOSE!'; break;
        case 'paper': result = (computerChoice === 'rock') ? 'YOU WIN!' : 'YOU LOSE!'; break;
        case 'scissors': result = (computerChoice === 'paper') ? 'YOU WIN!' : 'YOU LOSE!'; break;
      }
    }

    playerDisplay.textContent = `PLAYER: ${playerChoice.toUpperCase()}`;
    computerDisplay.textContent = `COMPUTER: ${computerChoice.toUpperCase()}`;
    resultDisplay.textContent = result;

    if (result === 'YOU WIN!') {
      resultDisplay.classList.add('greenText'); playerScore++; winStreak++; playerScoreDisplay.textContent = playerScore; playSfx('win'); confettiBurst();
    } else if (result === 'YOU LOSE!') {
      resultDisplay.classList.add('redText'); computerScore++; winStreak = 0; computerScoreDisplay.textContent = computerScore; playSfx('lose');
    } else { winStreak = 0; }

    updateStreakUI();
    checkIntensity();
    checkMatchWinner();
    if (!isGameOver) toggleButtons(false);
  }, 600);
};

function checkIntensity() {
  if (playerScore === 4 || computerScore === 4) {
    document.body.classList.add('match-point-active');
    matchStatus.textContent = '🔥 MATCH POINT 🔥';
  } else {
    document.body.classList.remove('match-point-active');
    if (!playerScore && !computerScore) matchStatus.textContent = '';
  }
}

async function checkMatchWinner() {
  if (playerScore === 5 || computerScore === 5) {
    isGameOver = true;
    const result = playerScore === 5 ? 'WIN' : 'LOSS';
    
    if (playerScore === 5) {
      matchStatus.textContent = '🏆 CHAMPION!';
    } else {
      matchStatus.textContent = '💀 DEFEATED!';
    }
    
    // Save match to database
    if (currentUserRef) {
        try {
            // Create match history entry
            const matchEntry = {
              date: new Date().toISOString(),
              result: result,
              playerScore: playerScore,
              computerScore: computerScore
            };
            
            // Update user stats and match history
            const userDoc = await getDoc(currentUserRef);
            const currentHistory = userDoc.data().matchHistory || [];
            
            await updateDoc(currentUserRef, {
                totalArenaWins: playerScore === 5 ? increment(1) : increment(0),
                matchHistory: [...currentHistory, matchEntry],
                lastMatchDate: new Date().toISOString(),
                matchesPlayed: increment(1)
            });
        } catch (error) {
            console.error("Error updating match history:", error);
        }
    }
    
    resetBtn.style.display = 'block';
    toggleButtons(true);
  }
}

function updateStreakUI() { streakDisplay.textContent = winStreak >= 2 ? `🔥 ${winStreak} WIN STREAK` : ''; }
function toggleButtons(disabled) { document.querySelectorAll('.choice-btn').forEach(btn => { btn.disabled = disabled; btn.setAttribute('aria-disabled', String(disabled)); }); }

window.resetGame = function resetGame() {
  playerScore = 0; computerScore = 0; winStreak = 0; isGameOver = false;
  playerScoreDisplay.textContent = 0; computerScoreDisplay.textContent = 0;
  resultDisplay.textContent = ''; matchStatus.textContent = ''; streakDisplay.textContent = '';
  playerDisplay.textContent = 'PLAYER: —'; computerDisplay.textContent = 'COMPUTER: —';
  document.body.classList.remove('match-point-active');
  resetBtn.style.display = 'none'; toggleButtons(false);
}

// Modal A11y
let lastFocused = null;
function trapFocus(modal) {
  lastFocused = document.activeElement;
  const focusable = modal.querySelectorAll('button, [tabindex]:not([tabindex="-1"])');
  if (focusable.length) focusable[0].focus();
}
function releaseFocus() { if (lastFocused) lastFocused.focus(); }

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') window.closeHelp && window.closeHelp();
  const k = e.key.toLowerCase();
  if (!isGameOver && !document.querySelector('.modal[style*="display: flex"]')) {
    if (k === 'r' || k === '1') document.querySelector('[data-choice="rock"]').click();
    if (k === 'p' || k === '2') document.querySelector('[data-choice="paper"]').click();
    if (k === 's' || k === '3') document.querySelector('[data-choice="scissors"]').click();
  }
});

soundToggle.addEventListener('click', () => { soundEnabled = !soundEnabled; localStorage.setItem('rps_sound', soundEnabled); soundToggle.setAttribute('aria-pressed', String(soundEnabled)); });

// functions are attached to window where defined to avoid redeclaration errors
