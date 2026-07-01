# ⚡ DOSSIER ANTIGRAVITY v5.0 — MAPA COMPLETO
## C8L Agency — Sistema de Bots y Conexiones
### Generado: 1 Julio 2026

---

## 🏛️ ARQUITECTURA GENERAL

```
╔══════════════════════════════════════════════════════════════════╗
║                    ⚡ ANTIGRAVITY v5.0                           ║
║              "El Motor Universal Sin Límites"                    ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  📱 TELEGRAM (@leon_leo_bot)                                     ║
║  │                                                               ║
║  ▼                                                               ║
║  ┌─────────────────────────────────────────────────────────┐     ║
║  │  telegram_antigravity.py — PUNTO DE ENTRADA PRINCIPAL    │     ║
║  │  • Entrada multimodal (texto, voz, foto, video, docs)   │     ║
║  │  • Pipeline: IntentEngine → APIRouter → Respuesta       │     ║
║  │  • Health server HTTP (puerto 8080)                     │     ║
║  └────────────────────┬────────────────────────────────────┘     ║
║                       │                                          ║
║     ┌─────────────────┼─────────────────────────────┐            ║
║     ▼                 ▼                 ▼           ▼            ║
║  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌─────────┐     ║
║  │API Router│  │Intent Engine │  │ Economía │  │Seguridad│     ║
║  │(6 APIs)  │  │(3 capas)     │  │(StarMaker)│  │(Master) │     ║
║  └──────────┘  └──────────────┘  └──────────┘  └─────────┘     ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 🔌 CONEXIONES ENTRE SISTEMAS

```
┌─────────────────────────────────────────────────────────────┐
│                    RENDER (c8l-bot-server-1)                  │
│                    srv-d9f7tqpo3f8c73cra4ug                  │
│                    https://c8l-bot-server-1.onrender.com     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  telegram_antigravity.py                                     │
│       │                                                      │
│       ├── api_router.py ────────────→ Groq API               │
│       │                              → OpenRouter API        │
│       │                              → Gemini API            │
│       │                              → NVIDIA API            │
│       │                              → HuggingFace API       │
│       │                              → Cloudflare AI         │
│       │                                                      │
│       ├── nlp/intent_engine.py ────→ Clasificación 3 capas   │
│       │                                                      │
│       ├── integrations/                                      │
│       │   ├── github_ops.py ───────→ GitHub API (repos)      │
│       │   └── deploy_control.py ──→ Render API (deploys)     │
│       │                                                      │
│       ├── core/self_modify.py ────→ Auto-modificación        │
│       │                                                      │
│       ├── economy/c8l_economy.py ─→ PayPal (pagos)           │
│       │                                                      │
│       ├── skills/                                            │
│       │   ├── visual_guide.py ───→ Groq Vision 90B           │
│       │   └── media_processor.py → FFmpeg + Whisper          │
│       │                                                      │
│       ├── watchdog/                                          │
│       │   ├── health_monitor.py ─→ Auto-restart              │
│       │   └── hermes_watchdog.py → Bot secundario            │
│       │                                                      │
│       ├── memory/                                            │
│       │   ├── vector_store.py                                │
│       │   ├── user_context.py                                │
│       │   └── learning_feedback.py                           │
│       │                                                      │
│       ├── casino/slot_engine.py                              │
│       └── chess/chess_game.py                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤖 MAPA DE BOTS

| Bot | Token | Función | Estado |
|-----|-------|---------|--------|
| **@leon_leo_bot** | TELEGRAM_BOT_TOKEN | Bot principal Antigravity v5.0 | ✅ LIVE |
| **@hermes_c8l_bot** | HERMES_BOT_TOKEN | Watchdog (reanima al principal) | ⏸️ Pendiente |

---

## 🧠 MÓDULOS Y SUS FUNCIONES

### 1. API Router (`api_router.py`)
| Proveedor | Modelo | RPM | Prioridad |
|-----------|--------|-----|-----------|
| Groq | Llama 3.3 70B | 30 | 1 (principal) |
| OpenRouter | DeepSeek V4 Flash | 20 | 2 |
| Gemini | 2.5 Flash | 15 | 3 |
| NVIDIA | DeepSeek V4 Pro | 10 | 4 |
| HuggingFace | Llama 3 8B | 30 | 5 |
| Cloudflare | Llama 3.1 8B | 50 | 6 |
| **TOTAL** | — | **175 rpm** | — |

