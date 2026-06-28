/**
 * 🎰 C8L CASINO — EL LEÓN DORADO
 * PixiJS Professional Slot Machine
 * Spritesheet animation: 3 states (idle, stretch, impact)
 * Style: Flat vector arcade 2D
 */

// ============================================================
// CONFIG
// ============================================================
const CONFIG = {
    REELS: 5,
    ROWS: 3,
    SYMBOL_SIZE: 110,
    REEL_GAP: 6,
    SPIN_SPEED_MAX: 50,
    SPIN_ACCEL: 2,
    SPIN_DECEL: 0.92,
    BOUNCE_STRENGTH: 12,
    BET_LEVELS: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
    LINES: 20,
};


// ============================================================
// SYMBOLS — Flat Vector Arcade Style (Pollinations AI)
// ============================================================
const P = 'https://image.pollinations.ai/prompt/';
const SP = '?width=256&height=256&nologo=true&seed=';
const STYLE = '%2C%20flat%20vector%20design%2C%20bold%20black%20outlines%2C%20vibrant%20colors%2C%20arcade%20video%20game%20style%2C%20clean%20solid%20black%20background%2C%20isolated%20element%2C%20centered%2C%20no%20text%2C%20symmetrical';

const SYMBOLS_DEF = [
    { id: 'leon', name: 'León Dorado', tier: 'premium', weight: 3 },
    { id: 'wild', name: 'Wild', tier: 'special', weight: 2 },
    { id: 'scatter', name: 'Scatter', tier: 'special', weight: 2 },
    { id: 'bot', name: 'Bot C8L', tier: 'high', weight: 4 },
    { id: 'villano', name: 'León Villano', tier: 'high', weight: 3 },
    { id: 'c8l', name: 'C8L Logo', tier: 'high', weight: 3 },
    { id: 'corazon', name: 'Corazón Dorado', tier: 'medium', weight: 6 },
    { id: 'micro', name: 'Micrófono', tier: 'medium', weight: 6 },
    { id: 'corona', name: 'Corona', tier: 'medium', weight: 7 },
    { id: 'estrella', name: 'Estrella', tier: 'low', weight: 8 },
    { id: 'nota', name: 'Nota Musical', tier: 'low', weight: 9 },
];

const SYMBOL_URLS = {
    leon: P+'golden%20lion%20head%20mascot%2C%20majestic%20golden%20mane%2C%20fierce%20eyes'+STYLE+SP+'800',
    wild: P+'red%20heart%20with%20golden%20angel%20wings%20and%20fire%2C%20wild%20symbol'+STYLE+SP+'801',
    scatter: P+'golden%20lion%20king%20wearing%20jeweled%20crown%2C%20scatter%20symbol'+STYLE+SP+'802',
    bot: P+'cute%20blue%20robot%20chatbot%20mascot%2C%20glowing%20LED%20eyes%2C%20blue%20metallic%20with%20gold'+STYLE+SP+'803',
    villano: P+'evil%20dark%20lion%20head%2C%20red%20glowing%20eyes%2C%20dark%20mane%2C%20villain'+STYLE+SP+'804',
    c8l: P+'golden%20shield%20emblem%20with%20text%20C8L%2C%20crown%20on%20top%2C%20baroque%20gold'+STYLE+SP+'805',
    corazon: P+'golden%20heart%20with%20small%20angel%20wings%2C%20glowing%20gold%20and%20red'+STYLE+SP+'806',
    micro: P+'retro%20studio%20microphone%2C%20chrome%20silver%20and%20gold%20vintage%20style'+STYLE+SP+'807',
    corona: P+'shining%20golden%20crown%20with%20jewels%2C%20rubies%20emeralds%20diamonds'+STYLE+SP+'808',
    estrella: P+'golden%20star%20with%20sparkles%2C%20five%20pointed%20shining%20star'+STYLE+SP+'809',
    nota: P+'neon%20purple%20musical%20note%2C%20glowing%20treble%20clef%2C%20music%20symbol'+STYLE+SP+'810',
};


