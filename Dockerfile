# ─────────────────────────────────────────────
# Etapa 1: Builder — instala deps y compila Next.js
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar manifiestos primero para aprovechar el cache de capas
COPY package.json package-lock.json ./

# Instalar todas las dependencias (incluyendo devDependencies para el build)
RUN npm ci

# Copiar el resto del código fuente
COPY . .

# Variables de entorno necesarias en build time (sin secretos)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Compilar la aplicación en modo standalone
RUN npm run build

# ─────────────────────────────────────────────
# Etapa 2: Runner — imagen mínima de producción
# ─────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Crear usuario no-root por seguridad
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Copiar artefactos del standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Ajustar propietario
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Iniciar el servidor standalone de Next.js
CMD ["node", "server.js"]
