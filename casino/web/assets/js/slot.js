/**
 * C8L CASINO - EL LEON DORADO - PixiJS Slot
 */
const app = new PIXI.Application({resizeTo:window,backgroundColor:0x080500,antialias:true});
document.body.appendChild(app.view);

const REELS=5,ROWS=3,BET_LEVELS=[10,25,50,100,250,500,1000,2500,5000];
const SYMS=[
  {id:'leon',icon:'🦁',color:0xd4a017,w:3},
  {id:'wild',icon:'❤️‍🔥',color:0xc0392b,w:2},
  {id:'scatter',icon:'👑',color:0x9b59b6,w:2},
  {id:'bot',icon:'🤖',color:0x2980b9,w:4},
  {id:'villano',icon:'😈',color:0x922b21,w:3},
  {id:'c8l',icon:'🎰',color:0xb7950b,w:3},
  {id:'corazon',icon:'💛',color:0xe74c3c,w:6},
  {id:'micro',icon:'🎤',color:0x7f8c8d,w:6},
  {id:'corona',icon:'👑',color:0xf39c12,w:7},
  {id:'estrella',icon:'⭐',color:0xf1c40f,w:8},
  {id:'nota',icon:'🎵',color:0x8e44ad,w:9},
];
const PT={leon:{5:500,4:100,3:25},wild:{5:1000,4:200,3:50},scatter:{5:100,4:20,3:5},bot:{5:80,4:20,3:8},villano:{5:60,4:18,3:6},c8l:{5:150,4:40,3:12},corazon:{5:40,4:12,3:4},micro:{5:35,4:10,3:3},corona:{5:30,4:8,3:3},estrella:{5:20,4:6,3:2},nota:{5:15,4:5,3:2}};
const PL=[[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,0],[2,1,1,1,2],[1,0,1,2,1],[1,2,1,0,1],[0,0,1,0,0],[2,2,1,2,2],[0,1,0,1,0],[2,1,2,1,2],[1,0,1,0,1],[1,2,1,2,1],[0,1,2,2,1]];

let credits=152450000,chips=8250,betIdx=4,lastWin=0,jackpot=48532120,spinning=false;
function bet(){return BET_LEVELS[betIdx];}
function total(){return bet()*20;}
function fmt(n){return n.toLocaleString('es-ES');}
function rSym(){const t=SYMS.reduce((s,d)=>s+d.w,0);let r=Math.random()*t;for(const d of SYMS){r-=d.w;if(r<=0)return d;}return SYMS[SYMS.length-1];}

const sw=app.screen.width,sh=app.screen.height;
const symSz=Math.min(Math.floor((sw*0.86)/REELS)-6,90);
const rW=symSz+6,totW=REELS*rW,rH=symSz*ROWS+12;
const ox=(sw-totW)/2,oy=sh*0.22;

// TEXTURES
const tex={};
SYMS.forEach(sym=>{
  const c=new PIXI.Container();
  const bg=new PIXI.Graphics();
  bg.beginFill(0x0d0a00);bg.lineStyle(3,sym.color,0.9);bg.drawRoundedRect(0,0,100,100,12);bg.endFill();
  bg.beginFill(sym.color,0.08);bg.drawRoundedRect(4,4,92,92,10);bg.endFill();
  c.addChild(bg);
  const t=new PIXI.Text(sym.icon,{fontSize:46});t.anchor.set(0.5);t.x=50;t.y=50;c.addChild(t);
  tex[sym.id]=app.renderer.generateTexture(c);c.destroy({children:true});
});

// BG + TITLE
const bgG=new PIXI.Graphics();bgG.beginFill(0x080500);bgG.drawRect(0,0,sw,sh);bgG.endFill();app.stage.addChild(bgG);
const gl=new PIXI.Graphics();gl.beginFill(0x1a1200,0.3);gl.drawEllipse(sw/2,oy-10,sw*0.4,80);gl.endFill();app.stage.addChild(gl);
const t1=new PIXI.Text('C8L LEGENDS',{fontFamily:'serif',fontSize:Math.min(sw*0.05,24),fill:0xf5d061,fontWeight:'bold'});t1.anchor.set(0.5,0);t1.x=sw/2;t1.y=6;app.stage.addChild(t1);
const t2=new PIXI.Text('EL LEÓN DORADO',{fontFamily:'monospace',fontSize:Math.min(sw*0.02,9),fill:0xd4a017});t2.anchor.set(0.5,0);t2.x=sw/2;t2.y=t1.y+t1.height+1;app.stage.addChild(t2);
const jl=new PIXI.Text('JACKPOT GLOBAL',{fontFamily:'monospace',fontSize:8,fill:0xd4a017});jl.anchor.set(0.5,0);jl.x=sw/2;jl.y=sh*0.09;app.stage.addChild(jl);
const jt=new PIXI.Text(fmt(jackpot),{fontFamily:'monospace',fontSize:Math.min(sw*0.055,26),fill:0xf5d061,fontWeight:'bold'});jt.anchor.set(0.5,0);jt.x=sw/2;jt.y=sh*0.11;app.stage.addChild(jt);