// ============================================================
// PAYTABLE & PAYLINES
// ============================================================
const PAYTABLE = {
    leon:{5:500,4:100,3:25}, wild:{5:1000,4:200,3:50}, scatter:{5:100,4:20,3:5},
    bot:{5:80,4:20,3:8}, villano:{5:60,4:18,3:6}, c8l:{5:150,4:40,3:12},
    corazon:{5:40,4:12,3:4}, micro:{5:35,4:10,3:3}, corona:{5:30,4:8,3:3},
    estrella:{5:20,4:6,3:2}, nota:{5:15,4:5,3:2},
};
const PAYLINES = [
    [1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],
    [0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,0],
    [2,1,1,1,2],[1,0,1,2,1],[1,2,1,0,1],[0,0,1,0,0],[2,2,1,2,2],
    [0,1,0,1,0],[2,1,2,1,2],[1,0,1,0,1],[1,2,1,2,1],[0,1,2,2,1]
];

// ============================================================
// STATE
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
// PIXI APP
// ============================================================
let app, reelContainer, symbolTextures = {}, uiTexts = {};
let reels = [];

async function init() {
    app = new PIXI.Application({
        view: document.getElementById('game-canvas'),
        resizeTo: window,
        backgroundColor: 0x080500,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
    });
    await loadTextures();
    buildScene();
    app.ticker.add(gameLoop);
    window.addEventListener('resize', () => { buildScene(); });
}

async function loadTextures() {
    const ids = Object.keys(SYMBOL_URLS);
    const promises = ids.map(async id => {
        try {
            const tex = await PIXI.Assets.load(SYMBOL_URLS[id]);
            symbolTextures[id] = tex;
        } catch(e) {
            symbolTextures[id] = makeFallback(id);
        }
    });
    await Promise.allSettled(promises);
}

function makeFallback(id) {
    const colors = {leon:0xd4a017,wild:0xc0392b,scatter:0x9b59b6,bot:0x2980b9,villano:0x2c3e50,c8l:0xd4a017,corazon:0xe74c3c,micro:0x95a5a6,corona:0xf39c12,estrella:0xf1c40f,nota:0x8e44ad};
    const g = new PIXI.Graphics();
    g.beginFill(colors[id]||0x333);
    g.drawRoundedRect(0,0,100,100,16);
    g.endFill();
    // Add text
    const t = new PIXI.Text(id.substring(0,3).toUpperCase(), {fontSize:24,fill:0xffffff,fontWeight:'900'});
    t.anchor.set(0.5); t.x=50; t.y=50; g.addChild(t);
    return app.renderer.generateTexture(g);
}


// ============================================================
// BUILD SCENE
// ============================================================
function buildScene() {
    app.stage.removeChildren();
    reels = [];
    uiTexts = {};
    const sw = app.screen.width;
    const sh = app.screen.height;

    // Background
    const bg = new PIXI.Graphics();
    bg.beginFill(0x080500);
    bg.drawRect(0,0,sw,sh);
    bg.endFill();
    app.stage.addChild(bg);

    // Gold radial glow
    const glow = new PIXI.Graphics();
    glow.beginFill(0x1a1200,0.4);
    glow.drawEllipse(sw/2,sh*0.15,sw*0.5,sh*0.2);
    glow.endFill();
    app.stage.addChild(glow);

    // Title
    const title = new PIXI.Text('C8L LEGENDS', {fontFamily:'serif',fontSize:Math.min(sw*0.06,28),fill:0xf5d061,fontWeight:'900',letterSpacing:4});
    title.anchor.set(0.5,0); title.x=sw/2; title.y=sh*0.02;
    app.stage.addChild(title);

    const sub = new PIXI.Text('EL LEÓN DORADO', {fontFamily:'monospace',fontSize:Math.min(sw*0.025,11),fill:0xd4a017,letterSpacing:3});
    sub.anchor.set(0.5,0); sub.x=sw/2; sub.y=title.y+title.height+2;
    app.stage.addChild(sub);

    // Jackpot
    const jpL = new PIXI.Text('JACKPOT GLOBAL', {fontFamily:'monospace',fontSize:Math.min(sw*0.02,10),fill:0xd4a017,letterSpacing:3});
    jpL.anchor.set(0.5,0); jpL.x=sw/2; jpL.y=sh*0.09;
    app.stage.addChild(jpL);

    const jp = new PIXI.Text(fmt(state.jackpot), {fontFamily:'monospace',fontSize:Math.min(sw*0.065,30),fill:0xf5d061,fontWeight:'900'});
    jp.anchor.set(0.5,0); jp.x=sw/2; jp.y=sh*0.11;
    app.stage.addChild(jp);
    uiTexts.jackpot = jp;

    // Build reels
    buildReels(sw, sh);
    // Build controls
    buildControls(sw, sh);
}


