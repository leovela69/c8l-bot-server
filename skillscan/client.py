"""
🛡️ SKILLSCAN API CLIENT
=========================
Cliente Python para la API de SkillScan (skillscan.dev).

Endpoints:
- POST /scan/url        — Escanea una habilidad por URL (gratis)
- POST /scan/content    — Escanea contenido en bruto (gratis)
- POST /scan/deep       — Análisis profundo + cadenas de amenazas ($0.05)
- POST /scan/batch      — Escaneo por lotes hasta 20 URLs ($0.10)
- POST /scan/compare    — Compara dos versiones de habilidad ($0.05)
- GET  /scan/:id        — Obtener resultado del escaneo (JSON)
- POST /policy          — Crear política de seguridad (gratis*)
- POST /policy/:id/evaluate — Evaluar contenido contra política
- GET  /report/:id      — Informe de escaneo (HTML)
- GET  /stats           — Estadísticas del ecosistema
- GET  /openapi.json    — Especificación OpenAPI 3.0
"""

import logging
import time
from typing import Dict, List, Optional, Any
from datetime import datetime

logger = logging.getLogger("c8l.skillscan.client")

# Base URL de la API de SkillScan
SKILLSCAN_API_BASE = "https://skillscan.dev/api/v1"


class SkillScanClient:
    """
    Cliente para la API de SkillScan.
    Escanea habilidades/herramientas MCP en busca de amenazas de seguridad.
    """

    def __init__(self, api_key: str = "", base_url: str = SKILLSCAN_API_BASE):
        self.api_key = api_key
        self.base_url = base_url
        self.scan_history: List[Dict] = []
        self.total_scans = 0
        self.threats_found = 0

    def _headers(self) -> Dict:
        """Headers para las peticiones"""
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def scan_url(self, url: str) -> Dict:
        """
        Escanea una habilidad/skill por URL.
        GRATIS — sin límites.

        Args:
            url: URL del skill/herramienta (GitHub, npm, PyPI, etc.)

        Returns:
            Dict con puntuación, hallazgos y amenazas detectadas
        """
        import aiohttp

        endpoint = f"{self.base_url}/scan/url"
        payload = {"url": url}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    endpoint, json=payload, headers=self._headers(), timeout=30
                ) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        self._record_scan(url, result)
                        return result
                    else:
                        error_text = await resp.text()
                        return {
                            'status': 'error',
                            'error': f"HTTP {resp.status}: {error_text[:200]}"
                        }
        except Exception as e:
            logger.error(f"SkillScan scan_url error: {e}")
            return {'status': 'error', 'error': str(e)}

    async def scan_content(self, content: str, filename: str = "") -> Dict:
        """
        Escanea contenido en bruto (código fuente, config, etc.).
        GRATIS — sin límites.

        Args:
            content: Contenido a escanear
            filename: Nombre del archivo (ayuda a la detección)

        Returns:
            Dict con puntuación y amenazas
        """
        import aiohttp

        endpoint = f"{self.base_url}/scan/content"
        payload = {"content": content}
        if filename:
            payload["filename"] = filename

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    endpoint, json=payload, headers=self._headers(), timeout=30
                ) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        self._record_scan(filename or "raw_content", result)
                        return result
                    else:
                        error_text = await resp.text()
                        return {
                            'status': 'error',
                            'error': f"HTTP {resp.status}: {error_text[:200]}"
                        }
        except Exception as e:
            logger.error(f"SkillScan scan_content error: {e}")
            return {'status': 'error', 'error': str(e)}

    async def scan_deep(self, url: str) -> Dict:
        """
        Análisis profundo de capacidad total + cadenas de amenazas.
        Costo: $0.05 por escaneo.

        Args:
            url: URL del skill/herramienta

        Returns:
            Dict con análisis profundo, cadenas de amenazas, manifiestos
        """
        import aiohttp

        endpoint = f"{self.base_url}/scan/deep"
        payload = {"url": url}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    endpoint, json=payload, headers=self._headers(), timeout=60
                ) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        self._record_scan(f"deep:{url}", result)
                        return result
                    else:
                        error_text = await resp.text()
                        return {
                            'status': 'error',
                            'error': f"HTTP {resp.status}: {error_text[:200]}"
                        }
        except Exception as e:
            logger.error(f"SkillScan scan_deep error: {e}")
            return {'status': 'error', 'error': str(e)}

    async def scan_batch(self, urls: List[str]) -> Dict:
        """
        Escaneo por lotes (hasta 20 URLs).
        Costo: $0.10 por lote.

        Args:
            urls: Lista de URLs a escanear (max 20)

        Returns:
            Dict con resultados por cada URL
        """
        import aiohttp

        if len(urls) > 20:
            urls = urls[:20]
            logger.warning("Batch limitado a 20 URLs")

        endpoint = f"{self.base_url}/scan/batch"
        payload = {"urls": urls}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    endpoint, json=payload, headers=self._headers(), timeout=120
                ) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        for url in urls:
                            self._record_scan(f"batch:{url}", result)
                        return result
                    else:
                        error_text = await resp.text()
                        return {
                            'status': 'error',
                            'error': f"HTTP {resp.status}: {error_text[:200]}"
                        }
        except Exception as e:
            logger.error(f"SkillScan scan_batch error: {e}")
            return {'status': 'error', 'error': str(e)}

    async def compare_versions(self, url1: str, url2: str) -> Dict:
        """
        Compara dos versiones de una habilidad.
        Costo: $0.05 por comparación.

        Args:
            url1: URL versión anterior
            url2: URL versión nueva

        Returns:
            Dict con diferencias de seguridad
        """
        import aiohttp

        endpoint = f"{self.base_url}/scan/compare"
        payload = {"url1": url1, "url2": url2}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    endpoint, json=payload, headers=self._headers(), timeout=60
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    else:
                        error_text = await resp.text()
                        return {
                            'status': 'error',
                            'error': f"HTTP {resp.status}: {error_text[:200]}"
                        }
        except Exception as e:
            logger.error(f"SkillScan compare error: {e}")
            return {'status': 'error', 'error': str(e)}

    async def get_scan_result(self, scan_id: str) -> Dict:
        """Obtiene el resultado de un escaneo previo por ID."""
        import aiohttp

        endpoint = f"{self.base_url}/scan/{scan_id}"

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    endpoint, headers=self._headers(), timeout=15
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return {'status': 'error', 'error': f"HTTP {resp.status}"}
        except Exception as e:
            return {'status': 'error', 'error': str(e)}

    async def create_policy(self, name: str, rules: Dict) -> Dict:
        """
        Crea una política de seguridad personalizada.
        GRATIS* (con API key).

        Args:
            name: Nombre de la política
            rules: Reglas de la política (JSON)

        Returns:
            Dict con ID de la política creada
        """
        import aiohttp

        endpoint = f"{self.base_url}/policy"
        payload = {"name": name, "rules": rules}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    endpoint, json=payload, headers=self._headers(), timeout=15
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return {'status': 'error', 'error': f"HTTP {resp.status}"}
        except Exception as e:
            return {'status': 'error', 'error': str(e)}

    async def evaluate_policy(self, policy_id: str, content: str) -> Dict:
        """Evalúa contenido contra una política existente."""
        import aiohttp

        endpoint = f"{self.base_url}/policy/{policy_id}/evaluate"
        payload = {"content": content}

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    endpoint, json=payload, headers=self._headers(), timeout=30
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return {'status': 'error', 'error': f"HTTP {resp.status}"}
        except Exception as e:
            return {'status': 'error', 'error': str(e)}

    async def get_report(self, scan_id: str) -> Optional[str]:
        """Obtiene el informe HTML de un escaneo."""
        import aiohttp

        endpoint = f"{self.base_url}/report/{scan_id}"

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    endpoint, headers=self._headers(), timeout=15
                ) as resp:
                    if resp.status == 200:
                        return await resp.text()
                    return None
        except Exception as e:
            logger.error(f"SkillScan get_report error: {e}")
            return None

    async def get_stats(self) -> Dict:
        """Obtiene estadísticas globales del ecosistema SkillScan."""
        import aiohttp

        endpoint = f"{self.base_url}/stats"

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    endpoint, headers=self._headers(), timeout=15
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return {'status': 'error', 'error': f"HTTP {resp.status}"}
        except Exception as e:
            return {'status': 'error', 'error': str(e)}

    # ==================================================================
    # INTERNOS
    # ==================================================================

    def _record_scan(self, target: str, result: Dict):
        """Registra un escaneo en el historial"""
        self.total_scans += 1

        findings = result.get('findings', [])
        threat_count = len([f for f in findings if f.get('severity', '') in ('HIGH', 'CRITICAL')])
        self.threats_found += threat_count

        self.scan_history.append({
            'target': target,
            'score': result.get('score', 0),
            'risk_level': result.get('risk_level', 'UNKNOWN'),
            'findings_count': len(findings),
            'threats': threat_count,
            'timestamp': datetime.now().isoformat()
        })

        # Mantener últimos 100
        if len(self.scan_history) > 100:
            self.scan_history = self.scan_history[-100:]

    def get_status(self) -> Dict:
        """Estado del cliente"""
        return {
            'api_configured': bool(self.api_key),
            'base_url': self.base_url,
            'total_scans': self.total_scans,
            'threats_found': self.threats_found,
            'history_size': len(self.scan_history),
            'last_scan': self.scan_history[-1] if self.scan_history else None
        }




