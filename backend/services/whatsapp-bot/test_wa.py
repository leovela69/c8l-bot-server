# -*- coding: utf-8 -*-
import os
import requests

WHATSAPP_TOKEN = "EAAePXyOIVAEBRwnlnsQAtaVCnyY8cFGHcKTxhD63PqS60dTb1dl7ZAI6bZCjB52VATEz7HgxKOdHT3rZAnCf6V1zVxIImeIRhR1pUJPMVHfKxsvSZBFBQp5nY2GLTblKAz1wV8pp8Cctk6SWw6T97oKh9PN43v5WnIqJuneJKDrWPbMUgRZCR5xyVu9Fz8PYP5pxnlZAPKIjAyXHV0SsKLl2czL9whMMaxnAPmR9yDmftDQEVcli0EEHRjNWT6Wba9NqD3dL9d9Pcr75xS5ZCr4"
WHATSAPP_PHONE_ID = "1078712428668775"
TO_PHONE = "34611636294"

API_URL = f"https://graph.facebook.com/v21.0/{WHATSAPP_PHONE_ID}/messages"
HEADERS = {
    "Authorization": f"Bearer {WHATSAPP_TOKEN}",
    "Content-Type": "application/json",
}

payload = {
    "messaging_product": "whatsapp",
    "to": TO_PHONE,
    "type": "text",
    "text": {"body": "¡Hola Leo Vela! Este es un mensaje de verificación para confirmar que tu bot de WhatsApp está conectado y funcionando. 🦁✨"},
}

r = requests.post(API_URL, headers=HEADERS, json=payload)
print("Status Code:", r.status_code)
print("Response:", r.json())