// FRAME
const fr=new PIXI.Graphics();fr.lineStyle(3,0xd4a017);fr.beginFill(0x050300,0.9);fr.drawRoundedRect(ox-10,oy-10,totW+20,rH+20,12);fr.endFill();fr.lineStyle(1,0xf5d061,0.3);fr.drawRoundedRect(ox-14,oy-14,totW+28,rH+28,14);app.stage.addChild(fr);

// REELS
const reels=[];
const mask=new PIXI.Graphics();mask.beginFill(0xffffff);mask.drawRoundedRect(ox-4,oy-4,totW+8,rH+8,8);mask.endFill();app.stage.addChild(mask);
for(let i=0;i<REELS;i++){
  const rc=new PIXI.Container();rc.mask=mask;
  const syms=[];
  for(let j=-1;j<=ROWS;j++){
    const d=rSym();
    const sp=new PIXI.Sprite(tex[d.id]);sp.width=symSz;sp.height=symSz;
    sp.x=ox+i*rW;sp.y=oy+j*(symSz+4);sp.sid=d.id;
    rc.addChild(sp);syms.push(sp);
  }
  app.stage.addChild(rc);
  reels.push({rc:rc,syms:syms,spd:0,spin:false,stop:false,tgt:null,bnc:0});
}
const pln=new PIXI.Graphics();pln.lineStyle(2,0xf5d061,0.25);pln.moveTo(ox-6,oy+rH/2);pln.lineTo(ox+totW+6,oy+rH/2);app.stage.addChild(pln);

// CONTROLS
const cy=sh*0.76,by=sh*0.87;
const vt={};
[{l:'LÍNEAS',v:'20',x:sw*0.12},{l:'APUESTA',v:fmt(bet()),x:sw*0.32},{l:'TOTAL',v:fmt(total()),x:sw*0.52},{l:'GANANCIA',v:'0',x:sw*0.8}].forEach(function(o){
  var a=new PIXI.Text(o.l,{fontFamily:'monospace',fontSize:8,fill:0xd4a017});a.anchor.set(0.5,0);a.x=o.x;a.y=cy;app.stage.addChild(a);
  var b=new PIXI.Text(o.v,{fontFamily:'monospace',fontSize:13,fill:0xf5f0e8,fontWeight:'bold'});b.anchor.set(0.5,0);b.x=o.x;b.y=cy+12;app.stage.addChild(b);
  vt[o.l]=b;
});
var sb=new PIXI.Graphics();sb.beginFill(0xd4a017);sb.drawCircle(0,0,28);sb.endFill();sb.lineStyle(3,0xf5d061);sb.drawCircle(0,0,28);sb.x=sw/2;sb.y=by;sb.eventMode='static';sb.cursor='pointer';sb.on('pointerdown',doSpin);app.stage.addChild(sb);
var sbt=new PIXI.Text('GIRAR',{fontFamily:'monospace',fontSize:10,fill:0x0a0a0a,fontWeight:'bold'});sbt.anchor.set(0.5);sbt.x=sw/2;sbt.y=by;app.stage.addChild(sbt);
function mkB(l,x,fn){var g=new PIXI.Graphics();g.beginFill(0x1a1200);g.lineStyle(2,0x8b6914);g.drawCircle(0,0,16);g.endFill();g.x=x;g.y=by;g.eventMode='static';g.cursor='pointer';g.on('pointerdown',fn);var t=new PIXI.Text(l,{fontSize:16,fill:0xf5d061,fontWeight:'bold'});t.anchor.set(0.5);g.addChild(t);app.stage.addChild(g);}
mkB('-',sw/2-65,function(){if(betIdx>0){betIdx--;upd();}});
mkB('+',sw/2+65,function(){if(betIdx<BET_LEVELS.length-1){betIdx++;upd();}});
var crt=new PIXI.Text('🪙 '+fmt(credits),{fontFamily:'monospace',fontSize:11,fill:0xf5f0e8});crt.x=10;crt.y=sh-20;app.stage.addChild(crt);
var cht=new PIXI.Text('💎 '+fmt(chips),{fontFamily:'monospace',fontSize:11,fill:0xf5f0e8});cht.anchor.set(0.5,0);cht.x=sw/2;cht.y=sh-20;app.stage.addChild(cht);
var vpt=new PIXI.Text('⭐ VIP 10',{fontFamily:'monospace',fontSize:11,fill:0xf5f0e8});vpt.anchor.set(1,0);vpt.x=sw-10;vpt.y=sh-20;app.stage.addChild(vpt);

// UPDATE
function upd(){vt['APUESTA'].text=fmt(bet());vt['TOTAL'].text=fmt(total());vt['GANANCIA'].text=fmt(lastWin);crt.text='🪙 '+fmt(credits);jt.text=fmt(jackpot);}

