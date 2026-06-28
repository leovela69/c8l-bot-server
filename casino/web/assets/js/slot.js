/**
 * C8L CASINO - EL LEÓN DORADO - PixiJS Premium Slot v3
 * Fixed: proper grid alignment, mask clipping, symbol sizing
 */
(function(){
'use strict';

// ===== APP INIT =====
const app = new PIXI.Application({
    resizeTo: window, backgroundColor: 0x050505,
    antialias: true, resolution: window.devicePixelRatio || 1, autoDensity: true
});
document.body.appendChild(app.view);
const W = app.screen.width, H = app.screen.height;

// ===== CONFIG =====
const REELS = 5, ROWS = 3;
const BET_LEVELS = [10,25,50,100,250,500,1000,2500,5000];

const SYMS = [
    {id:'leon',   label:'🦁', type:'icon',   color:0xd4a017, w:3},
    {id:'wild',   label:'W',  type:'letter', color:0xcc0000, w:2},
    {id:'scatter',label:'★',  type:'letter', color:0xf1c40f, w:2, sub:'SCATTER'},
    {id:'c8l',    label:'😊', type:'icon',   color:0xd4a017, w:3, sub:'C8L'},
    {id:'A',      label:'A',  type:'letter', color:0xcc0000, w:5},
    {id:'K',      label:'K',  type:'letter', color:0x2ecc71, w:6},
    {id:'Q',      label:'Q',  type:'letter', color:0x9b59b6, w:7},
    {id:'J',      label:'J',  type:'letter', color:0x1abc9c, w:8},
    {id:'10',     label:'10', type:'letter', color:0x2ecc71, w:9},
];
const PT = {
    leon:{5:500,4:100,3:25}, wild:{5:1000,4:200,3:50},
    scatter:{5:100,4:20,3:5}, c8l:{5:150,4:40,3:12},
    A:{5:50,4:15,3:5}, K:{5:40,4:12,3:4},
    Q:{5:30,4:10,3:3}, J:{5:20,4:8,3:2}, '10':{5:15,4:5,3:2}
};
const PL = [
    [1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],
    [0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,0],
    [2,1,1,1,2],[1,0,1,2,1],[1,2,1,0,1],[0,0,1,0,0],[2,2,1,2,2],
    [0,1,0,1,0],[2,1,2,1,2],[1,0,1,0,1],[1,2,1,2,1],[0,1,2,2,1]
];


// ===== STATE =====
let credits = 152445000, chips = 8250, betIdx = 4;
let lastWin = 0, jackpot = 48545707, spinning = false;
let multiplier = 1, freeSpins = 0, soundOn = true;
function bet(){ return BET_LEVELS[betIdx]; }
function totalBet(){ return bet() * 20; }
function fmt(n){ return n.toLocaleString('es-ES'); }
function rSym(){
    const t = SYMS.reduce((s,d)=>s+d.w, 0);
    let r = Math.random() * t;
    for(const d of SYMS){ r -= d.w; if(r <= 0) return d; }
    return SYMS[SYMS.length-1];
}

// ===== DIMENSIONS (calculated once) =====
const SYM_SIZE = Math.min(Math.floor((W * 0.62) / REELS), Math.floor((H * 0.38) / ROWS));
const GAP = 4;
const CELL = SYM_SIZE + GAP;
const GRID_W = REELS * CELL - GAP;
const GRID_H = ROWS * CELL - GAP;
const GRID_X = (W - GRID_W) / 2;
const GRID_Y = H * 0.27;
const FRAME_PAD = 12;


// ===== AUDIO (Web Audio API) =====
let audioCtx = null;
function initAudio(){ if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
function tone(f,dur,type,vol){
    if(!audioCtx||!soundOn)return;
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type=type||'sine'; o.frequency.value=f;
    g.gain.setValueAtTime(vol||0.1,audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur);
    o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime+dur);
}
function sfxSpin(){ tone(180,0.08,'square',0.06); }
function sfxStop(i){ tone(350+i*100, 0.12,'triangle',0.1); }
function sfxWin(){ [523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,0.2,'sine',0.12),i*80)); }
function sfxBigWin(){ [523,659,784,1047,1318].forEach((f,i)=>setTimeout(()=>tone(f,0.3,'sine',0.15),i*70)); }
document.addEventListener('pointerdown',()=>initAudio(),{once:true});

