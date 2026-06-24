# C8L AGENCY — ESTUDIO COMPLETO PARA ANTIGRAVITY
## Documento de Referencia para IAs y Colaboradores

**Fecha:** 24 Junio 2026
**Proyecto:** C8L Agency — Corazones Locos Family
**Creador:** Leo Vela (@leovela69)
**Bot Telegram:** @leon_leo_bot
**Repositorio:** github.com/leovela69/c8l-bot-server
**Web Vercel:** c8l-bot-server.vercel.app
**Web Firebase:** gen-lang-client-0744582882.web.app

---

## 1. RESUMEN EJECUTIVO

C8L Agency es una plataforma de entretenimiento comunitario potenciada por IA.
Combina produccion musical (genero Bolero-House), gaming (casino, bandos, ajedrez),
y una comunidad activa en Telegram, todo orquestado por un sistema multi-agente
de 11 bots especializados inspirados en el Panteon griego.

### Pilares del proyecto:
1. **Produccion Musical** — Bolero-House (bolero clasico + house electronico 115 BPM)
2. **Gaming/Casino** — Slots, Ruleta, Blackjack, Bandos, Ajedrez
3. **Comunidad** — Grupo Telegram "Corazones Locos", moderacion IA, niveles XP
4. **Creacion con IA** — Imagenes, videos, musica, codigo, documentos
5. **Plataforma Web** — 10 secciones interactivas (Next.js 14)

### Costo operativo: $0/mes (todo con APIs gratuitas)


---

## 2. ARQUITECTURA — PANTEON DE DIOSES (Sistema Multi-Agente)

### Diagrama de flujo:
```
Usuario envia mensaje
       |
       v
   ZEUS (Orquestador)
   Analiza intencion con DeepSeek V4 Flash
       |
       v
   Asigna al agente especializado
       |
       +---> HERMES (Chat conversacional)
       +---> VULCANO (Imagenes, logos, mockups)
       +---> APOLO (Musica, composicion)
       +---> ARES (Videos reales con IA)
       +---> HEFESTO (Codigo, landing pages, juegos)
       +---> ARTEMISA (APIs, backend)
       +---> ATENEA (Estrategia, PDFs, articulos)
       +---> MINERVA (Investigacion, conocimiento)
       +---> ARIES (Seguridad, diagnostico)
       +---> ESTIA (Aprendizaje, memoria)
       +---> GUARDIAN (Moderacion, warns/bans)
```

### Tabla completa de agentes:

| # | Agente | Emoji | Rol | Modelo IA | Funcion Principal |
|---|--------|-------|-----|-----------|-------------------|
| 1 | Zeus | Crown | Director | DeepSeek V4 Flash | Analiza intenciones, orquesta |
| 2 | Hermes | Megaphone | Comunicador | DeepSeek V4 Flash | Chat con personalidad filosofo |
| 3 | Vulcano | Palette | Artesano | DeepSeek V4 Flash | Imagenes 14 estilos + logos |
| 4 | Apolo | Music | Musico | DeepSeek V4 Flash | Composicion musical |
| 5 | Ares | Film | Cineasta | DeepSeek V4 Flash | Videos reales (12 motores) |
| 6 | Hefesto | Desktop | Disenador | DeepSeek V4 Flash | Codigo, juegos, landings |
| 7 | Artemisa | Gear | Arquitecto | DeepSeek V4 Flash | APIs REST, scripts backend |
| 8 | Atenea | Chart | Estratega | DeepSeek V4 Flash | Marketing, PDFs, planes |
| 9 | Minerva | Brain | Sabio | DeepSeek V4 Flash | Investigacion, ideas |
| 10 | Aries | Shield | Guardian | Qwen3-30b | Seguridad, escaneo web |
| 11 | Estia | DNA | Memoria | Qwen3-30b | Aprendizaje evolutivo |
| 12 | Guardian | Lock | Moderador | Sistema reglas | Warns, bans, proteccion |


---

## 3. STACK TECNOLOGICO COMPLETO

### Backend (Bot Telegram + WhatsApp)
| Tecnologia | Version | Funcion |
|-----------|---------|---------|
| Python | 3.11 | Lenguaje principal del bot |
| pyTelegramBotAPI | Latest | Framework del bot Telegram |
| OpenRouter API | v1 | Gateway a 300+ modelos IA gratis |
| DeepSeek V4 Flash | Free | Motor cerebral principal |
| Qwen3-30b | Free | Motor ligero (fallback) |
| NVIDIA API | DeepSeek V4 Pro | Backup si OpenRouter falla |
| Gemini 2.5 Flash | Image model | Generacion imagenes (500/dia) |
| Pollinations API | Flux/Kontext | Imagenes + Videos (ilimitado) |
| HuggingFace | SDXL | Imagenes fallback |
| Pillow (PIL) | Latest | Logo Engine (30 fuentes) |
| fpdf2 | Latest | Generacion PDFs reales |
| FFmpeg | Latest | Procesamiento video/audio |
| WhatsApp Cloud API | v21.0 | Canal WhatsApp (Meta) |
| Render.com | Free tier | Hosting del bot |

