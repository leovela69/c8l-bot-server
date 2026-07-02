// components/ui/AgeVerificationModal.tsx (primer ingreso)
'use client';
import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export function AgeVerificationModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('age_modal_seen');
    if (!hasSeen) {
      setTimeout(() => setShow(true), 2000);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('age_modal_seen', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-900 border-4 border-red-500 p-6 max-w-md text-center">
        <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
        <h2 className="text-xl font-black text-white mb-2">⚠️ ADVERTENCIA ⚠️</h2>
        <p className="text-gray-300 mb-4">
          Esta plataforma es <span className="text-red-400 font-bold">SOLO PARA MAYORES DE 18 AÑOS</span>.
          Contiene interacción social en tiempo real, juegos de azar simulados y transacciones económicas.
          Si eres menor de edad, <span className="text-red-400">ABANDONA INMEDIATAMENTE</span>.
        </p>
        <p className="text-sm text-gray-400 mb-6">
          Verificamos tu edad al registrarte. Los menores detectados serán bloqueados permanentemente.
        </p>
        <button onClick={accept} className="px-6 py-2 bg-red-600 text-white font-bold rounded w-full">
          SOY MAYOR DE 18 AÑOS
        </button>
      </div>
    </div>
  );
}