// ===== TEXTURES (all same size: 100x100, scaled later) =====
const tex = {};
SYMS.forEach(sym => {
    const c = new PIXI.Container();
    const bg = new PIXI.Graphics();
    bg.beginFill(0x0a0800);
    bg.lineStyle(3, sym.color, 0.7);
    bg.drawRoundedRect(0, 0, 100, 100, 10);
    bg.endFill();
    bg.beginFill(sym.color, 0.05);
    bg.drawRoundedRect(3, 3, 94, 94, 8);
    bg.endFill();
    c.addChild(bg);
    if(sym.type === 'letter'){
        const t = new PIXI.Text(sym.label, {
            fontFamily:'Georgia,serif', fontSize: sym.label.length>1?36:46,
            fill:sym.color, fontWeight:'bold', fontStyle:'italic'
        });
        t.anchor.set(0.5); t.x=50; t.y=sym.sub?44:50; c.addChild(t);
    } else {
        const t = new PIXI.Text(sym.label, {fontSize:42});
        t.anchor.set(0.5); t.x=50; t.y=sym.sub?44:50; c.addChild(t);
    }
    if(sym.sub){
        const s = new PIXI.Text(sym.sub, {fontFamily:'monospace',fontSize:9,fill:sym.color,fontWeight:'bold'});
        s.anchor.set(0.5); s.x=50; s.y=80; c.addChild(s);
    }
    tex[sym.id] = app.renderer.generateTexture(c);
    c.destroy({children:true});
});


// ===== DRAW BACKGROUND =====
const bgG = new PIXI.Graphics();
bgG.beginFill(0x050505); bgG.drawRect(0,0,W,H); bgG.endFill();
app.stage.addChild(bgG);

// Subtle glow behind reels
const glow = new PIXI.Graphics();
glow.beginFill(0x1a1200, 0.15);
glow.drawEllipse(W/2, GRID_Y + GRID_H/2, GRID_W*0.7, GRID_H*0.8);
glow.endFill();
app.stage.addChild(glow);

// ===== HEADER =====
// Menu (top-left)
const menuG = new PIXI.Graphics();
menuG.lineStyle(2, 0xd4a017);
for(let i=0;i<3;i++){ menuG.moveTo(20, 18+i*7); menuG.lineTo(42, 18+i*7); }
app.stage.addChild(menuG);

// Logo C8L (top-center)
const logoBox = new PIXI.Graphics();
logoBox.lineStyle(2, 0xd4a017);
logoBox.beginFill(0x0a0800);
logoBox.drawRoundedRect(W/2-24, 8, 48, 26, 5);
logoBox.endFill();
app.stage.addChild(logoBox);
const logoT = new PIXI.Text('C8L',{fontFamily:'serif',fontSize:14,fill:0xf5d061,fontWeight:'bold'});
logoT.anchor.set(0.5); logoT.x=W/2; logoT.y=21;
app.stage.addChild(logoT);

// Title
const titleT = new PIXI.Text('C8LLEGENDS',{fontFamily:'Georgia,serif',fontSize:Math.min(W*0.035,18),fill:0xd4a017,fontWeight:'bold',letterSpacing:2});
titleT.anchor.set(0.5,0); titleT.x=W/2; titleT.y=38;
app.stage.addChild(titleT);
const subT = new PIXI.Text('EL LEÓN DORADO',{fontFamily:'monospace',fontSize:8,fill:0x8b6914,letterSpacing:3});
subT.anchor.set(0.5,0); subT.x=W/2; subT.y=38+titleT.height+1;
app.stage.addChild(subT);