### Frontend (Web)
| Tecnologia | Version | Funcion |
|-----------|---------|---------|
| Next.js | 14.2.15 | Framework web (App Router) |
| React | 18.3.1 | UI library |
| TypeScript | 5.5 | Tipado |
| Tailwind CSS | 3.4.10 | Estilos (dark theme neon) |
| Framer Motion | 11.5 | Animaciones |
| Supabase.js | 2.45 | Cliente DB (preparado) |
| Vercel | Auto | Hosting principal web |
| Firebase Hosting | Alt | Hosting alternativo |

### Servicios externos integrados:
- OpenRouter (cerebro IA gratuito)
- Pollinations (video + imagen gratuito)
- Gemini (imagenes gratuito)
- HuggingFace (imagenes gratuito)
- NVIDIA (backup LLM)
- WhatsApp Cloud API (mensajeria)
- Telegram Bot API (mensajeria principal)


---

## 4. CAPACIDADES DEL BOT — QUE PUEDE HACER

### 4.1 Generacion de Imagenes (14 estilos)
Vulcano detecta automaticamente el estilo pedido:
- 3D Render | Anime/Manga | Pixel Art | Fotorealista
- Logo profesional | Pintura al oleo | Cartoon
- Cyberpunk | Dark/Horror | Minimalista
- Acuarela | Comic | Isometrico | Concept Art

**Extras:**
- Logo Engine v2: texto perfecto con 30+ fuentes descargadas
- Mockup Mode: objetos reales con marca (monedas, TV NYC, carteles)
- Edicion: responder "mejora esto" edita la ultima imagen
- Resolucion: hasta 1024x1024

### 4.2 Generacion de Video REAL (12 motores)
No genera guiones — genera VIDEO MP4/GIF real:

| Motor | Calidad | Duracion | Fortaleza |
|-------|---------|----------|-----------|
| Google Veo | Maxima | 4-8s | Cinematico |
| Seedance Pro | Alta | 2-10s | Accion/movimiento |
| Seedance 2.0 | Alta | 2-10s | Variedad |
| Wan Fast | Media-Alta | 2-15s | Velocidad |
| Wan Pro | Alta | 2-15s | Equilibrado |
| Wan Pro 1080p | Maxima res | 2-15s | Full HD |
| Grok Video Pro | Alta | 4-8s | Creativo |
| LTX-2 | Media | 2-10s | Rapido |
| Nova Reel | Variable | 6-120s | Videos largos |
| + 3 fallbacks | Variable | Variable | Respaldo |

Estrategia: falla uno -> prueba siguiente -> ultimo recurso: slideshow con FFmpeg

### 4.3 Composicion Musical
- Genera letras completas con estructura (verso, coro, bridge, outro)
- Prompts optimizados para Suno/Udio
- Genero principal: Bolero-House (115 BPM)
- Puede componer en cualquier genero solicitado

### 4.4 Generacion de Codigo
- Landing pages HTML completas (CSS + JS inline)
- Juegos funcionales (Snake, Tetris, Pong, etc.)
- APIs REST con Express/Flask
- Componentes React
- Scripts Python/Node.js
- Se sirven como archivos descargables + link para abrir en navegador

### 4.5 Documentos y Estrategia
- PDFs reales generados con fpdf2
- Articulos SEO
- Planes de marketing
- Estrategias de contenido
- Informes de actividad

### 4.6 Moderacion Avanzada (Guardian)
- Sistema de 3 strikes (warn -> warn -> auto-ban)
- Bans temporales: 3d, 7d, 30d, permanente
- Unban manual por admin
- Historial de sanciones
- Restriccion de mensajes en grupo automatica

### 4.7 Sistemas Inteligentes
- **Auto-Evolucion:** Botones de feedback (thumbs up/down) que mejoran respuestas
- **Auto-Repair:** Cada 6h se auto-diagnostica y corrige errores
- **Smart Memory:** Recuerda contexto por usuario (historial de conversacion)
- **Niveles/XP:** Sistema de gamificacion (cada interaccion da XP)
- **Keep-Alive:** Ping cada 5 min para no dormirse en Render


