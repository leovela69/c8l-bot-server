# 🦁 C8L CASINO — Proyecto 4 (Repositorio Independiente)

> **NOTA:** Este documento es una referencia. El código del casino vive en su propio repo: `c8lcasino`
> Siguiendo la regla de separación de proyectos de Leo.

## Resumen del Proyecto

C8L Casino es el Proyecto 4 del ecosistema — una plataforma de gaming con 36+ juegos exclusivos que se integra con la economía del bot-server existente.

## Integración con bot-server

El casino consume estos endpoints ya existentes:

| Endpoint | Función |
|----------|---------|
| `POST /api/casino/buy-chips` | Comprar fichas con coins |
| `POST /api/casino/result` | Registrar resultado de juego |
| `GET /api/balance/:user_id` | Obtener wallet |
| `POST /api/daily-bonus/:user_id` | Bonus diario |
| `GET /api/plans` | Planes de suscripción |

## Endpoints NUEVOS necesarios en bot-server (Fase 2)

```python
# Ajedrez Arena
POST /api/casino/chess/challenge    # Crear desafío
POST /api/casino/chess/accept/:id   # Aceptar desafío  
POST /api/casino/chess/move         # Hacer movimiento
POST /api/casino/chess/spectator-bet # Apuesta espectador
GET  /api/casino/chess/arena        # Partidas activas
GET  /api/casino/chess/leaderboard  # Rankings

# Apuestas en Vivo
GET  /api/casino/live-events        # Eventos activos
POST /api/casino/live-bet           # Apostar en evento
GET  /api/casino/live-news/:id      # Feed noticias evento
WS   /ws/live-odds                  # Odds en tiempo real
WS   /ws/chess/:match_id            # Partida en vivo
```

## Stack del Casino

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Deploy:** Vercel (independiente)
- **Backend:** Consume API de este bot-server
- **DB:** Misma instancia Supabase (tablas nuevas)

## Relación con planes existentes

| Plan | casino_daily_spins | Beneficio Casino |
|------|-------------------|------------------|
| Free | 3 | Acceso básico |
| Normal | 10 | +2% cashback |
| Crew | 30 | Mesa de bando, +5% |
| Premium | 50 | VIP tables, +10% |
| Lifetime | 999 | Todo ilimitado, +12% |

## Documentación Completa

Ver el README.md completo del proyecto c8lcasino para:
- Arquitectura técnica detallada
- Los 36 juegos con RTP y mecánicas
- Diseño de base de datos
- API completa con ejemplos
- Roadmap por fases
- Sistema de seguridad Provably Fair
