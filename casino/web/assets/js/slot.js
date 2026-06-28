/**
 * 🎰 C8L CASINO — EL LEÓN DORADO
 * Professional Slot Machine built with PixiJS
 * Style: AAA Casino (Pragmatic Play / NetEnt quality)
 */

// ============================================================
// CONFIG
// ============================================================
const CONFIG = {
    REELS: 5,
    ROWS: 3,
    SYMBOL_SIZE: 120,
    SYMBOL_GAP: 8,
    REEL_WIDTH: 130,
    SPIN_SPEED: 40,
    SPIN_DURATION: [800, 1000, 1200, 1400, 1600], // ms per reel
    BOUNCE_BACK: 15,
    BET_LEVELS: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
    LINES: 20,
};

const SYMBOLS_DEF = [
    { id: 'leon', name: 'León Dorado', tier: 'premium' },
    { id: 'wild', name: 'Wild', tier: 'special' },
    { id: 'scatter', name: 'Scatter', tier: 'special' },
    { id: 'bot', name: 'Bot C8L', tier: 'high' },
    { id: 'villano', name: 'León Villano', tier: 'high' },
    { id: 'c8l', name: 'C8L Casino', tier: 'high' },
    { id: 'A', name: 'As', tier: 'medium' },
    { id: 'K', name: 'Rey', tier: 'medium' },
    { id: 'Q', name: 'Reina', tier: 'low' },
    { id: 'J', name: 'Jota', tier: 'low' },
    { id: '10', name: 'Diez', tier: 'low' },
];


const WEIGHTS = [3, 2, 2, 4, 3, 3, 5, 6, 7, 8, 9];
const PAYTABLE = {
    leon: {5:500,4:100,3:25}, wild: {5:1000,4:200,3:50},
    bot: {5:80,4:20,3:8}, villano: {5:60,4:18,3:6}, c8l: {5:150,4:40,3:12},
    A: {5:50,4:15,3:5}, K: {5:40,4:12,3:4},
    Q: {5:30,4:10,3:3}, J: {5:20,4:8,3:2}, '10': {5:15,4:5,3:2},
};
const PAYLINES = [
    [1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],
    [0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,0],
    [2,1,1,1,2],[1,0,1,2,1],[1,2,1,0,1],[0,0,1,0,0],[2,2,1,2,2],
    [0,1,0,1,0],[2,1,2,1,2],[1,0,1,0,1],[1,2,1,2,1],[0,1,2,2,1]
];

