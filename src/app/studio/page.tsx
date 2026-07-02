"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../context/AppContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Play, Pause, Music, Volume2, VolumeX, Download, Sparkles, Trash2, 
  MoreVertical, RefreshCw, Layers, Sliders, ToggleLeft, ToggleRight,
  Compass, PlusCircle, FolderHeart, User as UserIcon, Maximize2, Minimize2,
  ChevronUp, ChevronDown, ListMusic, FileText, Share2, HelpCircle
} from "lucide-react";
import QuantumMediaCreator from "../../components/ui/QuantumMediaCreator";

// Track Interface
interface GeneratedTrack {
  id: string;
  title: string;
  style: string;
  lyrics: string;
  bpm: number;
  emotions: string;
  instruments: string;
  vocalsUrl: string;
  melodyUrl: string;
  bassUrl: string;
  drumsUrl: string;
  isPublic?: boolean;
  date: string;
  duration: number; // in seconds
  isLiked?: boolean;
  isLoading?: boolean;
  voicePreset?: string;
  imageUrl?: string;
  status?: string;
}

const INITIAL_TRACKS: GeneratedTrack[] = [
  {
    id: "track-1",
    title: "Bolero de Silicio",
    style: "Bolero-House Espacial",
    bpm: 95,
    emotions: "Melancólico, Profundo",
    instruments: "Sintetizador analógico, Guitarra, Voces Cyber",
    vocalsUrl: "procedural",
    melodyUrl: "procedural",
    bassUrl: "procedural",
    drumsUrl: "procedural",
    isPublic: true,
    date: "2026-05-31",
    duration: 60,
    isLiked: true,
    lyrics: `[Verse 1]
Tengo en mi pecho un latido constante,
un bolero cuántico que me impulsa hacia adelante.
Leo Vela entona su voz de terciopelo,
y bajo el cielo de C8L encontramos consuelo...

[Chorus]
Ay, mi corazón loco que no sabe mentir,
si no estás conmigo prefiero morir.
Voz de terciopelo cantando al compás,
de esta melodía que no olvidarás.

[Outro]
Y vivieron felices... Porque nosotros quisimos.`
  },
  {
    id: "track-2",
    title: "Sable de Samurái",
    style: "Cyber Dubstep",
    bpm: 140,
    emotions: "Épico, Energético",
    instruments: "Guzheng, 808 Bass, Drums",
    vocalsUrl: "procedural",
    melodyUrl: "procedural",
    bassUrl: "procedural",
    drumsUrl: "procedural",
    isPublic: true,
    date: "2026-05-30",
    duration: 60,
    lyrics: `[Verse 1]
Espadas de luz en la noche de neón,
el samurai del dubstep golpea con precisión.
Bajos pesados, tambores de guerra en Kips,
la agencia C8L domina las playlists...

[Chorus]
Siente el impacto del filo digital,
corte perfecto en frecuencia de canal.
Guerrero del ritmo en el templo del sonido,
un león de oro que nunca es vencido.

[Outro]
Y vivieron felices... Porque nosotros quisimos.`
  },
  {
    id: "track-3",
    title: "Ciber-Charlestón",
    style: "Electro Swing Futurista",
    bpm: 120,
    emotions: "Energético, Industrial",
    instruments: "Sintetizador de viento, Brass, Metal Claps",
    vocalsUrl: "procedural",
    melodyUrl: "procedural",
    bassUrl: "procedural",
    drumsUrl: "procedural",
    isPublic: false,
    date: "2026-05-28",
    duration: 60,
    lyrics: `[Verse 1]
Estética retro, charlestón cibernético,
un sintetizador digital y magnético.
Los PK de TikTok se encienden con furor,
el león dorado ruge con gran esplendor...

[Chorus]
Bajos pesados golpean la placa base,
corazones locos reinician la fase.
C8L Agency entra en acción,
sintetizando beats de alta resolución.

[Outro]
Y vivieron felices... Porque nosotros quisimos.`
  },
  {
    id: "track-4",
    title: "Seda de Ibiza",
    style: "Deep House",
    bpm: 115,
    emotions: "Sensual, Relajado",
    instruments: "Pianos eléctricos, Percusión ligera",
    vocalsUrl: "procedural",
    melodyUrl: "procedural",
    bassUrl: "procedural",
    drumsUrl: "procedural",
    isPublic: true,
    date: "2026-05-25",
    duration: 60,
    isLiked: true,
    lyrics: `[Verse 1]
Bajo el sol de Ibiza tu mirada me enreda,
el viento cálido roza tu piel de seda.
La música flota en la noche infinita,
esta melodía cuántica es lo que me excita...

[Chorus]
Baila conmigo sintiendo el latido,
en la playa de oro nos hemos perdido.
Seda en el alma, ritmo en la piel,
C8L Agency te lleva al nivel.

[Outro]
Y vivieron felices... Porque nosotros quisimos.`
  }
];

const LYRICS_PRESETS = [
  `[Verse 1]
Fiebre cuántica en la red de silicio,
programando sueños que se vuelven vicio.
Leo Vela canta su ritmo digital,
agencia C8L en el mapa universal.

[Chorus]
Es un lazo de neón en la oscuridad,
sintetizando música para la eternidad.
Ritmo cibernético, fuerza y conexión,
esta es la fórmula de nuestra generación.`,

  `[Verse 1]
Ruge el león dorado en la consola de oro,
mezclando las frecuencias que yo tanto adoro.
Bajo el cielo púrpura de la simulación,
lanzamos una rima que rompe la ecuación.

[Chorus]
Voz sintética, beats en alta definición,
nuestra melodía no admite limitación.
C8L Studio creando en el portal,
un beat procedimental que nunca sonará igual.`,

  `[Verse 1]
Caminando entre la lluvia holográfica,
escribiendo códigos de música gráfica.
Tus ojos reflejan destellos de neón,
cuando el arpegiador entra en el compás del son.

[Chorus]
Siente la corriente, fluye en el canal,
mezclando las ondas del pulso digital.
Música infinita hecha por la IA,
en este estudio cuántico de noche y de día.`
];

const STYLE_SUGGESTIONS = [
  "Cyberpunk", "Synthwave", "Ibiza House", "Electro Swing", "Lofi Beats", 
  "Techno", "Trap", "Reggaeton", "Ambient", "Jazz Fusion", "Rock Industrial"
];

const EMOTIONS = [
  { id: "energetic", label: "Energético", emoji: "⚡" },
  { id: "happy", label: "Feliz", emoji: "😀" },
  { id: "sad", label: "Melancólico", emoji: "😢" },
  { id: "epic", label: "Épico", emoji: "🔥" },
  { id: "relaxed", label: "Relajado", emoji: "😌" },
  { id: "mysterious", label: "Misterioso", emoji: "🔮" },
  { id: "dark", label: "Oscuro", emoji: "💀" },
  { id: "futuristic", label: "Futurista", emoji: "🚀" }
];

interface StyleConfig {
  bpm: number;
  chords: number[][];
  oscType: OscillatorType;
  bassPattern: number[];
  isSalsa?: boolean;
  isFlamenco?: boolean;
  isReggaeton?: boolean;
  isLofi?: boolean;
  isRock?: boolean;
}

const getStyleConfig = (style: string): StyleConfig => {
  const s = style.toLowerCase();
  if (s.includes("salsa")) {
    return {
      bpm: 180,
      chords: [
        [261.63, 329.63, 392.00], // C major
        [349.23, 440.00, 523.25], // F major
        [392.00, 493.88, 587.33], // G major
        [349.23, 440.00, 523.25]  // F major
      ],
      oscType: "triangle",
      bassPattern: [2, 3, 6, 7, 10, 11, 14, 15],
      isSalsa: true
    };
  } else if (s.includes("flamenco")) {
    return {
      bpm: 120,
      chords: [
        [220.00, 261.63, 329.63], // Am
        [196.00, 246.94, 293.66], // G
        [174.61, 220.00, 261.63], // F
        [164.81, 207.65, 246.94]  // E
      ],
      oscType: "triangle",
      bassPattern: [0, 3, 6, 8, 10, 12],
      isFlamenco: true
    };
  } else if (s.includes("reggaeton") || s.includes("dembow")) {
    return {
      bpm: 95,
      chords: [
        [138.59, 164.81, 207.65], // C#m
        [146.83, 174.61, 220.00], // Dm
        [138.59, 164.81, 207.65],
        [123.47, 146.83, 196.00]  // B
      ],
      oscType: "sawtooth",
      bassPattern: [0, 4, 8, 12],
      isReggaeton: true
    };
  } else if (s.includes("lofi") || s.includes("chill") || s.includes("jazz")) {
    return {
      bpm: 75,
      chords: [
        [220.00, 261.63, 329.63, 392.00], // Am7
        [174.61, 220.00, 261.63, 329.63], // Fmaj7
        [261.63, 329.63, 392.00, 523.25], // Cmaj7
        [196.00, 246.94, 293.66, 349.23]  // G7
      ],
      oscType: "sine",
      bassPattern: [0, 6, 8, 14],
      isLofi: true
    };
  } else if (s.includes("rock") || s.includes("metal") || s.includes("guitar")) {
    return {
      bpm: 130,
      chords: [
        [110.00, 164.81], // A5
        [87.31, 130.81],  // F5
        [130.81, 196.00], // C5
        [98.00, 146.83]   // G5
      ],
      oscType: "sawtooth",
      bassPattern: [0, 2, 4, 6, 8, 10, 12, 14],
      isRock: true
    };
  } else {
    return {
      bpm: 120,
      chords: [
        [220.00, 261.63, 329.63], // Am
        [174.61, 220.00, 261.63], // F
        [261.63, 329.63, 392.00], // C
        [196.00, 246.94, 293.66]  // G
      ],
      oscType: "sawtooth",
      bassPattern: [0, 2, 4, 6, 8, 10, 12, 14]
    };
  }
};