---

## 5. COMANDOS DE TELEGRAM — LISTA COMPLETA

| Comando | Funcion | Agente |
|---------|---------|--------|
| /start | Bienvenida + intro sistema | Zeus |
| /help | Lista todos los comandos | Zeus |
| /estado | Estado de los 11 agentes | Zeus |
| /clear | Limpiar historial chat | Zeus |
| /crear_imagen [desc] | Genera imagen en cualquier estilo | Vulcano |
| /crear_musica [tema] | Compone cancion | Apolo |
| /video [desc] | Genera VIDEO REAL con IA (1-3 min) | Ares |
| /crear_video [concepto] | Genera video (alternativo) | Ares |
| /crear_landing [desc] | Landing page HTML completa | Hefesto |
| /crear_api [desc] | Genera API backend | Artemisa |
| /crear_articulo [tema] | Articulo SEO | Atenea |
| /diagnosticar | Escanea web C8L | Aries |
| /aprender [leccion] | Registra conocimiento | Estia |
| /informe | Informe de actividad | Estia |
| /evolucion | Reporte de evolucion | Estia |
| /anunciar [msg] | Envia anuncio al grupo (admin) | Hermes |
| /comunicado [tema] | Genera comunicado con IA (admin) | Hermes |
| /grupo_msg [cat] | Mensaje por categoria (admin) | Hermes |
| /groupid | Registra grupo para broadcasts | Zeus |
| /warn | Advertencia a usuario (admin) | Guardian |
| /ban [duracion] [motivo] | Banea usuario (admin) | Guardian |
| /unban | Desbanea usuario (admin) | Guardian |

**Modo natural:** El usuario puede escribir cualquier cosa sin comandos
y Zeus detecta automaticamente la intencion y asigna al agente correcto.

Ejemplos de lenguaje natural:
- "hazme una imagen de un leon dorado" -> Vulcano
- "componer cancion de amor" -> Apolo
- "crea un video de olas" -> Ares
- "necesito una landing para mi negocio" -> Hefesto
- "que opinas del bitcoin" -> Hermes (chat)
- "investiga sobre blockchain" -> Minerva


---

## 6. LA WEB — PLATAFORMA COMPLETA (2 versiones)

### 6.1 Version Vercel (COMPLETA) — c8l-bot-server.vercel.app

10 paginas, sistema completo con admin panel:

| Pagina | Ruta | Descripcion |
|--------|------|-------------|
| Home | / | Landing con Age Gate (+18), nav a todo |
| Casino Quantum | /casino | Slots, Ruleta, Blackjack (97% RTP) |
| Estudio Musical | /studio | Crea musica con IA (8 generos, BPM, effects) |
| Karaoke | /karaoke | Medidores de tono/energia en tiempo real |
| Lives | /lives | Streaming con regalos virtuales |
| Bandos | /bandos | Sistema familias/guerras/ranking |
| C8L TV | /tv | 8 videos, reproductor, filtros, retos |
| Monedero | /monedero | Wallet (Coins, Diamantes, BID) |
| Mi Cuenta | /registro | Login/Register con localStorage |
| Legal | /legal | RGPD/LOPD compliance |
| Control | /control | Dashboard admin completo |

**Caracteristicas exclusivas Vercel:**
- ChatWidget flotante (bot integrado en web)
- Panel admin con dashboard, usuarios, reportes, normas, bloqueos
- Sistema de login/register con roles
- Lib completa: chatEngine, levels, memory, missions, vigilancia

### 6.2 Version Firebase (LIMPIA) — gen-lang-client-0744582882.web.app

8 paginas, enfocada en contenido y entretenimiento:

| Pagina | Ruta | Descripcion |
|--------|------|-------------|
| Home | / | Landing principal |
| Casino | /casino | Juegos casino |
| Estudio | /studio | Estudio musical |
| Karaoke | /karaoke | Karaoke interactivo |
| Lives | /lives | Transmisiones |
| Bandos | /bandos | Sistema bandos |
| C8L TV | /tv | Canal contenido |
| Monedero | /monedero | Wallet virtual |
| Legal | /legal | Normas |

**Diferencias Firebase:**
- Sin admin panel ni login
- Sin ChatWidget
- Con Supabase preparado (lib/supabase/)
- Con lib/studio/ separada
- Enfocada en experiencia de usuario pura