// Symbol image URLs (Pollinations AI)
const P = 'https://image.pollinations.ai/prompt/';
const SP = '?width=256&height=256&nologo=true&seed=';
const SYMBOL_URLS = {
    leon: P+'photorealistic%20majestic%20golden%20lion%20head%2C%20detailed%20golden%20mane%2C%20intense%20eyes%2C%20premium%20casino%20slot%20symbol%2C%20ornate%20gold%20frame%2C%20dark%20bg%2C%20AAA%20quality%2C%20centered%2C%20no%20text'+SP+'700',
    wild: P+'ornate%20red%20heart%20with%20golden%20wings%20and%20crown%2C%20WILD%20text%20banner%2C%20premium%20casino%20slot%2C%20gold%20ornaments%2C%20fire%2C%20dark%20bg%2C%20centered'+SP+'701',
    scatter: P+'golden%20lion%20wearing%20royal%20crown%2C%20SCATTER%20banner%2C%20premium%20casino%20slot%2C%20gold%20frame%2C%20jewels%2C%20dark%20bg%2C%20centered'+SP+'702',
    bot: P+'futuristic%20blue%20robot%20head%2C%20glowing%20LED%20eyes%2C%20blue%20metallic%20gold%20details%2C%20casino%20slot%20symbol%2C%20gold%20frame%2C%20dark%20bg%2C%20centered%2C%20no%20text'+SP+'703',
    villano: P+'evil%20dark%20lion%20head%2C%20red%20glowing%20eyes%2C%20dark%20mane%20red%20highlights%2C%20menacing%2C%20casino%20slot%2C%20dark%20frame%2C%20dark%20bg%2C%20centered%2C%20no%20text'+SP+'704',
    c8l: P+'luxury%20gold%20C8L%20casino%20logo%20emblem%2C%20baroque%20gold%20shield%2C%20crown%20on%20top%2C%20premium%2C%20dark%20bg%2C%20centered'+SP+'705',
    A: P+'letter%20A%20red%20ruby%20gemstone%203D%2C%20gold%20frame%2C%20casino%20slot%2C%20dark%20bg%2C%20centered%2C%20single%20letter'+SP+'706',
    K: P+'letter%20K%20blue%20sapphire%20gemstone%203D%2C%20gold%20frame%2C%20casino%20slot%2C%20dark%20bg%2C%20centered%2C%20single%20letter'+SP+'707',
    Q: P+'letter%20Q%20purple%20amethyst%20gemstone%203D%2C%20gold%20frame%2C%20casino%20slot%2C%20dark%20bg%2C%20centered%2C%20single%20letter'+SP+'708',
    J: P+'letter%20J%20green%20emerald%20gemstone%203D%2C%20gold%20frame%2C%20casino%20slot%2C%20dark%20bg%2C%20centered%2C%20single%20letter'+SP+'709',
    '10': P+'number%2010%20golden%20topaz%20gemstone%203D%2C%20gold%20frame%2C%20casino%20slot%2C%20dark%20bg%2C%20centered'+SP+'710',
};


// ============================================================
// GAME STATE
// ============================================================
const state = {
    credits: 152450000,
    chips: 8250,
    vipLevel: 10,
    betIndex: 4,
    get betPerLine() { return CONFIG.BET_LEVELS[this.betIndex]; },
    get totalBet() { return this.betPerLine * CONFIG.LINES; },
    lastWin: 0,
    jackpot: 48532120,
    freeSpins: 0,
    multiplier: 1,
    spinning: false,
};

// ============================================================
// PIXI APP SETUP
// ============================================================
let app, reelContainer, symbolTextures = {}, uiTexts = {};

async function init() {
    app = new PIXI.Application({
        view: document.getElementById('game-canvas'),
        resizeTo: window,
        backgroundColor: 0x050505,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
    });

    // Load textures
    await loadSymbolTextures();

    // Build scene
    buildBackground();
    buildReels();
    buildUI();

    // Ticker for jackpot animation
    app.ticker.add(tickJackpot);

    // Resize handler
    window.addEventListener('resize', onResize);
    onResize();
}

async function loadSymbolTextures() {
    const ids = Object.keys(SYMBOL_URLS);
    for (const id of ids) {
        try {
            const tex = await PIXI.Assets.load(SYMBOL_URLS[id]);
            symbolTextures[id] = tex;
        } catch (e) {
            // Fallback: colored rectangle with text
            symbolTextures[id] = createFallbackTexture(id);
        }
    }
}

function createFallbackTexture(id) {
    const g = new PIXI.Graphics();
    const colors = { leon:0xd4a017, wild:0xc0392b, scatter:0x9b59b6, bot:0x2980b9, villano:0x1a1a1a, c8l:0xd4a017, A:0xc0392b, K:0x2980b9, Q:0x8e44ad, J:0x27ae60, '10':0x16a085 };
    g.beginFill(colors[id] || 0x333333);
    g.drawRoundedRect(0, 0, 100, 100, 12);
    g.endFill();
    const t = app.renderer.generateTexture(g);
    return t;
}


// ============================================================
// BACKGROUND
// ============================================================
let bgContainer;

