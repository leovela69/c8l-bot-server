# MAPA COMPLETO DEL PROYECTO C8L — Sesion 25 Junio 2026

## PARA: Antigravity (Claude Code) + Bots (Hermes, Leon_leo_bot)
## AUTOR: Kiro + Leo Vela
## FECHA: 25 Junio 2026, sesion de 8+ horas

---

## 1. REPOSITORIO

- **URL**: github.com/leovela69/c8l-bot-server
- **Rama**: main
- **Ultimo commit**: 74ef3de (Knowledge Base de errores)
- **VPS**: Hostinger Ubuntu 24.04, root@srv1774129

---

## 2. ARQUITECTURA DEL SISTEMA

```
USUARIO (Telegram)
    |
    v
BOT 1: @leon_leo_bot (PANTEON MASTER v17)
    |   - 11 agentes especializados
    |   - Motor: Groq (Llama 3.3 70B) GRATIS
    |   - Corre en VPS directamente (NO Render)
    |   - Archivo: ~/c8l-bot-server/whatsapp_bot.py
    |
    v
BOT 2: @hermes_c8l_bot (Hermes v2.0)
    |   - Backup de Bot 1 (si se cae, toma control)
    |   - API HTTP puerto 8081 (para la web)
    |   - Moderacion, imagenes, chat, premium, contabilidad
    |   - Corre en VPS: ~/c8l-bot-server/hermes/hermes_bot.py
    |
    v
WEB: https://gen-lang-client-0744582882.web.app
        - Next.js 14 + React 18 + Tailwind
        - Deploy: Firebase Hosting
        - Build: npx next build (static export)
```

---

## 3. TOKENS Y KEYS

| Servicio | Key | Estado |
|----------|-----|--------|
| Telegram Bot 1 | (en config.py splitada) | ACTIVO |
| Telegram Hermes | (en hermes/config.py) | ACTIVO |
| Groq (MOTOR PRINCIPAL) | (en config.py splitada) | ACTIVO |
| OpenRouter | (en config.py splitada) | SIN CREDITO |
| Gemini | (en config.py splitada) | SIN CREDITO |
| Pollinations (imagenes) | NO NECESITA KEY (gratis) | FUNCIONA |
| Pollinations (video) | (en config.py) | SIN CREDITO |
| HuggingFace | (en config.py splitada) | DNS NO RESUELVE |
| NVIDIA | (en config.py) | TIMEOUT |
| Admin ID | 1970956749 | Leo Vela |
| Grupo | -1002476372487 | C8L Community |

---

## 4. MODELOS IA ACTIVOS

| Agente | Modelo | Proveedor |
|--------|--------|-----------|
| Zeus, Minerva, Vulcano | llama-3.3-70b-versatile | Groq (gratis) |
| Hermes, Apolo, Ares | llama-3.3-70b-versatile | Groq |
| Hefesto, Artemisa, Atenea | llama-3.3-70b-versatile | Groq |
| Aries, Estia (ligeros) | gemma2-9b-it | Groq |
| Fallback | mixtral-8x7b-32768 | Groq |

---

## 5. ARCHIVOS CLAVE

### Bot Principal (leon_leo_bot):
```
whatsapp_bot.py          — Bot principal, handlers, dispatch
config.py                — TODAS las keys y configuracion
openrouter_client.py     — Cliente IA (Groq primero, OpenRouter backup, NVIDIA backup)
pantheon/zeus.py         — Director/Orquestador
pantheon/minerva.py      — Sabio/Conocimiento
pantheon/vulcano.py      — Artesano/Creacion
pantheon/slaves/apolo.py — Musica
pantheon/slaves/ares.py  — Video/Cine
pantheon/slaves/atenea.py — Estrategia/SEO
pantheon/slaves/artemisa.py — Backend/API
pantheon/slaves/hefesto.py — Diseno/Frontend
pantheon/slaves/aries.py — Seguridad
pantheon/slaves/hermes_bot.py — Comunicacion
pantheon/slaves/estia.py — Memoria/Aprendizaje
pantheon/video_engine.py — Motor multi-video (Pollinations)
pantheon/mixture/core.py — Mixture of Agents (multi-modelo)
pantheon/workers/       — Workers para code agent
pantheon/security.py    — Lista blanca de comandos
```

### Hermes (backup + API web):
```
hermes/hermes_bot.py           — Bot Hermes principal
hermes/config.py               — Config separada
hermes/modules/ai_chat.py      — Chat IA con Groq
hermes/modules/images.py       — Generacion imagenes
hermes/modules/moderation.py   — Antispam/moderacion
hermes/modules/scheduler.py    — Auto-publicacion + recordatorios
hermes/modules/health_monitor.py — Vigila a Bot 1 (ping cada 2min)
hermes/modules/premium.py      — Sistema codigos invitacion
hermes/modules/apolo.py        — Contabilidad (IVA, facturas, CSV)
hermes/modules/guardian.py     — Proteccion: solo Leo manda
hermes/modules/api_server.py   — API HTTP puerto 8081 para la web
```

### Web (Next.js):
```
app/page.tsx             — Pagina principal (Mesa Creacion Cuantica)
app/layout.tsx           — Layout global con Providers + AuthGate
app/providers.tsx        — AuthProvider
components/auth/AuthGate.tsx — Verificacion edad global
components/auth/AgeGate.tsx  — Pantalla verificacion edad
lib/auth/context.tsx     — Contexto autenticacion
lib/firebase/config.ts   — Credenciales Firebase + admin
firebase.json            — Config hosting (SIN rewrites)
next.config.js           — output: export, images unoptimized
```

