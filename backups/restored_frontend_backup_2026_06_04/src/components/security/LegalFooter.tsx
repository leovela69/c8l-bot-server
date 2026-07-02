// components/security/LegalFooter.tsx
import { AlertTriangle } from 'lucide-react';

export function LegalFooter() {
  return (
    <footer className="bg-black border-t-4 border-[#D4AF37] py-6 px-4 mt-12">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex justify-center gap-6 flex-wrap text-sm text-gray-500 mb-4">
          <a href="/terms" className="hover:text-[#D4AF37] transition">Términos de Uso</a>
          <a href="/privacy" className="hover:text-[#D4AF37] transition">Privacidad</a>
          <a href="/cookies" className="hover:text-[#D4AF37] transition">Cookies</a>
          <a href="/contact" className="hover:text-[#D4AF37] transition">Contacto</a>
        </div>
        
        {/* ⚠️ AVISO DE EDAD MUY VISIBLE */}
        <div className="bg-red-600/10 border border-red-600 rounded-lg p-3 max-w-xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-red-400 text-sm font-bold">
            <AlertTriangle size={18} />
            <span>🔞 PLATAFORMA EXCLUSIVA PARA MAYORES DE 18 AÑOS</span>
            <AlertTriangle size={18} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            C8L Agency no permite el acceso a menores de edad. La verificación de edad es obligatoria.
            Reportaremos cualquier intento de acceso fraudulento a las autoridades competentes.
          </p>
        </div>
        
        <div className="text-xs text-gray-600 mt-4">
          © {new Date().getFullYear()} C8L Agency - Todos los derechos reservados
        </div>
      </div>
    </footer>
  );
}