function buildBackground() {
    bgContainer = new PIXI.Container();
    app.stage.addChild(bgContainer);

    // Dark gradient background
    const bg = new PIXI.Graphics();
    bg.beginFill(0x0a0800);
    bg.drawRect(0, 0, app.screen.width, app.screen.height);
    bg.endFill();
    bgContainer.addChild(bg);

    // Gold radial glow at top
    const glow = new PIXI.Graphics();
    glow.beginFill(0x1a1200, 0.6);
    glow.drawEllipse(app.screen.width/2, 0, app.screen.width*0.6, 200);
    glow.endFill();
    bgContainer.addChild(glow);
}

// ============================================================
// REELS
// ============================================================
let reels = []; // Each reel: { container, symbols[], position, speed, spinning }

function buildReels() {
    reelContainer = new PIXI.Container();
    app.stage.addChild(reelContainer);

    const sw = app.screen.width;
    const sh = app.screen.height;
    const symSize = Math.min(sw * 0.14, CONFIG.SYMBOL_SIZE);
    const reelW = symSize + CONFIG.SYMBOL_GAP;
    const totalW = CONFIG.REELS * reelW;
    const startX = (sw - totalW) / 2;
    const reelH = symSize * CONFIG.ROWS + CONFIG.SYMBOL_GAP * (CONFIG.ROWS - 1);
    const startY = sh * 0.28;

    // Machine frame (gold border)
    const frame = new PIXI.Graphics();
    frame.lineStyle(4, 0xd4a017, 1);
    frame.beginFill(0x050505, 0.95);
    frame.drawRoundedRect(startX - 16, startY - 16, totalW + 32, reelH + 32, 16);
    frame.endFill();
    // Outer glow
    frame.lineStyle(2, 0xf5d061, 0.3);
    frame.drawRoundedRect(startX - 20, startY - 20, totalW + 40, reelH + 40, 18);
    reelContainer.addChild(frame);

    // Create mask for reels
    const mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);
    mask.drawRoundedRect(startX - 8, startY - 8, totalW + 16, reelH + 16, 12);
    mask.endFill();
    reelContainer.addChild(mask);

    // Build each reel
    for (let i = 0; i < CONFIG.REELS; i++) {
        const rc = new PIXI.Container();
        rc.mask = mask;
        rc.x = startX + i * reelW;
        rc.y = startY;

        // Create symbols (ROWS + 2 extra for animation buffer)
        const symbols = [];
        for (let j = 0; j < CONFIG.ROWS + 2; j++) {
            const symId = getRandomSymbol();
            const sprite = new PIXI.Sprite(symbolTextures[symId]);
            sprite.width = symSize;
            sprite.height = symSize;
            sprite.x = CONFIG.SYMBOL_GAP / 2;
            sprite.y = (j - 1) * (symSize + CONFIG.SYMBOL_GAP);
            sprite.symbolId = symId;
            sprite.roundPixels = true;
            rc.addChild(sprite);
            symbols.push(sprite);
        }

        reelContainer.addChild(rc);
        reels.push({
            container: rc,
            symbols,
            position: 0,
            speed: 0,
            spinning: false,
            targetSymbols: null,
            symSize,
        });
    }

    // Center payline indicator
    const line = new PIXI.Graphics();
    line.lineStyle(2, 0xf5d061, 0.5);
    const lineY = startY + reelH / 2;
    line.moveTo(startX - 12, lineY);
    line.lineTo(startX + totalW + 12, lineY);
    reelContainer.addChild(line);
}


// ============================================================
// SPIN LOGIC
// ============================================================

function spin() {
    if (state.spinning) return;
    if (state.credits < state.totalBet && state.freeSpins <= 0) return;

    state.spinning = true;
    state.lastWin = 0;
    if (state.freeSpins <= 0) state.credits -= state.totalBet;
    else state.freeSpins--;
    updateUI();

    // Generate result
    const result = generateResult();

    // Start spinning all reels
    reels.forEach((reel, i) => {
        reel.spinning = true;
        reel.speed = CONFIG.SPIN_SPEED;
        reel.targetSymbols = result.grid[i];

        // Stop each reel after its delay
        setTimeout(() => stopReel(reel, i, result), CONFIG.SPIN_DURATION[i]);
    });

    // After all reels stop
    const totalDuration = CONFIG.SPIN_DURATION[CONFIG.REELS - 1] + 600;
    setTimeout(() => processResult(result), totalDuration);
}

