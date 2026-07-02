// components/audio/EffectsControlPanel.tsx
'use client';
import { useState, useEffect } from 'react';
import { Sliders, Volume2, Mic, Music, Sparkles, Zap, Lock, Unlock } from 'lucide-react';

interface EffectSettings {
  compressor: { active: boolean; threshold: number; ratio: number };
  eq: { active: boolean; bass: number; mid: number; treble: number };
  reverb: { active: boolean; mix: number; roomSize: 'small' | 'medium' | 'large' };
  delay: { active: boolean; time: number; feedback: number; mix: number };
  widening: { active: boolean; width: number };
}

interface EffectsControlPanelProps {
  settings: EffectSettings;
  onUpdate: (settings: Partial<EffectSettings>) => void;
  userPlan: 'free' | 'pro';
  className?: string;
}

export function EffectsControlPanel({ settings, onUpdate, userPlan, className = '' }: EffectsControlPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const isPro = userPlan === 'pro';

  const updateEffect = (effect: keyof EffectSettings, value: any) => {
    onUpdate({ [effect]: { ...settings[effect], ...value } });
  };

  return (
    <div className={`border-2 border-[#D4AF37] rounded-lg bg-black/80 backdrop-blur-sm ${className}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 text-[#D4AF37] font-black"
      >
        <span className="flex items-center gap-2"><Sliders size={16} /> EFECTOS DE VOZ</span>
        <span className="text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="p-3 pt-0 space-y-4 text-sm">
          {/* Compresor (gratis) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-gray-400 flex items-center gap-1"><Volume2 size={12} /> Compresor</label>
              <button
                onClick={() => updateEffect('compressor', { active: !settings.compressor.active })}
                className={`text-xs px-2 py-0.5 rounded ${settings.compressor.active ? 'bg-[#D4AF37] text-black' : 'bg-gray-700 text-white'}`}
              >
                {settings.compressor.active ? 'ON' : 'OFF'}
              </button>
            </div>
            {settings.compressor.active && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] text-gray-500">Umbral</div>
                  <input
                    type="range"
                    min="-40"
                    max="0"
                    step="1"
                    value={settings.compressor.threshold}
                    onChange={(e) => updateEffect('compressor', { threshold: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Relación</div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.01"
                    value={settings.compressor.ratio}
                    onChange={(e) => updateEffect('compressor', { ratio: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Ecualizador (gratis) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-gray-400 flex items-center gap-1"><Music size={12} /> Ecualizador</label>
              <button
                onClick={() => updateEffect('eq', { active: !settings.eq.active })}
                className={`text-xs px-2 py-0.5 rounded ${settings.eq.active ? 'bg-[#D4AF37] text-black' : 'bg-gray-700 text-white'}`}
              >
                {settings.eq.active ? 'ON' : 'OFF'}
              </button>
            </div>
            {settings.eq.active && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-[10px] text-gray-500">Graves</div>
                  <input type="range" min="-12" max="12" step="1" value={settings.eq.bass} onChange={(e) => updateEffect('eq', { bass: parseFloat(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Medios</div>
                  <input type="range" min="-12" max="12" step="1" value={settings.eq.mid} onChange={(e) => updateEffect('eq', { mid: parseFloat(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Agudos</div>
                  <input type="range" min="-12" max="12" step="1" value={settings.eq.treble} onChange={(e) => updateEffect('eq', { treble: parseFloat(e.target.value) })} className="w-full" />
                </div>
              </div>
            )}
          </div>

          {/* Reverb (PRO) */}
          <div className={`space-y-1 ${!isPro ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-center">
              <label className="text-gray-400 flex items-center gap-1"><Sparkles size={12} /> Reverb {!isPro && <Lock size={10} className="text-[#D4AF37]" />}</label>
              {isPro && (
                <button
                  onClick={() => updateEffect('reverb', { active: !settings.reverb.active })}
                  className={`text-xs px-2 py-0.5 rounded ${settings.reverb.active ? 'bg-[#D4AF37] text-black' : 'bg-gray-700 text-white'}`}
                >
                  {settings.reverb.active ? 'ON' : 'OFF'}
                </button>
              )}
            </div>
            {isPro && settings.reverb.active && (
              <div className="space-y-2">
                <div>
                  <div className="text-[10px] text-gray-500">Mezcla</div>
                  <input type="range" min="0" max="1" step="0.01" value={settings.reverb.mix} onChange={(e) => updateEffect('reverb', { mix: parseFloat(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Tamaño de sala</div>
                  <select
                    value={settings.reverb.roomSize}
                    onChange={(e) => updateEffect('reverb', { roomSize: e.target.value as any })}
                    className="w-full bg-black border border-gray-700 rounded text-white text-xs p-1"
                  >
                    <option value="small">Pequeña</option>
                    <option value="medium">Mediana</option>
                    <option value="large">Grande</option>
                  </select>
                </div>
              </div>
            )}
            {!isPro && <div className="text-[10px] text-center text-[#D4AF37]">🔓 Desbloquea PRO para Reverb</div>}
          </div>

          {/* Delay (PRO) */}
          <div className={`space-y-1 ${!isPro ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-center">
              <label className="text-gray-400 flex items-center gap-1"><Zap size={12} /> Delay/Eco {!isPro && <Lock size={10} className="text-[#D4AF37]" />}</label>
              {isPro && (
                <button
                  onClick={() => updateEffect('delay', { active: !settings.delay.active })}
                  className={`text-xs px-2 py-0.5 rounded ${settings.delay.active ? 'bg-[#D4AF37] text-black' : 'bg-gray-700 text-white'}`}
                >
                  {settings.delay.active ? 'ON' : 'OFF'}
                </button>
              )}
            </div>
            {isPro && settings.delay.active && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <div className="text-[10px] text-gray-500">Tiempo (s)</div>
                  <input type="range" min="0.05" max="0.8" step="0.01" value={settings.delay.time} onChange={(e) => updateEffect('delay', { time: parseFloat(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Feedback</div>
                  <input type="range" min="0" max="0.8" step="0.01" value={settings.delay.feedback} onChange={(e) => updateEffect('delay', { feedback: parseFloat(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <div className="text-[10px] text-gray-500">Mezcla</div>
                  <input type="range" min="0" max="0.8" step="0.01" value={settings.delay.mix} onChange={(e) => updateEffect('delay', { mix: parseFloat(e.target.value) })} className="w-full" />
                </div>
              </div>
            )}
          </div>

          {/* Widening (PRO) */}
          <div className={`space-y-1 ${!isPro ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-center">
              <label className="text-gray-400 flex items-center gap-1">🌊 Widening {!isPro && <Lock size={10} className="text-[#D4AF37]" />}</label>
              {isPro && (
                <button
                  onClick={() => updateEffect('widening', { active: !settings.widening.active })}
                  className={`text-xs px-2 py-0.5 rounded ${settings.widening.active ? 'bg-[#D4AF37] text-black' : 'bg-gray-700 text-white'}`}
                >
                  {settings.widening.active ? 'ON' : 'OFF'}
                </button>
              )}
            </div>
            {isPro && settings.widening.active && (
              <div>
                <input type="range" min="0" max="1" step="0.01" value={settings.widening.width} onChange={(e) => updateEffect('widening', { width: parseFloat(e.target.value) })} className="w-full" />
              </div>
            )}
          </div>

          {!isPro && (
            <div className="text-center mt-3 pt-2 border-t border-gray-800">
              <a href="/pricing" className="text-[#D4AF37] text-xs font-bold underline">✨ Mejora a PRO para efectos de estudio (Reverb, Delay, Widening) ✨</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}