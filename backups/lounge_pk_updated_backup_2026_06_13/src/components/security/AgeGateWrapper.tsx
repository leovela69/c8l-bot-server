'use client';
import React, { useState, useEffect } from 'react';
import { AgeGate } from './AgeGate';
import { WelcomeModal } from './WelcomeModal';

export function AgeGateWrapper({ children }: { children: React.ReactNode }) {
  // null = aún determinando (evita flash), false = no verificado, true = verificado
  const [ageVerified, setAgeVerified] = useState<boolean | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // Leer estado SOLO en cliente, tras el mount
  useEffect(() => {
    try {
      const local = localStorage.getItem('age_verified');
      const session = sessionStorage.getItem('age_verified');
      setAgeVerified(local === 'true' || session === 'true');
    } catch {
      setAgeVerified(false);
    }
  }, []);

  const handleVerified = () => {
    try { localStorage.setItem('age_verified', 'true'); } catch (_) {}
    try { sessionStorage.setItem('age_verified', 'true'); } catch (_) {}
    setAgeVerified(true);

    // Comprobar si hay sesión real en localStorage (sin depender del contexto)
    // para decidir si mostramos el WelcomeModal
    try {
      const isLoggedReal = localStorage.getItem('c8l_logged') === 'true';
      const isMock = localStorage.getItem('c8l_logged_mock') === 'true';
      // Si es solo mock (no real Google login), mostrar el welcome
      if (!isLoggedReal || isMock) {
        setShowWelcome(true);
      }
    } catch {
      setShowWelcome(true);
    }
  };

  return (
    <>
      {/* Contenido siempre presente (SSR safe) */}
      {children}

      {/* AgeGate: overlay cuando confirmamos que NO hay verificación */}
      {ageVerified === false && (
        <AgeGate onVerified={handleVerified} />
      )}

      {/* WelcomeModal: tras verificar edad, si no hay sesión real */}
      {showWelcome && ageVerified === true && (
        <WelcomeModal onClose={() => setShowWelcome(false)} />
      )}
    </>
  );
}