function stopReel(reel, index, result) {
    reel.spinning = false;
    // Set final symbols
    const symSize = reel.symSize;
    result.grid[index].forEach((symId, row) => {
        const sprite = reel.symbols[row + 1]; // +1 because of buffer
        sprite.texture = symbolTextures[symId] || symbolTextures['10'];
        sprite.symbolId = symId;
    });
    // Bounce animation
    const container = reel.container;
    const origY = container.y;
    let bounceTime = 0;
    const bounceTicker = () => {
        bounceTime += app.ticker.deltaMS;
        const progress = Math.min(bounceTime / 300, 1);
        const bounce = Math.sin(progress * Math.PI) * CONFIG.BOUNCE_BACK;
        container.y = origY + bounce * (1 - progress);
        if (progress >= 1) {
            container.y = origY;
            app.ticker.remove(bounceTicker);
        }
    };
    app.ticker.add(bounceTicker);
}

// Reel animation ticker
function animateReels() {
    reels.forEach(reel => {
        if (!reel.spinning) return;
        const symSize = reel.symSize + CONFIG.SYMBOL_GAP;
        reel.position += reel.speed * app.ticker.deltaMS * 0.01;

        // Move symbols down
        reel.symbols.forEach((sprite, j) => {
            const prevY = sprite.y;
            sprite.y = ((j - 1) * symSize) + (reel.position % symSize);
            // If symbol goes below visible area, move to top and randomize
            if (sprite.y > symSize * CONFIG.ROWS) {
                sprite.y -= symSize * (CONFIG.ROWS + 2);
                const newSym = getRandomSymbol();
                sprite.texture = symbolTextures[newSym] || symbolTextures['10'];
                sprite.symbolId = newSym;
            }
        });
    });
}

function generateResult() {
    const grid = [];
    for (let r = 0; r < CONFIG.REELS; r++) {
        const col = [];
        for (let row = 0; row < CONFIG.ROWS; row++) {
            col.push(getRandomSymbol());
        }
        grid.push(col);
    }

    // Evaluate wins
    const wins = evaluateWins(grid);
    let totalWin = wins.reduce((s, w) => s + w.win, 0);

    // Scatter
    let scatterCount = 0;
    for (let r = 0; r < 5; r++) for (let row = 0; row < 3; row++) if (grid[r][row]==='scatter') scatterCount++;
    let freeSpinsAwarded = scatterCount >= 3 ? (scatterCount >= 5 ? 25 : scatterCount >= 4 ? 15 : 10) : 0;

    // Multiplier (5% on wins)
    let modoRugido = totalWin > 0 && Math.random() < 0.05;
    let multiplier = modoRugido ? [2,3,5,8,10][Math.floor(Math.random()*5)] : 1;
    totalWin *= multiplier;

    // Jackpot
    let jackpotWon = Math.random() < 0.0001;
    if (jackpotWon) { totalWin += state.jackpot; state.jackpot = 1000000; }
    state.jackpot += Math.floor(state.totalBet * 0.01);

    return { grid, wins, totalWin, scatterCount, freeSpinsAwarded, modoRugido, multiplier, jackpotWon };
}


function evaluateWins(grid) {
    const wins = [];
    for (let li = 0; li < CONFIG.LINES; li++) {
        const payline = PAYLINES[li];
        const line = payline.map((row, reel) => grid[reel][row]);
        let target = null;
        for (const s of line) { if (s !== 'wild' && s !== 'scatter') { target = s; break; } }
        if (!target) { if (line.every(s => s === 'wild')) target = 'wild'; else continue; }
        let count = 0;
        for (let i = 0; i < 5; i++) { if (line[i] === target || line[i] === 'wild') count++; else break; }
        if (count >= 3 && PAYTABLE[target]) {
            const mult = PAYTABLE[target][count] || 0;
            if (mult > 0) wins.push({ symbol: target, count, win: mult * state.betPerLine, line: li+1 });
        }
    }
    return wins;
}