// SPIN
function doSpin(){
  if(spinning)return;if(credits<total())return;
  spinning=true;lastWin=0;credits-=total();upd();
  var grid=[];for(var r=0;r<REELS;r++){var col=[];for(var j=0;j<ROWS;j++)col.push(rSym());grid.push(col);}
  reels.forEach(function(rl,i){rl.spin=true;rl.stop=false;rl.spd=0;rl.tgt=grid[i];rl.bnc=0;setTimeout(function(){rl.stop=true;},500+i*200);});
  setTimeout(function(){spinning=false;
    var tw=0;for(var li=0;li<20;li++){var line=PL[li].map(function(row,r){return grid[r][row];});var tg=null;for(var k=0;k<line.length;k++){if(line[k].id!=='wild'&&line[k].id!=='scatter'){tg=line[k].id;break;}}if(!tg){var allW=true;for(var k=0;k<line.length;k++){if(line[k].id!=='wild'){allW=false;break;}}if(allW)tg='wild';else continue;}var cnt=0;for(var k=0;k<5;k++){if(line[k].id===tg||line[k].id==='wild')cnt++;else break;}if(cnt>=3&&PT[tg]){var m=PT[tg][cnt]||0;if(m>0)tw+=m*bet();}}
    jackpot+=Math.floor(total()*0.01);if(tw>0){credits+=tw;lastWin=tw;winFx(tw);}upd();
  },500+(REELS-1)*200+400);
}

// ANIMATION
app.ticker.add(function(d){
  if(Math.random()<0.003){jackpot+=Math.floor(Math.random()*60)+10;jt.text=fmt(jackpot);}
  var symH=symSz+4;
  for(var ri=0;ri<reels.length;ri++){
    var rl=reels[ri];
    if(!rl.spin&&!rl.stop&&rl.bnc<=0)continue;
    if(rl.spin&&!rl.stop){
      rl.spd=Math.min(rl.spd+1.5*d,35);
      for(var si=0;si<rl.syms.length;si++){var s=rl.syms[si];s.y+=rl.spd*d;s.scale.y=1+(rl.spd/35)*0.12;s.scale.x=1-(rl.spd/35)*0.04;if(s.y>oy+rH+symH){s.y-=symH*(ROWS+2);var ns=rSym();s.texture=tex[ns.id];s.sid=ns.id;}}
    }else if(rl.stop){
      rl.spd*=0.88;
      if(rl.spd<0.8){rl.spin=false;rl.stop=false;rl.spd=0;
        if(rl.tgt){for(var row=0;row<rl.tgt.length;row++){var sp=rl.syms[row+1];if(sp){sp.texture=tex[rl.tgt[row].id];sp.sid=rl.tgt[row].id;sp.y=oy+row*symH;sp.scale.y=0.85;sp.scale.x=1.1;}}}
        rl.bnc=1;
      }else{for(var si=0;si<rl.syms.length;si++){var s=rl.syms[si];s.y+=rl.spd*d;s.scale.y=1+(rl.spd/35)*0.06;s.scale.x=1-(rl.spd/35)*0.02;if(s.y>oy+rH+symH){s.y-=symH*(ROWS+2);var ns=rSym();s.texture=tex[ns.id];s.sid=ns.id;}}}
    }
    if(rl.bnc>0){rl.bnc-=0.05*d;if(rl.bnc<=0){rl.bnc=0;for(var si=0;si<rl.syms.length;si++){rl.syms[si].scale.y=1;rl.syms[si].scale.x=1;}}else{var b=Math.sin(rl.bnc*Math.PI*3)*rl.bnc*0.12;for(var si=0;si<rl.syms.length;si++){rl.syms[si].scale.y=1+b;rl.syms[si].scale.x=1-b*0.3;}}}
  }
});

// WIN FX
function winFx(amt){
  var wt=new PIXI.Text('+'+fmt(amt),{fontFamily:'monospace',fontSize:22,fill:0xf5d061,fontWeight:'bold',stroke:0x000000,strokeThickness:3});
  wt.anchor.set(0.5);wt.x=sw/2;wt.y=sh*0.5;app.stage.addChild(wt);
  var time=0;var tk=function(){time+=app.ticker.deltaMS;wt.y-=0.7;wt.alpha=1-time/2000;if(time>2000){app.stage.removeChild(wt);app.ticker.remove(tk);wt.destroy();}};app.ticker.add(tk);
  for(var i=0;i<10;i++){(function(i){setTimeout(function(){var c=new PIXI.Text(['🪙','💰','⭐'][Math.floor(Math.random()*3)],{fontSize:16+Math.random()*10});c.x=Math.random()*sw;c.y=-15;app.stage.addChild(c);var sp=2+Math.random()*3;var ct=function(){c.y+=sp;c.rotation+=0.03;if(c.y>sh+20){app.stage.removeChild(c);app.ticker.remove(ct);c.destroy();}};app.ticker.add(ct);},i*50);})(i);}
}

// AUDIO
var bgA=null,aInit=false;
function iAud(){if(aInit)return;aInit=true;bgA=new Audio('assets/audio/bg1.mp3');bgA.loop=true;bgA.volume=0.25;bgA.play().catch(function(){});}
document.addEventListener('pointerdown',iAud,{once:true});
document.addEventListener('touchstart',iAud,{once:true});
console.log('C8L Casino Loaded');
