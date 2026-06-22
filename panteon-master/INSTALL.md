# 🚀 Guía de Instalación — PANTEÓN MASTER v2.0 (Expansión)

## Prerrequisitos

- ✅ Servidor con Docker corriendo (Hostinger VPS)
- ✅ Hermes Agent instalado en un contenedor Docker
- ✅ Bot de Telegram creado y conectado (@LeoVelaBot)
- ✅ Zeus, Minerva, Vulcano y Aries ya instalados

---

## Paso 1: Conectar al servidor

```bash
ssh root@srv1774129.hstgr.cloud
docker exec -it hermes-agent-b5i7-hermes-agent-1 bash
```

## Paso 2: Verificar estado actual

```bash
hermes --version
hermes skills list
# Debe mostrar: minerva, vulcano, zeus, aries
```

## Paso 3: Instalar nuevos Skills

### 3.1 Apolo (Música/Producción)
```bash
mkdir -p ~/.hermes/skills/c8l/apolo
cat > ~/.hermes/skills/c8l/apolo/SKILL.md << 'SKILL_EOF'
# [Copiar contenido de skills/apolo/SKILL.md]
SKILL_EOF
hermes skills install c8l/apolo
```

### 3.2 Ares (Video)
```bash
mkdir -p ~/.hermes/skills/c8l/ares
cat > ~/.hermes/skills/c8l/ares/SKILL.md << 'SKILL_EOF'
# [Copiar contenido de skills/ares-video/SKILL.md]
SKILL_EOF
hermes skills install c8l/ares
```

### 3.3 Hefesto (Diseño)
```bash
mkdir -p ~/.hermes/skills/c8l/hefesto
cat > ~/.hermes/skills/c8l/hefesto/SKILL.md << 'SKILL_EOF'
# [Copiar contenido de skills/hefesto/SKILL.md]
SKILL_EOF
hermes skills install c8l/hefesto
```

### 3.4 Artemisa (Redes Sociales)
```bash
mkdir -p ~/.hermes/skills/c8l/artemisa
cat > ~/.hermes/skills/c8l/artemisa/SKILL.md << 'SKILL_EOF'
# [Copiar contenido de skills/artemisa/SKILL.md]
SKILL_EOF
hermes skills install c8l/artemisa
```

### 3.5 Atenea (Estrategia)
```bash
mkdir -p ~/.hermes/skills/c8l/atenea
cat > ~/.hermes/skills/c8l/atenea/SKILL.md << 'SKILL_EOF'
# [Copiar contenido de skills/atenea/SKILL.md]
SKILL_EOF
hermes skills install c8l/atenea
```

### 3.6 Estia (Mantenimiento)
```bash
mkdir -p ~/.hermes/bots/c8l/estia
cat > ~/.hermes/bots/c8l/estia/SKILL.md << 'SKILL_EOF'
# [Copiar contenido de skills/estia/SKILL.md]
SKILL_EOF
hermes skills install c8l/estia
```

## Paso 4: Verificar instalación completa

```bash
hermes skills list
# Debe mostrar: minerva, vulcano, zeus, aries, apolo, ares, hefesto, artemisa, atenea, estia
```

## Paso 5: Configurar Cron Jobs nuevos

```bash
crontab -e
```

Añadir al final del archivo:
```cron
# === PANTEÓN MASTER v2.0 - EXPANSIÓN ===
# Apolo: producir track cada 12 horas
0 */12 * * * hermes run c8l/apolo --input "Produce un track Bolero-House completo"

# Ares: generar videoclip diario a las 10:00 AM
0 10 * * * hermes run c8l/ares --input "Genera concepto de visualizer para el último track"

# Hefesto: crear assets cada 8 horas
0 */8 * * * hermes run c8l/hefesto --input "Crea portada y post de Instagram para contenido reciente"

# Artemisa: publicar cada 4 horas
0 */4 * * * hermes run c8l/artemisa --input "Publica contenido reciente en redes sociales"

# Atenea: análisis diario a las 6:00 AM
0 6 * * * hermes run c8l/atenea --input "Analiza métricas y genera reporte con recomendaciones"

# Estia: backup y limpieza diario a las 3:00 AM
0 3 * * * hermes run c8l/estia --input "Backup completo, verificar salud y limpiar logs antiguos"
```

## Paso 6: Verificar todo

```bash
# Ver cron jobs
crontab -l

# Probar un bot nuevo
hermes run c8l/apolo --input "Produce un track Bolero-House sobre el amanecer"
```

## Paso 7: Probar desde Telegram

Enviar a @LeoVelaBot:
1. `/estado` → Zeus muestra 10 bots activos
2. `/producir amanecer` → Apolo produce
3. `/video noche` → Ares genera
4. `/disenar portada futurista` → Hefesto crea
5. `/publicar nuevo single` → Artemisa publica
6. `/estrategia` → Atenea muestra plan
7. `/salud` → Estia reporta sistema

---

## 🆘 Troubleshooting

| Problema | Solución |
|----------|---------|
| Bot no responde | `hermes gateway telegram` |
| Skill no encontrado | `hermes skills install c8l/[nombre]` |
| Cron no ejecuta | `service cron status` → `service cron start` |
| Docker caído | `docker restart hermes-agent-b5i7-hermes-agent-1` |
| Sin espacio | `hermes run c8l/estia --input "Limpiar sistema"` |