function processResult(result) {
    state.lastWin = result.totalWin;
    if (result.totalWin > 0) {
        state.credits += result.totalWin;
        // Win effects
        const betMult = result.totalWin / state.totalBet;
        if (betMult >= 20) showBigWin(result.totalWin);
        else showSmallWin(result.totalWin);
        spawnCoins(Math.min(betMult * 3, 40));
    }
    if (result.freeSpinsAwarded > 0) state.freeSpins += result.freeSpinsAwarded;
    if (result.modoRugido) state.multiplier = result.multiplier;
    else state.multiplier = 1;
    state.spinning = false;
    updateUI();
}

function getRandomSymbol() {
    const total = WEIGHTS.reduce((a,b) => a+b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < SYMBOLS_DEF.length; i++) {
        r -= WEIGHTS[i];
        if (r <= 0) return SYMBOLS_DEF[i].id;
    }
    return SYMBOLS_DEF[SYMBOLS_DEF.length-1].id;
}


// ============================================================
// UI
// ============================================================
let uiContainer;

function buildUI() {
    uiContainer = new PIXI.Container();
    app.stage.addChild(uiContainer);

    const sw = app.screen.width;
    const sh = app.screen.height;

    // Title: C8L LEGENDS
    const title = new PIXI.Text('C8L LEGENDS', { fontFamily: 'Cinzel Decorative', fontSize: 24, fill: 0xf5d061, fontWeight: '900', letterSpacing: 4 });
    title.anchor.set(0.5, 0);
    title.x = sw / 2; title.y = 12;
    uiContainer.addChild(title);
    uiTexts.title = title;

    const sub = new PIXI.Text('EL LEÓN DORADO', { fontFamily: 'Orbitron', fontSize: 10, fill: 0xd4a017, letterSpacing: 3 });
    sub.anchor.set(0.5, 0);
    sub.x = sw / 2; sub.y = 40;
    uiContainer.addChild(sub);
    uiTexts.sub = sub;

    // Jackpot
    const jpLabel = new PIXI.Text('JACKPOT GLOBAL', { fontFamily: 'Orbitron', fontSize: 9, fill: 0xd4a017, letterSpacing: 3 });
    jpLabel.anchor.set(0.5, 0);
    jpLabel.x = sw / 2; jpLabel.y = 58;
    uiContainer.addChild(jpLabel);
    uiTexts.jpLabel = jpLabel;

    const jp = new PIXI.Text(formatNum(state.jackpot), { fontFamily: 'Orbitron', fontSize: 26, fill: 0xf5d061, fontWeight: '900' });
    jp.anchor.set(0.5, 0);
    jp.x = sw / 2; jp.y = 72;
    uiContainer.addChild(jp);
    uiTexts.jackpot = jp;

    // Bottom controls
    const btnY = sh * 0.82;

    // Spin button (circle)
    const spinBtn = new PIXI.Graphics();
    spinBtn.beginFill(0xd4a017);
    spinBtn.drawCircle(0, 0, 36);
    spinBtn.endFill();
    spinBtn.lineStyle(3, 0xf5d061);
    spinBtn.drawCircle(0, 0, 36);
    spinBtn.x = sw / 2; spinBtn.y = btnY;
    spinBtn.eventMode = 'static';
    spinBtn.cursor = 'pointer';
    spinBtn.on('pointerdown', spin);
    uiContainer.addChild(spinBtn);

    const spinLabel = new PIXI.Text('GIRAR', { fontFamily: 'Orbitron', fontSize: 11, fill: 0x0a0a0a, fontWeight: '900' });
    spinLabel.anchor.set(0.5);
    spinLabel.x = sw / 2; spinLabel.y = btnY;
    uiContainer.addChild(spinLabel);
    uiTexts.spinLabel = spinLabel;

    // Bet - / +
    const minusBtn = createButton('-', sw/2 - 90, btnY, () => { if (state.betIndex > 0) { state.betIndex--; updateUI(); } });
    const plusBtn = createButton('+', sw/2 + 90, btnY, () => { if (state.betIndex < CONFIG.BET_LEVELS.length-1) { state.betIndex++; updateUI(); } });
    uiContainer.addChild(minusBtn);
    uiContainer.addChild(plusBtn);

    // Info texts
    const infoY = sh * 0.74;
    const infos = [
        { label: 'LÍNEAS', value: '20', x: sw*0.15 },
        { label: 'APUESTA', value: formatNum(state.betPerLine), x: sw*0.35 },
        { label: 'TOTAL', value: formatNum(state.totalBet), x: sw*0.55 },
        { label: 'GANANCIA', value: '0', x: sw*0.8 },
    ];
    infos.forEach(info => {
        const label = new PIXI.Text(info.label, { fontFamily: 'Orbitron', fontSize: 8, fill: 0xd4a017, letterSpacing: 1 });
        label.anchor.set(0.5, 0); label.x = info.x; label.y = infoY;
        uiContainer.addChild(label);

        const val = new PIXI.Text(info.value, { fontFamily: 'Orbitron', fontSize: 14, fill: 0xf5f0e8, fontWeight: '700' });
        val.anchor.set(0.5, 0); val.x = info.x; val.y = infoY + 14;
        uiContainer.addChild(val);
        uiTexts[info.label] = val;
    });

    // Bottom status bar
    const statusY = sh - 30;
    const credits = new PIXI.Text('🪙 ' + formatNum(state.credits), { fontFamily: 'Orbitron', fontSize: 12, fill: 0xf5f0e8 });
    credits.x = 20; credits.y = statusY;
    uiContainer.addChild(credits);
    uiTexts.credits = credits;

    const chips = new PIXI.Text('💎 ' + formatNum(state.chips), { fontFamily: 'Orbitron', fontSize: 12, fill: 0xf5f0e8 });
    chips.anchor.set(0.5, 0); chips.x = sw/2; chips.y = statusY;
    uiContainer.addChild(chips);
    uiTexts.chips = chips;

    const vip = new PIXI.Text('⭐ VIP ' + state.vipLevel, { fontFamily: 'Orbitron', fontSize: 12, fill: 0xf5f0e8 });
    vip.anchor.set(1, 0); vip.x = sw - 20; vip.y = statusY;
    uiContainer.addChild(vip);
    uiTexts.vip = vip;
}