// Sound (top-right)
const sndT = new PIXI.Text('🔊',{fontSize:18});
sndT.anchor.set(0.5); sndT.x=W-30; sndT.y=22;
sndT.eventMode='static'; sndT.cursor='pointer';
sndT.on('pointerdown',()=>{soundOn=!soundOn; sndT.text=soundOn?'🔊':'🔇';});
app.stage.addChild(sndT);

// Jackpot
const jpLbl = new PIXI.Text('JACKPOT GLOBAL',{fontFamily:'monospace',fontSize:8,fill:0x8b6914,letterSpacing:2});
jpLbl.anchor.set(0.5,0); jpLbl.x=W/2; jpLbl.y=H*0.1;
app.stage.addChild(jpLbl);
const jpVal = new PIXI.Text(fmt(jackpot),{fontFamily:'Georgia,serif',fontSize:Math.min(W*0.055,28),fill:0xf5d061,fontWeight:'bold'});
jpVal.anchor.set(0.5,0); jpVal.x=W/2; jpVal.y=H*0.1+12;
app.stage.addChild(jpVal);


// ===== LAMPS =====
function drawLamp(x,y){
    const g=new PIXI.Graphics();
    g.beginFill(0xd4a017); g.moveTo(x,y); g.lineTo(x-5,y-16); g.lineTo(x+5,y-16); g.closePath(); g.endFill();
    g.beginFill(0xf5d061,0.12); g.drawCircle(x,y+6,16); g.endFill();
    g.beginFill(0xf5d061,0.5); g.drawCircle(x,y,2.5); g.endFill();
    return g;
}
app.stage.addChild(drawLamp(GRID_X - FRAME_PAD - 10, GRID_Y - 6));
app.stage.addChild(drawLamp(GRID_X + GRID_W + FRAME_PAD + 10, GRID_Y - 6));

// ===== PAYLINE DOTS =====
for(let i=0;i<7;i++){
    const d=new PIXI.Graphics();
    d.beginFill(i===0?0xf5d061:0x444444);
    d.drawCircle(GRID_X + (GRID_W/6)*i, GRID_Y - FRAME_PAD - 10, 3);
    d.endFill();
    app.stage.addChild(d);
}

// ===== FRAME (double border) =====
const frameO = new PIXI.Graphics();
frameO.lineStyle(1.5, 0xf5d061, 0.35);
frameO.drawRoundedRect(GRID_X-FRAME_PAD-4, GRID_Y-FRAME_PAD-4, GRID_W+FRAME_PAD*2+8, GRID_H+FRAME_PAD*2+8, 14);
app.stage.addChild(frameO);

const frameI = new PIXI.Graphics();
frameI.lineStyle(3, 0xd4a017, 0.85);
frameI.beginFill(0x040300, 0.95);
frameI.drawRoundedRect(GRID_X-FRAME_PAD, GRID_Y-FRAME_PAD, GRID_W+FRAME_PAD*2, GRID_H+FRAME_PAD*2, 10);
frameI.endFill();
app.stage.addChild(frameI);

// ===== SIDE INDICATORS =====
// Left: MULTI
const mBox = new PIXI.Graphics();
mBox.lineStyle(1.5,0x8b6914); mBox.drawRoundedRect(0,0,34,38,4);
mBox.x=GRID_X-FRAME_PAD-50; mBox.y=GRID_Y+GRID_H/2-19;
app.stage.addChild(mBox);
const mLbl = new PIXI.Text('MULTI',{fontFamily:'monospace',fontSize:6,fill:0x8b6914});
mLbl.anchor.set(0.5); mLbl.x=mBox.x+17; mLbl.y=mBox.y+10; app.stage.addChild(mLbl);
const mVal = new PIXI.Text('X1',{fontFamily:'monospace',fontSize:11,fill:0xf5d061,fontWeight:'bold'});
mVal.anchor.set(0.5); mVal.x=mBox.x+17; mVal.y=mBox.y+26; app.stage.addChild(mVal);

