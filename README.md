# 🌐 C.8.L. Agency - Plataforma Web Cyberpunk

Bienvenido al repositorio central de **c.8.l. agency** (Corazones Locos Family), un entorno digital cyberpunk interactivo que fusiona la identidad del streaming, los videojuegos de azar y la inteligencia artificial cuántica.

---

## 🗺️ Mapa de Arquitectura y Árbol de Directorios

A continuación se detalla la arquitectura de directorios de la aplicación Next.js y la ubicación exacta de los módulos clave (Chats, Tokens, Leaderboards, Casino, Estudio de Música e Inteligencia Artificial).

```
C8L_Agency/
│
├── src/
│   ├── app/                      # RUTA DE PÁGINAS (Next.js App Router)
│   │   ├── page.tsx              # Página principal (Secciones Landing & Social Login)
│   │   ├── layout.tsx            # Root Layout (Inyecta efectos visuales e IA flotante)
│   │   ├── globals.css           # Estilos CSS globales, animaciones de Grids y Scanlines
│   │   │
│   │   ├── api/                  # 📡 ENDPOINTS DE API INTERNOS (Next.js App Router)
│   │   │   └── lyrics/generate/  
│   │   │       └── route.ts      # Endpoint /api/lyrics/generate con negative prompting w_e
│   │   │
│   │   ├── community/            # 💬 MÓDULO DE COMUNIDAD Y CHATS
│   │   │   └── page.tsx          # Dual-Chat (Public/Hacker) & Ranking de Canciones
│   │   │
│   │   ├── studio/               # 🎛️ ESTUDIO MÚSICAL INTELIGENTE (Suno-Style Workspace)
│   │   │   └── page.tsx          # Editor de letras de neón, prompts de exclusión e IA robot
│   │   │
│   │   ├── casino/               # 🎰 CASINO QUANTUM (Juegos de azar con C8L Coins)
│   │   │   └── page.tsx          # Ruleta, Solitario, Derby Hype y F1 Micro
│   │   │
│   │   └── streamer/             # 📱 PERFILES Y FINANZAS DEL CREADOR
│   │       ├── page.tsx          # Panel de Monetización (Ingresos BI y PK battles)
│   │       ├── profile/          # Tarjeta de identidad Link-in-Bio
│   │       │   └── page.tsx
│   │       └── profile-services/ # Perfil de Servicios completo (Sync Hub, APIs, Wallet)
│   │           ├── page.tsx
│   │           └── profile-services.css
│   │
│   ├── components/               # COMPONENTES REUTILIZABLES
│   │   ├── layout/
│   │   │   ├── Header.tsx        # Navegación y selector de idioma (EN/ES)
│   │   │   └── Footer.tsx
│   │   ├── sections/
│   │   │   ├── SocialLogin.tsx   # Pasarela de autenticación Google/VIP Mock
│   │   │   └── LiveBattleSimulator.tsx  # Simulador interactivo de Batallas PK
│   │   ├── ui/
│   │   │   ├── AIAgentWidget.tsx # 🤖 ASISTENTE IA FLOTANTE (Robot Cyber-Helper)
│   │   │   ├── LionMascot.tsx    # Chibi animado de Vela el León (SVG interactivo)
│   │   │   └── PremiumEffects.tsx# Rejillas digitales animadas y scanline global
│   │   └── casino/               # Lógica interna y renderizado de mini-juegos
│   │
│   ├── context/
│   │   └── AppContext.tsx        # 🪙 SISTEMA DE CRÉDITOS Y TOKENS (Monedero Global)
│   │
│   ├── utils/
│   │   ├── analytics.ts          # Registro de actividades de usuarios y logs
│   │   └── billing.ts            # Libro contable (Ledger) invariable de Stripe/Monedas
│   │
│   └── firebase.ts               # Inicialización y llaves de Firebase Auth/Hosting
│
├── backend/                      # 🎚️ SERVICIO DE BACKEND RECOMENDADO (Music Engine)
│   └── services/
│       └── music-engine/
│           ├── controller.js     # Controlador de Node.js interceptando prompt negativo
│           ├── routes.js         # Rutas de Express /api/lyrics/generate
│           └── service.js        # Servicio de integración con APIs (Suno/MusicGen)
│
├── public/                       # Assets estáticos (imágenes, logos y stems de audio)
│   └── assets/
│       └── stems/                # Canales individuales del mezclador (vocals, drums, bass)
│
├── firebase.json                 # Configuración de despliegue en Firebase Hosting
└── package.json                  # Script de ejecución y dependencias del proyecto
```