// ============================================================
// REELS
// ============================================================
function buildReels(sw, sh) {
    const symSize = Math.min(Math.floor((sw*0.85)/CONFIG.REELS) - CONFIG.REEL_GAP, CONFIG.SYMBOL_SIZE);
    const reelW = symSize + CONFIG.REEL_GAP;
    const totalW = CONFIG.REELS * reelW;
    const reelH = symSize * CONFIG.ROWS + CONFIG.REEL_GAP*(CONFIG.ROWS-1);
    const startX = (sw - totalW) / 2;
    const startY = sh * 0.2;

    // Frame (gold border)
    const frame = new PIXI.Graphics();
    frame.lineStyle(4, 0xd4a017);
    frame.beginFill(0x0a0800, 0.95);
    frame.drawRoundedRect(startX-14, startY-14, totalW+28, reelH+28, 14);
    frame.endFill();
    frame.lineStyle(2, 0xf5d061, 0.4);
    frame.drawRoundedRect(startX-18, startY-18, totalW+36, reelH+36, 16);
    app.stage.addChild(frame);

    // Mask
    const mask = new PIXI.Graphics();
    mask.beginFill(0xffffff);
    mask.drawRoundedRect(startX-6, startY-6, totalW+12, reelH+12, 10);
    mask.endFill();
    app.stage.addChild(mask);

    // Reels
    for (let i = 0; i < CONFIG.REELS; i++) {
        const rc = new PIXI.Container();
        rc.mask = mask;
        rc.x = startX + i * reelW;
        rc.y = startY;

        const symbols = [];
        for (let j = -1; j <= CONFIG.ROWS; j++) {
            const sid = randSymbol();
            const sprite = new PIXI.Sprite(symbolTextures[sid]);
            sprite.width = symSize; sprite.height = symSize;
            sprite.x = 0;
            sprite.y = j * (symSize + CONFIG.REEL_GAP);
            sprite.symbolId = sid;
            rc.addChild(sprite);
            symbols.push(sprite);
        }
        app.stage.addChild(rc);
        reels.push({ container:rc, symbols, speed:0, spinning:false, stopping:false, targetGrid:null, symSize, bouncePhase:0 });

        // Separator line
        if (i < CONFIG.REELS-1) {
            const sep = new PIXI.Graphics();
            sep.lineStyle(1, 0xd4a017, 0.3);
            sep.moveTo(startX+(i+1)*reelW - CONFIG.REEL_GAP/2, startY);
            sep.lineTo(startX+(i+1)*reelW - CONFIG.REEL_GAP/2, startY+reelH);
            app.stage.addChild(sep);
        }
    }

    // Payline indicator (center)
    const pline = new PIXI.Graphics();
    pline.lineStyle(2, 0xf5d061, 0.3);
    pline.moveTo(startX-10, startY+reelH/2);
    pline.lineTo(startX+totalW+10, startY+reelH/2);
    app.stage.addChild(pline);
}


