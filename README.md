# 🦁 C8L Bot Server — Equipo de Bots Autónomos

## Instalación (UN SOLO COMANDO)

```bash
cd /root && rm -rf c8l-bot-server && git clone https://github.com/leovela69/c8l-bot-server.git && cd c8l-bot-server && bash install.sh
```

## Arquitectura

```
👑 AION (Coordinador) — cada 5 minutos
├── 🦅 ÁGUILA 1 — Rendimiento web
├── 🦅 ÁGUILA 2 — Contenido 
├── 🦅 ÁGUILA 3 — Seguridad
├── 🧠 CEREBRO 1 — Analista datos
├── 🧠 CEREBRO 2 — Analista contenido
├── 🛠️ MANO 1 — Fixer código
└── 🛠️ MANO 2 — Fixer contenido

🤖 Bot Telegram (@leon_leo_bot) — polling 24/7
├── DeepSeek V4 Pro (NVIDIA) — principal
├── Gemini 3.5 Flash — backup
└── HuggingFace SDXL — imágenes
```

## Comandos del Bot

- `/start` — Bienvenida
- `/help` — Ayuda
- `/clear` — Limpiar historial
- `/status` — Estado del sistema

## Para Hermes

Ejecutar en el VPS:
```bash
cd /root && rm -rf c8l-bot-server && git clone https://github.com/leovela69/c8l-bot-server.git && cd c8l-bot-server && bash install.sh
```

Eso es todo. El script:
1. Mata bots viejos
2. Descarga código
3. Instala dependencias
4. Elimina webhooks (mata fantasma)
5. Arranca bot + AION

## Logs

```bash
tail -f /root/c8l-bot-server/data/logs/bot.log
tail -f /root/c8l-bot-server/data/logs/aion.log
```

## Parar todo

```bash
pkill -f "python.*whatsapp_bot"
pkill -f "python.*aion_cron"
```
