"""
🎬 HYPERFRAMES TEMPLATES — Plantillas de video pre-construidas
===============================================================
Templates listos para renderizar con variables personalizables.

Cada template es HTML válido para Hyperframes con:
- data-composition-id, data-start, data-width, data-height
- Clips con class="clip" + data-start + data-duration + data-track-index
- Animaciones GSAP seekable registradas en window.__timelines

Categorías:
- product_launch: Lanzamiento de producto
- social_promo: Promo para redes sociales
- announcement: Anuncio/comunicado
- intro: Intro/opener animado
- stats: Estadísticas animadas
- countdown: Cuenta regresiva
- text_reveal: Texto con reveal cinematográfico
- logo_sting: Animación de logo corta
- kinetic_type: Tipografía cinética
- neon_glow: Estilo neón/cyberpunk
"""

from typing import Dict, List, Optional


# ===========================================================================
# TEMPLATE REGISTRY
# ===========================================================================

TEMPLATES: Dict[str, Dict] = {}


def register_template(name: str, category: str, description: str,
                      html: str, duration: int, variables: List[str]):
    """Registra un template en el catálogo"""
    TEMPLATES[name] = {
        'name': name,
        'category': category,
        'description': description,
        'html': html,
        'duration': duration,
        'variables': variables
    }


def get_template(name: str) -> Optional[Dict]:
    """Obtiene un template por nombre"""
    return TEMPLATES.get(name)


def list_templates(category: str = None) -> List[Dict]:
    """Lista templates disponibles, opcionalmente filtrados por categoría"""
    if category:
        return [t for t in TEMPLATES.values() if t['category'] == category]
    return list(TEMPLATES.values())



# ===========================================================================
# TEMPLATE 1: PRODUCT LAUNCH — Lanzamiento de producto
# ===========================================================================

PRODUCT_LAUNCH_HTML = '''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: linear-gradient(135deg, #0f0c29, #302b63, #24243e); overflow: hidden; }
#stage { width: 1920px; height: 1080px; position: relative; font-family: 'Segoe UI', sans-serif; }
.title { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  font-size: 96px; font-weight: 900; color: #fff; text-align: center;
  text-shadow: 0 0 40px rgba(99, 102, 241, 0.8); }
.subtitle { position: absolute; top: 62%; left: 50%; transform: translateX(-50%);
  font-size: 42px; color: #a5b4fc; text-align: center; }
.cta { position: absolute; bottom: 15%; left: 50%; transform: translateX(-50%);
  font-size: 36px; color: #fff; background: linear-gradient(90deg, #6366f1, #8b5cf6);
  padding: 20px 60px; border-radius: 50px; font-weight: 700; }
.particles { position: absolute; width: 100%; height: 100%; }
.particle { position: absolute; width: 6px; height: 6px; background: #818cf8;
  border-radius: 50%; opacity: 0; }
</style>
</head>
<body>
<div id="stage" data-composition-id="product-launch" data-start="0"
     data-width="1920" data-height="1080">

  <div class="particles clip" data-start="0" data-duration="10" data-track-index="0">
    <div class="particle" style="left:10%;top:20%"></div>
    <div class="particle" style="left:30%;top:60%"></div>
    <div class="particle" style="left:50%;top:30%"></div>
    <div class="particle" style="left:70%;top:70%"></div>
    <div class="particle" style="left:90%;top:40%"></div>
    <div class="particle" style="left:20%;top:80%"></div>
    <div class="particle" style="left:60%;top:15%"></div>
    <div class="particle" style="left:80%;top:55%"></div>
  </div>

  <h1 class="title clip" data-start="0.5" data-duration="8" data-track-index="1">
    {{title}}
  </h1>

  <p class="subtitle clip" data-start="2" data-duration="6" data-track-index="2">
    {{subtitle}}
  </p>

  <div class="cta clip" data-start="4" data-duration="5" data-track-index="3">
    {{cta}}
  </div>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script>
    const tl = gsap.timeline({ paused: true });
    // Particles float in
    tl.to(".particle", { opacity: 0.6, y: -30, duration: 2, stagger: 0.2, ease: "power2.out" }, 0);
    // Title scale in
    tl.from(".title", { scale: 0.5, opacity: 0, duration: 1.2, ease: "back.out(1.7)" }, 0.5);
    // Subtitle fade in
    tl.from(".subtitle", { y: 30, opacity: 0, duration: 0.8, ease: "power2.out" }, 2);
    // CTA bounce in
    tl.from(".cta", { scale: 0, opacity: 0, duration: 0.6, ease: "back.out(2)" }, 4);
    // Particles continue floating
    tl.to(".particle", { y: -60, opacity: 0, duration: 3, stagger: 0.15 }, 6);

    window.__timelines = window.__timelines || {};
    window.__timelines["product-launch"] = tl;
  </script>
</div>
</body>
</html>'''

