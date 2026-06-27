# C8L Bot Server — Bot Telegram/WhatsApp

> **Solo el bot.** La web está en otro repo: [`c8l-web`](https://github.com/leovela69/c8l-web)

---

## Qué es esto

Bot multi-agente con 11 IAs que maneja:
- Telegram (grupo + privado)
- WhatsApp Business
- API para la web (música, imágenes, video, chat)

## Deploy en Render.com (GRATIS)

1. [render.com](https://render.com) → New Web Service → conecta este repo
2. Render detecta `render.yaml` y `Dockerfile`
3. Configura las Environment Variables (ver abajo)
4. Deploy → listo en ~3 min

## Deploy en VPS

```bash
git clone https://github.com/leovela69/c8l-bot-server.git
cd c8l-bot-server
cp .env.example .env
# Edita .env con tus keys
pip install -r requirements.txt
bash start.sh
```

## Variables de Entorno (Requeridas)

| Variable | Donde obtener |
|----------|---------------|
| `TELEGRAM_BOT_TOKEN` | [@BotFather](https://t.me/botfather) |
| `ADMIN_CHAT_ID` | [@userinfobot](https://t.me/userinfobot) |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com/keys) (GRATIS) |

## Estructura

```
c8l-bot-server/
├── whatsapp_bot.py       # Entry point principal
├── config.py             # Configuracion (lee de env vars)
├── pantheon/             # 11 agentes IA
├── bots/                 # Bots especializados
├── chess/                # Motor de ajedrez
├── economy/              # Sistema economico
├── Dockerfile            # Container
├── render.yaml           # Deploy Render
├── requirements.txt      # Dependencias Python
└── start.sh              # Arranque VPS + Cloudflare tunnel
```

## Proyectos C8L

| Proyecto | Repo | Deploy | Funcion |
|----------|------|--------|---------|
| **C8L Bot** (este) | `c8l-bot-server` | Render | Bot Telegram/WhatsApp + API |
| **C8L Web** | `c8l-web` | Vercel | Plataforma de creacion |
| **C8L Original** | — | Firebase | Web original (no tocar) |

---

*C8L Agency v17.0 — Corazones Locos Family. 2026.*
