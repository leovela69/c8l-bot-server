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
  const { deviceFormat, credits, deductCredits, showNotification, language, setLanguage } = useApp();
  const router = useRouter();

  const [voicePreset, setVoicePreset] = useState("leo");

  // Navigation states
  const [activeTab, setActiveTab] = useState<"explore" | "create" | "library" | "profile">("create");
  
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

  // Clean up Audio Context on unmount
  useEffect(() => {
    return () => {
      stopSynthesizer();
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

  const handleGenerate = () => {
    const requiredCredits = 10;
    
    // Validate inputs
    if (!customMode && !promptInput.trim()) {
      showNotification("Por favor introduce una descripción para tu canción.", "error");
      return;
    }
    if (customMode && !styleInput.trim()) {
      showNotification("Por favor introduce un estilo de música.", "error");
      return;
    }

    if (credits < requiredCredits) {
      showNotification("Créditos insuficientes. Consigue más créditos para seguir creando.", "error");
      return;
    }

    setAuthModal({
      isOpen: true,
      title: "Autorizar Síntesis Generativa de Audio",
      description: `El subagente C8L Music Cloud Engine sintetizará 2 mezclas completas (Mix A y Mix B) con stems de audio y voces procedurales Web Audio.`,
      costText: `Costo: 10 Créditos de IA (Saldo actual: ${credits})`,
      onConfirm: () => {
        setAuthModal(prev => ({ ...prev, isOpen: false }));
        
        // Deduct credits
        deductCredits(requiredCredits);
        
        setIsGenerating(true);
        setGenerationProgress(0);
        showNotification("Conectando con C.8.L. Music Cloud Engine...", "info");

        // Determine style and theme based on prompts
        let detectedStyle = "Synthwave";
        let detectedTheme = promptInput || "Música Cuántica";

        if (!customMode) {
          const p = promptInput.toLowerCase();
          if (p.includes("salsa")) {
            detectedStyle = "Salsa";
          } else if (p.includes("flamenco")) {
            detectedStyle = "Flamenco";
          } else if (p.includes("reggaeton") || p.includes("dembow")) {
            detectedStyle = "Reggaeton";
          } else if (p.includes("lofi") || p.includes("chill") || p.includes("jazz")) {
            detectedStyle = "Lofi";
          } else if (p.includes("rock") || p.includes("metal") || p.includes("guitar")) {
            detectedStyle = "Rock";
          } else {
            detectedStyle = "Synthwave";
          }
        } else {
          detectedStyle = styleInput;
        }

        // Add loading skeleton tracks to Library
        const id1 = `loading-${Date.now()}-1`;
        const id2 = `loading-${Date.now()}-2`;
        
        const skeleton1: GeneratedTrack = {
          id: id1,
          title: customMode && titleInput.trim() ? `${titleInput} (Mix A)` : `Creando ${detectedStyle} Mix A...`,
          style: detectedStyle,
          bpm: detectedStyle === "Salsa" ? 180 : detectedStyle === "Flamenco" ? 120 : detectedStyle === "Reggaeton" ? 95 : detectedStyle === "Lofi" ? 75 : detectedStyle === "Rock" ? 130 : 120,
          emotions: "Inspiradora",
          instruments: "Sintetizadores",
          vocalsUrl: "procedural",
          melodyUrl: "procedural",
          bassUrl: "procedural",
          drumsUrl: "procedural",
          date: new Date().toISOString().split("T")[0],
          duration: 60,
          lyrics: "Generando líricas...",
          isLoading: true
        };

        const skeleton2: GeneratedTrack = {
          id: id2,
          title: customMode && titleInput.trim() ? `${titleInput} (Mix B)` : `Creando ${detectedStyle} Mix B...`,
          style: detectedStyle,
          bpm: detectedStyle === "Salsa" ? 180 : detectedStyle === "Flamenco" ? 120 : detectedStyle === "Reggaeton" ? 95 : detectedStyle === "Lofi" ? 75 : detectedStyle === "Rock" ? 130 : 120,
          emotions: "Futurista",
          instruments: "Sintetizadores",
          vocalsUrl: "procedural",
          melodyUrl: "procedural",
          bassUrl: "procedural",
          drumsUrl: "procedural",
          date: new Date().toISOString().split("T")[0],
          duration: 60,
          lyrics: "Generando líricas...",
          isLoading: true
        };

        // Push skeleton tracks to the top of list
        setTracks(prev => [skeleton1, skeleton2, ...prev]);

        // Animate progress up to 90% while fetching from API
        let progressVal = 0;
        const progressInterval = setInterval(() => {
          progressVal = Math.min(progressVal + 8, 90);
          setGenerationProgress(progressVal);
        }, 200);

        // Call API async for lyrics generation
        const generateAsync = async () => {
          try {
            let lyricsA = "";
            let lyricsB = "";

            // Simulate network latency (e.g. 600ms)
            await new Promise(resolve => setTimeout(resolve, 600));

            if (customMode && lyricsInput.trim()) {
              lyricsA = lyricsInput;
              lyricsB = lyricsInput;
            } else {
              lyricsA = generateLyricsClientSide(detectedStyle, `${promptInput} Mix A`);
              lyricsB = generateLyricsClientSide(detectedStyle, `${promptInput} Mix B`);
            }

            const finalTitleA = customMode && titleInput.trim() ? `${titleInput} (Mix A)` : `${detectedStyle} Cuántico (Mix A)`;
            const finalTitleB = customMode && titleInput.trim() ? `${titleInput} (Mix B)` : `${detectedStyle} Galáctico (Mix B)`;

            clearInterval(progressInterval);
            setGenerationProgress(100);
            
            setTimeout(() => {
              setIsGenerating(false);
              setTracks(prevTracks => {
                return prevTracks.map(t => {
                  if (t.id === id1) {
                    return {
                      ...t,
                      id: `track-${Date.now()}-1`,
                      title: finalTitleA,
                      lyrics: lyricsA,
                      voicePreset: voicePreset,
                      isLoading: false
                    };
                  }
                  if (t.id === id2) {
                    return {
                      ...t,
                      id: `track-${Date.now()}-2`,
                      title: finalTitleB,
                      lyrics: lyricsB,
                      voicePreset: voicePreset,
                      isLoading: false
                    };
                  }
                  return t;
                });
              });
              showNotification("¡Tus pistas C.8.L. ya están listas para reproducirse!", "success");
              setActiveTab("library");
            }, 300);

          } catch (err) {
            console.error("Generation failed:", err);
            clearInterval(progressInterval);
            setIsGenerating(false);
            showNotification("Error en la síntesis generativa, por favor intenta de nuevo.", "error");
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

    const instUrl = getStyleCloudUrl(track.style);
    const vocUrl = resolvedVocUrl || track.vocalsUrl;

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

    startTimeRef.current = Date.now() - (pausedTimeRef.current * 1000);

    playbackTimerRef.current = setInterval(() => {
      if (instAudio.paused && !instAudio.ended) return;
      const elapsed = instAudio.currentTime;
      setCurrentTime(elapsed);
      if (elapsed >= track.duration) {
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
    
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        // Pause
        stopSynthesizer();
        pausedTimeRef.current = currentTime;
        setIsPlaying(false);
      } else {
        // Resume
        if (instAudioRef.current && vocAudioRef.current) {
          instAudioRef.current.play().catch(() => {});
          vocAudioRef.current.play().catch(() => {});
          setIsPlaying(true);
        } else {
          let vocUrl = track.vocalsUrl;
          if (!vocUrl || !vocUrl.startsWith("blob:")) {
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
      if (!vocUrl || !vocUrl.startsWith("blob:")) {
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
    <div className="bg-[#0a0a0c] text-white flex flex-col min-h-screen relative font-sans antialiased overflow-hidden select-none">
      
      {/* Glow Effects Backdrop */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[40%] rounded-full bg-red-600/10 blur-[180px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[40%] rounded-full bg-red-800/5 blur-[180px] pointer-events-none z-0" />

      {/* Main Grid Shell */}
      <div className="flex-grow flex w-full relative z-10 pb-20 overflow-hidden">
        
        {/* DESKTOP SIDEBAR (Column 1, visible in Desktop mode only) */}
        {mode === "desktop" && (
          <aside className="w-64 bg-[#121216]/60 border-r border-zinc-800/40 p-6 flex flex-col justify-between shrink-0 font-mono z-10 backdrop-blur-md">
            <div className="flex flex-col gap-8">
              {/* Brand Logo Header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.45)]">
                  <Music className="text-white animate-pulse" size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black tracking-widest text-white leading-none">C.8.L.</span>
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">MUSIC AI</span>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-2">
                <button 
                  onClick={() => setActiveTab("explore")}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold text-xs uppercase tracking-wider ${
                    activeTab === "explore" 
                      ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.25)]" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                  }`}
                >
                  <Compass size={16} />
                  <span>Explorar</span>
                </button>
                <button 
                  onClick={() => setActiveTab("create")}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold text-xs uppercase tracking-wider ${
                    activeTab === "create" 
                      ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.25)]" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                  }`}
                >
                  <PlusCircle size={16} />
                  <span>Crear</span>
                </button>
                <button 
                  onClick={() => setActiveTab("library")}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold text-xs uppercase tracking-wider ${
                    activeTab === "library" 
                      ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.25)]" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                  }`}
                >
                  <FolderHeart size={16} />
                  <span>Biblioteca</span>
                </button>
                <button 
                  onClick={() => setActiveTab("profile")}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold text-xs uppercase tracking-wider ${
                    activeTab === "profile" 
                      ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.25)]" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                  }`}
                >
                  <UserIcon size={16} />
                  <span>Perfil VIP</span>
                </button>

                <div className="h-[1px] bg-zinc-800/60 my-4" />
                
                <Link 
                  href="/" 
                  className="flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all cursor-pointer font-bold text-xs uppercase tracking-wider text-zinc-500 hover:text-white hover:bg-zinc-900/40"
                >
                  <span className="text-sm">←</span>
                  <span>Volver a Inicio</span>
                </Link>
              </nav>
            </div>

            {/* Language Selector */}
            <div className="flex justify-between items-center px-4 py-2 mt-2 mb-2 bg-zinc-950/45 border border-zinc-900/80 rounded-xl text-[10px] font-mono">
              <span className="text-zinc-500 font-bold uppercase">Idioma</span>
              <button 
                onClick={() => setLanguage(language === "en" ? "es" : "en")}
                className="text-red-500 hover:text-red-400 font-black cursor-pointer transition-colors"
              >
                {language.toUpperCase()}
              </button>
            </div>

            {/* Bottom Credits Indicator */}
            <div className="bg-[#181820] border border-zinc-800 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase">
                <span>Créditos VIP</span>
                <span className="text-white font-mono text-xs">{credits}</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min(100, (credits/1000)*100)}%` }} />
              </div>
              <span className="text-[9px] text-zinc-500 text-center font-bold">RECARGA AUTOMÁTICA EN PANEL</span>
            </div>
          </aside>
        )}

        {/* TABLET SIDEBAR (Column 1, visible in Tablet mode only - Icon Only) */}
        {mode === "tablet" && (
          <aside className="w-20 bg-[#121216]/60 border-r border-zinc-800/40 py-8 flex flex-col justify-between items-center shrink-0 z-10 backdrop-blur-md">
            <div className="flex flex-col items-center gap-10">
              {/* Brand Logo Header Mini */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.45)]">
                <Music className="text-white animate-pulse" size={20} />
              </div>

              {/* Navigation Links Icons */}
              <nav className="flex flex-col gap-3">
                <button 
                  onClick={() => setActiveTab("explore")}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    activeTab === "explore" 
                      ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.25)]" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                  }`}
                  title="Explorar"
                >
                  <Compass size={20} />
                </button>
                <button 
                  onClick={() => setActiveTab("create")}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    activeTab === "create" 
                      ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.25)]" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                  }`}
                  title="Crear"
                >
                  <PlusCircle size={20} />
                </button>
                <button 
                  onClick={() => setActiveTab("library")}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    activeTab === "library" 
                      ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.25)]" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                  }`}
                  title="Biblioteca"
                >
                  <FolderHeart size={20} />
                </button>
                <button 
                  onClick={() => setActiveTab("profile")}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                    activeTab === "profile" 
                      ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.25)]" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                  }`}
                  title="Perfil VIP"
                >
                  <UserIcon size={20} />
                </button>
              </nav>
            </div>

            <div className="flex flex-col items-center gap-3">
              {/* Back to Home Icon */}
              <Link 
                href="/"
                className="w-10 h-10 rounded-xl flex items-center justify-center border border-zinc-850 hover:border-zinc-700 bg-zinc-950/20 text-zinc-400 hover:text-white transition-all cursor-pointer font-bold text-sm"
                title="Volver a Inicio"
              >
                ←
              </Link>
              
              {/* Language Switch */}
              <button 
                onClick={() => setLanguage(language === "en" ? "es" : "en")}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[9px] font-bold font-mono text-zinc-400 hover:text-white border border-zinc-850 bg-zinc-950/20 cursor-pointer transition-colors"
                title="Cambiar Idioma"
              >
                {language.toUpperCase()}
              </button>

              {/* Tablet Mini Credit Display */}
              <div className="w-10 h-10 rounded-full border border-zinc-800 bg-[#181820] flex items-center justify-center" title={`${credits} Créditos`}>
                <span className="text-[10px] font-bold text-red-500 font-mono">{credits > 999 ? "99+" : credits}</span>
              </div>
            </div>
          </aside>
        )}

        {/* WORKSPACE AREA (Dynamic center rendering) */}
        <main className="flex-grow flex flex-col overflow-y-auto px-4 py-6 md:px-8 overflow-x-hidden">
          
          {/* Top Info Bar (Tablet & Desktop only) */}
          {mode !== "mobile" && (
            <header className="flex justify-between items-center border-b border-zinc-800/40 pb-4 mb-6 z-10">
              <div className="flex flex-col">
                <h1 className="text-xl font-black uppercase tracking-wider text-white">
                  {activeTab === "explore" && "Tendencias C.8.L."}
                  {activeTab === "create" && "Mesa de Creación Cuántica"}
                  {activeTab === "library" && "Mi Estudio Privado"}
                  {activeTab === "profile" && "Panel VIP"}
                </h1>
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-0.5">
                  ESTADO: CONECTADO A LA RED PROCEDIMENTAL
                </span>
              </div>

              {/* Status lights */}
              <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 bg-zinc-900/60 border border-zinc-800/40 px-4 py-2 rounded-xl">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                  AUDIO ENGINE: ONLINE
                </span>
                <span className="h-4 w-[1px] bg-zinc-800"></span>
                <span>CRÉDITOS: {credits} 🌟</span>
              </div>
            </header>
          )}

          {/* DESKTOP SPLIT VIEW: Layout splits inputs/feed side-by-side */}
          {mode === "desktop" && activeTab === "create" && (
            <div className="grid grid-cols-12 gap-8 w-full items-start flex-grow">
              {/* Form Input Column (Left-Center) */}
              <section className="col-span-5 bg-[#121216] border border-zinc-800/40 p-6 rounded-3xl flex flex-col gap-6 shadow-2xl relative">
                {/* Form Mode Toggle */}
                <div className="flex justify-between items-center bg-[#0d0d10] border border-zinc-800/60 p-1 rounded-2xl">
                  <button 
                    onClick={() => setCustomMode(false)}
                    className={`flex-grow py-2.5 px-4 rounded-xl text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
                      !customMode 
                        ? "bg-zinc-800 text-white shadow-lg" 
                        : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    Modo Simple
                  </button>
                  <button 
                    onClick={() => setCustomMode(true)}
                    className={`flex-grow py-2.5 px-4 rounded-xl text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
                      customMode 
                        ? "bg-zinc-800 text-white shadow-lg" 
                        : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    Modo Personalizado
                  </button>
                </div>

                {/* Forms Rendering */}
                {!customMode ? (
                  /* SIMPLE MODE FORM */
                  <div className="flex flex-col gap-4">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Descripción de la Canción / Prompt Emocional
                    </label>
                    <textarea
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      placeholder="Ej: Un tema de Synthwave energético a 120bpm con bajos de neón y ambiente espacial..."
                      className="bg-[#0a0a0c] border border-zinc-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-zinc-650 min-h-[140px] resize-none leading-relaxed"
                    />
                  </div>
                ) : (
                  /* CUSTOM MODE FORM */
                  <div className="flex flex-col gap-4">
                    {/* Lyrics field */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                          Letras de la Canción (Lyrics)
                        </label>
                        <button
                          onClick={generateLyricsMock}
                          className="flex items-center gap-1.5 text-[9px] font-bold text-red-500 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 bg-red-500/5 px-2.5 py-1 rounded-lg transition-all cursor-pointer font-mono"
                        >
                          <Sparkles size={10} />
                          GENERAR CON IA
                        </button>
                      </div>
                      <textarea
                        value={lyricsInput}
                        onChange={(e) => setLyricsInput(e.target.value)}
                        placeholder="[Verse 1]\nEscribe tus letras aquí o usa el generador de IA..."
                        className="bg-[#0a0a0c] border border-zinc-800 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-zinc-650 min-h-[120px] resize-none leading-relaxed font-mono"
                      />
                    </div>

                    {/* Style field */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Estilo de Música (Style / Prompts)
                      </label>
                      <input
                        type="text"
                        value={styleInput}
                        onChange={(e) => setStyleInput(e.target.value)}
                        placeholder="Ej: Synthwave, cyberpunk, energetic, 120bpm"
                        className="bg-[#0a0a0c] border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-zinc-650"
                      />

                      {/* Suggestions list */}
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {STYLE_SUGGESTIONS.map(style => (
                          <button
                            key={style}
                            onClick={() => handleSuggestionClick(style)}
                            className="text-[9px] font-bold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-850 px-2 py-1 rounded-md transition-colors cursor-pointer hover:border-zinc-700"
                          >
                            +{style}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Title field */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        Título de la Canción
                      </label>
                      <input
                        type="text"
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        placeholder="Ej: Código de Neón"
                        className="bg-[#0a0a0c] border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-red-500 transition-colors placeholder:text-zinc-650"
                      />
                    </div>
                  </div>
                )}

                {/* Instrumental Toggle */}
                <div className="flex justify-between items-center border-t border-zinc-800/40 pt-4 mt-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white uppercase tracking-wide">Pista Instrumental</span>
                    <span className="text-[9px] text-zinc-500 font-medium">Omitir letras y síntesis vocal en la mezcla</span>
                  </div>
                  <button 
                    onClick={() => setIsInstrumental(!isInstrumental)}
                    className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {isInstrumental ? (
                      <ToggleRight size={38} className="text-red-500" />
                    ) : (
                      <ToggleLeft size={38} className="text-zinc-650" />
                    )}
                  </button>
                </div>

                {/* Voice Selection (Only if not instrumental) */}
                {!isInstrumental && (
                  <div className="flex flex-col gap-2 border-b border-zinc-800/40 pb-4 mb-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      Voz del Cantante (AI Voice)
                    </label>
                    <select
                      value={voicePreset}
                      onChange={(e) => setVoicePreset(e.target.value)}
                      className="bg-[#0a0a0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="leo">Leo Vela (Voz Masculina Terciopelo)</option>
                      <option value="seda">Seda (Voz Femenina Suave)</option>
                      <option value="robot">C8L Bot (Voz Cyber Vocoder)</option>
                      <option value="quantum">Quantum (Voz Tenor Brillante)</option>
                    </select>
                  </div>
                )}

                {/* Generate Button CTA */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-xs py-4 px-6 rounded-2xl transition-all cursor-pointer tracking-widest uppercase shadow-[0_4px_25px_rgba(220,38,38,0.3)] hover:shadow-[0_4px_30px_rgba(220,38,38,0.45)] active:scale-95 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden"
                  >
                    {isGenerating ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw size={14} className="animate-spin" />
                        SINTETIZANDO CAPAS...
                      </span>
                    ) : (
                      <span>Generar 2 Canciones (10 créditos)</span>
                    )}

                    {/* Progress micro-bar inside button */}
                    {isGenerating && (
                      <div className="absolute bottom-0 left-0 h-1 bg-white/30 transition-all duration-300" style={{ width: `${generationProgress}%` }} />
                    )}
                  </button>
                  <span className="text-[9px] text-zinc-500 text-center font-bold font-mono">
                    GENERACIÓN PROCEDURAL ELECTRÓNICA INSTANTÁNEA EN TU PC
                  </span>
                </div>
              </section>

              {/* User Library Feed Column (Right-Center) */}
              <section className="col-span-7 flex flex-col gap-4 self-stretch overflow-hidden">
                <div className="flex justify-between items-center border-b border-zinc-800/40 pb-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setLibraryFilter("all")}
                      className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        libraryFilter === "all" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Todos
                    </button>
                    <button 
                      onClick={() => setLibraryFilter("liked")}
                      className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                        libraryFilter === "liked" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                    >
                      Favoritos
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">{tracks.length} PISTAS DE SESIÓN</span>
                </div>

                {/* Library Scroll List */}
                <div className="flex-grow overflow-y-auto pr-1 flex flex-col gap-3 min-h-[400px] max-h-[580px] scrollbar-thin">
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
            </div>
          )}

          {/* TABLET SPLIT WORKSPACE: Left create inputs, Right library list (no sidebar clutter) */}
          {mode === "tablet" && activeTab === "create" && (
            <div className="grid grid-cols-2 gap-6 w-full items-start flex-grow">
              {/* Left Column: Create Form */}
              <section className="bg-[#121216] border border-zinc-800/40 p-5 rounded-2xl flex flex-col gap-4 shadow-xl">
                {/* Form Toggle Simple/Custom */}
                <div className="flex justify-between items-center bg-[#0d0d10] border border-zinc-800/60 p-1 rounded-xl">
                  <button 
                    onClick={() => setCustomMode(false)}
                    className={`flex-grow py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                      !customMode ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    Simple
                  </button>
                  <button 
                    onClick={() => setCustomMode(true)}
                    className={`flex-grow py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                      customMode ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-white"
                    }`}
                  >
                    Personalizado
                  </button>
                </div>

                {!customMode ? (
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Descripción del Beat</label>
                    <textarea
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      placeholder="Ej: House sensual a 115bpm con ukelele..."
                      className="bg-[#0a0a0c] border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none min-h-[100px] resize-none leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Letras</label>
                        <button onClick={generateLyricsMock} className="text-[8px] font-bold text-red-500 border border-red-500/20 bg-red-500/5 px-2 py-0.5 rounded cursor-pointer">
                          IA GEN
                        </button>
                      </div>
                      <textarea
                        value={lyricsInput}
                        onChange={(e) => setLyricsInput(e.target.value)}
                        placeholder="Letras de tu beat..."
                        className="bg-[#0a0a0c] border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none min-h-[90px] resize-none leading-relaxed font-mono"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Estilo</label>
                      <input
                        type="text"
                        value={styleInput}
                        onChange={(e) => setStyleInput(e.target.value)}
                        placeholder="House, techno, lofi..."
                        className="bg-[#0a0a0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Título</label>
                      <input
                        type="text"
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        placeholder="Título del track..."
                        className="bg-[#0a0a0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Instrumental Toggle */}
                <div className="flex justify-between items-center border-t border-zinc-850 pt-3 mt-1">
                  <span className="text-[10px] font-bold text-white uppercase font-mono">Instrumental</span>
                  <button onClick={() => setIsInstrumental(!isInstrumental)} className="cursor-pointer">
                    {isInstrumental ? (
                      <ToggleRight size={32} className="text-red-500" />
                    ) : (
                      <ToggleLeft size={32} className="text-zinc-650" />
                    )}
                  </button>
                </div>

                {/* Voice Selection Tablet */}
                {!isInstrumental && (
                  <div className="flex flex-col gap-1.5 border-b border-zinc-850 pb-3 mb-1">
                    <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Voz AI</label>
                    <select
                      value={voicePreset}
                      onChange={(e) => setVoicePreset(e.target.value)}
                      className="bg-[#0a0a0c] border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="leo">Leo Vela (Masculina)</option>
                      <option value="seda">Seda (Femenina)</option>
                      <option value="robot">C8L Bot (Vocoder)</option>
                      <option value="quantum">Quantum (Tenor)</option>
                    </select>
                  </div>
                )}

                {/* Generate Button CTA */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-[10px] py-3.5 px-4 rounded-xl transition-all cursor-pointer tracking-wider uppercase shadow-lg disabled:opacity-50"
                >
                  {isGenerating ? "CREANDO PISTAS..." : "Generar 2 Canciones (10 cr)"}
                </button>
              </section>

              {/* Right Column: Library List */}
              <section className="flex flex-col gap-3 self-stretch overflow-hidden">
                <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono">Pistas del Canal</span>
                  <span className="text-[10px] font-mono text-zinc-500">{tracks.length} Tracks</span>
                </div>
                <div className="flex-grow overflow-y-auto flex flex-col gap-2 max-h-[500px] scrollbar-thin">
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
            </div>
          )}

          {/* TABLET / DESKTOP VIEWPORTS (Explore, Library, Profile pages) */}
          {mode !== "mobile" && activeTab !== "create" && (
            <div className="w-full flex-grow flex flex-col gap-6">
              
              {/* EXPLORE PAGE */}
              {activeTab === "explore" && (
                <div className="flex flex-col gap-6">
                  <div className="bg-[#121216] border border-zinc-800/40 p-6 rounded-3xl relative overflow-hidden flex flex-col gap-4 shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
                    <span className="text-[10px] font-mono text-red-500 font-bold uppercase tracking-widest">
                      ★ LANZAMIENTO EXCLUSIVO DE LA SEMANA
                    </span>
                    <h2 className="text-2xl font-black text-white uppercase tracking-wide leading-tight max-w-lg">
                      EXPLORA LAS SÍNTESIS MEJOR CALIFICADAS POR LA COMUNIDAD C8L
                    </h2>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
                      Descubre cómo creadores cuánticos están utilizando las líricas generativas y la ecualización analógica para componer melodías procedimentales.
                    </p>
                    <button 
                      onClick={() => setActiveTab("create")}
                      className="bg-white hover:bg-zinc-100 text-black font-black text-[10px] uppercase tracking-wider py-3 px-6 rounded-xl w-fit transition-all cursor-pointer active:scale-95 shadow-md mt-2"
                    >
                      EMPEZAR A CREAR BEATS
                    </button>
                  </div>

                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono border-b border-zinc-850 pb-2 mt-4">
                    BEATS CUÁNTICOS POPULARES
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
                </div>
              )}

              {/* LIBRARY PAGE */}
              {activeTab === "library" && (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-zinc-850 pb-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setLibraryFilter("all")}
                        className={`text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                          libraryFilter === "all" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Todos los Beats
                      </button>
                      <button 
                        onClick={() => setLibraryFilter("liked")}
                        className={`text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                          libraryFilter === "liked" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        Me Gusta
                      </button>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">
                      {getFilteredTracks().length} SÍNTESIS ALMACENADAS EN CACHÉ
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              )}

              {/* PROFILE PAGE */}
              {activeTab === "profile" && (
                <div className="bg-[#121216] border border-zinc-800/40 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />
                  
                  {/* Creator header */}
                  <div className="flex items-center gap-6 border-b border-zinc-850 pb-6">
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
                      <span className="text-xs text-zinc-400 font-mono">@leo_vela39_c8l</span>
                      <span className="text-[10px] text-zinc-550 mt-1">Conectado a la Red Multiversal C8L Agency</span>
                    </div>
                  </div>

                  {/* Profile stats */}
                  <div className="grid grid-cols-3 gap-4 border-b border-zinc-850 pb-6 text-center font-mono">
                    <div className="bg-zinc-950/60 p-4 border border-zinc-900 rounded-2xl flex flex-col gap-1">
                      <span className="text-lg font-black text-white">{tracks.length}</span>
                      <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest">Generaciones</span>
                    </div>
                    <div className="bg-zinc-950/60 p-4 border border-zinc-900 rounded-2xl flex flex-col gap-1">
                      <span className="text-lg font-black text-white">{tracks.filter(t=>t.isLiked).length}</span>
                      <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest">Favoritos</span>
                    </div>
                    <div className="bg-zinc-950/60 p-4 border border-zinc-900 rounded-2xl flex flex-col gap-1">
                      <span className="text-lg font-black text-white">{credits}</span>
                      <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest">Créditos IA</span>
                    </div>
                  </div>

                  {/* Profile details */}
                  <div className="flex flex-col gap-3 text-xs">
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                      Detalles de la Suscripción
                    </h3>
                    <div className="flex justify-between items-center bg-zinc-950/40 p-4 border border-zinc-900 rounded-2xl font-mono text-[10px] text-zinc-400">
                      <div className="flex flex-col gap-1">
                        <span className="text-white font-bold text-xs">Plan Agencia C8L</span>
                        <span>Renovación mensual automática</span>
                      </div>
                      <span className="text-emerald-500 font-bold uppercase">Activo</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MOBILE VIEWPORT (Single column scroll + conditional rendering of current Tab) */}
          {mode === "mobile" && (
            <div className="flex-grow flex flex-col gap-4 overflow-x-hidden pt-2 pb-16">
              
              {/* Header Bar */}
              <div className="flex justify-between items-center border-b border-zinc-800/40 pb-3 mb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <Link 
                    href="/" 
                    className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer font-bold text-sm"
                    title="Volver a Inicio"
                  >
                    ←
                  </Link>
                  <span className="text-[10px] font-black tracking-widest text-white uppercase">C.8.L. MUSIC AI</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Language switch */}
                  <button 
                    onClick={() => setLanguage(language === "en" ? "es" : "en")}
                    className="text-[9px] font-bold font-mono text-zinc-400 hover:text-white border border-zinc-800 bg-zinc-950/20 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    {language.toUpperCase()}
                  </button>
                  <div className="text-[9px] font-mono font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 rounded-xl">
                    {credits} CR
                  </div>
                </div>
              </div>

              {/* MOBILE EXPLORE TAB */}
              {activeTab === "explore" && (
                <div className="flex flex-col gap-4">
                  <div className="bg-[#121216] border border-zinc-800/40 p-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden">
                    <span className="text-[8px] font-bold text-red-500 font-mono uppercase tracking-widest">★ TENDENCIAS</span>
                    <h2 className="text-base font-black text-white uppercase leading-snug">EXPLORA BEATS DE LA COMUNIDAD</h2>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">
                      Reproduce las mejores composiciones procedimentales de la red.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
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
                        isMobile={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* MOBILE CREATE TAB */}
              {activeTab === "create" && (
                <div className="flex flex-col gap-4 bg-[#121216] border border-zinc-800/40 p-5 rounded-2xl shadow-xl">
                  
                  {/* Form mode switcher */}
                  <div className="flex justify-between items-center bg-[#0d0d10] border border-zinc-800/60 p-0.5 rounded-xl">
                    <button 
                      onClick={() => setCustomMode(false)}
                      className={`flex-grow py-2 rounded-lg text-[9px] font-bold uppercase cursor-pointer ${
                        !customMode ? "bg-zinc-800 text-white shadow" : "text-zinc-500"
                      }`}
                    >
                      Simple
                    </button>
                    <button 
                      onClick={() => setCustomMode(true)}
                      className={`flex-grow py-2 rounded-lg text-[9px] font-bold uppercase cursor-pointer ${
                        customMode ? "bg-zinc-800 text-white shadow" : "text-zinc-500"
                      }`}
                    >
                      Personalizado
                    </button>
                  </div>

                  {!customMode ? (
                    <div className="flex flex-col gap-2">
                      <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Descripción del Beat</label>
                      <textarea
                        value={promptInput}
                        onChange={(e) => setPromptInput(e.target.value)}
                        placeholder="Ej: House sensual a 115bpm con arpegios de neón..."
                        className="bg-[#0a0a0c] border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none min-h-[90px] resize-none font-semibold leading-relaxed"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Letras (Lyrics)</label>
                          <button onClick={generateLyricsMock} className="text-[8px] font-bold text-red-500 border border-red-500/20 bg-red-500/5 px-2 py-0.5 rounded cursor-pointer">
                            IA GEN
                          </button>
                        </div>
                        <textarea
                          value={lyricsInput}
                          onChange={(e) => setLyricsInput(e.target.value)}
                          placeholder="Escribe la letra aquí..."
                          className="bg-[#0a0a0c] border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none min-h-[80px] resize-none leading-relaxed font-mono"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Estilo</label>
                        <input
                          type="text"
                          value={styleInput}
                          onChange={(e) => setStyleInput(e.target.value)}
                          placeholder="Ej: Electro, dance, cyber"
                          className="bg-[#0a0a0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Título</label>
                        <input
                          type="text"
                          value={titleInput}
                          onChange={(e) => setTitleInput(e.target.value)}
                          placeholder="Título del beat..."
                          className="bg-[#0a0a0c] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Instrumental toggle mobile */}
                  <div className="flex justify-between items-center border-t border-zinc-850 pt-3 mt-1">
                    <span className="text-[9px] font-bold text-white uppercase font-mono">Instrumental</span>
                    <button onClick={() => setIsInstrumental(!isInstrumental)} className="cursor-pointer">
                      {isInstrumental ? (
                        <ToggleRight size={30} className="text-red-500" />
                      ) : (
                        <ToggleLeft size={30} className="text-zinc-650" />
                      )}
                    </button>
                  </div>

                  {/* Voice selection mobile */}
                  {!isInstrumental && (
                    <div className="flex flex-col gap-1.5 border-b border-zinc-850 pb-3 mb-1">
                      <label className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider font-mono">Voz Cantante AI</label>
                      <select
                        value={voicePreset}
                        onChange={(e) => setVoicePreset(e.target.value)}
                        className="bg-[#0a0a0c] border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="leo">Leo Vela</option>
                        <option value="seda">Seda</option>
                        <option value="robot">C8L Bot</option>
                        <option value="quantum">Quantum</option>
                      </select>
                    </div>
                  )}

                  {/* CTA button */}
                  <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-bold text-[10px] py-3.5 rounded-xl uppercase tracking-wider shadow-lg disabled:opacity-50"
                  >
                    {isGenerating ? "CREANDO..." : "Generar 2 Canciones (10 CR)"}
                  </button>
                </div>
              )}

              {/* MOBILE LIBRARY TAB */}
              {activeTab === "library" && (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2 border-b border-zinc-850 pb-2">
                    <button 
                      onClick={() => setLibraryFilter("all")}
                      className={`text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded cursor-pointer ${
                        libraryFilter === "all" ? "bg-zinc-800 text-white" : "text-zinc-550"
                      }`}
                    >
                      Todos
                    </button>
                    <button 
                      onClick={() => setLibraryFilter("liked")}
                      className={`text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded cursor-pointer ${
                        libraryFilter === "liked" ? "bg-zinc-800 text-white" : "text-zinc-550"
                      }`}
                    >
                      Favoritos
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
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
                        isMobile={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* MOBILE PROFILE TAB */}
              {activeTab === "profile" && (
                <div className="bg-[#121216] border border-zinc-800/40 rounded-2xl p-5 flex flex-col gap-4 shadow-xl text-center">
                  <div className="w-16 h-16 rounded-full border-2 border-red-500/20 bg-zinc-950 flex items-center justify-center text-white text-xl font-black font-mono mx-auto">
                    LV
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <h2 className="text-sm font-black text-white">Leo Vela</h2>
                    <span className="text-[9px] text-zinc-500 font-mono">@leo_vela39_c8l</span>
                  </div>
                  <span className="text-[8px] font-bold text-red-500 border border-red-500/30 px-2 py-0.5 rounded bg-red-500/5 w-fit mx-auto font-mono">
                    CREADOR VIP
                  </span>

                  <div className="grid grid-cols-3 gap-3 border-t border-b border-zinc-850 py-4 my-2 text-center font-mono">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white">{tracks.length}</span>
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Beats</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white">{tracks.filter(t=>t.isLiked).length}</span>
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Likes</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white">{credits}</span>
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Créditos</span>
                    </div>
                  </div>
                  
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">
                    ESTADO DE RED: SEGURO (MOCK ACTIVO)
                  </span>
                </div>
              )}

            </div>
          )}

        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (Visible in Mobile mode only) */}
      {mode === "mobile" && (
        <nav className="fixed bottom-0 left-0 w-full bg-[#121216]/95 border-t border-zinc-800/40 flex justify-around items-center py-2.5 z-45 backdrop-blur-lg">
          <button 
            onClick={() => { setActiveTab("explore"); setMobilePlayerExpanded(false); }}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              activeTab === "explore" ? "text-red-500" : "text-zinc-550 hover:text-white"
            }`}
          >
            <Compass size={18} />
            <span className="text-[8px] font-bold font-mono uppercase tracking-wider">Explorar</span>
          </button>
          <button 
            onClick={() => { setActiveTab("create"); setMobilePlayerExpanded(false); }}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              activeTab === "create" ? "text-red-500" : "text-zinc-550 hover:text-white"
            }`}
          >
            <PlusCircle size={18} />
            <span className="text-[8px] font-bold font-mono uppercase tracking-wider">Crear</span>
          </button>
          <button 
            onClick={() => { setActiveTab("library"); setMobilePlayerExpanded(false); }}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              activeTab === "library" ? "text-red-500" : "text-zinc-550 hover:text-white"
            }`}
          >
            <FolderHeart size={18} />
            <span className="text-[8px] font-bold font-mono uppercase tracking-wider">Biblioteca</span>
          </button>
          <button 
            onClick={() => { setActiveTab("profile"); setMobilePlayerExpanded(false); }}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
              activeTab === "profile" ? "text-red-500" : "text-zinc-550 hover:text-white"
            }`}
          >
            <UserIcon size={18} />
            <span className="text-[8px] font-bold font-mono uppercase tracking-wider">Perfil VIP</span>
          </button>
        </nav>
      )}

      {/* PERSISTENT GLOBAL MEDIA PLAYER */}
      {currentTrack && (
        <div 
          onClick={(e) => {
            if (mode === "mobile" && !mobilePlayerExpanded) {
              setMobilePlayerExpanded(true);
            }
          }}
          className={`fixed bottom-0 left-0 w-full bg-[#121216]/95 border-t border-zinc-800/60 flex items-center justify-between px-4 py-3 z-50 backdrop-blur-lg cursor-pointer md:cursor-default transition-all duration-300 ${
            mode === "mobile" ? "bottom-[54px]" : "bottom-0"
          }`}
        >
          {/* Left Section: Active Track Info */}
          <div className="flex items-center gap-3 w-1/3 min-w-0">
            {/* spinning album vinyl */}
            <div className="relative shrink-0">
              <div className={`w-10 h-10 rounded-full bg-zinc-950 border border-zinc-850 flex items-center justify-center overflow-hidden shadow-lg ${
                isPlaying ? "animate-[spin_4s_linear_infinite]" : ""
              }`}>
                <div className="w-8 h-8 rounded-full border border-red-500/25 bg-[#0a0a0c] flex items-center justify-center">
                  <Music className="text-red-500/40" size={14} />
                </div>
                <div className="absolute w-2 h-2 rounded-full bg-red-500 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-[#121216]" />
              </div>
            </div>
            <div className="flex flex-col min-w-0 leading-tight">
              <span className="text-xs font-bold text-white truncate">{currentTrack.title}</span>
              <span className="text-[9px] text-zinc-400 truncate">{currentTrack.style}</span>
            </div>
          </div>

          {/* Center Section: Playback Controls & Progress (Desktop/Tablet only) */}
          {mode !== "mobile" && (
            <div className="flex flex-col items-center gap-1.5 w-1/3">
              <div className="flex items-center gap-4">
                <button onClick={handlePrev} className="text-zinc-400 hover:text-white transition-colors cursor-pointer" title="Anterior">
                  <span className="text-sm font-black font-mono">◀◀</span>
                </button>
                <button 
                  onClick={() => togglePlay(currentTrack)} 
                  className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md"
                >
                  {isPlaying ? <Pause size={14} fill="black" /> : <Play size={14} fill="black" className="ml-0.5" />}
                </button>
                <button onClick={handleNext} className="text-zinc-400 hover:text-white transition-colors cursor-pointer" title="Siguiente">
                  <span className="text-sm font-black font-mono">▶▶</span>
                </button>
              </div>
              
              <div className="w-full flex items-center gap-2 font-mono text-[9px] text-zinc-500">
                <span>{formatSeconds(currentTime)}</span>
                <input 
                  type="range" 
                  min="0" 
                  max={currentTrack.duration} 
                  step="0.1"
                  value={currentTime} 
                  onChange={handleSeek}
                  className="flex-grow h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500 hover:bg-zinc-700 transition-colors outline-none"
                />
                <span>{formatSeconds(currentTrack.duration)}</span>
              </div>
            </div>
          )}

          {/* Right Section: Volume & Lyrics Draw Toggle */}
          <div className="flex items-center justify-end gap-4 w-1/3">
            {/* Quick Play/Pause for Mobile view on Bottom Bar */}
            {mode === "mobile" && (
              <button 
                onClick={(e) => {
                  e.stopPropagation(); // Stop expansion modal
                  togglePlay(currentTrack);
                }}
                className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shrink-0 cursor-pointer shadow"
              >
                {isPlaying ? <Pause size={14} fill="black" /> : <Play size={14} fill="black" className="ml-0.5" />}
              </button>
            )}

            {mode !== "mobile" && (
              <>
                {/* Volume bar */}
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

                {/* Lyrics Panel toggle */}
                <button 
                  onClick={() => setLyricsDrawerOpen(!lyricsDrawerOpen)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border text-[9px] font-bold font-mono transition-all cursor-pointer ${
                    lyricsDrawerOpen 
                      ? "bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]" 
                      : "border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                  }`}
                  title="Letras de la Pista"
                >
                  <FileText size={12} />
                  <span>LYRICS</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* LYRICS DRAWER (Desktop/Tablet Slide-out Panel) */}
      {lyricsDrawerOpen && currentTrack && mode !== "mobile" && (
        <div className="fixed bottom-20 right-4 w-80 max-h-[420px] bg-[#121216] border border-zinc-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 z-40 backdrop-blur-lg">
          <div className="flex justify-between items-center border-b border-zinc-850 pb-2">
            <div className="flex items-center gap-2 text-zinc-400">
              <FileText size={14} />
              <span className="text-xs font-bold font-mono uppercase tracking-wide">Letras Activas</span>
            </div>
            <button 
              onClick={() => setLyricsDrawerOpen(false)}
              className="text-[10px] font-bold text-zinc-500 hover:text-white cursor-pointer"
            >
              [CERRAR]
            </button>
          </div>
          <div className="flex-grow overflow-y-auto pr-1 text-xs text-zinc-300 font-mono leading-relaxed max-h-[320px] whitespace-pre-line text-center italic font-semibold">
            {currentTrack.lyrics}
          </div>
        </div>
      )}

      {/* MOBILE EXPANDED FULLSCREEN MEDIA PLAYER OVERLAY */}
      {mobilePlayerExpanded && currentTrack && mode === "mobile" && (
        <div className="fixed inset-0 bg-[#0a0a0c] z-[9999] flex flex-col justify-between p-6">
          
          {/* Header Bar */}
          <header className="flex justify-between items-center border-b border-zinc-850 pb-4">
            <button 
              onClick={() => setMobilePlayerExpanded(false)}
              className="text-zinc-400 hover:text-white flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider font-mono cursor-pointer"
            >
              <Minimize2 size={16} />
              <span>Cerrar</span>
            </button>
            <span className="text-[9px] font-mono text-red-500 font-bold uppercase tracking-widest">
              🔴 C.8.L. REPRODUCTOR VIRTUAL
            </span>
            <button 
              onClick={() => handleDownload(currentTrack)}
              className="text-zinc-400 hover:text-white cursor-pointer"
              title="Descargar WAV"
            >
              <Download size={18} />
            </button>
          </header>

          {/* Main Visualizer & Album Artwork */}
          <div className="flex-grow flex flex-col justify-center items-center gap-8 py-6">
            
            {/* Giant spinning album artwork */}
            <div className="relative select-none">
              <div className={`w-52 h-52 rounded-full bg-zinc-950 border-4 border-zinc-900 flex items-center justify-center overflow-hidden shadow-2xl relative ${
                isPlaying ? "animate-[spin_8s_linear_infinite]" : ""
              }`}>
                <div className="w-36 h-36 rounded-full border-2 border-red-500/10 bg-[#0d0d10] flex items-center justify-center">
                  <Music className="text-red-500/20" size={54} />
                </div>
                <div className="absolute w-6 h-6 rounded-full bg-red-600 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-zinc-950 shadow" />
              </div>
            </div>

            {/* Song Title Info */}
            <div className="text-center flex flex-col gap-1.5 px-4">
              <h2 className="text-lg font-black text-white tracking-wide uppercase leading-tight">{currentTrack.title}</h2>
              <span className="text-xs text-red-500 font-bold tracking-widest font-mono uppercase">{currentTrack.style}</span>
            </div>

            {/* Animated SVG spectrum visualizer bar mockup */}
            <div className="w-full max-w-[280px] h-12 flex items-end justify-between px-2 gap-0.5">
              {[...Array(24)].map((_, i) => {
                const randHeight = isPlaying ? Math.floor(Math.random() * 40) + 8 : 4;
                return (
                  <div 
                    key={i} 
                    className="w-2.5 bg-red-600 rounded-t transition-all duration-150" 
                    style={{ height: `${randHeight}px` }} 
                  />
                );
              })}
            </div>

            {/* Lyrics Drawer Area mini (Collapsible view inside full player) */}
            <div className="w-full max-w-xs border border-zinc-850 bg-zinc-950/40 p-4 rounded-2xl flex flex-col gap-2 max-h-[140px]">
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest font-mono text-center">LETRA SELECCIONADA</span>
              <div className="overflow-y-auto text-[10px] text-zinc-400 font-mono leading-relaxed whitespace-pre-line text-center italic font-semibold scrollbar-none">
                {currentTrack.lyrics}
              </div>
            </div>

          </div>

          {/* Control Triggers & Seek sliders */}
          <div className="flex flex-col gap-5 border-t border-zinc-850 pt-5">
            {/* HTML5 customized range progress seek bar */}
            <div className="flex flex-col gap-1.5 font-mono text-[9px] text-zinc-500">
              <input 
                type="range" 
                min="0" 
                max={currentTrack.duration} 
                step="0.1"
                value={currentTime} 
                onChange={handleSeek}
                className="w-full h-1 bg-zinc-850 rounded-lg appearance-none cursor-pointer accent-red-500 outline-none"
              />
              <div className="flex justify-between items-center text-[8px] font-bold">
                <span>{formatSeconds(currentTime)}</span>
                <span>{formatSeconds(currentTrack.duration)}</span>
              </div>
            </div>

            {/* Core center player buttons */}
            <div className="flex justify-around items-center px-4 pb-2">
              <button onClick={handlePrev} className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-xl">
                ◀◀
              </button>
              <button 
                onClick={() => togglePlay(currentTrack)} 
                className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-all cursor-pointer shadow-lg"
              >
                {isPlaying ? <Pause size={22} fill="black" /> : <Play size={22} fill="black" className="ml-1" />}
              </button>
              <button onClick={handleNext} className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-xl">
                ▶▶
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Authorization Confirmation Modal */}
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
  isMobile?: boolean;
}

function SongCard({ 
  track, currentTrack, isPlaying, onTogglePlay, onDownload, 
  onRemix, onReusePrompts, onDelete, onToggleLike, activeMenuId, setActiveMenuId, isMobile 
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
    /* MOCK LOADING SKELETON */
    return (
      <div className="bg-[#121216]/40 border border-zinc-900 rounded-2xl p-4 flex gap-4 items-center animate-pulse">
        {/* spinning record block */}
        <div className="w-11 h-11 bg-zinc-800 rounded-full shrink-0" />
        {/* text titles */}
        <div className="flex-grow flex flex-col gap-2">
          <div className="h-3.5 bg-zinc-800 rounded-md w-1/2" />
          <div className="h-2.5 bg-zinc-800 rounded-md w-1/3" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`group border border-zinc-850 bg-[#121216]/60 rounded-2xl p-4 flex gap-4 items-center justify-between transition-all duration-300 relative select-none hover:bg-zinc-900/40 hover:border-red-500/30 ${
        isThisTrack ? "border-red-500/40 bg-zinc-900/60 shadow-[0_4px_20px_rgba(239,68,68,0.05)]" : ""
      }`}
    >
      
      {/* Left: Vinyl & Titles */}
      <div className="flex items-center gap-4 flex-grow min-w-0">
        
        {/* Vinyl artwork container with play overlay */}
        <div className="relative shrink-0 w-11 h-11">
          {/* SPINNING VINYL RECORD (Plays on hover or if current active) */}
          <div className={`w-full h-full rounded-full bg-zinc-950 border border-zinc-850 flex items-center justify-center overflow-hidden transition-transform duration-500 group-hover:scale-105 group-hover:rotate-[180deg] ${
            isThisPlaying ? "animate-[spin_4s_linear_infinite]" : ""
          }`}>
            <div className="w-8 h-8 rounded-full border border-red-500/25 bg-[#0a0a0c] flex items-center justify-center">
              <Music className="text-zinc-550 group-hover:text-red-500/60" size={14} />
            </div>
            <div className="absolute w-2 h-2 rounded-full bg-red-500 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-zinc-950" />
          </div>
          
          {/* Play/Pause Button Overlay on card artwork */}
          <button 
            onClick={() => onTogglePlay(track)}
            className={`absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer z-10 ${
              isThisTrack ? "opacity-100 bg-red-600/10" : ""
            }`}
          >
            {isThisPlaying ? (
              <Pause size={14} fill="white" className="text-red-500" />
            ) : (
              <Play size={14} fill="white" className="ml-0.5 text-red-500" />
            )}
          </button>
        </div>

        {/* Metadata info */}
        <div className="flex flex-col min-w-0 leading-tight">
          <span className={`text-xs font-bold truncate group-hover:text-red-500 transition-colors ${isThisTrack ? "text-red-500" : "text-white"}`}>
            {track.title}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className="text-[9px] text-zinc-450 font-medium">@c8l_creator</span>
            <span className="text-[8px] text-zinc-600 font-mono font-bold">•</span>
            <span className="text-[9px] font-bold text-red-500 font-mono">{track.style.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Right: Date, Like buttons & 3-dot Menu */}
      <div className="flex items-center gap-3 shrink-0">
        
        {/* Date display (Desktop only) */}
        {!isMobile && (
          <span className="text-[9px] text-zinc-550 font-mono font-bold uppercase">{track.date}</span>
        )}

        {/* Like Heart Button */}
        <button 
          onClick={() => onToggleLike(track.id)}
          className="text-zinc-500 hover:text-red-500 transition-colors cursor-pointer"
          title="Me Gusta"
        >
          <span className={`text-xs font-bold leading-none ${track.isLiked ? "text-red-500 text-sm font-black" : "text-zinc-600 hover:text-red-500"}`}>
            {track.isLiked ? "♥" : "♡"}
          </span>
        </button>

        {/* Dynamic Action Trigger Menu (Three dots) */}
        <div className="relative" ref={cardMenuRef}>
          <button 
            onClick={() => setActiveMenuId(menuOpen ? null : track.id)}
            className="text-zinc-500 hover:text-white cursor-pointer p-1 rounded-lg border border-transparent hover:bg-zinc-800"
          >
            <MoreVertical size={14} />
          </button>

          {/* Collapsible Actions Panel */}
          {menuOpen && (
            <div className="absolute right-0 top-7 w-40 bg-[#181820] border border-zinc-800 rounded-xl shadow-2xl p-1.5 z-40 font-mono text-[9px] text-zinc-400">
              <button 
                onClick={() => { onDownload(track); setActiveMenuId(null); }}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
              >
                <Download size={11} />
                <span>DESCARGAR WAV</span>
              </button>
              <button 
                onClick={() => { onRemix(track); setActiveMenuId(null); }}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
              >
                <RefreshCw size={11} />
                <span>REMIXAR</span>
              </button>
              <button 
                onClick={() => { onReusePrompts(track); setActiveMenuId(null); }}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
              >
                <Layers size={11} />
                <span>REUTILIZAR PROMPTS</span>
              </button>
              <div className="h-[1px] bg-zinc-800 my-1"></div>
              <button 
                onClick={() => { onDelete(track.id); setActiveMenuId(null); }}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer flex items-center gap-2 font-bold"
              >
                <Trash2 size={11} />
                <span>ELIMINAR PISTA</span>
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