register_template(
    name="product_launch",
    category="marketing",
    description="Video de lanzamiento de producto con título, subtítulo y CTA animados",
    html=PRODUCT_LAUNCH_HTML,
    duration=10,
    variables=["title", "subtitle", "cta"]
)



# ===========================================================================
# TEMPLATE 2: SOCIAL PROMO — Promo para redes sociales (formato cuadrado)
# ===========================================================================

SOCIAL_PROMO_HTML = '''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #000; overflow: hidden; }
#stage { width: 1080px; height: 1080px; position: relative;
  font-family: 'Segoe UI', sans-serif;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); }
.headline { position: absolute; top: 20%; left: 10%; right: 10%;
  font-size: 72px; font-weight: 900; color: #fff; text-align: center;
  line-height: 1.1; }
.highlight { color: #e94560; }
.body-text { position: absolute; top: 55%; left: 15%; right: 15%;
  font-size: 36px; color: #ccc; text-align: center; line-height: 1.5; }
.badge { position: absolute; bottom: 12%; left: 50%; transform: translateX(-50%);
  background: #e94560; color: #fff; font-size: 32px; font-weight: 800;
  padding: 16px 48px; border-radius: 12px; }
.line-accent { position: absolute; top: 48%; left: 20%; right: 20%;
  height: 3px; background: linear-gradient(90deg, transparent, #e94560, transparent); }
</style>
</head>
<body>
<div id="stage" data-composition-id="social-promo" data-start="0"
     data-width="1080" data-height="1080">

  <h1 class="headline clip" data-start="0.3" data-duration="7" data-track-index="0">
    {{headline}}
  </h1>

  <div class="line-accent clip" data-start="1.5" data-duration="5.5" data-track-index="1"></div>

  <p class="body-text clip" data-start="2" data-duration="5" data-track-index="2">
    {{body}}
  </p>

  <div class="badge clip" data-start="3.5" data-duration="4" data-track-index="3">
    {{badge}}
  </div>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script>
    const tl = gsap.timeline({ paused: true });
    tl.from(".headline", { y: -60, opacity: 0, duration: 0.9, ease: "power3.out" }, 0.3);
    tl.from(".line-accent", { scaleX: 0, duration: 0.6, ease: "power2.inOut" }, 1.5);
    tl.from(".body-text", { y: 40, opacity: 0, duration: 0.8, ease: "power2.out" }, 2);
    tl.from(".badge", { scale: 0.3, opacity: 0, duration: 0.5, ease: "back.out(2)" }, 3.5);
    // Exit animations
    tl.to(".headline", { y: -40, opacity: 0, duration: 0.6 }, 6.5);
    tl.to(".body-text", { opacity: 0, duration: 0.4 }, 6.5);
    tl.to(".badge", { scale: 1.2, opacity: 0, duration: 0.5 }, 6.8);

    window.__timelines = window.__timelines || {};
    window.__timelines["social-promo"] = tl;
  </script>
</div>
</body>
</html>'''

register_template(
    name="social_promo",
    category="social",
    description="Promo cuadrada (1080x1080) para Instagram/TikTok con headline y badge",
    html=SOCIAL_PROMO_HTML,
    duration=8,
    variables=["headline", "body", "badge"]
)



# ===========================================================================
# TEMPLATE 3: ANNOUNCEMENT — Anuncio/comunicado oficial
# ===========================================================================

