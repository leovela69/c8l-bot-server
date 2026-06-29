"""
🛡️ SKILLSCAN TELEGRAM HANDLER
================================
Comandos de Telegram para escaneo de seguridad.

Comandos:
  /scan               — Auditoría rápida del bot
  /scan full          — Auditoría completa
  /scan <url>         — Escanear URL/skill externo
  /scan file <path>   — Escanear archivo específico
  /scan fix           — Auto-reparar problemas detectados
  /scan status        — Estado del escáner
"""

import asyncio
import logging
import os
from typing import Dict

logger = logging.getLogger("c8l.skillscan.telegram")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))



# Lazy-load instances
_auditor = None
_client = None


def _get_auditor():
    global _auditor
    if _auditor is None:
        from skillscan.self_audit import SelfAuditor
        _auditor = SelfAuditor()
    return _auditor


def _get_client():
    global _client
    if _client is None:
        from skillscan.client import SkillScanClient
        try:
            from config import SKILLSCAN_API_KEY
            _client = SkillScanClient(api_key=SKILLSCAN_API_KEY)
        except (ImportError, AttributeError):
            _client = SkillScanClient()
    return _client


def parse_scan_command(text: str) -> Dict:
    """Parsea el comando /scan"""
    text = text.strip()
    for prefix in ['/scan', '/escanear', '/audit']:
        if text.lower().startswith(prefix):
            text = text[len(prefix):].strip()
            break

    if not text:
        return {'action': 'quick'}

    lower = text.lower()

    if lower in ('help', 'ayuda', '?'):
        return {'action': 'help'}
    if lower in ('full', 'completo', 'todo'):
        return {'action': 'full'}
    if lower in ('status', 'estado'):
        return {'action': 'status'}
    if lower in ('fix', 'arreglar', 'reparar', 'corregir'):
        return {'action': 'fix'}
    if lower.startswith('file ') or lower.startswith('archivo '):
        filepath = text.split(' ', 1)[1].strip()
        return {'action': 'scan_file', 'filepath': filepath}
    if lower.startswith('http://') or lower.startswith('https://'):
        return {'action': 'scan_url', 'url': text}
    if lower.startswith('github.com') or lower.startswith('npmjs.com'):
        return {'action': 'scan_url', 'url': f'https://{text}'}

    # Default: tratar como archivo o hacer quick scan
    if '.' in text and '/' in text:
        return {'action': 'scan_file', 'filepath': text}

    return {'action': 'quick'}


async def handle_scan_command(text: str, chat_id: str,
                              send_fn=None, typing_fn=None) -> Dict:
    """Handler principal para comandos /scan"""
    parsed = parse_scan_command(text)
    action = parsed['action']

    if action == 'help':
        return await _handle_help(send_fn, chat_id)
    elif action == 'status':
        return await _handle_status(send_fn, chat_id)
    elif action == 'quick':
        return await _handle_quick_audit(send_fn, typing_fn, chat_id)
    elif action == 'full':
        return await _handle_full_audit(send_fn, typing_fn, chat_id)
    elif action == 'scan_file':
        return await _handle_scan_file(parsed, send_fn, typing_fn, chat_id)
    elif action == 'scan_url':
        return await _handle_scan_url(parsed, send_fn, typing_fn, chat_id)
    elif action == 'fix':
        return await _handle_fix(send_fn, typing_fn, chat_id)

    return {'status': 'error', 'error': 'Acción no reconocida'}



