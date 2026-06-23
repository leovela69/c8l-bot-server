import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'C8L Agency | Corazones Locos Family',
  description: 'Plataforma de entretenimiento, musica y comunidad. Casino, Estudio Musical, Karaoke, Lives, Bandos.',
  keywords: ['C8L Agency', 'Corazones Locos', 'Casino', 'Musica IA', 'Comunidad', 'Bolero-House'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-c8l-black text-white antialiased">{children}</body>
    </html>
  )
}