// Right: GIRO
const gBox = new PIXI.Graphics();
gBox.lineStyle(1.5,0x8b6914); gBox.drawRoundedRect(0,0,34,38,4);
gBox.x=GRID_X+GRID_W+FRAME_PAD+16; gBox.y=GRID_Y+GRID_H/2-19;
app.stage.addChild(gBox);
const gLbl = new PIXI.Text('GIRO',{fontFamily:'monospace',fontSize:6,fill:0x8b6914});
gLbl.anchor.set(0.5); gLbl.x=gBox.x+17; gLbl.y=gBox.y+10; app.stage.addChild(gLbl);
const gVal = new PIXI.Text('0',{fontFamily:'monospace',fontSize:11,fill:0xf5d061,fontWeight:'bold'});
gVal.anchor.set(0.5); gVal.x=gBox.x+17; gVal.y=gBox.y+26; app.stage.addChild(gVal);


// ===== REELS (CRITICAL: proper mask + fixed positions) =====
const reelContainer = new PIXI.Container();
app.stage.addChild(reelContainer);

// MASK: clips symbols to only show within the grid area
const reelMask = new PIXI.Graphics();
reelMask.beginFill(0xffffff);
reelMask.drawRect(GRID_X, GRID_Y, GRID_W, GRID_H);
reelMask.endFill();
app.stage.addChild(reelMask);
reelContainer.mask = reelMask;

// Create reel strips (each reel has ROWS+2 symbols for scrolling buffer)
const reels = [];
const STRIP_LEN = ROWS + 2; // extra symbols above and below for smooth scroll

for(let col = 0; col < REELS; col++){
    const strips = [];
    for(let row = 0; row < STRIP_LEN; row++){
        const sym = rSym();
        const sp = new PIXI.Sprite(tex[sym.id]);
        sp.width = SYM_SIZE;
        sp.height = SYM_SIZE;
        sp.x = GRID_X + col * CELL;
        sp.y = GRID_Y + (row - 1) * CELL; // -1 so first visible row starts at row index 1
        sp.symData = sym;
        reelContainer.addChild(sp);
        strips.push(sp);
    }
    reels.push({ strips, speed: 0, spinning: false, stopping: false, target: null, bounce: 0 });
}

// Center payline (orange horizontal line)
const plLine = new PIXI.Graphics();
plLine.lineStyle(2, 0xf5a623, 0.4);
const centerY = GRID_Y + Math.floor(ROWS/2) * CELL + SYM_SIZE/2;
plLine.moveTo(GRID_X - 6, centerY);
plLine.lineTo(GRID_X + GRID_W + 6, centerY);
app.stage.addChild(plLine);
// Small arrows
const arrL = new PIXI.Graphics();
arrL.beginFill(0xf5a623);
arrL.moveTo(GRID_X-8,centerY); arrL.lineTo(GRID_X-2,centerY-4); arrL.lineTo(GRID_X-2,centerY+4); arrL.closePath(); arrL.endFill();
app.stage.addChild(arrL);
const arrR = new PIXI.Graphics();
arrR.beginFill(0xf5a623);
arrR.moveTo(GRID_X+GRID_W+8,centerY); arrR.lineTo(GRID_X+GRID_W+2,centerY-4); arrR.lineTo(GRID_X+GRID_W+2,centerY+4); arrR.closePath(); arrR.endFill();
app.stage.addChild(arrR);