---

## 🔎 Ubicación Específica de los Módulos Principales

### 1. 💬 Los Chats (Público y Hacker)
*   **Identificado (Público)**: Localizado en [community/page.tsx](file:///C:/Users/User/Desktop/proyectos/C8L_Agency/src/app/community/page.tsx) en la columna izquierda. Permite comentarios firmados por cuentas reales, soporte para enlaces, e insignias de rango.
*   **Hacker (Anónimo)**: Localizado en la misma página [community/page.tsx](file:///C:/Users/User/Desktop/proyectos/C8L_Agency/src/app/community/page.tsx). Activa un modo terminal hacker con aliases cifrados automáticos y biblioteca cerrada de emoticonos cyberpunk (🎭, 💀, 💾).

### 2. 🪙 El Sistema de Tokens (Coins & Diamonds)
*   Administrado centralizadamente en [AppContext.tsx](file:///C:/Users/User/Desktop/proyectos/C8L_Agency/src/context/AppContext.tsx).
*   **Coins C8L**: Moneda de espectador para casino y regalos en vivo. Recargas simuladas vía Stripe en [RouletteGame](file:///C:/Users/User/Desktop/proyectos/C8L_Agency/src/components/casino/RouletteGame.tsx) o [profile-services](file:///C:/Users/User/Desktop/proyectos/C8L_Agency/src/app/streamer/profile-services/page.tsx).
*   **Diamonds C8L**: Moneda de creador convertible a dinero real (€ EUR/USD). Retiro de fondos simulado con Stripe Connect en [profile-services](file:///C:/Users/User/Desktop/proyectos/C8L_Agency/src/app/streamer/profile-services/page.tsx).

### 3. 🏆 El Ranking y Leaderboard Global
*   Diseñado en [community/page.tsx](file:///C:/Users/User/Desktop/proyectos/C8L_Agency/src/app/community/page.tsx) en la columna derecha. 
*   Implementa la fórmula matemática interactiva de ordenamiento por peso de votos, likes y shares, actualizando las filas mediante animaciones fluidas de reordenamiento de componentes.

### 4. 🎰 El Casino Quantum
*   Ubicado en [casino/page.tsx](file:///C:/Users/User/Desktop/proyectos/C8L_Agency/src/app/casino/page.tsx) con lógica contenida en `src/components/casino/`. Habilita juegos interactivos con apuestas automáticas de Coins.

### 5. 🎛️ El Estudio Músico de IA (Voice Synth)
*   Ubicado en [studio/page.tsx](file:///C:/Users/User/Desktop/proyectos/C8L_Agency/src/app/studio/page.tsx). Incorpora el mezclador multipista, la grabadora de micrófono y la simulación de in-painting por regeneración cuántica de fragmentos.

### 6. 🤖 El Asistente IA Flotante (Robot Cyber-Helper)
*   Componente global inyectado en el Layout: [AIAgentWidget.tsx](file:///C:/Users/User/Desktop/proyectos/C8L_Agency/src/components/ui/AIAgentWidget.tsx).
*   Consiste en un avatar de robot animado flotante que abre una consola holográfica de chat equipada con búfer de memoria dinámica y el mini-juego de firewall Minimax.

---

## 🚀 Instrucciones de Ejecución

### Ejecución en Servidor de Desarrollo Local
Para levantar el servidor web local con soporte reactivo a cambios:
```bash
npm run dev
```
Accede desde tu navegador en: [http://localhost:3000](http://localhost:3000)

### Construcción de Producción
Para compilar la aplicación Next.js y validar errores de tipos:
```bash
npm run build
```

### Despliegue en Firebase Hosting
Para subir los cambios finales al enlace activo en producción:
```bash
npx firebase-tools deploy --only hosting
```
URL Activa en Producción: [https://gen-lang-client-0744582882.web.app](https://gen-lang-client-0744582882.web.app)
