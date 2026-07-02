"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, FileText, Check } from 'lucide-react';

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>('terms');

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white py-16 px-4 md:py-24 font-sans relative select-none">
      
      {/* Background Neon Glows */}
      <div className="absolute top-[10%] left-[20%] w-[40%] h-[30%] bg-red-650/10 blur-[150px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[20%] right-[10%] w-[30%] h-[30%] bg-red-800/5 blur-[120px] pointer-events-none z-0"></div>

      {/* Cyberpunk Scanlines */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] opacity-10 z-0"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 pb-6 border-b border-zinc-800/60">
          <div>
            <h1 className="font-heading font-black text-3xl uppercase tracking-wider text-[#00F3FF] drop-shadow-[0_0_8px_rgba(0,243,255,0.4)]">
              Marco Legal C8L
            </h1>
            <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase tracking-widest">
              Gobernanza y Cumplimiento Normativo de C8L Agency
            </p>
          </div>
          <Link 
            href="/studio"
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center gap-2"
          >
            <ArrowLeft size={14} />
            <span>Volver al Estudio</span>
          </Link>
        </header>

        {/* TAB CONTROLS */}
        <div className="flex bg-[#0d0d0e] border-[3px] border-black rounded-2xl p-1 mb-8 max-w-md shadow-[4px_4px_0px_#FF0055]">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-3 text-center text-xs font-heading font-black uppercase tracking-wider rounded-xl transition cursor-pointer ${
              activeTab === 'terms' ? 'bg-[#FF0055] text-white shadow-[0_0_10px_rgba(255,0,85,0.3)]' : 'text-zinc-500 hover:text-white'
            }`}
          >
            Términos de Servicio
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-3 text-center text-xs font-heading font-black uppercase tracking-wider rounded-xl transition cursor-pointer ${
              activeTab === 'privacy' ? 'bg-[#FF0055] text-white shadow-[0_0_10px_rgba(255,0,85,0.3)]' : 'text-zinc-500 hover:text-white'
            }`}
          >
            Política de Privacidad
          </button>
        </div>

        {/* CONTENT PANEL */}
        <div className="bg-[#0d0d0e] border-[3px] border-black rounded-3xl p-6 md:p-10 shadow-[4px_4px_0px_#00F3FF] relative overflow-hidden">
          
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,255,255,0.02))] bg-[size:100%_4px,6px_100%] opacity-35"></div>

          {activeTab === 'terms' ? (
            <article className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed space-y-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                <FileText className="text-[#00F3FF]" size={20} />
                <h2 className="text-xl font-heading font-black uppercase text-white tracking-wide">
                  Términos y Condiciones de Uso
                </h2>
              </div>
              <p className="text-xs text-zinc-500 font-mono">ÚLTIMA ACTUALIZACIÓN: 26 DE JUNIO DE 2026</p>
              
              <section className="space-y-3">
                <h3 className="text-white font-heading font-bold uppercase text-sm tracking-wide">1. Introducción y Aceptación</h3>
                <p>
                  Bienvenido a C8L Agency ("la Plataforma"). Al acceder a nuestros servicios de audio inteligente y estudio cuántico de música, declaras ser mayor de 18 años y aceptas regirte por los presentes Términos de Servicio. Si no estás de acuerdo, por favor abstente de utilizar nuestra infraestructura.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-white font-heading font-bold uppercase text-sm tracking-wide">2. Propiedad Intelectual y Derechos de Autor</h3>
                <p>
                  Toda música generada a través de las herramientas de Inferencia IA de C8L Agency pertenece en su totalidad al creador que introduce el prompt inicial, sujeto a las licencias de APIs subyacentes. C8L Agency no reclama propiedad alguna sobre las pistas finales creadas por los usuarios en el Tier Premium.
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-white font-heading font-bold uppercase text-sm tracking-wide">3. Tiers de Suscripción y Cuotas</h3>
                <p>
                  La plataforma opera en tres niveles de cuenta:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Free:</strong> Limitada a 1 petición de inferencia diaria (2 pistas).</li>
                  <li><strong>Premium:</strong> Otorga 5 peticiones diarias (10 pistas) y descargas en alta definición.</li>
                  <li><strong>Admin:</strong> Rango restringido de propiedad y auditoría general.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-white font-heading font-bold uppercase text-sm tracking-wide">4. Limitaciones de Uso y Restricciones</h3>
                <p>
                  Queda estrictamente prohibido utilizar la plataforma para infringir la propiedad intelectual de terceros, generar contenidos que promuevan el odio o la violencia, o realizar ataques de fuerza bruta en los endpoints del sistema. El incumplimiento resultará en el baneo inmediato de la dirección IP y cuenta de Supabase.
                </p>
              </section>
            </article>
          ) : (
            <article className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed space-y-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-800">
                <FileText className="text-[#00F3FF]" size={20} />
                <h2 className="text-xl font-heading font-black uppercase text-white tracking-wide">
                  Política de Privacidad y Cookies
                </h2>
              </div>
              <p className="text-xs text-zinc-500 font-mono">ÚLTIMA ACTUALIZACIÓN: 26 DE JUNIO DE 2026</p>

              <section className="space-y-3">
                <h3 className="text-white font-heading font-bold uppercase text-sm tracking-wide">1. Datos Recopilados</h3>
                <p>
                  Recopilamos la información mínima necesaria para garantizar el funcionamiento del estudio de música y la facturación fiscal:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Identificadores de cuenta (UID de Supabase y dirección de correo electrónico).</li>
                  <li>Parámetros de facturación para el cumplimiento de Hacienda (NIF/DNI, Razón Social, Dirección física y país).</li>
                  <li>Metadatos de telemetría del estudio (géneros seleccionados, tiempos de respuesta y peticiones consumidas).</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-white font-heading font-bold uppercase text-sm tracking-wide">2. Uso de la Información</h3>
                <p>
                  Tus datos se procesan con la única finalidad de:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Gestionar tus solicitudes de inferencia musical y guardar tu historial en tu biblioteca personal.</li>
                  <li>Generar facturas legales correlativas bajo la normativa tributaria española (módulo contable Apolo).</li>
                  <li>Garantizar la estabilidad y seguridad de los servidores microservicios ante consumos abusivos.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="text-white font-heading font-bold uppercase text-sm tracking-wide">3. Compartición con Terceros</h3>
                <p>
                  No vendemos ni comercializamos tus datos personales. Los metadatos de pago se comparten de forma segura con Stripe en cumplimiento del estándar PCI-DSS para autorizar transacciones (cuando el sistema esté activo). Las líricas y parámetros de audio se envían de forma anónima a Replicate para la ejecución del modelo generativo.
                </p>
              </section>
            </article>
          )}

        </div>

      </div>
    </div>
  );
}
