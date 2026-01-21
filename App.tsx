
import React, { useState, useRef } from 'react';
import { ScannerView } from './components/ScannerView';
import { Button } from './components/Button';
import { DRAINAGE_REGIONS } from './constants';
import { AppState, DrainageRegion, ScanResult, RockIdentification, ScanningMode } from './types';
import { identifyRock } from './geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isScanning: true,
    mode: 'FIELD',
    selectedDrainage: 'Global',
    lastResult: null,
    history: [],
    error: null
  });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      history: [result, ...prev.history].slice(0, 10)
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setState(prev => ({ ...prev, isScanning: false })); // Pause auto-scan while uploading

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result?.toString().split(',')[1];
      if (base64) {
        const result = await identifyRock(base64, state.selectedDrainage, state.mode);
        if (result) {
          handleScanResult(result);
        }
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
    // Reset file input
    event.target.value = '';
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const isHighConfidence = state.lastResult && state.lastResult.identification.confidence >= 0.75;

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 md:p-8 transition-colors duration-1000`}>
      {/* Header */}
      <header className="max-w-7xl mx-auto w-full mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 ${state.mode === 'THIN_SECTION' ? 'bg-cyan-600' : 'bg-emerald-600'} rounded-2xl flex items-center justify-center shadow-lg border-b-4 border-black/30 transition-colors`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter">GEOSENTINEL <span className={state.mode === 'THIN_SECTION' ? 'text-cyan-500' : 'text-emerald-500'}>PRO-SCAN</span></h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">v3.9 Field & Lab Petrography Engine</p>
          </div>
        </div>
        
        <div className="hidden md:flex flex-col items-end">
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 text-right">Analytical Head</span>
           <span className="text-sm font-bold text-slate-200">Muhammad Yasin Khan</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Scanner Interface */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-4">
            {/* Mode Switcher */}
            <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 gap-1">
              <button 
                onClick={() => setState(prev => ({ ...prev, mode: 'FIELD', lastResult: null }))}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.mode === 'FIELD' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Field Macro
              </button>
              <button 
                onClick={() => setState(prev => ({ ...prev, mode: 'THIN_SECTION', lastResult: null }))}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${state.mode === 'THIN_SECTION' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Thin Section
              </button>
            </div>

            <div className="flex items-center justify-between mb-2 px-2">
              <h2 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                <span className={`w-2 h-2 rounded-full ${state.isScanning ? (state.mode === 'THIN_SECTION' ? 'bg-cyan-500 animate-pulse' : 'bg-emerald-500 animate-pulse') : 'bg-red-500'}`}></span>
                Optical Target Reticle
              </h2>
              <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="rounded-full text-[10px] font-black uppercase tracking-widest px-4 border border-slate-700 bg-slate-800/40"
                  onClick={triggerUpload}
                  isLoading={isUploading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload Image
                </Button>
                <Button 
                    variant={state.isScanning ? "danger" : (state.mode === 'THIN_SECTION' ? 'secondary' : 'primary')} 
                    size="sm"
                    className="rounded-full text-[10px] font-black uppercase tracking-widest px-6"
                    onClick={() => setState(p => ({ ...p, isScanning: !p.isScanning }))}
                >
                    {state.isScanning ? "Deactivate" : "Engage Sensors"}
                </Button>
              </div>
            </div>
            
            <ScannerView 
              isScanning={state.isScanning}
              mode={state.mode}
              region={state.selectedDrainage}
              onResult={handleScanResult}
            />

            {state.mode === 'FIELD' && (
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] animate-in slide-in-from-left-4 duration-500">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Basin Weight Integration</p>
                <div className="flex flex-wrap gap-2">
                  {DRAINAGE_REGIONS.map(region => (
                    <button
                      key={region}
                      onClick={() => setState(p => ({ ...p, selectedDrainage: region }))}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                        state.selectedDrainage === region 
                        ? "bg-emerald-600 border-emerald-400 text-white shadow-lg" 
                        : "bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-500"
                      }`}
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deep Analysis Panel */}
        <div className="lg:col-span-6 space-y-6">
          <div className={`bg-slate-900 border-2 ${state.mode === 'THIN_SECTION' ? 'border-cyan-900' : 'border-slate-800'} rounded-[2.5rem] overflow-hidden shadow-2xl relative min-h-[600px] flex flex-col transition-colors duration-500`}>
            {/* HUD Status Bar */}
            <div className="bg-slate-800/40 backdrop-blur-md px-10 py-6 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Analysis Payload</h3>
                <div className={`text-[10px] font-bold ${state.mode === 'THIN_SECTION' ? 'text-cyan-500' : 'text-emerald-500'}`}>
                  {isUploading ? 'UPLOADING DATA...' : `Target: ${state.lastResult ? 'LOCKED' : 'ACQUIRING...'}`}
                </div>
              </div>
              {state.lastResult && !isUploading && (
                 <div className="text-right">
                    <div className={`text-2xl font-black ${isHighConfidence ? (state.mode === 'THIN_SECTION' ? 'text-cyan-500' : 'text-emerald-500') : 'text-slate-400'} tabular-nums`}>
                      {Math.round(state.lastResult.identification.confidence * 100)}%
                    </div>
                    <div className="text-[9px] font-black text-slate-500 uppercase">Certainty</div>
                 </div>
              )}
            </div>

            {isUploading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6">
                 <div className="w-16 h-16 border-4 border-slate-800 border-t-blue-500 rounded-full animate-spin"></div>
                 <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Ingesting External Data Source...</p>
              </div>
            ) : state.lastResult ? (
              <div className="p-10 flex-1 space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md ${
                      state.lastResult.identification.lithology.toLowerCase().includes('igneous') ? 'bg-orange-500/20 text-orange-400' :
                      state.lastResult.identification.lithology.toLowerCase().includes('sedimentary') ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {state.lastResult.identification.lithology}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-slate-800 text-slate-400 px-3 py-1 rounded-md">
                      {state.lastResult.identification.geologicalAge}
                    </span>
                  </div>
                  <h4 className="text-4xl font-black text-white tracking-tighter leading-tight">
                    {state.lastResult.identification.name}
                  </h4>
                </div>

                {/* MODE SPECIFIC ANALYSIS */}
                {state.lastResult.mode === 'THIN_SECTION' && state.lastResult.identification.petrography ? (
                  <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-3xl p-6 space-y-6">
                    <h5 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86 7.717l.591 1.182a2 2 0 003.58 0l.591-1.182a2 2 0 00-.547-2.387z" />
                      </svg>
                      Petrographic Profile (Lab v3.9)
                    </h5>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(state.lastResult.identification.petrography.mineralEstimatedPercentages).map(([min, pct]) => (
                        <div key={min} className="flex justify-between items-center border-b border-cyan-900/50 pb-2">
                          <span className="text-xs font-bold text-slate-400">{min}</span>
                          <span className="text-xs font-black text-cyan-500">{pct}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                       <span className="text-[9px] font-black text-cyan-600 uppercase tracking-widest block">Optical Diagnostics</span>
                       <div className="flex flex-wrap gap-2">
                         {state.lastResult.identification.petrography.opticalFeatures.map(f => (
                           <span key={f} className="text-[9px] font-bold bg-cyan-900/30 text-cyan-300 px-2 py-1 rounded border border-cyan-800">{f}</span>
                         ))}
                       </div>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                       <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Boundary Dynamics</span>
                       <p className="text-xs font-bold text-slate-200">{state.lastResult.identification.petrography.grainBoundaries}</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 space-y-4">
                    <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Provenance Analysis (Field v3.9)
                    </h5>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 text-center">
                        <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Roundness</span>
                        <span className="text-xs font-bold text-slate-200">{state.lastResult.identification.provenance.roundness}</span>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 text-center">
                        <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Transport</span>
                        <span className="text-xs font-bold text-slate-200 truncate">{state.lastResult.identification.provenance.transportDistance}</span>
                      </div>
                      <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 text-center">
                        <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Proximity</span>
                        <span className="text-xs font-bold text-slate-200">{state.lastResult.identification.provenance.sourceProximity}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Common Attributes */}
                <div className="grid grid-cols-2 gap-8 border-t border-slate-800 pt-8">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Textural Class</span>
                      <p className="text-sm font-bold text-slate-200">{state.lastResult.identification.metadata.texture}</p>
                    </div>
                    <div>
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Hardness Profile</span>
                       <span className="text-xs font-bold text-slate-300">{state.lastResult.identification.physicalCharacteristics.hardness} (Mohs)</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Environments</span>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                        {state.lastResult.identification.metadata.environment}
                      </p>
                    </div>
                    <div>
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Global Rarity</span>
                       <span className="text-[10px] font-black text-white bg-slate-800 px-2 py-1 rounded">{state.lastResult.identification.metadata.rarity}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-10">
                <div className="relative">
                  <div className={`w-32 h-32 bg-slate-800/40 ${state.mode === 'THIN_SECTION' ? 'rounded-full' : 'rounded-[3rem]'} border-4 border-dashed border-slate-700 flex items-center justify-center transition-all duration-700`}>
                     <svg xmlns="http://www.w3.org/2000/svg" className={`h-14 w-14 text-slate-600 animate-pulse`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                     </svg>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-2xl font-black text-slate-400 uppercase tracking-tighter">System Awaiting Target</h4>
                  <p className="text-sm text-slate-600 max-w-[280px] leading-relaxed font-medium mx-auto">
                    {state.mode === 'FIELD' ? 'Position sample for macro-lithology and provenance analysis.' : 'Place microscope thin-section under optic sensor for petrographic breakdown.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Mission Record */}
          {state.history.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-700 px-6">Field Log (Neural Stream)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {state.history.slice(1).map((item, idx) => (
                  <div key={idx} className={`bg-slate-900 border border-slate-800 p-4 rounded-3xl flex items-center justify-between hover:bg-slate-800 transition-all border-l-4 ${item.mode === 'THIN_SECTION' ? 'border-l-cyan-600/40' : 'border-l-emerald-600/40'}`}>
                    <div>
                      <h5 className="text-[10px] font-black text-slate-200 truncate max-w-[120px] uppercase tracking-widest">{item.identification.name}</h5>
                      <p className="text-[8px] text-slate-600 font-bold uppercase">{item.mode} • {item.identification.lithology}</p>
                    </div>
                    <div className={`text-[10px] font-black ${item.mode === 'THIN_SECTION' ? 'text-cyan-500' : 'text-emerald-500'}`}>
                      {Math.round(item.identification.confidence * 100)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto pt-24 pb-12 text-center border-t border-slate-900">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-wrap items-center justify-center gap-12">
            <div className="text-left space-y-1">
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Neural Logic</span>
               <span className="text-sm font-bold text-emerald-500">MULTI-HEAD CNN</span>
            </div>
            <div className="text-left space-y-1">
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Petrology Engine</span>
               <span className="text-sm font-bold text-cyan-500">THIN-SECTION v2</span>
            </div>
            <div className="text-left space-y-1">
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest block">Response Latency</span>
               <span className="text-sm font-bold text-slate-300">MINIMAL</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Expert App Developer: <span className="text-slate-100">Muhammad Yasin Khan</span></p>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Powered By: Google Gemini 3 Flash Preview</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