// ===== INFO BAR =====
const infoY = GRID_Y + GRID_H + FRAME_PAD + 16;
const infoItems = [
    {l:'LINEAS',v:'20',   x:GRID_X + GRID_W*0.1},
    {l:'APUESTA',v:fmt(bet()), x:GRID_X + GRID_W*0.33},
    {l:'TOTAL',v:fmt(totalBet()), x:GRID_X + GRID_W*0.58},
    {l:'GANANCIA',v:'0',  x:GRID_X + GRID_W*0.85}
];
const infoVals = {};
infoItems.forEach(o => {
    const lbl = new PIXI.Text(o.l,{fontFamily:'monospace',fontSize:8,fill:0x8b6914,letterSpacing:1});
    lbl.anchor.set(0.5,0); lbl.x=o.x; lbl.y=infoY; app.stage.addChild(lbl);
    const val = new PIXI.Text(o.v,{fontFamily:'monospace',fontSize:13,fill:0xf5f0e8,fontWeight:'bold'});
    val.anchor.set(0.5,0); val.x=o.x; val.y=infoY+12; app.stage.addChild(val);
    infoVals[o.l] = val;
});

// ===== CONTROLS =====
const ctrlY = H * 0.86;
// Spin button
const spinBg = new PIXI.Graphics();
spinBg.beginFill(0xd4a017); spinBg.drawCircle(0,0,30); spinBg.endFill();
spinBg.lineStyle(3,0xf5d061); spinBg.drawCircle(0,0,30);
spinBg.beginFill(0xf5d061,0.25); spinBg.drawCircle(0,-7,12); spinBg.endFill();
spinBg.x=W/2; spinBg.y=ctrlY; spinBg.eventMode='static'; spinBg.cursor='pointer';
spinBg.on('pointerdown', doSpin);
app.stage.addChild(spinBg);
const spinIco = new PIXI.Text('↻',{fontSize:18,fill:0x0a0800,fontWeight:'bold'});
spinIco.anchor.set(0.5); spinIco.x=W/2; spinIco.y=ctrlY-3; app.stage.addChild(spinIco);
const spinLbl = new PIXI.Text('GIRAR',{fontFamily:'monospace',fontSize:7,fill:0x0a0800,fontWeight:'bold'});
spinLbl.anchor.set(0.5); spinLbl.x=W/2; spinLbl.y=ctrlY+12; app.stage.addChild(spinLbl);

// Bet +/-
function mkBtn(label, x, fn){
    const g=new PIXI.Graphics();
    g.lineStyle(2,0x8b6914); g.beginFill(0x1a1200); g.drawRoundedRect(-18,-18,36,36,6); g.endFill();
    g.x=x; g.y=ctrlY; g.eventMode='static'; g.cursor='pointer'; g.on('pointerdown',fn);
    const t=new PIXI.Text(label,{fontSize:18,fill:0xf5d061,fontWeight:'bold'});
    t.anchor.set(0.5); g.addChild(t); app.stage.addChild(g);
}
mkBtn('−', W/2-75, ()=>{if(betIdx>0&&!spinning){betIdx--;upd();}});
mkBtn('+', W/2+75, ()=>{if(betIdx<BET_LEVELS.length-1&&!spinning){betIdx++;upd();}});

// Footer
const credT = new PIXI.Text('🪙 '+fmt(credits),{fontFamily:'monospace',fontSize:11,fill:0xf5f0e8});
credT.x=12; credT.y=H-22; app.stage.addChild(credT);
const chipT = new PIXI.Text('💎 '+fmt(chips),{fontFamily:'monospace',fontSize:11,fill:0xf5f0e8});
chipT.anchor.set(0.5,0); chipT.x=W/2; chipT.y=H-22; app.stage.addChild(chipT);
const vipT = new PIXI.Text('⭐ VIP 10',{fontFamily:'monospace',fontSize:11,fill:0xf5f0e8});
vipT.anchor.set(1,0); vipT.x=W-12; vipT.y=H-22; app.stage.addChild(vipT);


// ===== PARTICLES =====
const particles = [];
function addParticle(){
    const p = new PIXI.Text('✦',{fontSize:5+Math.random()*6,fill:0xf5d061});
    p.alpha = 0.15+Math.random()*0.3; p.x=Math.random()*W; p.y=Math.random()*H;
    p.vx=(Math.random()-0.5)*0.2; p.vy=-0.15-Math.random()*0.2; p.life=300+Math.random()*200;
    app.stage.addChild(p); particles.push(p);
}
for(let i=0;i<6;i++) addParticle();