function createButton(label, x, y, onClick) {
    const btn = new PIXI.Graphics();
    btn.beginFill(0x1a1200); btn.lineStyle(2, 0x8b6914);
    btn.drawCircle(0, 0, 22); btn.endFill();
    btn.x = x; btn.y = y;
    btn.eventMode = 'static'; btn.cursor = 'pointer';
    btn.on('pointerdown', onClick);
    const t = new PIXI.Text(label, { fontSize: 18, fill: 0xf5d061, fontWeight: '900' });
    t.anchor.set(0.5); btn.addChild(t);
    return btn;
}


function updateUI() {
    if (uiTexts.jackpot) uiTexts.jackpot.text = formatNum(state.jackpot);
    if (uiTexts.credits) uiTexts.credits.text = '🪙 ' + formatNum(state.credits);
    if (uiTexts.chips) uiTexts.chips.text = '💎 ' + formatNum(state.chips);
    if (uiTexts['APUESTA']) uiTexts['APUESTA'].text = formatNum(state.betPerLine);
    if (uiTexts['TOTAL']) uiTexts['TOTAL'].text = formatNum(state.totalBet);
    if (uiTexts['GANANCIA']) uiTexts['GANANCIA'].text = formatNum(state.lastWin);
}

function tickJackpot() {
    if (Math.random() < 0.02) state.jackpot += Math.floor(Math.random() * 50) + 5;
    if (uiTexts.jackpot) uiTexts.jackpot.text = formatNum(state.jackpot);
}