### 6.3 Diseno Visual
- **Theme:** Dark (negro + neon purple + gold)
- **Estilo:** Glass morphism, blur, gradients
- **Fuente:** Outfit (headings), sans-serif (body)
- **Animaciones:** Float, glow, scale on hover
- **Responsive:** Mobile-first, grid adaptativo
- **Age Gate:** Verificacion +18 obligatoria al entrar


---

## 7. CASINO QUANTUM — Detalle de Juegos

### Quantum Slots
- RTP: 97.3%
- Apuesta minima: 10 C8L Coins
- 5 carretes x 3 filas
- Simbolos tematicos C8L
- Multiplicadores especiales
- Jackpot progresivo

### Ruleta C8L
- RTP: 97.3%
- Apuesta minima: 25 C8L Coins
- Ruleta europea (0-36)
- Apuestas: rojo/negro, par/impar, columnas, docenas, pleno
- Animacion de giro realista

### Blackjack VIP
- RTP: 99.5%
- Apuesta minima: 50 C8L Coins
- Reglas estandar (hit, stand, double, split)
- Dealer se planta en 17
- Blackjack paga 3:2

### Disclaimer legal:
- Coins SIN valor monetario real
- Solo entretenimiento
- +18 obligatorio
- Link a jugarbien.es
- Cumple RGPD y LOPD

---

## 8. ESTUDIO MUSICAL — Capacidades

### Generos disponibles:
1. Bolero-House (principal) — 115 BPM
2. Jazz Fusion
3. Flamenco Electronico
4. Reggaeton
5. Electronica/EDM
6. Lofi Hip-Hop
7. Rock Alternativo
8. Pop Contemporaneo

### Moods:
- Feliz / Triste / Energetico / Relajado / Romantico / Oscuro

### Controles:
- Slider BPM (60-180)
- Key/Tonalidad
- Efectos: Reverb, Delay, EQ (3 bandas)
- Waveform visual en tiempo real

### Output:
- Letra completa con estructura
- Acordes sugeridos
- Prompt para Suno/Udio
- (Pendiente: audio real con API de musica)


---

## 9. SISTEMA DE COMUNIDAD

### Grupo Telegram: "Corazones Locos"
- Link: https://t.me/+c9cJksqbLCwzYzlh
- ID: -1002476372487
- Moderado por Guardian + Admin

### Personalidad del bot en grupo:
- Estilo: "villano empoderado" — carismatico, magnetico, exigente, motivador
- Frases trademark: "Rakata!", "Rica tra!", "Sufre bonito"
- 4 pilares de contenido rotativo:
  1. TAREAS — productividad, accion
  2. MUSICA — creacion, produccion
  3. MOTIVACION — mindset, empuje
  4. WEB — comunidad, registro
- Cierre obligatorio: "Y vivieron felices... Porque nosotros quisimos."

### Group Scheduler (mensajes automaticos):
- Frecuencia: cada 4 horas (+/- 30 min aleatorio)
- Contenido: comunicados generados con IA segun pilar
- Formato: HTML con emojis y estructura visual

### Broadcasts automaticos:
- Level Up! (usuario sube de nivel)
- Nuevo Miembro! (alguien hace /start)
- Nuevo Contenido! (se crea algo con el bot)
- Anuncios del admin

### Sistema de niveles/XP:
- Cada interaccion = XP
- Niveles con nombres (Novato -> Maestro -> Leyenda)
- Ranking visible
- Coins como recompensa

---

## 10. SISTEMAS AUTONOMOS (24/7)

| Sistema | Que hace | Frecuencia |
|---------|----------|------------|
| Group Scheduler | Mensajes motivacionales/informativos al grupo | Cada 4h |
| Auto-Repair | Analiza errores del log y auto-corrige codigo | Cada 6h |
| Keep-Alive | Ping a si mismo para evitar sleep en Render | Cada 5 min |
| Auto-Evolucion | Aprende de feedback positivo/negativo | Continuo |
| Smart Memory | Recuerda preferencias y contexto por usuario | Continuo |
| Error Capture | Registra errores para auto-repair | Continuo |
| Startup Photo | Genera imagen de saludo al grupo al arrancar | Al iniciar |
| Admin Notify | Notifica al admin cuando el bot arranca | Al iniciar |


---

## 11. MODELO ECONOMICO

### Costos actuales: $0/mes

