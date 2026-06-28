/**
 * 🎰 C8L CASINO — Sistema de Animaciones
 * Animaciones de carretes, partículas, efectos de ganancia
 */

class AnimationEngine {
    constructor() {
        this.particlesContainer = null;
        this.isAnimating = false;
    }

    init() {
        this.particlesContainer = document.getElementById('particlesContainer');
    }

    // ================================================================
    // ANIMACIÓN DE CARRETES
    // ================================================================

    /**
     * Anima el giro de todos los carretes
     * @param {Array} finalGrid - Grid final 5×3 con IDs de símbolos
     * @param {Function} onComplete - Callback cuando termina
     */
    async spinReels(finalGrid, onComplete) {
        this.isAnimating = true;
        const reels = document.querySelectorAll('.reel');
        
        // Iniciar todos los carretes girando
        reels.forEach(reel => {
            reel.classList.add('spinning');
            reel.classList.remove('stopping');
        });

        // Parar carretes secuencialmente (efecto cascada)
        for (let i = 0; i < 5; i++) {
            await this._delay(300 + i * 200); // Cada carrete para 200ms después
            await this._stopReel(i, finalGrid[i]);
        }

        await this._delay(200);
        this.isAnimating = false;
        if (onComplete) onComplete();
    }

    async _stopReel(reelIndex, symbols) {
        const reel = document.getElementById(`reel${reelIndex}`);
        const strip = reel.querySelector('.reel-strip');
        
        reel.classList.remove('spinning');
        reel.classList.add('stopping');
        
        // Actualizar símbolos
        const symbolElements = strip.querySelectorAll('.symbol');
        symbols.forEach((symId, row) => {
            symbolElements[row].innerHTML = getSymbolEmoji(symId);
            symbolElements[row].dataset.symbol = symId;
        });

        sound.reelStop(reelIndex);
        
        // Esperar a que termine la animación de parada
        await this._delay(300);
        reel.classList.remove('stopping');
    }

    /**
     * Genera símbolos aleatorios durante el giro (efecto visual)
     */
    startReelAnimation(reelIndex) {
        const reel = document.getElementById(`reel${reelIndex}`);
        const strip = reel.querySelector('.reel-strip');
        const symbolElements = strip.querySelectorAll('.symbol');
        
        const allSymbols = Object.keys(SYMBOLS);
        
        const interval = setInterval(() => {
            if (!reel.classList.contains('spinning')) {
                clearInterval(interval);
                return;
            }
            symbolElements.forEach(el => {
                const randomSym = allSymbols[Math.floor(Math.random() * allSymbols.length)];
                el.innerHTML = getSymbolEmoji(randomSym);
            });
        }, 80);
        
        return interval;
    }

    // ================================================================
    // ANIMACIÓN DE GANANCIAS
    // ================================================================

    /**
     * Anima los símbolos ganadores
     */
    animateWinningSymbols(wins) {
        // Limpiar animaciones previas
        document.querySelectorAll('.symbol.winning').forEach(el => {
            el.classList.remove('winning');
        });

        wins.forEach(win => {
            if (win.positions) {
                win.positions.forEach(([reel, row]) => {
                    const reelEl = document.getElementById(`reel${reel}`);
                    const symbols = reelEl.querySelectorAll('.symbol');
                    if (symbols[row]) {
                        symbols[row].classList.add('winning');
                        
                        // Wild glow
                        if (win.wild_positions && win.wild_positions.some(([wr, wrow]) => wr === reel && wrow === row)) {
                            symbols[row].classList.add('wild-glow');
                        }
                    }
                });
            }
        });
    }

    /**
     * Muestra el overlay de ganancia
     */
    showWinOverlay(amount, duration = 2000) {
        const overlay = document.getElementById('winOverlay');
        const amountEl = document.getElementById('winAmount');
        
        amountEl.textContent = this.formatNumber(amount);
        overlay.style.display = 'flex';
        
        setTimeout(() => {
            overlay.style.display = 'none';
        }, duration);
    }

    /**
     * Big Win popup con contador animado
     */
    async showBigWin(amount, level = 'big') {
        const popup = document.getElementById('bigWinPopup');
        const titleEl = document.getElementById('bigWinTitle');
        const amountEl = document.getElementById('bigWinAmount');
        
        const titles = {
            big: '¡GRAN GANANCIA!',
            mega: '¡¡MEGA GANANCIA!!',
            epic: '🔥 ¡¡¡GANANCIA ÉPICA!!! 🔥'
        };
        
        titleEl.textContent = titles[level] || titles.big;
        popup.style.display = 'flex';
        
        // Sonido
        if (level === 'big') sound.winBig();
        else sound.winMega();
        
        // Contador animado
        await this._countUp(amountEl, 0, amount, 2000);
        
        // Partículas
        this.spawnCoins(30);
        
        await this._delay(3000);
        popup.style.display = 'none';
    }

