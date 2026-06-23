# C8L Agency — Especificaciones Tecnicas Backend

## Arquitectura General

```
Frontend (Next.js) → API Gateway (JWT) → Microservicios → BD (Supabase/PostgreSQL)
```

## Servicios

| Servicio | Funcion |
|----------|---------|
| IA Service | Stockfish WASM + evaluacion |
| Game Service | Logica partidas, movimientos |
| Bando Service | Creacion, jerarquias, guerras |
| Monetization | Monedas, pagos, suscripciones |
| Ranking Service | ELO, clasificaciones, temporadas |
| Analytics | Estadisticas, eventos, reportes |
| Assets Service | Skins, avatares, efectos |
| Notification | Push, emails, chat tiempo real |

## Sistema ELO

```javascript
function calculateElo(ratingA, ratingB, result, kFactor = 32) {
    const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
    const newRatingA = ratingA + kFactor * (result - expectedA);
    const newRatingB = ratingB + kFactor * ((1 - result) - (1 - expectedA));
    return { newRatingA: Math.round(newRatingA), newRatingB: Math.round(newRatingB) };
}
```

## Puntos de Bando (Guerras)

- Victoria: +25 pts
- Empate: +10 pts
- Derrota: +5 pts (consuelo)
- Bonus ELO alto (>2000): +5
- Bonus ELO muy alto (>2500): +10
- Bonus racha >5: +5
- Bonus vencer ELO superior: +10

## API Endpoints Principales

### Auth
- POST /api/auth/register
- POST /api/auth/login (JWT)
- POST /api/auth/verify-age

### Bandos
- POST /api/factions (crear, 500 C8L)
- GET /api/factions (listar)
- POST /api/factions/:id/join
- PUT /api/factions/:id/members/:userId (asignar pieza)
- POST /api/factions/:id/war (desafiar)

### Partidas
- POST /api/games (nueva)
- PUT /api/games/:id/move
- WS /ws/live/:gameId (espectadores)

### Economia
- GET /api/wallet/:userId
- POST /api/store/buy
- POST /api/payments/create (Stripe)

### Ranking
- GET /api/rankings/global
- GET /api/rankings/factions
- GET /api/rankings/season

## Stack Tecnologico (Objetivo)

| Capa | Tech |
|------|------|
| Frontend | Next.js 14 + Tailwind |
| Backend | Node.js + Express |
| DB Principal | PostgreSQL (Supabase) |
| Cache | Redis |
| Logs | MongoDB |
| WebSockets | Socket.io |
| IA | Stockfish WASM + Lc0 |
| Pagos | Stripe + PayPal |
| Hosting | Vercel (web) + Railway (backend) |
| CDN | Cloudflare |