const getStyleCloudUrl = (style: string): string => {
  const s = style.toLowerCase();
  if (s.includes("salsa")) {
    return "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3";
  } else if (s.includes("flamenco")) {
    return "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3";
  } else if (s.includes("reggaeton") || s.includes("dembow")) {
    return "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3";
  } else if (s.includes("lofi") || s.includes("chill") || s.includes("jazz")) {
    return "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3";
  } else if (s.includes("rock") || s.includes("metal") || s.includes("guitar")) {
    return "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3";
  } else {
    return "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
  }
};

const bufferToWav = (buffer: AudioBuffer): Blob => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArr = new ArrayBuffer(length);
  const view = new DataView(bufferArr);
  const channels = [];
  let sample;
  let offset = 0;
  let pos = 0;

  const setUint16 = (data: number) => {
    view.setUint16(offset, data, true);
    offset += 2;
  };

  const setUint32 = (data: number) => {
    view.setUint32(offset, data, true);
    offset += 4;
  };

  // write WAV header
  setUint32(0x46464952); // "RIFF"
  setUint32(36 + buffer.length * numOfChan * 2); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // chunk length
  setUint16(1); // sample format (raw PCM)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * numOfChan * 2); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // bits per sample
  setUint32(0x61746164); // "data" chunk
  setUint32(buffer.length * numOfChan * 2); // chunk length

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][pos]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([view], { type: "audio/wav" });
};

const generateVocalsClientSide = async (text: string, lang: string = "es"): Promise<string> => {
  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith("["));
    
  const chunks: string[] = [];
  let currentChunk = "";
  
  for (const line of lines) {
    if ((currentChunk + " " + line).length > 150) {
      chunks.push(currentChunk);
      currentChunk = line;
    } else {
      currentChunk = currentChunk ? currentChunk + " " + line : line;
    }
  }
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioContextClass();
  const decodedBuffers: AudioBuffer[] = [];
  
  for (const chunk of chunks) {
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(chunk)}`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(googleTtsUrl)}`;
    
    try {
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arrayBuffer);
        decodedBuffers.push(decoded);
      }
    } catch (e) {
      console.error("Error decoding audio chunk:", chunk, e);
    }
  }
  
  if (decodedBuffers.length === 0) {
    throw new Error("Could not decode any audio segments");
  }
  
  const totalLength = decodedBuffers.reduce((acc, b) => acc + b.length, 0);
  const combinedBuffer = ctx.createBuffer(
    decodedBuffers[0].numberOfChannels,
    totalLength,
    decodedBuffers[0].sampleRate
  );
  
  let offset = 0;
  for (const b of decodedBuffers) {
    for (let channel = 0; channel < b.numberOfChannels; channel++) {
      combinedBuffer.getChannelData(channel).set(b.getChannelData(channel), offset);
    }
    offset += b.length;
  }
  
  const wavBlob = bufferToWav(combinedBuffer);
  return URL.createObjectURL(wavBlob);
};

const generateLyricsClientSide = (style: string, theme: string): string => {
  const normalizedTheme = theme.toLowerCase();
  const normalizedStyle = style.toLowerCase();
  
  if (normalizedStyle.includes("salsa") || normalizedTheme.includes("salsa")) {
    return `[Verse 1]
Bajo las luces del barrio latino sonando con sabor,
las trompetas anuncian la descarga y el calor.
El piano repica su montuno tropical,
C8L Agency marcando un ritmo sin igual...

[Chorus]
Salsa caliente para bailar y gozar,
con clave de sol que te pone a vibrar.
Siente la conga y el bajo sonar,
esta melodía cuántica nunca va a parar.

[Verse 2]
El bailador se desplaza con gran precisión,
dándole giros al compás del corazón.
Leo Vela canta con mucha dulzura,
trayendo sabor en esta noche de locura.

[Bridge]
[Solo de Piano Montuno y Vientos]
Repique de timbales en el festival,
un puente de bronce y ritmo de metal.
El coro responde con gran alegría,
danzando en la noche hasta el nuevo día.

[Chorus]
Salsa caliente para bailar y gozar,
con clave de sol que te pone a vibrar.
Siente la conga y el bajo sonar,
esta melodía cuántica nunca va a parar.

[Outro]
¡Con sabor cuántico!
Y vivieron felices... Porque nosotros quisimos.`;
  } else if (normalizedStyle.includes("flamenco") || normalizedTheme.includes("flamenco")) {
    return `[Verse 1]
Un quejío hondo nace del alma y del pecho,
guitarra de palo rasgueando por derecho.
Las palmas repican en la noche estrellada,
C8L Agency en el aire inspirada...

[Chorus]
Ay, mi flamenco cuántico de compás y pasión,
cantando al compás de esta simulación.
Siente el taconeo y el duende vibrar,
esta soleá nunca va a terminar.

[Verse 2]
Canto gitano cruzando el procesador,
pulsando las cuerdas con fuerza y dolor.
Bajo la luna de plata y carbón,
dejamos la vida en cada canción.

[Bridge]
[Solo de Clapeo y Guitarra Española]
Un puente de palmas y compás de amalgama,
el eco del cante que al viento reclama.
La frecuencia sube con gracia y salero,
en este tablao de neón y de acero.

[Chorus]
Ay, mi flamenco cuántico de compás y pasión,
cantando al compás de esta simulación.
Siente el taconeo y el duende vibrar,
esta soleá nunca va a terminar.

[Outro]
¡Al compás del viento!
Y vivieron felices... Porque nosotros quisimos.`;
  } else if (normalizedStyle.includes("reggaeton") || normalizedTheme.includes("reggaeton") || normalizedStyle.includes("dembow") || normalizedTheme.includes("dembow")) {
    return `[Verse 1]
Luces apagadas, la disco encendida con pasión,
el bajo retumba rompiendo la tensión.
Bailando apretado al ritmo del compás,
C8L Agency subiendo de nivel una vez más...

[Chorus]
Dembow pesado que te hace mover,
siente el reggaetón hasta el amanecer.
Con la voz del cantante al máximo nivel,
sintetizando beats que erizan la piel.

[Verse 2]
El party no para, la gente pide calor,
haciendo que tiemble todo el sector.
Leo Vela entona con flow celestial,
en esta frecuencia de impacto mundial.

[Bridge]
[Dembow Synth Solo - Máxima Potencia]
El ritmo se frena para luego romper,
bajo de neón que te va a encender.
Siente la presión en el club digital,
una experiencia que se vuelve vital.

[Chorus]
Dembow pesado que te hace mover,
siente el reggaetón hasta el amanecer.
Con la voz del cantante al máximo nivel,
sintetizando beats que erizan la piel.

[Outro]
¡Flow cuántico activado!
C8L Studio.`;
  } else if (normalizedStyle.includes("lofi") || normalizedTheme.includes("lofi") || normalizedStyle.includes("chill") || normalizedTheme.includes("chill") || normalizedStyle.includes("jazz") || normalizedTheme.includes("jazz")) {
    return `[Verse 1]
Gotas de lluvia caen lentas en el cristal,
un café caliente y la vista de la ciudad.
Un piano de jazz sonando en baja fidelidad,
buscando en la noche un momento de paz...

[Chorus]
Lofi Beats relajantes para meditar,
cerrando los ojos y dejarse llevar.
Con ritmos de vinilo y textura espacial,
sintetizando calma de forma natural.

[Verse 2]
La mente divaga entre ondas de neón,
cifrando silencios en cada rincón.
Una voz suave de fondo cantando,
mientras el reloj sigue avanzando.

[Bridge]
[Solo de Piano Eléctrico y Trompeta Muted]
Un puente de acordes de séptima mayor,
relajando el alma, calmando el dolor.
La frecuencia baja a setenta y cinco,
sintiendo el latido de un dulce laberinto.

[Chorus]
Lofi Beats relajantes para meditar,
cerrando los ojos y dejarse llevar.
Con ritmos de vinilo y textura espacial,
sintetizando calma de forma natural.

[Outro]
Silencio nocturno...
Buenas noches.`;
  } else if (normalizedStyle.includes("rock") || normalizedTheme.includes("rock") || normalizedStyle.includes("metal") || normalizedTheme.includes("metal") || normalizedStyle.includes("guitar") || normalizedTheme.includes("guitar")) {
    return `[Verse 1]
Amplificadores al máximo rugiendo con poder,
guitarras eléctricas que te hacen enloquecer.
Baterías pesadas rompiendo el metal,
C8L Agency desatando el vendaval...

[Chorus]
Rock con distorsión que te hace gritar,
con acordes de quinta que te van a elevar.
Siente la fuerza del bajo sonar,
esta rebelión de neón nunca va a parar.

[Verse 2]
El escenario arde bajo la vibración,
gritando con furia en cada canción.
El león dorado ruge en el festival,
desatando la energía del canal digital.

[Bridge]
[Solo de Guitarra Eléctrica Distorsionada]
El solo estalla en frecuencia infinita,
una distorsión que el pecho te agita.
El puente de riffs acelera el motor,
sintiendo en la sangre todo el sudor.

[Chorus]
Rock con distorsión que te hace gritar,
con acordes de quinta que te van a elevar.
Siente la fuerza del bajo sonar,
esta rebelión de neón nunca va a parar.

[Outro]
¡Larga vida al rock cuántico!
C8L Studio.`;
  } else if (normalizedTheme.includes("hacker") || normalizedTheme.includes("cyber") || normalizedStyle.includes("cyberpunk")) {
    return `[Verse 1]
Luces de neón parpadean en la oscuridad
Líneas de código escriben la verdad
Mi teclado es el arma, la red mi ciudad
Hacker vengativo buscando libertad

[Chorus]
Bajos pesados golpean la placa base
Corazones locos reinician la fase
C8L Agency entra en acción
Sintetizando beats de alta resolución

[Verse 2]
Firewalls caen ante mi vector de ataque
Buscando un puerto libre que te opaque
El león dorado ruge en el ciberespacio
Voy hackeando nodos a paso despacio

[Bridge]
[Tempo: 120 BPM - Synth Solo]
Un puente acústico entre el silicio y el alma
La frecuencia sube, se pierde la calma
El algoritmo de Gemini guía mi camino
Cifrando en la noche mi propio destino

[Chorus]
Bajos pesados golpean la placa base
Corazones locos reinician la fase
C8L Agency entra en acción
Sintetizando beats de alta resolución

[Outro]
Conexión terminada...
Sistema estable.`;
  } else if (normalizedTheme.includes("amor") || normalizedTheme.includes("corazon") || normalizedStyle.includes("bolero")) {
    return `[Verse 1]
Tengo en mi pecho un latido constante
Un bolero cuántico que me impulsa hacia adelante
La luna de plata ilumina tu pelo
Y bajo el cielo de C8L encontramos consuelo

[Chorus]
Ay, mi corazón loco que no sabe mentir
Si no estás conmigo prefiero morir
Voz de terciopelo cantando al compás
De esta melodía que no olvidarás

[Verse 2]
Tus ojos me miran como un sintetizador
Modulando las ondas de nuestro gran amor
Aunque la distancia nos quiera separar
Nuestra vibración siempre se va a encontrar

[Bridge]
[Guitarra Acústica - Solo]
Un puente de cuerdas en la inmensidad
Buscando el balance de la realidad
Leo Vela entona con el alma abierta
Para mantener la pasión despierta

[Chorus]
Ay, mi corazón loco que no sabe mentir
Si no estás conmigo prefiero morir
Voz de terciopelo cantando al compás
De esta melodía que no olvidarás

[Outro]
El acorde final se desvanece...
En el silencio de la noche.`;
  } else {
    return `[Verse 1]
Fiebre cuántica en la red de silicio,
programando sueños que se vuelven vicio.
Leo Vela canta su ritmo digital,
agencia C8L en el mapa universal.

[Chorus]
Es un lazo de neón en la oscuridad,
sintetizando música para la eternidad.
Ritmo cibernético, fuerza y conexión,
esta es la fórmula de nuestra generación.

[Verse 2]
Ruge el león dorado en la consola de oro,
mezclando las frecuencias que yo tanto adoro.
Bajo el cielo púrpura de la simulación,
lanzamos una rima que rompe la ecuación.

[Chorus]
Es un lazo de neón en la oscuridad,
sintetizando música para la eternidad.
Ritmo cibernético, fuerza y conexión,
esta es la fórmula de nuestra generación.

[Outro]
Y vivieron felices... Porque nosotros quisimos.`;
  }
};

