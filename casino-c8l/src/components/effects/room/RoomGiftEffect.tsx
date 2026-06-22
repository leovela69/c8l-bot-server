'use client';
import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Cone, Float, Trail } from '@react-three/drei';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Howl } from 'howler';

const roomSound = new Howl({ src: ['/sounds/gifts/room.mp3'], volume: 0.6 });

function Particles({ count, color, spread }) {
  const pointsRef = useRef();
  const positions = useRef(new Float32Array(Array.from({ length: count * 3 }, () => (Math.random() - 0.5) * spread)));
  useFrame((state) => { if (pointsRef.current) { pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.25; } });
  return (<points ref={pointsRef}><bufferGeometry><bufferAttribute attach="attributes-position" count={count} itemSize={3} array={positions.current} /></bufferGeometry><pointsMaterial size={0.08} color={color} transparent opacity={0.8} /></points>);
}

function RoomGiftModel({ type }) {
  const groupRef = useRef();
  useFrame((state) => { if (groupRef.current) { groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.3; groupRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 1.5) * 0.3; } });
  return (
    <group ref={groupRef}>
      <Float speed={1.5} rotationIntensity={1} floatIntensity={0.5}>
        <Sphere args={[0.4, 16, 16]} position={[0, 0.3, 0]}><meshStandardMaterial color="#8A2BE2" emissive="#8A2BE2" emissiveIntensity={0.5} /></Sphere>
        <Cone args={[0.2, 0.3, 8]} position={[0, 0.7, 0]}><meshStandardMaterial color="#D4AF37" emissive="#D4AF37" emissiveIntensity={0.5} /></Cone>
      </Float>
      <Particles count={50} color="#8A2BE2" spread={3} />
    </group>
  );
}

export function RoomGiftEffect({ gift, fromUser, toUser, onComplete }) {
  const [stage, setStage] = useState('entering');
  useEffect(() => {
    roomSound.play();
    setTimeout(() => { confetti({ particleCount: 120, spread: 80, colors: ['#8A2BE2', '#D4AF37'] }); setStage('exploded'); }, 2500);
    setTimeout(onComplete, 4000);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-center">
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} className="text-white font-bold text-lg">{fromUser} → {toUser}</motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="text-c8l-gold text-xl font-black mt-1">{gift.emoji} {gift.name}</motion.div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Canvas camera={{ position: [0, 2, 5], fov: 50 }}><ambientLight intensity={0.5} /><pointLight position={[5, 5, 5]} /><RoomGiftModel type={gift.emoji} /></Canvas>
      </div>
      {stage === 'exploded' && (<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2"><div className="text-5xl animate-bounce">✨ {gift.emoji} ✨</div></motion.div>)}
    </div>
  );
}
