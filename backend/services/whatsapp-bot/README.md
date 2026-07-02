# 🦁 @LeoVelaBot — WhatsApp Bot para C8L Agency

Bot de WhatsApp que reutiliza los 6 agentes IA del bot de Telegram.

## Arquitectura

```
whatsapp-bot/
├── bot.py              ← Servidor webhook Flask
├── wa_config.py        ← Configuracion de WhatsApp Cloud API
├── requirements.txt    ← Dependencias Python
└── (usa los agentes de ../telegram-bot/agents/)
```

## Requisitos

### 1. Cuenta de Meta for Developers
1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. Crea una cuenta de desarrollador (gratis con tu Facebook/Instagram)
3. Crea una nueva **App** → tipo "Business"
4. Agrega el producto **WhatsApp** a tu app

### 2. Obtener credenciales
En la seccion WhatsApp de tu app de Meta:
- **WHATSAPP_TOKEN**: Token de acceso permanente (System User Token)
- **WHATSAPP_PHONE_ID**: ID del numero de telefono de prueba

### 3. Configurar el Webhook
- URL del webhook: `https://tu-servidor.onrender.com/webhook`
- Token de verificacion: `c8l_leovela_2026`
- Suscribirse a: `messages`

## Variables de entorno

| Variable | Descripcion |
|----------|-------------|
| `WHATSAPP_TOKEN` | Token de la API de WhatsApp Cloud |
| `WHATSAPP_PHONE_ID` | Phone Number ID del bot |
| `WA_VERIFY_TOKEN` | Token de verificacion del webhook |
| `ADMIN_PHONE` | Tu numero de telefono (sin + ni espacios) |
| `GEMINI_API_KEY` | API key de Google AI Studio |

## Ejecucion

```bash
pip install -r requirements.txt
export WHATSAPP_TOKEN="tu_token"
export WHATSAPP_PHONE_ID="tu_phone_id"
export GEMINI_API_KEY="tu_gemini_key"
python bot.py
```
