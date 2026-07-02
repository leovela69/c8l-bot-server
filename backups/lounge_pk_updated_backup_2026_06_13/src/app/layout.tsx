import React from 'react';
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import { AppProvider } from '@/context/AppContext';
import { AgeGateWrapper } from '@/components/security/AgeGateWrapper';
import { LegalFooter } from '@/components/security/LegalFooter';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import './globals.css';
import './streamer/profile-services/profile-services.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: 'C8L Agency — Música, Lounge & Entretenimiento Virtual',
  description: 'Plataforma de entretenimiento musical con sala virtual Quantum Lounge, C8L TV, Casino Social y Estudio IA.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${outfit.variable} bg-black text-white`}>
        <AppProvider>
          <AgeGateWrapper>
            <Header />
            <main className="flex-grow w-full relative">{children}</main>
            <Footer />
            <LegalFooter />
          </AgeGateWrapper>
        </AppProvider>
      </body>
    </html>
  );
}
