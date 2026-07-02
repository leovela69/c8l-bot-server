"use client";

import React, { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreditCard, ArrowLeft, ShieldAlert, CheckCircle, FileText } from 'lucide-react';

function CheckoutMockContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Recuperar parámetros de facturación calculados en la API
  const userId = searchParams.get('userId') || '';
  const taxId = searchParams.get('taxId') || '';
  const name = searchParams.get('name') || '';
  const address = searchParams.get('address') || '';
  const country = searchParams.get('country') || '';
  const euVatNumber = searchParams.get('euVatNumber') || '';
  const baseAmount = searchParams.get('baseAmount') || '19.99';
  const vatRate = searchParams.get('vatRate') || '21';
  const vatAmount = searchParams.get('vatAmount') || '4.20';
  const totalAmount = searchParams.get('totalAmount') || '24.19';
  const taxRule = searchParams.get('taxRule') || '';

  const handleSimulatePayment = async () => {
    setLoading(true);
    try {
      const mockWebhookPayload = {
        isMockTrigger: true,
        paymentIntentId: 'mock_pi_' + Math.random().toString(36).substring(7),
        metadata: {
          userId,
          taxId,
          name,
          address,
          country,
          euVatNumber,
          baseAmount,
          vatRate,
          vatAmount,
          totalAmount
        }
      };

      const res = await fetch('/api/billing/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockWebhookPayload)
      });

      if (res.ok) {
        setPaymentStatus('success');
        setTimeout(() => {
          router.push('/admin-c8l-control?payment=success&mock=true');
        }, 2000);
      } else {
        setPaymentStatus('error');
      }
    } catch (err) {
      setPaymentStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4 py-12 font-sans select-none">
      
      {/* HUD HEADER */}
      <div className="w-full max-w-lg mb-8 text-center">
        <h1 className="font-heading font-black text-2xl md:text-3xl text-[#00F3FF] tracking-wider uppercase drop-shadow-[0_0_8px_rgba(0,243,255,0.4)]">
          C8L Sandbox Gateway
        </h1>
        <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-widest">
          Transacción Segura de Simulación de Pago
        </p>
      </div>

      {/* DETALLE PANEL */}
      <div className="w-full max-w-lg bg-[#0d0d0e] border-[3px] border-black rounded-3xl shadow-[4px_4px_0px_#00F3FF] p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">
        
        {/* SCANLINE OVERLAY */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] opacity-40"></div>

        {/* ALERTA DE MODO TEST */}
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 flex gap-3 items-start z-10">
          <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-xs font-bold text-amber-400 font-heading uppercase tracking-wide">Modo Simulación Activo</h4>
            <p className="text-[10px] text-amber-350/80 leading-relaxed mt-1">
              Stripe está en modo preparación. No se cobrará dinero real. Al confirmar, se simulará una transacción y se emitirá la factura correspondiente.
            </p>
          </div>
        </div>

        {/* INVOICE INFO */}
        <div className="border-t border-b border-zinc-800 py-4 flex flex-col gap-3 font-mono text-[11px] z-10">
          <div className="flex justify-between items-center text-zinc-400">
            <span>CLIENTE:</span>
            <span className="font-bold text-white text-right">{name}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span>NIF/CIF:</span>
            <span className="text-white">{taxId}</span>
          </div>
          {euVatNumber && (
            <div className="flex justify-between items-center text-zinc-400">
              <span>NIF-IVA (VIES):</span>
              <span className="text-white text-emerald-400 font-bold">{euVatNumber}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-zinc-400">
            <span>PAÍS:</span>
            <span className="text-white">{country}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span>DOMICILIO:</span>
            <span className="text-white truncate max-w-[200px]">{address}</span>
          </div>
          <div className="flex justify-between items-center text-zinc-400">
            <span>REGLA FISCAL:</span>
            <span className="text-amber-400 font-bold uppercase text-[9px]">{taxRule}</span>
          </div>
        </div>

        {/* PRICE SUMMARY */}
        <div className="bg-black/60 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-2.5 font-mono text-xs z-10">
          <div className="flex justify-between text-zinc-500">
            <span>BASE IMPONIBLE:</span>
            <span>${parseFloat(baseAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-zinc-500">
            <span>IVA ({vatRate}%):</span>
            <span>${parseFloat(vatAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[#00F3FF] font-black text-sm pt-2 border-t border-zinc-900">
            <span>TOTAL FACTURA:</span>
            <span>${parseFloat(totalAmount).toFixed(2)}</span>
          </div>
        </div>

        {/* STATUS SCREEN */}
        {paymentStatus === 'success' && (
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 text-emerald-400 text-xs font-heading uppercase z-10 animate-bounce">
            <CheckCircle size={18} />
            <span>Simulación de pago exitosa. Activando Premium...</span>
          </div>
        )}

        {paymentStatus === 'error' && (
          <div className="bg-red-950/30 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3 text-red-500 text-xs font-heading uppercase z-10">
            <ShieldAlert size={18} />
            <span>Fallo de red en la simulación del webhook.</span>
          </div>
        )}

        {/* BOTONES */}
        <div className="flex flex-col gap-3 mt-2 z-10">
          <button
            onClick={handleSimulatePayment}
            disabled={loading || paymentStatus === 'success'}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-550 active:translate-y-0.5 text-white font-heading font-black text-xs uppercase tracking-widest rounded-xl transition border-[3px] border-black shadow-[4px_4px_0px_#10B981] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CreditCard size={14} />
            <span>{loading ? 'Procesando...' : 'Confirmar Pago Simulado'}</span>
          </button>
          
          <button
            onClick={() => router.push('/admin-c8l-control?payment=cancelled')}
            disabled={loading || paymentStatus === 'success'}
            className="w-full py-3.5 bg-zinc-800 hover:bg-zinc-750 active:translate-y-0.5 text-zinc-400 hover:text-white font-heading font-bold text-xs uppercase tracking-wider rounded-xl transition border-2 border-zinc-700 flex items-center justify-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Cancelar y Volver</span>
          </button>
        </div>

      </div>
    </div>
  );
}

export default function CheckoutMockPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center font-mono text-xs">
        Cargando Pasarela C8L...
      </div>
    }>
      <CheckoutMockContent />
    </Suspense>
  );
}
