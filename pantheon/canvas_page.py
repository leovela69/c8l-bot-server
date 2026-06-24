# -*- coding: utf-8 -*-
"""
🎨 CANVAS PAGE — Generador del Editor Visual Web
Genera HTML completo de un editor de fotos tipo Canva/Photoshop
que se sirve como página web desde el bot.
"""


def generate_canvas_html(page_id="canvas", preload_image=""):
    """
    Genera el HTML completo del Canvas Editor.

    Args:
        page_id: ID único de la página
        preload_image: Data URL de imagen para precargar (opcional)

    Returns:
        str: HTML completo del editor
    """
    # Use .replace() for the dynamic parts to avoid f-string issues with CSS/JS braces
    html = CANVAS_TEMPLATE.replace("{{PAGE_ID}}", page_id)
    html = html.replace("{{PRELOAD_IMAGE}}", preload_image or "")
    return html


CANVAS_TEMPLATE = r'''<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>C8L Design Studio</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0a0a1a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden;height:100vh}
.app{display:flex;flex-direction:column;height:100vh}
.header{background:linear-gradient(135deg,#1a0033,#0d001a);padding:8px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #333}
.header h1{font-size:16px;background:linear-gradient(90deg,#ff00ff,#ffd700);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.toolbar{background:#111;padding:8px;display:flex;gap:4px;flex-wrap:wrap;border-bottom:1px solid #222;align-items:center}
.toolbar button{background:#222;border:1px solid #444;color:#fff;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:12px;transition:all 0.2s}
.toolbar button:hover{background:#333;border-color:#ff00ff}
.toolbar button.active{background:#ff00ff33;border-color:#ff00ff;color:#ff00ff}
.toolbar select,.toolbar input[type=range]{background:#222;border:1px solid #444;color:#fff;padding:4px 8px;border-radius:4px}
.workspace{flex:1;display:flex;overflow:hidden}
.canvas-area{flex:1;display:flex;align-items:center;justify-content:center;background:#0d0d1a;position:relative}
canvas{max-width:100%;max-height:100%;border:1px solid #333;cursor:crosshair}
.sidebar{width:200px;background:#111;border-left:1px solid #222;padding:12px;overflow-y:auto}
.sidebar h3{font-size:12px;color:#888;margin:12px 0 6px;text-transform:uppercase}
.sidebar button{width:100%;background:#1a1a2e;border:1px solid #333;color:#fff;padding:8px;border-radius:6px;cursor:pointer;margin:3px 0;font-size:11px;text-align:left}
.sidebar button:hover{background:#2a2a4e;border-color:#ff00ff}
.filter-grid{display:grid;grid-template-columns:1fr 1fr;gap:4px}
.slider-group{margin:8px 0}
.slider-group label{font-size:11px;color:#aaa;display:block;margin-bottom:4px}
.slider-group input{width:100%}
.download-btn{background:linear-gradient(135deg,#ff00ff,#8b00ff)!important;border:none!important;padding:12px!important;font-weight:bold;font-size:14px!important;text-align:center!important;margin-top:12px!important}
.upload-area{border:2px dashed #444;border-radius:8px;padding:20px;text-align:center;cursor:pointer;margin:8px 0}
.upload-area:hover{border-color:#ff00ff}
@media(max-width:768px){.sidebar{display:none}.toolbar{overflow-x:auto;flex-wrap:nowrap}}
</style>
</head>
<body>
<div class="app">
<div class="header">
  <h1>C8L Design Studio</h1>
  <span style="font-size:11px;color:#666">ID: {{PAGE_ID}}</span>
</div>
<div class="toolbar">
  <button onclick="uploadImage()" title="Subir foto">📁 Subir</button>
  <button onclick="setTool('draw')" id="btn-draw" title="Dibujar">✏️</button>
  <button onclick="setTool('text')" id="btn-text" title="Texto">T</button>
  <button onclick="setTool('eraser')" id="btn-eraser" title="Borrador">🧹</button>
  <button onclick="cropSquare()" title="Recortar cuadrado">⬜</button>
  <button onclick="rotateCanvas()" title="Rotar">🔄</button>
  <button onclick="flipCanvas()" title="Voltear">↔️</button>
  <button onclick="undo()" title="Deshacer">↩️</button>
  <select id="brushSize" onchange="changeBrush()">
    <option value="2">Fino</option><option value="5" selected>Normal</option>
    <option value="12">Grueso</option><option value="25">Extra</option>
  </select>
  <input type="color" id="colorPicker" value="#ff00ff" onchange="changeColor()" title="Color">
</div>
<div class="workspace">
  <div class="canvas-area">
    <canvas id="canvas" width="1024" height="1024"></canvas>
  </div>
  <div class="sidebar">
    <div class="upload-area" onclick="uploadImage()">📸 Toca para subir foto</div>
    <h3>Filtros</h3>
    <div class="filter-grid">
      <button onclick="applyFilter('grayscale')">B&W</button>
      <button onclick="applyFilter('sepia')">Sepia</button>
      <button onclick="applyFilter('neon')">Neon</button>
      <button onclick="applyFilter('vintage')">Vintage</button>
      <button onclick="applyFilter('blur')">Blur</button>
      <button onclick="applyFilter('sharpen')">Sharpen</button>
      <button onclick="applyFilter('invert')">Invertir</button>
      <button onclick="applyFilter('emboss')">Relieve</button>
      <button onclick="applyFilter('warm')">Cálido</button>
      <button onclick="applyFilter('cool')">Frío</button>
      <button onclick="applyFilter('retro')">Retro</button>
      <button onclick="applyFilter('dramatic')">Drama</button>
    </div>
    <h3>Ajustes</h3>
    <div class="slider-group"><label>Brillo</label><input type="range" id="brightness" min="-100" max="100" value="0" oninput="applyAdjustments()"></div>
    <div class="slider-group"><label>Contraste</label><input type="range" id="contrast" min="-100" max="100" value="0" oninput="applyAdjustments()"></div>
    <div class="slider-group"><label>Saturación</label><input type="range" id="saturation" min="-100" max="100" value="0" oninput="applyAdjustments()"></div>
    <h3>Stickers</h3>
    <div class="filter-grid">
      <button onclick="addSticker('⭐')">⭐</button><button onclick="addSticker('🔥')">🔥</button>
      <button onclick="addSticker('💜')">💜</button><button onclick="addSticker('🦁')">🦁</button>
      <button onclick="addSticker('👑')">👑</button><button onclick="addSticker('🎵')">🎵</button>
    </div>
    <button class="download-btn" onclick="downloadImage()">⬇️ Descargar HD</button>
    <button class="download-btn" style="background:linear-gradient(135deg,#00c853,#009688)!important;margin-top:6px!important" onclick="resetCanvas()">🗑️ Limpiar</button>
  </div>
</div>
</div>

<script>
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let currentTool = 'draw';
let isDrawing = false;
let brushSize = 5;
let brushColor = '#ff00ff';
let history = [];
let originalImageData = null;

const preloadImg = '{{PRELOAD_IMAGE}}';
if (preloadImg && preloadImg.length > 10) {
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width; canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    saveState(); originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  };
  img.src = preloadImg;
} else {
  ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#555'; ctx.font = '24px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Sube una foto para empezar', canvas.width/2, canvas.height/2);
  saveState();
}

function saveState() { history.push(canvas.toDataURL()); if (history.length > 30) history.shift(); }
function undo() {
  if (history.length > 1) { history.pop();
    const img = new Image(); img.onload = () => { ctx.drawImage(img, 0, 0); }; img.src = history[history.length-1];
  }
}
function setTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.toolbar button').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('btn-'+tool); if(btn) btn.classList.add('active');
}
function changeBrush() { brushSize = parseInt(document.getElementById('brushSize').value); }
function changeColor() { brushColor = document.getElementById('colorPicker').value; }

canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', endDraw);
canvas.addEventListener('touchstart', e => { e.preventDefault(); startDraw(getTouchPos(e)); });
canvas.addEventListener('touchmove', e => { e.preventDefault(); draw(getTouchPos(e)); });
canvas.addEventListener('touchend', e => { e.preventDefault(); endDraw(); });

function getTouchPos(e) {
  const rect = canvas.getBoundingClientRect(); const touch = e.touches[0];
  const scaleX = canvas.width/rect.width; const scaleY = canvas.height/rect.height;
  return { offsetX: (touch.clientX-rect.left)*scaleX, offsetY: (touch.clientY-rect.top)*scaleY };
}
function startDraw(e) {
  if (currentTool==='text') { addText(e); return; }
  isDrawing = true; ctx.beginPath(); ctx.moveTo(e.offsetX||e.x, e.offsetY||e.y);
}
function draw(e) {
  if (!isDrawing) return;
  const x = e.offsetX!==undefined ? e.offsetX : e.x;
  const y = e.offsetY!==undefined ? e.offsetY : e.y;
  ctx.lineWidth = brushSize; ctx.lineCap = 'round';
  ctx.strokeStyle = currentTool==='eraser' ? '#1a1a2e' : brushColor;
  ctx.lineTo(x, y); ctx.stroke();
}
function endDraw() { isDrawing = false; saveState(); }

function addText(e) {
  const text = prompt('Escribe el texto:'); if(!text) return;
  const x = e.offsetX||canvas.width/2; const y = e.offsetY||canvas.height/2;
  ctx.font = 'bold '+(brushSize*6)+'px sans-serif'; ctx.fillStyle = brushColor;
  ctx.textAlign = 'center'; ctx.shadowColor = brushColor; ctx.shadowBlur = 10;
  ctx.fillText(text, x, y); ctx.shadowBlur = 0; saveState();
}
function addSticker(emoji) {
  ctx.font = (brushSize*10)+'px serif'; ctx.textAlign = 'center';
  ctx.fillText(emoji, canvas.width/2, canvas.height/2); saveState();
}

function applyFilter(filter) {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  switch(filter) {
    case 'grayscale':
      for(let i=0;i<data.length;i+=4){const a=(data[i]+data[i+1]+data[i+2])/3;data[i]=data[i+1]=data[i+2]=a;} break;
    case 'sepia':
      for(let i=0;i<data.length;i+=4){const r=data[i],g=data[i+1],b=data[i+2];data[i]=Math.min(255,r*.393+g*.769+b*.189);data[i+1]=Math.min(255,r*.349+g*.686+b*.168);data[i+2]=Math.min(255,r*.272+g*.534+b*.131);} break;
    case 'neon':
      for(let i=0;i<data.length;i+=4){data[i]=Math.min(255,data[i]*1.5);data[i+1]=data[i+1]*0.7;data[i+2]=Math.min(255,data[i+2]*1.8);} break;
    case 'vintage':
      for(let i=0;i<data.length;i+=4){data[i]=Math.min(255,data[i]*1.1+20);data[i+1]=data[i+1]*0.9+10;data[i+2]=data[i+2]*0.7;} break;
    case 'invert':
      for(let i=0;i<data.length;i+=4){data[i]=255-data[i];data[i+1]=255-data[i+1];data[i+2]=255-data[i+2];} break;
    case 'warm':
      for(let i=0;i<data.length;i+=4){data[i]=Math.min(255,data[i]+15);data[i+2]=Math.max(0,data[i+2]-15);} break;
    case 'cool':
      for(let i=0;i<data.length;i+=4){data[i]=Math.max(0,data[i]-15);data[i+2]=Math.min(255,data[i+2]+15);} break;
    case 'retro':
      for(let i=0;i<data.length;i+=4){data[i]=Math.min(255,data[i]*1.2);data[i+1]=data[i+1]*0.8;data[i+2]=Math.min(255,data[i+2]*1.3);} break;
    case 'dramatic':
      for(let i=0;i<data.length;i+=4){const a=(data[i]+data[i+1]+data[i+2])/3;const f=a>128?1.3:0.7;data[i]*=f;data[i+1]*=f;data[i+2]*=f;} break;
    case 'sharpen':
      for(let i=0;i<data.length;i+=4){data[i]=Math.min(255,Math.max(0,(data[i]-128)*1.3+128));data[i+1]=Math.min(255,Math.max(0,(data[i+1]-128)*1.3+128));data[i+2]=Math.min(255,Math.max(0,(data[i+2]-128)*1.3+128));} break;
    case 'emboss':
      for(let i=0;i<data.length-4;i+=4){data[i]=Math.min(255,Math.abs(data[i]-data[i+4])+128);data[i+1]=Math.min(255,Math.abs(data[i+1]-data[i+5])+128);data[i+2]=Math.min(255,Math.abs(data[i+2]-data[i+6])+128);} break;
    case 'blur':
      ctx.putImageData(imageData,0,0); ctx.filter='blur(3px)'; ctx.drawImage(canvas,0,0); ctx.filter='none'; saveState(); return;
  }
  ctx.putImageData(imageData, 0, 0); saveState();
}

function applyAdjustments() {
  if (!originalImageData) return;
  const b=parseInt(document.getElementById('brightness').value);
  const c=parseInt(document.getElementById('contrast').value);
  const s=parseInt(document.getElementById('saturation').value);
  const src=originalImageData.data;
  const imageData=ctx.createImageData(canvas.width,canvas.height);
  const data=imageData.data; const cf=(259*(c+255))/(255*(259-c));
  for(let i=0;i<src.length;i+=4){
    let r=src[i]+b,g=src[i+1]+b,bl=src[i+2]+b;
    r=cf*(r-128)+128;g=cf*(g-128)+128;bl=cf*(bl-128)+128;
    const avg=(r+g+bl)/3;const sf=1+s/100;
    r=avg+sf*(r-avg);g=avg+sf*(g-avg);bl=avg+sf*(bl-avg);
    data[i]=Math.min(255,Math.max(0,r));data[i+1]=Math.min(255,Math.max(0,g));
    data[i+2]=Math.min(255,Math.max(0,bl));data[i+3]=src[i+3];
  }
  ctx.putImageData(imageData, 0, 0);
}

function rotateCanvas() {
  const d=canvas.toDataURL(); const img=new Image();
  img.onload=()=>{const t=canvas.width;canvas.width=canvas.height;canvas.height=t;ctx.translate(canvas.width,0);ctx.rotate(Math.PI/2);ctx.drawImage(img,0,0);ctx.setTransform(1,0,0,1,0,0);saveState();};
  img.src=d;
}
function flipCanvas() {
  const d=canvas.toDataURL(); const img=new Image();
  img.onload=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);ctx.scale(-1,1);ctx.drawImage(img,-canvas.width,0);ctx.setTransform(1,0,0,1,0,0);saveState();};
  img.src=d;
}
function cropSquare() {
  const size=Math.min(canvas.width,canvas.height);
  const x=(canvas.width-size)/2,y=(canvas.height-size)/2;
  const d=ctx.getImageData(x,y,size,size);canvas.width=size;canvas.height=size;
  ctx.putImageData(d,0,0);saveState();
}
function resetCanvas() {
  if(confirm('Limpiar todo?')){ctx.fillStyle='#1a1a2e';ctx.fillRect(0,0,canvas.width,canvas.height);history=[];originalImageData=null;saveState();}
}
function uploadImage() {
  const input=document.createElement('input');input.type='file';input.accept='image/*';
  input.onchange=e=>{const file=e.target.files[0];if(!file)return;
    const reader=new FileReader();reader.onload=ev=>{
      const img=new Image();img.onload=()=>{
        const scale=Math.min(2048/img.width,2048/img.height,1);
        canvas.width=img.width*scale;canvas.height=img.height*scale;
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        originalImageData=ctx.getImageData(0,0,canvas.width,canvas.height);saveState();
      };img.src=ev.target.result;
    };reader.readAsDataURL(file);
  };input.click();
}
function downloadImage() {
  const link=document.createElement('a');link.download='c8l_design_'+Date.now()+'.png';
  link.href=canvas.toDataURL('image/png');link.click();
}
canvas.addEventListener('dragover',e=>e.preventDefault());
canvas.addEventListener('drop',e=>{e.preventDefault();const file=e.dataTransfer.files[0];
  if(file&&file.type.startsWith('image/')){const reader=new FileReader();
    reader.onload=ev=>{const img=new Image();img.onload=()=>{canvas.width=img.width;canvas.height=img.height;ctx.drawImage(img,0,0);originalImageData=ctx.getImageData(0,0,canvas.width,canvas.height);saveState();};img.src=ev.target.result;};reader.readAsDataURL(file);}
});
</script>
</body></html>'''
