'use client';
import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Box, Cone, Float, Stars } from '@react-three/drei';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Howl } from 'howler';

const liveSound = new Howl({ src: ['/sounds/gifts/live.mp3'], volume: 0.7 });

function Particles({ count, color, spread }) {
  const pointsRef = useRef();
  const positions = useRef(new Float32Array(Array.from({ length: count * 3 }, () => (Math.random() - 0.5) * spread)));
  useFrame((state) => { if (pointsRef.current) { pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.3; pointsRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.2; } });
  return (<points ref={pointsRef}><bufferGeometry><bufferAttribute attach="attributes-position" count={count} itemSize={3} array={positions.current} /></bufferGeometry><pointsMaterial size={0.1} color={color} transparent opacity={0.8} /></points>);
}

function LiveGiftModel({ type }) {
  const groupRef = useRef();
  useFrame((state) => { if (groupRef.current) { groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.4; groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 2) * 0.4; groupRef.current.scale.setScalar(1 + Math.sin(state.clock.getElapsedTime() * 3) * 0.05); } });
  return (
    <group ref={groupRef}>
      <Float speed={3} rotationIntensity={1.5} floatIntensity={0.5}>
        <Sphere args={[0.5, 16, 16]}><meshStandardMaterial color="#D4AF37" emissive="#D4AF37" emissiveIntensity={0.8} metalness={0.9} roughness={0.1} /></Sphere>
        <Cone args={[0.3, 0.4, 8]} position={[0, 0.7, 0]}><meshStandardMaterial color="#FF0055" emissive="#FF0055" emissiveIntensity={0.5} /></Cone>
      </Float>
      <Stars radius={2} count={50} factor={0.3} fade speed={0.5} />
      <Particles count={80} color="#D4AF37" spread={4} />
    </group>
  );
}


export function LiveGiftEffect({ gift, fromUser, toUser, liveTitle, onComplete }) {
  const [stage, setStage] = useState('entering');
  useEffect(() => {
    liveSound.play();
    setTimeout(() => { confetti({ particleCount: 300, spread: 150, colors: ['#D4AF37', '#FF0055', '#8A2BE2', '#00F3FF'] }); setStage('fireworks'); }, 2500);
    setTimeout(onComplete, 5000);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-center">
        <motion.div initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} className="text-white font-bold text-2xl">🔴 {fromUser} → {toUser}</motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="text-c8l-gold text-3xl font-black mt-1">{gift.emoji} {gift.name}</motion.div>
        {liveTitle && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-gray-400 text-sm mt-1">en "{liveTitle}"</motion.div>}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Canvas camera={{ position: [0, 2, 6], fov: 50 }}><ambientLight intensity={0.5} /><pointLight position={[10, 10, 10]} /><OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={2} /><LiveGiftModel type={gift.emoji} /></Canvas>
      </div>
      {stage === 'fireworks' && (<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2"><div className="text-6xl animate-bounce">🎆 {gift.emoji} 🎆</div></motion.div>)}
    </div>
  );
}
