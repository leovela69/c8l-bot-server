export const dynamic = 'force-static';
// app/api/generate-video/route.ts (Código simplificado)
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { prompt } = await request.json();

  // 1. Guarda la solicitud en tu base de datos como "Pendiente"
  // 2. Llama a la API de Kling AI con tu clave secreta
  // 3. Recibe un ID de tarea y lo guardas en tu base de datos
  // 4. Le devuelves al usuario un mensaje diciendo "Tu video está en proceso"

  return NextResponse.json({ message: "¡Genial! Tu video está en la cola de creación." });
}