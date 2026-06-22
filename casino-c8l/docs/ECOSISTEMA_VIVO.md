# 🚀 C8L AGENT v18.0 — "ECOSISTEMA VIVO"

## 📊 Arquitectura del Bot Usuario

```mermaid
graph TD
    A[🤖 Bot Principal "C8L Guardian"] --> B[🎮 Generador de Contenido]
    A --> C[🎰 Jugador de Casino]
    A --> D[🕵️ Detector de Errores]
    A --> E[🔧 Reparador Automático]
    A --> F[📊 Analista de Datos]
    
    B --> B1[Sube Covers]
    B --> B2[Sube Videos]
    B --> B3[Hace Lives]
    B --> B4[Participa en Retos]
    B --> B5[Comenta y Da Likes]
    
    C --> C1[Juega Slots]
    C --> C2[Juega Ruleta]
    C --> C3[Juega Blackjack]
    C --> C4[Apuesta en Duelos]
    
    D --> D1[Detecta Errores 404]
    D --> D2[Detecta Latencias]
    D --> D3[Detecta Bugs UI]
    D --> D4[Detecta Caídas]
    
    E --> E1[Repara CSS]
    E --> E2[Repara Enlaces]
    E --> E3[Reinicia Servicios]
    E --> E4[Limpia Caché]
    
    F --> F1[Reporte Diario]
    F --> F2[Alertas Críticas]
    F --> F3[Propuestas de Mejora]
    F --> F4[Análisis de Usuarios]
```

## 🧠 Comportamiento del Bot

### 5 Módulos principales:

| # | Módulo | Función | Frecuencia |
|---|--------|---------|-----------|
| 1 | **Generador de Contenido** | Sube covers, videos, lives, comenta y da likes | Cada 30s |
| 2 | **Jugador de Casino** | Juega slots, ruleta, blackjack, duelos | Cada 10s |
| 3 | **Detector de Errores** | Detecta 404, latencias, bugs UI, caídas | Cada 5s |
| 4 | **Reparador Automático** | Repara CSS, enlaces, reinicia servicios, limpia caché | Auto |
| 5 | **Analista de Datos** | Reportes diarios, alertas críticas, propuestas, análisis | Diario |

### Reglas de auto-reparación:

| Severidad | Acción | Requiere Aprobación |
|-----------|--------|-------------------|
| Low | Auto-repara inmediatamente | ❌ No |
| Medium | Auto-repara con log | ❌ No |
| High | Propone fix, espera aprobación | ✅ Sí |
| Critical | Alerta inmediata + espera aprobación | ✅ Sí |

### Nivel del Bot:

El bot sube de nivel según sus acciones exitosas:
- Cada reparación exitosa: +10 XP
- Cada contenido subido: +5 XP
- Cada error detectado: +3 XP
- Cada sugerencia implementada: +20 XP
- XP para subir: 100 + (nivel * 50)

## 📂 Archivos del sistema:

| Archivo | Función |
|---------|---------|
| `bot/BotUser.tsx` | Panel de control principal del Guardian |
| `bot/BotCasinoPlayer.tsx` | Módulo de juego automático |
| `bot/BotContentCreator.tsx` | Módulo de creación de contenido |
| `sql/bot_user.sql` | SQL completo (6 tablas + 5 funciones RPC + índices) |

## 🗄️ Tablas SQL:

| Tabla | Función |
|-------|---------|
| `bot_profile` | Perfil del bot (nivel, coins, diamonds, xp) |
| `bot_actions` | Log de todas las acciones del bot |
| `bot_detected_errors` | Errores encontrados (con severidad y estado) |
| `bot_suggestions` | Sugerencias de mejora generadas |
| `bot_repairs` | Reparaciones automáticas aplicadas |
| `bot_daily_reports` | Reportes diarios con métricas |

## 🔧 Funciones RPC:

| Función | Descripción |
|---------|------------|
| `bot_log_action()` | Registra cualquier acción del bot |
| `bot_detect_error()` | Detecta + auto-repara si es low/medium |
| `bot_generate_daily_report()` | Genera reporte diario automático |
| `bot_level_up()` | Verifica y sube de nivel al bot |

---

*C8L AGENT v18.0 — 22 de junio de 2026*