    /**
     * Jackpot animation
     */
    async showJackpot(amount) {
        const popup = document.getElementById('jackpotPopup');
        const amountEl = document.getElementById('jackpotWinAmount');
        
        popup.style.display = 'flex';
        sound.jackpot();
        
        // Screen shake
        document.getElementById('app').classList.add('screen-shake');
        
        // Contador
        await this._countUp(amountEl, 0, amount, 4000);
        
        // Muchas partículas
        this.spawnCoins(100);
        
        await this._delay(6000);
        popup.style.display = 'none';
        document.getElementById('app').classList.remove('screen-shake');
    }

    /**
     * Free Spins triggered animation
     */
    async showFreeSpinsIntro(count) {
        const popup = document.getElementById('freeSpinsPopup');
        const amountEl = document.getElementById('freeSpinsAwarded');
        
        amountEl.textContent = count;
        popup.style.display = 'flex';
        sound.freeSpins();
        
        return new Promise(resolve => {
            document.getElementById('freeSpinsStartBtn').onclick = () => {
                popup.style.display = 'none';
                resolve();
            };
        });
    }

    /**
     * Modo Rugido activation
     */
    modoRugidoActivate(multiplier) {
        const multiplierBox = document.querySelector('.multiplier-box');
        const multiplierDisplay = document.getElementById('multiplierDisplay');
        const modoLabel = document.getElementById('modoLabel');
        
        multiplierBox.classList.add('active');
        multiplierDisplay.textContent = `X${multiplier}`;
        modoLabel.textContent = 'MODO RUGIDO';
        
        sound.modoRugido();
        document.getElementById('app').classList.add('screen-shake');
        
        setTimeout(() => {
            document.getElementById('app').classList.remove('screen-shake');
        }, 500);
    }

    modoRugidoDeactivate() {
        const multiplierBox = document.querySelector('.multiplier-box');
        const multiplierDisplay = document.getElementById('multiplierDisplay');
        const modoLabel = document.getElementById('modoLabel');
        
        multiplierBox.classList.remove('active');
        multiplierDisplay.textContent = 'X1';
        modoLabel.textContent = 'NORMAL';
    }

    // ================================================================
    // PARTÍCULAS
    // ================================================================

    /**
     * Genera monedas cayendo
     */
    spawnCoins(count = 20) {
        const coins = ['🪙', '💰', '✨', '⭐', '💎'];
        
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle coin-particle';
                particle.textContent = coins[Math.floor(Math.random() * coins.length)];
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDuration = (1.5 + Math.random() * 1.5) + 's';
                particle.style.animationDelay = Math.random() * 0.5 + 's';
                particle.style.fontSize = (16 + Math.random() * 16) + 'px';
                
                this.particlesContainer.appendChild(particle);
                
                setTimeout(() => particle.remove(), 3000);
            }, i * 50);
        }
    }

    /**
     * Efecto de explosión dorada en una posición
     */
    burstAt(x, y, count = 10) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.textContent = '✨';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.fontSize = '16px';
            
            const angle = (Math.PI * 2 * i) / count;
            const distance = 50 + Math.random() * 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.transition = 'all 0.6s ease-out';
            this.particlesContainer.appendChild(particle);
            
            requestAnimationFrame(() => {
                particle.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
                particle.style.opacity = '0';
            });
            
            setTimeout(() => particle.remove(), 700);
        }
    }

    // ================================================================
    // HELPERS
    // ================================================================

    async _countUp(element, from, to, duration) {
        const start = performance.now();
        
        return new Promise(resolve => {
            const animate = (now) => {
                const elapsed = now - start;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing: ease-out
                const eased = 1 - Math.pow(1 - progress, 3);
                const current = Math.floor(from + (to - from) * eased);
                
                element.textContent = this.formatNumber(current);
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    element.textContent = this.formatNumber(to);
                    resolve();
                }
            };
            
            requestAnimationFrame(animate);
        });
    }

    formatNumber(num) {
        return num.toLocaleString('es-ES');
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Instancia global
const animations = new AnimationEngine();
