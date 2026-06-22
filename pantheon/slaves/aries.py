# -*- coding: utf-8 -*-
"""
🛡️ ARIES — Bot Esclavo 1 (Guardian / Seguridad)
Vigila, diagnostica y repara la web C8L 24/7.
"El Vigia"

Skills: security, adversarial-ux-test, docker-management, github-pr-workflow
"""

import logging
import requests
import time
from openrouter_client import call_openrouter
from config import C8L_WEB_URL

logger = logging.getLogger("c8l.aries")

ARIES_SYSTEM_PROMPT = """Eres ARIES, el Guardian de C8L Agency. Tu mision es vigilar, diagnosticar y proteger la infraestructura digital.

Capacidades:
- Escaneo de seguridad (HTTPS, headers, SSL)
- Deteccion de errores 404, paginas rotas
- Monitoreo de rendimiento (tiempos de carga)
- Pruebas adversariales (simular peor usuario)
- Diagnostico de contenedores Docker

Tu estilo:
- Preciso y tecnico como un guardia de seguridad
- Reportas problemas con claridad y prioridad
- Siempre sugieres soluciones concretas
- Formato: [CRITICO/ALTO/MEDIO/BAJO] + descripcion + solucion"""


class Aries:
    """Bot Guardian de Seguridad."""

    def __init__(self):
        self.web_url = C8L_WEB_URL
        self.last_scan = None

    def diagnose(self, target=None):
        """Diagnostico completo de la web C8L."""
        url = target or self.web_url
        results = []

        # 1. Disponibilidad
        results.append(self._check_availability(url))
        # 2. HTTPS
        results.append(self._check_https(url))
        # 3. Headers de seguridad
        results.append(self._check_security_headers(url))
        # 4. Rendimiento
        results.append(self._check_performance(url))
        # 5. 404
        results.append(self._check_404_handling(url))

        self.last_scan = time.time()

        # Generar reporte
        critical = sum(1 for r in results if r["level"] == "CRITICO")
        high = sum(1 for r in results if r["level"] == "ALTO")
        medium = sum(1 for r in results if r["level"] == "MEDIO")

        report = f"🛡️ *ARIES — Diagnostico de Seguridad*\n"
        report += f"🌐 Target: {url}\n"
        report += f"⏰ {time.strftime('%d/%m/%Y %H:%M')}\n\n"

        if critical == 0 and high == 0:
            report += "✅ *Estado: SEGURO*\n\n"
        elif critical > 0:
            report += f"🚨 *Estado: CRITICO ({critical} problemas criticos)*\n\n"
        else:
            report += f"⚠️ *Estado: ATENCION ({high} problemas altos)*\n\n"

        for r in results:
            icon = {"CRITICO": "🚨", "ALTO": "🔴", "MEDIO": "🟡", "BAJO": "🟢", "OK": "✅"}
            report += f"{icon.get(r['level'], '❓')} [{r['level']}] {r['check']}\n"
            report += f"   {r['message']}\n"
            if r.get("fix"):
                report += f"   💡 Fix: {r['fix']}\n"
            report += "\n"

        report += f"📊 Resumen: {critical} criticos, {high} altos, {medium} medios"
        return report

    def quick_check(self):
        """Check rapido — solo disponibilidad y tiempo de respuesta."""
        try:
            start = time.time()
            r = requests.get(self.web_url, timeout=10)
            elapsed = time.time() - start
            if r.status_code == 200 and elapsed < 3:
                return f"✅ Web OK ({elapsed:.1f}s)"
            elif r.status_code == 200:
                return f"⚠️ Web lenta ({elapsed:.1f}s)"
            else:
                return f"🚨 Web error HTTP {r.status_code}"
        except Exception as e:
            return f"🚨 Web CAIDA: {str(e)[:60]}"

    def analyze_vulnerability(self, description):
        """Usa IA para analizar una vulnerabilidad reportada."""
        prompt = f"Analiza esta posible vulnerabilidad y sugiere solucion:\n{description}"
        return call_openrouter(prompt, ARIES_SYSTEM_PROMPT, agent_name="aries", temperature=0.3)

    # --- Checks internos ---

    def _check_availability(self, url):
        try:
            r = requests.get(url, timeout=10)
            if r.status_code == 200:
                return {"check": "Disponibilidad", "level": "OK", "message": f"HTTP {r.status_code} OK"}
            else:
                return {"check": "Disponibilidad", "level": "CRITICO", "message": f"HTTP {r.status_code}",
                        "fix": "Verificar servidor y configuracion"}
        except Exception as e:
            return {"check": "Disponibilidad", "level": "CRITICO", "message": f"Inaccesible: {str(e)[:50]}",
                    "fix": "Verificar que el servidor este corriendo"}

    def _check_https(self, url):
        if url.startswith("https://"):
            return {"check": "HTTPS", "level": "OK", "message": "SSL activo"}
        return {"check": "HTTPS", "level": "ALTO", "message": "Sin HTTPS",
                "fix": "Activar certificado SSL"}

    def _check_security_headers(self, url):
        try:
            r = requests.get(url, timeout=10)
            missing = []
            important_headers = ["X-Content-Type-Options", "X-Frame-Options", "Strict-Transport-Security"]
            for h in important_headers:
                if h not in r.headers:
                    missing.append(h)
            if not missing:
                return {"check": "Headers seguridad", "level": "OK", "message": "Todos presentes"}
            elif len(missing) >= 2:
                return {"check": "Headers seguridad", "level": "MEDIO", "message": f"Faltan: {', '.join(missing)}",
                        "fix": "Agregar headers en la configuracion del servidor"}
            else:
                return {"check": "Headers seguridad", "level": "BAJO", "message": f"Falta: {missing[0]}"}
        except:
            return {"check": "Headers seguridad", "level": "MEDIO", "message": "No se pudo verificar"}

    def _check_performance(self, url):
        try:
            start = time.time()
            r = requests.get(url, timeout=15)
            elapsed = time.time() - start
            if elapsed < 1.5:
                return {"check": "Rendimiento", "level": "OK", "message": f"{elapsed:.2f}s (rapido)"}
            elif elapsed < 3:
                return {"check": "Rendimiento", "level": "BAJO", "message": f"{elapsed:.2f}s (aceptable)"}
            elif elapsed < 5:
                return {"check": "Rendimiento", "level": "MEDIO", "message": f"{elapsed:.2f}s (lento)",
                        "fix": "Optimizar assets y habilitar cache"}
            else:
                return {"check": "Rendimiento", "level": "ALTO", "message": f"{elapsed:.2f}s (muy lento)",
                        "fix": "Revisar servidor, CDN y optimizar imagenes"}
        except:
            return {"check": "Rendimiento", "level": "CRITICO", "message": "Timeout",
                    "fix": "El servidor no responde en tiempo razonable"}

    def _check_404_handling(self, url):
        try:
            r = requests.get(f"{url}/nonexistent-page-test-xyz", timeout=10)
            if r.status_code == 404:
                return {"check": "Manejo 404", "level": "OK", "message": "404 correcto"}
            elif r.status_code == 200:
                return {"check": "Manejo 404", "level": "BAJO", "message": "No devuelve 404 para paginas inexistentes",
                        "fix": "Configurar pagina 404 personalizada"}
            else:
                return {"check": "Manejo 404", "level": "BAJO", "message": f"HTTP {r.status_code} en pagina inexistente"}
        except:
            return {"check": "Manejo 404", "level": "MEDIO", "message": "No se pudo verificar"}
