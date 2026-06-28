/**
 * 🏪 C8L CASINO — Tienda de Chips
 */

class CasinoStore {
    constructor() {
        this.dailyBonusClaimed = false;
    }

    init() {
        this._bindEvents();
        this._checkDailyBonus();
    }

    _bindEvents() {
        // Buy packs
        document.querySelectorAll('.pack-buy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const cost = parseInt(btn.dataset.cost);
                const chips = parseInt(btn.dataset.chips);
                this.buyPack(cost, chips);
            });
        });

        // Daily bonus
        const dailyBtn = document.getElementById('dailyBonusBtn');
        if (dailyBtn) {
            dailyBtn.addEventListener('click', () => this.claimDailyBonus());
        }
    }

    buyPack(cost, chips) {
        if (window.casinoState.credits < cost) {
            window.showToast('Créditos insuficientes 💰');
            return;
        }

        window.casinoState.credits -= cost;
        window.casinoState.chips += chips;

        sound.winBig();
        animations.spawnCoins(10);
        window.showToast(`¡Compraste ${chips.toLocaleString('es-ES')} chips! 💎`);
        window.updateAllBalances();
        this._updateStoreDisplay();
    }

    claimDailyBonus() {
        if (this.dailyBonusClaimed) {
            window.showToast('Ya reclamaste tu bono hoy ⏰');
            return;
        }

        const bonus = 50000;
        window.casinoState.credits += bonus;
        this.dailyBonusClaimed = true;

        // Save to localStorage
        localStorage.setItem('c8l_daily_bonus', new Date().toDateString());

        sound.winBig();
        animations.spawnCoins(20);
        window.showToast(`¡+${bonus.toLocaleString('es-ES')} créditos! 🎁`);

        const btn = document.getElementById('dailyBonusBtn');
        if (btn) { btn.classList.add('claimed'); btn.querySelector('.db-text').textContent = 'RECLAMADO HOY'; }

        window.updateAllBalances();
        this._updateStoreDisplay();
    }

    _checkDailyBonus() {
        const lastClaim = localStorage.getItem('c8l_daily_bonus');
        if (lastClaim === new Date().toDateString()) {
            this.dailyBonusClaimed = true;
            const btn = document.getElementById('dailyBonusBtn');
            if (btn) { btn.classList.add('claimed'); btn.querySelector('.db-text').textContent = 'RECLAMADO HOY'; }
        }
    }

    _updateStoreDisplay() {
        const creditsEl = document.getElementById('storeCredits');
        const chipsEl = document.getElementById('storeChips');
        if (creditsEl) creditsEl.textContent = window.casinoState.credits.toLocaleString('es-ES');
        if (chipsEl) chipsEl.textContent = window.casinoState.chips.toLocaleString('es-ES');
    }
}

const store = new CasinoStore();
