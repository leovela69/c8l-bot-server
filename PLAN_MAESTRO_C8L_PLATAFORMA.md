# 🏛️ PLAN MAESTRO — C8L AGENCY PLATFORM
## Plataforma de Música + Streaming + Creación AI
### Versión 1.0 — 26 Junio 2026

---

## 🎯 VISIÓN

C8L Agency es una plataforma TODO-EN-UNO donde:
- **Artistas** suben su música directamente (como SoundCloud)
- **Creadores** generan música con IA (como Suno)
- **Streamers** hacen directo (como Kick/YouTube Live)
- **Fans** escuchan, descubren y apoyan (como Spotify)

**Diferencia clave vs competencia:** C8L combina CREACIÓN + DISTRIBUCIÓN + STREAMING en una sola plataforma. Nadie más lo hace.

---

## 📊 ANÁLISIS DE COMPETENCIA

| Plataforma | Qué hace | Qué NO hace | Modelo de negocio |
|---|---|---|---|
| **Spotify** | Streaming, playlists | NO dejan subir directo (necesitas distribuidor) | Suscripción €10.99/mes |
| **SoundCloud** | Upload directo, social | NO tiene IA ni streaming live | Freemium + Pro €12/mes |
| **Audius** | Descentralizado, upload libre | NO tiene IA, poco tráfico | Web3/crypto |
| **Kick** | Streaming live, 95% revenue para creador | SOLO video en vivo, no música | Suscripciones + ads |
| **YouTube** | Video + Music + Live | Complejo, competencia brutal | Ads + Premium |
| **Suno/Udio** | Creación IA de música | NO distribución, NO streaming | Suscripción |

### 🔥 LO QUE C8L HACE QUE NADIE MÁS HACE:

1. **Crear + Distribuir + Streamear en UN lugar**
2. **IA genera música** Y puedes subirla directamente a la plataforma
3. **95% revenue para el creador** (como Kick, mejor que YouTube/Spotify)
4. **Comunidad integrada** (bandos, salas, chat en vivo)
5. **Videoclips automáticos** (IA genera video + música)
6. **Sin intermediarios** — no necesitas distribuidor

---

## 🏗️ ARQUITECTURA TÉCNICA

### Frontend (Web + Mobile)
```
Next.js 14 (React) — Web responsive
  ├── PWA (Progressive Web App) — funciona como app en Android/iOS
  ├── Capacitor/Expo — App nativa si se quiere Play Store (fase 3)
  │
  ├── /            — Home (feed de música, trending)
  ├── /studio      — Estudio AI (crear música con IA)
  ├── /upload      — Subir tu música (artistas)
  ├── /tv          — C8L TV (streaming live tipo Kick)
  ├── /library     — Tu biblioteca personal
  ├── /artist/:id  — Perfil de artista
  ├── /track/:id   — Página de canción (player + lyrics + comments)
  ├── /explore     — Explorar géneros, trending, playlists
  ├── /premium     — Planes y pago
  └── /admin       — Panel de Leo
```

### Backend (VPS Hostinger)
```
Python (whatsapp_bot.py + API HTTP)
  ├── /api/music/generate    — Generar con IA (MusicAPI/Suno)
  ├── /api/music/upload      — Artistas suben su música
  ├── /api/music/feed        — Feed de canciones
  ├── /api/music/track/:id   — Info de un track
  ├── /api/music/search      — Búsqueda
  ├── /api/music/like        — Dar like
  ├── /api/music/comment     — Comentar
  ├── /api/stream/start      — Iniciar live stream
  ├── /api/stream/list       — Streams activos
  ├── /api/user/profile      — Perfil usuario
  ├── /api/user/follow       — Seguir artista
  ├── /api/billing/checkout  — Stripe pago
  ├── /api/billing/webhook   — Stripe webhook
  └── Bot Telegram (existente)
```

### Almacenamiento
```
Firebase Storage — Audio files (hasta 5GB gratis)
  ├── /tracks/{user_id}/{track_id}.mp3
  ├── /covers/{track_id}.jpg
  └── /avatars/{user_id}.jpg

Firebase Firestore — Base de datos
  ├── users/         — Perfiles, tiers, follows
  ├── tracks/        — Metadata de canciones
  ├── comments/      — Comentarios
  ├── streams/       — Info de lives
  ├── playlists/     — Playlists de usuarios
  └── analytics/     — Plays, likes, stats
```

---

## 📱 MULTIPLATAFORMA (Android/Tablet/PC)

**Estrategia: PWA primero, App nativa después**

### Fase 1 (AHORA): PWA
- La web ya funciona en móvil (responsive)
- Agregar `manifest.json` + service worker = se instala como app
- Funciona offline (canciones cacheadas)
- Notificaciones push
- **Coste: $0** — solo código

### Fase 2 (3 meses): Play Store con TWA
- Trusted Web Activity — empaqueta la PWA como APK
- Se sube a Google Play Store
- Misma web, pero con icono en el cajón de apps
- **Coste: $25** (una vez, cuenta de developer Google)

