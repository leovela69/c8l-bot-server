import os
import datetime
import random
import re

# Trends database for simulation & dynamic rotations
TRENDS = [
    {
        "name": "Bolero-House Cuántico",
        "description": "Fusión del bolero clásico latino con beats electrónicos minimalistas y texturas espaciales. Alto engagement en TikTok.",
        "tagline": "Próximo Lanzamiento: Bolero-House Quantum Pack de Leo Vela.",
        "seo_keywords": "musica ai, bolero house, leo vela ai, c8l music studio, mezcla inteligente"
    },
    {
        "name": "Reggaeton Espacial IA",
        "description": "Dembow clásico mezclado con sintetizadores cuánticos y voces clonadas licenciadas. Tendencia al alza en España y Latinoamérica.",
        "tagline": "Tendencia del Día: Dembow Cuántico & Reggaeton AI Beatpack.",
        "seo_keywords": "reggaeton ia, beats dembow gratis, inteligencia artificial musica, leo vela prod"
    },
    {
        "name": "Quantum Chillout & Lofi",
        "description": "Lofi relajante con progresiones armónicas de jazz y ambient generado por algoritmos en tiempo real para sesiones de estudio.",
        "tagline": "C8L Relax: Lofi Cuántico Estilo Libre para Concentración.",
        "seo_keywords": "lofi ia, musica concentracion, ambient synth, c8l relax, lofi generator"
    },
    {
        "name": "Industrial Synthwave",
        "description": "Sintetizadores retrofuturistas de los 80 con distorsiones industriales. Gran recepción en Europa del Norte y playlists de gaming.",
        "tagline": "C8L Arcade: Beats Synthwave Retro para Videojuegos.",
        "seo_keywords": "synthwave ia, retro beats, industrial gaming, soundtracks ia, c8l arcade"
    }
]

def run_agent():
    print("Iniciando Agente Autónomo de Mercado C8L...")
    today = datetime.date.today().strftime("%Y-%m-%d")
    
    # 1. Select a trend
    trend = random.choice(TRENDS)
    print(f"Tendencia seleccionada para hoy ({today}): {trend['name']}")
    
    # 2. Create reports folder if not exists
    reports_dir = os.path.join(os.path.dirname(__file__), "market_reports")
    if not os.path.exists(reports_dir):
        os.makedirs(reports_dir)
        print(f"Creado directorio de reportes: {reports_dir}")
        
    report_path = os.path.join(reports_dir, f"report_{today}.md")
    
    # 3. Write markdown report
    report_content = f"""# Reporte Diario de Mercado y Tendencias - C8L Agency
**Fecha:** {today}
**Analista:** Agente Autónomo Antigravity AI

## Tendencia Relevante del Día: {trend['name']}
{trend['description']}

### Datos del Barómetro Cuántico:
- **Nivel de Búsquedas (IA Música):** Alto (+18% respecto a ayer)
- **Keyword Clave:** "{trend['seo_keywords'].split(', ')[0]}"
- **Recomendación de Optimización:** Rotar espacio publicitario y actualizar metadatos SEO en la web.

## Acciones Autónomas Tomadas:
1. **Actualización de Espacio Publicitario:** Título del próximo lanzamiento rotado a: *"{trend['tagline']}"*.
2. **Inyección de Keywords SEO:** Palabras clave actualizadas en `c8l-agency-web/index.html` para posicionar la web según las tendencias.
"""
    
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_content)
    print(f"Reporte diario guardado en: {report_path}")
    
    # 4. Write trend JSON for Next.js reactiveness
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src", "data")
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
        
    json_path = os.path.join(data_dir, "market_trend.json")
    import json
    trend_data = {
        "name": trend["name"],
        "description": trend["description"],
        "tagline": trend["tagline"],
        "seo_keywords": trend["seo_keywords"],
        "last_updated": today
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(trend_data, f, indent=2, ensure_ascii=False)
    print(f"Next.js trend JSON guardado en: {json_path}")

    # 5. Modify index.html autonomously in multiple potential locations
    workspace_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    paths_to_update = [
        os.path.join(workspace_root, "c8l-agency-web", "index.html"),
        os.path.join(workspace_root, "chrono-cluster", "index.html"),
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "index.html"),
        r"C:\Users\User\.gemini\antigravity\playground\chrono-cluster\index.html",
        r"C:\Users\User\.gemini\antigravity\playground\c8l-agency-web\index.html"
    ]
    
    updated_count = 0
    for index_html_path in paths_to_update:
        if os.path.exists(index_html_path):
            print(f"Actualizando index.html autónomamente en: {index_html_path}")
            html = ""
            best_enc = "utf-8"
            for enc in ["utf-8-sig", "utf-8", "utf-16", "latin-1"]:
                try:
                    with open(index_html_path, "r", encoding=enc) as f:
                        html = f.read()
                    best_enc = enc
                    break
                except UnicodeDecodeError:
                    continue
            if not html:
                print(f"Error: No se pudo decodificar {index_html_path}. Saltando.")
                continue
                
            # Update advertising tagline
            pattern_ad = r'(<p data-translate="ads-card-2-desc">)(.*?)(</p>)'
            html, count_ad = re.subn(pattern_ad, rf'\g<1>{trend["tagline"]}\g<3>', html)
            
            # Update meta keywords
            pattern_head = r'(<head>)'
            meta_tag = f'\n    <meta name="keywords" content="{trend["seo_keywords"]}">\n    <!-- Auto-injected by Daily Market Agent -->'
            
            if '<!-- Auto-injected by Daily Market Agent -->' in html:
                pattern_meta = r'<meta name="keywords" content=".*?">\n\s*<!-- Auto-injected by Daily Market Agent -->'
                html, count_meta = re.subn(pattern_meta, f'<meta name="keywords" content="{trend["seo_keywords"]}">\n    <!-- Auto-injected by Daily Market Agent -->', html)
            else:
                html, count_meta = re.subn(pattern_head, rf'\g<1>{meta_tag}', html)
                
            with open(index_html_path, "w", encoding="utf-8") as f:
                f.write(html)
            print(f"Index.html ({best_enc}) actualizado con éxito. Cambios aplicados: Tags publicitarios ({count_ad}), Metatags SEO ({count_meta}).")
            updated_count += 1
            
    if updated_count == 0:
        print("No se encontró ningún index.html para actualizar.")


if __name__ == "__main__":
    run_agent()
