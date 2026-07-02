// components/ui/AgeWarningBanner.tsx
'use client';
import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function AgeWarningBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedFlag = localStorage.getItem('age_warning_dismissed');
    if (dismissedFlag) setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('age_warning_dismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-red-600 text-white p-3 shadow-lg flex justify-between items-center">
      <div className="flex items-center gap-2">
        <AlertTriangle size={20} />
        <span className="text-sm font-bold">🔞 SOLO MAYORES DE 18 AÑOS</span>
        <span className="text-xs">Este sitio contiene interacción social, juegos y economía virtual. Verificamos tu edad.</span>
      </div>
      <button onClick={handleDismiss} className="p-1 hover:bg-red-700 rounded">
        <X size={18} />
      </button>
    </div>
  );
}