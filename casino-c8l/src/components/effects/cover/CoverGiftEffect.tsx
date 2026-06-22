'use client';
import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Torus, Float } from '@react-three/drei';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Howl } from 'howler';

const coverSound = new Howl({ src: ['/sounds/gifts/cover.mp3'], volume: 0.5 });

function Particles({ count, color, spread }) {
  const pointsRef = useRef();
  const positions = useRef(new Float32Array(Array.from({ length: count * 3 }, () => (Math.random() - 0.5) * spread)));
  useFrame((state) => { if (pointsRef.current) { pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.2; } });
  return (<points ref={pointsRef}><bufferGeometry><bufferAttribute attach="attributes-position" count={count} itemSize={3} array={positions.current} /></bufferGeometry><pointsMaterial size={0.06} color={color} transparent opacity={0.8} /></points>);
}

function CoverGiftModel({ type }) {
  const groupRef = useRef();
  useFrame((state) => { if (groupRef.current) { groupRef.current.rotation.x = state.clock.getElapsedTime() * 0.2; groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 1.5) * 0.2; } });
  return (
    <group ref={groupRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.3}>
        <Torus args={[0.5, 0.1, 16, 32]}><meshStandardMaterial color="#FF69B4" emissive="#FF69B4" emissiveIntensity={0.3} /></Torus>
        <Sphere args={[0.3, 16, 16]} position={[0, 0.2, 0]}><meshStandardMaterial color="#D4AF37" emissive="#D4AF37" emissiveIntensity={0.5} /></Sphere>
      </Float>
      <Particles count={40} color="#FF69B4" spread={2} />
    </group>
  );
}

export function CoverGiftEffect({ gift, fromUser, toUser, coverTitle, onComplete }) {
  const [stage, setStage] = useState('entering');
  useEffect(() => {
    coverSound.play();
    setTimeout(() => { confetti({ particleCount: 100, spread: 70, colors: ['#FF69B4', '#D4AF37'] }); setStage('wrapped'); }, 2000);
    setTimeout(onComplete, 3500);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-center">
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="text-white font-bold text-lg">{fromUser} → {toUser}</motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="text-c8l-gold text-xl font-black">{gift.emoji} {gift.name}</motion.div>
        {coverTitle && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-gray-400 text-sm mt-1">en "{coverTitle}"</motion.div>}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Canvas camera={{ position: [0, 2, 4], fov: 50 }}><ambientLight intensity={0.5} /><pointLight position={[5, 5, 5]} /><CoverGiftModel type={gift.emoji} /></Canvas>
      </div>
      {stage === 'wrapped' && (<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2"><div className="text-4xl animate-bounce">🎵 {gift.emoji} 🎵</div></motion.div>)}
    </div>
  );
}