### 2. Intent Engine (`nlp/intent_engine.py`)
| Capa | Motor | Velocidad | Resuelve |
|------|-------|-----------|----------|
| 0 | Regex + Cache | <1ms | 30% (comandos, saludos) |
| 1 | Keywords | <5ms | 50% (intenciones claras) |
| 2 | LLM (via Router) | <1s | 20% (mensajes ambiguos) |

### 3. Economía (`economy/c8l_economy.py`)
| Moneda | Función | Retirable |
|--------|---------|-----------|
| 🎒 Coins (Mochila) | Gastar en regalos, skins, casino | ❌ NO |
| 💎 Diamantes | Ingresos reales de regalos recibidos | ✅ SÍ ($15/1000💎) |

**Ratio:** 3 Coins regalados = 1 Diamante para receptor
**C8L retiene:** 2/3 del valor (los coins se queman)

### 4. Seguridad (`security/master_keys.py`)
| Clave | Función | Quién tiene acceso |
|-------|---------|-------------------|
| MASTER_PASSWORD | Kill switch, cambios críticos | Solo Leo |
| ADMIN_CHAT_ID | Comandos /admin, /git, /deploy | Solo Leo (1970956749) |
| STREAMER_CODES | Dar premium a streamers | Solo Leo genera |

### 5. Multimedia (`skills/media_processor.py`)
| Formato | Motor | Acción |
|---------|-------|--------|
| 🎤 Audio/Voz | Groq Whisper | Transcribe → texto |
| 📷 Foto | Groq Vision 90B | Analiza → descripción |
| 🎬 Video | FFmpeg + Whisper + Vision | Audio + frames → análisis |
| 📄 PDF/Word | PyPDF/docx | Extrae texto → resume |
| 🖼️ Sticker | Vision | Analiza → responde |
| 📍 Ubicación | Open-Meteo | Clima + info |

### 6. GitHub Integration (`integrations/github_ops.py`)
| Operación | Comando | Seguridad |
|-----------|---------|-----------|
| Leer archivo | /git read | Admin only |
| Editar archivo | /git edit | Admin only (+ branch) |
| Crear PR | /git pr | Admin only |
| Mergear | /git pr merge | Admin only |
| Self-modify | /evolve | Admin only (+ validación AST) |

### 7. Deploy Control (`integrations/deploy_control.py`)
| Operación | Comando | Efecto |
|-----------|---------|--------|
| Ver estado | /deploy status | Consulta Render API |
| Nuevo deploy | /deploy trigger | Rebuild completo |
| Restart | /deploy restart | Reinicio sin rebuild |
| Ver logs | /deploy logs | Últimos deploys |
| Health check | /deploy health | Ping al endpoint |

---

## 📋 LISTA COMPLETA DE COMANDOS

### Para TODOS los usuarios:
| Comando | Función |
|---------|---------|
| /start | Bienvenida + menú |
| /help | Lista completa de comandos |
| /wallet, /saldo | Ver balance |
| /daily | Login diario |
| /tienda | Ver tienda |
| /comprar | Comprar coins (PayPal) |
| /regalo | Enviar regalo |
| /retirar | Retirar diamantes |
| /premium CODIGO | Canjear código premium |
| /memoria | Ver perfil/memoria |
| /imagen, /musica, /video | Crear contenido |
| /casino, /chess | Jugar |
| /clima, /crypto, /traducir | Herramientas |
| /guide | Guía visual |
| /status | Estado del bot |

### Solo ADMIN (Leo — 1970956749):
| Comando | Función | Seguridad |
|---------|---------|-----------|
| /admin | Panel general | @admin_only |
| /admin_gencode | Generar códigos premium | @admin_only |
| /admin_codes | Ver códigos activos | @admin_only |
| /admin_set_premium | Dar premium directo | @admin_only |
| /admin_users | Ver todos los usuarios | @admin_only |
| /admin_streamer | Dar premium a streamer | @admin_only |
| /git | Control de GitHub | @admin_only |
| /deploy | Control de Render | @admin_only |
| /code | IA genera código + PR | @admin_only |
| /learn | Enseñar al bot | @admin_only |
| /evolve | Auto-modificación | @admin_only |
| /watchdog | Monitor de salud | @admin_only |
| /killswitch | Apagar bot (clave maestra) | @admin_only + PASSWORD |
| /masterkey | Cambiar configuración crítica | @admin_only + PASSWORD |

