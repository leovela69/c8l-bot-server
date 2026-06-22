'use client';
import { useState } from 'react';
import { LegalFooter } from '@/components/legal/LegalFooter';
import { AgeGate } from '@/components/security/AgeGate';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [ageVerified, setAgeVerified] = useState(false);

  return (
    <html lang="es">
      <head>
        <title>C8L Agency — Plataforma de Entretenimiento y Música</title>
        <meta name="description" content="C8L Agency - Casino, Música Bolero-House, TV, Comunidad" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-black text-white min-h-screen flex flex-col font-body">
        <AgeGate onVerified={() => setAgeVerified(true)} />
        {ageVerified && (
          <>
            <main className="flex-1">{children}</main>
            <LegalFooter />
          </>
        )}
      </body>
    </html>
  );
}
