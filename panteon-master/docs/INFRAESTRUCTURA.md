# 🏗️ Infraestructura del Sistema

## Servidor Principal

| Campo | Valor |
|-------|-------|
| **Proveedor** | Hostinger VPS |
| **Hostname** | srv1774129.hstgr.cloud |
| **Acceso** | SSH (root) |
| **Container** | hermes-agent-b5i7-hermes-agent-1 |
| **URL pública** | https://hermes-agent-b5i7.srv1774129.hstgr.cloud |
| **Runtime** | Docker |

## Diagrama

```
┌─── Hostinger VPS ─────────────────────────────────┐
│                                                    │
│  ┌─── Docker Container ────────────────────────┐  │
│  │  Hermes Agent (Motor Principal)             │  │
│  │  ├── Telegram Gateway → @LeoVelaBot        │  │
│  │  ├── Skills Engine (10 skills)              │  │
│  │  ├── Memory System (honcho)                 │  │
│  │  └── Cron Scheduler                        │  │
│  └─────────────────────────────────────────────┘  │
│                                                    │
│  ┌─── Cron Jobs ──────────────────────────────┐  │
│  │  */5 min  → Aries (vigilancia web)         │  │
│  │  */4 h    → Artemisa (redes)               │  │
│  │  */6 h    → Vulcano (música)               │  │
│  │  */8 h    → Hefesto (diseño)               │  │
│  │  */12 h   → Apolo (producción)             │  │
│  │  8:00 AM  → Minerva (investigación)        │  │
│  │  10:00 AM → Ares (video)                   │  │
│  │  6:00 AM  → Atenea (analytics)             │  │
│  │  3:00 AM  → Estia (backup/limpieza)        │  │
│  └────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

## ⚠️ Nota sobre Render.com

Hay un servicio **VIEJO** en Render.com que puede causar conflicto con el token de Telegram:
1. Ir a https://dashboard.render.com
2. Buscar `leovelabot-dual` o `c8l-bot-server`
3. **SUSPENDER** todos los servicios de Render
4. Solo debe quedar activo el de Hostinger

## Acceso Rápido

```bash
ssh root@srv1774129.hstgr.cloud
docker exec -it hermes-agent-b5i7-hermes-agent-1 bash
docker logs hermes-agent-b5i7-hermes-agent-1 --tail 100
docker restart hermes-agent-b5i7-hermes-agent-1
docker stats hermes-agent-b5i7-hermes-agent-1
```