// ============================================================
// CONTROLS
// ============================================================
function buildControls(sw, sh) {
    const ctrlY = sh * 0.78;
    const btnY = sh * 0.86;

    // Info row
    const infos = [
        {label:'LÍNEAS',val:'20',x:sw*0.12},
        {label:'APUESTA',val:fmt(state.betPerLine),x:sw*0.32},
        {label:'TOTAL',val:fmt(state.totalBet),x:sw*0.52},
        {label:'GANANCIA',val:fmt(state.lastWin),x:sw*0.78},
    ];
    infos.forEach(i => {
        const l = new PIXI.Text(i.label,{fontFamily:'monospace',fontSize:8,fill:0xd4a017,letterSpacing:1});
        l.anchor.set(0.5,0); l.x=i.x; l.y=ctrlY;
        app.stage.addChild(l);
        const v = new PIXI.Text(i.val,{fontFamily:'monospace',fontSize:14,fill:0xf5f0e8,fontWeight:'700'});
        v.anchor.set(0.5,0); v.x=i.x; v.y=ctrlY+13;
        app.stage.addChild(v);
        uiTexts[i.label] = v;
    });

    // Spin button
    const spinG = new PIXI.Graphics();
    spinG.beginFill(0xd4a017);
    spinG.drawCircle(0,0,32);
    spinG.endFill();
    spinG.lineStyle(3,0xf5d061);
    spinG.drawCircle(0,0,32);
    spinG.x = sw/2; spinG.y = btnY;
    spinG.eventMode = 'static'; spinG.cursor = 'pointer';
    spinG.on('pointerdown', spin);
    app.stage.addChild(spinG);

    const sLabel = new PIXI.Text('GIRAR',{fontFamily:'monospace',fontSize:11,fill:0x0a0a0a,fontWeight:'900'});
    sLabel.anchor.set(0.5); sLabel.x=sw/2; sLabel.y=btnY;
    app.stage.addChild(sLabel);
    uiTexts.spinLabel = sLabel;

    // +/- buttons
    makeBtn('-', sw/2-80, btnY, () => { if(state.betIndex>0){state.betIndex--;updateUI();} });
    makeBtn('+', sw/2+80, btnY, () => { if(state.betIndex<CONFIG.BET_LEVELS.length-1){state.betIndex++;updateUI();} });

    // Bottom status
    const stY = sh - 25;
    const cr = new PIXI.Text('🪙 '+fmt(state.credits),{fontFamily:'monospace',fontSize:11,fill:0xf5f0e8});
    cr.x=16; cr.y=stY; app.stage.addChild(cr); uiTexts.credits=cr;
    const ch = new PIXI.Text('💎 '+fmt(state.chips),{fontFamily:'monospace',fontSize:11,fill:0xf5f0e8});
    ch.anchor.set(0.5,0); ch.x=sw/2; ch.y=stY; app.stage.addChild(ch); uiTexts.chips=ch;
    const vp = new PIXI.Text('⭐ VIP '+state.vipLevel,{fontFamily:'monospace',fontSize:11,fill:0xf5f0e8});
    vp.anchor.set(1,0); vp.x=sw-16; vp.y=stY; app.stage.addChild(vp); uiTexts.vip=vp;
}

function makeBtn(label, x, y, onClick) {
    const g = new PIXI.Graphics();
    g.beginFill(0x1a1200); g.lineStyle(2,0x8b6914); g.drawCircle(0,0,20); g.endFill();
    g.x=x; g.y=y; g.eventMode='static'; g.cursor='pointer'; g.on('pointerdown',onClick);
    const t = new PIXI.Text(label,{fontSize:18,fill:0xf5d061,fontWeight:'900'});
    t.anchor.set(0.5); g.addChild(t);
    app.stage.addChild(g);
}


// ============================================================
// SPIN LOGIC WITH 3-STATE ANIMATION
// ============================================================
function spin() {
    if (state.spinning) return;
    if (state.credits < state.totalBet && state.freeSpins <= 0) return;

    state.spinning = true;
    state.lastWin = 0;
    if (state.freeSpins > 0) state.freeSpins--;
    else state.credits -= state.totalBet;
    updateUI();

    const result = generateResult();

    // STATE 1→2: Start spinning (accelerate)
    reels.forEach((reel, i) => {
        reel.spinning = true;
        reel.stopping = false;
        reel.speed = 0;
        reel.targetGrid = result.grid[i];
        reel.bouncePhase = 0;

        // Schedule stop for each reel (cascading)
        setTimeout(() => {
            reel.stopping = true;
        }, 600 + i * 250);
    });

    // After all stopped, process
    setTimeout(() => {
        state.spinning = false;
        processResult(result);
    }, 600 + (CONFIG.REELS-1)*250 + 500);
}