// ============================================================
// WIN EFFECTS
// ============================================================
function showSmallWin(amount) {
    const text = new PIXI.Text('+' + formatNum(amount), { fontFamily: 'Orbitron', fontSize: 28, fill: 0xf5d061, fontWeight: '900', stroke: 0x000000, strokeThickness: 3 });
    text.anchor.set(0.5);
    text.x = app.screen.width / 2; text.y = app.screen.height * 0.5;
    text.alpha = 1;
    app.stage.addChild(text);
    let time = 0;
    const tick = () => {
        time += app.ticker.deltaMS;
        text.y -= 1; text.alpha = 1 - time / 1500;
        if (time > 1500) { app.stage.removeChild(text); app.ticker.remove(tick); text.destroy(); }
    };
    app.ticker.add(tick);
}

function showBigWin(amount) {
    const bg = new PIXI.Graphics();
    bg.beginFill(0x000000, 0.8);
    bg.drawRect(0, 0, app.screen.width, app.screen.height);
    bg.endFill();
    bg.eventMode = 'static';
    app.stage.addChild(bg);

    const title = new PIXI.Text('¡GRAN GANANCIA!', { fontFamily: 'Cinzel Decorative', fontSize: 28, fill: 0xf5d061, fontWeight: '900' });
    title.anchor.set(0.5); title.x = app.screen.width/2; title.y = app.screen.height*0.4;
    app.stage.addChild(title);

    const amountText = new PIXI.Text(formatNum(amount), { fontFamily: 'Orbitron', fontSize: 44, fill: 0xf5d061, fontWeight: '900', stroke: 0x8b6914, strokeThickness: 4 });
    amountText.anchor.set(0.5); amountText.x = app.screen.width/2; amountText.y = app.screen.height*0.52;
    amountText.scale.set(0);
    app.stage.addChild(amountText);

    // Animate scale
    let time = 0;
    const tick = () => {
        time += app.ticker.deltaMS;
        const p = Math.min(time / 500, 1);
        amountText.scale.set(1 + Math.sin(p * Math.PI) * 0.3);
        if (time > 3000) {
            app.stage.removeChild(bg); app.stage.removeChild(title); app.stage.removeChild(amountText);
            app.ticker.remove(tick); bg.destroy(); title.destroy(); amountText.destroy();
        }
    };
    app.ticker.add(tick);
}

function spawnCoins(count) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const coin = new PIXI.Text('🪙', { fontSize: 20 + Math.random() * 16 });
            coin.x = Math.random() * app.screen.width;
            coin.y = -30;
            coin.alpha = 1;
            app.stage.addChild(coin);
            const speed = 3 + Math.random() * 4;
            const tick = () => {
                coin.y += speed;
                coin.rotation += 0.05;
                if (coin.y > app.screen.height + 30) {
                    app.stage.removeChild(coin); app.ticker.remove(tick); coin.destroy();
                }
            };
            app.ticker.add(tick);
        }, i * 50);
    }
}

// ============================================================
// RESIZE
// ============================================================
function onResize() {
    // Rebuild everything on resize (simple approach)
    app.stage.removeChildren();
    reels = [];
    uiTexts = {};
    buildBackground();
    buildReels();
    buildUI();
}

// ============================================================
// HELPERS
// ============================================================
function formatNum(n) { return n.toLocaleString('es-ES'); }

// ============================================================
// START
// ============================================================
app = null;
document.addEventListener('DOMContentLoaded', () => {
    // Add reel animation to global ticker after init
    init().then(() => {
        app.ticker.add(animateReels);
        console.log('🎰 C8L Casino — PixiJS Engine Loaded');
    });
});
