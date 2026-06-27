# COPIA DE SEGURIDAD — C8L AGENCY (MAPA COMPLETO)
## Fecha: 27 Junio 2026
## Propietario: Leo Vela (leovela69)

---

# REGLA DE ORO
**NUNCA mezclar proyectos. Cada proyecto = su propio repo. Sin orden de Leo = no se toca nada.**

---

# INVENTARIO DE PROYECTOS

## 1. WEB ORIGINAL (Firebase) — INTOCABLE
| Campo | Valor |
|-------|-------|
| URL | https://gen-lang-client-0744582882.web.app/feed/ |
| Deploy | Firebase Hosting |
| Repo | No tiene repo propio (o no se toca) |
| Estado | PRODUCCION — NO MODIFICAR NUNCA |
| Notas | Esta es la primera web creada. NUNCA tocar ni deployar encima |

---

## 2. BOT TELEGRAM — c8l-bot-server
| Campo | Valor |
|-------|-------|
| Repo | https://github.com/leovela69/c8l-bot-server |
| Deploy | Render.com (gratis) |
| Bot Telegram | @leon_leo_bot |
| Lenguaje | Python 3.11 |
| Entry point | `whatsapp_bot.py` |
| Config | `config.py` (lee todo de env vars) |
| Puerto | 8080 |

### Variables de entorno REQUERIDAS:
```env
# OBLIGATORIAS (sin estas no arranca)
TELEGRAM_BOT_TOKEN=<token de @BotFather>
ADMIN_CHAT_ID=<tu chat ID de Telegram>
GROQ_API_KEY=<key de console.groq.com — GRATIS>

# GRUPO
GROUP_CHAT_ID=-1002476372487

# IA BACKUP
OPENROUTER_API_KEY=<sk-or-v1-...>
NVIDIA_API_KEY=<nvapi-...>
HUGGINGFACE_TOKEN=<hf_...>

# GEMINI (opcional)
GEMINI_API_KEY=<key>
GEMINI_ENABLED=false

# WHATSAPP (opcional)
WHATSAPP_TOKEN=<token Meta>
WHATSAPP_PHONE_ID=<phone id>
WHATSAPP_BUSINESS_ID=<business id>

# MUSICA
SUNO_COOKIE=<cookie de suno.com>
MUSICAPI_KEY=<key musicapi>

# MEDIA
POLLINATIONS_API_KEY=<key>

# HERMES BOT (backup)
HERMES_BOT_TOKEN=<token del segundo bot>

# URLS
C8L_WEB_URL=https://c8l-web8.vercel.app
PORT=8080
```

### Donde obtener cada clave:
| Variable | Fuente | URL |
|----------|--------|-----|
| TELEGRAM_BOT_TOKEN | @BotFather en Telegram | https://t.me/botfather |
| ADMIN_CHAT_ID | @userinfobot en Telegram | https://t.me/userinfobot |
| GROQ_API_KEY | Groq Console (gratis) | https://console.groq.com/keys |
| OPENROUTER_API_KEY | OpenRouter | https://openrouter.ai/keys |
| NVIDIA_API_KEY | NVIDIA Build | https://build.nvidia.com |
| HUGGINGFACE_TOKEN | HuggingFace | https://huggingface.co/settings/tokens |
| GEMINI_API_KEY | Google AI Studio | https://aistudio.google.com/apikey |
| SUNO_COOKIE | Login en suno.com → DevTools → cookie | https://suno.com |
| MUSICAPI_KEY | MusicAPI | https://musicapi.ai |
| POLLINATIONS_API_KEY | Pollinations | https://pollinations.ai |

### Estructura del bot:
```
c8l-bot-server/
├── whatsapp_bot.py       # ENTRY POINT — arranca todo
├── config.py             # Config central (env vars)
├── pantheon/             # 11 agentes IA (Zeus, Minerva, Vulcano, Ares, etc)
│   ├── zeus.py           # Coordinador principal
│   ├── minerva.py        # Investigacion/datos
│   ├── vulcano.py        # Codigo
│   ├── video_engine.py   # Generacion video
│   ├── design_studio.py  # Edicion imagenes
│   ├── canvas_page.py    # Canvas HTML5
│   └── slaves/           # Sub-agentes
├── bots/                 # Bots especializados
│   ├── aion/             # Coordinador temporal
│   ├── aguilas/          # Monitoreo
│   ├── cerebros/         # Datos/contenido
│   └── manos/            # Ejecucion
├── hermes/               # Bot backup
├── chess/                # Motor de ajedrez
├── economy/              # Sistema economico (coins, subs)
├── data/                 # Base de conocimiento
├── Dockerfile            # Container Docker
├── start.sh              # Arranque VPS + Cloudflare tunnel
└── requirements.txt      # Dependencias Python
```