// ============================================================
// GAME LOOP — Reel Animation (3 states)
// ============================================================
function gameLoop(delta) {
    // Jackpot tick
    if (Math.random() < 0.005) { state.jackpot += Math.floor(Math.random()*100)+10; if(uiTexts.jackpot) uiTexts.jackpot.text=fmt(state.jackpot); }

    reels.forEach(reel => {
        if (!reel.spinning && !reel.stopping) return;

        const symH = reel.symSize + CONFIG.REEL_GAP;

        if (reel.spinning && !reel.stopping) {
            // STATE 2: Accelerate + stretch (motion blur effect)
            reel.speed = Math.min(reel.speed + CONFIG.SPIN_ACCEL * delta, CONFIG.SPIN_SPEED_MAX);
            reel.symbols.forEach(s => {
                s.y += reel.speed * delta;
                // Stretch vertically during spin (motion distortion)
                s.scale.y = 1 + (reel.speed / CONFIG.SPIN_SPEED_MAX) * 0.15;
                s.scale.x = 1 - (reel.speed / CONFIG.SPIN_SPEED_MAX) * 0.05;
                // Wrap around
                if (s.y > symH * CONFIG.ROWS) {
                    s.y -= symH * (CONFIG.ROWS + 2);
                    const newSym = randSymbol();
                    s.texture = symbolTextures[newSym];
                    s.symbolId = newSym;
                }
            });
        } else if (reel.stopping) {
            // STATE 2→3: Decelerate
            reel.speed *= CONFIG.SPIN_DECEL;
            if (reel.speed < 1) {
                // STATE 3: IMPACT — Snap to final position + squash
                reel.spinning = false;
                reel.stopping = false;
                reel.speed = 0;

                // Set final symbols
                if (reel.targetGrid) {
                    reel.targetGrid.forEach((symId, row) => {
                        const sprite = reel.symbols[row + 1]; // +1 for buffer
                        if (sprite) {
                            sprite.texture = symbolTextures[symId];
                            sprite.symbolId = symId;
                            sprite.y = row * symH;
                            // SQUASH on impact
                            sprite.scale.y = 0.85;
                            sprite.scale.x = 1.12;
                        }
                    });
                }
                // Bounce back to normal (elastic)
                reel.bouncePhase = 1;
            } else {
                reel.symbols.forEach(s => {
                    s.y += reel.speed * delta;
                    s.scale.y = 1 + (reel.speed / CONFIG.SPIN_SPEED_MAX) * 0.1;
                    s.scale.x = 1 - (reel.speed / CONFIG.SPIN_SPEED_MAX) * 0.03;
                    if (s.y > symH * CONFIG.ROWS) {
                        s.y -= symH * (CONFIG.ROWS + 2);
                        const ns = randSymbol();
                        s.texture = symbolTextures[ns]; s.symbolId = ns;
                    }
                });
            }
        }

        // Bounce recovery (State 3 → State 1)
        if (reel.bouncePhase > 0) {
            reel.bouncePhase -= 0.06 * delta;
            if (reel.bouncePhase <= 0) {
                reel.bouncePhase = 0;
                reel.symbols.forEach(s => { s.scale.y = 1; s.scale.x = 1; });
            } else {
                const t = reel.bouncePhase;
                const bounce = Math.sin(t * Math.PI * 3) * t * 0.15;
                reel.symbols.forEach(s => {
                    s.scale.y = 1 + bounce;
                    s.scale.x = 1 - bounce * 0.3;
                });
            }
        }
    });
}


