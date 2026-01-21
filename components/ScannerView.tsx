
import React, { useRef, useEffect, useState } from 'react';
import { DrainageRegion, RockIdentification, ScanningMode } from '../types';
import { identifyRock } from '../geminiService';

interface ScannerViewProps {
  region: DrainageRegion;
  mode: ScanningMode;
  onResult: (result: RockIdentification) => void;
  isScanning: boolean;
}

export const ScannerView: React.FC<ScannerViewProps> = ({ region, mode, onResult, isScanning }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [locking, setLocking] = useState(false);

  useEffect(() => {
    async function setupCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.error("Camera Access Denied:", err);
      }
    }
    setupCamera();
    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const captureAndIdentify = async () => {
    if (!videoRef.current || !canvasRef.current || loading || !isScanning) return;

    setLocking(true);
    await new Promise(r => setTimeout(r, mode === 'THIN_SECTION' ? 1500 : 800));
    setLocking(false);
    
    setLoading(true);
    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      
      const base64 = canvasRef.current.toDataURL('image/jpeg', 0.8).split(',')[1];
      const result = await identifyRock(base64, region, mode);
      
      if (result) {
        onResult(result);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    let interval: any;
    if (isScanning && !loading && !locking) {
      interval = setInterval(() => {
        captureAndIdentify();
      }, 7000); 
    }
    return () => clearInterval(interval);
  }, [isScanning, loading, locking, region, mode]);

  return (
    <div className={`relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden border-4 ${mode === 'THIN_SECTION' ? 'border-cyan-800' : 'border-slate-800'} shadow-2xl bg-black group transition-colors duration-500`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover ${mode === 'THIN_SECTION' ? 'scale-125' : 'scale-100'} transition-transform duration-700`}
      />
      
      {/* Thin Section Microscope Mask */}
      {mode === 'THIN_SECTION' && (
        <div className="absolute inset-0 border-[40px] border-black/80 rounded-full pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,1)]"></div>
      )}

      {/* HUD Scanner Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Dynamic Target Box */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${locking ? 'w-48 h-48 border-emerald-400' : 'w-64 h-64 border-slate-500/30'} ${mode === 'THIN_SECTION' ? 'rounded-full' : 'rounded-xl'} border-2 flex items-center justify-center`}>
            {locking && <div className={`absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] font-black ${mode === 'THIN_SECTION' ? 'text-cyan-400' : 'text-emerald-400'} uppercase tracking-widest animate-pulse`}>
              {mode === 'THIN_SECTION' ? 'Analyzing Petrography...' : 'Locking Clast...'}
            </div>}
            
            {/* Corner Accents (Hidden in Thin Section) */}
            {mode === 'FIELD' && (
              <>
                <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg transition-colors ${locking ? 'border-emerald-400' : 'border-slate-500/50'}`}></div>
                <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg transition-colors ${locking ? 'border-emerald-400' : 'border-slate-500/50'}`}></div>
                <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg transition-colors ${locking ? 'border-emerald-400' : 'border-slate-500/50'}`}></div>
                <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-lg transition-colors ${locking ? 'border-emerald-400' : 'border-slate-500/50'}`}></div>
              </>
            )}

            <div className={`scan-line ${!isScanning && 'hidden'} ${mode === 'THIN_SECTION' ? 'bg-cyan-500' : 'bg-emerald-500'}`}></div>
        </div>

        {/* HUD Data Points */}
        <div className="absolute top-8 left-8 flex flex-col gap-1">
          <div className={`bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-sm border-l-4 ${mode === 'THIN_SECTION' ? 'border-cyan-500' : 'border-emerald-500'}`}>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Input Mode</span>
            <span className="text-[10px] font-bold text-white uppercase">{mode === 'FIELD' ? 'Field Lithology' : 'Thin Section XPL'}</span>
          </div>
        </div>

        <div className="absolute bottom-8 right-8 text-right">
           <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Microscope Status</div>
           <div className={`text-xs font-bold ${mode === 'THIN_SECTION' ? 'text-cyan-400' : 'text-emerald-400'}`}>
             {mode === 'THIN_SECTION' ? 'OPTICS ENGAGED' : 'WIDE-ANGLE'}
           </div>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center flex-col gap-6">
          <div className="relative w-24 h-24">
            <div className={`absolute inset-0 border-4 ${mode === 'THIN_SECTION' ? 'border-cyan-500/20' : 'border-emerald-500/20'} rounded-full`}></div>
            <div className={`absolute inset-0 border-4 border-t-${mode === 'THIN_SECTION' ? 'cyan-500' : 'emerald-500'} rounded-full animate-spin`}></div>
            <div className="absolute inset-0 flex items-center justify-center">
               <span className={`text-xs font-black ${mode === 'THIN_SECTION' ? 'text-cyan-500' : 'text-emerald-500'}`}>AI</span>
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-black text-white uppercase tracking-[0.2em]">Processing Multi-Head CNN</p>
            <p className={`text-[10px] font-bold ${mode === 'THIN_SECTION' ? 'text-cyan-400' : 'text-emerald-400'} animate-pulse uppercase`}>
              {mode === 'THIN_SECTION' ? 'Extracting Mineral Phase Data' : 'Synthesizing Basin Context'}
            </p>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
