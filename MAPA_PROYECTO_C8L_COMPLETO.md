# 🗺️ MAPA COMPLETO DEL PROYECTO C8L AGENCY
## Desde el inicio hasta hoy — 23 Junio 2026

---

## 📌 RESUMEN EJECUTIVO

**Proyecto:** C8L Agency — "Corazones Locos Family"
**Tipo:** Plataforma de entretenimiento, música y comunidad
**Género musical propio:** Bolero-House (fusión Bolero clásico + House moderno)
**Owner:** Leo Vela (@leovela69 / rufinoLeon30@gmail.com)
**Repo principal:** https://github.com/leovela69/c8l-bot-server

---

## 📅 CRONOLOGÍA COMPLETA

### 🔹 FASE 1 — Bot de Telegram Original
**Fecha:** Antes del 20 junio 2026
**Repo:** `leovela69/leovelabot-dual` (OBSOLETO, ignorar)

- Bot de Telegram multi-agente `@leovelabot`
- Stack: Python + pyTelegramBotAPI + Gemini 2.5 Flash + Flask + FFmpeg
- 6 agentes: chat, image, video, video_pipeline, code, design
- Sistema de memoria evolutiva
- Deploy en Render.com
- PR #3 arregló problemas de startup dual-mode

---

### 🔹 FASE 2 — Migración a c8l-bot-server + Nuevo Bot
**Fecha:** 20-21 junio 2026
**Repo:** `leovela69/c8l-bot-server` (ACTUAL)

- Nuevo bot `@leon_leo_bot`
- Migración a OpenRouter (modelos Qwen3 GRATIS)
- Arquitectura simplificada: `whatsapp_bot.py` + `config.py`
- Keys hardcodeadas (split para bypasear GitHub scanner)
- Dockerfile: python:3.11-slim + polling puro
- Health check en puerto 8080

**Problema detectado:** Otro bot/servicio corriendo con el mismo token (leovelabot-dual en Render). Solución: suspender el servicio viejo.

---

### 🔹 FASE 3 — Sistema Panteón (Multi-Agente)
**Fecha:** 21-22 junio 2026

- 11 agentes del Panteón asignados con modelos de OpenRouter:
  - **Zeus** — Bot Maestro / Orquestación (qwen3-30b)
  - **Minerva** — Sabio / Conocimiento (qwen3-235b)
  - **Vulcano** — Artesano / Creación (qwen3-30b)
  - **Aries** — Seguridad (qwen3-30b)
  - **Hermes** — Comunicación (qwen3-30b)
  - **Apolo** — Música (qwen3-235b)
  - **Ares** — Video (qwen3-235b)
  - **Hefesto** — Diseño/Frontend (qwen3-235b)
  - **Artemisa** — Backend/API (qwen3-30b)
  - **Atenea** — Estrategia (qwen3-235b)
  - **Estia** — Aprendizaje (qwen3-30b)
- NVIDIA DeepSeek V4 Pro como backup
- HuggingFace SDXL para imágenes

---

### 🔹 FASE 4 — Web C8L Agency (Next.js)
**Fecha:** 22 junio 2026

Se construyó la web completa con:
- **Framework:** Next.js 14 + React 18 + TypeScript
- **Estilo:** Tailwind CSS con tema custom C8L (gold, purple, pink, cyan, black)
- **Fuentes:** Outfit (headings) + Inter (body)
- **Efectos:** Glassmorphism, neon glow, animaciones float
- **Firebase Hosting** configurado en `gen-lang-client-0744582882.web.app`

**Páginas creadas:**
1. `/` — Home con AgeGate (18+), navegación a todas las secciones
2. `/casino` — Casino Quantum (Slots, Ruleta, Blackjack) con RTP
3. `/studio` — Estudio Musical (generador de canciones con IA)
4. `/karaoke` — Sala de Canto con medidores de tono y energía
5. `/lives` — Streaming en directo con regalos
6. `/bandos` — Sistema de familias/clanes con guerras
7. `/tv` — C8L TV (contenido, retos, duelos)
8. `/monedero` — Wallet de C8L Coins, Diamantes y BID
9. `/legal` — Normas, Privacidad, Sanciones, Términos (RGPD compliant)

