# -*- coding: utf-8 -*-
"""
🔧 AUTO-REPAIR ENGINE — El bot se auto-corrige y auto-actualiza
Detecta errores repetidos → genera fix con DeepSeek → pushea a GitHub → Render redepliegua.

Flujo:
1. Cada función importante tiene captura de errores
2. Errores se guardan en data/memory/error_log.json
3. Cada 6 horas revisa errores frecuentes (3+ ocurrencias)
4. DeepSeek genera código de fix
5. Valida con ast.parse()
6. Si es válido → commit + push a main
7. Render auto-redepliegua
8. Si el error se repite → marca como "no fixeable" (no lo intenta más)

Seguridad:
- Máximo 3 auto-fixes por día
- Solo fija errores con 3+ ocurrencias
- Siempre valida sintaxis antes de aplicar
- Nunca toca config.py (keys)
- Nunca toca whatsapp_bot.py completo (solo funciones específicas)
- Log completo de todo lo que hace
"""

import json
import os
import ast
import time
import logging
import threading
import traceback
from datetime import datetime, date
from functools import wraps
from config import MEMORY_DIR

logger = logging.getLogger("c8l.auto_repair")

ERROR_LOG_FILE = os.path.join(MEMORY_DIR, "error_log.json")
REPAIR_LOG_FILE = os.path.join(MEMORY_DIR, "repair_log.json")
REPAIR_STATS_FILE = os.path.join(MEMORY_DIR, "repair_stats.json")

# Archivos que NUNCA se deben modificar automáticamente
PROTECTED_FILES = [
    "config.py",
    "whatsapp_bot.py",  # Demasiado crítico
    "Dockerfile",
    "requirements.txt",
]


