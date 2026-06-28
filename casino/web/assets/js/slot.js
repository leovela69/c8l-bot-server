/**
 * C8L CASINO - EL LEÓN DORADO - PixiJS Premium Slot
 * Diseño: Negro + Dorado, símbolos letras estilizadas, lámparas, partículas
 */
(function(){
'use strict';

const app = new PIXI.Application({
    resizeTo: window,
    backgroundColor: 0x050505,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true
});
document.body.appendChild(app.view);

// ============ CONFIG ============
const REELS = 5, ROWS = 3;
const BET_LEVELS = [10,25,50,100,250,500,1000,2500,5000];
const SYMS = [
    {id:'leon',  label:'🦁',type:'icon',color:0xd4a017,w:3},
    {id:'wild',  label:'W', type:'letter',color:0xc0392b,w:2},
    {id:'scatter',label:'★',type:'letter',color:0xf1c40f,w:2,sub:'SCATTER'},
    {id:'c8l',   label:'😊',type:'icon',color:0xd4a017,w:3,sub:'C8L'},
    {id:'A',     label:'A', type:'letter',color:0xcc0000,w:5},
    {id:'K',     label:'K', type:'letter',color:0x2ecc71,w:6},
    {id:'Q',     label:'Q', type:'letter',color:0x9b59b6,w:7},
    {id:'J',     label:'J', type:'letter',color:0x1abc9c,w:8},
    {id:'10',    label:'10',type:'letter',color:0x2ecc71,w:9},
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

// ============ STATE ============
let credits = 152445000, chips = 8250, betIdx = 4;
let lastWin = 0, jackpot = 48545707, spinning = false;
let multiplier = 1, freeSpins = 0, soundOn = true;
function bet(){ return BET_LEVELS[betIdx]; }
function total(){ return bet() * 20; }
function fmt(n){ return n.toLocaleString('es-ES'); }
function rSym(){
    const t = SYMS.reduce((s,d)=>s+d.w,0);
    let r = Math.random()*t;
    for(const d of SYMS){ r-=d.w; if(r<=0) return d; }
    return SYMS[SYMS.length-1];
}


// ============ DIMENSIONS ============
const W = app.screen.width, H = app.screen.height;
const symSz = Math.min(Math.floor((W * 0.72) / REELS) - 8, 100);
const gap = 6;
const rW = symSz + gap;
const totW = REELS * rW - gap;
const rH = ROWS * (symSz + gap) - gap;
const ox = (W - totW) / 2;
const oy = H * 0.28;
const frameP = 14; // frame padding

// ============ AUDIO (Web Audio API) ============
let audioCtx = null;
function initAudio(){ if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }
function tone(f,dur,type,vol){
    if(!audioCtx||!soundOn)return;
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type=type||'sine'; o.frequency.value=f;
    g.gain.setValueAtTime(vol||0.1,audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime+dur);
}
function sfxSpin(){ tone(180,0.08,'square',0.06); }
function sfxStop(i){ tone(350+i*100,0.1,'triangle',0.1); }
function sfxWin(){ [523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,0.2,'sine',0.12),i*80)); }
function sfxBigWin(){ [523,659,784,1047,1318].forEach((f,i)=>setTimeout(()=>tone(f,0.3,'sine',0.15),i*70)); }
document.addEventListener('pointerdown',()=>initAudio(),{once:true});


// ============ TEXTURES (Letter-style symbols) ============
const tex = {};
SYMS.forEach(sym => {
    const c = new PIXI.Container();
    // Background cell
    const bg = new PIXI.Graphics();
    bg.beginFill(0x0a0800);
    bg.lineStyle(2.5, sym.color, 0.7);
    bg.drawRoundedRect(0, 0, 100, 100, 10);
    bg.endFill();
    // Inner subtle gradient
    bg.beginFill(sym.color, 0.04);
    bg.drawRoundedRect(4, 4, 92, 92, 8);
    bg.endFill();
    c.addChild(bg);

    if(sym.type === 'letter'){
        const txt = new PIXI.Text(sym.label, {
            fontFamily: 'Georgia, serif',
            fontSize: sym.label.length > 1 ? 38 : 48,
            fill: sym.color,
            fontWeight: 'bold',
            fontStyle: 'italic'
        });
        txt.anchor.set(0.5);
        txt.x = 50; txt.y = sym.sub ? 42 : 50;
        c.addChild(txt);
        if(sym.sub){
            const sub = new PIXI.Text(sym.sub, {
                fontFamily: 'monospace', fontSize: 10,
                fill: sym.color, fontWeight: 'bold'
            });
            sub.anchor.set(0.5);
            sub.x = 50; sub.y = 82;
            c.addChild(sub);
        }
    } else {
        const txt = new PIXI.Text(sym.label, { fontSize: 44 });
        txt.anchor.set(0.5);
        txt.x = 50; txt.y = sym.sub ? 42 : 50;
        c.addChild(txt);
        if(sym.sub){
            const sub = new PIXI.Text(sym.sub, {
                fontFamily: 'monospace', fontSize: 10,
                fill: sym.color, fontWeight: 'bold'
            });
            sub.anchor.set(0.5);
            sub.x = 50; sub.y = 82;
            c.addChild(sub);
        }
    }
    tex[sym.id] = app.renderer.generateTexture(c);
    c.destroy({children:true});
});


// ============ BACKGROUND ============
const bgLayer = new PIXI.Graphics();
bgLayer.beginFill(0x050505);
bgLayer.drawRect(0, 0, W, H);
bgLayer.endFill();
app.stage.addChild(bgLayer);

// Subtle radial glow behind reels
const glow = new PIXI.Graphics();
glow.beginFill(0x1a1200, 0.2);
glow.drawEllipse(W/2, oy + rH/2, totW * 0.7, rH * 0.9);
glow.endFill();
app.stage.addChild(glow);

// ============ HEADER ============
// Menu icon (top-left)
const menuBtn = new PIXI.Graphics();
menuBtn.lineStyle(2, 0xd4a017);
for(let i=0;i<3;i++){ menuBtn.moveTo(W*0.04, H*0.025+i*6); menuBtn.lineTo(W*0.04+18, H*0.025+i*6); }
menuBtn.eventMode='static'; menuBtn.cursor='pointer';
app.stage.addChild(menuBtn);

// C8L Logo (top-center)
const logoBg = new PIXI.Graphics();
logoBg.lineStyle(2, 0xd4a017);
logoBg.beginFill(0x0a0800);
logoBg.drawRoundedRect(W/2-22, H*0.012, 44, 24, 4);
logoBg.endFill();
app.stage.addChild(logoBg);
const logoTxt = new PIXI.Text('C8L', {fontFamily:'serif',fontSize:13,fill:0xf5d061,fontWeight:'bold'});
logoTxt.anchor.set(0.5); logoTxt.x=W/2; logoTxt.y=H*0.012+12;
app.stage.addChild(logoTxt);

// Title
const title = new PIXI.Text('C8LLEGENDS', {
    fontFamily: 'Georgia, serif', fontSize: Math.min(W*0.04, 20),
    fill: 0xd4a017, fontWeight: 'bold', letterSpacing: 3
});
title.anchor.set(0.5, 0); title.x = W/2; title.y = H*0.045;
app.stage.addChild(title);
const subtitle = new PIXI.Text('EL LEÓN DORADO', {
    fontFamily: 'monospace', fontSize: Math.min(W*0.018, 9),
    fill: 0x8b6914, letterSpacing: 4
});
subtitle.anchor.set(0.5, 0); subtitle.x = W/2; subtitle.y = title.y + title.height + 2;
app.stage.addChild(subtitle);

// Sound icon (top-right)
const sndBtn = new PIXI.Text('🔊', {fontSize:18});
sndBtn.anchor.set(0.5); sndBtn.x = W*0.96; sndBtn.y = H*0.03;
sndBtn.eventMode='static'; sndBtn.cursor='pointer';
sndBtn.on('pointerdown', ()=>{ soundOn=!soundOn; sndBtn.text=soundOn?'🔊':'🔇'; });
app.stage.addChild(sndBtn);


// ============ JACKPOT BAR ============
const jpLabel = new PIXI.Text('JACKPOT GLOBAL', {
    fontFamily:'monospace', fontSize:9, fill:0x8b6914, letterSpacing:3
});
jpLabel.anchor.set(0.5,0); jpLabel.x=W/2; jpLabel.y=H*0.1;
app.stage.addChild(jpLabel);
const jpAmount = new PIXI.Text(fmt(jackpot), {
    fontFamily:'Georgia, serif', fontSize:Math.min(W*0.06,30),
    fill:0xf5d061, fontWeight:'bold'
});
jpAmount.anchor.set(0.5,0); jpAmount.x=W/2; jpAmount.y=H*0.12;
app.stage.addChild(jpAmount);

// ============ DECORATIVE LAMPS ============
function drawLamp(x, y){
    const lamp = new PIXI.Graphics();
    // Lamp body (triangle/cone)
    lamp.beginFill(0xd4a017);
    lamp.moveTo(x, y); lamp.lineTo(x-6, y-18); lamp.lineTo(x+6, y-18);
    lamp.closePath(); lamp.endFill();
    // Glow
    lamp.beginFill(0xf5d061, 0.15);
    lamp.drawCircle(x, y+8, 20);
    lamp.endFill();
    lamp.beginFill(0xf5d061, 0.4);
    lamp.drawCircle(x, y, 3);
    lamp.endFill();
    return lamp;
}
const lampL = drawLamp(ox - frameP - 20, oy - 10);
const lampR = drawLamp(ox + totW + frameP + 20, oy - 10);
app.stage.addChild(lampL);
app.stage.addChild(lampR);

// ============ PAYLINE DOTS (above frame) ============
const dotsY = oy - frameP - 12;
for(let i=0; i<7; i++){
    const dot = new PIXI.Graphics();
    const dx = ox + (totW/(6)) * i;
    dot.beginFill(i===0 ? 0xf5d061 : 0x555555);
    dot.drawCircle(dx, dotsY, 3);
    dot.endFill();
    app.stage.addChild(dot);
}


// ============ REELS FRAME (double golden border) ============
const frameOuter = new PIXI.Graphics();
frameOuter.lineStyle(2, 0xf5d061, 0.4);
frameOuter.drawRoundedRect(
    ox - frameP - 4, oy - frameP - 4,
    totW + (frameP+4)*2, rH + (frameP+4)*2, 14
);
app.stage.addChild(frameOuter);

const frameInner = new PIXI.Graphics();
frameInner.lineStyle(3, 0xd4a017, 0.9);
frameInner.beginFill(0x050300, 0.95);
frameInner.drawRoundedRect(
    ox - frameP, oy - frameP,
    totW + frameP*2, rH + frameP*2, 12
);
frameInner.endFill();
app.stage.addChild(frameInner);

// ============ SIDE INDICATORS ============
// Left: MULTI x1
const multiLabel = new PIXI.Text('MULTI', {fontFamily:'monospace',fontSize:7,fill:0x8b6914});
multiLabel.anchor.set(0.5); multiLabel.x = ox - frameP - 30; multiLabel.y = oy + rH/2 - 10;
app.stage.addChild(multiLabel);
const multiVal = new PIXI.Text('X'+multiplier, {fontFamily:'monospace',fontSize:12,fill:0xf5d061,fontWeight:'bold'});
multiVal.anchor.set(0.5); multiVal.x = ox - frameP - 30; multiVal.y = oy + rH/2 + 6;
app.stage.addChild(multiVal);
const multiBox = new PIXI.Graphics();
multiBox.lineStyle(1.5, 0x8b6914);
multiBox.drawRoundedRect(ox-frameP-48, oy+rH/2-20, 36, 40, 4);
app.stage.addChild(multiBox);

// Right: GIRO count
const giroLabel = new PIXI.Text('GIRO', {fontFamily:'monospace',fontSize:7,fill:0x8b6914});
giroLabel.anchor.set(0.5); giroLabel.x = ox + totW + frameP + 30; giroLabel.y = oy + rH/2 - 10;
app.stage.addChild(giroLabel);
const giroVal = new PIXI.Text(freeSpins > 0 ? freeSpins.toString() : '0', {fontFamily:'monospace',fontSize:12,fill:0xf5d061,fontWeight:'bold'});
giroVal.anchor.set(0.5); giroVal.x = ox + totW + frameP + 30; giroVal.y = oy + rH/2 + 6;
app.stage.addChild(giroVal);
const giroBox = new PIXI.Graphics();
giroBox.lineStyle(1.5, 0x8b6914);
giroBox.drawRoundedRect(ox+totW+frameP+12, oy+rH/2-20, 36, 40, 4);
app.stage.addChild(giroBox);


// ============ REELS ============
const reels = [];
const mask = new PIXI.Graphics();
mask.beginFill(0xffffff);
mask.drawRoundedRect(ox - 2, oy - 2, totW + 4, rH + 4, 6);
mask.endFill();
app.stage.addChild(mask);

for(let i = 0; i < REELS; i++){
    const rc = new PIXI.Container();
    rc.mask = mask;
    const syms = [];
    for(let j = -1; j <= ROWS; j++){
        const d = rSym();
        const sp = new PIXI.Sprite(tex[d.id]);
        sp.width = symSz; sp.height = symSz;
        sp.x = ox + i * rW;
        sp.y = oy + j * (symSz + gap);
        sp.sid = d.id;
        rc.addChild(sp);
        syms.push(sp);
    }
    app.stage.addChild(rc);
    reels.push({rc, syms, spd:0, spin:false, stop:false, tgt:null, bnc:0});
}

// Center payline
const paylineLine = new PIXI.Graphics();
paylineLine.lineStyle(2, 0xf5a623, 0.5);
paylineLine.moveTo(ox - 6, oy + rH/2 + symSz*0.1);
paylineLine.lineTo(ox + totW + 6, oy + rH/2 + symSz*0.1);
app.stage.addChild(paylineLine);

// Payline arrow indicators (small triangles on sides)
const plArrowL = new PIXI.Graphics();
plArrowL.beginFill(0xf5a623);
plArrowL.moveTo(ox-10, oy+rH/2); plArrowL.lineTo(ox-4, oy+rH/2-4); plArrowL.lineTo(ox-4, oy+rH/2+4);
plArrowL.closePath(); plArrowL.endFill();
app.stage.addChild(plArrowL);
const plArrowR = new PIXI.Graphics();
plArrowR.beginFill(0xf5a623);
plArrowR.moveTo(ox+totW+10, oy+rH/2); plArrowR.lineTo(ox+totW+4, oy+rH/2-4); plArrowR.lineTo(ox+totW+4, oy+rH/2+4);
plArrowR.closePath(); plArrowR.endFill();
app.stage.addChild(plArrowR);


// ============ INFO BAR (below reels) ============
const infoY = oy + rH + frameP + 14;
const infoData = [
    {l:'LINEAS', v:'20', x:ox+totW*0.1},
    {l:'APUESTA', v:fmt(bet()), x:ox+totW*0.33},
    {l:'TOTAL', v:fmt(total()), x:ox+totW*0.58},
    {l:'GANANCIA', v:'0', x:ox+totW*0.85}
];
const infoLabels = {};
infoData.forEach(o => {
    const lbl = new PIXI.Text(o.l, {fontFamily:'monospace',fontSize:8,fill:0x8b6914,letterSpacing:1});
    lbl.anchor.set(0.5,0); lbl.x=o.x; lbl.y=infoY;
    app.stage.addChild(lbl);
    const val = new PIXI.Text(o.v, {fontFamily:'monospace',fontSize:14,fill:0xf5f0e8,fontWeight:'bold'});
    val.anchor.set(0.5,0); val.x=o.x; val.y=infoY+12;
    app.stage.addChild(val);
    infoLabels[o.l] = val;
});

// ============ PARTICLES (floating sparkles) ============
const particles = [];
function spawnParticle(){
    const p = new PIXI.Text('✦', {fontSize: 6+Math.random()*8, fill:0xf5d061});
    p.alpha = 0.2 + Math.random()*0.4;
    p.x = Math.random() * W;
    p.y = Math.random() * H;
    p.vx = (Math.random()-0.5)*0.3;
    p.vy = -0.2 - Math.random()*0.3;
    p.life = 200 + Math.random()*200;
    app.stage.addChild(p);
    particles.push(p);
}
for(let i=0;i<8;i++) spawnParticle();


// ============ CONTROLS ============
const ctrlY = H * 0.85;

// Spin button (big gold circle)
const spinBtn = new PIXI.Graphics();
spinBtn.beginFill(0xd4a017);
spinBtn.drawCircle(0, 0, 32);
spinBtn.endFill();
spinBtn.lineStyle(4, 0xf5d061);
spinBtn.drawCircle(0, 0, 32);
// Inner circle highlight
spinBtn.beginFill(0xf5d061, 0.3);
spinBtn.drawCircle(0, -8, 14);
spinBtn.endFill();
spinBtn.x = W/2; spinBtn.y = ctrlY;
spinBtn.eventMode = 'static'; spinBtn.cursor = 'pointer';
spinBtn.on('pointerdown', doSpin);
app.stage.addChild(spinBtn);

// Spin icon (circular arrow)
const spinIcon = new PIXI.Text('↻', {fontSize:22, fill:0x0a0800, fontWeight:'bold'});
spinIcon.anchor.set(0.5); spinIcon.x = W/2; spinIcon.y = ctrlY - 4;
app.stage.addChild(spinIcon);
const spinLabel = new PIXI.Text('GIRAR', {fontFamily:'monospace',fontSize:8,fill:0x0a0800,fontWeight:'bold'});
spinLabel.anchor.set(0.5); spinLabel.x = W/2; spinLabel.y = ctrlY + 12;
app.stage.addChild(spinLabel);

// Bet buttons
function mkBtn(label, x, fn){
    const g = new PIXI.Graphics();
    g.lineStyle(2, 0x8b6914);
    g.beginFill(0x1a1200);
    g.drawRoundedRect(-20, -20, 40, 40, 8);
    g.endFill();
    g.x = x; g.y = ctrlY;
    g.eventMode = 'static'; g.cursor = 'pointer';
    g.on('pointerdown', fn);
    const t = new PIXI.Text(label, {fontSize:20, fill:0xf5d061, fontWeight:'bold'});
    t.anchor.set(0.5); g.addChild(t);
    app.stage.addChild(g);
}
mkBtn('−', W/2 - 80, ()=>{ if(betIdx>0 && !spinning){betIdx--; upd();} });
mkBtn('+', W/2 + 80, ()=>{ if(betIdx<BET_LEVELS.length-1 && !spinning){betIdx++; upd();} });

// ============ FOOTER ============
const footY = H - 18;
const credTxt = new PIXI.Text('🪙 '+fmt(credits), {fontFamily:'monospace',fontSize:12,fill:0xf5f0e8});
credTxt.x = 14; credTxt.y = footY;
app.stage.addChild(credTxt);

const chipTxt = new PIXI.Text('💎 '+fmt(chips), {fontFamily:'monospace',fontSize:12,fill:0xf5f0e8});
chipTxt.anchor.set(0.5,0); chipTxt.x = W/2; chipTxt.y = footY;
app.stage.addChild(chipTxt);

const vipTxt = new PIXI.Text('⭐ VIP 10', {fontFamily:'monospace',fontSize:12,fill:0xf5f0e8});
vipTxt.anchor.set(1,0); vipTxt.x = W-14; vipTxt.y = footY;
app.stage.addChild(vipTxt);


// ============ UPDATE DISPLAY ============
function upd(){
    infoLabels['APUESTA'].text = fmt(bet());
    infoLabels['TOTAL'].text = fmt(total());
    infoLabels['GANANCIA'].text = fmt(lastWin);
    credTxt.text = '🪙 ' + fmt(credits);
    jpAmount.text = fmt(jackpot);
    multiVal.text = 'X' + multiplier;
    giroVal.text = freeSpins > 0 ? freeSpins.toString() : '0';
}

// ============ SPIN ============
function doSpin(){
    if(spinning) return;
    if(credits < total() && freeSpins <= 0) return;
    initAudio();
    spinning = true;
    lastWin = 0;

    if(freeSpins > 0){
        freeSpins--;
    } else {
        credits -= total();
        jackpot += Math.floor(total() * 0.01);
    }
    upd(); sfxSpin();

    // Generate target
    const grid = [];
    for(let r=0; r<REELS; r++){
        const col = [];
        for(let j=0; j<ROWS; j++) col.push(rSym());
        grid.push(col);
    }

    // Start spin
    reels.forEach((rl, i) => {
        rl.spin = true; rl.stop = false;
        rl.spd = 0; rl.tgt = grid[i]; rl.bnc = 0;
        setTimeout(() => { rl.stop = true; }, 400 + i * 180);
    });

    // Evaluate after all stop
    setTimeout(() => {
        spinning = false;
        let tw = 0;
        for(let li=0; li<20; li++){
            const line = PL[li].map((row,r) => grid[r][row]);
            let tg = null;
            for(let k=0;k<line.length;k++){
                if(line[k].id!=='wild' && line[k].id!=='scatter'){ tg=line[k].id; break; }
            }
            if(!tg){
                if(line.every(s=>s.id==='wild')) tg='wild'; else continue;
            }
            let cnt=0;
            for(let k=0;k<5;k++){
                if(line[k].id===tg || line[k].id==='wild') cnt++; else break;
            }
            if(cnt>=3 && PT[tg]){
                const m = PT[tg][cnt] || 0;
                if(m>0) tw += m * bet();
            }
        }

        // Scatter check
        let scatterCount = 0;
        for(let r=0;r<REELS;r++) for(let row=0;row<ROWS;row++){
            if(grid[r][row].id==='scatter') scatterCount++;
        }
        if(scatterCount >= 3){
            const fs = scatterCount>=5?25:scatterCount>=4?15:10;
            freeSpins += fs;
            multiplier = 2;
            tw += [0,0,0,5,20,100][scatterCount] * total();
        }

        // Modo Rugido
        if(tw > 0 && Math.random() < 0.05){
            const rm = [2,3,5,8,10][Math.floor(Math.random()*5)];
            tw *= rm; multiplier = rm;
        }

        // Jackpot (0.01%)
        if(Math.random() < 0.0001 && freeSpins <= 0){
            tw += jackpot; jackpot = 1000000;
            sfxBigWin();
        }

        if(tw > 0){
            credits += tw; lastWin = tw;
            winFx(tw);
            if(tw >= total()*10) sfxBigWin(); else sfxWin();
        }
        upd();

        // Auto free spin
        if(freeSpins > 0){
            setTimeout(doSpin, 1200);
        } else {
            multiplier = 1; upd();
        }
    }, 400 + (REELS-1)*180 + 350);
}


// ============ REEL ANIMATION ============
app.ticker.add((delta) => {
    // Jackpot ticker
    if(Math.random() < 0.004){
        jackpot += Math.floor(Math.random()*80)+10;
        jpAmount.text = fmt(jackpot);
    }

    // Particles
    for(let i=particles.length-1; i>=0; i--){
        const p = particles[i];
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.life -= delta;
        if(p.life <= 0){
            app.stage.removeChild(p); p.destroy();
            particles.splice(i, 1);
            spawnParticle();
        }
    }

    // Reel spin animation
    const symH = symSz + gap;
    for(let ri=0; ri<reels.length; ri++){
        const rl = reels[ri];
        if(!rl.spin && !rl.stop && rl.bnc <= 0) continue;

        if(rl.spin && !rl.stop){
            // Accelerate
            rl.spd = Math.min(rl.spd + 1.8 * delta, 38);
            for(let si=0; si<rl.syms.length; si++){
                const s = rl.syms[si];
                s.y += rl.spd * delta;
                // Blur stretch effect
                s.scale.y = 1 + (rl.spd/38) * 0.1;
                s.scale.x = 1 - (rl.spd/38) * 0.03;
                if(s.y > oy + rH + symH){
                    s.y -= symH * (ROWS + 2);
                    const ns = rSym();
                    s.texture = tex[ns.id]; s.sid = ns.id;
                }
            }
        } else if(rl.stop){
            // Decelerate
            rl.spd *= 0.86;
            if(rl.spd < 0.6){
                rl.spin = false; rl.stop = false; rl.spd = 0;
                // Snap to target
                if(rl.tgt){
                    for(let row=0; row<rl.tgt.length; row++){
                        const sp = rl.syms[row+1];
                        if(sp){
                            sp.texture = tex[rl.tgt[row].id];
                            sp.sid = rl.tgt[row].id;
                            sp.y = oy + row * symH;
                            sp.scale.y = 0.88; sp.scale.x = 1.08;
                        }
                    }
                }
                rl.bnc = 1;
                sfxStop(ri);
            } else {
                for(let si=0; si<rl.syms.length; si++){
                    const s = rl.syms[si];
                    s.y += rl.spd * delta;
                    s.scale.y = 1 + (rl.spd/38)*0.05;
                    s.scale.x = 1 - (rl.spd/38)*0.02;
                    if(s.y > oy + rH + symH){
                        s.y -= symH * (ROWS + 2);
                        const ns = rSym();
                        s.texture = tex[ns.id]; s.sid = ns.id;
                    }
                }
            }
        }

        // Bounce settle
        if(rl.bnc > 0){
            rl.bnc -= 0.04 * delta;
            if(rl.bnc <= 0){
                rl.bnc = 0;
                for(const s of rl.syms){ s.scale.y=1; s.scale.x=1; }
            } else {
                const b = Math.sin(rl.bnc * Math.PI * 3) * rl.bnc * 0.1;
                for(const s of rl.syms){
                    s.scale.y = 1 + b;
                    s.scale.x = 1 - b * 0.3;
                }
            }
        }
    }
});


// ============ WIN EFFECTS ============
function winFx(amt){
    // Floating win text
    const wt = new PIXI.Text('+'+fmt(amt), {
        fontFamily:'Georgia, serif', fontSize:24,
        fill:0xf5d061, fontWeight:'bold',
        stroke:0x000000, strokeThickness:3
    });
    wt.anchor.set(0.5); wt.x = W/2; wt.y = H*0.5;
    app.stage.addChild(wt);
    let t = 0;
    const tick = () => {
        t += app.ticker.deltaMS;
        wt.y -= 0.8;
        wt.alpha = 1 - t/2500;
        if(t > 2500){ app.stage.removeChild(wt); app.ticker.remove(tick); wt.destroy(); }
    };
    app.ticker.add(tick);

    // Coin particles
    const coins = ['🪙','💰','⭐','🦁'];
    for(let i=0; i<12; i++){
        setTimeout(()=>{
            const c = new PIXI.Text(coins[Math.floor(Math.random()*coins.length)],{fontSize:14+Math.random()*8});
            c.x = Math.random()*W; c.y = -20;
            app.stage.addChild(c);
            const sp = 1.5 + Math.random()*3;
            const ct = ()=>{
                c.y += sp; c.rotation += 0.03;
                if(c.y > H+30){ app.stage.removeChild(c); app.ticker.remove(ct); c.destroy(); }
            };
            app.ticker.add(ct);
        }, i*60);
    }
}

// ============ KEYBOARD ============
document.addEventListener('keydown', (e) => {
    if(e.code==='Space'||e.code==='Enter'){ e.preventDefault(); doSpin(); }
});

// ============ DONE ============
console.log('🦁 C8L Casino — El León Dorado v2.0 loaded');

})();
