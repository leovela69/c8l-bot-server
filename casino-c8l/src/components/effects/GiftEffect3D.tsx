'use client';
import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Box, Sphere } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Howl } from 'howler';

const sounds = {
  rose: new Howl({ src: ['/sounds/gifts/rose.mp3'], volume: 0.5 }),
  mic: new Howl({ src: ['/sounds/gifts/mic.mp3'], volume: 0.6 }),
  lightning: new Howl({ src: ['/sounds/gifts/lightning.mp3'], volume: 0.7 }),
  crown: new Howl({ src: ['/sounds/gifts/crown.mp3'], volume: 0.8 }),
  diamond: new Howl({ src: ['/sounds/gifts/diamond.mp3'], volume: 0.7 }),
  cookie: new Howl({ src: ['/sounds/gifts/cookie.mp3'], volume: 0.4 }),
  teddy: new Howl({ src: ['/sounds/gifts/teddy.mp3'], volume: 0.5 }),
  confetti: new Howl({ src: ['/sounds/gifts/confetti.mp3'], volume: 0.8 }),
  heart: new Howl({ src: ['/sounds/gifts/heart.mp3'], volume: 0.5 }),
  star: new Howl({ src: ['/sounds/gifts/star.mp3'], volume: 0.6 }),
  rainbow: new Howl({ src: ['/sounds/gifts/rainbow.mp3'], volume: 0.8 }),
  unicorn: new Howl({ src: ['/sounds/gifts/unicorn.mp3'], volume: 0.9 }),
};

function Particles({ count = 100, color = '#D4AF37', spread = 5 }) {
  const meshRef = useRef();
  const positions = useRef(
    new Float32Array(Array.from({ length: count * 3 }, () => (Math.random() - 0.5) * spread))
  );
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.1;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });
  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} itemSize={3} array={positions.current} />
      </bufferGeometry>
      <pointsMaterial size={0.1} color={color} transparent opacity={0.8} />
    </points>
  );
}


function GiftModel3D({ type }) {
  const groupRef = useRef();
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
      groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 2) * 0.3;
    }
  });

  const getModel = () => {
    switch (type) {
      case '🌹':
        return (<group><Sphere args={[0.3, 16, 16]} position={[0, 0.5, 0]}><meshStandardMaterial color="#FF0055" emissive="#FF0055" emissiveIntensity={0.3} /></Sphere><Box args={[0.05, 0.6, 0.05]} position={[0, -0.2, 0]}><meshStandardMaterial color="#00AA00" /></Box><Particles count={50} color="#FF0055" spread={2} /></group>);
      case '👑':
        return (<group><Box args={[0.6, 0.1, 0.6]} position={[0, 0.3, 0]}><meshStandardMaterial color="#D4AF37" emissive="#D4AF37" emissiveIntensity={0.5} /></Box><Box args={[0.1, 0.3, 0.1]} position={[0.25, 0.45, 0]}><meshStandardMaterial color="#D4AF37" /></Box><Box args={[0.1, 0.3, 0.1]} position={[-0.25, 0.45, 0]}><meshStandardMaterial color="#D4AF37" /></Box><Particles count={60} color="#D4AF37" spread={3} /></group>);
      case '💎':
        return (<group><Box args={[0.4, 0.4, 0.4]}><meshStandardMaterial color="#00F3FF" emissive="#00F3FF" emissiveIntensity={0.8} metalness={0.9} roughness={0.1} /></Box><Particles count={100} color="#00F3FF" spread={5} /></group>);
      case '⚡':
        return (<group><Box args={[0.1, 0.8, 0.1]}><meshStandardMaterial color="#00F3FF" emissive="#00F3FF" emissiveIntensity={0.8} /></Box><Particles count={80} color="#00F3FF" spread={4} /></group>);
      case '🦄':
        return (<group><Sphere args={[0.3, 16, 16]} position={[0, 0.3, 0]}><meshStandardMaterial color="#FF69B4" emissive="#FF69B4" emissiveIntensity={0.5} /></Sphere><Box args={[0.4, 0.4, 0.4]} position={[0, -0.1, 0]}><meshStandardMaterial color="#FFFFFF" /></Box><Particles count={120} color="#FF69B4" spread={6} /></group>);
      default:
        return (<Sphere args={[0.3, 16, 16]}><meshStandardMaterial color="#D4AF37" emissive="#D4AF37" emissiveIntensity={0.3} /></Sphere>);
    }
  };

  return <group ref={groupRef} scale={[1.5, 1.5, 1.5]}>{getModel()}</group>;
}


export function GiftEffect3D({ gift, fromUser, toUser, onComplete }) {
  const [stage, setStage] = useState('entering');

  useEffect(() => {
    const soundMap = { '🌹': 'rose', '🎤': 'mic', '⚡': 'lightning', '👑': 'crown', '💎': 'diamond', '🍪': 'cookie', '🧸': 'teddy', '🎊': 'confetti', '💖': 'heart', '⭐': 'star', '🌈': 'rainbow', '🦄': 'unicorn' };
    const key = soundMap[gift.emoji] || 'cookie';
    if (sounds[key]) sounds[key].play();

    setTimeout(() => setStage('floating'), 500);
    setTimeout(() => { setStage('landing'); confetti({ particleCount: gift.rarity === 'legendary' ? 300 : 150, spread: 100, colors: ['#D4AF37', '#8A2BE2', '#FF69B4'] }); }, 2000);
    setTimeout(onComplete, 4500);
    return () => { Object.values(sounds).forEach(s => s.stop()); };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-center">
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} className="text-white font-bold text-xl">{fromUser} → {toUser}</motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="text-c8l-gold text-2xl font-black mt-2">{gift.emoji} {gift.name} {gift.emoji}</motion.div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Canvas camera={{ position: [0, 2, 5], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <OrbitControls enableZoom={false} enablePan={false} autoRotate={stage === 'floating'} autoRotateSpeed={2} />
          <GiftModel3D type={gift.emoji} />
        </Canvas>
      </div>
      {stage === 'landing' && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2">
          <div className="text-4xl font-black text-c8l-gold">🎉 ¡REGALO RECIBIDO! 🎉</div>
        </motion.div>
      )}
    </div>
  );
}
