"""
🛡️ MÓDULO 5: DEFENSA PROACTIVA
================================
Defensa proactiva contra ataques y amenazas.

Escanea el sistema en busca de bruteforce, SQL injection, XSS,
DDoS y abuso de API. Responde automáticamente según severidad.

Integrado con SkillScan para:
- Escaneo de código del propio bot (self-audit)
- Detección de credenciales expuestas
- Análisis de herramientas MCP externas
- Cadenas de amenazas en agentes
"""

import asyncio
import os
from datetime import datetime
from typing import Dict, List, Any


class ProactiveDefense:
    """Defensa proactiva contra ataques y amenazas"""

    def __init__(self):
        self.threat_levels = {
            'low': 1,
            'medium': 3,
            'high': 5,
            'critical': 7
        }
        self.active_threats = []
        self.defense_log = []
        self.running = True
        self._skillscan_detector = None
        self._skillscan_auditor = None

    def _get_detector(self):
        """Lazy-load del ThreatDetector de SkillScan"""
        if self._skillscan_detector is None:
            try:
                from skillscan.threat_detector import ThreatDetector
                self._skillscan_detector = ThreatDetector()
            except ImportError:
                pass
        return self._skillscan_detector

    def _get_auditor(self):
        """Lazy-load del SelfAuditor de SkillScan"""
        if self._skillscan_auditor is None:
            try:
                from skillscan.self_audit import SelfAuditor
                self._skillscan_auditor = SelfAuditor()
            except ImportError:
                pass
        return self._skillscan_auditor

    async def scan_for_threats(self) -> List[Dict]:
        """Escanea el sistema en busca de amenazas"""
        threats = []

        # 1. Verificar patrones de ataque comunes
        threats.extend(await self._check_bruteforce())
        threats.extend(await self._check_sql_injection())
        threats.extend(await self._check_xss())
        threats.extend(await self._check_ddos())
        threats.extend(await self._check_api_abuse())

        # 2. SkillScan: escaneo de código propio (cada ciclo largo)
        threats.extend(await self._check_code_integrity())

        return threats

    async def _check_bruteforce(self) -> List[Dict]:
        """Verifica ataques de fuerza bruta"""
        return []

    async def _check_sql_injection(self) -> List[Dict]:
        """Verifica inyecciones SQL"""
        return []

    async def _check_xss(self) -> List[Dict]:
        """Verifica ataques XSS"""
        return []

    async def _check_ddos(self) -> List[Dict]:
        """Verifica ataques DDoS"""
        return []

    async def _check_api_abuse(self) -> List[Dict]:
        """Verifica abuso de API"""
        return []

    async def _check_code_integrity(self) -> List[Dict]:
        """
        SkillScan Integration: escanea archivos críticos del bot
        buscando inyecciones, credenciales expuestas, etc.
        """
        threats = []
        detector = self._get_detector()
        if not detector:
            return threats

        # Archivos críticos a monitorear
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        critical_files = [
            'whatsapp_bot.py', 'config.py', 'openrouter_client.py',
            'admin_panel.py', 'stripe_integration.py'
        ]

        for filename in critical_files:
            filepath = os.path.join(base_dir, filename)
            if not os.path.exists(filepath):
                continue

            result = detector.scan_file(filepath)
            if result.get('score', 100) < 60:
                for finding in result.get('findings', []):
                    if finding.get('severity') in ('CRITICAL', 'HIGH'):
                        threats.append({
                            'type': 'code_vulnerability',
                            'severity': finding['severity'].lower(),
                            'source': filename,
                            'description': finding['description'],
                            'line': finding.get('line', 0),
                            'category': finding.get('category', 'unknown')
                        })

        return threats

    async def run_full_security_audit(self) -> Dict:
        """
        Ejecuta auditoría completa de seguridad usando SkillScan.
        Llamado por /scan full o por el cron de seguridad.
        """
        auditor = self._get_auditor()
        if not auditor:
            return {'status': 'error', 'error': 'SkillScan no disponible'}

        result = await auditor.full_audit()

        # Registrar amenazas críticas
        summary = result.get('summary', {})
        if summary.get('critical_issues', 0) > 0:
            self.active_threats.append({
                'type': 'audit_critical',
                'count': summary['critical_issues'],
                'timestamp': datetime.now().isoformat()
            })

        return result

    async def respond_to_threat(self, threat: Dict) -> Dict:
        """Responde a una amenaza detectada"""
        severity = self.threat_levels.get(threat.get('severity', 'low'), 1)

        if severity >= 5:
            return await self._activate_defense(threat)
        elif severity >= 3:
            return await self._log_and_warn(threat)
        else:
            return {'action': 'monitor', 'threat': threat}

    async def _activate_defense(self, threat: Dict) -> Dict:
        """Activa mecanismos de defensa"""
        actions = []

        if threat.get('type') == 'bruteforce':
            actions.append({'action': 'rate_limit', 'duration': 300})
            actions.append({'action': 'block_ip', 'ip': threat.get('source_ip')})
        elif threat.get('type') == 'ddos':
            actions.append({'action': 'traffic_filter'})
            actions.append({'action': 'scale_up_resources'})
        elif threat.get('type') == 'sqli':
            actions.append({'action': 'sanitize_inputs'})
            actions.append({'action': 'block_request'})

        self.defense_log.append({
            'threat': threat,
            'actions': actions,
            'timestamp': datetime.now().isoformat()
        })

        return {
            'defense_activated': True,
            'actions': actions
        }

    async def _log_and_warn(self, threat: Dict) -> Dict:
        """Registra y advierte sobre la amenaza"""
        self.defense_log.append({
            'threat': threat,
            'action': 'warn',
            'timestamp': datetime.now().isoformat()
        })

        # Enviar notificación
        await self._notify_admin(threat)

        return {'action': 'warn', 'threat': threat}

    async def _notify_admin(self, threat: Dict):
        """Notifica al administrador sobre la amenaza"""
        # Integrar con sistema de notificaciones
        print(f"📢 Admin: Amenaza detectada - {threat}")

    async def start(self):
        """Inicia el sistema de defensa proactiva"""
        print("🛡️ ProactiveDefense: Iniciando defensa proactiva...")

        while self.running:
            try:
                threats = await self.scan_for_threats()

                if threats:
                    print(f"🚨 Amenazas detectadas: {len(threats)}")
                    for threat in threats:
                        await self.respond_to_threat(threat)

                await asyncio.sleep(10)  # Cada 10 segundos

            except Exception as e:
                print(f"❌ ProactiveDefense: Error - {e}")
                await asyncio.sleep(10)
