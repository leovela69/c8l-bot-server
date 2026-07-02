// components/security/AgeWarningBanner.tsx (aparece en todas las páginas si no hay cookie)
'use client';
import { useState, useEffect } from 'react';

export function AgeWarningBanner() {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    try {
      const verified = sessionStorage.getItem('age_verified');
      if (!verified) {
        setShow(true);
      }
    } catch (e) {
      console.error('[C8L AgeWarningBanner] Error reading from sessionStorage:', e);
      setShow(true); // default to show warning if storage fails
    }
  }, []);
  
  if (!show) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-3 text-center z-50 animate-pulse">
      ⚠️ DEBES SER MAYOR DE 18 AÑOS PARA USAR ESTA PLATAFORMA. 
      <button onClick={() => setShow(false)} className="ml-4 underline">Cerrar</button>
    </div>
  );
}