### Como deployar el bot:
**Opcion A — Render.com (gratis):**
1. Ir a https://render.com → New Web Service
2. Conectar repo `leovela69/c8l-bot-server`
3. Render detecta `Dockerfile` automaticamente
4. Agregar todas las env vars en la seccion Environment
5. Deploy → listo en ~3 min

**Opcion B — VPS manual:**
```bash
git clone https://github.com/leovela69/c8l-bot-server.git
cd c8l-bot-server
cp .env.example .env
nano .env  # Rellenar con tus keys
pip install -r requirements.txt
bash start.sh
```

---

## 3. C8L STUDIO (Editor Canvas/Adobe) — c8l-web8
| Campo | Valor |
|-------|-------|
| Repo | https://github.com/leovela69/c8l-web8 |
| URL | https://c8l-web8.vercel.app |
| Deploy | Vercel (gratis, auto-deploy en push) |
| Framework | Next.js 14 + Tailwind CSS + TypeScript |
| Paginas | Dashboard (/), Editor (/editor), Plantillas (/templates) |

### Variables de entorno en Vercel:
```
(Ninguna requerida por ahora — todo es frontend estatico)
```

### Estructura:
```
c8l-web8/
├── app/
│   ├── page.tsx          # Dashboard (proyectos + tamanos)
│   ├── editor/page.tsx   # Editor visual (canvas + herramientas)
│   └── templates/page.tsx # Galeria de plantillas
├── components/editor/
│   ├── Canvas.tsx        # Area de trabajo (drag & drop)
│   ├── ToolPanel.tsx     # Panel izquierdo (texto, formas, fotos, IA)
│   ├── PropertiesPanel.tsx # Panel derecho (color, tamano, fuente)
│   └── Toolbar.tsx       # Barra superior (undo, zoom, descargar)
├── next.config.js
├── tailwind.config.ts
├── package.json
└── vercel.json
```

### Como deployar (ya esta deployado):
1. Push a `main` → Vercel auto-deploya
2. Si necesitas redeploy manual: Vercel Dashboard → Deployments → Redeploy

---

## 4. FUTURO: CASINO (PROXIMO PROYECTO)
| Campo | Valor |
|-------|-------|
| Repo | `c8l-casino` (POR CREAR) |
| Deploy | Vercel (nuevo proyecto) |
| Framework | Next.js 14 + Tailwind CSS |
| Contenido | Slots, Ruleta, Blackjack, Poker, sistema de coins |
| Notas | REPO SEPARADO — no mezclar con nada |

---

# RESUMEN VISUAL

```
┌─────────────────────────────────────────────────────────────┐
│                    C8L AGENCY — MAPA                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Firebase]              [Render]              [Vercel]     │
│      │                      │                     │         │
│      ▼                      ▼                     ▼         │
│  WEB ORIGINAL          BOT TELEGRAM         C8L STUDIO      │
│  (INTOCABLE)          @leon_leo_bot       Editor Canvas     │
│  gen-lang-client-     c8l-bot-server      c8l-web8.vercel   │
│  0744582882.web.app                       .app              │
│                                                             │
│                                           [Vercel NUEVO]    │
│                                               │             │
│                                               ▼             │
│                                          C8L CASINO         │
│                                          (PROXIMO)          │
│                                          c8l-casino         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

# REGLAS PARA CUALQUIER IA QUE LEA ESTO

1. **NUNCA** modificar la web original Firebase
2. **NUNCA** mezclar codigo de un proyecto en otro repo
3. **NUNCA** aplicar cambios sin orden EXPLICITA de Leo
4. **Cada proyecto nuevo = repo nuevo separado**
5. **Ante la duda = preguntar a Leo primero**

---

# PASOS SIGUIENTES (ROADMAP)

1. ✅ Bot Telegram funcionando (c8l-bot-server)
2. ✅ Web original Firebase (intocable)
3. ✅ C8L Studio — Editor de diseno (c8l-web8)
4. ⬜ C8L Casino — Juegos (c8l-casino) ← PROXIMO
5. ⬜ Mas proyectos futuros (cada uno en su repo)

---

# COMO USAR ESTA COPIA DE SEGURIDAD

Si empiezas una sesion nueva con cualquier IA:
1. Pegale este documento completo
2. Dile que NO mezcle proyectos
3. Dile en que repo especifico quieres trabajar
4. Solo asi puede tocar codigo

---

*Backup generado: 27 Junio 2026 — C8L Agency (Corazones Locos Family)*
