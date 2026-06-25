# -*- coding: utf-8 -*-
"""
🌐 HERMES — API HTTP Server
Permite que la web C8L se comunique con Hermes.
Puerto 8081 — endpoints para chat, imagenes, premium, etc.
"""

import json
import logging
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
from config import PORT, ADMIN_CHAT_ID

logger = logging.getLogger("hermes.api")

# Referencia global al bot y modulos (se setea al iniciar)
_bot = None
_chat_fn = None
_image_fn = None
_premium_fn = None
_apolo_fn = None

API_PORT = 8081


def set_handlers(bot, chat_fn, image_fn, premium_mod, apolo_mod):
    """Configura los handlers del API."""
    global _bot, _chat_fn, _image_fn, _premium_fn, _apolo_fn
    _bot = bot
    _chat_fn = chat_fn
    _image_fn = image_fn
    _premium_fn = premium_mod
    _apolo_fn = apolo_mod


class APIHandler(BaseHTTPRequestHandler):
    """Handler HTTP para la API de Hermes."""

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length > 0:
            body = self.rfile.read(length)
            return json.loads(body.decode("utf-8"))
        return {}

    def do_OPTIONS(self):
        """CORS preflight."""
        self._send_json({"ok": True})

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        if path == "/api/status":
            self._handle_status()
        elif path == "/api/metrics":
            self._handle_metrics()
        elif path == "/api/health":
            self._send_json({"status": "ok", "bot": "hermes", "version": "2.0"})
        else:
            self._send_json({"error": "endpoint no encontrado"}, 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path

        try:
            body = self._read_body()
        except:
            self._send_json({"error": "JSON invalido"}, 400)
            return

        if path == "/api/chat":
            self._handle_chat(body)
        elif path == "/api/generate-image":
            self._handle_image(body)
        elif path == "/api/generate-beat":
            self._handle_beat(body)
        elif path == "/api/generate-code":
            self._handle_code(body)
        elif path == "/api/verify-premium":
            self._handle_verify_premium(body)
        elif path == "/api/activate-premium":
            self._handle_activate_premium(body)
        elif path == "/api/transaction":
            self._handle_transaction(body)
        elif path == "/api/balance":
            self._handle_balance(body)
        else:
            self._send_json({"error": "endpoint no encontrado"}, 404)

    def _handle_status(self):
        self._send_json({
            "status": "online",
            "bot": "hermes_c8l",
            "version": "2.0",
            "workers": {
                "atenea": "active",
                "hefesto": "active",
                "ares": "active",
                "apolo": "active"
            },
            "timestamp": time.time()
        })

    def _handle_metrics(self):
        if _apolo_fn:
            metrics = _apolo_fn.get_summary()
        else:
            metrics = {"message": "Apolo no inicializado"}
        self._send_json(metrics)

    def _handle_chat(self, body):
        user_id = body.get("user_id", "web_anonymous")
        message = body.get("message", "")
        username = body.get("username", "web_user")
        is_premium = body.get("is_premium", False)

        if not message:
            self._send_json({"error": "message requerido"}, 400)
            return

        # Rate limit: gratis = 5/hora, premium = 100/hora
        if not is_premium:
            # Check simple rate limit
            pass

        if _chat_fn:
            reply = _chat_fn(user_id, message, username)
            self._send_json({"reply": reply, "worker": "atenea"})
        else:
            self._send_json({"error": "chat no disponible"}, 503)

    def _handle_image(self, body):
        prompt = body.get("prompt", "")
        style = body.get("style", "flux")
        is_premium = body.get("is_premium", False)

        if not prompt:
            self._send_json({"error": "prompt requerido"}, 400)
            return

        if not is_premium:
            self._send_json({"error": "Funcion premium. Necesitas invitacion."}, 403)
            return

        if _image_fn:
            result = _image_fn(prompt, style)
            if result:
                import base64
                img_base64 = base64.b64encode(result.getvalue()).decode("utf-8")
                self._send_json({"image": img_base64, "style": style, "worker": "hefesto"})
            else:
                self._send_json({"error": "No se pudo generar imagen"}, 500)
        else:
            self._send_json({"error": "imagenes no disponible"}, 503)

    def _handle_beat(self, body):
        genre = body.get("genre", "Bolero-House")
        mood = body.get("mood", "Energico")
        bpm = body.get("bpm", 118)
        description = body.get("description", "")
        is_premium = body.get("is_premium", False)

        if not is_premium:
            self._send_json({"error": "Funcion premium"}, 403)
            return

        # Usar Mixture of Agents para generar idea musical
        if _chat_fn:
            prompt = f"Genera una idea detallada para un beat de {genre}, mood {mood}, {bpm} BPM. {description}. Incluye: estructura, instrumentos, progresion de acordes, y tips de produccion."
            result = _chat_fn("beat_generator", prompt, "hefesto")
            self._send_json({"beat_idea": result, "genre": genre, "bpm": bpm, "worker": "hefesto"})
        else:
            self._send_json({"error": "servicio no disponible"}, 503)

    def _handle_code(self, body):
        instruction = body.get("instruction", "")
        language = body.get("language", "python")
        is_premium = body.get("is_premium", False)

        if not instruction:
            self._send_json({"error": "instruction requerido"}, 400)
            return

        if not is_premium:
            self._send_json({"error": "Funcion premium"}, 403)
            return

        if _chat_fn:
            prompt = f"Genera codigo {language} para: {instruction}. Solo codigo, sin explicaciones."
            result = _chat_fn("code_generator", prompt, "hefesto")
            self._send_json({"code": result, "language": language, "worker": "hefesto"})
        else:
            self._send_json({"error": "servicio no disponible"}, 503)

    def _handle_verify_premium(self, body):
        invite_code = body.get("invite_code", "")
        user_id = body.get("user_id", "")

        if not invite_code or not user_id:
            self._send_json({"error": "invite_code y user_id requeridos"}, 400)
            return

        if _premium_fn:
            is_valid = _premium_fn.verify_code(invite_code)
            if is_valid:
                _premium_fn.activate_user(user_id, invite_code)
                self._send_json({"premium": True, "message": "Premium activado!"})
            else:
                self._send_json({"premium": False, "message": "Codigo invalido o expirado"})
        else:
            self._send_json({"error": "premium no disponible"}, 503)

    def _handle_activate_premium(self, body):
        admin_key = body.get("admin_key", "")
        if admin_key != ADMIN_CHAT_ID:
            self._send_json({"error": "no autorizado"}, 403)
            return

        if _premium_fn:
            code = _premium_fn.generate_code(
                created_by="admin",
                max_uses=body.get("max_uses", 1),
                days_valid=body.get("days_valid", 30)
            )
            self._send_json({"code": code, "message": "Codigo premium creado"})
        else:
            self._send_json({"error": "premium no disponible"}, 503)

    def _handle_transaction(self, body):
        if _apolo_fn:
            _apolo_fn.register_transaction(body)
            self._send_json({"ok": True})
        else:
            self._send_json({"error": "apolo no disponible"}, 503)

    def _handle_balance(self, body):
        user_id = body.get("user_id", "")
        if _apolo_fn:
            balance = _apolo_fn.get_user_balance(user_id)
            self._send_json(balance)
        else:
            self._send_json({"error": "apolo no disponible"}, 503)

    def log_message(self, format, *args):
        pass  # Silenciar logs HTTP


def start_api_server():
    """Inicia el servidor API en un thread separado."""
    server = HTTPServer(("0.0.0.0", API_PORT), APIHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    logger.info(f"API Server iniciado en puerto {API_PORT}")
    return server
