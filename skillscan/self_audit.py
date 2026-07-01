"""
🔍 SELF AUDIT — Auto-Auditoría del Sistema C8L
================================================
Escanea el propio código del bot en busca de vulnerabilidades,
genera reportes y sugiere correcciones automáticas.

Funcionalidades:
- Escanear todo el repo buscando amenazas
- Detectar .env/secrets expuestos
- Verificar que las APIs estén bien configuradas
- Auto-reparar problemas comunes
- Generar reporte completo del estado de seguridad
"""

import os
import logging
from typing import Dict, List, Optional
from datetime import datetime

from skillscan.threat_detector import ThreatDetector

logger = logging.getLogger("c8l.skillscan.audit")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))



class SelfAuditor:
    """
    Auto-audita el código del bot C8L.
    Detecta vulnerabilidades y sugiere/aplica correcciones.
    """

    def __init__(self):
        self.detector = ThreatDetector()
        self.last_audit = None
        self.audit_history: List[Dict] = []

    async def full_audit(self) -> Dict:
        """
        Ejecuta auditoría completa del repositorio.
        Escanea todos los archivos Python, configs, y .env.
        """
        logger.info("🔍 Iniciando auditoría completa del sistema...")

        results = {
            'code_scan': None,
            'env_scan': None,
            'config_check': None,
            'fixes_available': [],
            'summary': {}
        }

        # 1. Escanear código Python
        code_result = self.detector.scan_directory(BASE_DIR, ['.py'])
        results['code_scan'] = {
            'files_scanned': code_result['files_scanned'],
            'average_score': code_result['average_score'],
            'worst_score': code_result['worst_score'],
            'total_findings': code_result['total_findings'],
            'risk_level': code_result['risk_level'],
            'problematic_files': [
                {
                    'path': r['relative_path'],
                    'score': r['score'],
                    'findings': r['findings_count']
                }
                for r in code_result.get('results', [])
                if r.get('score', 100) < 70
            ]
        }

        # 2. Escanear .env si existe
        env_path = os.path.join(BASE_DIR, '.env')
        if os.path.exists(env_path):
            env_result = self.detector.scan_env_file(env_path)
            results['env_scan'] = env_result
        else:
            results['env_scan'] = {'status': 'ok', 'message': '.env no encontrado (bien)'}

        # 3. Verificar configuración segura
        results['config_check'] = await self._check_config()

        # 4. Detectar fixes automáticos disponibles
        results['fixes_available'] = self._detect_available_fixes(code_result)

        # 5. Resumen
        results['summary'] = {
            'overall_score': code_result['average_score'],
            'overall_risk': code_result['risk_level'],
            'files_scanned': code_result['files_scanned'],
            'total_issues': code_result['total_findings'],
            'critical_issues': sum(
                1 for r in code_result.get('results', [])
                for f in r.get('findings', [])
                if f.get('severity') == 'CRITICAL'
            ),
            'high_issues': sum(
                1 for r in code_result.get('results', [])
                for f in r.get('findings', [])
                if f.get('severity') == 'HIGH'
            ),
            'audited_at': datetime.now().isoformat()
        }

        self.last_audit = results
        self.audit_history.append(results['summary'])
        if len(self.audit_history) > 50:
            self.audit_history = self.audit_history[-50:]

        logger.info(f"✅ Auditoría completa: score={results['summary']['overall_score']}")
        return results



    async def quick_audit(self) -> Dict:
        """Auditoría rápida — solo archivos críticos"""
        critical_files = [
            'whatsapp_bot.py',
            'config.py',
            'openrouter_client.py',
            'suno_bot_bridge.py',
            'stripe_integration.py',
            'billing.py',
            'admin_panel.py',
        ]

        findings_total = 0
        file_results = []

        for filename in critical_files:
            filepath = os.path.join(BASE_DIR, filename)
            if os.path.exists(filepath):
                result = self.detector.scan_file(filepath)
                result['filename'] = filename
                file_results.append(result)
                findings_total += result.get('findings_count', 0)

        avg_score = (
            sum(r.get('score', 100) for r in file_results) / len(file_results)
            if file_results else 100
        )

        return {
            'type': 'quick',
            'files_scanned': len(file_results),
            'average_score': round(avg_score, 1),
            'total_findings': findings_total,
            'results': file_results,
            'audited_at': datetime.now().isoformat()
        }

    async def scan_single_file(self, filepath: str) -> Dict:
        """Escanea un solo archivo y devuelve resultado formateado"""
        full_path = os.path.join(BASE_DIR, filepath) if not os.path.isabs(filepath) else filepath

        if not os.path.exists(full_path):
            return {'status': 'error', 'error': f'Archivo no encontrado: {filepath}'}

        result = self.detector.scan_file(full_path)
        result['formatted'] = self.detector.format_report(result)
        return result

    async def _check_config(self) -> Dict:
        """Verifica que la configuración sea segura"""
        issues = []

        config_path = os.path.join(BASE_DIR, 'config.py')
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                config_content = f.read()

            # Verificar que las keys vienen de env vars
            hardcoded = re.findall(
                r'(?:API_KEY|TOKEN|SECRET)\s*[=:]\s*["\'][A-Za-z0-9]{10,}["\']',
                config_content
            )
            if hardcoded:
                issues.append({
                    'type': 'hardcoded_secret',
                    'severity': 'CRITICAL',
                    'description': f'{len(hardcoded)} secretos hardcoded en config.py',
                    'fix': 'Mover a variables de entorno'
                })

            # Verificar que usa os.environ.get
            if 'os.environ.get' not in config_content:
                issues.append({
                    'type': 'no_env_vars',
                    'severity': 'HIGH',
                    'description': 'config.py no usa os.environ.get',
                    'fix': 'Usar variables de entorno para secretos'
                })

        # Verificar .gitignore
        gitignore_path = os.path.join(BASE_DIR, '.gitignore')
        if os.path.exists(gitignore_path):
            with open(gitignore_path, 'r') as f:
                gitignore = f.read()
            if '.env' not in gitignore:
                issues.append({
                    'type': 'env_not_ignored',
                    'severity': 'HIGH',
                    'description': '.env no está en .gitignore',
                    'fix': 'Añadir .env a .gitignore'
                })
        else:
            issues.append({
                'type': 'no_gitignore',
                'severity': 'MEDIUM',
                'description': 'No existe .gitignore',
                'fix': 'Crear .gitignore con archivos sensibles'
            })

        return {
            'issues': issues,
            'secure': len(issues) == 0
        }

    def _detect_available_fixes(self, scan_result: Dict) -> List[Dict]:
        """Detecta correcciones automáticas disponibles"""
        fixes = []

        for file_result in scan_result.get('results', []):
            for finding in file_result.get('findings', []):
                category = finding.get('category', '')
                fix = None

                if category == 'credential_leak':
                    fix = {
                        'file': file_result.get('relative_path', ''),
                        'line': finding.get('line', 0),
                        'type': 'move_to_env',
                        'description': f"Mover {finding['description']} a variable de entorno",
                        'auto_fixable': True
                    }
                elif category == 'reverse_shell':
                    fix = {
                        'file': file_result.get('relative_path', ''),
                        'line': finding.get('line', 0),
                        'type': 'sandbox_execution',
                        'description': f"Sandboxear: {finding['description']}",
                        'auto_fixable': False
                    }

                if fix:
                    fixes.append(fix)

        return fixes

    def format_audit_report(self, audit: Dict) -> str:
        """Formatea el resultado de auditoría para Telegram"""
        summary = audit.get('summary', {})
        score = summary.get('overall_score', 0)
        risk = summary.get('overall_risk', 'UNKNOWN')

        risk_emoji = {
            'LOW': '🟢', 'MEDIUM': '🟡', 'HIGH': '🟠', 'CRITICAL': '🔴'
        }.get(risk, '⚪')

        lines = [
            "🛡️ *AUDITORÍA DE SEGURIDAD C8L*",
            f"━━━━━━━━━━━━━━━━━━━━",
            f"{risk_emoji} Riesgo general: *{risk}*",
            f"📊 Puntuación: *{score:.0f}/100*",
            f"📁 Archivos escaneados: {summary.get('files_scanned', 0)}",
            f"🔍 Hallazgos totales: {summary.get('total_issues', 0)}",
            f"🔴 Críticos: {summary.get('critical_issues', 0)}",
            f"🟠 Altos: {summary.get('high_issues', 0)}",
            ""
        ]

        # Archivos problemáticos
        problematic = audit.get('code_scan', {}).get('problematic_files', [])
        if problematic:
            lines.append("⚠️ *Archivos con problemas:*")
            for pf in problematic[:10]:
                lines.append(f"  • `{pf['path']}` — Score: {pf['score']}, Issues: {pf['findings']}")
            lines.append("")

        # Config check
        config = audit.get('config_check', {})
        config_issues = config.get('issues', [])
        if config_issues:
            lines.append("⚙️ *Configuración:*")
            for issue in config_issues:
                sev_emoji = {'CRITICAL': '🔴', 'HIGH': '🟠', 'MEDIUM': '🟡'}.get(issue['severity'], '⚪')
                lines.append(f"  {sev_emoji} {issue['description']}")
                lines.append(f"     💡 Fix: {issue['fix']}")
            lines.append("")
        else:
            lines.append("⚙️ Configuración: ✅ Segura")
            lines.append("")

        # Fixes disponibles
        fixes = audit.get('fixes_available', [])
        if fixes:
            auto_fixes = [f for f in fixes if f.get('auto_fixable')]
            lines.append(f"🔧 *Correcciones disponibles:* {len(fixes)}")
            lines.append(f"   Auto-corregibles: {len(auto_fixes)}")
            lines.append(f"   Manuales: {len(fixes) - len(auto_fixes)}")
        else:
            lines.append("🔧 No hay correcciones pendientes")

        lines.append("")
        lines.append(f"🕐 {summary.get('audited_at', '')[:19]}")

        return "\n".join(lines)


# Para imports con re
import re
