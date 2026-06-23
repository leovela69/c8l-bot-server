import { NextRequest, NextResponse } from 'next/server'
import { publishToTV } from '@/lib/firebase'

// Secret para que solo el bot pueda publicar
const BOT_SECRET = "c8l-bot-panteon-2024-oficial"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Verificar que es el bot (token secreto)
    if (body.secret !== BOT_SECRET) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Validar campos requeridos
    if (!body.title || !body.type) {
      return NextResponse.json({ error: 'Faltan campos: title, type' }, { status: 400 })
    }

    // Publicar en Firestore
    const postId = await publishToTV({
      title: body.title,
      description: body.description || '',
      type: body.type, // 'video' | 'music' | 'live' | 'tutorial' | 'gaming'
      emoji: body.emoji || '📺',
      author: '@leon_leo_bot',
      authorBadge: 'oficial',
      videoUrl: body.videoUrl || '',
      thumbnailUrl: body.thumbnailUrl || '',
    })

    return NextResponse.json({
      success: true,
      postId,
      message: `Contenido publicado en C8L TV: ${body.title}`
    })

  } catch (error: any) {
    console.error('Error publicando en TV:', error)
    return NextResponse.json({
      error: 'Error interno',
      detail: error.message
    }, { status: 500 })
  }
}

// GET — obtener feed de TV (público)
export async function GET() {
  try {
    const { getTVFeed } = await import('@/lib/firebase')
    const posts = await getTVFeed(20)
    return NextResponse.json({ posts })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