// ============================================================
// RESULT GENERATION & WIN LOGIC
// ============================================================
function generateResult() {
    const grid = [];
    for (let r = 0; r < CONFIG.REELS; r++) {
        const col = [];
        for (let row = 0; row < CONFIG.ROWS; row++) col.push(randSymbol());
        grid.push(col);
    }
    const wins = evalWins(grid);
    let totalWin = wins.reduce((s,w)=>s+w.win, 0);
    let scatterCount = 0;
    for(let r=0;r<5;r++) for(let row=0;row<3;row++) if(grid[r][row]==='scatter') scatterCount++;
    let freeSpinsAwarded = scatterCount>=3 ? (scatterCount>=5?25:scatterCount>=4?15:10) : 0;
    let modoRugido = totalWin>0 && Math.random()<0.05;
    let multiplier = modoRugido ? [2,3,5,8,10][Math.floor(Math.random()*5)] : 1;
    totalWin *= multiplier;
    if(Math.random()<0.0001){totalWin+=state.jackpot;state.jackpot=1000000;}
    state.jackpot += Math.floor(state.totalBet*0.01);
    return {grid,wins,totalWin,scatterCount,freeSpinsAwarded,modoRugido,multiplier};
}

function evalWins(grid) {
    const wins=[];
    for(let li=0;li<CONFIG.LINES;li++){
        const pl=PAYLINES[li];
        const line=pl.map((row,reel)=>grid[reel][row]);
        let target=null;
        for(const s of line){if(s!=='wild'&&s!=='scatter'){target=s;break;}}
        if(!target){if(line.every(s=>s==='wild'))target='wild';else continue;}
        let count=0;
        for(let i=0;i<5;i++){if(line[i]===target||line[i]==='wild')count++;else break;}
        if(count>=3&&PAYTABLE[target]){const m=PAYTABLE[target][count]||0;if(m>0)wins.push({symbol:target,count,win:m*state.betPerLine,line:li+1});}
    }
    return wins;
}

function processResult(result) {
    state.lastWin = result.totalWin;
    if(result.totalWin>0){
        state.credits+=result.totalWin;
        const bm=result.totalWin/state.totalBet;
        if(bm>=20){showBigWin(result.totalWin);playWinMusic();}
        else showSmallWin(result.totalWin);
        spawnCoins(Math.min(Math.floor(bm*3),40));
    }
    if(result.freeSpinsAwarded>0){state.freeSpins+=result.freeSpinsAwarded;playWinMusic();}
    if(result.modoRugido){state.multiplier=result.multiplier;playWinMusic();}
    else state.multiplier=1;
    updateUI();
}

function randSymbol(){
    const total=SYMBOLS_DEF.reduce((s,d)=>s+d.weight,0);
    let r=Math.random()*total;
    for(const d of SYMBOLS_DEF){r-=d.weight;if(r<=0)return d.id;}
    return SYMBOLS_DEF[SYMBOLS_DEF.length-1].id;
}


// ============================================================
// WIN EFFECTS
// ============================================================
function showSmallWin(amount) {
    const sw=app.screen.width, sh=app.screen.height;
    const t = new PIXI.Text('+'+fmt(amount),{fontFamily:'monospace',fontSize:26,fill:0xf5d061,fontWeight:'900',stroke:0x000000,strokeThickness:3});
    t.anchor.set(0.5); t.x=sw/2; t.y=sh*0.5; t.alpha=1;
    app.stage.addChild(t);
    let time=0;
    const tick=()=>{time+=app.ticker.deltaMS;t.y-=1;t.alpha=1-time/1500;if(time>1500){app.stage.removeChild(t);app.ticker.remove(tick);t.destroy();}};
    app.ticker.add(tick);
}
function showBigWin(amount) {
    const sw=app.screen.width, sh=app.screen.height;
    const bg=new PIXI.Graphics();bg.beginFill(0,0.8);bg.drawRect(0,0,sw,sh);bg.endFill();app.stage.addChild(bg);
    const title=new PIXI.Text('¡GRAN GANANCIA!',{fontFamily:'serif',fontSize:26,fill:0xf5d061,fontWeight:'900'});
    title.anchor.set(0.5);title.x=sw/2;title.y=sh*0.38;app.stage.addChild(title);
    const amt=new PIXI.Text(fmt(amount),{fontFamily:'monospace',fontSize:40,fill:0xf5d061,fontWeight:'900',stroke:0x8b6914,strokeThickness:4});
    amt.anchor.set(0.5);amt.x=sw/2;amt.y=sh*0.5;amt.scale.set(0);app.stage.addChild(amt);
    let time=0;
    const tick=()=>{time+=app.ticker.deltaMS;const p=Math.min(time/400,1);amt.scale.set(p+(1-p)*Math.sin(p*Math.PI)*0.3);if(time>3000){app.stage.removeChild(bg);app.stage.removeChild(title);app.stage.removeChild(amt);app.ticker.remove(tick);bg.destroy();title.destroy();amt.destroy();}};
    app.ticker.add(tick);
}
function spawnCoins(count) {
    for(let i=0;i<count;i++){setTimeout(()=>{const c=new PIXI.Text(['🪙','💰','⭐','✨'][Math.floor(Math.random()*4)],{fontSize:18+Math.random()*14});c.x=Math.random()*app.screen.width;c.y=-20;app.stage.addChild(c);const spd=2+Math.random()*4;const tick=()=>{c.y+=spd;c.rotation+=0.04;if(c.y>app.screen.height+30){app.stage.removeChild(c);app.ticker.remove(tick);c.destroy();}};app.ticker.add(tick);},i*40);}
}

