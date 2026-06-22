# 🔄 Tareas Automatizadas (Cron Jobs)

## Activas (v17.0)

| Cron | Frecuencia | Bot | Comando |
|------|-----------|-----|---------|
| `*/5 * * * *` | Cada 5 min | Aries | Monitorear web |
| `0 */6 * * *` | Cada 6 horas | Vulcano | Generar canción |
| `0 8 * * *` | Diario 8:00 AM | Minerva | Investigar tendencias |

## Nuevas (Expansión v2.0)

| Cron | Frecuencia | Bot | Comando |
|------|-----------|-----|---------|
| `0 */12 * * *` | Cada 12 horas | Apolo | Producir track completo |
| `0 10 * * *` | Diario 10:00 AM | Ares | Generar videoclip |
| `0 */8 * * *` | Cada 8 horas | Hefesto | Crear assets visuales |
| `0 */4 * * *` | Cada 4 horas | Artemisa | Publicar en redes |
| `0 6 * * *` | Diario 6:00 AM | Atenea | Analizar métricas |
| `0 3 * * *` | Diario 3:00 AM | Estia | Backup y limpieza |

## Crontab completo

```cron
# === PANTEÓN MASTER v17.0 - ORIGINAL ===
*/5 * * * * hermes run c8l/aries --input "Monitorear web de C8L"
0 */6 * * * hermes run c8l/vulcano --input "Genera una canción Bolero-House sobre un tema aleatorio"
0 8 * * * hermes run c8l/minerva --input "Investiga tendencias actuales de música generada por IA"

# === PANTEÓN MASTER v2.0 - EXPANSIÓN ===
0 */12 * * * hermes run c8l/apolo --input "Produce un track Bolero-House completo"
0 10 * * * hermes run c8l/ares --input "Genera concepto de visualizer para el último track"
0 */8 * * * hermes run c8l/hefesto --input "Crea portada y post de Instagram para contenido reciente"
0 */4 * * * hermes run c8l/artemisa --input "Publica contenido reciente en redes sociales"
0 6 * * * hermes run c8l/atenea --input "Analiza métricas y genera reporte con recomendaciones"
0 3 * * * hermes run c8l/estia --input "Backup completo, verificar salud y limpiar logs antiguos"
```

## Cómo instalar

```bash
docker exec -it hermes-agent-b5i7-hermes-agent-1 bash
crontab -e
# Pegar el crontab de arriba
# Guardar y salir
crontab -l  # Verificar
```