ANNOUNCEMENT_HTML = '''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0a0a0a; overflow: hidden; }
#stage { width: 1920px; height: 1080px; position: relative;
  font-family: 'Segoe UI', sans-serif;
  background: radial-gradient(ellipse at center, #1a1a3e 0%, #0a0a0a 70%); }
.announcement-badge { position: absolute; top: 15%; left: 50%; transform: translateX(-50%);
  font-size: 24px; letter-spacing: 8px; text-transform: uppercase;
  color: #fbbf24; font-weight: 700; }
.main-text { position: absolute; top: 35%; left: 10%; right: 10%;
  font-size: 80px; font-weight: 900; color: #fff; text-align: center;
  line-height: 1.15; }
.detail { position: absolute; top: 65%; left: 15%; right: 15%;
  font-size: 36px; color: #94a3b8; text-align: center; line-height: 1.6; }
.date-badge { position: absolute; bottom: 10%; left: 50%; transform: translateX(-50%);
  font-size: 28px; color: #fbbf24; border: 2px solid #fbbf24;
  padding: 12px 40px; border-radius: 8px; letter-spacing: 2px; }
.glow-ring { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 600px; height: 600px; border-radius: 50%;
  border: 1px solid rgba(251, 191, 36, 0.2); }
</style>
</head>
<body>
<div id="stage" data-composition-id="announcement" data-start="0"
     data-width="1920" data-height="1080">

  <div class="glow-ring clip" data-start="0" data-duration="8" data-track-index="0"></div>

  <div class="announcement-badge clip" data-start="0.5" data-duration="7" data-track-index="1">
    {{badge_text}}
  </div>

  <h1 class="main-text clip" data-start="1" data-duration="7" data-track-index="2">
    {{main_text}}
  </h1>

  <p class="detail clip" data-start="2.5" data-duration="5" data-track-index="3">
    {{detail}}
  </p>

  <div class="date-badge clip" data-start="4" data-duration="4.5" data-track-index="4">
    {{date}}
  </div>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script>
    const tl = gsap.timeline({ paused: true });
    tl.from(".glow-ring", { scale: 0, opacity: 0, duration: 1.5, ease: "power2.out" }, 0);
    tl.to(".glow-ring", { scale: 1.3, opacity: 0.1, duration: 6, ease: "linear" }, 1);
    tl.from(".announcement-badge", { y: -30, opacity: 0, duration: 0.7 }, 0.5);
    tl.from(".main-text", { scale: 0.8, opacity: 0, duration: 1, ease: "power3.out" }, 1);
    tl.from(".detail", { y: 30, opacity: 0, duration: 0.8 }, 2.5);
    tl.from(".date-badge", { scaleX: 0, opacity: 0, duration: 0.6, ease: "back.out(1.5)" }, 4);

    window.__timelines = window.__timelines || {};
    window.__timelines["announcement"] = tl;
  </script>
</div>
</body>
</html>'''

register_template(
    name="announcement",
    category="corporate",
    description="Anuncio oficial con badge dorado, texto principal y fecha",
    html=ANNOUNCEMENT_HTML,
    duration=9,
    variables=["badge_text", "main_text", "detail", "date"]
)



# ===========================================================================
# TEMPLATE 4: NEON GLOW — Estilo cyberpunk/neón
# ===========================================================================

