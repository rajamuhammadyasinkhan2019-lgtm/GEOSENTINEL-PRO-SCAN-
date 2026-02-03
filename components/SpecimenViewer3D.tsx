
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Float, ContactShadows, Environment, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { RockIdentification } from '../types';

interface RockModelProps {
  identification: RockIdentification;
}

const RockModel: React.FC<RockModelProps> = ({ identification }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Map lithology to visual styles
  const rockStyle = useMemo(() => {
    const lithology = identification.lithology.toLowerCase();
    const color = identification.physicalCharacteristics.color.toLowerCase();
    
    let baseColor = '#555555';
    if (color.includes('red')) baseColor = '#92400e';
    else if (color.includes('green')) baseColor = '#065f46';
    else if (color.includes('white')) baseColor = '#f1f5f9';
    else if (color.includes('black') || color.includes('dark')) baseColor = '#1e293b';
    else if (color.includes('yellow')) baseColor = '#ca8a04';
    else if (lithology.includes('igneous')) baseColor = '#4b5563';
    else if (lithology.includes('sedimentary')) baseColor = '#a8a29e';
    else if (lithology.includes('metamorphic')) baseColor = '#71717a';

    const isShiny = lithology.includes('igneous') || identification.metadata.texture.includes('crystalline');
    const isRough = lithology.includes('sedimentary') || identification.metadata.texture.includes('clastic');

    return {
      color: baseColor,
      roughness: isRough ? 0.9 : 0.4,
      metalness: isShiny ? 0.3 : 0.1,
      distort: isRough ? 0.4 : 0.2,
      speed: 0,
    };
  }, [identification]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial 
          color={rockStyle.color} 
          roughness={rockStyle.roughness} 
          metalness={rockStyle.metalness} 
          distort={rockStyle.distort} 
          speed={rockStyle.speed}
        />
      </mesh>
    </Float>
  );
};

export const SpecimenViewer3D: React.FC<{ identification: RockIdentification }> = ({ identification }) => {
  return (
    <div className="w-full h-full min-h-[300px] bg-slate-900/40 rounded-3xl relative overflow-hidden border border-slate-800 shadow-inner">
      <div className="absolute top-4 left-6 z-10 pointer-events-none">
        <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em]">3D Digital Twin</span>
        <div className="flex gap-1 mt-1">
          <div className="w-1 h-1 bg-cyan-500 rounded-full animate-ping"></div>
          <div className="w-32 h-[1px] bg-cyan-900/50 mt-1"></div>
        </div>
      </div>
      
      <div className="absolute bottom-4 right-6 z-10 text-right pointer-events-none">
        <span className="text-[8px] font-bold text-slate-500 uppercase block">Interactive Lab View</span>
        <span className="text-[9px] font-black text-slate-400 uppercase">Procedural Reconstruction</span>
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 4]} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#3b82f6" />
        
        <RockModel identification={identification} />
        
        <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2} far={4.5} />
        <Environment preset="city" />
        <OrbitControls enableZoom={true} minDistance={2} maxDistance={6} />
      </Canvas>
    </div>
  );
};
