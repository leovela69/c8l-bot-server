# -*- coding: utf-8 -*-
"""
📱 WHATSAPP HANDLER — Integración con WhatsApp Cloud API (Meta)
Mismo cerebro que Telegram, diferente canal.

El Health Check server ahora también maneja webhooks de WhatsApp:
- GET /webhook → verificación de Meta
- POST /webhook → mensajes entrantes de WhatsApp
"""

import json
import logging
import requests
import io
from config import (
    WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_API_URL,
    WHATSAPP_VERIFY_TOKEN
)

logger = logging.getLogger("c8l.whatsapp")

WA_API = f"https://graph.facebook.com/v21.0/{WHATSAPP_PHONE_ID}"


# ---------------------------------------------------------------------------
# ENVIAR MENSAJES
# ---------------------------------------------------------------------------

def wa_send_text(to, text):
    """Envía mensaje de texto por WhatsApp."""
    # WhatsApp tiene límite de 4096 chars por mensaje
    while text:
        chunk = text[:4096]
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": chunk}
        }
        try:
            r = requests.post(
                WHATSAPP_API_URL,
                headers={
                    "Authorization": f"Bearer {WHATSAPP_TOKEN}",
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=15
            )
            if r.status_code != 200:
                logger.warning(f"WA send fallo: {r.status_code} — {r.text[:100]}")
        except Exception as e:
            logger.warning(f"WA send error: {e}")
        text = text[4096:]


def wa_send_image(to, image_bytes, caption=""):
    """Envía imagen por WhatsApp (primero la sube a Media API)."""
    try:
        # Paso 1: Subir imagen a Media API
        upload_url = f"https://graph.facebook.com/v21.0/{WHATSAPP_PHONE_ID}/media"
        files = {
            "file": ("image.png", io.BytesIO(image_bytes), "image/png"),
        }
        data = {
            "messaging_product": "whatsapp",
            "type": "image/png",
        }
        r = requests.post(
            upload_url,
            headers={"Authorization": f"Bearer {WHATSAPP_TOKEN}"},
            files=files,
            data=data,
            timeout=30
        )

        if r.status_code != 200:
            logger.warning(f"WA media upload fallo: {r.status_code}")
            # Fallback: enviar solo el caption como texto
            wa_send_text(to, f"🎨 {caption}\n\n(Imagen generada pero no pude enviarla por WhatsApp)")
            return

        media_id = r.json().get("id")

        # Paso 2: Enviar mensaje con la imagen
        payload = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "image",
            "image": {
                "id": media_id,
                "caption": caption[:1024]
            }
        }
        requests.post(
            WHATSAPP_API_URL,
            headers={
                "Authorization": f"Bearer {WHATSAPP_TOKEN}",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=15
        )
    except Exception as e:
        logger.warning(f"WA send image error: {e}")
        wa_send_text(to, f"🎨 {caption}\n\n(Error enviando imagen)")


def wa_send_document(to, doc_bytes, filename, caption=""):
    """Envía documento por WhatsApp."""
    try:
        upload_url = f"https://graph.facebook.com/v21.0/{WHATSAPP_PHONE_ID}/media"
        files = {"file": (filename, io.BytesIO(doc_bytes), "application/octet-stream")}
        data = {"messaging_product": "whatsapp", "type": "application/octet-stream"}
        r = requests.post(
            upload_url,
            headers={"Authorization": f"Bearer {WHATSAPP_TOKEN}"},
            files=files, data=data, timeout=30
        )
        if r.status_code == 200:
            media_id = r.json().get("id")
            payload = {
                "messaging_product": "whatsapp",
                "to": to,
                "type": "document",
                "document": {"id": media_id, "filename": filename, "caption": caption[:1024]}
            }
            requests.post(WHATSAPP_API_URL,
                headers={"Authorization": f"Bearer {WHATSAPP_TOKEN}", "Content-Type": "application/json"},
                json=payload, timeout=15)
    except Exception as e:
        logger.warning(f"WA send doc error: {e}")


# ---------------------------------------------------------------------------
# PROCESAR MENSAJES ENTRANTES
# ---------------------------------------------------------------------------

def process_webhook(body):
    """Procesa el webhook entrante de WhatsApp."""
    try:
        entry = body.get("entry", [{}])[0]
        changes = entry.get("changes", [{}])[0]
        value = changes.get("value", {})
        messages = value.get("messages", [])

        if not messages:
            return None  # No es un mensaje (puede ser status update)

        msg = messages[0]
        msg_type = msg.get("type", "")
        from_number = msg.get("from", "")
        msg_id = msg.get("id", "")

        # Obtener nombre del contacto
        contacts = value.get("contacts", [{}])
        user_name = contacts[0].get("profile", {}).get("name", "Usuario") if contacts else "Usuario"

        # Marcar como leído
        _mark_as_read(msg_id)

        if msg_type == "text":
            text = msg.get("text", {}).get("body", "")
            return {
                "type": "text",
                "from": from_number,
                "name": user_name,
                "text": text,
                "msg_id": msg_id,
            }
        elif msg_type == "image":
            image_info = msg.get("image", {})
            caption = image_info.get("caption", "")
            media_id = image_info.get("id", "")
            return {
                "type": "image",
                "from": from_number,
                "name": user_name,
                "caption": caption,
                "media_id": media_id,
                "msg_id": msg_id,
            }
        else:
            # Audio, video, sticker, etc — por ahora responder que no soportado
            return {
                "type": "unsupported",
                "from": from_number,
                "name": user_name,
                "msg_type": msg_type,
                "msg_id": msg_id,
            }

    except Exception as e:
        logger.error(f"WA webhook parse error: {e}")
        return None


def _mark_as_read(msg_id):
    """Marca mensaje como leído (doble check azul)."""
    try:
        payload = {
            "messaging_product": "whatsapp",
            "status": "read",
            "message_id": msg_id
        }
        requests.post(
            WHATSAPP_API_URL,
            headers={
                "Authorization": f"Bearer {WHATSAPP_TOKEN}",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=5
        )
    except:
        pass


# ---------------------------------------------------------------------------
# VERIFICACIÓN DE WEBHOOK
# ---------------------------------------------------------------------------

def verify_webhook(params):
    """Verifica el webhook de Meta (challenge response)."""
    mode = params.get("hub.mode", "")
    token = params.get("hub.verify_token", "")
    challenge = params.get("hub.challenge", "")

    if mode == "subscribe" and token == WHATSAPP_VERIFY_TOKEN:
        logger.info("WhatsApp webhook verificado!")
        return challenge
    return None