NEON_GLOW_HTML = '''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0d0d0d; overflow: hidden; }
#stage { width: 1920px; height: 1080px; position: relative;
  font-family: 'Courier New', monospace; }
.grid { position: absolute; width: 100%; height: 100%;
  background-image: linear-gradient(rgba(0,255,255,0.05) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(0,255,255,0.05) 1px, transparent 1px);
  background-size: 60px 60px; }
.neon-title { position: absolute; top: 35%; left: 50%; transform: translateX(-50%);
  font-size: 100px; font-weight: 900; color: #0ff;
  text-shadow: 0 0 10px #0ff, 0 0 40px #0ff, 0 0 80px #08f;
  text-align: center; white-space: nowrap; }
.neon-sub { position: absolute; top: 55%; left: 50%; transform: translateX(-50%);
  font-size: 40px; color: #f0f;
  text-shadow: 0 0 10px #f0f, 0 0 30px #f0f;
  text-align: center; }
.scanline { position: absolute; width: 100%; height: 4px;
  background: rgba(0,255,255,0.15); top: 0; }
.corner { position: absolute; width: 60px; height: 60px; border: 2px solid #0ff; }
.corner.tl { top: 40px; left: 40px; border-right: none; border-bottom: none; }
.corner.tr { top: 40px; right: 40px; border-left: none; border-bottom: none; }
.corner.bl { bottom: 40px; left: 40px; border-right: none; border-top: none; }
.corner.br { bottom: 40px; right: 40px; border-left: none; border-top: none; }
</style>
</head>
<body>
<div id="stage" data-composition-id="neon-glow" data-start="0"
     data-width="1920" data-height="1080">

  <div class="grid clip" data-start="0" data-duration="8" data-track-index="0"></div>
  <div class="scanline clip" data-start="0" data-duration="8" data-track-index="1"></div>
  <div class="corner tl clip" data-start="0.2" data-duration="7" data-track-index="2"></div>
  <div class="corner tr clip" data-start="0.3" data-duration="7" data-track-index="2"></div>
  <div class="corner bl clip" data-start="0.4" data-duration="7" data-track-index="2"></div>
  <div class="corner br clip" data-start="0.5" data-duration="7" data-track-index="2"></div>

  <h1 class="neon-title clip" data-start="0.5" data-duration="7" data-track-index="3">
    {{title}}
  </h1>

  <p class="neon-sub clip" data-start="2" data-duration="5.5" data-track-index="4">
    {{subtitle}}
  </p>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script>
    const tl = gsap.timeline({ paused: true });
    // Scanline sweep
    tl.to(".scanline", { top: "100%", duration: 2, ease: "linear", repeat: 3 }, 0);
    // Corners fade in
    tl.from(".corner", { opacity: 0, scale: 0.5, duration: 0.5, stagger: 0.1 }, 0.2);
    // Title flicker on
    tl.from(".neon-title", { opacity: 0, duration: 0.1 }, 0.5);
    tl.to(".neon-title", { opacity: 0.3, duration: 0.05 }, 0.7);
    tl.to(".neon-title", { opacity: 1, duration: 0.05 }, 0.75);
    tl.to(".neon-title", { opacity: 0.5, duration: 0.05 }, 0.9);
    tl.to(".neon-title", { opacity: 1, duration: 0.1 }, 0.95);
    // Subtitle slide in
    tl.from(".neon-sub", { x: -100, opacity: 0, duration: 0.8, ease: "power2.out" }, 2);

    window.__timelines = window.__timelines || {};
    window.__timelines["neon-glow"] = tl;
  </script>
</div>
</body>
</html>'''

register_template(
    name="neon_glow",
    category="creative",
    description="Estilo cyberpunk/neón con grid, scanlines y glow effects",
    html=NEON_GLOW_HTML,
    duration=8,
    variables=["title", "subtitle"]
)



# ===========================================================================
# TEMPLATE 5: KINETIC TYPE — Tipografía cinética (palabras que aparecen)
# ===========================================================================

KINETIC_TYPE_HTML = '''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #111; overflow: hidden; }
#stage { width: 1920px; height: 1080px; position: relative;
  font-family: 'Arial Black', sans-serif; display: flex; align-items: center;
  justify-content: center; }
.word { position: absolute; font-size: 120px; font-weight: 900; color: #fff;
  text-transform: uppercase; opacity: 0; }
.w1 { top: 30%; left: 50%; transform: translateX(-50%); color: #ff6b6b; }
.w2 { top: 45%; left: 50%; transform: translateX(-50%); color: #ffd93d; }
.w3 { top: 60%; left: 50%; transform: translateX(-50%); color: #6bcb77; }
.w4 { top: 45%; left: 50%; transform: translateX(-50%); font-size: 160px; color: #fff;
  text-shadow: 0 0 30px rgba(255,255,255,0.5); }
</style>
</head>
<body>
<div id="stage" data-composition-id="kinetic-type" data-start="0"
     data-width="1920" data-height="1080">

  <div class="word w1 clip" data-start="0.3" data-duration="2" data-track-index="0">
    {{word1}}
  </div>
  <div class="word w2 clip" data-start="1.5" data-duration="2" data-track-index="1">
    {{word2}}
  </div>
  <div class="word w3 clip" data-start="2.7" data-duration="2" data-track-index="2">
    {{word3}}
  </div>
  <div class="word w4 clip" data-start="4" data-duration="3" data-track-index="3">
    {{word4}}
  </div>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script>
    const tl = gsap.timeline({ paused: true });
    // Word 1 - slam in from left
    tl.to(".w1", { opacity: 1, x: 0, duration: 0.15, ease: "power4.out" }, 0.3);
    tl.from(".w1", { x: -200, duration: 0.15, ease: "power4.out" }, 0.3);
    tl.to(".w1", { opacity: 0, scale: 0.8, duration: 0.3 }, 1.8);
    // Word 2 - scale up
    tl.to(".w2", { opacity: 1, scale: 1, duration: 0.2, ease: "back.out(2)" }, 1.5);
    tl.from(".w2", { scale: 3, duration: 0.2, ease: "back.out(2)" }, 1.5);
    tl.to(".w2", { opacity: 0, y: -50, duration: 0.3 }, 3);
    // Word 3 - rotate in
    tl.to(".w3", { opacity: 1, rotation: 0, duration: 0.2 }, 2.7);
    tl.from(".w3", { rotation: -15, duration: 0.2 }, 2.7);
    tl.to(".w3", { opacity: 0, duration: 0.3 }, 4.2);
    // Word 4 - final impact
    tl.to(".w4", { opacity: 1, scale: 1, duration: 0.3, ease: "elastic.out(1, 0.5)" }, 4);
    tl.from(".w4", { scale: 0, duration: 0.3, ease: "elastic.out(1, 0.5)" }, 4);

    window.__timelines = window.__timelines || {};
    window.__timelines["kinetic-type"] = tl;
  </script>
</div>
</body>
</html>'''