// ============================================================
// UI UPDATE
// ============================================================
function updateUI() {
    if(uiTexts.jackpot)uiTexts.jackpot.text=fmt(state.jackpot);
    if(uiTexts.credits)uiTexts.credits.text='🪙 '+fmt(state.credits);
    if(uiTexts.chips)uiTexts.chips.text='💎 '+fmt(state.chips);
    if(uiTexts['APUESTA'])uiTexts['APUESTA'].text=fmt(state.betPerLine);
    if(uiTexts['TOTAL'])uiTexts['TOTAL'].text=fmt(state.totalBet);
    if(uiTexts['GANANCIA'])uiTexts['GANANCIA'].text=fmt(state.lastWin);
}
function fmt(n){return n.toLocaleString('es-ES');}

// ============================================================
// AUDIO SYSTEM
// ============================================================
const AUDIO = {
    bg: null, // Background music
    win: null, // Win music
    bgTracks: ['assets/audio/bg1.mp3', 'assets/audio/bg2.mp3'],
    winTracks: ['assets/audio/win1.mp3', 'assets/audio/win2.mp3'],
    currentBg: 0,
    muted: false,
    initialized: false,
};

function initAudio() {
    if (AUDIO.initialized) return;
    AUDIO.initialized = true;
    AUDIO.bg = new Audio(AUDIO.bgTracks[0]);
    AUDIO.bg.loop = true;
    AUDIO.bg.volume = 0.3;
    AUDIO.bg.play().catch(() => {});
    // When track ends, switch to next
    AUDIO.bg.addEventListener('ended', () => {
        AUDIO.currentBg = (AUDIO.currentBg + 1) % AUDIO.bgTracks.length;
        AUDIO.bg.src = AUDIO.bgTracks[AUDIO.currentBg];
        AUDIO.bg.play().catch(() => {});
    });
}

function playWinMusic() {
    if (AUDIO.muted) return;
    const track = AUDIO.winTracks[Math.floor(Math.random() * AUDIO.winTracks.length)];
    if (AUDIO.win) { AUDIO.win.pause(); AUDIO.win.currentTime = 0; }
    AUDIO.win = new Audio(track);
    AUDIO.win.volume = 0.5;
    AUDIO.win.play().catch(() => {});
    // Fade bg
    if (AUDIO.bg) AUDIO.bg.volume = 0.1;
    AUDIO.win.addEventListener('ended', () => { if (AUDIO.bg) AUDIO.bg.volume = 0.3; });
}

function toggleMute() {
    AUDIO.muted = !AUDIO.muted;
    if (AUDIO.bg) AUDIO.bg.muted = AUDIO.muted;
    if (AUDIO.win) AUDIO.win.muted = AUDIO.muted;
}

// ============================================================
// START
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    init().then(() => console.log('🎰 C8L Casino — PixiJS Engine v2 Loaded'));
    // Init audio on first user interaction
    document.addEventListener('pointerdown', initAudio, { once: true });
    document.addEventListener('touchstart', initAudio, { once: true });
});