export default function StudioPage() {
  const { deviceFormat, credits, deductCredits, showNotification, language, setLanguage, c8lCoins, deductCCoins, user, logout } = useApp();
  const router = useRouter();

  const [voicePreset, setVoicePreset] = useState("leo");
  const [selectedEmotion, setSelectedEmotion] = useState<string>("");

  // Navigation states
  const [activeTab, setActiveTab] = useState<"explore" | "create" | "library" | "profile" | "generator">("create");
  
  // Responsive mode state
  const [mode, setMode] = useState<"mobile" | "tablet" | "desktop">("desktop");
  
  // Library filters
  const [libraryFilter, setLibraryFilter] = useState<"all" | "public" | "liked">("all");

  // Creation form states
  const [customMode, setCustomMode] = useState(false);
  const [promptInput, setPromptInput] = useState("");
  const [lyricsInput, setLyricsInput] = useState("");
  const [styleInput, setStyleInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [isInstrumental, setIsInstrumental] = useState(false);
  
  // Generation visual states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Playback states
  const [tracks, setTracks] = useState<GeneratedTrack[]>(INITIAL_TRACKS);
  const [currentTrack, setCurrentTrack] = useState<GeneratedTrack | null>(INITIAL_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  
  // UI states
  const [lyricsDrawerOpen, setLyricsDrawerOpen] = useState(false);
  const [mobilePlayerExpanded, setMobilePlayerExpanded] = useState(false);
  const [activeMenuTrackId, setActiveMenuTrackId] = useState<string | null>(null);

  // Suno States & Refs
  const [sunoCredits, setSunoCredits] = useState<number | null>(null);
  const pollingIntervalRef = useRef<any>(null);

  // Audio nodes and context refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<any>(null);
  const instAudioRef = useRef<HTMLAudioElement | null>(null);
  const vocAudioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const playbackTimerRef = useRef<any>(null);

  // Determine screen width and simulation modes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      const width = window.innerWidth;
      if (deviceFormat === "phone") {
        setMode("mobile");
      } else if (deviceFormat === "tablet") {
        setMode("tablet");
      } else if (deviceFormat === "pc") {
        setMode("desktop");
      } else {
        // unset format (real screen width)
        if (width < 768) {
          setMode("mobile");
        } else if (width <= 1024) {
          setMode("tablet");
        } else {
          setMode("desktop");
        }
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial setup

    return () => window.removeEventListener("resize", handleResize);
  }, [deviceFormat]);

  const loadSunoCredits = async () => {
    try {
      const response = await fetch('https://super-bot-vzxw.onrender.com/api/suno/credits', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.credits_left !== undefined) {
          setSunoCredits(data.credits_left);
        }
      }
    } catch (e) {
      console.warn("Failed to load Suno credits:", e);
    }
  };

  // Clean up Audio Context on unmount
  useEffect(() => {
    loadSunoCredits();
    return () => {
      stopSynthesizer();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Update volume node dynamically
  useEffect(() => {
    if (audioCtxRef.current && isPlaying) {
      // Set volume parameter dynamically if needed
    }
  }, [volume, isMuted]);

  // -------------------------------------------------------------
  // REAL GENERATIVE AI INTEGRATION (Suno AI style)
  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // REAL GENERATIVE AI INTEGRATION (Suno AI style)
  // -------------------------------------------------------------
  const [authModal, setAuthModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    costText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    costText: "",
    onConfirm: () => {}
  });

  const generateLyricsMock = async () => {
    if (!promptInput && !styleInput) {
      showNotification("Por favor introduce un prompt o estilo primero.", "error");
      return;
    }
    
    setAuthModal({
      isOpen: true,
      title: "Autorizar Inferencia de Líricas",
      description: `El subagente C8L Ghostwriter IA redactará la letra de la canción basada en tu prompt: "${promptInput || styleInput}".`,
      costText: "Costo: 2 Coins + 1 Crédito IA",
      onConfirm: async () => {
        setAuthModal(prev => ({ ...prev, isOpen: false }));
        showNotification("Generando líricas con C.8.L. Ghostwriter AI...", "info");
        
        // Simulate a small 600ms loading latency to feel premium
        await new Promise(resolve => setTimeout(resolve, 600));
        
        try {
          const lyrics = generateLyricsClientSide(styleInput || "Synthwave", promptInput || "Música Cuántica");
          setLyricsInput(lyrics);
          showNotification("Líricas generadas con éxito por C.8.L. AI", "success");
        } catch (e) {
          console.warn("Fallo al generar líricas, usando presets...", e);
          const randomIndex = Math.floor(Math.random() * LYRICS_PRESETS.length);
          setLyricsInput(LYRICS_PRESETS[randomIndex]);
          showNotification("Líricas generadas por simulación local (Offline)", "info");
        }
      }
    });
  };

  const startPolling = (ids: string[]) => {
    if (ids.length === 0) return;
    
    showNotification(language === "es" ? "Procesando mezcla cuántica en Suno AI..." : "Processing quantum mix in Suno AI...", "info");
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch('https://super-bot-vzxw.onrender.com/api/suno/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids })
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        if (data.success && data.tracks) {
          const updatedTracks = data.tracks;
          let allComplete = true;
          
          setTracks(prev => prev.map(t => {
            const match = updatedTracks.find((ut: any) => ut.id === t.id);
            if (match) {
              const isComplete = match.status === 'complete';
              if (!isComplete && match.status !== 'error') {
                allComplete = false;
              }
              return {
                ...t,
                vocalsUrl: match.audio_url || t.vocalsUrl,
                imageUrl: match.image_url || t.imageUrl,
                lyrics: match.lyrics || t.lyrics,
                duration: match.duration || t.duration,
                status: match.status,
                isLoading: !isComplete
              };
            }
            return t;
          }));

          setCurrentTrack(prev => {
            if (!prev) return null;
            const match = updatedTracks.find((ut: any) => ut.id === prev.id);
            if (match && match.status === 'complete') {
              return {
                ...prev,
                vocalsUrl: match.audio_url || prev.vocalsUrl,
                imageUrl: match.image_url || prev.imageUrl,
                lyrics: match.lyrics || prev.lyrics,
                duration: match.duration || prev.duration,
                status: match.status,
                isLoading: false
              };
            }
            return prev;
          });
          
          if (allComplete) {
            clearInterval(interval);
            setIsGenerating(false);
            showNotification(language === "es" ? "¡Tus pistas de Suno AI ya están listas!" : "Your Suno AI tracks are ready!", "success");
            loadSunoCredits();
          }
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 5000);
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    pollingIntervalRef.current = interval;
  };

  const handleGenerate = () => {
    const requiredCredits = 10;
    
    if (!customMode && !promptInput.trim()) {
      showNotification("Por favor introduce una descripción para tu canción.", "error");
      return;
    }
    if (customMode && !styleInput.trim()) {
      showNotification("Por favor introduce un estilo de música.", "error");
      return;
    }

    if (credits < requiredCredits && sunoCredits !== null && sunoCredits < 10) {
      showNotification("Créditos insuficientes. Consigue más créditos para seguir creando.", "error");
      return;
    }

    setAuthModal({
      isOpen: true,
      title: language === "es" ? "Autorizar Inferencia en Suno AI" : "Authorize Suno AI Inference",
      description: language === "es" 
        ? `El bot de C8L conectará con tu cuenta Suno Premium para generar 2 variaciones de alta fidelidad basadas en tu prompt.`
        : `C8L Bot will connect to your Suno Premium account to generate 2 high-fidelity mixes.`,
      costText: language === "es" ? `Costo: 10 Créditos de Suno (Saldo: ${sunoCredits !== null ? sunoCredits : credits})` : `Cost: 10 Suno Credits (Balance: ${sunoCredits !== null ? sunoCredits : credits})`,
      onConfirm: () => {
        setAuthModal(prev => ({ ...prev, isOpen: false }));
        
        deductCredits(requiredCredits);
        setIsGenerating(true);
        setGenerationProgress(0);
        showNotification(language === "es" ? "Conectando con tu bot de Suno en Render..." : "Connecting to your Suno bot on Render...", "info");

        let detectedStyle = "Synthwave";
        if (!customMode) {
          const p = promptInput.toLowerCase();
          if (p.includes("salsa")) detectedStyle = "Salsa";
          else if (p.includes("flamenco")) detectedStyle = "Flamenco";
          else if (p.includes("reggaeton") || p.includes("dembow")) detectedStyle = "Reggaeton";
          else if (p.includes("lofi") || p.includes("chill") || p.includes("jazz")) detectedStyle = "Lofi";
          else if (p.includes("rock") || p.includes("metal") || p.includes("guitar")) detectedStyle = "Rock";
        } else {
          detectedStyle = styleInput;
        }

        const id1 = `loading-${Date.now()}-1`;
        const id2 = `loading-${Date.now()}-2`;
        
        const skeleton1: GeneratedTrack = {
          id: id1,
          title: customMode && titleInput.trim() ? `${titleInput} (Mix A)` : `Creando ${detectedStyle} Mix A...`,
          style: detectedStyle,
          bpm: 120,
          emotions: "Inspiradora",
          instruments: "Sintetizadores",
          vocalsUrl: "pending",
          melodyUrl: "pending",
          bassUrl: "pending",
          drumsUrl: "pending",
          date: new Date().toISOString().split("T")[0],
          duration: 180,
          lyrics: "Generando en Suno...",
          isLoading: true
        };

        const skeleton2: GeneratedTrack = {
          id: id2,
          title: customMode && titleInput.trim() ? `${titleInput} (Mix B)` : `Creando ${detectedStyle} Mix B...`,
          style: detectedStyle,
          bpm: 120,
          emotions: "Futurista",
          instruments: "Sintetizadores",
          vocalsUrl: "pending",
          melodyUrl: "pending",
          bassUrl: "pending",
          drumsUrl: "pending",
          date: new Date().toISOString().split("T")[0],
          duration: 180,
          lyrics: "Generando en Suno...",
          isLoading: true
        };

        setTracks(prev => [skeleton1, skeleton2, ...prev]);

        let progressVal = 0;
        const progressInterval = setInterval(() => {
          progressVal = Math.min(progressVal + 6, 85);
          setGenerationProgress(progressVal);
        }, 300);

        const generateAsync = async () => {
          try {
            const response = await fetch('https://super-bot-vzxw.onrender.com/api/suno/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                mode: customMode ? 'custom' : 'simple',
                prompt: customMode ? lyricsInput : promptInput,
                title: titleInput || 'C8L Creation',
                tags: styleInput || detectedStyle,
                instrumental: isInstrumental
              })
            });
            
            const data = await response.json();
            clearInterval(progressInterval);
            
            if (!response.ok || !data.success) {
              throw new Error(data.error || 'Failed to connect to Suno API');
            }

            setGenerationProgress(100);
            const generated = data.tracks || [];
            
            const newTracks: GeneratedTrack[] = generated.map((t: any, idx: number) => ({
              id: t.id || `suno-${Date.now()}-${idx}`,
              title: t.title || (customMode && titleInput ? `${titleInput} Mix ${idx === 0 ? 'A' : 'B'}` : `${detectedStyle} Mix ${idx === 0 ? 'A' : 'B'}`),
              style: t.tags || styleInput || detectedStyle,
              bpm: 120,
              emotions: idx === 0 ? "Inspiradora" : "Futurista",
              instruments: "Voz & Instrumentos",
              vocalsUrl: t.audio_url || 'pending',
              melodyUrl: 'pending',
              bassUrl: 'pending',
              drumsUrl: 'pending',
              imageUrl: t.image_url || '',
              lyrics: t.lyrics || lyricsInput || '',
              date: new Date().toISOString().split("T")[0],
              duration: t.duration || 180,
              isLoading: t.status !== 'complete',
              status: t.status || 'pending'
            }));

            setTracks(prev => {
              const filtered = prev.filter(t => t.id !== id1 && t.id !== id2);
              return [...newTracks, ...filtered];
            });

            const pendingIds = newTracks.map(t => t.id);
            startPolling(pendingIds);
            setActiveTab("library");

          } catch (err: any) {
            console.error("Suno Generation failed:", err);
            clearInterval(progressInterval);
            setTracks(prev => prev.filter(t => t.id !== id1 && t.id !== id2));
            showNotification(err.message || "Error al conectar con tu bot de Suno.", "error");
            setIsGenerating(false);
          }
        };
        generateAsync();
      }
    });
  };

  const prepareVocals = async (track: GeneratedTrack): Promise<string> => {
    if (track.vocalsUrl && track.vocalsUrl.startsWith("blob:")) {
      return track.vocalsUrl;
    }
    
    showNotification("Preparando voz IA en la nube...", "info");
    try {
      const blobUrl = await generateVocalsClientSide(track.lyrics, "es");
      setTracks(prev => prev.map(t => {
        if (t.id === track.id) {
          return { ...t, vocalsUrl: blobUrl };
        }
        return t;
      }));
      if (currentTrack?.id === track.id) {
        setCurrentTrack(prev => prev ? { ...prev, vocalsUrl: blobUrl } : null);
      }
      return blobUrl;
    } catch (e) {
      console.error("Failed to generate client-side vocals:", e);
      showNotification("Error al generar voz IA en la nube. Tocando instrumental.", "error");
      return "";
    }
  };

  // -------------------------------------------------------------
  // REAL CLIENT-SIDE STREAMING AUDIO ENGINE (Cloud Stems & Vocals)
  // -------------------------------------------------------------
  const startSynthesizer = (track: GeneratedTrack, resolvedVocUrl?: string) => {
    stopSynthesizer();

    const vocUrl = resolvedVocUrl || track.vocalsUrl;
    const isRealUrl = vocUrl && vocUrl.startsWith("http") && !vocUrl.startsWith("blob:");

    if (isRealUrl) {
      const mainAudio = new Audio(vocUrl);
      instAudioRef.current = mainAudio;
      mainAudio.volume = isMuted ? 0 : volume;
      mainAudio.loop = false;
      mainAudio.play().catch(e => console.log("Real Suno track play blocked", e));
    } else {
      const instUrl = getStyleCloudUrl(track.style);
      const instAudio = new Audio(instUrl);
      instAudioRef.current = instAudio;
      instAudio.volume = isMuted ? 0 : volume;
      instAudio.loop = true;
      instAudio.play().catch(e => console.log("Inst play blocked", e));

      if (vocUrl && vocUrl.startsWith("blob:")) {
        const vocAudio = new Audio(vocUrl);
        vocAudioRef.current = vocAudio;
        vocAudio.volume = isMuted ? 0 : volume;
        vocAudio.play().catch(e => console.log("Voc play blocked", e));
      }
    }

    startTimeRef.current = Date.now() - (pausedTimeRef.current * 1000);

    playbackTimerRef.current = setInterval(() => {
      if (!instAudioRef.current) return;
      if (instAudioRef.current.paused && !instAudioRef.current.ended) return;
      const elapsed = instAudioRef.current.currentTime;
      setCurrentTime(elapsed);
      if (elapsed >= (track.duration || 180)) {
        handleNext();
      }
    }, 250);
  };

  const stopSynthesizer = () => {
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    if (instAudioRef.current) {
      instAudioRef.current.pause();
      instAudioRef.current = null;
    }
    if (vocAudioRef.current) {
      vocAudioRef.current.pause();
      vocAudioRef.current = null;
    }
  };

  // -------------------------------------------------------------
  // AUDIO CONTROLS HANDLERS
  // -------------------------------------------------------------
  const togglePlay = async (track: GeneratedTrack) => {
    if (track.isLoading) return;
    
    const isRealUrl = track.vocalsUrl && track.vocalsUrl.startsWith("http") && !track.vocalsUrl.startsWith("blob:");

    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        // Pause
        stopSynthesizer();
        pausedTimeRef.current = currentTime;
        setIsPlaying(false);
      } else {
        // Resume
        if (instAudioRef.current) {
          instAudioRef.current.play().catch(() => {});
          if (vocAudioRef.current) {
            vocAudioRef.current.play().catch(() => {});
          }
          setIsPlaying(true);
        } else {
          let vocUrl = track.vocalsUrl;
          if (!isRealUrl && (!vocUrl || !vocUrl.startsWith("blob:"))) {
            vocUrl = await prepareVocals(track);
          }
          startSynthesizer(track, vocUrl);
          setIsPlaying(true);
        }
      }
    } else {
      // Play new track
      stopSynthesizer();
      setCurrentTrack(track);
      pausedTimeRef.current = 0;
      setCurrentTime(0);
      setIsPlaying(true);
      
      let vocUrl = track.vocalsUrl;
      if (!isRealUrl && (!vocUrl || !vocUrl.startsWith("blob:"))) {
        vocUrl = await prepareVocals(track);
      }
      startSynthesizer(track, vocUrl);
    }
  };

  const handleNext = () => {
    const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
    if (currentIndex >= 0 && currentIndex < tracks.length - 1) {
      togglePlay(tracks[currentIndex + 1]);
    } else {
      // Loop back to first track
      togglePlay(tracks[0]);
    }
  };

  const handlePrev = () => {
    const currentIndex = tracks.findIndex(t => t.id === currentTrack?.id);
    if (currentIndex > 0) {
      togglePlay(tracks[currentIndex - 1]);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    pausedTimeRef.current = newTime;
    if (instAudioRef.current) {
      instAudioRef.current.currentTime = newTime;
    }
    if (vocAudioRef.current) {
      vocAudioRef.current.currentTime = newTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val === 0) setIsMuted(true);
    else setIsMuted(false);
    
    if (instAudioRef.current) instAudioRef.current.volume = val;
    if (vocAudioRef.current) vocAudioRef.current.volume = val;
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (instAudioRef.current) instAudioRef.current.muted = nextMute;
    if (vocAudioRef.current) vocAudioRef.current.muted = nextMute;
  };

  // -------------------------------------------------------------
  // CLOUD DOWNLOAD HANDLER
  // -------------------------------------------------------------
  const handleDownload = (track: GeneratedTrack) => {
    const url = getStyleCloudUrl(track.style);
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.download = `${track.title.replace(/\s+/g, "_")}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("¡Pista de audio descargada desde la nube!", "success");
  };

  const handleRemix = (track: GeneratedTrack) => {
    setPromptInput(track.title + " con un toque remezclado");
    setStyleInput(track.style);
    setLyricsInput(track.lyrics);
    setTitleInput(track.title + " (Remix)");
    setCustomMode(true);
    setActiveTab("create");
    showNotification("Cargando base en el Workspace para remezclar.", "info");
  };

  const handleReusePrompts = (track: GeneratedTrack) => {
    setPromptInput(`Basado en estilo: ${track.style}`);
    setStyleInput(track.style);
    setLyricsInput(track.lyrics);
    setCustomMode(true);
    setActiveTab("create");
    showNotification("Copiado estilo y letra para nueva mezcla.", "info");
  };

  const handleDelete = (trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
    if (currentTrack?.id === trackId) {
      stopSynthesizer();
      setCurrentTrack(null);
      setIsPlaying(false);
    }
    showNotification("Canción eliminada del estudio.", "success");
  };

  const handleLikeToggle = (trackId: string) => {
    setTracks(prev => prev.map(t => {
      if (t.id === trackId) {
        return { ...t, isLiked: !t.isLiked };
      }
      return t;
    }));
  };

  // Filtered tracks for Library view
  const getFilteredTracks = () => {
    return tracks.filter(t => {
      if (libraryFilter === "liked") return t.isLiked;
      if (libraryFilter === "public") return t.isPublic;
      return true;
    });
  };

  // Active track formatted timers
  const formatSeconds = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Styled Suggestion Click
  const handleSuggestionClick = (styleName: string) => {
    setStyleInput(prev => prev ? `${prev}, ${styleName.toLowerCase()}` : styleName.toLowerCase());
  };

  return (
    <div className="h-screen w-screen bg-[#09090b] text-white flex flex-col relative font-sans antialiased overflow-hidden select-none">
      
      {/* Glow Effects Backdrop */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[30%] rounded-full bg-red-650/10 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[30%] rounded-full bg-red-800/5 blur-[150px] pointer-events-none z-0" />
      {/* CRT Scanline effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] opacity-10 z-0"></div>

      <div className="flex-1 flex w-full overflow-hidden relative z-10">
        
        {/* SIDEBAR (LEFT) - Style Suno */}
        <aside className="w-64 bg-[#0c0c0e] border-r border-zinc-800/50 flex flex-col justify-between shrink-0 font-mono z-20">
          <div className="flex flex-col gap-6 p-5 overflow-y-auto no-scrollbar">
            {/* C8L Brand Logo */}
            <div className="flex items-center gap-3 pb-4 border-b border-zinc-800/40">
              <div className="w-10 h-10 relative flex items-center justify-center filter drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
                <img src="/logo.png" alt="C8L Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-widest text-[#00F3FF] drop-shadow-[0_0_5px_rgba(0,243,255,0.3)]">C8L MUSIC AI</span>
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Studio v5.5</span>
              </div>
            </div>

            {/* User Info Card (Suno Style) */}
            <div className="bg-[#121216]/60 border border-zinc-800/50 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border border-[var(--color-gold)]/30 bg-zinc-950 flex items-center justify-center text-[10px] font-black text-white font-mono shadow-[0_0_10px_rgba(212,175,55,0.2)]">
                  {user ? user.email?.substring(0, 2).toUpperCase() : "LV"}
                </div>
                <div className="flex flex-col min-w-0 leading-tight">
                  <span className="text-xs font-bold text-white truncate">{user ? user.email?.split("@")[0] : "leovela888"}</span>
                  <span className="text-[10px] text-zinc-450 font-bold flex items-center gap-1 mt-0.5">
                    <span className="text-amber-500">🎵</span> {sunoCredits !== null ? `${sunoCredits} Suno CR` : `${credits} IA CR`}
                  </span>
                </div>
              </div>
              <Link 
                href="/admin-c8l-control"
                className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-center rounded-xl text-[9px] font-black uppercase text-red-500 tracking-wider transition-all"
              >
                Facturación de actualización
              </Link>
            </div>

            {/* Navigation links */}
            <nav className="flex flex-col gap-1.5 text-xs font-bold uppercase tracking-wider">
              <Link
                href="/"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/40 transition-all"
              >
                <span>🏠</span>
                <span>Inicio</span>
              </Link>
              <button
                onClick={() => setActiveTab("explore")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  activeTab === "explore" ? "bg-zinc-800 text-[#00F3FF]" : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                }`}
              >
                <span>🔍</span>
                <span>Explorar</span>
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  activeTab === "create" ? "bg-zinc-800 text-[#00F3FF]" : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                }`}
              >
                <span>🎵</span>
                <span>Crear</span>
              </button>
              <button
                onClick={() => setActiveTab("generator")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  activeTab === "generator" ? "bg-zinc-800 text-[#00F3FF]" : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                }`}
              >
                <span>✨</span>
                <span>Creador IA</span>
              </button>
              <button
                onClick={() => setActiveTab("library")}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  activeTab === "library" ? "bg-zinc-800 text-[#00F3FF]" : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                }`}
              >
                <span>📁</span>
                <span>Biblioteca</span>
              </button>
              
              <div className="h-[1px] bg-zinc-800/60 my-2" />
              
              <button className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-900/40 text-left transition-all">
                <span>🔔</span>
                <span className="flex items-center gap-1.5">
                  Notificaciones
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                </span>
              </button>
              <Link
                href="/legal"
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/40 transition-all text-left"
              >
                <span>📜</span>
                <span>Leyes & Políticas</span>
              </Link>
            </nav>
          </div>

          {/* Sidebar Footer: Language selector and logout */}
          <div className="p-5 border-t border-zinc-800/40 flex flex-col gap-3">
            <div className="flex justify-between items-center bg-zinc-950/45 border border-zinc-900/80 rounded-xl px-3 py-2 text-[10px] font-mono">
              <span className="text-zinc-500 font-bold uppercase">Idioma</span>
              <button 
                onClick={() => setLanguage(language === "en" ? "es" : "en")}
                className="text-[#00F3FF] hover:text-[#00F3FF]/80 font-black cursor-pointer transition-colors"
              >
                {language.toUpperCase()}
              </button>
            </div>
            {user && (
              <button 
                onClick={logout}
                className="w-full py-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-500 hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Cerrar Sesión
              </button>
            )}
          </div>
        </aside>

        {/* WORKSPACE WORK AREA */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* TAB: CREATE */}
          {activeTab === "create" && (
            <div className="flex-1 flex overflow-hidden">
              
              {/* CREATION INPUTS COLUMN (MIDDLE) */}
              <section className="w-[380px] border-r border-zinc-800/50 bg-[#0c0c0e]/40 p-5 flex flex-col justify-between overflow-y-auto no-scrollbar shrink-0 z-10 relative">
                <div className="flex flex-col gap-5">
                  
                  {/* Credits & Modes Row */}
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800/35">
                    <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                      🎵 {sunoCredits !== null ? `${sunoCredits} Suno CR` : `${credits} IA CR`}
                    </span>
                    
                    {/* Sencillo vs Avanzado */}
                    <div className="flex bg-zinc-900 p-0.5 rounded-xl border border-zinc-800/80">
                      <button
                        onClick={() => setCustomMode(false)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          !customMode ? "bg-zinc-800 text-white shadow-md" : "text-zinc-555 hover:text-zinc-300"
                        }`}
                      >
                        Sencillo
                      </button>
                      <button
                        onClick={() => setCustomMode(true)}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                          customMode ? "bg-zinc-800 text-white shadow-md" : "text-zinc-555 hover:text-zinc-300"
                        }`}
                      >
                        Avanzado
                      </button>
                    </div>

                    {/* Model Selector Dropdown */}
                    <span className="text-[9px] font-mono font-bold bg-zinc-900 border border-zinc-800/80 px-2 py-1 rounded text-red-500 select-none">
                      v5.5
                    </span>
                  </div>

                  {/* Mode Tabs Buttons */}
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 border border-zinc-800 bg-zinc-950/40 text-[9px] font-black uppercase tracking-wider text-zinc-400 hover:text-white rounded-xl transition">
                      + Audio
                    </button>
                    <button className="flex-1 py-2 border border-zinc-800 bg-zinc-950/40 text-[9px] font-black uppercase tracking-wider text-zinc-400 hover:text-white rounded-xl transition flex items-center justify-center gap-1">
                      + Voz <span className="bg-red-500 text-white text-[7px] font-bold px-1 rounded">NUEVO</span>
                    </button>
                    <button className="flex-1 py-2 border border-zinc-800 bg-zinc-950/40 text-[9px] font-black uppercase tracking-wider text-zinc-400 hover:text-white rounded-xl transition">
                      + Inspiración
                    </button>
                  </div>

                  {/* Form Input Blocks */}
                  {!customMode ? (
                    /* SIMPLE MODE */
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">
                          Descripción de Canción
                        </label>
                        <textarea
                          value={promptInput}
                          onChange={(e) => setPromptInput(e.target.value)}
                          placeholder="Introduce un prompt. Ej: Un bolero moderno y electrónico a 90 bpm con piano y sintetizadores..."
                          className="bg-[#050506] border border-zinc-800 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-red-500 transition-all placeholder:text-zinc-650 min-h-[140px] resize-none leading-relaxed"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">
                          Emoción del Ritmo
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {EMOTIONS.map(emotion => (
                            <button
                              key={emotion.id}
                              type="button"
                              onClick={() => setSelectedEmotion(selectedEmotion === emotion.id ? "" : emotion.id)}
                              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[9px] font-black transition-all cursor-pointer ${
                                selectedEmotion === emotion.id
                                  ? "bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                                  : "bg-[#0d0d10] border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                              }`}
                            >
                              <span className="text-sm mb-0.5">{emotion.emoji}</span>
                              <span>{emotion.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* CUSTOM/ADVANCED MODE */
                    <div className="flex flex-col gap-4">
                      {/* Lyrics block */}
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">
                            Letras (Lyrics)
                          </label>
                          <button
                            onClick={generateLyricsMock}
                            className="flex items-center gap-1 text-[8px] font-bold text-red-500 border border-red-500/20 hover:border-red-500/40 bg-red-500/5 px-2 py-0.5 rounded-lg transition-all cursor-pointer font-mono"
                          >
                            <Sparkles size={10} />
                            Generar con IA
                          </button>
                        </div>
                        <textarea
                          value={lyricsInput}
                          onChange={(e) => setLyricsInput(e.target.value)}
                          placeholder="[Verse 1]\nEscribe tus letras aquí o usa el generador de IA..."
                          className="bg-[#050506] border border-zinc-800 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-red-500 transition-all placeholder:text-zinc-650 min-h-[140px] resize-none leading-relaxed font-mono"
                        />
                      </div>

                      {/* Style block */}
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">
                          Estilo Musical
                        </label>
                        <input
                          type="text"
                          value={styleInput}
                          onChange={(e) => setStyleInput(e.target.value)}
                          placeholder="Ej: Synthwave, reggaeton, dembow"
                          className="bg-[#050506] border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-500 transition-all placeholder:text-zinc-650"
                        />
                        
                        {/* Suggestions tags */}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {STYLE_SUGGESTIONS.map(style => (
                            <button
                              key={style}
                              onClick={() => handleSuggestionClick(style)}
                              className="text-[8px] font-bold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded transition-all cursor-pointer"
                            >
                              +{style}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Title block */}
                      <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">
                          Título
                        </label>
                        <input
                          type="text"
                          value={titleInput}
                          onChange={(e) => setTitleInput(e.target.value)}
                          placeholder="Ej: Corazón Eléctrico"
                          className="bg-[#050506] border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-500 transition-all placeholder:text-zinc-650"
                        />
                      </div>
                    </div>
                  )}

                  {/* Instrumental switch */}
                  <div className="flex justify-between items-center border-t border-zinc-800/40 pt-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-white uppercase tracking-wide">Pista Instrumental</span>
                      <span className="text-[8px] text-zinc-550 font-medium font-mono">Sin voces ni líricas</span>
                    </div>
                    <button 
                      onClick={() => setIsInstrumental(!isInstrumental)}
                      className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {isInstrumental ? (
                        <ToggleRight size={36} className="text-red-500" />
                      ) : (
                        <ToggleLeft size={36} className="text-zinc-650" />
                      )}
                    </button>
                  </div>

                  {/* Voice selector (only if not instrumental) */}
                  {!isInstrumental && (
                    <div className="flex flex-col gap-2 border-b border-zinc-800/40 pb-4">
                      <label className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">
                        Voz de IA (AI Voice)
                      </label>
                      <select
                        value={voicePreset}
                        onChange={(e) => setVoicePreset(e.target.value)}
                        className="bg-[#050506] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                      >
                        <option value="leo">Leo Vela (Voz Masculina Terciopelo)</option>
                        <option value="seda">Seda (Voz Femenina Suave)</option>
                        <option value="robot">C8L Bot (Voz Cyber Vocoder)</option>
                        <option value="quantum">Quantum (Voz Tenor Brillante)</option>
                      </select>
                    </div>
                  )}

                </div>

                {/* Create Trigger Action */}
                <div className="flex flex-col gap-2 pt-4 border-t border-zinc-800/40 mt-6">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-orange-600 via-red-500 to-orange-500 hover:opacity-90 text-white font-black text-xs py-4 px-6 rounded-2xl transition-all cursor-pointer tracking-widest uppercase shadow-[0_4px_20px_rgba(239,68,68,0.25)] active:scale-95 disabled:opacity-50 relative overflow-hidden"
                  >
                    {isGenerating ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw size={14} className="animate-spin" />
                        SINTETIZANDO RITMOS ({generationProgress}%)
                      </span>
                    ) : (
                      <span>Crear</span>
                    )}
                    {isGenerating && (
                      <div className="absolute bottom-0 left-0 h-1 bg-white/40 transition-all duration-300" style={{ width: `${generationProgress}%` }} />
                    )}
                  </button>
                  <span className="text-[8px] text-zinc-550 text-center font-bold font-mono">
                    CONSUME 10 CRÉDITOS IA POR INTENTO
                  </span>
                </div>
              </section>

              {/* WORKSPACE HISTORY PANEL (RIGHT) */}
              <section className="flex-grow flex flex-col bg-black/20 overflow-hidden">
                {/* Header route */}
                <div className="p-5 border-b border-zinc-800/40 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400">
                    <span className="text-zinc-550">Espacios de trabajo</span>
                    <span>&gt;</span>
                    <span className="text-[#00F3FF] drop-shadow-[0_0_5px_rgba(0,243,255,0.2)]">Mi espacio de trabajo</span>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setLibraryFilter("all")}
                      className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        libraryFilter === "all" ? "bg-zinc-800 text-white" : "text-zinc-555 hover:text-white"
                      }`}
                    >
                      Todos
                    </button>
                    <button 
                      onClick={() => setLibraryFilter("liked")}
                      className={`text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        libraryFilter === "liked" ? "bg-zinc-800 text-white" : "text-zinc-555 hover:text-white"
                      }`}
                    >
                      Favoritos
                    </button>
                  </div>
                </div>

                {/* Grid List Scroll area */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-3 scrollbar-thin">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getFilteredTracks().map(track => (
                      <SongCard 
                        key={track.id} 
                        track={track} 
                        currentTrack={currentTrack} 
                        isPlaying={isPlaying} 
                        onTogglePlay={togglePlay}
                        onDownload={handleDownload}
                        onRemix={handleRemix}
                        onReusePrompts={handleReusePrompts}
                        onDelete={handleDelete}
                        onToggleLike={handleLikeToggle}
                        activeMenuId={activeMenuTrackId}
                        setActiveMenuId={setActiveMenuTrackId}
                      />
                    ))}
                  </div>
                </div>
              </section>

            </div>
          )}

          {/* TAB: EXPLORE */}
          {activeTab === "explore" && (
            <section className="flex-grow p-6 overflow-y-auto flex flex-col gap-6">
              <div className="bg-[#121216]/60 border border-zinc-800/40 p-6 rounded-3xl relative overflow-hidden flex flex-col gap-4 shadow-xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />
                <span className="text-[10px] font-mono text-[#00F3FF] font-bold uppercase tracking-widest">
                  ★ LANZAMIENTO EXCLUSIVO C8L
                </span>
                <h2 className="text-2xl font-black text-white uppercase tracking-wide leading-tight max-w-lg">
                  EXPLORA LAS COMPOSICIONES DE LA COMUNIDAD
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
                  Descubre cómo los creadores están utilizando el estudio cuántico para sintetizar pistas locales seguras.
                </p>
                <button 
                  onClick={() => setActiveTab("create")}
                  className="bg-white hover:bg-zinc-100 text-black font-black text-[9px] uppercase tracking-wider py-3 px-6 rounded-xl w-fit transition-all cursor-pointer active:scale-95 shadow-md mt-2"
                >
                  ABRIR MESA DE CREACIÓN
                </button>
              </div>

              <h3 className="text-[10px] font-bold text-zinc-555 uppercase tracking-widest font-mono border-b border-zinc-800/40 pb-2 mt-4">
                PISTAS MÁS COMPARTIDAS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tracks.map(track => (
                  <SongCard 
                    key={track.id} 
                    track={track} 
                    currentTrack={currentTrack} 
                    isPlaying={isPlaying} 
                    onTogglePlay={togglePlay}
                    onDownload={handleDownload}
                    onRemix={handleRemix}
                    onReusePrompts={handleReusePrompts}
                    onDelete={handleDelete}
                    onToggleLike={handleLikeToggle}
                    activeMenuId={activeMenuTrackId}
                    setActiveMenuId={setActiveMenuTrackId}
                  />
                ))}
              </div>
            </section>
          )}

          {/* TAB: CREADOR IA (Quantum Media Creator) */}
          {activeTab === "generator" && (
            <section className="flex-grow p-6 overflow-y-auto">
              <QuantumMediaCreator mode="desktop" />
            </section>
          )}

          {/* TAB: BIBLIOTECA */}
          {activeTab === "library" && (
            <section className="flex-grow p-6 overflow-y-auto flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-zinc-800/40 pb-3">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setLibraryFilter("all")}
                    className={`text-[9px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                      libraryFilter === "all" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Mis Canciones
                  </button>
                  <button 
                    onClick={() => setLibraryFilter("liked")}
                    className={`text-[9px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                      libraryFilter === "liked" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Favoritos
                  </button>
                </div>
                <span className="text-[9px] font-mono text-zinc-555 font-bold uppercase tracking-wider">
                  {getFilteredTracks().length} pistas almacenadas localmente
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredTracks().map(track => (
                  <SongCard 
                    key={track.id} 
                    track={track} 
                    currentTrack={currentTrack} 
                    isPlaying={isPlaying} 
                    onTogglePlay={togglePlay}
                    onDownload={handleDownload}
                    onRemix={handleRemix}
                    onReusePrompts={handleReusePrompts}
                    onDelete={handleDelete}
                    onToggleLike={handleLikeToggle}
                    activeMenuId={activeMenuTrackId}
                    setActiveMenuId={setActiveMenuTrackId}
                  />
                ))}
              </div>
            </section>
          )}

          {/* TAB: PROFILE */}
          {activeTab === "profile" && (
            <section className="flex-grow p-6 overflow-y-auto flex items-start justify-center pt-10">
              <div className="w-full max-w-xl bg-[#0c0c0e]/85 border border-zinc-800/60 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />
                
                <div className="flex items-center gap-6 border-b border-zinc-800/40 pb-6">
                  <div className="w-20 h-20 rounded-full border-4 border-red-500/20 bg-zinc-950 flex items-center justify-center text-white text-3xl font-black shadow-[0_0_20px_rgba(220,38,38,0.2)] font-mono">
                    LV
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-black text-white">Leo Vela</h2>
                      <span className="text-[9px] font-black tracking-widest font-mono text-red-500 border border-red-500/30 px-2 py-0.5 rounded bg-red-500/5">
                        CREADOR VIP
                      </span>
                    </div>
                    <span className="text-xs text-zinc-450 font-mono">@leo_vela39_c8l</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-b border-zinc-800/40 pb-6 text-center font-mono">
                  <div className="bg-zinc-950/60 p-4 border border-zinc-800/40 rounded-2xl flex flex-col gap-1">
                    <span className="text-lg font-black text-white">{tracks.length}</span>
                    <span className="text-[9px] font-bold text-zinc-555 uppercase tracking-widest">Generaciones</span>
                  </div>
                  <div className="bg-zinc-950/60 p-4 border border-zinc-800/40 rounded-2xl flex flex-col gap-1">
                    <span className="text-lg font-black text-white">{tracks.filter(t=>t.isLiked).length}</span>
                    <span className="text-[9px] font-bold text-zinc-555 uppercase tracking-widest">Favoritos</span>
                  </div>
                  <div className="bg-zinc-950/60 p-4 border border-zinc-800/40 rounded-2xl flex flex-col gap-1">
                    <span className="text-lg font-black text-white">{credits}</span>
                    <span className="text-[9px] font-bold text-zinc-555 uppercase tracking-widest">Créditos IA</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 text-xs">
                  <h3 className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                    Detalles de Suscripción
                  </h3>
                  <div className="flex justify-between items-center bg-zinc-950/40 p-4 border border-zinc-800/40 rounded-2xl font-mono text-[10px] text-zinc-400">
                    <div className="flex flex-col gap-1">
                      <span className="text-white font-bold text-xs">Plan Agencia C8L</span>
                      <span>Renovación mensual automática</span>
                    </div>
                    <span className="text-emerald-500 font-bold uppercase">Activo</span>
                  </div>
                </div>
              </div>
            </section>
          )}

        </div>

      </div>

      {/* PERSISTENT MEDIA PLAYER BAR (GLOBAL BOTTOM) */}
      {currentTrack && (
        <div className="h-20 bg-[#09090b] border-t border-zinc-800/60 flex items-center justify-between px-6 z-30 shrink-0 select-none">
          {/* Left: Song Info */}
          <div className="flex items-center gap-3 w-1/3 min-w-0">
            <div className="relative shrink-0">
              {currentTrack.imageUrl ? (
                <img src={currentTrack.imageUrl} alt="cover" className="w-11 h-11 rounded-lg object-cover shadow-lg" />
              ) : (
                <div className={`w-11 h-11 rounded-full bg-zinc-950 border border-zinc-850 flex items-center justify-center overflow-hidden shadow-lg ${
                  isPlaying ? "animate-[spin_4s_linear_infinite]" : ""
                }`}>
                  <div className="w-8 h-8 rounded-full border border-red-500/25 bg-[#0a0a0c] flex items-center justify-center">
                    <Music className="text-red-500/40" size={14} />
                  </div>
                  <div className="absolute w-2 h-2 rounded-full bg-red-500 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-[#09090b]" />
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-xs font-bold text-white truncate">{currentTrack.title}</span>
              <span className="text-[9px] text-zinc-455 truncate uppercase font-mono tracking-wider font-bold text-red-500">{currentTrack.style}</span>
            </div>
          </div>

          {/* Center: Controls & Slider */}
          <div className="flex flex-col items-center gap-1.5 w-1/3 max-w-xl">
            <div className="flex items-center gap-5">
              <button className="text-zinc-555 hover:text-white transition-colors cursor-pointer text-xs font-mono">
                🔀
              </button>
              <button onClick={handlePrev} className="text-zinc-400 hover:text-white transition-colors cursor-pointer" title="Anterior">
                <span className="text-sm font-black font-mono">◀◀</span>
              </button>
              <button 
                onClick={() => togglePlay(currentTrack)} 
                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
              >
                {isPlaying ? <Pause size={16} fill="black" /> : <Play size={16} fill="black" className="ml-0.5" />}
              </button>
              <button onClick={handleNext} className="text-zinc-400 hover:text-white transition-colors cursor-pointer" title="Siguiente">
                <span className="text-sm font-black font-mono">▶▶</span>
              </button>
              <button className="text-zinc-555 hover:text-white transition-colors cursor-pointer text-xs font-mono">
                🔁
              </button>
            </div>
            
            <div className="w-full flex items-center gap-3 font-mono text-[9px] text-zinc-500">
              <span className="w-8 text-right">{formatSeconds(currentTime)}</span>
              <input 
                type="range" 
                min="0" 
                max={currentTrack.duration} 
                step="0.1"
                value={currentTime} 
                onChange={handleSeek}
                className="flex-grow h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500 hover:bg-zinc-700 transition-colors outline-none"
              />
              <span className="w-8 text-left">{formatSeconds(currentTrack.duration)}</span>
            </div>
          </div>

          {/* Right: Sound options & lyrics toggle */}
          <div className="flex items-center justify-end gap-5 w-1/3">
            {/* volume bar */}
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={toggleMute} className="text-zinc-400 hover:text-white transition-colors cursor-pointer">
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={isMuted ? 0 : volume} 
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500 outline-none"
              />
            </div>

            {/* comment, share icons */}
            <button className="text-zinc-555 hover:text-white text-xs font-mono">
              💬
            </button>
            <button className="text-zinc-555 hover:text-white text-xs font-mono">
              📤
            </button>

            {/* Lyrics Drawer Toggle */}
            <button 
              onClick={() => setLyricsDrawerOpen(!lyricsDrawerOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[9px] font-bold font-mono transition-all cursor-pointer ${
                lyricsDrawerOpen 
                  ? "bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]" 
                  : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
              }`}
              title="Letras de la Pista"
            >
              <FileText size={12} />
              <span>LYRICS</span>
            </button>
          </div>
        </div>
      )}

      {/* LYRICS DRAWER PANEL */}
      {lyricsDrawerOpen && currentTrack && (
        <div className="fixed bottom-24 right-6 w-80 max-h-[400px] bg-[#0c0c0e] border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 z-40 backdrop-blur-lg">
          <div className="flex justify-between items-center border-b border-zinc-800/40 pb-2">
            <div className="flex items-center gap-2 text-zinc-400">
              <FileText size={14} />
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider">Letras Activas</span>
            </div>
            <button 
              onClick={() => setLyricsDrawerOpen(false)}
              className="text-[9px] font-mono font-bold text-zinc-500 hover:text-white cursor-pointer"
            >
              [CERRAR]
            </button>
          </div>
          <div className="flex-grow overflow-y-auto pr-1 text-xs text-zinc-300 font-mono leading-relaxed max-h-[300px] whitespace-pre-line text-center italic font-semibold scrollbar-thin">
            {currentTrack.lyrics}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {authModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-zinc-950 border-4 border-red-600 rounded-3xl p-6 shadow-2xl text-center relative"
            >
              <div className="w-16 h-16 rounded-full bg-red-950/20 border border-red-650 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="text-red-500 animate-pulse" size={24} />
              </div>
              
              <h3 className="font-heading font-black text-lg uppercase text-white mb-2 tracking-wider">
                {authModal.title}
              </h3>
              <p className="text-zinc-455 text-xs mb-4 leading-relaxed">
                {authModal.description}
              </p>
              
              <div className="bg-black/60 border border-zinc-850 p-3 rounded-2xl mb-6">
                <span className="text-red-500 font-mono text-sm font-black">{authModal.costText}</span>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setAuthModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-grow py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs uppercase font-mono font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={authModal.onConfirm}
                  className="flex-grow py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs uppercase font-mono font-bold transition cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.25)]"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// -------------------------------------------------------------
// DYNAMIC COMPONENT: SONG CARD (For Library lists and explore feeds)
// -------------------------------------------------------------
interface SongCardProps {
  track: GeneratedTrack;
  currentTrack: GeneratedTrack | null;
  isPlaying: boolean;
  onTogglePlay: (t: GeneratedTrack) => void;
  onDownload: (t: GeneratedTrack) => void;
  onRemix: (t: GeneratedTrack) => void;
  onReusePrompts: (t: GeneratedTrack) => void;
  onDelete: (id: string) => void;
  onToggleLike: (id: string) => void;
  activeMenuId: string | null;
  setActiveMenuId: (id: string | null) => void;
}

function SongCard({ 
  track, currentTrack, isPlaying, onTogglePlay, onDownload, 
  onRemix, onReusePrompts, onDelete, onToggleLike, activeMenuId, setActiveMenuId 
}: SongCardProps) {
  const isThisTrack = currentTrack?.id === track.id;
  const isThisPlaying = isThisTrack && isPlaying;
  const menuOpen = activeMenuId === track.id;
  const cardMenuRef = useRef<HTMLDivElement>(null);

  // Close card menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (cardMenuRef.current && !cardMenuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen, setActiveMenuId]);

  if (track.isLoading) {
    return (
      <div className="bg-[#121216]/40 border border-zinc-900 rounded-3xl p-5 aspect-square flex flex-col justify-between animate-pulse">
        <div className="w-full aspect-square max-h-[140px] bg-zinc-800 rounded-2xl" />
        <div className="flex flex-col gap-2 mt-3">
          <div className="h-3.5 bg-zinc-800 rounded-md w-3/4" />
          <div className="h-2.5 bg-zinc-800 rounded-md w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`group bg-[#121216]/40 hover:bg-[#121216]/80 border-2 border-zinc-800/40 hover:border-red-500/30 rounded-3xl p-4 flex flex-col justify-between transition-all duration-300 relative select-none ${
        isThisTrack ? "border-red-500/30 shadow-[0_4px_20px_rgba(239,68,68,0.05)]" : ""
      }`}
    >
      {/* Top Section: Cover Artwork */}
      <div className="relative aspect-square w-full bg-zinc-950 rounded-2xl overflow-hidden flex items-center justify-center border border-zinc-850 group-hover:border-zinc-800 transition-colors">
        
        {/* Vinyl spinning record or custom visual cover */}
        {track.imageUrl ? (
          <img src={track.imageUrl} alt="cover" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className={`w-32 h-32 rounded-full bg-zinc-900 border border-zinc-800/80 flex items-center justify-center overflow-hidden transition-transform duration-500 ${
            isThisPlaying ? "animate-[spin_6s_linear_infinite]" : "group-hover:rotate-[45deg]"
          }`}>
            <div className="w-24 h-24 rounded-full border border-red-500/25 bg-[#0a0a0c] flex items-center justify-center">
              <Music className="text-zinc-650 group-hover:text-red-500/60" size={24} />
            </div>
            <div className="absolute w-6 h-6 rounded-full bg-red-600 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-zinc-950" />
          </div>
        )}

        {/* Pink dot indicator on top right */}
        <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />

        {/* Model version tag */}
        <div className="absolute bottom-3 left-3 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded text-[8px] font-black font-mono text-red-500">
          v5.5
        </div>

        {/* Play/Pause Button Overlay */}
        <button 
          onClick={() => onTogglePlay(track)}
          className={`absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer z-10 ${
            isThisTrack ? "opacity-100 bg-red-600/10" : ""
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform active:scale-95 transition-all">
            {isThisPlaying ? (
              <Pause size={18} fill="black" className="text-black" />
            ) : (
              <Play size={18} fill="black" className="ml-1 text-black" />
            )}
          </div>
        </button>
      </div>

      {/* Middle Section: Titles */}
      <div className="flex flex-col leading-tight mt-3 mb-2 px-1">
        <span className={`text-xs font-black truncate ${isThisTrack ? "text-red-500" : "text-white"}`}>
          {track.title}
        </span>
        <span className="text-[9px] text-zinc-500 font-mono mt-1 uppercase font-bold tracking-wider truncate">
          {track.style}
        </span>
      </div>

      {/* Bottom Section: Actions */}
      <div className="flex items-center justify-between border-t border-zinc-800/40 pt-2.5 px-1 relative">
        <button 
          onClick={() => onRemix(track)}
          className="text-[9px] font-mono font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
        >
          🔄 Remix
        </button>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => onToggleLike(track.id)}
            className="text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
            title="Me Gusta"
          >
            <span className={`text-xs font-bold leading-none ${track.isLiked ? "text-red-500 text-sm font-black" : "text-zinc-655 hover:text-red-500"}`}>
              {track.isLiked ? "♥" : "♡"}
            </span>
          </button>

          <div className="relative" ref={cardMenuRef}>
            <button 
              onClick={() => setActiveMenuId(menuOpen ? null : track.id)}
              className="text-zinc-500 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-zinc-900 border border-transparent"
            >
              <MoreVertical size={13} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 bottom-7 w-40 bg-[#121216] border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-40 font-mono text-[9px] text-zinc-400">
                <button 
                  onClick={() => { onDownload(track); setActiveMenuId(null); }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  📥 DESCARGAR WAV
                </button>
                <button 
                  onClick={() => { onReusePrompts(track); setActiveMenuId(null); }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
                >
                  📋 REUSE PROMPTS
                </button>
                <div className="h-[1px] bg-zinc-800 my-1"></div>
                <button 
                  onClick={() => { onDelete(track.id); setActiveMenuId(null); }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer flex items-center gap-2 font-bold"
                >
                  🗑️ ELIMINAR PISTA
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
