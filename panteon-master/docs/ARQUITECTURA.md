# 🏛️ Arquitectura del PANTEÓN MASTER

## Jerarquía de Bots

### Nivel 1: Motor
- **Hermes Agent** — Motor de ejecución. Corre en Docker. Gestiona todos los skills y bots.

### Nivel 2: Maestro
- **Zeus** — Bot Maestro. Recibe comandos de Telegram, interpreta la intención del usuario y delega al bot/skill correcto.

### Nivel 3: Skills Maestros
- **Minerva** — Conocimiento. Investiga, analiza, recuerda.
- **Vulcano** — Creación. Genera contenido musical, letras, landing pages.

### Nivel 4: Bots Especializados (Expansión)
- **Apolo** — Música. Composición avanzada, producción, mezcla, mastering, distribución.
- **Ares** — Video. Videoclips, visualizers, edición, publicación.
- **Hefesto** — Diseño. Portadas, logos, branding, assets gráficos.
- **Artemisa** — Redes. Publicación programada, engagement, crecimiento orgánico.
- **Atenea** — Estrategia. Planificación, analytics, monetización, roadmap.

### Nivel 5: Bot de Soporte
- **Aries** — Vigilancia. Monitorea la web, detecta errores, repara automáticamente.
- **Estia** — Mantenimiento. Backups, limpieza de logs, salud del sistema.

---

## Flujo de Comunicación

```
Usuario (Telegram) 
    → @LeoVelaBot 
    → Hermes Agent (Gateway)
    → Zeus (interpreta comando)
    → Delega al bot/skill apropiado
    → Respuesta al usuario
```

## Flujo Automático (Cron)

```
Cron Job activado
    → Hermes ejecuta skill directamente
    → Resultado guardado/publicado
    → Notificación a Zeus (opcional)
    → Zeus notifica al usuario si es relevante
```

---

## Principios de Diseño

1. **Autonomía** — Cada bot funciona independientemente
2. **Especialización** — Cada bot tiene UN dominio experto
3. **Escalabilidad** — Añadir nuevos bots no afecta a los existentes
4. **Resiliencia** — Si un bot falla, los demás siguen funcionando
5. **Comunicación** — Zeus coordina pero no es punto único de fallo

---

## Diagrama de Interacción

```
        ┌─────────────────────────────────────────────┐
        │              ZEUS (Orquestador)              │
        │          Recibe → Interpreta → Delega       │
        └─────────┬───────┬────────┬────────┬─────────┘
                  │       │        │        │
         ┌────────▼───┐ ┌─▼──────┐ │  ┌─────▼─────┐
         │  MINERVA   │ │VULCANO │ │  │   ARIES   │
         │Investigar  │ │Crear   │ │  │  Vigilar  │
         └──────┬─────┘ └──┬─────┘ │  └───────────┘
                │           │       │
    ┌───────────▼───────────▼───────▼───────────────┐
    │            BOTS ESPECIALIZADOS                  │
    ├──────────┬──────────┬──────────┬──────────────┤
    │  APOLO   │  ARES    │ HEFESTO  │   ARTEMISA   │
    │ Producir │  Video   │ Diseñar  │   Publicar   │
    └────┬─────┴────┬─────┴────┬─────┴──────┬───────┘
         │          │          │            │
         └──────────┴──────────┴────────────┘
                        │
              ┌─────────▼─────────┐
              │      ATENEA       │
              │   Analizar todo   │
              │   Ajustar rumbo   │
              └─────────┬─────────┘
                        │
              ┌─────────▼─────────┐
              │      ESTIA        │
              │  Mantener limpio  │
              │  Backup + Salud   │
              └───────────────────┘
```
