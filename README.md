# C8L Agency — Plataforma de Entretenimiento y Comunidad

> Bot Telegram/WhatsApp + Web completa. 100% GRATIS en la nube.

---

## ARQUITECTURA

```
┌─────────────────────────┐          ┌─────────────────────────┐
│   FRONTEND (WEB)        │          │   BACKEND (BOT + API)   │
│   Vercel.com (GRATIS)   │  HTTPS   │   Render.com (GRATIS)   │
│                         │ ───────► │                         │
│   Next.js 14 Static     │          │   Python 3.11 + Docker  │
│   20 paginas            │ ◄─────── │   Telegram + WhatsApp   │
│                         │          │   11 agentes IA         │
│   c8l-agency.vercel.app │          │   c8l-bot-server        │
└─────────────────────────┘          │     .onrender.com       │
                                     └─────────────────────────┘
```

### Servicios Gratuitos Usados

| Servicio | Para que | Limite gratis |
|----------|----------|---------------|
| **Vercel** | Frontend web | Ilimitado (static) |
| **Render** | Bot Python (Docker) | 750h/mes |
| **Groq** | IA principal (LLMs) | 30 req/min |
| **HuggingFace** | Imagenes SDXL | Ilimitado |
| **Pollinations** | Video + Imagen | Con API key |
| **OpenRouter** | IA backup | Modelos free |
| **Supabase** | Base de datos | 500MB gratis |

---

## DEPLOY RAPIDO (5 MINUTOS)

### Paso 1: Deploy del Backend en Render.com

1. Ve a [render.com](https://render.com) y crea cuenta gratis
2. Click **"New +"** → **"Web Service"**
3. Conecta tu repositorio de GitHub: `leovela69/c8l-bot-server`
4. Render detecta automaticamente el `render.yaml`
5. Ve a **Environment** → **"Add from .env"**
6. Pega el contenido de tu archivo `.env.production` (el que tienes local)
7. Click **"Deploy"** — espera ~3 minutos
8. Tu backend estara en: `https://c8l-bot-server.onrender.com`

### Paso 2: Deploy del Frontend en Vercel

1. Ve a [vercel.com](https://vercel.com) y crea cuenta gratis (con GitHub)
2. Click **"Add New Project"**
3. Importa el repositorio: `leovela69/c8l-bot-server`
4. Vercel detecta Next.js automaticamente
5. En **Environment Variables** agrega:
   ```
   NEXT_PUBLIC_API_URL = https://c8l-bot-server.onrender.com
   ```
6. Click **"Deploy"** — espera ~2 minutos
7. Tu web estara en: `https://c8l-agency.vercel.app`

### Paso 3: Conectar Bot con la Web

En el dashboard de **Render**, actualiza la variable:
```
C8L_WEB_URL = https://c8l-agency.vercel.app
```

¡LISTO! Todo conectado y funcionando.

---

## DESARROLLO LOCAL

```bash
# 1. Clonar
git clone https://github.com/leovela69/c8l-bot-server.git
cd c8l-bot-server

# 2. Crear archivo de variables locales
cp .env.example .env

# 3. Rellenar .env con tus keys (OBLIGATORIO: TELEGRAM_BOT_TOKEN y GROQ_API_KEY)

# 4. Instalar frontend
npm install

# 5. Arrancar frontend (desarrollo)
npm run dev
# → Abre http://localhost:3000

# 6. Arrancar bot Python (en otra terminal)
pip install -r requirements.txt
python whatsapp_bot.py
# → Bot corriendo en http://localhost:8080
```

---

## ESTRUCTURA DEL PROYECTO

```
c8l-bot-server/
├── app/                    # Frontend Next.js (paginas)
│   ├── page.tsx           #   Home — Mesa de Creacion
│   ├── tv/               #   C8L TV
│   ├── studio/           #   Estudio IA
│   ├── casino/           #   Casino (Bingo, Ruleta, etc)
│   ├── bandos/           #   Sistema de Bandos
│   ├── streaming/        #   Streaming en vivo
│   ├── karaoke/          #   Karaoke
│   └── ...               #   +10 secciones mas
├── components/            # Componentes React
├── lib/                   # Librerias compartidas
│   ├── api/              #   Conexion frontend↔backend
│   ├── auth/             #   Autenticacion
│   ├── credits/          #   Sistema de creditos
│   └── ...
├── pantheon/              # Sistema de agentes IA (Python)
├── bots/                  # Bots especializados
├── chess/                 # Motor de ajedrez
├── whatsapp_bot.py        # ENTRY POINT del backend
├── config.py              # Configuracion central (env vars)
├── render.yaml            # Deploy config para Render
├── vercel.json            # Deploy config para Vercel
├── Dockerfile             # Container del bot
├── package.json           # Frontend deps
└── requirements.txt       # Backend deps
```

---

## VARIABLES DE ENTORNO

### Requeridas (sin estas NO funciona)

| Variable | Donde obtener |
|----------|--------------|
| `TELEGRAM_BOT_TOKEN` | [@BotFather](https://t.me/botfather) en Telegram |
| `ADMIN_CHAT_ID` | Envia /start a [@userinfobot](https://t.me/userinfobot) |
| `GROQ_API_KEY` | [console.groq.com/keys](https://console.groq.com/keys) (GRATIS) |

### Opcionales (mejoran funcionalidad)

| Variable | Servicio |
|----------|----------|
| `HUGGINGFACE_TOKEN` | Imagenes IA (gratis) |
| `POLLINATIONS_API_KEY` | Video IA |
| `OPENROUTER_API_KEY` | LLMs backup |
| `NVIDIA_API_KEY` | DeepSeek V4 Pro |
| `WHATSAPP_TOKEN` | WhatsApp Business |
| `SUNO_COOKIE` | Generacion de musica |
| `MUSICAPI_KEY` | Musica con vocales |

---

## SEGURIDAD

- **NUNCA** subas `.env`, `.env.production` o `.env.local` a GitHub
- Todas las keys estan en variables de entorno (no en codigo)
- El `.gitignore` ya protege estos archivos
- Usa el Dashboard de Render/Vercel para configurar las variables

---

## COMANDOS UTILES

```bash
# Compilar frontend
npm run build

# Ver estado del bot (con backend corriendo)
curl http://localhost:8080/

# Ver creditos de Suno
curl http://localhost:8080/api/suno/credits
```

---

## SOPORTE

- Telegram: [@leon_leo_bot](https://t.me/leon_leo_bot)
- Grupo: [C8L Community](https://t.me/+c9cJksqbLCwzYzlh)

---

*C8L Agency v21.0 — Corazones Locos Family. 2026.*