register_template(
    name="kinetic_type",
    category="creative",
    description="Tipografía cinética — 4 palabras con animaciones de impacto",
    html=KINETIC_TYPE_HTML,
    duration=7,
    variables=["word1", "word2", "word3", "word4"]
)



# ===========================================================================
# TEMPLATE 6: COUNTDOWN — Cuenta regresiva con impacto
# ===========================================================================

COUNTDOWN_HTML = '''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #000; overflow: hidden; }
#stage { width: 1920px; height: 1080px; position: relative;
  font-family: 'Arial Black', sans-serif; }
.number { position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%); font-size: 300px;
  font-weight: 900; color: #fff; opacity: 0; }
.n3 { color: #ef4444; }
.n2 { color: #f59e0b; }
.n1 { color: #10b981; }
.final-text { position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%); font-size: 100px;
  font-weight: 900; color: #fff; opacity: 0;
  text-shadow: 0 0 40px rgba(255,255,255,0.8); text-align: center; }
.ring { position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%); width: 400px; height: 400px;
  border-radius: 50%; border: 4px solid rgba(255,255,255,0.3); }
</style>
</head>
<body>
<div id="stage" data-composition-id="countdown" data-start="0"
     data-width="1920" data-height="1080">

  <div class="ring clip" data-start="0" data-duration="6" data-track-index="0"></div>
  <div class="number n3 clip" data-start="0.5" data-duration="1.5" data-track-index="1">3</div>
  <div class="number n2 clip" data-start="2" data-duration="1.5" data-track-index="2">2</div>
  <div class="number n1 clip" data-start="3.5" data-duration="1.5" data-track-index="3">1</div>
  <div class="final-text clip" data-start="5" data-duration="3" data-track-index="4">
    {{final_text}}
  </div>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script>
    const tl = gsap.timeline({ paused: true });
    // Ring pulse
    tl.to(".ring", { scale: 1.2, opacity: 0.5, duration: 0.5, repeat: 5, yoyo: true }, 0);
    // Number 3
    tl.to(".n3", { opacity: 1, scale: 1, duration: 0.2 }, 0.5);
    tl.from(".n3", { scale: 2, duration: 0.2 }, 0.5);
    tl.to(".n3", { opacity: 0, scale: 0.5, duration: 0.3 }, 1.5);
    // Number 2
    tl.to(".n2", { opacity: 1, scale: 1, duration: 0.2 }, 2);
    tl.from(".n2", { scale: 2, duration: 0.2 }, 2);
    tl.to(".n2", { opacity: 0, scale: 0.5, duration: 0.3 }, 3);
    // Number 1
    tl.to(".n1", { opacity: 1, scale: 1, duration: 0.2 }, 3.5);
    tl.from(".n1", { scale: 2, duration: 0.2 }, 3.5);
    tl.to(".n1", { opacity: 0, scale: 0.5, duration: 0.3 }, 4.5);
    // Final text explosion
    tl.to(".final-text", { opacity: 1, scale: 1, duration: 0.4, ease: "elastic.out(1, 0.4)" }, 5);
    tl.from(".final-text", { scale: 0.1, duration: 0.4, ease: "elastic.out(1, 0.4)" }, 5);
    tl.to(".ring", { scale: 3, opacity: 0, duration: 0.8 }, 5);

    window.__timelines = window.__timelines || {};
    window.__timelines["countdown"] = tl;
  </script>
</div>
</body>
</html>'''

