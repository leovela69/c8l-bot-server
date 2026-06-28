/**
 * 🎰 C8L CASINO — Game Controller
 * Lógica principal del juego: apuestas, giros, estado, comunicación con API
 */

class SlotGame {
    constructor() {
        // Estado del juego
        this.state = {
            credits: 152_450_000,
            chips: 8_250,
            vipLevel: 10,
            betPerLine: 250,
            numLines: 20,
            totalBet: 5000,
            lastWin: 0,
            freeSpinsRemaining: 0,
            freeSpinsTotalWon: 0,
            multiplier: 1,
            modoRugido: false,
            isSpinning: false,
            autoSpin: false,
            autoSpinCount: 0,
            jackpot: 48_532_120,
            currency: 'credits', // 'credits' o 'chips'
            userId: this._generateUserId(),
        };

        // Niveles de apuesta
        this.betLevels = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000];
        this.currentBetIndex = 4; // 250

        // API config
        this.apiBase = this._getApiBase();
        this.useLocalEngine = true; // Usar motor local por defecto

        // Auto-spin
        this.autoSpinTimer = null;
        this.holdTimer = null;

        // Bind
        this._bindEvents();
    }

    // ================================================================
    // INICIALIZACIÓN
    // ================================================================

    init() {
        animations.init();
        sound.init();
        this._updateUI();
        this._startJackpotAnimation();
        this._loadBalance();
        console.log('🎰 C8L Casino — El León Dorado cargado');
    }

    _generateUserId() {
        let id = localStorage.getItem('c8l_casino_uid');
        if (!id) {
            id = 'user_' + Math.random().toString(36).substr(2, 12);
            localStorage.setItem('c8l_casino_uid', id);
        }
        return id;
    }

    _getApiBase() {
        // Detectar si estamos en el mismo servidor o en local
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:8080/api/casino';
        }
        return '/api/casino';
    }

    // ================================================================
    // EVENTOS
    // ================================================================

    _bindEvents() {
        // Botón SPIN
        const spinBtn = document.getElementById('spinBtn');
        spinBtn.addEventListener('click', () => this.spin());
        
        // Hold para auto-spin
        spinBtn.addEventListener('mousedown', () => this._startHold());
        spinBtn.addEventListener('mouseup', () => this._endHold());
        spinBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this._startHold(); });
        spinBtn.addEventListener('touchend', () => this._endHold());

        // Apuesta +/-
        document.getElementById('betUp').addEventListener('click', () => this._changeBet(1));
        document.getElementById('betDown').addEventListener('click', () => this._changeBet(-1));

        // Sonido
        document.getElementById('soundBtn').addEventListener('click', () => {
            sound.init();
            const enabled = sound.toggle();
            document.getElementById('soundBtn').textContent = enabled ? '🔊' : '🔇';
        });

        // Free spins start
        document.getElementById('freeSpinsStartBtn').addEventListener('click', () => {
            document.getElementById('freeSpinsPopup').style.display = 'none';
        });

        // Teclas
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.spin();
            }
        });

        // Click inicial para activar audio
        document.addEventListener('click', () => sound.init(), { once: true });
        document.addEventListener('touchstart', () => sound.init(), { once: true });
    }

    _startHold() {
        this.holdTimer = setTimeout(() => {
            this.state.autoSpin = true;
            this.state.autoSpinCount = 50;
            this._runAutoSpin();
        }, 800); // Hold 800ms para activar auto
    }

    _endHold() {
        if (this.holdTimer) {
            clearTimeout(this.holdTimer);
            this.holdTimer = null;
        }
        // Si estaba en auto-spin, parar
        if (this.state.autoSpin) {
            this.state.autoSpin = false;
            this.state.autoSpinCount = 0;
        }
    }

    async _runAutoSpin() {
        while (this.state.autoSpin && this.state.autoSpinCount > 0) {
            if (this.state.isSpinning) {
                await this._delay(100);
                continue;
            }
            await this.spin();
            this.state.autoSpinCount--;
            
            // Parar si hay feature
            if (this.state.freeSpinsRemaining > 0) {
                this.state.autoSpin = false;
                break;
            }
            
            await this._delay(500);
        }
        this.state.autoSpin = false;
    }

    // ================================================================
    // APUESTAS
    // ================================================================

    _changeBet(direction) {
        if (this.state.isSpinning) return;
        
        sound.buttonClick();
        this.currentBetIndex = Math.max(0, Math.min(this.betLevels.length - 1, this.currentBetIndex + direction));
        this.state.betPerLine = this.betLevels[this.currentBetIndex];
        this.state.totalBet = this.state.betPerLine * this.state.numLines;
        this._updateUI();
    }

    // ================================================================
    // GIRO PRINCIPAL
    // ================================================================

    async spin() {
        if (this.state.isSpinning) return;

        const isFree = this.state.freeSpinsRemaining > 0;

        // Verificar balance
        if (!isFree) {
            const balance = this.state.currency === 'credits' ? this.state.credits : this.state.chips;
            if (balance < this.state.totalBet) {
                this._showMessage('💰 Saldo insuficiente');
                return;
            }
        }

        this.state.isSpinning = true;
        this.state.lastWin = 0;
        
        // Descontar apuesta
        if (!isFree) {
            if (this.state.currency === 'credits') {
                this.state.credits -= this.state.totalBet;
            } else {
                this.state.chips -= this.state.totalBet;
            }
        } else {
            this.state.freeSpinsRemaining--;
        }

        this._updateUI();
        
        // UI: botón spinning
        const spinBtn = document.getElementById('spinBtn');
        spinBtn.classList.add('spinning');
        
        // Limpiar animaciones previas
        document.querySelectorAll('.symbol.winning, .symbol.wild-glow').forEach(el => {
            el.classList.remove('winning', 'wild-glow');
        });
        document.getElementById('winOverlay').style.display = 'none';

        // Sonido de inicio
        sound.spinStart();

        // Obtener resultado (local o API)
        let result;
        if (this.useLocalEngine) {
            result = this._localSpin();
        } else {
            result = await this._apiSpin();
        }

        if (!result) {
            this.state.isSpinning = false;
            spinBtn.classList.remove('spinning');
            return;
        }

        // Iniciar animaciones de giro de carretes
        const reelIntervals = [];
        for (let i = 0; i < 5; i++) {
            reelIntervals.push(animations.startReelAnimation(i));
        }

        // Animar carretes y parar con resultado
        await animations.spinReels(result.grid, null);

        // Procesar resultado
        await this._processResult(result);

        spinBtn.classList.remove('spinning');
        if (isFree) {
            spinBtn.classList.add('free-spin');
        } else {
            spinBtn.classList.remove('free-spin');
        }

        this.state.isSpinning = false;

        // Auto-spin en giros gratis
        if (this.state.freeSpinsRemaining > 0) {
            await this._delay(1000);
            this.spin();
        }
    }

    // ================================================================
    // MOTOR LOCAL (Sin backend)
    // ================================================================

    _localSpin() {
        const symbols = ['leon', 'wild', 'scatter', 'A', 'K', 'Q', 'J', '10'];
        const weights = [3, 2, 2, 5, 6, 7, 8, 9]; // Pesos
        const totalWeight = weights.reduce((a, b) => a + b, 0);

        const pickSymbol = () => {
            let r = Math.random() * totalWeight;
            for (let i = 0; i < symbols.length; i++) {
                r -= weights[i];
                if (r <= 0) return symbols[i];
            }
            return symbols[symbols.length - 1];
        };

        // Generar grid 5×3
        const grid = [];
        for (let reel = 0; reel < 5; reel++) {
            const col = [];
            for (let row = 0; row < 3; row++) {
                col.push(pickSymbol());
            }
            grid.push(col);
        }

        // Evaluar ganancias
        const wins = this._evaluateWins(grid);
        let totalWin = wins.reduce((sum, w) => sum + w.win, 0);

        // Scatter count
        let scatterCount = 0;
        const scatterPositions = [];
        for (let r = 0; r < 5; r++) {
            for (let row = 0; row < 3; row++) {
                if (grid[r][row] === 'scatter') {
                    scatterCount++;
                    scatterPositions.push([r, row]);
                }
            }
        }

        // Free spins
        let freeSpinsTriggered = scatterCount >= 3;
        let freeSpinsAwarded = 0;
        if (freeSpinsTriggered) {
            freeSpinsAwarded = scatterCount >= 5 ? 25 : scatterCount >= 4 ? 15 : 10;
            const scatterPays = { 5: 100, 4: 20, 3: 5 };
            const scatterWin = (scatterPays[scatterCount] || 0) * this.state.totalBet;
            if (scatterWin > 0) {
                wins.push({
                    symbol: 'scatter',
                    count: scatterCount,
                    win: scatterWin,
                    positions: scatterPositions,
                    line: 'scatter'
                });
                totalWin += scatterWin;
            }
        }

        // Modo Rugido (5% en ganancias)
        let modoRugido = false;
        let multiplier = this.state.multiplier;
        if (totalWin > 0 && Math.random() < 0.05) {
            modoRugido = true;
            const multipliers = [2, 3, 5, 8, 10];
            multiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
        }

        totalWin *= multiplier;

        // Jackpot (0.01%)
        let jackpotWon = false;
        let jackpotAmount = 0;
        if (Math.random() < 0.0001) {
            jackpotWon = true;
            jackpotAmount = this.state.jackpot;
            this.state.jackpot = 1_000_000;
        }
        totalWin += jackpotAmount;

        // Contribución al jackpot
        this.state.jackpot += Math.floor(this.state.totalBet * 0.01);

        return {
            grid,
            wins,
            total_win: totalWin,
            scatter_count: scatterCount,
            free_spins: {
                triggered: freeSpinsTriggered,
                awarded: freeSpinsAwarded,
                remaining: this.state.freeSpinsRemaining + freeSpinsAwarded,
            },
            modo_rugido: {
                active: modoRugido,
                multiplier: multiplier,
            },
            jackpot: {
                won: jackpotWon,
                amount: jackpotAmount,
                current: this.state.jackpot,
            }
        };
    }

    _evaluateWins(grid) {
        const PAYLINES = [
            [1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],
            [0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,0],
            [2,1,1,1,2],[1,0,1,2,1],[1,2,1,0,1],[0,0,1,0,0],[2,2,1,2,2],
            [0,1,0,1,0],[2,1,2,1,2],[1,0,1,0,1],[1,2,1,2,1],[0,1,2,2,1]
        ];

        const PAYTABLE = {
            leon: { 5: 500, 4: 100, 3: 25 },
            wild: { 5: 1000, 4: 200, 3: 50 },
            A: { 5: 50, 4: 15, 3: 5 },
            K: { 5: 40, 4: 12, 3: 4 },
            Q: { 5: 30, 4: 10, 3: 3 },
            J: { 5: 20, 4: 8, 3: 2 },
            '10': { 5: 15, 4: 5, 3: 2 },
        };

        const wins = [];

        for (let lineIdx = 0; lineIdx < this.state.numLines; lineIdx++) {
            const payline = PAYLINES[lineIdx];
            const symbolsInLine = payline.map((row, reel) => grid[reel][row]);

            // Encontrar símbolo target
            let target = null;
            for (const s of symbolsInLine) {
                if (s !== 'wild' && s !== 'scatter') {
                    target = s;
                    break;
                }
            }

            if (!target) {
                if (symbolsInLine.every(s => s === 'wild')) {
                    target = 'wild';
                } else {
                    continue;
                }
            }

            // Contar consecutivos desde izquierda
            let count = 0;
            const positions = [];
            const wildPositions = [];

            for (let i = 0; i < 5; i++) {
                const s = symbolsInLine[i];
                if (s === target || s === 'wild') {
                    count++;
                    positions.push([i, payline[i]]);
                    if (s === 'wild') wildPositions.push([i, payline[i]]);
                } else {
                    break;
                }
            }

            if (count >= 3 && PAYTABLE[target]) {
                const multiplier = PAYTABLE[target][count] || 0;
                if (multiplier > 0) {
                    wins.push({
                        symbol: target,
                        count,
                        multiplier,
                        win: multiplier * this.state.betPerLine,
                        positions,
                        wild_positions: wildPositions,
                        line: lineIdx + 1
                    });
                }
            }
        }

        return wins;
    }

    // ================================================================
    // API SPIN (Cuando hay backend)
    // ================================================================

    async _apiSpin() {
        try {
            const response = await fetch(`${this.apiBase}/spin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: this.state.userId,
                    bet_per_line: this.state.betPerLine,
                    num_lines: this.state.numLines,
                    currency: this.state.currency,
                })
            });

            if (!response.ok) {
                const err = await response.json();
                this._showMessage(err.error || 'Error en el servidor');
                return null;
            }

            return await response.json();
        } catch (e) {
            console.warn('API not available, using local engine:', e.message);
            this.useLocalEngine = true;
            return this._localSpin();
        }
    }

    // ================================================================
    // PROCESAR RESULTADO
    // ================================================================

    async _processResult(result) {
        const totalWin = result.total_win;
        this.state.lastWin = totalWin;

        // Jackpot
        if (result.jackpot && result.jackpot.won) {
            await animations.showJackpot(result.jackpot.amount);
        }

        // Modo Rugido
        if (result.modo_rugido && result.modo_rugido.active) {
            this.state.modoRugido = true;
            this.state.multiplier = result.modo_rugido.multiplier;
            animations.modoRugidoActivate(result.modo_rugido.multiplier);
        } else if (!this.state.freeSpinsRemaining) {
            if (this.state.modoRugido) {
                this.state.modoRugido = false;
                this.state.multiplier = 1;
                animations.modoRugidoDeactivate();
            }
        }

        // Animar ganancias
        if (result.wins && result.wins.length > 0) {
            animations.animateWinningSymbols(result.wins);

            // Determinar nivel de ganancia
            const betMultiple = totalWin / this.state.totalBet;
            
            if (betMultiple >= 50) {
                await animations.showBigWin(totalWin, 'epic');
            } else if (betMultiple >= 20) {
                await animations.showBigWin(totalWin, 'mega');
            } else if (betMultiple >= 8) {
                await animations.showBigWin(totalWin, 'big');
            } else if (totalWin > 0) {
                animations.showWinOverlay(totalWin, 1500);
                sound.winSmall();
                animations.spawnCoins(5);
            }
        }

        // Acreditar ganancias
        if (totalWin > 0) {
            if (this.state.currency === 'credits') {
                this.state.credits += totalWin;
            } else {
                this.state.chips += totalWin;
            }
        }

        // Free Spins
        if (result.free_spins && result.free_spins.triggered) {
            sound.scatterLand();
            await this._delay(500);
            await animations.showFreeSpinsIntro(result.free_spins.awarded);
            this.state.freeSpinsRemaining += result.free_spins.awarded;
        }

        // Actualizar jackpot
        if (result.jackpot) {
            this.state.jackpot = result.jackpot.current;
        }

        this._updateUI();
    }

    // ================================================================
    // UI
    // ================================================================

    _updateUI() {
        document.getElementById('creditsDisplay').textContent = this.state.credits.toLocaleString('es-ES');
        document.getElementById('chipsDisplay').textContent = this.state.chips.toLocaleString('es-ES');
        document.getElementById('vipDisplay').textContent = `VIP ${this.state.vipLevel}`;
        document.getElementById('betDisplay').textContent = this.state.betPerLine.toLocaleString('es-ES');
        document.getElementById('totalBetDisplay').textContent = this.state.totalBet.toLocaleString('es-ES');
        document.getElementById('linesDisplay').textContent = this.state.numLines;
        document.getElementById('winDisplay').textContent = this.state.lastWin.toLocaleString('es-ES');
        document.getElementById('jackpotDisplay').textContent = this.state.jackpot.toLocaleString('es-ES');

        // Free spins
        const fsDisplay = document.getElementById('freeSpinsDisplay');
        const fsLabel = document.getElementById('freeSpinsLabel');
        const fsBox = document.querySelector('.freespins-box');
        
        if (this.state.freeSpinsRemaining > 0) {
            fsDisplay.textContent = this.state.freeSpinsRemaining;
            fsLabel.textContent = 'ACTIVOS';
            fsBox.classList.add('active');
            document.getElementById('spinBtn').classList.add('free-spin');
        } else {
            fsDisplay.textContent = '0';
            fsLabel.textContent = 'INACTIVO';
            fsBox.classList.remove('active');
            document.getElementById('spinBtn').classList.remove('free-spin');
        }

        // Multiplier
        const multDisplay = document.getElementById('multiplierDisplay');
        multDisplay.textContent = `X${this.state.multiplier}`;
    }

    _startJackpotAnimation() {
        // Incrementar jackpot visualmente
        setInterval(() => {
            this.state.jackpot += Math.floor(Math.random() * 100) + 10;
            document.getElementById('jackpotDisplay').textContent = this.state.jackpot.toLocaleString('es-ES');
        }, 3000);
    }

    async _loadBalance() {
        if (this.useLocalEngine) return;
        
        try {
            const response = await fetch(`${this.apiBase}/balance?user_id=${this.state.userId}`);
            if (response.ok) {
                const data = await response.json();
                this.state.credits = data.credits || this.state.credits;
                this.state.chips = data.chips || this.state.chips;
                this.state.vipLevel = data.vip_level || this.state.vipLevel;
                this._updateUI();
            }
        } catch (e) {
            console.warn('Could not load balance from API');
        }
    }

    _showMessage(msg) {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: rgba(0,0,0,0.9); color: #f5d061; padding: 12px 24px;
            border-radius: 8px; font-family: var(--font-tech); font-size: 14px;
            z-index: 9999; border: 1px solid #d4a017;
            animation: fadeIn 0.3s ease;
        `;
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ================================================================
// INICIAR JUEGO
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    const game = new SlotGame();
    game.init();
    
    // Exponer para debug
    window.c8lGame = game;
});