// ===== UPDATE DISPLAY =====
function upd(){
    infoVals['APUESTA'].text = fmt(bet());
    infoVals['TOTAL'].text = fmt(totalBet());
    infoVals['GANANCIA'].text = fmt(lastWin);
    credT.text = '🪙 ' + fmt(credits);
    jpVal.text = fmt(jackpot);
    mVal.text = 'X' + multiplier;
    gVal.text = freeSpins > 0 ? freeSpins.toString() : '0';
}

// ===== SPIN LOGIC =====
function doSpin(){
    if(spinning) return;
    if(credits < totalBet() && freeSpins <= 0) return;
    initAudio(); spinning = true; lastWin = 0;
    if(freeSpins > 0){ freeSpins--; }
    else { credits -= totalBet(); jackpot += Math.floor(totalBet()*0.01); }
    upd(); sfxSpin();

    // Generate target grid
    const grid = [];
    for(let c=0; c<REELS; c++){
        const col=[]; for(let r=0;r<ROWS;r++) col.push(rSym()); grid.push(col);
    }

    // Start each reel with delay
    reels.forEach((rl,i) => {
        rl.spinning = true; rl.stopping = false;
        rl.speed = 0; rl.target = grid[i]; rl.bounce = 0;
        setTimeout(()=>{ rl.stopping = true; }, 350 + i*160);
    });

    // Evaluate after all reels stop
    const evalTime = 350 + (REELS-1)*160 + 400;
    setTimeout(()=>{
        spinning = false;
        let tw = 0;
        // Check paylines
        for(let li=0;li<20;li++){
            const line = PL[li].map((row,c)=>grid[c][row]);
            let tg=null;
            for(const s of line){ if(s.id!=='wild'&&s.id!=='scatter'){tg=s.id;break;} }
            if(!tg){ if(line.every(s=>s.id==='wild'))tg='wild'; else continue; }
            let cnt=0;
            for(const s of line){ if(s.id===tg||s.id==='wild')cnt++; else break; }
            if(cnt>=3&&PT[tg]){ const m=PT[tg][cnt]||0; if(m>0)tw+=m*bet(); }
        }
        // Scatter
        let sc=0;
        for(let c=0;c<REELS;c++) for(let r=0;r<ROWS;r++) if(grid[c][r].id==='scatter') sc++;
        if(sc>=3){ freeSpins+=sc>=5?25:sc>=4?15:10; multiplier=2; tw+=[0,0,0,5,20,100][sc]*totalBet(); }
        // Modo Rugido
        if(tw>0&&Math.random()<0.05){ const rm=[2,3,5,8,10][Math.floor(Math.random()*5)]; tw*=rm; multiplier=rm; }
        // Jackpot
        if(Math.random()<0.0001&&freeSpins<=0){ tw+=jackpot; jackpot=1000000; sfxBigWin(); }
        if(tw>0){ credits+=tw; lastWin=tw; winFx(tw); tw>=totalBet()*10?sfxBigWin():sfxWin(); }
        upd();
        if(freeSpins>0) setTimeout(doSpin,1200); else { multiplier=1; upd(); }
    }, evalTime);
}


