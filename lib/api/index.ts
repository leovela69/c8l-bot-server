/**
 * C8L API — Exportacion central
 * 
 * ARQUITECTURA DE CONEXION:
 * ┌──────────────────┐         ┌──────────────────────┐
 * │  FRONTEND (Web)  │         │   BACKEND (Bot/API)  │
 * │  Vercel (FREE)   │ ──────► │   Render.com (FREE)  │
 * │  Next.js Static  │         │   Python + Telegram  │
 * │                  │         │                      │
 * │  c8l-agency      │  HTTPS  │  c8l-bot-server      │
 * │  .vercel.app     │ ◄────── │  .onrender.com       │
 * └──────────────────┘         └──────────────────────┘
 * 
 * FLUJO:
 * 1. Usuario abre web en Vercel
 * 2. Frontend hace fetch() a /api/* (proxy via vercel.json rewrites)
 * 3. Vercel redirige a https://c8l-bot-server.onrender.com/api/*
 * 4. Backend procesa y responde con CORS headers
 * 5. Frontend muestra resultado
 * 
 * NOTA: El backend tambien recibe mensajes de Telegram/WhatsApp
 *       directamente via webhooks, sin pasar por Vercel.
 */

// Client functions (para usar en cualquier componente)
export {
  checkHealth,
  generateMusic,
  getMusicFeed,
  getSunoCredits,
  generateImage,
  generateVideo,
  chatWithBot,
  getSystemStatus,
  API_BASE_URL,
} from './client'

// React Hooks (para usar en componentes 'use client')
export {
  useHealth,
  useMusicGeneration,
  useMusicFeed,
  useCredits,
  useImageGeneration,
  useVideoGeneration,
  useChatBot,
  useSystemStatus,
} from './hooks'
