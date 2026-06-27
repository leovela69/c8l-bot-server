# bot_interface.py — Interfaz para que el Bot C8L use el Estudio Creativo
import requests
import logging

logger = logging.getLogger(__name__)


class BotCreativeInterface:
    """
    Interfaz para que el bot C8L use el Estudio Creativo via API.
    El bot llama a estos métodos y recibe URLs de los resultados.
    """

    def __init__(self, studio_url: str = "https://studio.c8l.com"):
        self.base = studio_url

    def procesar_orden(self, orden: str, params: dict = None) -> dict:
        """
        Procesa una orden del bot.
        Ordenes: diseno, imagen, video, editar, exportar, status
        """
        params = params or {}
        handlers = {
            "diseno": self._cmd_diseno,
            "imagen": self._cmd_imagen,
            "video": self._cmd_video,
            "editar": self._cmd_editar,
            "exportar": self._cmd_exportar,
            "status": self._cmd_status,
            "batch": self._cmd_batch,
        }
        handler = handlers.get(orden)
        if not handler:
            return {"success": False, "error": f"Orden '{orden}' no reconocida"}
        try:
            return handler(params)
        except Exception as e:
            logger.error(f"Error procesando orden '{orden}': {e}")
            return {"success": False, "error": str(e)}

    def _cmd_diseno(self, params: dict) -> dict:
        """Crea un diseño (poster, instagram, youtube, logo, story, banner)."""
        resp = requests.post(f"{self.base}/api/canva/design", json={
            "tipo": params.get("tipo", "poster"),
            "texto": params.get("texto", "C8L Studio"),
            "colores": params.get("colores", {}),
        }, timeout=30)
        data = resp.json()
        if data.get("success"):
            return {
                "success": True,
                "message": f"✅ Diseño '{params.get('tipo', 'poster')}' creado",
                "url": data.get("url"),
            }
        return data

    def _cmd_imagen(self, params: dict) -> dict:
        """Genera imagen con IA."""
        resp = requests.post(f"{self.base}/api/ai/image", json={
            "prompt": params.get("prompt", "Paisaje futurista"),
            "style": params.get("style", "realistic"),
            "width": params.get("width", 1024),
            "height": params.get("height", 1024),
        }, timeout=120)
        data = resp.json()
        if data.get("success"):
            return {
                "success": True,
                "message": f"✅ Imagen IA generada ({data.get('source', 'ai')})",
                "url": data.get("url"),
                "prompt": params.get("prompt"),
            }
        return data

    def _cmd_video(self, params: dict) -> dict:
        """Genera video con IA."""
        resp = requests.post(f"{self.base}/api/ai/video", json={
            "prompt": params.get("prompt", "Escena épica"),
            "duration": params.get("duration", 5),
            "style": params.get("style", "cinematic"),
        }, timeout=180)
        data = resp.json()
        if data.get("success"):
            msg = "✅ Video generado"
            if data.get("task_id"):
                msg = f"⏳ Video en proceso (task_id: {data['task_id']})"
            return {"success": True, "message": msg, **data}
        return data

    def _cmd_editar(self, params: dict) -> dict:
        """Edita una imagen."""
        resp = requests.post(f"{self.base}/api/adobe/edit", json={
            "imagen_url": params.get("imagen_url"),
            "operacion": params.get("operacion", "recortar"),
            "params": params.get("params", {}),
        }, timeout=60)
        data = resp.json()
        if data.get("success"):
            return {
                "success": True,
                "message": f"✅ Edición '{params.get('operacion')}' aplicada",
                "url": data.get("url"),
            }
        return data

    def _cmd_exportar(self, params: dict) -> dict:
        """Exporta a otro formato."""
        resp = requests.post(f"{self.base}/api/export", json={
            "archivo": params.get("archivo"),
            "formato": params.get("formato", "png"),
        }, timeout=60)
        data = resp.json()
        if data.get("success"):
            return {
                "success": True,
                "message": f"✅ Exportado a {params.get('formato', 'png').upper()}",
                "url": data.get("url"),
            }
        return data

    def _cmd_batch(self, params: dict) -> dict:
        """Genera contenido en batch."""
        resp = requests.post(f"{self.base}/api/flow/batch", json={
            "prompts": params.get("prompts", []),
            "style": params.get("style", "realistic"),
        }, timeout=300)
        return resp.json()

    def _cmd_status(self, params: dict) -> dict:
        """Estado del estudio."""
        resp = requests.get(f"{self.base}/api/status", timeout=10)
        return resp.json()