| Recurso | Costo | Limite |
|---------|-------|--------|
| OpenRouter (DeepSeek V4 Flash) | GRATIS | Ilimitado |
| OpenRouter (Qwen3-30b) | GRATIS | Ilimitado |
| Gemini 2.5 Flash Image | GRATIS | 500 img/dia |
| Pollinations Video | GRATIS (con key) | Ilimitado |
| Pollinations Imagen | GRATIS | Ilimitado |
| HuggingFace SDXL | GRATIS | Rate limited |
| NVIDIA API | GRATIS | 1000 req/dia |
| Render.com | GRATIS (free tier) | Sleep 15min inactividad |
| Vercel | GRATIS | 100GB bandwidth/mes |
| Firebase Hosting | GRATIS | 10GB/mes |
| WhatsApp Cloud API | GRATIS | 1000 msg/mes (business) |
| Telegram Bot API | GRATIS | Ilimitado |

### Potencial de monetizacion (no implementado aun):
1. Suscripcion premium (mas generaciones, sin limites)
2. Venta de Coins reales (Stripe/PayPal)
3. Casino con apuestas reales (licencia necesaria)
4. Produccion musical por encargo
5. Servicios de IA para terceros
6. NFTs / coleccionables digitales
7. Publicidad en el grupo/web
8. Marketplace de contenido generado

---

## 12. INFRAESTRUCTURA Y DEPLOY

### Arquitectura de despliegue:
```
GitHub (leovela69/c8l-bot-server)
       |
       +---> Render.com (bot Python)
       |     - Dockerfile: python:3.11-slim
       |     - CMD: python whatsapp_bot.py
       |     - Puerto: 8080 (health + WhatsApp webhook)
       |     - Polling: Telegram (long polling)
       |
       +---> Vercel (web Next.js - auto deploy)
       |     - Framework: Next.js 14
       |     - Build: next build (static export)
       |     - Ignora: *.py, chess/, pantheon/, bots/
       |
       +---> Firebase Hosting (web alternativa)
             - Static files (carpeta /out)
             - Deploy manual
             - Rewrites: SPA (todo a index.html)
```

### Estructura de archivos principal:
```
c8l-bot-server/
|-- whatsapp_bot.py          <- Bot principal (2000+ lineas)
|-- config.py                <- Todas las keys y configuracion
|-- openrouter_client.py     <- Cliente OpenRouter API
|-- group_personality.py     <- Personalidad del grupo
|-- group_scheduler.py       <- Scheduler de mensajes auto
|-- install_fonts.py         <- Descarga fuentes para Logo Engine
|-- aion_cron.py             <- Coordinador AION (cron jobs)
|
|-- pantheon/                <- Sistema de agentes
|   |-- zeus.py              <- Orquestador (analiza intenciones)
|   |-- minerva.py           <- Conocimiento/investigacion
|   |-- vulcano.py           <- Creacion (imagenes, logos, mockups)
|   |-- video_engine.py      <- Motor de video multi-modelo
|   |-- evolution.py         <- Auto-evolucion (feedback)
|   |-- smart_memory.py      <- Memoria inteligente
|   |-- auto_repair.py       <- Auto-reparacion
|   |-- tools.py             <- Herramientas (QR, traducir, etc)
|   +-- slaves/              <- Agentes subordinados
|       |-- hermes_bot.py    <- Chat conversacional
|       |-- apolo.py         <- Musica
|       |-- ares.py          <- Video
|       |-- aries.py         <- Seguridad
|       |-- hefesto.py       <- Codigo/diseno
|       |-- artemisa.py      <- Backend/APIs
|       |-- atenea.py        <- Estrategia/docs
|       |-- estia.py         <- Aprendizaje
|       +-- guardian.py      <- Moderacion
|
|-- chess/                   <- Sistema de ajedrez
|-- bots/                    <- Bots autonomos (AION, aguilas, cerebros, manos)
|-- app/                     <- Web Vercel (10 paginas)
|-- web/                     <- Web Firebase (8 paginas)
|-- components/              <- Componentes React (casino, studio, bandos, legal)
|-- lib/                     <- Librerias web (bot, controlCenter, firebase, studio)
|-- docs/                    <- Documentacion (Backend specs, Plan lanzamiento)
+-- data/                    <- Datos runtime (memory, pages, reports)
```


---

## 13. FORTALEZAS COMPETITIVAS