# ==================================================================
# MONDOO SKILLCHECK CLI INTEGRATION
# ==================================================================

class MondooSkillCheck:
    """
    Integración con npx @mondoohq/skillcheck.
    Escáner CLI de Mondoo que detecta skills maliciosos de agentes IA.
    
    Detecta: prompt injection, credential theft, data exfiltration,
    agent impersonation, y 28+ tipos de amenazas.
    
    Soporta: Claude Code, Cursor, Windsurf, MCP servers, ClawHub, Skills.sh
    """

    def __init__(self):
        self.available = None
        self.last_scan = None

    async def check_available(self) -> bool:
        """Verifica si npx @mondoohq/skillcheck está disponible"""
        import asyncio
        try:
            proc = await asyncio.create_subprocess_exec(
                "npx", "@mondoohq/skillcheck", "--version",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=30)
            self.available = proc.returncode == 0
            return self.available
        except Exception:
            self.available = False
            return False

    async def scan_local(self, path: str = ".") -> Dict:
        """
        Ejecuta npx @mondoohq/skillcheck en un directorio local.
        Escanea skills, MCP configs, y archivos de agentes.
        
        Args:
            path: Directorio a escanear (default: directorio actual)
            
        Returns:
            Dict con resultado del escaneo
        """
        import asyncio

        try:
            proc = await asyncio.create_subprocess_exec(
                "npx", "@mondoohq/skillcheck", "--path", path, "--json",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=path
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)

            output = stdout.decode('utf-8', errors='replace')

            if proc.returncode == 0:
                try:
                    import json
                    result = json.loads(output)
                    self.last_scan = {
                        'result': result,
                        'path': path,
                        'timestamp': datetime.now().isoformat()
                    }
                    return {'status': 'success', 'data': result}
                except:
                    return {'status': 'success', 'raw_output': output}
            else:
                error = stderr.decode('utf-8', errors='replace')
                return {
                    'status': 'error',
                    'error': error[:500],
                    'exit_code': proc.returncode
                }

        except asyncio.TimeoutError:
            return {'status': 'error', 'error': 'Timeout (120s)'}
        except FileNotFoundError:
            return {'status': 'error', 'error': 'npx no encontrado. Instala Node.js 22+'}
        except Exception as e:
            return {'status': 'error', 'error': str(e)}

    async def scan_skill_url(self, url: str) -> Dict:
        """
        Escanea un skill por URL usando Mondoo.
        
        Args:
            url: URL del skill (GitHub, npm, ClawHub, etc.)
        """
        import asyncio

        try:
            proc = await asyncio.create_subprocess_exec(
                "npx", "@mondoohq/skillcheck", "--url", url, "--json",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=60)
            output = stdout.decode('utf-8', errors='replace')

            if proc.returncode == 0:
                try:
                    import json
                    return {'status': 'success', 'data': json.loads(output)}
                except:
                    return {'status': 'success', 'raw_output': output}
            else:
                return {'status': 'error', 'error': stderr.decode()[:300]}

        except Exception as e:
            return {'status': 'error', 'error': str(e)}

    def format_result(self, result: Dict) -> str:
        """Formatea resultado de Mondoo para Telegram"""
        if result.get('status') == 'error':
            return f"❌ Error Mondoo: {result.get('error', '?')[:200]}"

        data = result.get('data', result.get('raw_output', ''))
        if isinstance(data, str):
            return f"🛡️ *Mondoo SkillCheck*\n\n```\n{data[:3000]}\n```"

        # Si es JSON estructurado
        skills_found = data.get('skills_found', 0)
        threats = data.get('threats', [])
        safe = data.get('safe', 0)

        lines = [
            "🛡️ *MONDOO SKILLCHECK*",
            f"📦 Skills encontrados: {skills_found}",
            f"✅ Seguros: {safe}",
            f"⚠️ Amenazas: {len(threats)}",
        ]

        if threats:
            lines.append("")
            for t in threats[:10]:
                lines.append(f"  🔴 {t.get('name', '?')}: {t.get('description', '?')[:80]}")

        return "\n".join(lines)