register_template(
    name="countdown",
    category="creative",
    description="Cuenta regresiva 3-2-1 con explosión de texto final",
    html=COUNTDOWN_HTML,
    duration=8,
    variables=["final_text"]
)



# ===========================================================================
# TEMPLATE 7: STATS — Estadísticas animadas
# ===========================================================================

STATS_HTML = '''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0f172a; overflow: hidden; }
#stage { width: 1920px; height: 1080px; position: relative;
  font-family: 'Segoe UI', sans-serif; }
.stats-title { position: absolute; top: 8%; left: 50%; transform: translateX(-50%);
  font-size: 56px; font-weight: 800; color: #fff; text-align: center; }
.stat-card { position: absolute; background: rgba(30, 41, 59, 0.9);
  border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 20px;
  padding: 40px; text-align: center; width: 380px; }
.stat-card .number { font-size: 72px; font-weight: 900; color: #6366f1; }
.stat-card .label { font-size: 24px; color: #94a3b8; margin-top: 10px; }
.card1 { top: 30%; left: 8%; }
.card2 { top: 30%; left: 38%; }
.card3 { top: 30%; right: 8%; }
.card4 { bottom: 12%; left: 50%; transform: translateX(-50%); }
</style>
</head>
<body>
<div id="stage" data-composition-id="stats" data-start="0"
     data-width="1920" data-height="1080">

  <h1 class="stats-title clip" data-start="0.3" data-duration="9" data-track-index="0">
    {{title}}
  </h1>

  <div class="stat-card card1 clip" data-start="1" data-duration="7" data-track-index="1">
    <div class="number">{{stat1_value}}</div>
    <div class="label">{{stat1_label}}</div>
  </div>

  <div class="stat-card card2 clip" data-start="1.8" data-duration="6.5" data-track-index="2">
    <div class="number">{{stat2_value}}</div>
    <div class="label">{{stat2_label}}</div>
  </div>

  <div class="stat-card card3 clip" data-start="2.6" data-duration="6" data-track-index="3">
    <div class="number">{{stat3_value}}</div>
    <div class="label">{{stat3_label}}</div>
  </div>

  <div class="stat-card card4 clip" data-start="3.5" data-duration="5" data-track-index="4">
    <div class="number">{{stat4_value}}</div>
    <div class="label">{{stat4_label}}</div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script>
    const tl = gsap.timeline({ paused: true });
    tl.from(".stats-title", { y: -40, opacity: 0, duration: 0.8, ease: "power3.out" }, 0.3);
    tl.from(".card1", { x: -100, opacity: 0, duration: 0.7, ease: "power2.out" }, 1);
    tl.from(".card2", { y: 60, opacity: 0, duration: 0.7, ease: "power2.out" }, 1.8);
    tl.from(".card3", { x: 100, opacity: 0, duration: 0.7, ease: "power2.out" }, 2.6);
    tl.from(".card4", { y: 60, opacity: 0, duration: 0.7, ease: "back.out(1.5)" }, 3.5);

    window.__timelines = window.__timelines || {};
    window.__timelines["stats"] = tl;
  </script>
</div>
</body>
</html>'''

register_template(
    name="stats",
    category="data",
    description="4 tarjetas de estadísticas animadas con números grandes",
    html=STATS_HTML,
    duration=10,
    variables=["title", "stat1_value", "stat1_label", "stat2_value", "stat2_label",
               "stat3_value", "stat3_label", "stat4_value", "stat4_label"]
)


# ===========================================================================
# TEMPLATE 8: LOGO STING — Animación corta de logo/marca
# ===========================================================================