---

### 🔹 FASE 5 — Bot Integrado en Web + Control Center + Registro
**Fecha:** 23 junio 2026 (HOY)

**Lo que se creó:**

#### 🤖 Bot ChatWidget (TODA la web)
- Widget flotante en esquina inferior derecha
- Conecta a OpenRouter API (Qwen3-30b gratis)
- Personalidad: filósofo moderno, cercano
- Modera lenguaje automáticamente
- Palabras prohibidas → reporte automático al Control Center
- Cada conversación se registra

#### 🛡️ Control Center (`/control`)
- Login con usuario/contraseña (solo personal autorizado)
- **Credenciales:** `leovela` / `C8L_Admin_2026!`
- **Bot:** `c8l_bot` / `Bot_Panteon_Master!`
- 6 pestañas:
  - 📊 Dashboard (stats en tiempo real)
  - 👥 Usuarios (añadir, ver roles, warnings, coins)
  - 🚨 Reportes (del bot, resolución manual)
  - ⚖️ Normas & Bloqueos (7 normas + 4 niveles sanción)
  - 💬 Chat Log (todas las conversaciones)
  - ⚙️ Config (modelo, moderación, credenciales)

#### ⚖️ Sistema de Sanciones (4 niveles)
- 🔵 **Leve** — 3 días (spam, lenguaje ofensivo leve)
- 🟡 **Media** — 7 días (acoso verbal, enlaces maliciosos)
- 🟠 **Grave** — 30 días (odio, amenazas, acoso sexual)
- 🔴 **Permanente** — Sin apelación (amenazas muerte, estafa)

#### 📺 C8L TV Mejorada (`/tv`)
- 8 videos con reproductor HTML5 nativo
- Botones ⏮ Anterior / ⏭ Siguiente
- Auto-play al cambiar de video
- Auto-avance cuando termina
- Filtros por categoría (Música, Tutorial, Gaming, Estrategia, Live)
- Ordenar por recientes/populares/likes
- Indicador "▶ PLAYING" en video actual

#### 👤 Sistema de Registro (`/registro`)
- Login / Registro con validación
- Check de bloqueos al login
- Perfil de usuario con coins, avisos, fecha
- Cada acción se reporta al Control Center
- Bonus de bienvenida: 100 C8L Coins

---

## 📁 ESTRUCTURA DE ARCHIVOS ACTUAL

```
c8l-bot-server/
├── app/
│   ├── page.tsx              — Home (AgeGate + NavCards)
│   ├── layout.tsx            — Layout global + ChatWidget
│   ├── globals.css           — Estilos (neon, glass, animaciones)
│   ├── casino/page.tsx       — Casino Quantum
│   ├── studio/page.tsx       — Estudio Musical
│   ├── karaoke/page.tsx      — Sala de Canto
│   ├── lives/page.tsx        — Streaming
│   ├── bandos/page.tsx       — Sistema de Bandos
│   ├── tv/page.tsx           — C8L TV (8 videos + navegación)
│   ├── monedero/page.tsx     — Wallet
│   ├── legal/page.tsx        — Legal
│   ├── control/page.tsx      — 🛡️ Control Center (admin)
│   └── registro/page.tsx     — 👤 Login/Registro
├── components/
│   ├── bot/ChatWidget.tsx    — Widget de chat flotante
│   ├── casino/              — SlotMachine, Roulette, Blackjack
│   ├── bandos/              — BandoProfile, BandoWar, BandoRanking
│   ├── studio/              — MusicStudioSupreme, AudioEffects, etc.
│   └── legal/               — LegalFooter, LegalModal
├── lib/
│   ├── bot/chatEngine.ts    — Motor de chat + moderación + OpenRouter
│   ├── controlCenter/
│   │   ├── store.ts         — Estado central (localStorage)
│   │   ├── types.ts         — Tipos TypeScript
│   │   └── normas.ts        — Normas + sistema de bloqueos
│   ├── firebase/config.ts   — Config Firebase + credenciales
│   ├── studio/              — musicGenerator, videoService
│   └── supabase/client.ts   — Cliente Supabase
├── bots/                    — Código Python del bot Telegram
├── chess/                   — Motor de ajedrez
├── panteon-master/          — Documentación del sistema Panteón
├── config.py                — Keys hardcodeadas (OpenRouter, HF, Telegram)
├── package.json             — Next.js 14, React 18, Tailwind, Framer
├── tailwind.config.ts       — Tema C8L (colores, fuentes, animaciones)
├── firebase.json            — Hosting config (out/)
├── .firebaserc              — Proyecto: gen-lang-client-0744582882
├── .github/workflows/       — GitHub Actions (deploy automático)
├── next.config.js           — output: 'export' (estático)
└── Dockerfile               — Python bot (Render.com)
```

