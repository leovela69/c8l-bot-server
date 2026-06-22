# 📌 CONTEXTO PARA LA SIGUIENTE IA

> Este documento es para que cualquier IA nueva entienda el proyecto completo y pueda continuar el trabajo.

---

## ¿Quién es el usuario?

- **Nombre:** Leo Vela
- **GitHub:** leovela69
- **Proyecto:** C8L Agency (producción musical Bolero-House + gaming)
- **Nivel técnico:** No técnico. No puede hacer merge de PRs, configurar env vars, ni navegar GitHub fácilmente.
- **Preferencia:** Que todo funcione sin configuración manual. Hardcodear credenciales si es posible.
- **Estilo de trabajo:** Sesiones largas (24h+). Se frustra con procesos repetitivos.
- **Comunicación:** Necesita instrucciones paso a paso.

---

## ¿Qué es este proyecto?

**C8L AGENT v17.0 "PANTEÓN MASTER"** es un ecosistema de agentes de IA autónomos que:
1. Crean música Bolero-House automáticamente
2. Investigan tendencias de música IA
3. Generan contenido visual (portadas, videos, posts)
4. Publican en redes sociales
5. Monitorean y mantienen la web de C8L
6. Planifican la estrategia del proyecto

---

## ¿Dónde está todo?

| Qué | Dónde |
|-----|-------|
| **Código/Skills** | Dentro del contenedor Docker en Hostinger VPS |
| **Documentación** | Este repo (github.com/leovela69/c8l-bot-server/panteon-master/) |
| **Servidor** | srv1774129.hstgr.cloud (Hostinger) |
| **Bot Telegram** | @LeoVelaBot |
| **Web C8L** | gen-lang-client-0744582882.web.app |
| **Repo viejo** | leovela69/leovelabot-dual (DEPRECATED, IGNORAR) |
| **Render.com** | Puede tener servicios viejos (SUSPENDER) |

---

## ¿Qué está funcionando ahora?

### ✅ Operativo (v17.0 original)
- Hermes Agent corriendo en Docker
- Telegram Gateway conectado
- Zeus (orquestador)
- Minerva (investigación, cada 24h)
- Vulcano (música, cada 6h)
- Aries (vigilancia web, cada 5min)

### 🆕 Diseñado y documentado (Expansión v2.0)
- Apolo (producción musical avanzada)
- Ares (video/audiovisual)
- Hefesto (diseño gráfico)
- Artemisa (redes sociales)
- Atenea (estrategia/analytics)
- Estia (mantenimiento/backups)

---

## ¿Qué sigue?

1. **Instalar los 6 bots nuevos** en el servidor (seguir INSTALL.md)
2. **Activar los cron jobs nuevos** para automatización
3. **Conectar APIs externas** (redes sociales, streaming platforms)
4. **Panel de control web** para monitorizar todo visualmente
5. **Sistema de monetización** (distribución en plataformas)

---

## Reglas importantes

1. **TODO se ejecuta en la nube** — Leo no tiene entorno local
2. **Keys hardcodeadas** — no usar variables de entorno
3. **No pedir que haga merge** — hacerlo todo automáticamente o dar instrucciones EXACTAS
4. **Mantener simple** — menos archivos = mejor
5. **Guardar contexto** — al final de cada sesión, guardar estado
6. **Render.com** — si hay conflictos con el bot, suspender servicios ahí
7. **Token de Telegram** — puede estar duplicado en otro servicio, verificar siempre

---

## Problema conocido: Conflicto de tokens

Si el bot @LeoVelaBot no responde o da respuestas que no coinciden con el código:
- **Causa:** Hay OTRO servicio corriendo con el mismo token de Telegram
- **Evidencia:** Mensajes de "⚡ Entendido. Trabajando..." + "Bolero-House" que NO son de nuestro código
- **Solución:** Suspender el servicio viejo en Render.com (probablemente `leovelabot-dual`)
- **Solo debe haber UN servicio** usando ese token (el de Hostinger)

---

## Stack tecnológico

| Componente | Tecnología |
|-----------|-----------|
| Motor de agentes | Hermes Agent (Docker) |
| Hosting | Hostinger VPS |
| Bot interface | Telegram (pyTelegramBotAPI) |
| IA principal | Modelo interno de Hermes |
| IA secundaria | Gemini 3.5 Flash (bot Telegram directo) |
| Generación música | songwriting-and-ai-music, inference.sh |
| Generación video | hyperframes |
| Memoria | honcho (cross-session) |
| Investigación | researcher skill |
| Programación | Cron jobs del sistema |

---

*Actualizado: 22 de junio de 2026*