LOGO_STING_HTML = '''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #000; overflow: hidden; }
#stage { width: 1920px; height: 1080px; position: relative;
  font-family: 'Arial Black', sans-serif;
  display: flex; align-items: center; justify-content: center; }
.logo-text { position: absolute; top: 42%; left: 50%; transform: translate(-50%, -50%);
  font-size: 140px; font-weight: 900; color: #fff; letter-spacing: -4px;
  text-shadow: 0 0 60px rgba(99, 102, 241, 0.5); }
.tagline { position: absolute; top: 62%; left: 50%; transform: translateX(-50%);
  font-size: 32px; color: #a5b4fc; letter-spacing: 6px; text-transform: uppercase; }
.line-left { position: absolute; top: 54%; left: 5%; width: 35%; height: 2px;
  background: linear-gradient(90deg, transparent, #6366f1); }
.line-right { position: absolute; top: 54%; right: 5%; width: 35%; height: 2px;
  background: linear-gradient(-90deg, transparent, #6366f1); }
.flash { position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: #fff; opacity: 0; }
</style>
</head>
<body>
<div id="stage" data-composition-id="logo-sting" data-start="0"
     data-width="1920" data-height="1080">

  <div class="flash clip" data-start="0" data-duration="4" data-track-index="0"></div>
  <div class="line-left clip" data-start="0.5" data-duration="3.5" data-track-index="1"></div>
  <div class="line-right clip" data-start="0.5" data-duration="3.5" data-track-index="1"></div>

  <div class="logo-text clip" data-start="0.3" data-duration="4" data-track-index="2">
    {{brand}}
  </div>

  <p class="tagline clip" data-start="1.5" data-duration="2.5" data-track-index="3">
    {{tagline}}
  </p>

  <script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
  <script>
    const tl = gsap.timeline({ paused: true });
    // Flash
    tl.to(".flash", { opacity: 0.8, duration: 0.05 }, 0.25);
    tl.to(".flash", { opacity: 0, duration: 0.3 }, 0.3);
    // Logo slam
    tl.from(".logo-text", { scale: 3, opacity: 0, duration: 0.3, ease: "power4.out" }, 0.3);
    // Lines expand
    tl.from(".line-left", { scaleX: 0, transformOrigin: "right", duration: 0.5 }, 0.5);
    tl.from(".line-right", { scaleX: 0, transformOrigin: "left", duration: 0.5 }, 0.5);
    // Tagline
    tl.from(".tagline", { opacity: 0, y: 20, duration: 0.6 }, 1.5);
    // Exit
    tl.to(".logo-text, .tagline, .line-left, .line-right",
      { opacity: 0, duration: 0.5 }, 3.5);

    window.__timelines = window.__timelines || {};
    window.__timelines["logo-sting"] = tl;
  </script>
</div>
</body>
</html>'''

register_template(
    name="logo_sting",
    category="branding",
    description="Animación corta de logo/marca con flash y líneas (4 segundos)",
    html=LOGO_STING_HTML,
    duration=4,
    variables=["brand", "tagline"]
)


# ===========================================================================
# HELPER: VideoTemplates class para acceso OOP
# ===========================================================================

class VideoTemplates:
    """Clase de acceso a las plantillas de video"""

    @staticmethod
    def get(name: str) -> Optional[Dict]:
        return get_template(name)

    @staticmethod
    def list_all() -> List[Dict]:
        return list_templates()

    @staticmethod
    def list_by_category(category: str) -> List[Dict]:
        return list_templates(category)

    @staticmethod
    def get_categories() -> List[str]:
        cats = set(t['category'] for t in TEMPLATES.values())
        return sorted(cats)

    @staticmethod
    def get_names() -> List[str]:
        return sorted(TEMPLATES.keys())

    @staticmethod
    def get_summary() -> str:
        """Resumen de templates para mostrar al usuario"""
        lines = ["🎬 *PLANTILLAS DE VIDEO DISPONIBLES:*\n"]
        by_cat = {}
        for t in TEMPLATES.values():
            by_cat.setdefault(t['category'], []).append(t)

        emoji_map = {
            'marketing': '🚀', 'social': '📱', 'corporate': '🏢',
            'creative': '🎨', 'data': '📊', 'branding': '✨'
        }

        for cat, templates in sorted(by_cat.items()):
            emoji = emoji_map.get(cat, '🎬')
            lines.append(f"{emoji} *{cat.upper()}*")
            for t in templates:
                vars_str = ", ".join(t['variables'][:3])
                lines.append(f"  • `{t['name']}` — {t['description']}")
                lines.append(f"    Variables: {vars_str}")
            lines.append("")

        lines.append("💡 Usa: /video template <nombre> var1=valor1 var2=valor2")
        return "\n".join(lines)
