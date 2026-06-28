/**
 * 🎰 C8L CASINO — Animaciones 3D
 * Carretes cilindro, león bonus, partículas, efectos
 */
class AnimationEngine {
    constructor() { this.particlesContainer = null; this.isAnimating = false; }
    init() {
        this.particlesContainer = document.getElementById('particlesContainer');
        this._startBgParticles();
        this._initReels();
    }
    _initReels() {
        const syms = Object.keys(SYMBOLS);
        for (let r = 0; r < 5; r++) {
            const reel = document.getElementById(`reel${r}`);
            const cells = reel.querySelectorAll('.symbol');
            cells.forEach(cell => {
                const rand = syms[Math.floor(Math.random() * syms.length)];
                cell.innerHTML = getSymbolHTML(rand);
            });
        }
    }
    _startBgParticles() {
        const cont = document.getElementById('bgParticles');
        if (!cont) return;
        setInterval(() => {
            const p = document.createElement('div');
            p.style.cssText = `position:absolute;font-size:${8+Math.random()*10}px;left:${Math.random()*100}%;top:-10px;opacity:${0.1+Math.random()*0.2};animation:particleFall ${4+Math.random()*4}s linear forwards;pointer-events:none;`;
            p.textContent = ['✨','🪙','⭐'][Math.floor(Math.random()*3)];
            cont.appendChild(p);
            setTimeout(() => p.remove(), 8000);
        }, 800);
    }
    async spinReels(finalGrid, onComplete) {
        this.isAnimating = true;
        const reels = [];
        for (let i = 0; i < 5; i++) reels.push(document.getElementById(`reel${i}`));
        reels.forEach(r => r.classList.add('spinning'));
        for (let i = 0; i < 5; i++) {
            await this._delay(250 + i * 180);
            await this._stopReel(i, finalGrid[i]);
        }
        await this._delay(150);
        this.isAnimating = false;
        if (onComplete) onComplete();
    }
    async _stopReel(idx, symbols) {
        const reel = document.getElementById(`reel${idx}`);
        reel.classList.remove('spinning');
        reel.classList.add('stopping');
        const cells = reel.querySelectorAll('.symbol');
        symbols.forEach((s, i) => { if (cells[i]) cells[i].innerHTML = getSymbolHTML(s); });
        sound.reelStop(idx);
        await this._delay(400);
        reel.classList.remove('stopping');
    }
    startReelAnimation(idx) {
        const reel = document.getElementById(`reel${idx}`);
        const cells = reel.querySelectorAll('.symbol');
        const syms = Object.keys(SYMBOLS);
        const iv = setInterval(() => {
            if (!reel.classList.contains('spinning')) { clearInterval(iv); return; }
            cells.forEach(c => { c.innerHTML = getSymbolHTML(syms[Math.floor(Math.random()*syms.length)]); });
        }, 90);
        return iv;
    }
    animateWinningSymbols(wins) {
        document.querySelectorAll('.symbol.winning').forEach(e => e.classList.remove('winning'));
        wins.forEach(w => {
            if (w.positions) w.positions.forEach(([r, row]) => {
                const reel = document.getElementById(`reel${r}`);
                const syms = reel.querySelectorAll('.symbol');
                if (syms[row]) syms[row].classList.add('winning');
            });
        });
    }
    showWinOverlay(amount, dur = 1500) {
        const ov = document.getElementById('winOverlay');
        const am = document.getElementById('winAmount');
        am.textContent = amount.toLocaleString('es-ES');
        ov.style.display = 'flex';
        setTimeout(() => { ov.style.display = 'none'; }, dur);
    }
    async showBigWin(amount, level = 'big') {
        const popup = document.getElementById('bigWinPopup');
        const title = document.getElementById('bigWinTitle');
        const amEl = document.getElementById('bigWinAmount');
        const titles = { big: '¡GRAN GANANCIA!', mega: '¡¡MEGA GANANCIA!!', epic: '🔥 ¡ÉPICA! 🔥' };
        title.textContent = titles[level] || titles.big;
        popup.style.display = 'flex';
        if (level === 'epic') sound.winMega(); else sound.winBig();
        await this._countUp(amEl, 0, amount, 2000);
        this.spawnCoins(30);
        await this._delay(2500);
        popup.style.display = 'none';
    }
    async showLionBonus(amount) {
        const popup = document.getElementById('lionBonusPopup');
        const amEl = document.getElementById('bonusAmount');
        popup.style.display = 'flex';
        sound.modoRugido();
        document.getElementById('app').classList.add('screen-shake');
        await this._delay(600);
        document.getElementById('app').classList.remove('screen-shake');
        await this._countUp(amEl, 0, amount, 1500);
        this.spawnCoins(40);
        await this._delay(3000);
        popup.style.display = 'none';
    }
    async showFreeSpinsIntro(count) {
        const popup = document.getElementById('freeSpinsPopup');
        document.getElementById('freeSpinsAwarded').textContent = count;
        popup.style.display = 'flex';
        sound.freeSpins();
        return new Promise(resolve => {
            document.getElementById('freeSpinsStartBtn').onclick = () => { popup.style.display = 'none'; resolve(); };
        });
    }
    modoRugidoActivate(mult) {
        const box = document.querySelector('.multiplier-box');
        document.getElementById('multiplierDisplay').textContent = `X${mult}`;
        document.getElementById('modoLabel').textContent = 'RUGIDO';
        box.classList.add('active');
        sound.modoRugido();
        document.getElementById('app').classList.add('screen-shake');
        setTimeout(() => document.getElementById('app').classList.remove('screen-shake'), 500);
    }
    modoRugidoDeactivate() {
        document.querySelector('.multiplier-box').classList.remove('active');
        document.getElementById('multiplierDisplay').textContent = 'X1';
        document.getElementById('modoLabel').textContent = 'NORMAL';
    }
    spawnCoins(count = 20) {
        const coins = ['🪙','💰','✨','⭐','💎'];
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const p = document.createElement('div');
                p.className = 'particle';
                p.textContent = coins[Math.floor(Math.random()*coins.length)];
                p.style.cssText = `left:${Math.random()*100}%;font-size:${16+Math.random()*16}px;animation:particleFall ${1.5+Math.random()*1.5}s linear forwards;`;
                this.particlesContainer.appendChild(p);
                setTimeout(() => p.remove(), 3000);
            }, i * 40);
        }
    }
    async _countUp(el, from, to, dur) {
        const start = performance.now();
        return new Promise(resolve => {
            const tick = (now) => {
                const p = Math.min((now - start) / dur, 1);
                const eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.floor(from + (to - from) * eased).toLocaleString('es-ES');
                if (p < 1) requestAnimationFrame(tick); else { el.textContent = to.toLocaleString('es-ES'); resolve(); }
            };
            requestAnimationFrame(tick);
        });
    }
    _delay(ms) { return new Promise(r => setTimeout(r, ms)); }
}
const animations = new AnimationEngine();