async def _handle_help(send_fn, chat_id) -> Dict:
    help_text = (
        "🛡️ *SKILLSCAN — Escáner de Seguridad*\n\n"
        "📋 *Comandos:*\n"
        "• `/scan` — Auditoría rápida (archivos críticos)\n"
        "• `/scan full` — Auditoría completa (todo el repo)\n"
        "• `/scan <url>` — Escanear skill/herramienta externa\n"
        "• `/scan file <ruta>` — Escanear archivo específico\n"
        "• `/scan fix` — Auto-reparar problemas\n"
        "• `/scan status` — Estado del escáner\n\n"
        "🔍 *Qué detecta:*\n"
        "• 🔑 Credenciales expuestas\n"
        "• 📤 Exfiltración de datos\n"
        "• 💉 Inyección de prompts\n"
        "• 🐚 Reverse shells\n"
        "• ⛓️ Cadenas de amenazas MCP\n"
        "• 🤖 Manipulación de agentes\n\n"
        "💡 *Ejemplo:*\n"
        "`/scan file config.py`\n"
        "`/scan https://github.com/user/mcp-tool`"
    )
    if send_fn:
        send_fn(chat_id, help_text)
    return {'status': 'ok', 'action': 'help'}


async def _handle_status(send_fn, chat_id) -> Dict:
    auditor = _get_auditor()
    client = _get_client()

    detector_status = auditor.detector.get_status()
    client_status = client.get_status()

    text = (
        "🛡️ *SKILLSCAN STATUS*\n\n"
        f"🔍 Escaneos locales: {detector_status['scan_count']}\n"
        f"⚠️ Amenazas detectadas: {detector_status['total_threats']}\n"
        f"🌐 Escaneos API: {client_status['total_scans']}\n"
        f"🔑 API configurada: {'✅' if client_status['api_configured'] else '❌'}\n"
    )

    last_audit = auditor.last_audit
    if last_audit:
        summary = last_audit.get('summary', {})
        text += (
            f"\n📊 *Última auditoría:*\n"
            f"   Score: {summary.get('overall_score', 0):.0f}/100\n"
            f"   Riesgo: {summary.get('overall_risk', '?')}\n"
            f"   Fecha: {summary.get('audited_at', '?')[:16]}"
        )

    if send_fn:
        send_fn(chat_id, text)
    return {'status': 'ok'}


async def _handle_quick_audit(send_fn, typing_fn, chat_id) -> Dict:
    if send_fn:
        send_fn(chat_id, "🔍 Ejecutando auditoría rápida...")
    if typing_fn:
        typing_fn(chat_id)

    auditor = _get_auditor()
    result = await auditor.quick_audit()

    # Formatear resultado
    files = result.get('results', [])
    score = result.get('average_score', 100)
    findings = result.get('total_findings', 0)

    risk_emoji = '🟢' if score >= 80 else '🟡' if score >= 60 else '🟠' if score >= 40 else '🔴'

    lines = [
        "🛡️ *AUDITORÍA RÁPIDA*",
        f"{risk_emoji} Score promedio: *{score:.0f}/100*",
        f"📁 Archivos: {len(files)}",
        f"🔍 Hallazgos: {findings}",
        ""
    ]

    for fr in files:
        file_emoji = '✅' if fr.get('score', 100) >= 80 else '⚠️' if fr.get('score', 100) >= 60 else '❌'
        lines.append(f"  {file_emoji} `{fr.get('filename', '?')}` — {fr.get('score', 0)}/100")

    if findings > 0:
        lines.append(f"\n💡 Usa `/scan full` para detalles completos")
        lines.append(f"🔧 Usa `/scan fix` para auto-reparar")

    if send_fn:
        send_fn(chat_id, "\n".join(lines))
    return {'status': 'ok', 'score': score}


async def _handle_full_audit(send_fn, typing_fn, chat_id) -> Dict:
    if send_fn:
        send_fn(chat_id, "🔍 Ejecutando auditoría COMPLETA...\n⏱️ Esto puede tardar 30-60 segundos.")
    if typing_fn:
        typing_fn(chat_id)

    auditor = _get_auditor()
    result = await auditor.full_audit()
    report = auditor.format_audit_report(result)

    if send_fn:
        send_fn(chat_id, report)
    return {'status': 'ok', 'data': result.get('summary')}


