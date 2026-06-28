/**
 * 🎰 C8L CASINO — App Controller
 * Inicialización principal, estado global, navegación
 */

// ============================================================
// ESTADO GLOBAL DEL CASINO
// ============================================================
window.casinoState = {
    credits: 152_450_000,
    chips: 8_250,
    vipLevel: 10,
    jackpot: 48_532_120,
    playerName: '',
    loggedIn: false,
    userId: localStorage.getItem('c8l_casino_uid') || 'user_' + Math.random().toString(36).substr(2, 12),
};

// Save userId
localStorage.setItem('c8l_casino_uid', window.casinoState.userId);

// Load saved state
const saved = localStorage.getItem('c8l_casino_state');
if (saved) {
    try {
        const parsed = JSON.parse(saved);
        Object.assign(window.casinoState, parsed);
    } catch (e) {}
}

// ============================================================
// GLOBAL HELPERS
// ============================================================

window.updateAllBalances = function() {
    const s = window.casinoState;
    // Lobby
    const el = (id) => document.getElementById(id);
    if (el('lobbyCredits')) el('lobbyCredits').textContent = s.credits.toLocaleString('es-ES');
    if (el('lobbyChips')) el('lobbyChips').textContent = s.chips.toLocaleString('es-ES');
    // Slots
    if (el('creditsDisplay')) el('creditsDisplay').textContent = s.credits.toLocaleString('es-ES');
    if (el('chipsDisplay')) el('chipsDisplay').textContent = s.chips.toLocaleString('es-ES');
    // Roulette
    if (el('rCredits')) el('rCredits').textContent = s.credits.toLocaleString('es-ES');
    // Blackjack
    if (el('bjCredits')) el('bjCredits').textContent = s.credits.toLocaleString('es-ES');
    // Store
    if (el('storeCredits')) el('storeCredits').textContent = s.credits.toLocaleString('es-ES');
    if (el('storeChips')) el('storeChips').textContent = s.chips.toLocaleString('es-ES');

    // Save state
    localStorage.setItem('c8l_casino_state', JSON.stringify(s));
};

window.showToast = function(msg) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: rgba(0,0,0,0.95); color: #f5d061; padding: 12px 24px;
        border-radius: 10px; font-family: 'Orbitron', sans-serif; font-size: 13px;
        z-index: 99999; border: 1px solid #d4a017;
        animation: fadeIn 0.3s ease; pointer-events: none;
        box-shadow: 0 4px 20px rgba(212,160,23,0.3);
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
};

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Init router
    router.init();

    // Init all games
    animations.init();
    sound.init();
    roulette.init();
    blackjack.init();
    store.init();
    leaderboard.init();

    // Check if already logged in
    const savedName = localStorage.getItem('c8l_player_name');
    if (savedName) {
        window.casinoState.playerName = savedName;
        window.casinoState.loggedIn = true;
        _showGamesSection(savedName);
    }

    // ============ LOGIN ============
    document.getElementById('loginBtn').addEventListener('click', () => {
        const name = document.getElementById('playerName').value.trim();
        if (!name) {
            window.showToast('Escribe tu nombre de jugador');
            return;
        }
        window.casinoState.playerName = name;
        window.casinoState.loggedIn = true;
        localStorage.setItem('c8l_player_name', name);
        sound.winSmall();
        _showGamesSection(name);
    });

    // Enter key for login
    document.getElementById('playerName').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('loginBtn').click();
    });

    // Telegram login (mock)
    document.getElementById('telegramLoginBtn').addEventListener('click', () => {
        window.showToast('Conectando con Telegram... 📱');
        setTimeout(() => {
            window.casinoState.playerName = 'TelegramUser';
            window.casinoState.loggedIn = true;
            localStorage.setItem('c8l_player_name', 'TelegramUser');
            _showGamesSection('TelegramUser');
        }, 1000);
    });

    // ============ GAME CARDS ============
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', () => {
            const game = card.dataset.game;
            sound.buttonClick();
            switch (game) {
                case 'slots': router.goTo('slots'); break;
                case 'roulette': router.goTo('roulette'); break;
                case 'blackjack': router.goTo('blackjack'); break;
                case 'store': router.goTo('store'); break;
                case 'leaderboard':
                    leaderboard.updatePlayerRank();
                    router.goTo('leaderboard');
                    break;
            }
        });
    });

    // ============ JACKPOT TICKER ============
    setInterval(() => {
        window.casinoState.jackpot += Math.floor(Math.random() * 100) + 10;
        const jEl = document.getElementById('lobbyJackpot');
        if (jEl) jEl.textContent = window.casinoState.jackpot.toLocaleString('es-ES');
        const jEl2 = document.getElementById('jackpotDisplay');
        if (jEl2) jEl2.textContent = window.casinoState.jackpot.toLocaleString('es-ES');
    }, 3000);

    // ============ LOBBY PARTICLES ============
    _startLobbyParticles();

    // Audio init on first interaction
    document.addEventListener('click', () => sound.init(), { once: true });
    document.addEventListener('touchstart', () => sound.init(), { once: true });

    console.log('🎰 C8L Casino — Full Platform Loaded');
});

// ============================================================
// HELPERS
// ============================================================

function _showGamesSection(name) {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('gamesSection').style.display = 'block';
    document.getElementById('welcomeMsg').textContent = `Bienvenido, ${name} 🦁`;
    window.updateAllBalances();
}

function _startLobbyParticles() {
    const container = document.getElementById('lobbyParticles');
    if (!container) return;

    setInterval(() => {
        if (router.getCurrentScreen() !== 'lobby') return;

        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute; font-size: ${12 + Math.random() * 14}px;
            left: ${Math.random() * 100}%; top: -20px;
            opacity: ${0.2 + Math.random() * 0.3};
            animation: particleFall ${3 + Math.random() * 4}s linear forwards;
            pointer-events: none;
        `;
        particle.textContent = ['✨', '🪙', '💎', '⭐', '🦁'][Math.floor(Math.random() * 5)];
        container.appendChild(particle);
        setTimeout(() => particle.remove(), 7000);
    }, 500);
}