// ===== REEL ANIMATION (FIXED: proper Y positioning and wrapping) =====
app.ticker.add((delta) => {
    // Jackpot ticker
    if(Math.random()<0.004){ jackpot+=Math.floor(Math.random()*60)+10; jpVal.text=fmt(jackpot); }

    // Particles
    for(let i=particles.length-1;i>=0;i--){
        const p=particles[i]; p.x+=p.vx*delta; p.y+=p.vy*delta; p.life-=delta;
        if(p.life<=0){ app.stage.removeChild(p); p.destroy(); particles.splice(i,1); addParticle(); }
    }

    // Reel animation
    for(let col=0; col<REELS; col++){
        const rl = reels[col];
        if(!rl.spinning && !rl.stopping && rl.bounce <= 0) continue;

        if(rl.spinning && !rl.stopping){
            // Accelerate
            rl.speed = Math.min(rl.speed + 2*delta, 30);
            for(let i=0; i<rl.strips.length; i++){
                const sp = rl.strips[i];
                sp.y += rl.speed * delta;
                // Wrap around: when symbol goes below visible area, move to top
                if(sp.y > GRID_Y + GRID_H + CELL){
                    sp.y -= STRIP_LEN * CELL;
                    const ns = rSym();
                    sp.texture = tex[ns.id]; sp.symData = ns;
                }
            }
        } else if(rl.stopping){
            // Decelerate
            rl.speed *= 0.82;
            if(rl.speed < 0.5){
                // SNAP: Place target symbols at exact grid positions
                rl.spinning = false; rl.stopping = false; rl.speed = 0;
                for(let row=0; row<ROWS; row++){
                    const sp = rl.strips[row + 1]; // +1 because index 0 is buffer above
                    if(sp && rl.target){
                        sp.texture = tex[rl.target[row].id];
                        sp.symData = rl.target[row];
                        sp.y = GRID_Y + row * CELL;
                        sp.x = GRID_X + col * CELL;
                        sp.width = SYM_SIZE;
                        sp.height = SYM_SIZE;
                    }
                }
                // Reset buffer positions too
                rl.strips[0].y = GRID_Y - CELL;
                rl.strips[0].x = GRID_X + col * CELL;
                if(rl.strips[ROWS+1]){
                    rl.strips[ROWS+1].y = GRID_Y + ROWS * CELL;
                    rl.strips[ROWS+1].x = GRID_X + col * CELL;
                }
                rl.bounce = 1;
                sfxStop(col);
            } else {
                for(let i=0; i<rl.strips.length; i++){
                    const sp = rl.strips[i];
                    sp.y += rl.speed * delta;
                    if(sp.y > GRID_Y + GRID_H + CELL){
                        sp.y -= STRIP_LEN * CELL;
                        const ns = rSym();
                        sp.texture = tex[ns.id]; sp.symData = ns;
                    }
                }
            }
        }

        // Bounce settle effect
        if(rl.bounce > 0){
            rl.bounce -= 0.04 * delta;
            if(rl.bounce <= 0) rl.bounce = 0;
        }
    }
});


// ===== WIN EFFECTS =====
function winFx(amt){
    const wt = new PIXI.Text('+'+fmt(amt),{fontFamily:'Georgia,serif',fontSize:22,fill:0xf5d061,fontWeight:'bold',stroke:0x000000,strokeThickness:3});
    wt.anchor.set(0.5); wt.x=W/2; wt.y=H*0.5; app.stage.addChild(wt);
    let t=0;
    const tick=()=>{ t+=app.ticker.deltaMS; wt.y-=0.7; wt.alpha=1-t/2500;
        if(t>2500){app.stage.removeChild(wt);app.ticker.remove(tick);wt.destroy();}
    };
    app.ticker.add(tick);
    const coins=['🪙','💰','⭐','🦁'];
    for(let i=0;i<10;i++){
        setTimeout(()=>{
            const c=new PIXI.Text(coins[Math.floor(Math.random()*coins.length)],{fontSize:12+Math.random()*8});
            c.x=Math.random()*W; c.y=-15; app.stage.addChild(c);
            const sp=1.5+Math.random()*3;
            const ct=()=>{c.y+=sp;c.rotation+=0.03;if(c.y>H+20){app.stage.removeChild(c);app.ticker.remove(ct);c.destroy();}};
            app.ticker.add(ct);
        },i*50);
    }
}

// ===== KEYBOARD =====
document.addEventListener('keydown',(e)=>{
    if(e.code==='Space'||e.code==='Enter'){e.preventDefault();doSpin();}
});

console.log('🦁 C8L Casino — El León Dorado v3.0 loaded');
})();