### Fase 3 (6+ meses): App nativa
- React Native o Capacitor
- Acceso a hardware (notificaciones, background audio, etc.)
- **Coste: tiempo de desarrollo**

---

## 🎵 SISTEMA DE UPLOAD (Artistas suben música)

### Flujo:
1. Artista se registra → perfil público
2. Va a `/upload` → sube MP3/WAV + portada + metadata
3. Sistema verifica (formato, duración, tamaño)
4. Se publica en el feed → fans pueden escuchar
5. Artista ve stats (plays, likes, shares)

### Metadata requerida:
- Título, Artista, Álbum (opcional)
- Género/Tags
- Portada (imagen)
- Letras (opcional)
- Año, BPM (opcional)

### Límites:
| Tier | Uploads/mes | Duración max | Storage |
|------|------------|--------------|---------|
| Free | 3 tracks | 5 min | 100MB |
| Premium | 30 tracks | 15 min | 5GB |
| Pro (artista) | Ilimitado | 30 min | 50GB |

---

## 📺 C8L TV (Streaming Live)

### Inspirado en: Kick (95% revenue) + YouTube Live

### Features:
- Streaming en vivo (OBS → RTMP → C8L TV)
- Chat en tiempo real
- Donaciones/propinas
- Raids (mandar viewers a otro canal)
- Clips (momentos destacados)
- VODs (grabaciones)
- Categorías: Música, Gaming, Just Chatting, Producción

### Monetización streamer:
- **95% de suscripciones** (como Kick)
- **90% de donaciones** (mejor que YouTube)
- **Badges, emotes** personalizados

### Implementación técnica:
- RTMP ingest: usar Livepeer (descentralizado, gratis hasta cierto punto) o Mux
- Player: HLS.js (gratis, open source)
- Chat: WebSocket (nuestro servidor) o Firebase Realtime DB

---

## 💰 MODELO DE NEGOCIO

### Para OYENTES:
| Plan | Precio | Features |
|------|--------|----------|
| Free | 0€ | Escuchar con ads, 1 generación AI/día |
| Premium | 9.99€/mes | Sin ads, 5 gen AI/día, calidad HQ |
| VIP | 19.99€/mes | Todo + descargas + stems + priority |

### Para ARTISTAS:
| Plan | Precio | Features |
|------|--------|----------|
| Artista Free | 0€ | 3 uploads/mes, perfil básico |
| Artista Pro | 4.99€/mes | Uploads ilimitados, stats avanzados |
| Label | 29.99€/mes | Multi-artista, distribución externa |

### Para STREAMERS:
| Plan | Precio | Features |
|------|--------|----------|
| Streamer | 0€ | Stream gratis, 95% revenue |
| Partner | Invitación | Priority, emotes custom, VODs ilimitados |

### Revenue C8L:
- 5% de suscripciones de streamers
- 10% de donaciones
- Comisión por AI generations (15 créditos = ~0.50€ coste)
- Ads en tier gratuito
- Planes premium de oyentes/artistas

---

## 🗓️ FASES DE IMPLEMENTACIÓN

### FASE 1: MVP (1-2 semanas) ← EMPEZAR AQUÍ
- [ ] Arreglar frontend web (logo, nav fija, diseño YouTube)
- [ ] Conectar API tunnel permanente (api.c8lagency.com)
- [ ] Studio AI funcional en la web (ya casi está)
- [ ] PWA básica (manifest + service worker)
- [ ] Player de audio persistente (barra inferior)

### FASE 2: Upload de artistas (2-4 semanas)
- [ ] Página /upload con drag&drop
- [ ] Firebase Storage para archivos de audio
- [ ] Feed de canciones (/explore)
- [ ] Perfil de artista público
- [ ] Búsqueda y tags
- [ ] Sistema de likes y plays

### FASE 3: Social + Comunidad (4-6 semanas)
- [ ] Comentarios en tracks
- [ ] Follow/unfollow artistas
- [ ] Playlists
- [ ] Notificaciones
- [ ] Compartir en redes

### FASE 4: C8L TV — Streaming (6-10 semanas)
- [ ] RTMP ingest (Livepeer o Mux)
- [ ] Player HLS en la web
- [ ] Chat en vivo (WebSocket)
- [ ] Perfil de streamer
- [ ] Categorías y explorar lives

### FASE 5: Monetización (8-12 semanas)
- [ ] Stripe activado
- [ ] Planes de pago funcionales
- [ ] Facturación automática
- [ ] Dashboard de ingresos para artistas/streamers
- [ ] Pagos a creadores (Stripe Connect)

### FASE 6: App móvil (12+ semanas)
- [ ] PWA optimizada
- [ ] TWA para Google Play Store
- [ ] Background audio
- [ ] Notificaciones push
- [ ] Modo offline (canciones cacheadas)

---

## 🛡️ LEGAL (ESPAÑA — Hacienda)

