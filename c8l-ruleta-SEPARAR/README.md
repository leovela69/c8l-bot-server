# C8L Ruleta - Casino Premium

## IMPORTANTE: ESTE CODIGO ES TEMPORAL AQUI

Este código debe moverse a su propio repo `c8l-ruleta` separado.
Está aquí temporalmente porque Kiro no puede crear repos nuevos en GitHub.

## Para separarlo en su propio repo:

1. Crea un repo nuevo vacío en GitHub: `c8l-ruleta`
2. Clona este repo y copia la carpeta `c8l-ruleta-SEPARAR/` a tu PC
3. Entra a la carpeta y ejecuta:
   ```bash
   cd c8l-ruleta-SEPARAR
   git init
   git add .
   git commit -m "feat: Ruleta Europea premium"
   git remote add origin https://github.com/leovela69/c8l-ruleta.git
   git push -u origin main
   ```
4. Elimina esta carpeta del repo c8l-bot-server

## O más fácil - desde GitHub:
1. Crea repo `c8l-ruleta` vacío
2. Sube estos archivos directamente desde la interfaz web de GitHub

---

## Stack
- Next.js 14 + TypeScript + Tailwind CSS
- Zustand (estado persistente)
- Canvas API (ruleta animada)
- Deploy: Vercel

## Para correr local:
```bash
npm install
npm run dev
```

## Características:
- Ruleta Europea (37 números) con animación Canvas
- Tapete de apuestas completo (pleno, docenas, columnas, rojo/negro, par/impar)
- Economía: saldo 152K, mín 50, máx 5000
- Bono diario +25K, recuperación bancarrota cada 1h
- Historial de últimos números
- Look premium: fieltro verde, bordes dorados, cristal ahumado
- API backend: /api/game/spin y /api/game/bonus