1. **Multi-agente inteligente** — Zeus decide automaticamente que agente responde (no requiere comandos)
2. **Video REAL con IA** — 12 motores gratuitos con fallback inteligente, genera MP4/GIF
3. **14 estilos de imagen** — Deteccion automatica del estilo pedido
4. **Logo Engine v2** — Texto perfecto con 30+ fuentes (no IA, Pillow directo)
5. **Auto-evolucion** — Aprende de feedback positivo/negativo del usuario
6. **Auto-reparacion** — Se diagnostica y corrige cada 6 horas
7. **Plataforma web completa** — Casino, Musica, TV, Bandos, todo funcional
8. **100% gratuito** — Cero costo de operacion mensual
9. **Dual-channel** — Telegram + WhatsApp desde el mismo codigo
10. **Comunidad activa** — Grupo con personalidad, scheduler, broadcasts automaticos
11. **Legal compliance** — RGPD, Age Gate, disclaimer casino
12. **Codigo abierto** — Todo en GitHub, reproducible
13. **Escalable** — Arquitectura modular (agregar agente = crear archivo Python)
14. **Mockup Mode** — Objetos reales con marca (monedas, TV, NYC billboards)
15. **PDF Generator** — Documentos reales descargables

---

## 14. OPORTUNIDADES Y PENDIENTES

### Critico (bloquea funcionalidad):
| # | Pendiente | Impacto | Solucion |
|---|-----------|---------|----------|
| 1 | Key Google AIzaSy | No puede usar Gemini SDK ni Veo nativo | Crear proyecto GCP nuevo |
| 2 | GitHub PAT | Auto-repair no puede push fixes | Generar token personal |
| 3 | Render sleep | Bot se duerme tras 15min sin trafico | Upgrade a paid ($7/mes) o keep-alive |

### Importante (mejora la experiencia):
| # | Pendiente | Impacto | Solucion |
|---|-----------|---------|----------|
| 4 | Audio real | No genera musica descargable | Integrar Suno/Udio API |
| 5 | Base de datos | Todo en memoria (se pierde al restart) | Conectar Supabase |
| 6 | Dominio propio | URLs largas poco profesionales | Comprar .com/.es |
| 7 | Analytics | No hay metricas de uso | Google Analytics/Posthog |
| 8 | PWA | No funciona como app movil | Service Worker + manifest |
| 9 | Push notifications | No avisa al usuario de nada | Firebase Cloud Messaging |
| 10 | Monetizacion | Todo gratis, no genera ingresos | Stripe/PayPal |

### Nice-to-have (futuro):
- App nativa iOS/Android (React Native)
- Streaming en vivo real (WebRTC)
- Marketplace de contenido
- Sistema de NFTs
- API publica para terceros
- Multi-idioma (i18n)
- Dashboard de analytics en tiempo real


---

## 15. SOBRE BOLERO-HOUSE (El genero musical)

**Definicion:** Fusion de bolero clasico latinoamericano con house electronico.

| Elemento | Bolero Clasico | House | Bolero-House |
|----------|---------------|-------|-------------|
| BPM | 60-90 | 120-130 | 115 |
| Vocales | Emotivas, dramaticas | Samples, ad-libs | Emotivas sobre beat |
| Ritmo | Guitarra, bongo | Kick 4/4, hi-hat | Kick suave + rasgueo |
| Armonia | Mayor/menor romantica | Minimalista | Jazz + latina |
| Produccion | Analogica, organica | Digital, sintetica | Hibrida IA + humano |
| Tema | Amor, desamor | Fiesta, vida nocturna | Amor en era digital |

**Artistas referencia:** Luis Miguel meets Disclosure. Natalia Lafourcade meets Kaytranada.

---

## 16. INFORMACION TECNICA PARA OTRAS IAs

### Para que otra IA pueda continuar el desarrollo:

**Repositorio:** `git clone https://github.com/leovela69/c8l-bot-server.git`

**Archivo principal:** `whatsapp_bot.py` (2000+ lineas, contiene TODO el bot)

**Configuracion:** `config.py` (todas las keys hardcodeadas, split en partes)

**Para agregar un nuevo agente:**
1. Crear archivo en `pantheon/slaves/nuevo_agente.py`
2. Importar en `whatsapp_bot.py`
3. Agregar case en `dispatch_to_agent()`
4. Agregar modelo en `config.py` -> MODELS dict
5. Actualizar `zeus.py` para detectar el nuevo intent

**Para agregar nueva pagina web:**
1. Crear carpeta en `app/nueva_pagina/`
2. Crear `page.tsx` dentro
3. Agregar NavCard en `app/page.tsx` (home)
4. Push -> Vercel auto-deploys

**Para modificar personalidad del bot:**
- Editar `group_personality.py` (GROUP_SYSTEM_PROMPT)
- Editar `pantheon/slaves/hermes_bot.py` (system prompt del chat)

**Variables de entorno (opcionales, todo esta hardcodeado):**
- TELEGRAM_BOT_TOKEN
- ADMIN_CHAT_ID
- GROUP_CHAT_ID
- OPENROUTER_API_KEY
- GEMINI_API_KEY
- HUGGINGFACE_TOKEN
- NVIDIA_API_KEY
- WHATSAPP_TOKEN
- WHATSAPP_PHONE_ID
- PORT (default: 8080)

