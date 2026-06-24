import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'C8L Agency | Corazones Locos Family',
  description: 'Plataforma de entretenimiento, música y comunidad. C8L TV, Estudio Musical IA, Casino, Streaming, Comunidad.',
  keywords: ['C8L Agency', 'Corazones Locos', 'Bolero-House', 'Música IA', 'Streaming', 'Gaming'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-c8l-black text-white antialiased">
        {children}
      </body>
    </html>
  )
}
