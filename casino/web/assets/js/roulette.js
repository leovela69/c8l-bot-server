/**
 * 🎡 C8L CASINO — Ruleta Europea
 * 37 números (0-36), apuestas múltiples, animación de giro
 */

class RouletteGame {
    constructor() {
        this.numbers = [
            0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,
            5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26
        ];
        this.redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
        this.bets = [];
        this.selectedChip = 100;
        this.isSpinning = false;
        this.totalBet = 0;
        this.rotation = 0;
        this.history = [];
    }

    init() {
        this._buildNumbersGrid();
        this._bindEvents();
    }

    _buildNumbersGrid() {
        const grid = document.getElementById('numbersGrid');
        if (!grid) return;

        grid.innerHTML = '';
        // Numbers 1-36 in casino layout (3 rows × 12 cols)
        const layout = [
            [3,6,9,12,15,18,21,24,27,30,33,36],
            [2,5,8,11,14,17,20,23,26,29,32,35],
            [1,4,7,10,13,16,19,22,25,28,31,34]
        ];

        for (const row of layout) {
            for (const num of row) {
                const isRed = this.redNumbers.includes(num);
                const cell = document.createElement('button');
                cell.className = `bet-cell ${isRed ? 'red' : 'black'}`;
                cell.dataset.bet = num;
                cell.dataset.type = 'number';
                cell.textContent = num;
                cell.addEventListener('click', () => this._placeBet(num, 'number'));
                grid.appendChild(cell);
            }
        }
    }

    _bindEvents() {
        // Chip selection
        document.querySelectorAll('.chip-select').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.chip-select').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.selectedChip = parseInt(chip.dataset.value);
            });
        });

        // Outside bets
        document.querySelectorAll('.outside-btn, .bottom-btn, .bet-cell.green').forEach(btn => {
            btn.addEventListener('click', () => {
                this._placeBet(btn.dataset.bet, btn.dataset.type);
            });
        });

        // Spin
        const spinBtn = document.getElementById('rouletteSpinBtn');
        if (spinBtn) spinBtn.addEventListener('click', () => this.spin());

        // Clear
        const clearBtn = document.getElementById('clearBetsBtn');
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearBets());
    }

    _placeBet(value, type) {
        if (this.isSpinning) return;

        // Check balance
        if (window.casinoState.credits < this.selectedChip) {
            window.showToast('Saldo insuficiente');
            return;
        }

        sound.buttonClick();
        this.bets.push({ value: String(value), type, amount: this.selectedChip });
        this.totalBet += this.selectedChip;
        window.casinoState.credits -= this.selectedChip;

        this._updateDisplay();
    }

    clearBets() {
        // Refund bets
        const refund = this.bets.reduce((sum, b) => sum + b.amount, 0);
        window.casinoState.credits += refund;
        this.bets = [];
        this.totalBet = 0;
        this._updateDisplay();
        sound.buttonClick();
    }

    async spin() {
        if (this.isSpinning || this.bets.length === 0) return;
        this.isSpinning = true;

        const spinBtn = document.getElementById('rouletteSpinBtn');
        spinBtn.classList.add('spinning');
        spinBtn.textContent = 'GIRANDO...';

        // Hide previous result
        document.getElementById('rouletteResult').style.display = 'none';

        // Generate result
        const resultIndex = Math.floor(Math.random() * 37);
        const resultNumber = this.numbers[resultIndex];

        // Animate wheel
        const wheel = document.getElementById('rouletteWheel');
        const extraRotation = 1440 + (resultIndex * (360 / 37)); // 4 full spins + offset
        this.rotation += extraRotation;
        wheel.style.transform = `rotate(${this.rotation}deg)`;

        sound.spinStart();

        // Wait for animation
        await this._delay(4200);

        // Show result
        this._showResult(resultNumber);

        // Calculate winnings
        const winnings = this._calculateWinnings(resultNumber);

        if (winnings > 0) {
            window.casinoState.credits += winnings;
            sound.winBig();
            animations.spawnCoins(15);
            window.showToast(`¡GANASTE ${winnings.toLocaleString('es-ES')}! 🎉`);
        } else {
            sound.reelStop(0);
        }

        // Add to history
        this.history.unshift(resultNumber);
        if (this.history.length > 10) this.history.pop();

        // Reset
        this.bets = [];
        this.totalBet = 0;
        this.isSpinning = false;
        spinBtn.classList.remove('spinning');
        spinBtn.textContent = 'GIRAR RULETA';

        this._updateDisplay();
    }

    _showResult(number) {
        const resultDiv = document.getElementById('rouletteResult');
        const resultNum = document.getElementById('resultNumber');

        resultNum.textContent = number;
        resultNum.className = 'result-number';

        if (number === 0) resultNum.classList.add('green');
        else if (this.redNumbers.includes(number)) resultNum.classList.add('red');
        else resultNum.classList.add('black');

        resultDiv.style.display = 'block';
    }

    _calculateWinnings(result) {
        let total = 0;

        for (const bet of this.bets) {
            let won = false;

            switch (bet.type) {
                case 'number':
                    if (parseInt(bet.value) === result) { total += bet.amount * 36; won = true; }
                    break;
                case 'color':
                    if (bet.value === 'red' && this.redNumbers.includes(result)) { total += bet.amount * 2; won = true; }
                    else if (bet.value === 'black' && result > 0 && !this.redNumbers.includes(result)) { total += bet.amount * 2; won = true; }
                    break;
                case 'parity':
                    if (result > 0) {
                        if (bet.value === 'odd' && result % 2 === 1) { total += bet.amount * 2; won = true; }
                        else if (bet.value === 'even' && result % 2 === 0) { total += bet.amount * 2; won = true; }
                    }
                    break;
                case 'half':
                    if (bet.value === '1-18' && result >= 1 && result <= 18) { total += bet.amount * 2; won = true; }
                    else if (bet.value === '19-36' && result >= 19 && result <= 36) { total += bet.amount * 2; won = true; }
                    break;
                case 'dozen':
                    if (bet.value === '1-12' && result >= 1 && result <= 12) { total += bet.amount * 3; won = true; }
                    else if (bet.value === '13-24' && result >= 13 && result <= 24) { total += bet.amount * 3; won = true; }
                    else if (bet.value === '25-36' && result >= 25 && result <= 36) { total += bet.amount * 3; won = true; }
                    break;
            }
        }

        return total;
    }

    _updateDisplay() {
        const totalBetEl = document.getElementById('rouletteTotalBet');
        const creditsEl = document.getElementById('rCredits');
        const lastEl = document.getElementById('rLastNumber');
        const historyEl = document.getElementById('rHistory');

        if (totalBetEl) totalBetEl.textContent = this.totalBet.toLocaleString('es-ES');
        if (creditsEl) creditsEl.textContent = window.casinoState.credits.toLocaleString('es-ES');
        if (lastEl && this.history.length > 0) lastEl.textContent = this.history[0];
        if (historyEl) historyEl.textContent = this.history.slice(0, 5).join(' ');

        window.updateAllBalances();
    }

    _delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}

const roulette = new RouletteGame();
