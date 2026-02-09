
import React, { useState, useRef, useEffect } from 'react';
import { ScannerView } from './components/ScannerView';
import { Button } from './components/Button';
import { SpecimenViewer3D } from './components/SpecimenViewer3D';
import { DRAINAGE_REGIONS } from './constants';
import { AppState, DrainageRegion, ScanResult, RockIdentification, ScanningMode, ChatMessage } from './types';
import { identifyRock, visualizeEnvironment, askAssistant } from './geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState & { viewMode: '2D' | '3D' }>({
    isScanning: true,
    mode: 'FIELD',
    selectedDrainage: 'Global',
    lastResult: null,
    history: [],
    error: null,
    isVisualizing: false,
    chatHistory: [],
    isChatting: false,
    viewMode: '3D'
  });

  const [isUploading, setIsUploading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatHistory]);

  const handleScanResult = (identification: RockIdentification) => {
    const result: ScanResult = {
      identification,
      timestamp: Date.now(),
      capturedFrame: '',
      mode: state.mode
    };
    setState(prev => ({
      ...prev,
      lastResult: result,
      chatHistory: [], // Reset chat for new specimen
      history: [result, ...prev.history].slice(0, 10),
      viewMode: '3D' // Default to 3D for new identification
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setState(prev => ({ ...prev, isScanning: false })); 
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result?.toString().split(',')[1];
      if (base64) {
        const result = await identifyRock(base64, state.selectedDrainage, state.mode);
        if (result) handleScanResult(result);
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const triggerVisualization = async () => {
    if (!state.lastResult) return;
    setState(prev => ({ ...prev, isVisualizing: true }));
    const imageUrl = await visualizeEnvironment(state.lastResult.identification);
    setState(prev => ({
      ...prev,
      lastResult: prev.lastResult ? { ...prev.lastResult, visualizedEnvironmentUrl: imageUrl || undefined } : null,
      isVisualizing: false,
      viewMode: '2D' // Switch to 2D to show the result
    }));
  };

  const sendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !state.lastResult || state.isChatting) return;

    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setState(prev => ({ 
      ...prev, 
      chatHistory: [...prev.chatHistory, userMsg],
      isChatting: true 
    }));
    setChatInput('');

    const response = await askAssistant(chatInput, state.lastResult.identification, state.chatHistory);
    
    if (response) {
      setState(prev => ({
        ...prev,
        chatHistory: [...prev.chatHistory, response],
        isChatting: false
      }));
    } else {
      setState(prev => ({ ...prev, isChatting: false }));
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();
  const isHighConfidence = state.lastResult && state.lastResult.identification.confidence >= 0.75;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 md:p-8 transition-colors duration-1000 font-sans">
      <header className="max-w-7xl mx-auto w-full mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 ${state.mode === 'THIN_SECTION' ? 'bg-cyan-600' : 'bg-emerald-600'} rounded-2xl flex items-center justify-center shadow-lg border-b-4 border-black/30`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic">GEOSENTINEL <span className={state.mode === 'THIN_SECTION' ? 'text-cyan-500' : 'text-emerald-500'}>PRO SCAN</span></h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">V 1.0 Advanced Geological Field & Lab Suite</p>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end text-right gap-2">
           <div className="flex flex-col items-end">
             <a href="https://www.facebook.com/muhammad.yasin.khan.857718" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2">
               <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 italic group-hover:text-emerald-400 transition-colors">Analytical Head: Muhammad Yasin Khan</span>
               <svg className="w-3 h-3 text-emerald-600 group-hover:text-emerald-400 mb-1" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-8.74h-2.94v-3.403h2.94v-2.511c0-2.91 1.777-4.496 4.375-4.496 1.243 0 2.311.092 2.622.134v3.039l-1.799.001c-1.411 0-1.685.671-1.685 1.655v2.172h3.364l-.438 3.403h-2.926v8.742h6.199c.732 0 1.325-.593 1.325-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
             </a>
             <span className="text-sm font-bold text-slate-200 uppercase tracking-tighter">Neural Lab System Active</span>
           </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-12">
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-4">
            <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 gap-1 shadow-inner shadow-black/50">
              <button 
                onClick={() => setState(prev => ({ ...prev, mode: 'FIELD', lastResult: null }))}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.mode === 'FIELD' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >Field Macro</button>
              <button 
                onClick={() => setState(prev => ({ ...prev, mode: 'THIN_SECTION', lastResult: null }))}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.mode === 'THIN_SECTION' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >Thin Section</button>
            </div>

            <div className="flex items-center justify-between mb-2 px-2">
              <h2 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                <span className={`w-2 h-2 rounded-full ${state.isScanning ? (state.mode === 'THIN_SECTION' ? 'bg-cyan-500 animate-pulse' : 'bg-emerald-500 animate-pulse') : 'bg-red-500'}`}></span>
                Optical Target Reticle
              </h2>
              <div className="flex gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                <Button variant="ghost" size="sm" className="rounded-full text-[10px] font-black uppercase tracking-widest px-4 border border-slate-700 bg-slate-800/40" onClick={triggerUpload} isLoading={isUploading}>
                  Upload
                </Button>
                <Button variant={state.isScanning ? "danger" : (state.mode === 'THIN_SECTION' ? 'secondary' : 'primary')} size="sm" className="rounded-full text-[10px] font-black uppercase tracking-widest px-6" onClick={() => setState(p => ({ ...p, isScanning: !p.isScanning }))}>
                    {state.isScanning ? "Offline" : "Engage AI"}
                </Button>
              </div>
            </div>
            
            <ScannerView isScanning={state.isScanning} mode={state.mode} region={state.selectedDrainage} onResult={handleScanResult} />

            {state.mode === 'FIELD' && (
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Regional Basin Filters</p>
                <div className="flex flex-wrap gap-2">
                  {DRAINAGE_REGIONS.map(region => (
                    <button key={region} onClick={() => setState(p => ({ ...p, selectedDrainage: region }))} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${state.selectedDrainage === region ? "bg-emerald-600 border-emerald-400 text-white shadow-lg" : "bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-500"}`}>
                      {region}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className={`bg-slate-900 border-2 ${state.mode === 'THIN_SECTION' ? 'border-cyan-900' : 'border-slate-800'} rounded-[2.5rem] overflow-hidden shadow-2xl relative min-h-[700px] flex flex-col transition-all duration-500`}>
            <div className="bg-slate-800/40 backdrop-blur-md px-10 py-6 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Specimen Diagnostics</h3>
                <div className={`text-[10px] font-bold ${state.mode === 'THIN_SECTION' ? 'text-cyan-500' : 'text-emerald-500'}`}>
                  {isUploading ? 'SYNCHRONIZING...' : `Target: ${state.lastResult ? 'LOCKED' : 'ACQUIRING...'}`}
                </div>
              </div>
              {state.lastResult && !isUploading && (
                 <div className="text-right">
                    <div className={`text-2xl font-black ${isHighConfidence ? (state.mode === 'THIN_SECTION' ? 'text-cyan-500' : 'text-emerald-500') : 'text-slate-400'}`}>
                      {Math.round(state.lastResult.identification.confidence * 100)}%
                    </div>
                    <div className="text-[9px] font-black text-slate-500 uppercase">Confidence</div>
                 </div>
              )}
            </div>

            {isUploading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                 <div className="w-16 h-16 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                 <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Inference In Progress...</p>
              </div>
            ) : state.lastResult ? (
              <div className="p-10 flex-1 flex flex-col gap-8 overflow-y-auto max-h-[85vh]">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md ${
                        state.lastResult.identification.lithology.toLowerCase().includes('igneous') ? 'bg-orange-500/20 text-orange-400' :
                        state.lastResult.identification.lithology.toLowerCase().includes('sedimentary') ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>{state.lastResult.identification.lithology}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-slate-800 text-slate-400 px-3 py-1 rounded-md">
                        {state.lastResult.identification.geologicalAge}
                      </span>
                    </div>
                    <h4 className="text-4xl font-black text-white tracking-tighter italic">{state.lastResult.identification.name}</h4>
                  </div>
                  
                  {/* View Toggler */}
                  <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800">
                    <button 
                      onClick={() => setState(prev => ({ ...prev, viewMode: '3D' }))}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${state.viewMode === '3D' ? 'bg-cyan-600 text-white' : 'text-slate-600 hover:text-slate-400'}`}
                    >3D Lab</button>
                    <button 
                      onClick={() => setState(prev => ({ ...prev, viewMode: '2D' }))}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${state.viewMode === '2D' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-slate-400'}`}
                    >2D Context</button>
                  </div>
                </div>

                {state.lastResult.mode === 'THIN_SECTION' && state.lastResult.identification.petrography ? (
                  <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-[2rem] p-8 space-y-8">
                    <div className="flex items-center justify-between border-b border-cyan-900/40 pb-4">
                      <h5 className="text-xs font-black text-cyan-400 uppercase tracking-[0.3em] flex items-center gap-3">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        Petrographic Analysis
                      </h5>
                      <span className="text-[9px] font-bold text-cyan-600 uppercase bg-cyan-950/40 px-3 py-1 rounded-full border border-cyan-900/50">
                        {state.lastResult.identification.petrography.classification}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {/* NEW Structured Mineral breakdown Table */}
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Mineral Modal Analysis</span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase">Volumetric %</span>
                        </div>
                        <div className="overflow-hidden rounded-2xl border border-cyan-900/50 bg-slate-900/40">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-cyan-950/20 border-b border-cyan-900/30">
                                <th className="px-4 py-3 text-[9px] font-black text-cyan-600/80 uppercase tracking-widest">Mineral</th>
                                <th className="px-4 py-3 text-[9px] font-black text-cyan-600/80 uppercase tracking-widest text-center">Cat.</th>
                                <th className="px-4 py-3 text-[9px] font-black text-cyan-600/80 uppercase tracking-widest text-right">Vol%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {/* Primary Minerals */}
                              {Object.entries(state.lastResult.identification.petrography.primaryMinerals || {}).map(([min, pct]) => (
                                <tr key={min} className="border-b border-cyan-900/20 hover:bg-cyan-900/10 transition-colors">
                                  <td className="px-4 py-3 text-xs font-bold text-slate-200">{min}</td>
                                  <td className="px-4 py-3 text-[8px] font-black text-cyan-500/70 uppercase text-center">Primary</td>
                                  <td className="px-4 py-3 text-xs font-black text-cyan-400 text-right">{pct as string}</td>
                                </tr>
                              ))}
                              {/* Accessory Minerals */}
                              {Object.entries(state.lastResult.identification.petrography.accessoryMinerals || {}).map(([min, pct]) => (
                                <tr key={min} className="border-b border-cyan-900/20 hover:bg-cyan-900/10 transition-colors">
                                  <td className="px-4 py-3 text-xs font-medium text-slate-400">{min}</td>
                                  <td className="px-4 py-3 text-[8px] font-black text-slate-600 uppercase text-center">Accessory</td>
                                  <td className="px-4 py-3 text-xs font-black text-slate-500 text-right">{pct as string}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/50">
                           <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest block mb-2">Total Estimated Volume</span>
                           <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-cyan-600 w-full animate-pulse"></div>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl space-y-4">
                           <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest block border-b border-cyan-900/50 pb-2">Micro-Optical Parameters</span>
                           <div className="grid grid-cols-1 gap-4">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-500 uppercase">Plag. Twinning</span>
                                <span className="text-[10px] font-bold text-cyan-400">{state.lastResult.identification.petrography.plagioclase_twining_type || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-500 uppercase">Qz Undulosity</span>
                                <span className="text-[10px] font-bold text-cyan-400">{state.lastResult.identification.petrography.quartz_undulosity_level || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-500 uppercase">Foliation Angle</span>
                                <span className="text-[10px] font-bold text-cyan-400">{state.lastResult.identification.petrography.foliation_angle || 'N/A'}</span>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                          <span className="text-[10px] font-black text-cyan-600/80 uppercase tracking-widest block">Optical Diagnostics</span>
                          <div className="flex flex-wrap gap-2">
                            {state.lastResult.identification.petrography.opticalFeatures.map((feat, i) => (
                              <span key={i} className="text-[9px] font-black text-cyan-400 bg-cyan-950/30 border border-cyan-800/50 px-3 py-1 rounded-md uppercase tracking-wider italic">
                                {feat}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl">
                          <span className="text-[9px] font-black text-slate-600 uppercase block mb-1">Micro-Texture / Boundaries</span>
                          <p className="text-xs font-bold text-slate-300 italic">
                            "{state.lastResult.identification.petrography.grainBoundaries}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {state.viewMode === '3D' ? (
                        <SpecimenViewer3D identification={state.lastResult.identification} />
                      ) : (
                        !state.lastResult.visualizedEnvironmentUrl ? (
                          <Button onClick={triggerVisualization} isLoading={state.isVisualizing} variant="secondary" className="w-full rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 py-12">
                            <span className="flex flex-col items-center gap-1">
                              <span className="text-sm font-black tracking-widest uppercase">Initiate Recon</span>
                              <span className="text-[8px] font-bold opacity-60">Generate Paleo-Environment</span>
                            </span>
                          </Button>
                        ) : (
                          <div className="relative group overflow-hidden rounded-3xl border-2 border-emerald-500/20 shadow-xl">
                            <img src={state.lastResult.visualizedEnvironmentUrl} className="w-full aspect-video object-cover" alt="Geological Visualization" />
                            <div className="absolute bottom-4 left-6">
                              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.3em]">Paleo-Reconstruction</span>
                            </div>
                          </div>
                        )
                      )}

                      <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 space-y-4">
                        <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Provenance Engine</h5>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                            <span className="text-[8px] font-black text-slate-500 uppercase block">Roundness</span>
                            <span className="text-xs font-bold text-slate-200">{state.lastResult.identification.provenance.roundness}</span>
                          </div>
                          <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                            <span className="text-[8px] font-black text-slate-500 uppercase block">Distance</span>
                            <span className="text-xs font-bold text-slate-200">{state.lastResult.identification.provenance.transportDistance}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-slate-800/30 p-6 rounded-3xl border border-slate-700/50">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Laboratory Notes</h5>
                        <div className="space-y-6">
                            <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800/50">
                              <span className="text-[9px] font-black text-emerald-500 uppercase block mb-2 tracking-widest">Textural Analysis</span>
                              <p className="text-xs font-medium text-slate-200 leading-relaxed border-l-2 border-emerald-500/30 pl-3">
                                {state.lastResult.identification.metadata.texture}
                              </p>
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-slate-600 uppercase block mb-1">Common Uses</span>
                              <p className="text-xs font-medium text-slate-400 italic">{state.lastResult.identification.metadata.commonUses}</p>
                            </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                            <span className="text-[9px] font-black text-slate-500 uppercase block">Hardness</span>
                            <span className="text-sm font-bold text-emerald-500">{state.lastResult.identification.physicalCharacteristics.hardness} Mohs</span>
                        </div>
                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                            <span className="text-[9px] font-black text-slate-500 uppercase block">Rarity</span>
                            <span className="text-sm font-bold text-orange-500">{state.lastResult.identification.metadata.rarity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI INTELLIGENCE CONSOLE (CHAT) */}
                <div className="border-t border-slate-800 pt-10 mt-4 space-y-6">
                   <div className="flex items-center justify-between px-2">
                      <h5 className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em] flex items-center gap-3">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        GeoSense Intelligence Assistant
                      </h5>
                      <span className="text-[8px] font-black text-slate-600 uppercase">Flash-3.0 Engine</span>
                   </div>

                   <div className="bg-black/40 rounded-3xl border border-slate-800 p-6 space-y-4 min-h-[300px] flex flex-col shadow-inner">
                      <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-[350px]">
                        {state.chatHistory.length === 0 && (
                          <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
                            <svg className="w-8 h-8 mb-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Ask about value, news, or industrial uses...</p>
                          </div>
                        )}
                        {state.chatHistory.map((msg, i) => (
                          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed ${
                              msg.role === 'user' ? 'bg-emerald-600/20 text-emerald-100 border border-emerald-500/30' : 'bg-slate-800/40 text-slate-300 border border-slate-700'
                            }`}>
                              {msg.text}
                            </div>
                            {msg.sources && msg.sources.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2 px-1">
                                {msg.sources.map((s, si) => (
                                  <a key={si} href={s.uri} target="_blank" rel="noreferrer" className="text-[9px] font-black text-emerald-500/70 hover:text-emerald-400 uppercase border border-emerald-900/50 px-2 py-0.5 rounded-md transition-colors bg-emerald-950/20">
                                    Source: {s.title.slice(0, 20)}...
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        {state.isChatting && (
                          <div className="flex gap-2 p-2">
                             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-75"></div>
                             <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-150"></div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      <form onSubmit={sendChatMessage} className="relative mt-4">
                        <input 
                          type="text" 
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Command specimen inquiry..." 
                          className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4 text-xs font-bold text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors shadow-xl"
                        />
                        <button type="submit" disabled={state.isChatting} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-500 transition-colors disabled:opacity-50">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </button>
                      </form>
                   </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <div className="w-32 h-32 bg-slate-800/10 rounded-[3rem] border-4 border-dashed border-slate-800 flex items-center justify-center mb-8 animate-pulse">
                   <svg className="h-12 w-12 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                   </svg>
                </div>
                <h4 className="text-2xl font-black text-slate-700 uppercase italic">Awaiting Target Link</h4>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-auto py-16 bg-slate-900/50 backdrop-blur-3xl border-t border-slate-800/50 rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Column 1: Core Identity */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xl font-black tracking-tighter uppercase italic text-white">GeoSentinel <span className="text-emerald-500">Pro</span></span>
            </div>
            <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-xs">
              A high-fidelity geological analysis and petrography platform built for field professionals and academic researchers.
            </p>
            <div className="pt-4 border-t border-slate-800/50">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 italic underline underline-offset-4 decoration-emerald-900">Expert App Architect</p>
              <div className="flex items-center gap-3">
                <p className="text-sm font-black text-white uppercase tracking-tighter italic">Muhammad Yasin Khan</p>
                <a href="https://www.facebook.com/muhammad.yasin.khan.857718" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-400 transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-8.74h-2.94v-3.403h2.94v-2.511c0-2.91 1.777-4.496 4.375-4.496 1.243 0 2.311.092 2.622.134v3.039l-1.799.001c-1.411 0-1.685.671-1.685 1.655v2.172h3.364l-.438 3.403h-2.926v8.742h6.199c.732 0 1.325-.593 1.325-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
                </a>
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase mt-1 tracking-widest">Lead Systems Engineer & Geologist</p>
            </div>
          </div>

          {/* Column 2: Tech Stack Metadata */}
          <div className="space-y-6">
            <h6 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">System Engine Metadata</h6>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] font-black text-cyan-500">AI</div>
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Inference Core</p>
                  <p className="text-[9px] font-bold text-slate-500">Powered By: Google Gemini 3 Flash Preview</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] font-black text-emerald-500">WEB</div>
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Knowledge Base</p>
                  <p className="text-[9px] font-bold text-slate-500">Real-time Google Search Grounding</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] font-black text-orange-500">VIS</div>
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Visualization Pipeline</p>
                  <p className="text-[9px] font-bold text-slate-500">Nano-Banana Gen-AI Render Engine</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Diagnostic Specs */}
          <div className="space-y-6">
            <h6 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Application Diagnostic</h6>
            <div className="bg-black/50 p-6 rounded-3xl border border-slate-800/50 space-y-3">
              <div className="flex justify-between items-center text-[9px] font-black uppercase">
                <span className="text-slate-500">App Version</span>
                <span className="text-white">v1.0.120-STABLE</span>
              </div>
              <div className="flex justify-between items-center text-[9px] font-black uppercase">
                <span className="text-slate-500">Petrology DB</span>
                <span className="text-emerald-500">Region-Optimized (Indus Basin)</span>
              </div>
              <div className="flex justify-between items-center text-[9px] font-black uppercase">
                <span className="text-slate-500">Lab Interface</span>
                <span className="text-cyan-500">Web-GL (Three.js) High Detail</span>
              </div>
            </div>
            <p className="text-[8px] font-black text-slate-700 uppercase text-center tracking-[0.5em] opacity-50">
              PROPRIETARY GEOSENTINEL DATASTREAM • 2025
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