### Para monetizar necesitas:
1. **Alta como autónomo** o **SL** en Hacienda
2. **Modelo 036/037** — Alta censal (actividad: servicios digitales)
3. **Epígrafe IAE:** 844 (servicios de publicidad) o 769.9 (otros servicios)
4. **IVA:** 21% España, 0% intracomunitario/fuera EU
5. **Modelo 303:** Trimestral (abril, julio, octubre, enero)
6. **Modelo 349:** Si vendes a otros países EU
7. **LOPD/RGPD:** Política de privacidad + cookies (ya tienes /legal)
8. **Términos de servicio:** Especialmente para contenido generado por IA

### Facturación (ya preparada en billing.py):
- Numeración secuencial: C8L-2026-0001
- Datos obligatorios: NIF, nombre, dirección, concepto, base, IVA, total
- Retención IRPF si vendes a empresas españolas

---

## 🎨 DISEÑO — IDENTIDAD VISUAL

### Colores:
- **Principal:** Negro (#0a0a0a) — fondo
- **Acento 1:** Dorado (#d4af37) — logo, highlights
- **Acento 2:** Rojo (#dc2626) — corazón, CTAs
- **Acento 3:** Azul eléctrico (#3b82f6) — links, player
- **Texto:** Blanco (#ffffff) y gris (#9ca3af)

### Tipografía:
- Headlines: Bold sans-serif (Inter, Montserrat)
- Body: Regular (Inter)
- Mono: JetBrains Mono (código, stats)

### Logo: C8L Corazones Locos Agency (imagen adjunta)
- Usar en navbar (versión pequeña)
- Usar en loading screens (versión grande)
- Favicon: solo "C8L" en dorado sobre negro

---

## 📋 PROMPT DEFINITIVO PARA ANTIGRAVITY

```
Eres el arquitecto de C8L Agency Platform.

REPO: github.com/leovela69/c8l-bot-server
VPS: Hostinger Ubuntu 24.04, root@srv1774129
WEB ACTUAL: https://gen-lang-client-0744582882.web.app
DEPLOY: Firebase Hosting (next export)

ESTADO ACTUAL:
- Bot Telegram genera música PRO con MusicAPI.ai ✅
- Backend API en VPS con tunnel Cloudflare ✅
- Frontend Next.js con diseño base ✅
- Sistema de monetización preparado (no activo) ✅
- Sistema de créditos y tiers ✅

LOGO: [adjuntar imagen del logo C8L Corazones Locos Agency]

TU MISIÓN (por fases):

FASE 1 (AHORA):
1. Arreglar el frontend: navbar FIJA (nunca desaparece), logo nuevo,
   diseño tipo YouTube Music con tema oscuro (negro/dorado/rojo)
2. Conectar el Studio AI con la API del bot (endpoint /api/suno/generate)
3. Hacer que funcione como PWA en móvil
4. Player de audio siempre visible abajo

FASE 2 (siguiente):
1. Página de upload para artistas (subir MP3 a Firebase Storage)
2. Feed de canciones con player integrado
3. Perfiles de artista públicos
4. Búsqueda y explorar por géneros

REGLAS:
- NO cambiar el backend (ya funciona)
- NO cambiar el dominio de Firebase
- Diseño responsive (mobile first)
- Colores: negro #0a0a0a, dorado #d4af37, rojo #dc2626
- El bot es el motor de música de la web (misma API)
- Navbar siempre visible con: C8L TV, Salas, Streaming,
  Monetización, Comunidad, Perfil, Estudio IA

ARCHIVOS CLAVE:
- app/layout.tsx — Layout global
- app/page.tsx — Home
- app/studio/page.tsx — Estudio AI
- components/layout/AppShell.tsx — Shell con navbar
- Nuevos: app/upload/page.tsx, app/explore/page.tsx

SERVICIOS DISPONIBLES:
- MusicAPI.ai (key: a42d1b7ec0aa27808b910f52412bde8a)
- Groq (letras gratis)
- Pollinations (imágenes/video gratis)
- Firebase (auth + storage + hosting)
- Stripe (preparado, no activo)
```
```

---

## ✅ RESUMEN EJECUTIVO

C8L Agency NO es "otra app de música". Es la **primera plataforma que une**:
- 🎵 Creación AI (generas con IA)
- 📤 Distribución directa (subes tu música sin intermediarios)
- 📺 Streaming live (como Kick, 95% revenue)
- 👥 Comunidad (bandos, chat, social)
- 💰 Monetización justa (95% para el creador)

**El valor único:** Un artista puede CREAR una canción con IA, PUBLICARLA al instante, hacer un LIVE presentándola, y GANAR dinero — todo sin salir de C8L.

Nadie más ofrece esto. Ni Spotify, ni YouTube, ni Kick, ni Suno.

---

*Documento creado por Kiro × Leo Vela — 26 Junio 2026*
*C8L Agency — El Salto Cuántico en la Creación de Contenido*
