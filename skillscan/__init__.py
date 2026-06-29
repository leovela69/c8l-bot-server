"""
🛡️ C8L SkillScan — Escáner de Seguridad de Agentes de IA
==========================================================
Escanea habilidades MCP, herramientas y agentes en busca de amenazas.

Módulos:
- client: Cliente API de SkillScan (scan URLs, content, deep, batch)
- threat_detector: Motor local de detección de amenazas
- telegram_handler: Comandos /scan para Telegram
- self_audit: Auto-auditoría del sistema C8L
"""

from skillscan.client import SkillScanClient
from skillscan.threat_detector import ThreatDetector
from skillscan.self_audit import SelfAuditor

__all__ = [
    'SkillScanClient',
    'ThreatDetector',
    'SelfAuditor',
]

__version__ = "1.0.0"
