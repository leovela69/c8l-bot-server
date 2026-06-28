/**
 * 🎰 C8L CASINO — Router / Screen Manager
 * Gestiona navegación entre pantallas del casino
 */

class CasinoRouter {
    constructor() {
        this.currentScreen = 'lobby';
        this.screens = {};
        this.history = [];
    }

    init() {
        // Register all screens
        document.querySelectorAll('.screen').forEach(screen => {
            this.screens[screen.id.replace('Screen', '')] = screen;
        });

        // Bind back buttons
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => this.goTo('lobby'));
        });
    }

    goTo(screenName) {
        // Hide current
        const current = this.screens[this.currentScreen];
        if (current) current.classList.remove('active');

        // Show new
        const next = this.screens[screenName];
        if (next) {
            next.classList.add('active');
            this.history.push(this.currentScreen);
            this.currentScreen = screenName;
        }

        // Emit event
        window.dispatchEvent(new CustomEvent('screenChange', { detail: { screen: screenName } }));
    }

    goBack() {
        if (this.history.length > 0) {
            const prev = this.history.pop();
            this.goTo(prev);
        }
    }

    getCurrentScreen() {
        return this.currentScreen;
    }
}

// Global instance
const router = new CasinoRouter();