### Knowledge Base:
```
data/knowledge/errores_soluciones.json — 8 errores documentados con soluciones
```

---

## 6. ERRORES RESUELTOS EN ESTA SESION

| # | Error | Causa | Solucion |
|---|-------|-------|----------|
| 1 | Bot no responde, Error 409 | DOS instancias corriendo (VPS + /opt/c8l-bot/) | Matar duplicado, desactivar supervisor |
| 2 | OpenRouter 404 en todos modelos | Key sin credito, modelos free requieren saldo | Migrar a Groq (100% gratis) |
| 3 | Modelo deepseek-v4-flash no existe | Nombre incorrecto, no existe en OpenRouter | Usar deepseek-chat-v3-0324 (o Groq) |
| 4 | PDF corrupto (no se abre) | Palabras >50 chars sin espacios rompen fpdf2 | Regex para cortar + fallback PDF minimo |
| 5 | Pollinations video 401/402 | Key expirada para video | Fallback a guion cinematografico |
| 6 | Puerto 8080 ocupado | Bot principal ya lo usa | Hermes usa 8081 (API) y 8082 (health) |
| 7 | HuggingFace no accesible | DNS no resuelve desde VPS Hostinger | No usar HF, alternativa Groq |
| 8 | Gemini 429 quota | Key AQ.Ab8 sin creditos prepaid | No depender de Gemini, usar Groq |

---

## 7. LO QUE FUNCIONA AHORA

| Comando | Estado | Motor |
|---------|--------|-------|
| /crear_musica | OK | Groq (Apolo) |
| /crear_articulo | OK | Groq (Atenea) |
| /crear_api | OK | Groq (Artemisa) |
| /crear_video | OK (guion, no video real) | Groq (Ares) |
| /crear_imagen | OK | Pollinations (gratis) |
| /crear_landing | OK | Groq (Hefesto) |
| /diagnosticar | OK | Aries (requests) |
| /estado | OK | Local |
| /informe | OK | Estia |
| Chat directo | OK | Groq (Hermes) |

---

## 8. LO QUE FALTA POR IMPLEMENTAR

| # | Tarea | Prioridad |
|---|-------|-----------|
| 1 | Evolution Engine (auto-programacion con permiso) | ALTA |
| 2 | Conectar web al API de Hermes (puerto 8081) | ALTA |
| 3 | Sistema premium funcional en web | MEDIA |
| 4 | Apolo (contabilidad) integrado con la web | MEDIA |
| 5 | Diseño web Mesa Creacion Cuantica (deploy correcto) | MEDIA |
| 6 | Video real (necesita key Pollinations con saldo) | BAJA |
| 7 | Migrar Mixture of Agents al bot principal | BAJA |

---

## 9. COMANDOS PARA OPERAR EL VPS

```bash
# Arrancar Bot 1:
cd ~/c8l-bot-server && nohup python3 whatsapp_bot.py > bot1.log 2>&1 &

# Arrancar Hermes:
cd ~/c8l-bot-server/hermes && PORT=8082 nohup python3 hermes_bot.py > hermes.log 2>&1 &

# Reiniciar Bot 1 (matar viejo + pull + arrancar):
pkill -9 -f whatsapp_bot.py; cd ~/c8l-bot-server && git pull && nohup python3 whatsapp_bot.py > bot1.log 2>&1 &

# Reiniciar Hermes:
pkill -9 -f hermes_bot.py; cd ~/c8l-bot-server/hermes && git pull && PORT=8082 nohup python3 hermes_bot.py > hermes.log 2>&1 &

# Ver logs:
tail -20 ~/c8l-bot-server/bot1.log
tail -20 ~/c8l-bot-server/hermes/hermes.log

# Verificar procesos:
ps aux | grep python | grep -v grep

# Deploy web:
cd ~/c8l-bot-server && npx next build && npx firebase deploy --only hosting

# NUNCA hacer:
# - supervisorctl start (desactivado)
# - Lanzar dos instancias del mismo bot
# - Usar /opt/c8l-bot/ (version vieja, ignorar)
```

---

## 10. REGLAS PARA LOS BOTS (auto-evolucion)

1. **APRENDER SIEMPRE**: cada error, cada feedback, cada solucion se registra
2. **AUTO-REPAIR sin permiso**: si el error esta en knowledge base, arreglarlo solo
3. **AUTO-MEJORA sin permiso**: optimizar respuestas basado en feedback
4. **NUEVAS FUNCIONES CON PERMISO**: enviar propuesta a Leo (Admin ID 1970956749), esperar aprobacion
5. **BACKUP ANTES DE CAMBIAR**: siempre git commit antes de modificar codigo
6. **NUNCA borrar**: no borrar archivos, no rm -rf, no reset --hard
7. **Hermes vigila**: si Bot 1 se cae, Hermes toma control y avisa a Leo

---

## 11. CREDENCIALES ADMIN WEB

- **Panel Control**: /control
- **User**: leovela
- **Pass**: C8L_Admin_2026!
- **Bot Panel**: c8l_bot / Bot_Panteon_Master!
- **Guardian Pass (apagar bot)**: C8L_ZEUS_2026

---

## FIN DEL MAPA — Sesion 25 Jun 2026
## Proximo paso: Evolution Engine + integrar web con API Hermes
