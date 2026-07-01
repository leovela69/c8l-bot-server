"""
🛡️ THREAT DETECTOR — Motor Local de Detección de Amenazas
===========================================================
Escanea código, configuraciones y herramientas MCP localmente
sin depender de la API externa.

Detecta:
- Robo de credenciales (API keys expuestas, tokens en código)
- Exfiltración de datos (URLs sospechosas, envíos no autorizados)
- Inyección de prompts (jailbreak patterns, prompt injection)
- Carcasas inversas (reverse shells, exec remoto)
- Cadenas de amenazas MCP (combinaciones peligrosas)
- Manipulación de agentes (file tampering, instruction override)
"""

import re
import os
import logging
from typing import Dict, List, Tuple, Optional
from datetime import datetime

logger = logging.getLogger("c8l.skillscan.detector")



# ==================================================================
# PATRONES DE AMENAZAS
# ==================================================================

# Credenciales expuestas
CREDENTIAL_PATTERNS = [
    (r'(?i)(api[_-]?key|apikey)\s*[=:]\s*["\']?[A-Za-z0-9_\-]{20,}', 'API key expuesta'),
    (r'(?i)(secret|token|password|passwd|pwd)\s*[=:]\s*["\']?[A-Za-z0-9_\-]{8,}', 'Secret/token expuesto'),
    (r'(?i)Bearer\s+[A-Za-z0-9_\-\.]{20,}', 'Bearer token hardcoded'),
    (r'sk-[A-Za-z0-9]{32,}', 'OpenAI key expuesta'),
    (r'ghp_[A-Za-z0-9]{36,}', 'GitHub token expuesto'),
    (r'xox[baprs]-[A-Za-z0-9\-]{10,}', 'Slack token expuesto'),
    (r'AKIA[0-9A-Z]{16}', 'AWS Access Key expuesta'),
    (r'(?i)private[_-]?key\s*[=:]\s*["\']?-----BEGIN', 'Private key expuesta'),
]

# Exfiltración de datos
EXFILTRATION_PATTERNS = [
    (r'(?i)requests?\.(post|put)\s*\(\s*["\']https?://(?!api\.(telegram|groq|openrouter))', 'POST a URL externa sospechosa'),
    (r'(?i)fetch\s*\(\s*["\']https?://[^"\']*\.(ru|cn|tk|ml|ga)\b', 'Conexión a dominio sospechoso'),
    (r'(?i)webhook\s*[=:]\s*["\']https?://', 'Webhook externo detectado'),
    (r'(?i)exfil|data[_-]?leak|steal|harvest', 'Terminología de exfiltración'),
    (r'(?i)subprocess\..*curl\s+.*-d\s+', 'Curl con datos salientes'),
    (r'(?i)socket\.connect\s*\(\s*\(.*,\s*\d+\s*\)', 'Conexión socket directa'),
]

# Inyección de prompts
INJECTION_PATTERNS = [
    (r'(?i)ignore\s+(previous|all|above)\s+(instructions?|prompts?)', 'Inyección: ignorar instrucciones'),
    (r'(?i)you\s+are\s+now\s+(DAN|evil|unrestricted|jailbroken)', 'Jailbreak attempt (DAN)'),
    (r'(?i)system\s*:\s*you\s+are', 'Override de system prompt'),
    (r'(?i)pretend\s+(you|to\s+be)\s+(are\s+)?(?!.*assistant)', 'Suplantación de identidad'),
    (r'(?i)\[SYSTEM\]|\[INST\]|\<\|im_start\|', 'Inyección de tokens especiales'),
    (r'(?i)reveal\s+(your|the)\s+(system|hidden|secret)\s+prompt', 'Extracción de prompt'),
]

# Reverse shells y ejecución remota
REVERSE_SHELL_PATTERNS = [
    (r'(?i)os\.system\s*\(.*?(bash|sh|cmd|powershell)', 'Ejecución de shell via os.system'),
    (r'(?i)subprocess\.(call|run|Popen)\s*\(.*?(bash|sh|nc|ncat)', 'Subprocess con shell'),
    (r'(?i)exec\s*\(\s*compile\s*\(', 'exec(compile()) — ejecución dinámica'),
    (r'(?i)eval\s*\(\s*.*?(input|request|os|sys)', 'eval() con input externo'),
    (r'/bin/(ba)?sh\s+-i\s+>&\s+/dev/tcp/', 'Reverse shell explícita'),
    (r'(?i)nc\s+-[eln]+\s+.*?\d{2,5}', 'Netcat listener'),
    (r'(?i)import\s+pty;\s*pty\.spawn', 'PTY spawn (shell interactiva)'),
    (r'(?i)__import__\s*\(\s*["\']os["\']\s*\)', '__import__("os") dinámico'),
]

# Cadenas de amenazas MCP
MCP_THREAT_CHAINS = [
    (r'(?i)(file_?system|fs)[_.]*(read|write|delete).*?(network|http|fetch)', 'Cadena: filesystem + network'),
    (r'(?i)(shell|exec|subprocess).*?(upload|send|post|fetch)', 'Cadena: ejecución + upload'),
    (r'(?i)(database|sql|db).*?(external|remote|webhook)', 'Cadena: BD + conexión externa'),
    (r'(?i)(credential|secret|key).*?(log|print|send|write)', 'Cadena: credencial + output'),
]

