/**
 * C8L CASINO — EL LEÓN DORADO v4.0
 * PixiJS Premium Slot with real image assets
 */
(function(){
'use strict';

// ===== CONSTANTS =====
const REELS=5, ROWS=3, LINES=20;
const BET_LEVELS=[10,25,50,100,250,500,1000,2500,5000];
const PAYLINES=[
  [1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],
  [0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,0],
  [2,1,1,1,2],[1,0,1,2,1],[1,2,1,0,1],[0,0,1,0,0],[2,2,1,2,2],
  [0,1,0,1,0],[2,1,2,1,2],[1,0,1,0,1],[1,2,1,2,1],[0,1,2,2,1]
];

const SYMBOLS=[
  {id:'leon',   img:'sym_leon.png',    w:3, pay:{5:500,4:100,3:25}},
  {id:'wild',   img:'sym_wild.png',    w:2, pay:{5:1000,4:200,3:50}},
  {id:'scatter',img:'sym_scatter.png', w:2, pay:{5:100,4:20,3:5}},
  {id:'A',      img:'sym_A.png',       w:5, pay:{5:50,4:15,3:5}},
  {id:'K',      img:'sym_K.jpeg',      w:6, pay:{5:40,4:12,3:4}},
  {id:'Q',      img:'sym_Q.jpeg',      w:7, pay:{5:30,4:10,3:3}},
  {id:'J',      img:'sym_J.jpeg',      w:8, pay:{5:20,4:8,3:2}},
  {id:'10',     img:'sym_10.jpeg',     w:9, pay:{5:15,4:5,3:2}},
];

// ===== STATE =====
let credits=152450000, chips=8250, betIdx=4;
let lastWin=0, jackpot=48532120, spinning=false;
let multiplier=1, freeSpins=0, soundOn=true;

function bet(){ return BET_LEVELS[betIdx]; }
function totalBet(){ return bet()*LINES; }
function fmt(n){ return n.toLocaleString('es-ES'); }
function rSym(){
  const t=SYMBOLS.reduce((s,d)=>s+d.w,0);
  let r=Math.random()*t;
  for(const d of SYMBOLS){r-=d.w; if(r<=0)return d;}
  return SYMBOLS[SYMBOLS.length-1];
}

// ===== LOAD ASSETS =====
const IMG_PATH = 'assets/img/';
const loadBar = document.getElementById('loadbar');

PIXI.Assets.addBundle('slot', {
  bg:     IMG_PATH+'bg_main.png',
  leon:   IMG_PATH+'sym_leon.png',
  wild:   IMG_PATH+'sym_wild.png',
  scatter:IMG_PATH+'sym_scatter.png',
  A:      IMG_PATH+'sym_A.png',
  K:      IMG_PATH+'sym_K.jpeg',
  Q:      IMG_PATH+'sym_Q.jpeg',
  J:      IMG_PATH+'sym_J.jpeg',
  ten:    IMG_PATH+'sym_10.jpeg',
  logo:   IMG_PATH+'logotipoc8l.jpeg',
});

PIXI.Assets.loadBundle('slot', (p)=>{
  if(loadBar) loadBar.style.width = Math.round(p*100)+'%';
}).then((assets)=>{
  document.getElementById('loading').style.display='none';
  startGame(assets);
});

function startGame(assets){


  // ===== APP =====
  const app = new PIXI.Application({
    resizeTo:window, backgroundColor:0x050505,
    antialias:true, resolution:window.devicePixelRatio||1, autoDensity:true
  });
  document.body.appendChild(app.view);
  const W=app.screen.width, H=app.screen.height;

  // ===== AUDIO =====
  let audioCtx=null;
  function initAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();}
  function tone(f,dur,type,vol){
    if(!audioCtx||!soundOn)return;
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type=type||'sine';o.frequency.value=f;
    g.gain.setValueAtTime(vol||0.1,audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur);
    o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur);
  }
  function sfxSpin(){tone(180,0.08,'square',0.06);}
  function sfxStop(i){tone(350+i*100,0.12,'triangle',0.1);}
  function sfxWin(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,0.2,'sine',0.12),i*80));}
  function sfxBig(){[523,659,784,1047,1318].forEach((f,i)=>setTimeout(()=>tone(f,0.3,'sine',0.15),i*70));}
  document.addEventListener('pointerdown',()=>initAudio(),{once:true});

  // ===== DIMENSIONS =====
  const SYM=Math.min(Math.floor((W*0.7)/REELS),Math.floor((H*0.32)/ROWS));
  const GAP=4;
  const CELL=SYM+GAP;
  const GW=REELS*CELL-GAP, GH=ROWS*CELL-GAP;
  const GX=(W-GW)/2, GY=H*0.30;

  // ===== SYMBOL TEXTURES (from loaded assets) =====
  const texMap={};
  const texKeys={leon:'leon',wild:'wild',scatter:'scatter',A:'A',K:'K',Q:'Q',J:'J','10':'ten'};
  SYMBOLS.forEach(sym=>{
    const key=texKeys[sym.id];
    if(assets[key]){texMap[sym.id]=assets[key];}
  });


  // ===== BACKGROUND =====
  if(assets.bg){
    const bg=new PIXI.Sprite(assets.bg);
    bg.width=W; bg.height=H;
    app.stage.addChild(bg);
  } else {
    const bg=new PIXI.Graphics();
    bg.beginFill(0x050505);bg.drawRect(0,0,W,H);bg.endFill();
    app.stage.addChild(bg);
  }

  // ===== HEADER =====
  const titleT=new PIXI.Text('C8L LEGENDS',{fontFamily:'Georgia,serif',fontSize:Math.min(W*0.04,22),fill:0xd4a017,fontWeight:'bold',letterSpacing:2});
  titleT.anchor.set(0.5,0);titleT.x=W/2;titleT.y=H*0.02;app.stage.addChild(titleT);
  const subT=new PIXI.Text('EL LEÓN DORADO',{fontFamily:'monospace',fontSize:9,fill:0x8b6914,letterSpacing:3});
  subT.anchor.set(0.5,0);subT.x=W/2;subT.y=titleT.y+titleT.height+2;app.stage.addChild(subT);

  // Logo
  if(assets.logo){
    const logo=new PIXI.Sprite(assets.logo);
    logo.width=36;logo.height=36;logo.anchor.set(0.5);
    logo.x=W/2;logo.y=H*0.02+18;
    // Don't add if title already there - skip for now
  }

  // Sound button
  const sndT=new PIXI.Text('🔊',{fontSize:20});
  sndT.x=W-35;sndT.y=8;sndT.eventMode='static';sndT.cursor='pointer';
  sndT.on('pointerdown',()=>{soundOn=!soundOn;sndT.text=soundOn?'🔊':'🔇';});
  app.stage.addChild(sndT);

  // Jackpot
  const jpLbl=new PIXI.Text('JACKPOT GLOBAL',{fontFamily:'monospace',fontSize:9,fill:0x8b6914,letterSpacing:2});
  jpLbl.anchor.set(0.5,0);jpLbl.x=W/2;jpLbl.y=H*0.12;app.stage.addChild(jpLbl);
  const jpVal=new PIXI.Text(fmt(jackpot),{fontFamily:'Georgia,serif',fontSize:Math.min(W*0.06,30),fill:0xf5d061,fontWeight:'bold'});
  jpVal.anchor.set(0.5,0);jpVal.x=W/2;jpVal.y=H*0.12+14;app.stage.addChild(jpVal);


  // ===== REEL FRAME =====
  const frame=new PIXI.Graphics();
  frame.lineStyle(3,0xd4a017,0.9);
  frame.beginFill(0x030200,0.92);
  frame.drawRoundedRect(GX-12,GY-12,GW+24,GH+24,10);
  frame.endFill();
  frame.lineStyle(1.5,0xf5d061,0.3);
  frame.drawRoundedRect(GX-16,GY-16,GW+32,GH+32,13);
  app.stage.addChild(frame);

  // ===== SIDE PANELS =====
  // Left: Multiplicador
  const mBox=new PIXI.Graphics();
  mBox.lineStyle(1.5,0x8b6914);mBox.beginFill(0x0a0800,0.8);
  mBox.drawRoundedRect(0,0,50,60,5);mBox.endFill();
  mBox.x=GX-70;mBox.y=GY+GH/2-30;app.stage.addChild(mBox);
  const mLbl=new PIXI.Text('MULTI',{fontFamily:'monospace',fontSize:7,fill:0x8b6914});
  mLbl.anchor.set(0.5);mLbl.x=mBox.x+25;mLbl.y=mBox.y+12;app.stage.addChild(mLbl);
  const mVal=new PIXI.Text('X1',{fontFamily:'Georgia,serif',fontSize:16,fill:0xf5d061,fontWeight:'bold'});
  mVal.anchor.set(0.5);mVal.x=mBox.x+25;mVal.y=mBox.y+32;app.stage.addChild(mVal);
  const mSub=new PIXI.Text('MODO\nRUGIDO',{fontFamily:'monospace',fontSize:6,fill:0x8b6914,align:'center'});
  mSub.anchor.set(0.5);mSub.x=mBox.x+25;mSub.y=mBox.y+50;app.stage.addChild(mSub);

  // Right: Giros Gratis
  const gBox=new PIXI.Graphics();
  gBox.lineStyle(1.5,0x8b6914);gBox.beginFill(0x0a0800,0.8);
  gBox.drawRoundedRect(0,0,50,60,5);gBox.endFill();
  gBox.x=GX+GW+20;gBox.y=GY+GH/2-30;app.stage.addChild(gBox);
  const gLbl=new PIXI.Text('GIROS\nGRATIS',{fontFamily:'monospace',fontSize:6,fill:0x8b6914,align:'center'});
  gLbl.anchor.set(0.5);gLbl.x=gBox.x+25;gLbl.y=gBox.y+12;app.stage.addChild(gLbl);
  const gVal=new PIXI.Text('0',{fontFamily:'Georgia,serif',fontSize:16,fill:0xf5d061,fontWeight:'bold'});
  gVal.anchor.set(0.5);gVal.x=gBox.x+25;gVal.y=gBox.y+32;app.stage.addChild(gVal);
  const gSub=new PIXI.Text('ACTIVOS',{fontFamily:'monospace',fontSize:6,fill:0x8b6914});
  gSub.anchor.set(0.5);gSub.x=gBox.x+25;gSub.y=gBox.y+50;app.stage.addChild(gSub);


  // ===== REELS (FIXED: proper mask + positioning) =====
  const reelContainer=new PIXI.Container();
  app.stage.addChild(reelContainer);

  // Mask: clips everything to grid area
  const reelMask=new PIXI.Graphics();
  reelMask.beginFill(0xffffff);
  reelMask.drawRect(GX,GY,GW,GH);
  reelMask.endFill();
  app.stage.addChild(reelMask);
  reelContainer.mask=reelMask;

  // Create reels: each has ROWS+2 sprites for scroll buffer
  const STRIP=ROWS+2;
  const reels=[];
  for(let col=0;col<REELS;col++){
    const strips=[];
    for(let i=0;i<STRIP;i++){
      const sym=rSym();
      const sp=new PIXI.Sprite(texMap[sym.id]);
      sp.width=SYM; sp.height=SYM;
      sp.x=GX+col*CELL;
      sp.y=GY+(i-1)*CELL; // i=0 is buffer above, i=1..3 visible
      sp.symData=sym;
      reelContainer.addChild(sp);
      strips.push(sp);
    }
    reels.push({strips,speed:0,spinning:false,stopping:false,target:null,bounce:0});
  }

  // Center payline
  const plY=GY+Math.floor(ROWS/2)*CELL+SYM/2;
  const pl=new PIXI.Graphics();
  pl.lineStyle(2,0xf5a623,0.4);
  pl.moveTo(GX-4,plY);pl.lineTo(GX+GW+4,plY);
  app.stage.addChild(pl);


  // ===== INFO BAR =====
  const infoY=GY+GH+20;
  const infoData=[
    {l:'LÍNEAS',v:'20',x:GX+GW*0.08},
    {l:'APUESTA',v:fmt(bet()),x:GX+GW*0.28},
    {l:'APUESTA TOTAL',v:fmt(totalBet()),x:GX+GW*0.52},
    {l:'GANANCIA',v:'0',x:GX+GW*0.82}
  ];
  const infoVals={};
  infoData.forEach(o=>{
    const lbl=new PIXI.Text(o.l,{fontFamily:'monospace',fontSize:7,fill:0x8b6914,letterSpacing:1});
    lbl.anchor.set(0.5,0);lbl.x=o.x;lbl.y=infoY;app.stage.addChild(lbl);
    const val=new PIXI.Text(o.v,{fontFamily:'monospace',fontSize:13,fill:0xf5f0e8,fontWeight:'bold'});
    val.anchor.set(0.5,0);val.x=o.x;val.y=infoY+11;app.stage.addChild(val);
    infoVals[o.l]=val;
  });

  // ===== CONTROLS =====
  const ctrlY=H*0.85;
  // Spin button
  const spinBg=new PIXI.Graphics();
  spinBg.beginFill(0xd4a017);spinBg.drawRoundedRect(-45,-22,90,44,8);spinBg.endFill();
  spinBg.lineStyle(2,0xf5d061);spinBg.drawRoundedRect(-45,-22,90,44,8);
  spinBg.x=W/2;spinBg.y=ctrlY;spinBg.eventMode='static';spinBg.cursor='pointer';
  spinBg.on('pointerdown',doSpin);
  app.stage.addChild(spinBg);
  const spinTxt=new PIXI.Text('GIRAR',{fontFamily:'Georgia,serif',fontSize:16,fill:0x0a0800,fontWeight:'bold'});
  spinTxt.anchor.set(0.5);spinTxt.x=W/2;spinTxt.y=ctrlY-3;app.stage.addChild(spinTxt);
  const spinSub=new PIXI.Text('Mantener para Auto',{fontFamily:'monospace',fontSize:6,fill:0x0a0800});
  spinSub.anchor.set(0.5);spinSub.x=W/2;spinSub.y=ctrlY+12;app.stage.addChild(spinSub);

  // Bet +/-
  function mkBtn(label,x,fn){
    const g=new PIXI.Graphics();g.lineStyle(2,0x8b6914);g.beginFill(0x1a1200);
    g.drawRoundedRect(-20,-20,40,40,6);g.endFill();
    g.x=x;g.y=ctrlY;g.eventMode='static';g.cursor='pointer';g.on('pointerdown',fn);
    const t=new PIXI.Text(label,{fontSize:20,fill:0xf5d061,fontWeight:'bold'});
    t.anchor.set(0.5);g.addChild(t);app.stage.addChild(g);
  }
  mkBtn('−',W/2-80,()=>{if(betIdx>0&&!spinning){betIdx--;upd();}});
  mkBtn('+',W/2+80,()=>{if(betIdx<BET_LEVELS.length-1&&!spinning){betIdx++;upd();}});

  // Footer
  const credT=new PIXI.Text('CRÉDITOS\n'+fmt(credits),{fontFamily:'monospace',fontSize:10,fill:0xf5f0e8,align:'center'});
  credT.x=W*0.15;credT.y=H-35;credT.anchor.set(0.5,0);app.stage.addChild(credT);
  const chipT=new PIXI.Text('CHIPS\n'+fmt(chips),{fontFamily:'monospace',fontSize:10,fill:0xf5f0e8,align:'center'});
  chipT.anchor.set(0.5,0);chipT.x=W/2;chipT.y=H-35;app.stage.addChild(chipT);
  const vipT=new PIXI.Text('NIVEL\nVIP 10',{fontFamily:'monospace',fontSize:10,fill:0xf5f0e8,align:'center'});
  vipT.anchor.set(0.5,0);vipT.x=W*0.85;vipT.y=H-35;app.stage.addChild(vipT);


  // ===== UPDATE =====
  function upd(){
    infoVals['APUESTA'].text=fmt(bet());
    infoVals['APUESTA TOTAL'].text=fmt(totalBet());
    infoVals['GANANCIA'].text=fmt(lastWin);
    credT.text='CRÉDITOS\n'+fmt(credits);
    jpVal.text=fmt(jackpot);
    mVal.text='X'+multiplier;
    gVal.text=freeSpins>0?freeSpins.toString():'0';
  }

  // ===== SPIN =====
  function doSpin(){
    if(spinning)return;
    if(credits<totalBet()&&freeSpins<=0)return;
    initAudio(); spinning=true; lastWin=0;
    if(freeSpins>0){freeSpins--;}
    else{credits-=totalBet();jackpot+=Math.floor(totalBet()*0.01);}
    upd(); sfxSpin();

    // Target grid
    const grid=[];
    for(let c=0;c<REELS;c++){
      const col=[];for(let r=0;r<ROWS;r++)col.push(rSym());
      grid.push(col);
    }

    // Start reels
    reels.forEach((rl,i)=>{
      rl.spinning=true;rl.stopping=false;
      rl.speed=0;rl.target=grid[i];rl.bounce=0;
      setTimeout(()=>{rl.stopping=true;},350+i*160);
    });

    // Evaluate
    setTimeout(()=>{
      spinning=false;
      let tw=0;
      for(let li=0;li<LINES;li++){
        const line=PAYLINES[li].map((row,c)=>grid[c][row]);
        let tg=null;
        for(const s of line){if(s.id!=='wild'&&s.id!=='scatter'){tg=s.id;break;}}
        if(!tg){if(line.every(s=>s.id==='wild'))tg='wild';else continue;}
        let cnt=0;
        for(const s of line){if(s.id===tg||s.id==='wild')cnt++;else break;}
        if(cnt>=3){const sym=SYMBOLS.find(s=>s.id===tg);if(sym&&sym.pay[cnt])tw+=sym.pay[cnt]*bet();}
      }
      // Scatter
      let sc=0;
      for(let c=0;c<REELS;c++)for(let r=0;r<ROWS;r++)if(grid[c][r].id==='scatter')sc++;
      if(sc>=3){freeSpins+=sc>=5?25:sc>=4?15:10;multiplier=2;tw+=[0,0,0,5,20,100][sc]*totalBet();}
      // Modo Rugido
      if(tw>0&&Math.random()<0.05){const rm=[2,3,5,8,10][Math.floor(Math.random()*5)];tw*=rm;multiplier=rm;}
      // Jackpot
      if(Math.random()<0.0001&&freeSpins<=0){tw+=jackpot;jackpot=1000000;sfxBig();}
      if(tw>0){credits+=tw;lastWin=tw;winFx(tw);tw>=totalBet()*10?sfxBig():sfxWin();}
      upd();
      if(freeSpins>0){spinTxt.text='GRATIS';setTimeout(doSpin,1200);}
      else{multiplier=1;spinTxt.text='GIRAR';upd();}
    },350+(REELS-1)*160+400);
  }


  // ===== ANIMATION (ticker) =====
  app.ticker.add((delta)=>{
    // Jackpot tick
    if(Math.random()<0.003){jackpot+=Math.floor(Math.random()*50)+5;jpVal.text=fmt(jackpot);}

    for(let col=0;col<REELS;col++){
      const rl=reels[col];
      if(!rl.spinning&&!rl.stopping&&rl.bounce<=0)continue;

      if(rl.spinning&&!rl.stopping){
        // Accelerate downward
        rl.speed=Math.min(rl.speed+2*delta,28);
        for(const sp of rl.strips){
          sp.y+=rl.speed*delta;
          // Wrap: if below grid, jump to top
          if(sp.y>GY+GH+CELL){
            sp.y-=STRIP*CELL;
            const ns=rSym();
            sp.texture=texMap[ns.id];sp.symData=ns;
          }
        }
      } else if(rl.stopping){
        rl.speed*=0.82;
        if(rl.speed<0.5){
          // SNAP to exact positions
          rl.spinning=false;rl.stopping=false;rl.speed=0;
          for(let row=0;row<ROWS;row++){
            const sp=rl.strips[row+1]; // +1 = skip buffer
            sp.texture=texMap[rl.target[row].id];
            sp.symData=rl.target[row];
            sp.x=GX+col*CELL;
            sp.y=GY+row*CELL;
            sp.width=SYM;sp.height=SYM;
          }
          // Reset buffer sprites
          rl.strips[0].y=GY-CELL;
          rl.strips[0].x=GX+col*CELL;
          rl.strips[0].width=SYM;rl.strips[0].height=SYM;
          if(rl.strips[ROWS+1]){
            rl.strips[ROWS+1].y=GY+ROWS*CELL;
            rl.strips[ROWS+1].x=GX+col*CELL;
            rl.strips[ROWS+1].width=SYM;rl.strips[ROWS+1].height=SYM;
          }
          rl.bounce=1;
          sfxStop(col);
        } else {
          for(const sp of rl.strips){
            sp.y+=rl.speed*delta;
            if(sp.y>GY+GH+CELL){
              sp.y-=STRIP*CELL;
              const ns=rSym();
              sp.texture=texMap[ns.id];sp.symData=ns;
            }
          }
        }
      }

      // Bounce
      if(rl.bounce>0){
        rl.bounce-=0.04*delta;
        if(rl.bounce<=0)rl.bounce=0;
      }
    }
  });


  // ===== WIN EFFECTS =====
  function winFx(amt){
    const wt=new PIXI.Text('+'+fmt(amt),{fontFamily:'Georgia,serif',fontSize:24,fill:0xf5d061,fontWeight:'bold',stroke:0x000000,strokeThickness:3});
    wt.anchor.set(0.5);wt.x=W/2;wt.y=H*0.5;app.stage.addChild(wt);
    let t=0;
    const tick=()=>{t+=app.ticker.deltaMS;wt.y-=0.8;wt.alpha=1-t/2500;
      if(t>2500){app.stage.removeChild(wt);app.ticker.remove(tick);wt.destroy();}};
    app.ticker.add(tick);
    const coins=['🪙','💰','⭐','🦁'];
    for(let i=0;i<12;i++){
      setTimeout(()=>{
        const c=new PIXI.Text(coins[Math.floor(Math.random()*coins.length)],{fontSize:14+Math.random()*8});
        c.x=Math.random()*W;c.y=-20;app.stage.addChild(c);
        const sp=1.5+Math.random()*3;
        const ct=()=>{c.y+=sp;c.rotation+=0.02;if(c.y>H+20){app.stage.removeChild(c);app.ticker.remove(ct);c.destroy();}};
        app.ticker.add(ct);
      },i*60);
    }
  }

  // ===== KEYBOARD =====
  document.addEventListener('keydown',(e)=>{
    if(e.code==='Space'||e.code==='Enter'){e.preventDefault();doSpin();}
  });

  console.log('🦁 C8L Casino — El León Dorado v4.0 loaded');
} // end startGame

})();