---

## 17. RESUMEN PARA ANTIGRAVITY

### Que ES C8L Agency:
- Plataforma de entretenimiento comunitario con IA como motor
- Produccion musical (Bolero-House = bolero + house 115 BPM)
- Gaming/Social (Casino, Bandos, Karaoke, Lives)
- Bot como centro de operaciones (11 agentes especializados)
- Web completa (10 secciones interactivas)

### Que PUEDE hacer ahora mismo:
- Generar imagenes en 14 estilos instantaneamente
- Generar videos REALES con IA (1-3 min, 12 motores)
- Crear musica (letras + estructura + prompt para Suno)
- Crear landing pages/juegos/APIs con codigo funcional
- Moderar comunidad (warns, bans, scheduler automatico)
- Casino funcional (web) con 3 juegos
- Plataforma web completa con 10 secciones
- WhatsApp + Telegram simultaneo
- Auto-evolucionar y auto-repararse

### Que NECESITA para el siguiente nivel:
1. Dominio propio + branding profesional
2. Base de datos real (Supabase schema ya existe)
3. Pasarela de pago para monetizar
4. Audio real (Suno/Udio API)
5. Hosting dedicado (salir de free tier)
6. App movil (PWA o React Native)
7. Analytics y metricas

### Numeros clave:
- 11 agentes IA operativos
- 12 motores de video
- 14 estilos de imagen
- 10 secciones web
- 3 juegos de casino
- 2 canales (Telegram + WhatsApp)
- 2 webs (Vercel + Firebase)
- $0/mes costo operativo
- 24/7 autonomo

---

**Documento generado por Kiro AI para C8L Agency**
**Fecha: 24 Junio 2026**
**Version: v17.0 Panteon Master**
**Repositorio: github.com/leovela69/c8l-bot-server**



---

## 18. HERRAMIENTAS AI PARA CREACION DE CONTENIDO (Open Source + APIs Publicas)

Vision: Crear un ecosistema C8L donde se pueda generar imagenes, videos, rostros,
guiones y contenido largo todo integrado, con codigo abierto y sin suscripciones caras.

### 18.1 IMAGEN Y VIDEO (Generacion + Edicion)

#### Bernini (ByteDance) - El Todoterreno
- Descripcion: Unifica generacion y edicion de video con planificador semantico + renderizador DiT
- Licencia: Apache 2.0
- Hardware: GPU NVIDIA (H100 recomendado) con CUDA 12.4, minimo 8.4 GB para version int4
- Capacidades: T2V, R2V (referencia a video), V2V (edicion), RV2V (referencia + video)
- Resolucion: 480p/16fps
- Limitacion: El planificador MLLM de 7B no esta open-source

#### Mona - Videos Largos (Hasta 30 Minutos)
- Descripcion: Framework para video generativo de larga duracion con coherencia narrativa
- Licencia: Open Source
- Hardware: Soporte contenedor NVIDIA (Docker)
- Innovacion: Resolucion 4K Cinematografica, arquitectura Spatio-Temporal DiT con Gemini AI
- Limitacion: Proyecto muy reciente, requiere alta VRAM

#### FLUX.2 [klein] (Black Forest Labs) - Imagen Rapida
- Descripcion: Generacion y edicion de imagenes en subsegundo
- Licencia: Apache 2.0 (version 4B)
- Hardware: RTX 3090/4070 (~13 GB VRAM)
- Capacidades: T2I, edicion multi-referencia, inferencia en <1 segundo
- Limitacion: Version 9B es solo para uso no comercial
- vs Z-Image: Turbo de Alibaba necesita 16 GB VRAM, mejor texto bilingue EN+ZH

#### HiDream-O1-Image - Nuevo Lider Open Source
- Descripcion: Modelo unificado 8B parametros, genera/edita/personaliza imagenes hasta 2048x2048
- Licencia: Open Source (dev branch)
- Innovacion: Pixel-Level Unified Transformer, prompt agent con razonamiento previo
- Capacidades: T2I, rendering texto largo, edicion por instrucciones, personalizacion por sujeto
- Ranking: #8 en Artificial Analysis Text to Image Arena
- Limitacion: Version Dev open-source, version full puede tener restricciones

### 18.2 ROSTROS (Cambio de Rostro + Mejora)