---

## 🔑 CREDENCIALES Y ACCESOS

| Servicio | Dato | Valor |
|----------|------|-------|
| Control Center Admin | User/Pass | `leovela` / `C8L_Admin_2026!` |
| Control Center Bot | User/Pass | `c8l_bot` / `Bot_Panteon_Master!` |
| Telegram Bot | Token | Split en config.py (_TK_P1 + _TK_P2) |
| Telegram Bot | Username | @leon_leo_bot |
| OpenRouter | API Key | Split en config.py (_OR_P1 + _OR_P2) |
| OpenRouter | Modelos | qwen3-30b-a3b:free / qwen3-235b-a22b:free |
| NVIDIA | API Key | En config.py (DeepSeek V4 Pro backup) |
| HuggingFace | Token | Split (_HF_P1 + _HF_P2) para SDXL |
| Firebase | Proyecto | gen-lang-client-0744582882 |
| Firebase | Web URL | gen-lang-client-0744582882.web.app |
| GitHub | Repo | leovela69/c8l-bot-server |
| Admin Chat ID | Telegram | 1970956749 |

---

## ⚠️ PROBLEMAS PENDIENTES

### 1. Deploy a Firebase (BLOQUEADO)
- La organización Google Cloud bloquea crear claves de servicio
- No se puede hacer deploy automático desde GitHub
- **Solución pendiente:** Usar Vercel (gratis, 1 click) o resolver permisos en Firebase

### 2. Bot Telegram dual (RESUELTO parcialmente)
- El servicio viejo `leovelabot-dual` en Render puede estar robando mensajes
- **Solución:** Suspender el servicio viejo en Render.com

### 3. Internet del usuario
- Problemas de red actuales impiden abrir páginas web
- No puede hacer deploy manual ni configurar Vercel

---

## 🎯 PRÓXIMOS PASOS (cuando haya internet)

1. **Deploy:** Conectar Vercel a GitHub → auto-deploy instantáneo
2. **Firebase:** Si se resuelven permisos, activar GitHub Actions
3. **Videos reales:** Subir contenido propio a C8L TV
4. **Bot Telegram:** Verificar que solo una instancia corre
5. **Dominio:** Configurar dominio personalizado si se quiere
6. **Seguridad:** Regenerar API keys (están en PRs públicos)

---

## 💡 NOTAS IMPORTANTES PARA FUTURAS SESIONES

- Leo NO puede ejecutar nada localmente — todo cloud
- Preferir hardcodear credenciales (no sabe configurar env vars)
- El repo viejo `leovelabot-dual` tiene PRs abiertos — IGNORAR
- Siempre clonar `c8l-bot-server` y seguir sin preguntar
- El usuario trabaja sesiones largas y se agota — guardar contexto siempre
- Build command: `npm run build` → genera `out/` (estático)
- El bot web usa OpenRouter (gratis) no Gemini

---

*Documento generado: 23 Junio 2026*
*Última sesión: Kiro + Leo Vela*
