# -*- coding: utf-8 -*-
"""
👑 AION — Bot Inmortal Coordinador
El cerebro de la operación. Coordina al equipo, asigna tareas,
recibe informes y toma decisiones. Se ejecuta cada 5 minutos.
"""

import asyncio
import time
import json
import os
import logging
from typing import List

from bots.base import BotBase, REPORTS_DIR
from bots.aguilas.rendimiento import Aguila1Rendimiento
from bots.aguilas.contenido import Aguila2Contenido
from bots.aguilas.seguridad import Aguila3Seguridad
from bots.cerebros.datos import Cerebro1Datos
from bots.cerebros.contenido import Cerebro2Contenido
from bots.manos.codigo import Mano1Codigo
from bots.manos.contenido import Mano2Contenido

logger = logging.getLogger("c8l.aion")

# URL de la web C8L a monitorear
C8L_WEB_URL = os.environ.get("C8L_WEB_URL", "https://gen-lang-client-0744582882.web.app")


class AION(BotBase):
    """
    👑 AION — El coordinador inmortal.
    Orquesta a todo el equipo de bots cada 5 minutos.
    """

    def __init__(self):
        super().__init__("AION", "Coordinador")
        self.aguilas = [
            Aguila1Rendimiento(C8L_WEB_URL),
            Aguila2Contenido(C8L_WEB_URL),
            Aguila3Seguridad(C8L_WEB_URL),
        ]
        self.cerebros = [
            Cerebro1Datos(),
            Cerebro2Contenido(),
        ]
        self.manos = [
            Mano1Codigo(),
            Mano2Contenido(),
        ]
        self.cycle_count = self.load_memory("cycle_count", 0)

    async def run(self) -> dict:
        """Ejecuta un ciclo completo de monitoreo."""
        self.cycle_count += 1
        self.save_memory("cycle_count", self.cycle_count)
        logger.info(f"👑 AION — Ciclo #{self.cycle_count} iniciado")

        # 1. Enviar a las Águilas a explorar
        aguila_reports = []
        for aguila in self.aguilas:
            try:
                report = await aguila.run()
                aguila_reports.append(report)
            except Exception as e:
                aguila_reports.append({
                    "bot": aguila.name,
                    "status": "error",
                    "message": f"Error ejecutando: {e}",
                })

        # 2. Enviar informes a los Cerebros para análisis
        incidents = []
        for report in aguila_reports:
            if report.get("status") in ("warning", "error", "critical"):
                incidents.append(report)

        analysis_reports = []
        if incidents:
            for cerebro in self.cerebros:
                try:
                    analysis = await cerebro.analyze(incidents)
                    analysis_reports.append(analysis)
                except Exception as e:
                    logger.error(f"Error en {cerebro.name}: {e}")

        # 3. Si hay problemas, asignar a las Manos
        fixes = []
        for analysis in analysis_reports:
            tasks = analysis.get("data", {}).get("tasks", [])
            for task in tasks:
                task_type = task.get("type", "code")
                mano = self.manos[0] if task_type == "code" else self.manos[1]
                try:
                    fix_result = await mano.fix(task)
                    fixes.append(fix_result)
                except Exception as e:
                    fixes.append({"bot": mano.name, "status": "error", "message": str(e)})

        # 4. Generar informe final
        summary = self._generate_summary(aguila_reports, analysis_reports, fixes)
        self.save_memory("last_run", time.time())
        self.save_memory("last_summary", summary)

        return self.report("ok", summary["message"], summary)

    def _generate_summary(self, aguila_reports, analysis_reports, fixes) -> dict:
        """Genera el resumen para HERMES (el mensajero)."""
        total_checks = len(aguila_reports)
        warnings = sum(1 for r in aguila_reports if r.get("status") == "warning")
        errors = sum(1 for r in aguila_reports if r.get("status") in ("error", "critical"))
        fixes_ok = sum(1 for f in fixes if f.get("status") == "ok")
        fixes_fail = sum(1 for f in fixes if f.get("status") != "ok")

        if errors == 0 and warnings == 0:
            message = f"✅ Ciclo #{self.cycle_count}: Todo funciona correctamente. {total_checks} verificaciones sin problemas."
        elif errors > 0:
            message = f"🚨 Ciclo #{self.cycle_count}: {errors} errores detectados, {fixes_ok} reparados, {fixes_fail} pendientes."
        else:
            message = f"⚠️ Ciclo #{self.cycle_count}: {warnings} advertencias. {fixes_ok} correcciones aplicadas."

        return {
            "message": message,
            "cycle": self.cycle_count,
            "checks": total_checks,
            "warnings": warnings,
            "errors": errors,
            "fixes_applied": fixes_ok,
            "fixes_failed": fixes_fail,
            "aguila_reports": aguila_reports,
            "analysis_reports": analysis_reports,
            "fixes": fixes,
        }

    def get_telegram_report(self) -> str:
        """Genera el mensaje para enviar por Telegram."""
        summary = self.load_memory("last_summary", {})
        if not summary:
            return "👑 AION: Sin datos aún. Esperando primer ciclo."

        msg = f"👑 *AION — Informe del equipo*\n\n"
        msg += f"{summary.get('message', 'Sin datos')}\n\n"
        msg += f"📊 Verificaciones: {summary.get('checks', 0)}\n"
        msg += f"⚠️ Advertencias: {summary.get('warnings', 0)}\n"
        msg += f"❌ Errores: {summary.get('errors', 0)}\n"
        msg += f"🔧 Reparaciones: {summary.get('fixes_applied', 0)}\n"
        msg += f"🔄 Ciclo: #{summary.get('cycle', 0)}"
        return msg