#### AlphaFace - Robusto a Poses Extremas
- Descripcion: Swapper de rostros en tiempo real con alta fidelidad
- Licencia: Open Source (repo publico)
- Rendimiento: 24.1 ms por imagen (tiempo real)
- Calidad: Puntuacion ID retrieval 98.77 en FF++
- Usa VLM + perdidas contrastivas

#### FaceFusion ComfyUI - Intercambio Local Sin API
- Descripcion: Nodos para ComfyUI con inferencia ONNX local, sin internet
- Licencia: Open Source (GPLv3 para repo)
- Hardware: Consumo local, modelos auto-descargables (~100-500 MB)
- Control: 13 modelos de swapping + mascaras multi-select
- Modelos: hyperswap, ghost (Apache 2.0), inswapper, simswap, uniface

#### Reface (FastAPI + React) - Swap Listo para Produccion
- Descripcion: App completa con backend FastAPI y frontend Vite + React
- Licencia: MIT
- Arquitectura: Backend Python (uv), frontend moderno
- Control: Seleccion por indice de cara, historial de trabajos, API REST documentada

### 18.3 GUIONES Y CONTENIDO LARGO

#### Noval - Estudio de Adaptacion de Guiones
- Descripcion: Herramienta auto-hospedada para convertir novelas/borradores en paquetes de produccion
- Licencia: Open Source
- LLMs soportados: Anthropic Claude (/v1/messages) y cualquier provider OpenAI-compatible
- Formatos entrada: .txt, .md, .json, .docx, .epub
- Output: Estrategia adaptacion, biblia personajes/mundo, beats episodios, guion completo
- Limitacion: Depende de Claude API (paga) o OpenAI-compatible (paga)

#### Gemma 4 (Prompt Agent)
- Descripcion: Modelo razonamiento previo a generacion (google/gemma-4-31B-it)
- Funcion: Resuelve conocimiento implicito, layout, rendering de texto antes de generar
- Uso: Acompana a HiDream-O1-Image-Dev para refinar prompts


### 18.4 ARQUITECTURA RECOMENDADA — C8L CREATIVE ENGINE

```
+---------------------------------------------------------------+
|                    C8L CREATIVE ENGINE                         |
+---------------------------------------------------------------+
|                                                               |
|  +--------------+     +--------------+     +--------------+  |
|  |  Noval       |     |  Bernini     |     |  FaceFusion  |  |
|  |  (Guiones)   |---->|  (Video)     |     |  (Rostros)   |  |
|  +--------------+     +--------------+     +--------------+  |
|         |                    |                    |            |
|         v                    v                    v            |
|  +--------------+     +--------------+     +--------------+  |
|  |  HiDream-O1  |     |  FLUX.2      |     |  AlphaFace   |  |
|  |  (Imagen)    |     |  (Imagen)    |     |  (Rostros)   |  |
|  +--------------+     +--------------+     +--------------+  |
|                                                               |
+---------------------------------------------------------------+
```

### 18.5 FLUJO DE TRABAJO RECOMENDADO

1. Escribir guion/idea -> Noval genera estructura y personajes
2. Generar imagenes de referencia -> FLUX.2 (rapido) o HiDream-O1 (calidad)
3. Crear rostros consistentes -> AlphaFace o FaceFusion
4. Generar video -> Bernini (edicion/referencia) o Mona (larga duracion)

### 18.6 TABLA COMPARATIVA DE LIMITACIONES

| Herramienta | Limitacion Clave |
|-------------|-----------------|
| Bernini | Necesita GPU H100; planificador MLLM 7B no open-source |
| Mona | Proyecto reciente; requiere alta VRAM |
| FLUX.2 [klein] | Version 9B solo uso no comercial |
| HiDream-O1 | Version Dev open-source; full puede tener restricciones |
| AlphaFace | Requiere VLM para entrenamiento (usuario final usa modelo entrenado) |
| Noval | Depende de Claude API o OpenAI-compatible (ambos de pago) |

### 18.7 PLAN DE IMPLEMENTACION PARA C8L

#### Fase 1: Fundacion (1-2 semanas)
- Configurar FaceFusion en ComfyUI para swap de rostros local
- Probar FLUX.2 [klein] con Diffusers para generacion de imagenes

#### Fase 2: Video (2-3 semanas)
- Instalar Bernini-R (version int4 para mas ligera)
- Configurar pipeline T2V y V2V

#### Fase 3: Guiones + Largo Formato (3-4 semanas)
- Desplegar Noval (Node.js + API key)
- Explorar Mona para experimentos de video largo

---

**FIN DEL DOCUMENTO**
**Generado por Kiro AI para C8L Agency — 24 Junio 2026**
**github.com/leovela69/c8l-bot-server**