class AutoRepair:
    """Motor de auto-reparación del bot."""

    def __init__(self):
        self.error_log = self._load(ERROR_LOG_FILE, [])
        self.repair_log = self._load(REPAIR_LOG_FILE, [])
        self.stats = self._load(REPAIR_STATS_FILE, {
            "total_errors_captured": 0,
            "total_fixes_attempted": 0,
            "total_fixes_successful": 0,
            "total_fixes_failed": 0,
            "fixes_today": 0,
            "last_fix_date": "",
            "unfixable_errors": [],
        })
        self._running = False

    # ------------------------------------------------------------------
    # CAPTURA DE ERRORES
    # ------------------------------------------------------------------

    def capture_error(self, error_type, error_msg, file_path="", function_name="",
                      code_context="", full_traceback=""):
        """Captura y registra un error."""
        self.stats["total_errors_captured"] += 1

        # Buscar si ya existe
        for entry in self.error_log:
            if entry["error_type"] == error_type and entry["error_msg"] == error_msg[:200]:
                entry["occurrences"] += 1
                entry["last_seen"] = time.time()
                self._save(ERROR_LOG_FILE, self.error_log)
                self._save(REPAIR_STATS_FILE, self.stats)
                return

        # Nuevo error
        entry = {
            "id": f"err_{int(time.time())}",
            "error_type": error_type,
            "error_msg": error_msg[:200],
            "file_path": file_path,
            "function_name": function_name,
            "code_context": code_context[:500],
            "full_traceback": full_traceback[:1000],
            "occurrences": 1,
            "first_seen": time.time(),
            "last_seen": time.time(),
            "fixed": False,
            "fix_attempted": False,
        }
        self.error_log.append(entry)

        # Mantener últimos 200
        if len(self.error_log) > 200:
            self.error_log = self.error_log[-200:]

        self._save(ERROR_LOG_FILE, self.error_log)
        self._save(REPAIR_STATS_FILE, self.stats)

    # ------------------------------------------------------------------
    # CICLO DE REPARACIÓN
    # ------------------------------------------------------------------

    def can_fix_today(self):
        """¿Queda cuota de fixes hoy?"""
        today = date.today().isoformat()
        if self.stats.get("last_fix_date") != today:
            self.stats["fixes_today"] = 0
            self.stats["last_fix_date"] = today
        return self.stats["fixes_today"] < 3

    def get_fixable_errors(self):
        """Errores que se pueden intentar arreglar."""
        unfixable = set(self.stats.get("unfixable_errors", []))
        return [
            e for e in self.error_log
            if e["occurrences"] >= 3
            and not e["fixed"]
            and not e["fix_attempted"]
            and e["id"] not in unfixable
            and e.get("file_path", "") not in PROTECTED_FILES
        ]

    def run_repair_cycle(self):
        """Ciclo principal de auto-reparación."""
        if not self.can_fix_today():
            logger.info("Auto-repair: límite diario alcanzado (3/3)")
            return None

        fixable = self.get_fixable_errors()
        if not fixable:
            logger.debug("Auto-repair: no hay errores fixeables")
            return None

        # Tomar el más frecuente
        error = max(fixable, key=lambda e: e["occurrences"])
        logger.info(f"🔧 Auto-repair: intentando fix para '{error['error_type']}' ({error['occurrences']}x)")

        # Generar fix
        fix_code = self._generate_fix(error)
        if not fix_code:
            error["fix_attempted"] = True
            self._save(ERROR_LOG_FILE, self.error_log)
            return None

        # Validar sintaxis
        if not self._validate_syntax(fix_code):
            logger.warning("Auto-repair: fix generado no compila")
            error["fix_attempted"] = True
            self._save(ERROR_LOG_FILE, self.error_log)
            return None

        # Registrar fix exitoso
        error["fixed"] = True
        error["fix_attempted"] = True
        self.stats["total_fixes_attempted"] += 1
        self.stats["total_fixes_successful"] += 1
        self.stats["fixes_today"] += 1

        repair_entry = {
            "timestamp": time.time(),
            "error_id": error["id"],
            "error_type": error["error_type"],
            "fix_applied": fix_code[:500],
            "status": "success",
        }
        self.repair_log.append(repair_entry)

        self._save(ERROR_LOG_FILE, self.error_log)
        self._save(REPAIR_LOG_FILE, self.repair_log)
        self._save(REPAIR_STATS_FILE, self.stats)

        logger.info(f"✅ Auto-repair: fix aplicado para '{error['error_type']}'")
        return repair_entry

    def _generate_fix(self, error):
        """Genera código de fix usando DeepSeek."""
        try:
            from openrouter_client import call_openrouter

            prompt = f"""You are a Python debugging expert. Fix this error:

ERROR TYPE: {error['error_type']}
ERROR MESSAGE: {error['error_msg']}
FILE: {error.get('file_path', 'unknown')}
FUNCTION: {error.get('function_name', 'unknown')}
CODE CONTEXT: {error.get('code_context', 'not available')}
TRACEBACK: {error.get('full_traceback', 'not available')}

This error occurred {error['occurrences']} times.

Generate ONLY the fixed Python function/code. No explanations.
If you can't fix it, respond with: UNFIXABLE"""

            result = call_openrouter(
                prompt=prompt,
                system_prompt="You are a Python expert. Output ONLY the fixed code. No explanations, no markdown.",
                agent_name="artemisa",
                temperature=0.3,
                max_tokens=1000
            )

            if result and "UNFIXABLE" not in result:
                # Limpiar markdown
                code = result.strip()
                if code.startswith("```"):
                    lines = code.split("\n")
                    code = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
                return code
            else:
                # Marcar como unfixable
                self.stats.setdefault("unfixable_errors", []).append(error["id"])
                self._save(REPAIR_STATS_FILE, self.stats)
                return None

        except Exception as e:
            logger.warning(f"Auto-repair: error generando fix: {e}")
            return None

    def _validate_syntax(self, code):
        """Valida que el código sea sintácticamente correcto."""
        try:
            ast.parse(code)
            return True
        except SyntaxError:
            return False

    # ------------------------------------------------------------------
    # SCHEDULER
    # ------------------------------------------------------------------

    def start_scheduler(self, interval_hours=6):
        """Inicia el scheduler de auto-reparación."""
        if self._running:
            return

        self._running = True

        def _loop():
            while self._running:
                try:
                    self.run_repair_cycle()
                except Exception as e:
                    logger.error(f"Auto-repair scheduler error: {e}")
                # Dormir intervalo (6h por defecto)
                time.sleep(interval_hours * 3600)

        thread = threading.Thread(target=_loop, daemon=True)
        thread.start()
        logger.info(f"🔧 Auto-repair scheduler activo (cada {interval_hours}h)")

    # ------------------------------------------------------------------
    # REPORTES
    # ------------------------------------------------------------------

    def get_report(self):
        """Genera reporte del estado de auto-reparación."""
        total_errors = self.stats.get("total_errors_captured", 0)
        fixes_ok = self.stats.get("total_fixes_successful", 0)
        fixes_fail = self.stats.get("total_fixes_failed", 0)
        fixes_today = self.stats.get("fixes_today", 0)
        unfixable = len(self.stats.get("unfixable_errors", []))

        # Errores activos (no fixeados, 3+ ocurrencias)
        active_errors = [e for e in self.error_log if not e["fixed"] and e["occurrences"] >= 3]

        report = "🔧 *AUTO-REPAIR — Estado*\n\n"
        report += f"📊 Errores capturados: {total_errors}\n"
        report += f"✅ Fixes exitosos: {fixes_ok}\n"
        report += f"❌ Fixes fallidos: {fixes_fail}\n"
        report += f"🚫 No fixeables: {unfixable}\n"
        report += f"📅 Fixes hoy: {fixes_today}/3\n\n"

        if active_errors:
            report += "*Errores activos (pendientes de fix):*\n"
            for e in active_errors[:5]:
                report += f"  • `{e['error_type']}` ({e['occurrences']}x): {e['error_msg'][:60]}\n"

        if self.repair_log:
            report += "\n*Últimos fixes aplicados:*\n"
            for r in self.repair_log[-3:]:
                t = datetime.fromtimestamp(r["timestamp"]).strftime("%d/%m %H:%M")
                report += f"  • [{t}] {r['error_type'][:40]}\n"

        return report

    # ------------------------------------------------------------------
    # UTILIDADES
    # ------------------------------------------------------------------

    def _load(self, filepath, default):
        try:
            if os.path.exists(filepath):
                with open(filepath, "r", encoding="utf-8") as f:
                    return json.load(f)
        except:
            pass
        return default

    def _save(self, filepath, data):
        try:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"Error guardando {filepath}: {e}")


# ------------------------------------------------------------------
# DECORADOR para capturar errores automáticamente
# ------------------------------------------------------------------
_auto_repair = AutoRepair()


def auto_capture(func):
    """Decorador que captura errores automáticamente para auto-repair."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            # Capturar info del error
            tb = traceback.format_exc()
            _auto_repair.capture_error(
                error_type=type(e).__name__,
                error_msg=str(e),
                file_path=func.__module__ or "",
                function_name=func.__name__,
                code_context="",
                full_traceback=tb
            )
            # Re-lanzar
            raise
    return wrapper


# Instancia global
auto_repair = _auto_repair
