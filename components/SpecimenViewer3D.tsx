
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
  
  // Map physical characteristics to visual material properties
  const rockStyle = useMemo(() => {
    const { color, hardness, grainSize } = identification.physicalCharacteristics;
    const lithology = identification.lithology.toLowerCase();
    
    // 1. Base Color Logic
    let baseColor = '#555555';
    const colorLower = color.toLowerCase();
    if (colorLower.includes('red') || colorLower.includes('pink')) baseColor = '#b91c1c';
    else if (colorLower.includes('green') || colorLower.includes('olivine')) baseColor = '#166534';
    else if (colorLower.includes('white') || colorLower.includes('light')) baseColor = '#f8fafc';
    else if (colorLower.includes('black') || colorLower.includes('dark') || colorLower.includes('grey')) baseColor = '#1e293b';
    else if (colorLower.includes('yellow') || colorLower.includes('buff')) baseColor = '#eab308';
    else if (colorLower.includes('brown')) baseColor = '#78350f';
    else if (colorLower.includes('blue')) baseColor = '#1d4ed8';
    else if (colorLower.includes('gold')) baseColor = '#d4af37';
    else if (colorLower.includes('silver')) baseColor = '#c0c0c0';
    else if (colorLower.includes('copper') || colorLower.includes('bronze')) baseColor = '#b87333';

    // 2. Hardness Logic (Mohs scale 1-10)
    const hardnessVal = parseFloat(hardness) || 5;
    const roughness = Math.max(0.1, 1 - (hardnessVal / 10));
    
    // 3. Dynamic Metalness Logic
    // Start with base metalness from hardness
    let metalness = Math.min(0.2, hardnessVal / 40);

    // Check for metallic keywords in color
    const metallicKeywords = ['gold', 'silver', 'metallic', 'bronze', 'copper', 'brassy', 'lustrous', 'shiny', 'galena', 'pyrite'];
    if (metallicKeywords.some(keyword => colorLower.includes(keyword))) {
      metalness += 0.5;
    }

    // Check for metallic minerals in petrography if available
    if (identification.petrography) {
      const metallicMinerals = [
        'Gold', 'Silver', 'Copper', 'Pyrite', 'Chalcopyrite', 
        'Galena', 'Magnetite', 'Hematite', 'Pyrrhotite', 'Arsenopyrite'
      ];
      
      const allMinerals = [
        ...Object.keys(identification.petrography.primaryMinerals || {}),
        ...Object.keys(identification.petrography.accessoryMinerals || {})
      ];

      if (allMinerals.some(m => metallicMinerals.some(metal => m.toLowerCase().includes(metal.toLowerCase())))) {
        metalness += 0.4;
      }
    }

    metalness = Math.min(0.95, metalness); // Cap metalness for realism

    // 4. Grain Size / Texture Logic (Procedural Distortion)
    const grainLower = grainSize.toLowerCase();
    let distort = 0.1;
    let speed = 0;
    
    if (grainLower.includes('coarse') || grainLower.includes('phaneritic') || grainLower.includes('pebble')) {
      distort = 0.5;
    } else if (grainLower.includes('medium')) {
      distort = 0.3;
    } else if (grainLower.includes('fine') || grainLower.includes('aphanitic')) {
      distort = 0.05;
    }

    // 5. Grain Boundary Logic
    // Sutured and interlocking boundaries suggest more surface complexity (distortion)
    if (identification.petrography?.grainBoundaries) {
      const boundariesLower = identification.petrography.grainBoundaries.toLowerCase();
      if (boundariesLower.includes('sutured')) distort += 0.25;
      if (boundariesLower.includes('interlocking')) distort += 0.15;
      if (boundariesLower.includes('embayed')) distort += 0.2;
      if (boundariesLower.includes('jagged')) distort += 0.3;
    }

    distort = Math.min(0.85, distort); // Cap distortion to prevent visual artifacts

    // Lithology adjustment
    if (lithology.includes('metamorphic')) speed = 0.2; 

    return {
      color: baseColor,
      roughness,
      metalness,
      distort,
      speed,
    };
  }, [identification]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
      meshRef.current.rotation.x += 0.001;
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
  const confidencePercent = Math.round(identification.confidence * 100);
  const { hardness, grainSize, color } = identification.physicalCharacteristics;
  
  return (
    <div className="w-full h-full min-h-[400px] bg-slate-900/40 rounded-3xl relative overflow-hidden border border-slate-800 shadow-inner group">
      {/* Top Left Label */}
      <div className="absolute top-4 left-6 z-10 pointer-events-none">
        <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.4em]">3D Digital Twin</span>
        <div className="flex gap-1 mt-1">
          <div className="w-1 h-1 bg-cyan-500 rounded-full animate-ping"></div>
          <div className="w-32 h-[1px] bg-cyan-900/50 mt-1"></div>
        </div>
      </div>

      {/* Top Right Stats HUD */}
      <div className="absolute top-4 right-6 z-10 flex flex-col items-end gap-2 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md border border-slate-700/50 rounded-lg p-2 flex flex-col items-end min-w-[120px]">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Lithology</span>
          <span className="text-[10px] font-bold text-cyan-400 uppercase">{identification.lithology}</span>
        </div>
        <div className="bg-black/60 backdrop-blur-md border border-slate-700/50 rounded-lg p-2 flex flex-col items-end min-w-[120px]">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Conf. Score</span>
          <div className="flex items-center gap-2">
             <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${confidencePercent}%` }}></div>
             </div>
             <span className="text-[10px] font-bold text-white">{confidencePercent}%</span>
          </div>
        </div>
      </div>

      {/* Bottom Left Physical Specs HUD */}
      <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2 pointer-events-none">
        <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl p-4 min-w-[160px] shadow-2xl">
          <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] block mb-3 border-b border-emerald-900/30 pb-1">Phy-Analytics</span>
          <div className="space-y-2">
            <div className="flex justify-between items-center gap-4">
              <span className="text-[8px] font-bold text-slate-500 uppercase">Hardness</span>
              <span className="text-[10px] font-black text-white">{hardness} Mohs</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-[8px] font-bold text-slate-500 uppercase">Grains</span>
              <span className="text-[10px] font-black text-white uppercase truncate max-w-[80px] text-right">{grainSize}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-[8px] font-bold text-slate-500 uppercase">Hue</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: color }}></div>
                <span className="text-[10px] font-black text-white uppercase">{color}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Right Label */}
      <div className="absolute bottom-4 right-6 z-10 text-right pointer-events-none">
        <span className="text-[8px] font-bold text-slate-500 uppercase block">Interactive Lab View</span>
        <span className="text-[9px] font-black text-slate-400 uppercase">Procedural Reconstruction</span>
      </div>

      {/* Center Reticle - Decoration */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
        <div className="w-48 h-48 border border-slate-500/20 rounded-full flex items-center justify-center">
          <div className="w-1 h-8 bg-slate-500/30 absolute"></div>
          <div className="w-8 h-1 bg-slate-500/30 absolute"></div>
        </div>
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