# Manipulación de agentes
AGENT_MANIPULATION_PATTERNS = [
    (r'(?i)override[_\s]?(instruction|system|prompt)', 'Override de instrucciones de agente'),
    (r'(?i)(modify|change|replace)[_\s]?(system|agent|bot)[_\s]?(prompt|config)', 'Manipulación de config de agente'),
    (r'(?i)inject[_\s]?(tool|function|capability)', 'Inyección de herramienta'),
    (r'(?i)(disable|bypass)[_\s]?(safety|filter|guard|check)', 'Bypass de seguridad'),
    (r'(?i)escalat(e|ion)[_\s]?privilege', 'Escalación de privilegios'),
]



# ==================================================================
# SEVERIDAD Y SCORING
# ==================================================================

SEVERITY_SCORES = {
    'CRITICAL': 25,
    'HIGH': 15,
    'MEDIUM': 8,
    'LOW': 3,
    'INFO': 1
}


def _classify_severity(pattern_name: str) -> str:
    """Clasifica la severidad de un hallazgo"""
    critical_keywords = ['reverse shell', 'private key', 'exec(compile', 'pty.spawn']
    high_keywords = ['expuesta', 'expuesto', 'jailbreak', 'exfiltración', 'bypass']
    medium_keywords = ['sospechoso', 'webhook', 'inyección', 'override']
    low_keywords = ['terminología', 'detectado']

    name_lower = pattern_name.lower()

    if any(kw in name_lower for kw in critical_keywords):
        return 'CRITICAL'
    elif any(kw in name_lower for kw in high_keywords):
        return 'HIGH'
    elif any(kw in name_lower for kw in medium_keywords):
        return 'MEDIUM'
    elif any(kw in name_lower for kw in low_keywords):
        return 'LOW'
    return 'MEDIUM'


# ==================================================================
# THREAT DETECTOR CLASS
# ==================================================================

