# -*- coding: utf-8 -*-
"""
⚡ DEPLOY CONTROL — Control de despliegues desde Telegram
==========================================================
Permite al bot:
- Reiniciar servicios en Render
- Ver logs de deploy
- Cambiar variables de entorno
- Trigger de nuevo deploy
- Verificar estado de servicios

Servicios soportados:
- Render (principal — bot 24/7)
- Vercel (futuro — web nueva)

Seguridad:
- Solo ADMIN puede ejecutar operaciones
- Confirmación obligatoria para restart/redeploy
- Log de todas las acciones

Autor: C8L Agency / Leo
"""

import os
import time
import logging
from typing import Optional, Dict, List, Any
from dataclasses import dataclass

logger = logging.getLogger("c8l.integrations.deploy")


@dataclass
class DeployResult:
    """Resultado de una operación de deploy."""
    success: bool
    message: str
    data: Optional[Dict] = None
    url: Optional[str] = None


class DeployControl:
    """
    ⚡ Control de despliegues Render + Vercel.

    Uso:
        deploy = DeployControl()
        result = deploy.get_service_status()
        result = deploy.trigger_deploy()
        result = deploy.get_logs()
    """

    RENDER_API_BASE = "https://api.render.com/v1"

    def __init__(self):
        self.render_api_key = os.environ.get("RENDER_API_KEY", "")
        self.render_service_id = os.environ.get("RENDER_SERVICE_ID", "")
        self.vercel_token = os.environ.get("VERCEL_TOKEN", "")
        self.vercel_project_id = os.environ.get("VERCEL_PROJECT_ID", "")
        self._stats = {
            "deploys_triggered": 0,
            "restarts": 0,
            "status_checks": 0,
            "errors": 0,
        }

        if self.render_api_key:
            logger.info("✅ Deploy Control: Render configurado")
        else:
            logger.warning("⚠️ Deploy Control: Sin RENDER_API_KEY")

    def _render_headers(self) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {self.render_api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    def _render_api(self, method: str, endpoint: str,
                    json_data: Dict = None) -> Dict:
        """Llamada a la API de Render."""
        import httpx

        url = f"{self.RENDER_API_BASE}{endpoint}"
        with httpx.Client(timeout=30) as client:
            if method == "GET":
                resp = client.get(url, headers=self._render_headers())
            elif method == "POST":
                resp = client.post(url, headers=self._render_headers(),
                                   json=json_data or {})
            elif method == "PUT":
                resp = client.put(url, headers=self._render_headers(),
                                  json=json_data)
            elif method == "PATCH":
                resp = client.patch(url, headers=self._render_headers(),
                                    json=json_data)
            else:
                raise ValueError(f"Método no soportado: {method}")

            if resp.status_code >= 400:
                error = resp.text[:300]
                raise Exception(f"Render API {resp.status_code}: {error}")

            if resp.status_code == 204:
                return {}
            return resp.json()

    # ===================================================================
    # RENDER — ESTADO
    # ===================================================================

    def get_service_status(self) -> DeployResult:
        """
        Obtiene el estado actual del servicio en Render.

        Returns:
            Estado del servicio (running, deploying, failed, etc.)
        """
        if not self.render_api_key or not self.render_service_id:
            return DeployResult(
                success=False,
                message="❌ RENDER_API_KEY o RENDER_SERVICE_ID no configurado"
            )

        try:
            data = self._render_api("GET",
                f"/services/{self.render_service_id}")
            service = data.get("service", data)

            status = service.get("suspended", "unknown")
            name = service.get("name", "unknown")
            stype = service.get("type", "unknown")
            region = service.get("region", "unknown")
            updated = service.get("updatedAt", "")[:19]

            self._stats["status_checks"] += 1

            # Determinar estado real
            if service.get("suspended") == "not_suspended":
                state = "🟢 RUNNING"
            elif service.get("suspended") == "suspended":
                state = "🔴 SUSPENDED"
            else:
                state = f"🟡 {status}"

            return DeployResult(
                success=True,
                message=(
                    f"📊 *Servicio Render*\n\n"
                    f"📛 Nombre: {name}\n"
                    f"📦 Tipo: {stype}\n"
                    f"🌍 Región: {region}\n"
                    f"📡 Estado: {state}\n"
                    f"🕐 Última actualización: {updated}"
                ),
                data={
                    "name": name,
                    "status": status,
                    "type": stype,
                    "region": region,
                },
                url=f"https://dashboard.render.com/web/{self.render_service_id}",
            )
        except Exception as e:
            self._stats["errors"] += 1
            return DeployResult(success=False, message=f"❌ Error: {e}")

    # ===================================================================
    # RENDER — DEPLOY
    # ===================================================================

    def trigger_deploy(self, clear_cache: bool = False) -> DeployResult:
        """
        Trigger un nuevo deploy en Render.

        Args:
            clear_cache: Si limpiar cache de build
        """
        if not self.render_api_key or not self.render_service_id:
            return DeployResult(success=False,
                message="❌ Render no configurado")

        try:
            payload = {}
            if clear_cache:
                payload["clearCache"] = "clear"

            data = self._render_api("POST",
                f"/services/{self.render_service_id}/deploys", payload)

            deploy = data.get("deploy", data)
            deploy_id = deploy.get("id", "unknown")
            status = deploy.get("status", "created")

            self._stats["deploys_triggered"] += 1

            return DeployResult(
                success=True,
                message=(
                    f"🚀 *Deploy iniciado*\n\n"
                    f"🆔 ID: `{deploy_id[:12]}`\n"
                    f"📡 Estado: {status}\n"
                    f"🧹 Cache: {'limpiado' if clear_cache else 'mantenido'}\n\n"
                    f"_El deploy tarda 1-3 minutos..._"
                ),
                data={"deploy_id": deploy_id, "status": status},
            )
        except Exception as e:
            self._stats["errors"] += 1
            return DeployResult(success=False, message=f"❌ Error deploy: {e}")

    def restart_service(self) -> DeployResult:
        """Reinicia el servicio sin nuevo build."""
        if not self.render_api_key or not self.render_service_id:
            return DeployResult(success=False,
                message="❌ Render no configurado")

        try:
            self._render_api("POST",
                f"/services/{self.render_service_id}/restart")

            self._stats["restarts"] += 1

            return DeployResult(
                success=True,
                message=(
                    "🔄 *Servicio reiniciado*\n\n"
                    "El bot se reiniciará en ~30 segundos.\n"
                    "_Puede haber un breve downtime._"
                ),
            )
        except Exception as e:
            self._stats["errors"] += 1
            return DeployResult(success=False, message=f"❌ Error restart: {e}")

    # ===================================================================
    # RENDER — LOGS
    # ===================================================================

    def get_deploys(self, count: int = 5) -> DeployResult:
        """Lista los últimos deploys."""
        if not self.render_api_key or not self.render_service_id:
            return DeployResult(success=False,
                message="❌ Render no configurado")

        try:
            data = self._render_api("GET",
                f"/services/{self.render_service_id}/deploys?limit={count}")

            deploys = []
            items = data if isinstance(data, list) else data.get("deploys", [])
            for d in items[:count]:
                deploy = d.get("deploy", d)
                status = deploy.get("status", "unknown")
                created = deploy.get("createdAt", "")[:16]
                commit_msg = deploy.get("commit", {}).get("message", "")[:50]

                icon = {
                    "live": "🟢", "build_in_progress": "🔨",
                    "update_in_progress": "🔄", "deactivated": "⚪",
                    "build_failed": "🔴", "canceled": "⚫",
                }.get(status, "🟡")

                deploys.append(f"{icon} {status} | {created} | {commit_msg}")

            return DeployResult(
                success=True,
                message=(
                    f"📋 *Últimos {len(deploys)} deploys*\n\n" +
                    "\n".join(deploys)
                ),
                data={"deploys": deploys},
            )
        except Exception as e:
            self._stats["errors"] += 1
            return DeployResult(success=False, message=f"❌ Error: {e}")

    # ===================================================================
    # RENDER — ENV VARS
    # ===================================================================

    def get_env_vars(self) -> DeployResult:
        """Lista las variables de entorno (solo nombres, no valores)."""
        if not self.render_api_key or not self.render_service_id:
            return DeployResult(success=False,
                message="❌ Render no configurado")

        try:
            data = self._render_api("GET",
                f"/services/{self.render_service_id}/env-vars")

            env_vars = data if isinstance(data, list) else data.get("envVars", [])
            var_names = []
            for ev in env_vars:
                var = ev.get("envVar", ev)
                name = var.get("key", "?")
                # Ocultar valores por seguridad
                var_names.append(f"  • `{name}`")

            return DeployResult(
                success=True,
                message=(
                    f"🔐 *Variables de entorno* ({len(var_names)})\n\n" +
                    "\n".join(var_names[:30]) +
                    ("\n  ..." if len(var_names) > 30 else "")
                ),
                data={"count": len(var_names)},
            )
        except Exception as e:
            self._stats["errors"] += 1
            return DeployResult(success=False, message=f"❌ Error: {e}")

    def set_env_var(self, key: str, value: str) -> DeployResult:
        """
        Establece/actualiza una variable de entorno.

        CUIDADO: Esto triggerea un redeploy automático en Render.
        """
        if not self.render_api_key or not self.render_service_id:
            return DeployResult(success=False,
                message="❌ Render no configurado")

        try:
            self._render_api("PUT",
                f"/services/{self.render_service_id}/env-vars/{key}",
                {"value": value})

            return DeployResult(
                success=True,
                message=(
                    f"✅ Variable `{key}` actualizada\n\n"
                    f"⚠️ _Esto triggerea un redeploy automático_"
                ),
            )
        except Exception as e:
            self._stats["errors"] += 1
            return DeployResult(success=False, message=f"❌ Error: {e}")

    # ===================================================================
    # HEALTH CHECK EXTERNO
    # ===================================================================

    def check_bot_health(self, health_url: str = "") -> DeployResult:
        """Verifica si el bot está respondiendo."""
        import httpx

        url = health_url or os.environ.get("BOT_HEALTH_URL",
            "https://c8l-bot-server.onrender.com/health")

        try:
            with httpx.Client(timeout=10) as client:
                resp = client.get(url)
                if resp.status_code == 200:
                    data = resp.json()
                    return DeployResult(
                        success=True,
                        message=(
                            f"✅ *Bot ALIVE*\n\n"
                            f"⏱️ Uptime: {data.get('uptime_hours', '?')}h\n"
                            f"📨 Mensajes: {data.get('messages', '?')}\n"
                            f"🔌 APIs: {data.get('providers_active', '?')}\n"
                            f"📡 Versión: {data.get('version', '?')}"
                        ),
                        data=data,
                    )
                else:
                    return DeployResult(
                        success=False,
                        message=f"⚠️ Bot respondió con HTTP {resp.status_code}",
                    )
        except Exception as e:
            return DeployResult(
                success=False,
                message=f"🔴 *Bot NO responde*\n\nError: {e}\n\n_¿Reiniciar? /deploy restart_",
            )

    # ===================================================================
    # STATS
    # ===================================================================

    def get_stats(self) -> Dict[str, Any]:
        return {
            **self._stats,
            "render_configured": bool(self.render_api_key),
            "vercel_configured": bool(self.vercel_token),
        }

    def get_stats_text(self) -> str:
        s = self._stats
        return (
            f"🚀 *Deploy Control*\n"
            f"🔄 Deploys: {s['deploys_triggered']}\n"
            f"♻️ Restarts: {s['restarts']}\n"
            f"📊 Status checks: {s['status_checks']}\n"
            f"❌ Errores: {s['errors']}\n"
            f"🔑 Render: {'✅' if self.render_api_key else '❌'} | "
            f"Vercel: {'✅' if self.vercel_token else '❌'}"
        )


# ---------------------------------------------------------------------------
# Singleton
# ---------------------------------------------------------------------------
_deploy_instance: Optional[DeployControl] = None


def get_deploy_control() -> DeployControl:
    """Obtiene la instancia global de Deploy Control."""
    global _deploy_instance
    if _deploy_instance is None:
        _deploy_instance = DeployControl()
    return _deploy_instance