---

## 💰 ECONOMÍA — RESUMEN FINANCIERO

### Modelo de negocio:
```
Usuario A compra coins ($15 = 1000 coins)
    ↓
Usuario A regala a Usuario B (streamer)
    ↓
3000 coins regalados → 1000 diamantes para streamer
    ↓
Streamer retira: 1000 💎 = $15 USD
    ↓
C8L ganó: $30 (pagaron $45 en coins, pagamos $15 al streamer)
Margen: 66.7%
```

### Packs PayPal:
| Pack | Coins | USD | Descuento |
|------|-------|-----|-----------|
| Mini | 301 | $3.99 | 17.08% |
| Básico | 762 | $9.99 | 18.53% |
| Estándar | 1,538 | $19.99 | 19.66% |
| Popular 🔥 | 3,876 | $49.99 | 20.66% |
| Grande | 7,813 | $99.99 | 21.65% |
| Mega | 15,750 | $199.99 | 22.63% |
| Ultra | 31,500 | $399.99 | 22.63% |

### PayPal:
- Link de pago: https://www.paypal.com/ncp/payment/YFQBHL69MXWBN
- Button ID: YFQBHL69MXWBN
- Divisa: EUR
- Cuenta: C.8.L. Agency

---

## 🔐 SEGURIDAD — RESUMEN

| Protección | Cómo funciona |
|------------|---------------|
| Admin ID | Solo 1970956749 puede usar comandos sensibles |
| @admin_only | Decorador en todos los comandos peligrosos |
| Master Password | Necesaria para kill switch y cambios críticos |
| Branches obligatorias | /evolve y /code NUNCA tocan main directo |
| Archivos protegidos | config.py, .env NO se pueden auto-modificar |
| Rate limiting | Nadie puede abusar del bot |
| Watchdog | Si cae, se reanima solo |

---

## 🌐 INFRAESTRUCTURA

| Servicio | Función | URL/ID | Costo |
|----------|---------|--------|-------|
| Render | Bot 24/7 | srv-d9f7tqpo3f8c73cra4ug | $7/mes (Starter) |
| GitHub | Código | leovela69/c8l-bot-server | $0 |
| PayPal | Pagos | YFQBHL69MXWBN | Comisión por tx |
| Firebase | Web original | gen-lang-client-0744582882.web.app | $0 |
| Groq | LLM principal | API key | $0 |
| OpenRouter | LLM backup | API key | $0 |
| Gemini | LLM + Vision | API key | $0 |

---

## 📊 MÉTRICAS DEL SISTEMA

| Métrica | Valor |
|---------|-------|
| Líneas de código nuevo | ~8,000+ |
| Fases implementadas | 6 |
| APIs conectadas | 6+ |
| Capacidad | 175 req/min |
| Comandos totales | 40+ |
| Formatos multimedia | 10+ |
| Costo mensual | $7 (Render) |
| Uptime target | 99.9% |

---

## 📅 HISTORIAL DE FASES

| Fase | Fecha | PRs | Descripción |
|------|-------|-----|-------------|
| 1 | 1 Jul 2026 | #48 | API Router + Intent Engine + Bot Telegram |
| 2 | 1 Jul 2026 | #49 | GitHub Integration + Deploy Control |
| 3 | 1 Jul 2026 | #50 | Self-Modify + Memoria + /evolve |
| 4 | 1 Jul 2026 | #51 | Watchdog Always-On |
| 5 | 1 Jul 2026 | — | Visual Guide (screenshots) |
| 6 | 1 Jul 2026 | — | Multimodal Total (audio/video/docs) |
| + | 1 Jul 2026 | — | Economía StarMaker + PayPal + Seguridad |

---

*Documento generado por Kiro para Leo Vela — C8L Agency*
*No compartir — contiene información sensible del sistema*
