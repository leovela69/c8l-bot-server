/**
 * 🃏 C8L CASINO — Blackjack 21
 * Blackjack clásico contra la banca
 */

class BlackjackGame {
    constructor() {
        this.deck = [];
        this.playerHand = [];
        this.dealerHand = [];
        this.bet = 0;
        this.isPlaying = false;
        this.wins = 0;
        this.losses = 0;
        this.selectedBetAmount = 1000;
    }

    init() {
        this._bindEvents();
    }

    _bindEvents() {
        // Bet chips
        document.querySelectorAll('.bj-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.bj-chip').forEach(c => c.classList.remove('selected'));
                chip.classList.add('selected');
                this.selectedBetAmount = parseInt(chip.dataset.value);
                this.bet = this.selectedBetAmount;
                document.getElementById('bjCurrentBet').textContent = this.bet.toLocaleString('es-ES');
                sound.buttonClick();
            });
        });

        // Deal
        const dealBtn = document.getElementById('bjDealBtn');
        if (dealBtn) dealBtn.addEventListener('click', () => this.deal());

        // Hit
        const hitBtn = document.getElementById('bjHitBtn');
        if (hitBtn) hitBtn.addEventListener('click', () => this.hit());

        // Stand
        const standBtn = document.getElementById('bjStandBtn');
        if (standBtn) standBtn.addEventListener('click', () => this.stand());

        // Double
        const doubleBtn = document.getElementById('bjDoubleBtn');
        if (doubleBtn) doubleBtn.addEventListener('click', () => this.double());

        // New game
        const newBtn = document.getElementById('bjNewGameBtn');
        if (newBtn) newBtn.addEventListener('click', () => this.newGame());
    }

    _createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.deck = [];

        for (const suit of suits) {
            for (const value of values) {
                const isRed = suit === '♥' || suit === '♦';
                this.deck.push({ value, suit, isRed });
            }
        }

        // Shuffle (Fisher-Yates)
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    _drawCard() {
        return this.deck.pop();
    }

    _handValue(hand) {
        let value = 0;
        let aces = 0;

        for (const card of hand) {
            if (card.value === 'A') { value += 11; aces++; }
            else if (['K', 'Q', 'J'].includes(card.value)) value += 10;
            else value += parseInt(card.value);
        }

        while (value > 21 && aces > 0) { value -= 10; aces--; }
        return value;
    }

    async deal() {
        if (this.isPlaying) return;

        this.bet = this.selectedBetAmount;
        if (this.bet <= 0) {
            window.showToast('Selecciona una apuesta');
            return;
        }

        if (window.casinoState.credits < this.bet) {
            window.showToast('Saldo insuficiente');
            return;
        }

        // Deduct bet
        window.casinoState.credits -= this.bet;
        window.updateAllBalances();

        this.isPlaying = true;
        this._createDeck();
        this.playerHand = [];
        this.dealerHand = [];

        // Clear UI
        document.getElementById('playerCards').innerHTML = '';
        document.getElementById('dealerCards').innerHTML = '';
        document.getElementById('bjResult').style.display = 'none';
        document.getElementById('bjBetSection').style.display = 'none';
        document.getElementById('bjPlayActions').style.display = 'flex';
        document.getElementById('bjNewGameBtn').style.display = 'none';

        // Deal cards
        await this._delay(300);
        this.playerHand.push(this._drawCard());
        this._renderCards();
        sound.reelStop(0);

        await this._delay(400);
        this.dealerHand.push(this._drawCard());
        this._renderCards();
        sound.reelStop(1);

        await this._delay(400);
        this.playerHand.push(this._drawCard());
        this._renderCards();
        sound.reelStop(2);

        await this._delay(400);
        this.dealerHand.push({ value: '?', suit: '?', isRed: false, hidden: true });
        this._renderCards();
        sound.reelStop(3);

        // Check blackjack
        if (this._handValue(this.playerHand) === 21) {
            await this._delay(500);
            this._revealDealer();
            if (this._handValue(this.dealerHand) === 21) {
                this._endRound('push', 'EMPATE');
            } else {
                this._endRound('blackjack', '¡BLACKJACK! 🎉', 2.5);
            }
        }
    }

    async hit() {
        if (!this.isPlaying) return;

        this.playerHand.push(this._drawCard());
        this._renderCards();
        sound.reelStop(this.playerHand.length);

        const value = this._handValue(this.playerHand);
        if (value > 21) {
            await this._delay(500);
            this._endRound('lose', 'TE PASASTE 💥');
        } else if (value === 21) {
            await this.stand();
        }
    }

    async stand() {
        if (!this.isPlaying) return;
        document.getElementById('bjPlayActions').style.display = 'none';

        // Reveal dealer card
        this._revealDealer();
        this._renderCards();

        // Dealer draws
        await this._delay(600);
        while (this._handValue(this.dealerHand) < 17) {
            this.dealerHand.push(this._drawCard());
            this._renderCards();
            sound.reelStop(this.dealerHand.length);
            await this._delay(600);
        }

        // Determine winner
        const playerVal = this._handValue(this.playerHand);
        const dealerVal = this._handValue(this.dealerHand);

        await this._delay(400);

        if (dealerVal > 21) {
            this._endRound('win', '¡BANCA SE PASA! 🎉', 2);
        } else if (playerVal > dealerVal) {
            this._endRound('win', '¡GANASTE! 🎉', 2);
        } else if (dealerVal > playerVal) {
            this._endRound('lose', 'BANCA GANA 😤');
        } else {
            this._endRound('push', 'EMPATE');
        }
    }

    async double() {
        if (!this.isPlaying) return;

        if (window.casinoState.credits < this.bet) {
            window.showToast('Saldo insuficiente para doblar');
            return;
        }

        window.casinoState.credits -= this.bet;
        this.bet *= 2;
        window.updateAllBalances();

        this.playerHand.push(this._drawCard());
        this._renderCards();
        sound.reelStop(4);

        await this._delay(500);

        const value = this._handValue(this.playerHand);
        if (value > 21) {
            this._endRound('lose', 'TE PASASTE 💥');
        } else {
            await this.stand();
        }
    }

    _revealDealer() {
        // Replace hidden card with real card
        if (this.dealerHand.length >= 2 && this.dealerHand[1].hidden) {
            this.dealerHand[1] = this._drawCard();
        } else if (this.dealerHand.length === 1) {
            this.dealerHand.push(this._drawCard());
        }
    }

    _endRound(result, message, multiplier = 0) {
        this.isPlaying = false;

        // Pay out
        if (multiplier > 0) {
            const winnings = Math.floor(this.bet * multiplier);
            window.casinoState.credits += winnings;
            this.wins++;
            animations.spawnCoins(10);
            sound.winBig();
        } else if (result === 'push') {
            window.casinoState.credits += this.bet; // Return bet
        } else {
            this.losses++;
        }

        window.updateAllBalances();

        // Show result
        const resultDiv = document.getElementById('bjResult');
        const resultText = document.getElementById('bjResultText');
        resultText.textContent = message;
        resultText.className = result;
        resultDiv.style.display = 'block';

        // Show new game button
        document.getElementById('bjPlayActions').style.display = 'none';
        document.getElementById('bjNewGameBtn').style.display = 'block';

        // Update stats
        document.getElementById('bjWins').textContent = this.wins;
        document.getElementById('bjLosses').textContent = this.losses;
        document.getElementById('bjCredits').textContent = window.casinoState.credits.toLocaleString('es-ES');
    }

    newGame() {
        document.getElementById('bjResult').style.display = 'none';
        document.getElementById('bjNewGameBtn').style.display = 'none';
        document.getElementById('bjBetSection').style.display = 'flex';
        document.getElementById('playerCards').innerHTML = '';
        document.getElementById('dealerCards').innerHTML = '';
        document.getElementById('playerScore').textContent = '—';
        document.getElementById('dealerScore').textContent = '—';
        document.getElementById('bjCredits').textContent = window.casinoState.credits.toLocaleString('es-ES');
    }

    _renderCards() {
        // Player
        const playerEl = document.getElementById('playerCards');
        playerEl.innerHTML = '';
        for (const card of this.playerHand) {
            playerEl.appendChild(this._createCardEl(card));
        }
        document.getElementById('playerScore').textContent = this._handValue(this.playerHand);

        // Dealer
        const dealerEl = document.getElementById('dealerCards');
        dealerEl.innerHTML = '';
        for (const card of this.dealerHand) {
            dealerEl.appendChild(this._createCardEl(card));
        }

        if (this.dealerHand.some(c => c.hidden)) {
            document.getElementById('dealerScore').textContent = '?';
        } else {
            document.getElementById('dealerScore').textContent = this._handValue(this.dealerHand);
        }
    }

    _createCardEl(card) {
        const el = document.createElement('div');
        el.className = `bj-card ${card.hidden ? 'hidden' : (card.isRed ? 'red' : 'black')}`;

        if (!card.hidden) {
            el.innerHTML = `
                <span class="card-value">${card.value}</span>
                <span class="card-suit">${card.suit}</span>
                <span class="card-value-bottom">${card.value}</span>
            `;
        }

        return el;
    }

    _delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}

const blackjack = new BlackjackGame();