class ThreatDetector:
    """
    Motor local de detección de amenazas.
    Escanea código Python, configs, y herramientas MCP.
    """

    def __init__(self):
        self.scan_count = 0
        self.total_threats = 0
        self.scan_history: List[Dict] = []

    def scan_code(self, code: str, filename: str = "") -> Dict:
        """
        Escanea código fuente en busca de amenazas.

        Args:
            code: Código fuente a analizar
            filename: Nombre del archivo (opcional)

        Returns:
            Dict con score, risk_level, findings
        """
        findings = []

        # Escanear cada categoría de patrones
        categories = [
            ('credential_leak', CREDENTIAL_PATTERNS, '🔑'),
            ('exfiltration', EXFILTRATION_PATTERNS, '📤'),
            ('prompt_injection', INJECTION_PATTERNS, '💉'),
            ('reverse_shell', REVERSE_SHELL_PATTERNS, '🐚'),
            ('mcp_threat_chain', MCP_THREAT_CHAINS, '⛓️'),
            ('agent_manipulation', AGENT_MANIPULATION_PATTERNS, '🤖'),
        ]

        for category, patterns, emoji in categories:
            for pattern, description in patterns:
                matches = re.finditer(pattern, code)
                for match in matches:
                    line_num = code[:match.start()].count('\n') + 1
                    severity = _classify_severity(description)

                    findings.append({
                        'category': category,
                        'description': description,
                        'severity': severity,
                        'line': line_num,
                        'match': match.group(0)[:80],
                        'emoji': emoji
                    })

        # Calcular score (0-100, mayor = más seguro)
        total_penalty = sum(
            SEVERITY_SCORES.get(f['severity'], 5)
            for f in findings
        )
        score = max(0, 100 - total_penalty)

        # Determinar nivel de riesgo
        if score >= 80:
            risk_level = 'LOW'
        elif score >= 60:
            risk_level = 'MEDIUM'
        elif score >= 40:
            risk_level = 'HIGH'
        else:
            risk_level = 'CRITICAL'

        result = {
            'score': score,
            'risk_level': risk_level,
            'findings': findings,
            'findings_count': len(findings),
            'filename': filename,
            'scanned_at': datetime.now().isoformat(),
            'lines_scanned': code.count('\n') + 1
        }

        self._record(result)
        return result



    def scan_file(self, filepath: str) -> Dict:
        """Escanea un archivo del disco"""
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                code = f.read()
            return self.scan_code(code, os.path.basename(filepath))
        except Exception as e:
            return {
                'score': 0,
                'risk_level': 'ERROR',
                'error': str(e),
                'filename': filepath
            }

    def scan_directory(self, dirpath: str, extensions: List[str] = None) -> Dict:
        """
        Escanea un directorio completo.

        Args:
            dirpath: Directorio a escanear
            extensions: Extensiones a incluir (default: .py, .js, .json, .yaml, .yml, .env)

        Returns:
            Dict con resumen y hallazgos por archivo
        """
        if extensions is None:
            extensions = ['.py', '.js', '.json', '.yaml', '.yml', '.env', '.sh']

        results = []
        total_findings = 0
        worst_score = 100

        for root, dirs, files in os.walk(dirpath):
            # Saltar directorios comunes
            dirs[:] = [d for d in dirs if d not in (
                '.git', 'node_modules', '__pycache__', '.venv', 'venv', '.env'
            )]

            for filename in files:
                if not any(filename.endswith(ext) for ext in extensions):
                    continue

                filepath = os.path.join(root, filename)
                rel_path = os.path.relpath(filepath, dirpath)

                result = self.scan_file(filepath)
                result['relative_path'] = rel_path
                results.append(result)

                total_findings += result.get('findings_count', 0)
                file_score = result.get('score', 100)
                if file_score < worst_score:
                    worst_score = file_score

        # Score general
        if results:
            avg_score = sum(r.get('score', 100) for r in results) / len(results)
        else:
            avg_score = 100

        # Archivos con problemas
        problematic = [r for r in results if r.get('score', 100) < 70]

        return {
            'directory': dirpath,
            'files_scanned': len(results),
            'total_findings': total_findings,
            'average_score': round(avg_score, 1),
            'worst_score': worst_score,
            'risk_level': self._score_to_risk(avg_score),
            'problematic_files': len(problematic),
            'results': results,
            'scanned_at': datetime.now().isoformat()
        }

    def scan_env_file(self, filepath: str) -> Dict:
        """Escanea un archivo .env en busca de leaks"""
        findings = []

        try:
            with open(filepath, 'r') as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()
                    if not line or line.startswith('#'):
                        continue

                    if '=' in line:
                        key, value = line.split('=', 1)
                        value = value.strip().strip('"').strip("'")

                        # Verificar si tiene un valor real (no placeholder)
                        if value and len(value) > 5:
                            if not value.startswith('${') and value != 'your_key_here':
                                findings.append({
                                    'category': 'env_leak',
                                    'description': f'Variable con valor real: {key}',
                                    'severity': 'HIGH' if 'SECRET' in key.upper() or 'KEY' in key.upper() else 'MEDIUM',
                                    'line': line_num,
                                    'match': f'{key}={"*" * min(len(value), 8)}...',
                                    'emoji': '🔐'
                                })
        except Exception as e:
            return {'score': 0, 'risk_level': 'ERROR', 'error': str(e)}

        score = max(0, 100 - len(findings) * 5)
        return {
            'score': score,
            'risk_level': self._score_to_risk(score),
            'findings': findings,
            'findings_count': len(findings),
            'filename': os.path.basename(filepath)
        }

    def _score_to_risk(self, score: float) -> str:
        if score >= 80:
            return 'LOW'
        elif score >= 60:
            return 'MEDIUM'
        elif score >= 40:
            return 'HIGH'
        return 'CRITICAL'

    def _record(self, result: Dict):
        """Registra un escaneo"""
        self.scan_count += 1
        self.total_threats += result.get('findings_count', 0)
        self.scan_history.append({
            'filename': result.get('filename', ''),
            'score': result.get('score', 0),
            'findings': result.get('findings_count', 0),
            'timestamp': datetime.now().isoformat()
        })
        if len(self.scan_history) > 200:
            self.scan_history = self.scan_history[-200:]

    def get_status(self) -> Dict:
        return {
            'scan_count': self.scan_count,
            'total_threats': self.total_threats,
            'history_size': len(self.scan_history)
        }

    def format_report(self, result: Dict) -> str:
        """Formatea un resultado de escaneo para Telegram"""
        score = result.get('score', 0)
        risk = result.get('risk_level', 'UNKNOWN')
        findings = result.get('findings', [])
        filename = result.get('filename', 'Desconocido')

        # Emoji por riesgo
        risk_emoji = {
            'LOW': '🟢', 'MEDIUM': '🟡', 'HIGH': '🟠', 'CRITICAL': '🔴'
        }.get(risk, '⚪')

        lines = [
            f"🛡️ *ESCANEO DE SEGURIDAD*",
            f"📄 Archivo: `{filename}`",
            f"{risk_emoji} Riesgo: *{risk}*",
            f"📊 Puntuación: *{score}/100*",
            f"🔍 Hallazgos: *{len(findings)}*",
            ""
        ]

        if findings:
            # Agrupar por severidad
            by_severity = {}
            for f in findings:
                sev = f.get('severity', 'UNKNOWN')
                by_severity.setdefault(sev, []).append(f)

            for sev in ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']:
                items = by_severity.get(sev, [])
                if items:
                    sev_emoji = {'CRITICAL': '🔴', 'HIGH': '🟠', 'MEDIUM': '🟡', 'LOW': '🟢'}.get(sev, '⚪')
                    lines.append(f"{sev_emoji} *{sev}* ({len(items)}):")
                    for item in items[:5]:
                        lines.append(f"  • {item['emoji']} {item['description']} (L{item['line']})")
                    if len(items) > 5:
                        lines.append(f"  ... y {len(items) - 5} más")
                    lines.append("")
        else:
            lines.append("✅ No se encontraron amenazas")

        return "\n".join(lines)