async def _handle_scan_file(parsed, send_fn, typing_fn, chat_id) -> Dict:
    filepath = parsed.get('filepath', '')
    if typing_fn:
        typing_fn(chat_id)

    auditor = _get_auditor()
    result = await auditor.scan_single_file(filepath)

    if result.get('status') == 'error':
        if send_fn:
            send_fn(chat_id, f"❌ {result.get('error', 'Error')}")
        return result

    formatted = result.get('formatted', auditor.detector.format_report(result))
    if send_fn:
        send_fn(chat_id, formatted)
    return {'status': 'ok', 'score': result.get('score')}


async def _handle_scan_url(parsed, send_fn, typing_fn, chat_id) -> Dict:
    url = parsed.get('url', '')
    if send_fn:
        send_fn(chat_id, f"🌐 Escaneando: {url[:80]}...")
    if typing_fn:
        typing_fn(chat_id)

    client = _get_client()
    result = await client.scan_url(url)

    if result.get('status') == 'error':
        if send_fn:
            send_fn(chat_id, f"❌ Error: {result.get('error', 'Unknown')[:200]}")
        return result

    # Formatear resultado de API
    score = result.get('score', 0)
    risk = result.get('risk_level', 'UNKNOWN')
    findings = result.get('findings', [])

    risk_emoji = {'LOW': '🟢', 'MEDIUM': '🟡', 'HIGH': '🟠', 'CRITICAL': '🔴'}.get(risk, '⚪')

    lines = [
        f"🛡️ *ESCANEO DE URL*",
        f"🔗 {url[:60]}",
        f"{risk_emoji} Riesgo: *{risk}*",
        f"📊 Puntuación: *{score}/100*",
        f"🔍 Hallazgos: {len(findings)}",
    ]

    if findings:
        lines.append("")
        for f in findings[:8]:
            sev_emoji = {'CRITICAL': '🔴', 'HIGH': '🟠', 'MEDIUM': '🟡', 'LOW': '🟢'}.get(f.get('severity', ''), '⚪')
            lines.append(f"  {sev_emoji} {f.get('description', '?')}")

    if send_fn:
        send_fn(chat_id, "\n".join(lines))
    return {'status': 'ok', 'score': score}


async def _handle_fix(send_fn, typing_fn, chat_id) -> Dict:
    """Auto-repara problemas detectados en la última auditoría"""
    if send_fn:
        send_fn(chat_id, "🔧 Analizando problemas para auto-reparar...")
    if typing_fn:
        typing_fn(chat_id)

    auditor = _get_auditor()

    # Si no hay auditoría previa, hacer una rápida
    if not auditor.last_audit:
        await auditor.quick_audit()

    if not auditor.last_audit:
        if send_fn:
            send_fn(chat_id, "✅ No hay problemas para reparar.")
        return {'status': 'ok', 'fixes': 0}

    fixes = auditor.last_audit.get('fixes_available', [])
    auto_fixes = [f for f in fixes if f.get('auto_fixable')]

    if not fixes:
        if send_fn:
            send_fn(chat_id, "✅ No hay problemas para reparar. El sistema está limpio.")
        return {'status': 'ok', 'fixes': 0}

    lines = [
        "🔧 *CORRECCIONES DISPONIBLES*",
        f"Total: {len(fixes)} | Auto-corregibles: {len(auto_fixes)}",
        ""
    ]

    for i, fix in enumerate(fixes[:10], 1):
        auto = "✅" if fix.get('auto_fixable') else "⚠️"
        lines.append(f"  {i}. {auto} `{fix.get('file', '?')}` L{fix.get('line', 0)}")
        lines.append(f"     {fix.get('description', '')}")

    if auto_fixes:
        lines.append(f"\n💡 {len(auto_fixes)} correcciones pueden aplicarse automáticamente.")
        lines.append("⚠️ Requiere aprobación de Leo para aplicar cambios al código.")
    else:
        lines.append("\n⚠️ Las correcciones detectadas requieren revisión manual.")

    if send_fn:
        send_fn(chat_id, "\n".join(lines))
    return {'status': 'ok', 'fixes': len(fixes), 'auto_fixable': len(auto_fixes)}
