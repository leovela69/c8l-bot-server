# -*- coding: utf-8 -*-
"""
🖥️ HEFESTO — Bot Esclavo 5 (Diseno / Frontend)
Genera codigo HTML/CSS/JS, landing pages y disenos UI.
"El Disenador de C8L"

Skills: popular-web-designs, claude-design, architecture-diagram, concept-diagrams
"""

import logging
import time
from openrouter_client import call_openrouter

logger = logging.getLogger("c8l.hefesto")

HEFESTO_SYSTEM_PROMPT = """You are HEFESTO, a world-class frontend developer for C8L Agency.
Generate COMPLETE, WORKING HTML files with inline CSS and JS.

ABSOLUTE RULES:
- Output ONLY the HTML code, nothing else
- Start with <!DOCTYPE html>
- All CSS must be in <style> tags
- All JS must be in <script> tags
- Dark theme with neon accents (#FF00FF magenta, #00FFFF cyan, #FFD700 gold)
- Mobile responsive
- NO explanations, NO markdown, NO code blocks (```)
- The code must work when opened in a browser"""


class Hefesto:
    """Bot Disenador — Frontend y UI."""

    def _generate_with_retry(self, prompt, max_tokens=6000):
        """Genera codigo con retry y logging."""
        logger.info(f"Hefesto generando: {prompt[:80]}")

        # Intento 1: modelo asignado
        result = call_openrouter(prompt, HEFESTO_SYSTEM_PROMPT, agent_name="hefesto",
                                 temperature=0.7, max_tokens=max_tokens)

        if result:
            cleaned = self._clean_code(result)
            if cleaned and len(cleaned) > 50:
                logger.info("Hefesto: generacion OK (intento 1)")
                return cleaned

        # Intento 2: prompt más directo, temperatura baja
        logger.warning("Hefesto: intento 1 fallo, reintentando...")
        time.sleep(1)
        retry_prompt = f"""OUTPUT ONLY HTML CODE. START WITH <!DOCTYPE html>. NO EXPLANATIONS.

{prompt}

REMEMBER: Only output the raw HTML code. Nothing else. Start now:
<!DOCTYPE html>"""

        result = call_openrouter(retry_prompt, HEFESTO_SYSTEM_PROMPT, agent_name="hefesto",
                                 temperature=0.4, max_tokens=max_tokens)
        if result:
            cleaned = self._clean_code(result)
            if cleaned and len(cleaned) > 50:
                logger.info("Hefesto: generacion OK (intento 2)")
                return cleaned

        # Intento 3: usar modelo fallback directamente
        logger.warning("Hefesto: intento 2 fallo, usando fallback...")
        time.sleep(1)
        result = call_openrouter(retry_prompt,
                                 "Generate ONLY HTML code. Start with <!DOCTYPE html>. No text.",
                                 agent_name="fallback",
                                 temperature=0.3, max_tokens=max_tokens)
        if result:
            cleaned = self._clean_code(result)
            if cleaned and len(cleaned) > 50:
                logger.info("Hefesto: generacion OK (fallback)")
                return cleaned

        # Si TODO falla, generar un HTML mínimo como respuesta
        logger.error("Hefesto: todos los intentos fallaron, usando template mínimo")
        return self._generate_minimal_html(prompt)

    def _generate_minimal_html(self, description):
        """Genera un HTML mínimo COMPLETO cuando la IA falla."""
        # Limpiar el prompt del description (no mostrar instrucciones)
        clean_desc = description.replace("Create a complete landing page HTML file.", "")
        clean_desc = clean_desc.replace("Topic:", "").replace("Style:", "").strip()
        clean_desc = clean_desc.split("Include:")[0].strip()
        if not clean_desc:
            clean_desc = "Producción Musical y Tecnología"

        return f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>C8L Agency — {clean_desc[:30]}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ background: #0a0a1a; color: white; font-family: 'Segoe UI', sans-serif; overflow-x: hidden; }}
        .hero {{ min-height: 100vh; display: flex; align-items: center; justify-content: center;
                 flex-direction: column; text-align: center; padding: 40px 20px;
                 background: radial-gradient(circle at 50% 50%, rgba(128,0,255,0.1) 0%, transparent 70%); }}
        h1 {{ font-size: clamp(2rem, 8vw, 4rem); font-weight: 900;
             background: linear-gradient(135deg, #ff00ff, #00ffff, #ffd700);
             -webkit-background-clip: text; -webkit-text-fill-color: transparent;
             margin-bottom: 20px; text-shadow: 0 0 40px rgba(255,0,255,0.3); }}
        .subtitle {{ color: #aaa; font-size: 1.2rem; max-width: 600px; margin-bottom: 40px; line-height: 1.6; }}
        .features {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 30px; padding: 60px 40px; max-width: 1200px; margin: 0 auto; }}
        .card {{ background: rgba(255,255,255,0.03); border: 1px solid rgba(255,0,255,0.2);
                border-radius: 16px; padding: 30px; text-align: center;
                transition: transform 0.3s, box-shadow 0.3s; }}
        .card:hover {{ transform: translateY(-5px); box-shadow: 0 10px 40px rgba(255,0,255,0.2); }}
        .card h3 {{ color: #ff00ff; margin: 15px 0; font-size: 1.3rem; }}
        .card p {{ color: #888; line-height: 1.5; }}
        .card .icon {{ font-size: 2.5rem; }}
        .btn {{ display: inline-block; padding: 18px 50px;
               background: linear-gradient(135deg, #ff00ff, #8b00ff);
               color: white; border: none; border-radius: 50px; font-size: 1.1rem;
               cursor: pointer; text-decoration: none; font-weight: 600;
               transition: transform 0.3s, box-shadow 0.3s;
               box-shadow: 0 5px 30px rgba(255,0,255,0.4); }}
        .btn:hover {{ transform: scale(1.05); box-shadow: 0 8px 40px rgba(255,0,255,0.6); }}
        footer {{ text-align: center; padding: 40px; color: #555; border-top: 1px solid rgba(255,255,255,0.05); }}
        footer a {{ color: #ff00ff; text-decoration: none; }}
    </style>
</head>
<body>
    <section class="hero">
        <h1>C8L Agency</h1>
        <p class="subtitle">{clean_desc[:150]}</p>
        <a href="#" class="btn">Comenzar</a>
    </section>
    <section class="features">
        <div class="card">
            <div class="icon">🎵</div>
            <h3>Producción Musical</h3>
            <p>Beats, mezcla y master profesional con estilo Bolero-House único.</p>
        </div>
        <div class="card">
            <div class="icon">🎨</div>
            <h3>Diseño Visual</h3>
            <p>Identidad visual, logos y contenido con estética neon futurista.</p>
        </div>
        <div class="card">
            <div class="icon">🚀</div>
            <h3>Tecnología</h3>
            <p>Bots con IA, automatización y herramientas digitales de vanguardia.</p>
        </div>
    </section>
    <footer>
        <p>© 2026 <a href="#">C8L Agency</a> — El Panteón Digital</p>
    </footer>
</body>
</html>"""

    def create_landing(self, description, style="c8l"):
        """Genera landing page FUNCIONAL completa + link para verla online."""
        if not description or description.strip() == "":
            description = "landing page para C8L Agency - produccion musical y tecnologia"

        # Prompt más corto y directo (DeepSeek falla con prompts largos)
        prompt = f"""<!DOCTYPE html>
<html lang="es">
<!-- Generate a COMPLETE working landing page about: {description}
     Dark theme, neon purple/cyan/gold accents, responsive.
     Must include: hero, features/products, CTA button, footer.
     Make it SPECIFIC to the topic (not generic). -->"""

        result = self._generate_with_retry(prompt, max_tokens=6000)
        if result:
            html_code = self._clean_code(result)
            # Verificar que es HTML real y no el prompt repetido
            if len(html_code) > 500 and "<body" in html_code.lower():
                url = self._upload_to_hosting(html_code, "c8l_landing")
                caption = f"🖥️ Landing: {description[:60]}"
                if url:
                    caption += f"\n\n🌐 Ver online: {url}"
                return {"type": "file", "content": html_code.encode("utf-8"),
                        "filename": "c8l_landing.html", "caption": caption,
                        "preview_html": html_code, "url": url}

        # Fallback: generar landing específica basada en el tema
        logger.warning("Hefesto: usando template específico")
        html_code = self._generate_specific_template(description)
        url = self._upload_to_hosting(html_code, "c8l_landing")
        caption = f"🖥️ Landing: {description[:60]}"
        if url:
            caption += f"\n\n🌐 Ver online: {url}"
        return {"type": "file", "content": html_code.encode("utf-8"),
                "filename": "c8l_landing.html", "caption": caption, "url": url}

    def _generate_specific_template(self, description):
        """Genera template específico basado en el tema (cuando la IA falla)."""
        desc_lower = description.lower()

        # Detectar tipo de landing y generar contenido apropiado
        if any(kw in desc_lower for kw in ["beat", "beats", "musica", "music", "producer"]):
            title = "C8L Beats Store"
            subtitle = "Los mejores beats Bolero-House para tu próximo hit"
            cards = [
                ("🎵", "Beats Premium", "$29.99", "Licencia básica — MP3 + WAV"),
                ("🔥", "Beats Exclusivos", "$149.99", "Licencia exclusiva — Stems incluidos"),
                ("🎧", "Pack Producer", "$79.99", "5 beats + efectos + samples"),
            ]
            cta = "Escuchar Catálogo"
        elif any(kw in desc_lower for kw in ["gaming", "juego", "game", "esport"]):
            title = "C8L Gaming"
            subtitle = "Torneos, ranking y comunidad gamer"
            cards = [
                ("🎮", "Torneos Semanales", "GRATIS", "Compite y gana C8L Coins"),
                ("🏆", "Ranking Global", "ELO", "Demuestra tu nivel"),
                ("💰", "Premios Reales", "$$", "Los mejores ganan recompensas"),
            ]
            cta = "Unirse Ahora"
        elif any(kw in desc_lower for kw in ["tienda", "shop", "store", "venta"]):
            title = "C8L Shop"
            subtitle = "Merch exclusivo de la agencia"
            cards = [
                ("👕", "Camisetas", "$24.99", "Diseño neon exclusivo"),
                ("🧢", "Gorras", "$19.99", "Logo bordado premium"),
                ("🎧", "Accesorios", "$14.99", "Stickers, pins, posters"),
            ]
            cta = "Ver Catálogo"
        else:
            title = "C8L Agency"
            subtitle = description[:100]
            cards = [
                ("🎵", "Música", "Pro", "Producción Bolero-House"),
                ("🎨", "Diseño", "Premium", "Identidad visual futurista"),
                ("🚀", "Tech", "IA", "Bots y automatización"),
            ]
            cta = "Contactar"

        cards_html = ""
        for icon, name, price, desc in cards:
            cards_html += f"""
        <div class="card">
            <div class="icon">{icon}</div>
            <h3>{name}</h3>
            <div class="price">{price}</div>
            <p>{desc}</p>
            <a href="#" class="card-btn">Ver más</a>
        </div>"""

        return f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ background: #0a0a1a; color: white; font-family: 'Segoe UI', sans-serif; overflow-x: hidden; }}
        .hero {{ min-height: 80vh; display: flex; align-items: center; justify-content: center;
                 flex-direction: column; text-align: center; padding: 60px 20px;
                 background: radial-gradient(ellipse at 50% 0%, rgba(128,0,255,0.15) 0%, transparent 60%); }}
        h1 {{ font-size: clamp(2.5rem, 10vw, 5rem); font-weight: 900;
             background: linear-gradient(135deg, #ff00ff, #00ffff, #ffd700);
             -webkit-background-clip: text; -webkit-text-fill-color: transparent;
             margin-bottom: 20px; animation: glow 3s ease-in-out infinite alternate; }}
        @keyframes glow {{ from {{ filter: drop-shadow(0 0 20px rgba(255,0,255,0.5)); }}
                          to {{ filter: drop-shadow(0 0 40px rgba(0,255,255,0.5)); }} }}
        .subtitle {{ color: #aaa; font-size: 1.3rem; max-width: 600px; margin-bottom: 40px; line-height: 1.6; }}
        .btn {{ display: inline-block; padding: 18px 50px;
               background: linear-gradient(135deg, #ff00ff, #8b00ff);
               color: white; border: none; border-radius: 50px; font-size: 1.1rem;
               cursor: pointer; text-decoration: none; font-weight: 700;
               transition: all 0.3s; box-shadow: 0 5px 30px rgba(255,0,255,0.4); }}
        .btn:hover {{ transform: translateY(-3px) scale(1.05); box-shadow: 0 10px 50px rgba(255,0,255,0.6); }}
        .products {{ padding: 80px 40px; max-width: 1200px; margin: 0 auto; }}
        .products h2 {{ text-align: center; font-size: 2rem; margin-bottom: 50px; color: #00ffff; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; }}
        .card {{ background: rgba(255,255,255,0.03); border: 1px solid rgba(255,0,255,0.2);
                border-radius: 20px; padding: 40px 30px; text-align: center;
                transition: all 0.3s; position: relative; overflow: hidden; }}
        .card::before {{ content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
                        background: linear-gradient(90deg, #ff00ff, #00ffff); opacity: 0; transition: opacity 0.3s; }}
        .card:hover {{ transform: translateY(-8px); box-shadow: 0 20px 60px rgba(255,0,255,0.15); }}
        .card:hover::before {{ opacity: 1; }}
        .card .icon {{ font-size: 3rem; margin-bottom: 15px; }}
        .card h3 {{ color: white; margin: 10px 0; font-size: 1.4rem; }}
        .card .price {{ color: #ffd700; font-size: 1.8rem; font-weight: 900; margin: 10px 0; }}
        .card p {{ color: #888; line-height: 1.5; margin-bottom: 20px; }}
        .card-btn {{ display: inline-block; padding: 10px 25px; border: 1px solid #ff00ff;
                    color: #ff00ff; border-radius: 25px; text-decoration: none;
                    transition: all 0.3s; font-size: 0.9rem; }}
        .card-btn:hover {{ background: #ff00ff; color: white; }}
        footer {{ text-align: center; padding: 50px 20px; color: #555;
                 border-top: 1px solid rgba(255,255,255,0.05); margin-top: 60px; }}
        footer a {{ color: #ff00ff; text-decoration: none; }}
        @media (max-width: 768px) {{ .hero {{ padding: 40px 15px; min-height: 60vh; }}
            .products {{ padding: 40px 15px; }} }}
    </style>
</head>
<body>
    <section class="hero">
        <h1>{title}</h1>
        <p class="subtitle">{subtitle}</p>
        <a href="#products" class="btn">{cta}</a>
    </section>
    <section class="products" id="products">
        <h2>Nuestros Productos</h2>
        <div class="grid">{cards_html}
        </div>
    </section>
    <footer>
        <p>© 2026 <a href="#">C8L Agency</a> — Panteón Digital</p>
        <p style="margin-top:10px;font-size:0.8rem;color:#333;">Generado por @leon_leo_bot</p>
    </footer>
</body>
</html>"""

    def create_game(self, description):
        """Genera juego web HTML5 FUNCIONAL + link para jugar online."""
        if not description or description.strip() == "":
            description = "snake game retro con neon"

        prompt = f"""<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>C8L Game - {description[:30]}</title>
<style>*{{margin:0;padding:0}}body{{background:#0a0a1a;overflow:hidden;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;font-family:sans-serif;color:white}}</style>
</head><body>
<!-- COMPLETE THIS HTML5 GAME: {description}
MUST HAVE: Canvas/DOM game, controls (keyboard/touch), score display, game over + restart button.
Make it FUN and PLAYABLE. All JS inline in script tags. Neon colors (#ff00ff, #00ffff).
CONTINUE THE CODE FROM HERE: -->"""

        result = self._generate_with_retry(prompt, max_tokens=8000)
        if result:
            html_code = self._clean_code(result)
            if len(html_code) > 300 and "<script" in html_code.lower():
                url = self._upload_to_hosting(html_code, "c8l_game")
                caption = f"🎮 Juego: {description[:60]}"
                if url:
                    caption += f"\n\n🕹️ Jugar online: {url}"
                return {"type": "file", "content": html_code.encode("utf-8"),
                        "filename": "c8l_game.html", "caption": caption, "url": url}

        # Fallback: Snake game 100% funcional
        html_code = self._snake_game_fallback()
        url = self._upload_to_hosting(html_code, "c8l_game")
        caption = "🎮 Snake Game C8L"
        if url:
            caption += f"\n\n🕹️ Jugar: {url}"
        return {"type": "file", "content": html_code.encode("utf-8"),
                "filename": "c8l_game.html", "caption": caption, "url": url}

    def _snake_game_fallback(self):
        """Snake funcional como fallback cuando la IA falla."""
        return """<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>C8L Snake</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0a0a1a;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:white}
canvas{border:2px solid #ff00ff;box-shadow:0 0 30px rgba(255,0,255,0.3);border-radius:8px;max-width:95vw;max-height:70vh}
#ui{margin:15px 0;font-size:1.3rem;color:#00ffff}h1{color:#ff00ff;margin-bottom:5px}
#msg{color:#ffd700;margin-top:10px;font-size:1rem}</style></head><body>
<h1>C8L Snake</h1><div id="ui">Score: <span id="sc">0</span></div>
<canvas id="c" width="400" height="400"></canvas><div id="msg">Flechas o WASD para mover | R reiniciar</div>
<script>const c=document.getElementById('c'),x=c.getContext('2d');let s=[{x:200,y:200}],d={x:20,y:0},f={x:100,y:100},sc=0,run=true,spd=100;
function draw(){if(!run)return;x.fillStyle='#0a0a1a';x.fillRect(0,0,400,400);x.fillStyle='#ff00ff';x.shadowBlur=8;x.shadowColor='#ff00ff';x.fillRect(f.x,f.y,18,18);x.shadowBlur=0;
s.forEach((p,i)=>{x.fillStyle=i?'#00aa88':'#00ffff';x.fillRect(p.x+1,p.y+1,16,16)});
let h={x:s[0].x+d.x,y:s[0].y+d.y};if(h.x<0||h.x>=400||h.y<0||h.y>=400||s.some(p=>p.x===h.x&&p.y===h.y)){run=false;document.getElementById('msg').textContent='GAME OVER! Pulsa R';return}
s.unshift(h);if(h.x===f.x&&h.y===f.y){sc+=10;document.getElementById('sc').textContent=sc;f={x:Math.floor(Math.random()*20)*20,y:Math.floor(Math.random()*20)*20};if(spd>50)spd-=2}else s.pop();
setTimeout(draw,spd)}document.onkeydown=e=>{let k=e.key.toLowerCase();if((k==='arrowup'||k==='w')&&d.y===0){d={x:0,y:-20}}
if((k==='arrowdown'||k==='s')&&d.y===0){d={x:0,y:20}}if((k==='arrowleft'||k==='a')&&d.x===0){d={x:-20,y:0}}
if((k==='arrowright'||k==='d')&&d.x===0){d={x:20,y:0}}if(k==='r'){s=[{x:200,y:200}];d={x:20,y:0};sc=0;spd=100;
document.getElementById('sc').textContent='0';document.getElementById('msg').textContent='Flechas o WASD para mover | R reiniciar';run=true;draw()}};draw();</script></body></html>"""

    def create_component(self, description):
        """Genera componente UI + link."""
        prompt = f"""Create a modern UI component: {description}
Complete HTML file with inline CSS. Dark theme + neon accents.
Start with <!DOCTYPE html>"""

        result = self._generate_with_retry(prompt, max_tokens=4000)
        if result:
            html_code = self._clean_code(result)
            url = self._upload_to_hosting(html_code, "c8l_component")
            caption = f"🧩 Componente: {description[:60]}"
            if url:
                caption += f"\n\n🌐 Ver: {url}"
            return {"type": "file", "content": html_code.encode("utf-8"),
                    "filename": "c8l_component.html", "caption": caption, "url": url}
        return {"type": "error", "content": "No pude generar el componente."}

    def _upload_to_hosting(self, html_code, name="page"):
        """Sirve el HTML desde el propio bot (self-hosting en memoria).
        URL: https://c8l-bot-server.onrender.com/pages/ID"""
        import hashlib
        import os
        from config import BASE_DIR

        # Generar ID único para esta página
        page_id = hashlib.md5((html_code[:100] + str(time.time())).encode()).hexdigest()[:8]

        # Guardar en disco
        pages_dir = os.path.join(BASE_DIR, "data", "pages")
        os.makedirs(pages_dir, exist_ok=True)
        page_path = os.path.join(pages_dir, f"{page_id}.html")
        with open(page_path, "w", encoding="utf-8") as f:
            f.write(html_code)

        # También guardar en memoria global del bot (para acceso inmediato)
        try:
            import whatsapp_bot
            if hasattr(whatsapp_bot, '_generated_pages'):
                whatsapp_bot._generated_pages[page_id] = html_code
        except:
            pass

        logger.info(f"Página guardada: {page_id}")
        return f"https://c8l-bot-server.onrender.com/pages/{page_id}"

    def _clean_code(self, text):
        """Limpia markdown y extrae HTML puro."""
        if not text:
            return ""
        # Quitar bloques markdown
        if text.startswith("```"):
            lines = text.split("\n")
            lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines)
        # Si hay ``` en medio, quitarlos
        text = text.replace("```html", "").replace("```", "")
        # Buscar inicio de HTML
        if "<!DOCTYPE" in text:
            idx = text.find("<!DOCTYPE")
            text = text[idx:]
        elif "<html" in text:
            idx = text.find("<html")
            text = text[idx:]
        return text.strip()
