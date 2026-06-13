"use client";
import Logo from '../components/Logo';


import React, { useState, useRef, useEffect } from 'react';
import { 
  CloudUpload, 
  ArrowRight, 
  Loader2, 
  DollarSign, 
  Activity, 
  Check, 
  Database, 
  TrendingUp, 
  FileText, 
  Terminal, 
  AlertCircle, 
  ChevronRight, 
  Sparkles, 
  Cpu, 
  Play,
  ArrowUpRight,
  Shield,
  HelpCircle,
  FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [query, setQuery] = useState("");
  const [uploadIds, setUploadIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [useSample, setUseSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Custom states for interactive widgets
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const API_BASE = "http://127.0.0.1:8000";

  // Coordinates data for grid crossings
  const vLines = ['10%', '25%', '40%', '55%', '70%', '85%'];
  const hLines = ['15%', '30%', '45%', '60%', '75%', '90%'];

  const gridLabels = [
    { x: '10%', y: '15%', text: 'OP.SYS_L01' },
    { x: '40%', y: '30%', text: '[44.02° N, 12.89° E]' },
    { x: '70%', y: '45%', text: 'TRANSACTIONS_IN' },
    { x: '25%', y: '60%', text: 'AUDIT.NODE_R2' },
    { x: '85%', y: '75%', text: 'SYS.STATUS_OK' },
    { x: '55%', y: '90%', text: 'LATENCY.4.4s' }
  ];

  // Grid packets coordinates to animate along lines
  const horizontalPackets = [
    { id: 1, top: '15%', duration: 18, delay: 0 },
    { id: 2, top: '45%', duration: 24, delay: 4 },
    { id: 3, top: '75%', duration: 20, delay: 8 },
    { id: 4, top: '30%', duration: 22, delay: 2 },
    { id: 5, top: '60%', duration: 16, delay: 6 },
    { id: 6, top: '90%', duration: 28, delay: 10 }
  ];

  const verticalPackets = [
    { id: 1, left: '10%', duration: 20, delay: 1 },
    { id: 2, left: '40%', duration: 26, delay: 5 },
    { id: 3, left: '70%', duration: 18, delay: 9 },
    { id: 4, left: '25%', duration: 24, delay: 3 },
    { id: 5, left: '55%', duration: 15, delay: 7 },
    { id: 6, left: '85%', duration: 22, delay: 11 }
  ];

  // Cycle stepper animation automatically
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 4);
    }, 4500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUseSample(false);
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length > 5) {
        setError("You can upload up to 5 files at a time.");
        return;
      }
      await uploadFiles(selectedFiles);
    }
  };

  const uploadFiles = async (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setLoading(true);
    setError("");
    const ids: number[] = [];

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${API_BASE}/uploads/`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to parse ${file.name}. Please upload a standard CSV or Excel transaction file.`);
        }

        const data = await response.json();
        ids.push(data.id);
      }
      setUploadIds(ids);
    } catch (err: any) {
      setError(err.message || "Failed to process the spreadsheets.");
      setFiles([]);
      setUploadIds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUseSample = () => {
    setFiles([new File([""], "sample_transactions.csv")]);
    setUseSample(true);
    setUploadIds([1]);
    setError("");
  };

  const handleAnalyze = () => {
    if (!query.trim()) {
      setError("Please describe the specific issue or area you want the Operations Copilot to analyze.");
      return;
    }
    if (uploadIds.length === 0 && !useSample) {
      setError("Please upload at least one spreadsheet file or select the sample dataset to proceed.");
      return;
    }

    const finalQuery = encodeURIComponent(query.trim());
    const finalUploadIds = uploadIds.join(",");
    const isSample = useSample ? "true" : "false";

    // Always route through the signup/login page first. If already logged in, the signup page will immediately auto-redirect the user to `/process` (the generation page).
    window.location.href = `/signup?uploadIds=${finalUploadIds}&query=${finalQuery}&sample=${isSample}`;
  };

  const stepsData = [
    {
      title: "01 / Ingestion & Integrity",
      subtitle: "Parsing & File Validation",
      desc: "Upload CSV, XLS, or TSV ledgers. Operon maps row hierarchies, validates dates, and ensures mathematical cleanliness automatically."
    },
    {
      title: "02 / Schema Standardization",
      subtitle: "Semantic Mapping Engine",
      desc: "Our model matches messy custom headers (e.g. 'amt_billed', 'client_id') to core business attributes without manual alignment."
    },
    {
      title: "03 / Cost & P&L Audit Scan",
      subtitle: "Deterministic Rule Check",
      desc: "Iterates through rows checking for vendor double-billing, contract price inflation, regional freight markups, and margin drifts."
    },
    {
      title: "04 / Executive Report Draft",
      subtitle: "Action Plan Synthesis",
      desc: "Produces consultant-grade executive reviews customized to your core query, providing ready-to-run protocols to plug leakages."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-orange-500/30 selection:text-orange-200 overflow-x-hidden relative">
      
      {/* Global CSS Inject */}
      <style>{`
        @keyframes horizontal-flow {
          0% { left: -5%; opacity: 0; }
          5% { opacity: 0.8; }
          95% { opacity: 0.8; }
          100% { left: 105%; opacity: 0; }
        }
        @keyframes vertical-flow {
          0% { top: -5%; opacity: 0; }
          5% { opacity: 0.8; }
          95% { opacity: 0.8; }
          100% { top: 105%; opacity: 0; }
        }
        @keyframes scan-sweep {
          0% { top: -5%; opacity: 0; }
          10% { opacity: 0.15; }
          90% { opacity: 0.15; }
          100% { top: 105%; opacity: 0; }
        }
        .laser-glow {
          box-shadow: 0 0 15px 1px rgba(249, 115, 22, 0.4);
        }
        .neon-border-glow:hover {
          border-color: rgba(249, 115, 22, 0.35);
          box-shadow: 0 0 30px -5px rgba(249, 115, 22, 0.15);
        }
        .code-grid-bg {
          background-image: 
            radial-gradient(circle at center, rgba(39, 39, 42, 0.15) 1px, transparent 1px);
          background-size: 24px 24px;
        }
      `}</style>

      {/* 1. Base44 Border Layout Lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Vertical Lines */}
        {vLines.map((left, idx) => (
          <div 
            key={`v-${idx}`}
            className="absolute top-0 bottom-0 w-[1px] bg-zinc-800/30" 
            style={{ left }}
          />
        ))}
        {/* Horizontal Lines */}
        {hLines.map((top, idx) => (
          <div 
            key={`h-${idx}`}
            className="absolute left-0 right-0 h-[1px] bg-zinc-800/30" 
            style={{ top }}
          />
        ))}

        {/* Intersection markers (+) */}
        {vLines.map((left) => 
          hLines.map((top, hidx) => (
            <span 
              key={`cross-${left}-${hidx}`}
              className="absolute text-zinc-800 font-mono text-[10px] select-none transform -translate-x-1/2 -translate-y-1/2"
              style={{ left, top }}
            >
              +
            </span>
          ))
        )}

        {/* Monospace coordinate/system labels */}
        {gridLabels.map((label, idx) => (
          <div
            key={`lbl-${idx}`}
            className="absolute text-[8px] font-mono text-zinc-600/80 select-none uppercase tracking-widest pointer-events-none"
            style={{ left: label.x, top: label.y, transform: 'translate(8px, -12px)' }}
          >
            {label.text}
          </div>
        ))}
      </div>

      {/* 2. Linear Data Packet Flow Animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {horizontalPackets.map((p) => (
          <div 
            key={`h-pkt-${p.id}`}
            className="absolute w-1.5 h-1.5 bg-orange-600 rounded-full shadow-[0_0_8px_#f97316] z-10"
            style={{
              top: p.top,
              animation: `horizontal-flow ${p.duration}s linear infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
        {verticalPackets.map((p) => (
          <div 
            key={`v-pkt-${p.id}`}
            className="absolute w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_8px_#f97316] z-10"
            style={{
              left: p.left,
              animation: `vertical-flow ${p.duration}s linear infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* 3. Moving Scanning Laser Sweep */}
      <div 
        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent pointer-events-none z-0 laser-glow" 
        style={{ animation: 'scan-sweep 16s linear infinite' }}
      />

      {/* Background Ambient Orbs */}
      <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-zinc-950 via-black to-black pointer-events-none z-0" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-orange-500/5 rounded-full filter blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-orange-500/5 rounded-full filter blur-[120px] pointer-events-none z-0" />

      {/* Header */}
      <header className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-zinc-900 z-50 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={26} />
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-sm tracking-tight text-white font-mono">OPERON</span>
              <span className="text-[8px] font-mono text-zinc-500 tracking-wider">SECURE_L4</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 text-[11px] font-mono text-zinc-400">
            <a href="#console" className="hover:text-white transition-colors">CONSOLE</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">PIPELINE</a>
            <a href="#capabilities" className="hover:text-white transition-colors">CAPABILITIES</a>
            <a href="/pricing" className="hover:text-white transition-colors">PRICING</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.location.href = "/dashboard"} 
              className="text-[10px] font-mono border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white bg-zinc-950 px-4.5 py-1.5 rounded transition-all flex items-center gap-1.5"
            >
              CONSOLE_DASHBOARD <ArrowUpRight size={10} />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        
        {/* Hero Section */}
        <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900/60 border border-zinc-800 rounded text-[9px] font-mono text-zinc-400 tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-600 animate-pulse" />
            OPERATIONAL AUDIT ENGINE ACTIVE // STATUS: READY
          </div>
          
          <h1 className="text-4xl sm:text-7xl font-light tracking-tight leading-none text-white max-w-4xl mx-auto font-mono">
            BUILD OPERATIONAL <br className="hidden sm:inline" />
            INTELLIGENCE
          </h1>
          
          <p className="text-zinc-500 text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-mono">
            Ingest spreadsheets or ledger records, ask a specific operational concern, and watch Operon audit transactions, scan cost leakages, and compile action plans.
          </p>
        </section>

        {/* Central Operations Console */}
        <section id="console" className="max-w-4xl mx-auto px-6 pb-24 scroll-mt-20">
          <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-6 sm:p-8 backdrop-blur-md shadow-2xl relative group neon-border-glow transition-all duration-500">
            {/* Corner visual marks */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-700" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-zinc-700" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-zinc-700" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-zinc-700" />
            
            <div className="grid grid-cols-1 gap-6 relative z-10">
              
              {/* Query section */}
              <div className="space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Terminal size={12} className="text-orange-400" />
                    01 / ENTER OPERATIONAL QUERY
                  </label>
                  <span className="text-[8px] font-mono text-zinc-600">INPUT_VAL = STRING</span>
                </div>
                <input 
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., Scan for freight cost leakages or analyze Region 2 margin declines..."
                  className="w-full bg-black border border-zinc-800 focus:border-orange-500 rounded px-4 py-3 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none transition-all font-mono"
                />
              </div>

              {/* Spreadsheets Upload Section */}
              <div className="space-y-3 text-left">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Database size={12} className="text-orange-400" />
                    02 / UPLOAD SPREADSHEETS
                  </label>
                  <span className="text-[8px] font-mono text-zinc-600">MAX_FILES = 5 // CSV_XLSX</span>
                </div>
                
                {/* 5 slots files grid */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                  {[0, 1, 2, 3, 4].map((idx) => {
                    const file = files[idx];
                    const isUploaded = uploadIds[idx] !== undefined;
                    return (
                      <div 
                        key={idx} 
                        className={`border p-3 rounded flex flex-col justify-between h-24 transition-all relative ${
                          file 
                            ? 'border-orange-500/30 bg-orange-500/5 shadow-[0_0_10px_rgba(249,115,22,0.05)]' 
                            : 'border-zinc-900 bg-zinc-950/40 text-zinc-600'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className="text-[8px] font-mono text-zinc-500 uppercase">Slot 0{idx + 1}</span>
                          {file && (
                            <span className={`w-1.5 h-1.5 rounded-full ${isUploaded ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-spin'}`} />
                          )}
                        </div>
                        <div className="mt-2 truncate">
                          {file ? (
                            <>
                              <p className="text-[10px] font-mono text-zinc-300 truncate">{file.name}</p>
                              <p className="text-[8px] font-mono text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
                            </>
                          ) : (
                            <p className="text-[9px] font-mono text-zinc-700 italic">EMPTY_SLOT</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Upload drag drop panel */}
                {files.length === 0 && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-zinc-900 hover:border-zinc-800 bg-zinc-950/20 rounded p-8 flex flex-col items-center justify-center text-center cursor-pointer group transition-all relative overflow-hidden"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept=".csv,.xlsx" 
                      multiple
                      className="hidden" 
                    />
                    <CloudUpload size={28} className="text-zinc-700 group-hover:text-orange-400 transition-colors mb-2" />
                    <p className="text-xs font-mono text-zinc-400 group-hover:text-white transition-colors">DRAG_OR_CLICK_TO_UPLOAD_SPREADSHEETS</p>
                    <p className="text-[10px] font-mono text-zinc-600 mt-1">Accepts up to 5 CSV/XLSX ledgers or invoice files</p>
                  </div>
                )}
              </div>

              {/* Error display */}
              {error && (
                <div className="text-left text-xs font-mono text-red-500 bg-red-950/10 border border-red-900/30 rounded p-3 relative z-10 flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>ERROR_CODE: {error}</span>
                </div>
              )}

              {/* Bottom console actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-900 relative z-10">
                {files.length === 0 ? (
                  <button 
                    type="button" 
                    onClick={handleUseSample}
                    className="text-[10px] text-zinc-400 hover:text-orange-400 font-mono underline transition-colors"
                  >
                    LOAD_SAMPLE_SANDBOX_TRANSACTIONS
                  </button>
                ) : (
                  <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    DATASETS_STAGED = {files.length}
                    <button 
                      onClick={() => { setFiles([]); setUploadIds([]); setUseSample(false); }}
                      className="text-zinc-500 hover:text-white underline ml-3"
                    >
                      CLEAR_ALL
                    </button>
                  </div>
                )}

                <button 
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-black font-mono font-bold text-xs px-8 py-3.5 rounded shadow-lg shadow-orange-500/10 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      UPLOADING_LEDGERS...
                    </>
                  ) : (
                    <>
                      RUN_COMPREHENSIVE_AUDIT
                      <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </section>

        {/* Section: Live Processing Pipeline Demo */}
        <section id="how-it-works" className="border-t border-zinc-900 bg-zinc-950/20 py-24 scroll-mt-20">
          <div className="max-w-5xl mx-auto px-6 space-y-12">
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-light text-white font-mono tracking-tight">PIPELINE ARCHITECTURE</h2>
              <p className="text-zinc-500 max-w-lg mx-auto text-xs font-mono">
                Observe the automated transition from raw accounting tables to clean semantic schemas and AI action reports.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              
              {/* Stepper Steps (Left 5 Cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  {stepsData.map((step, idx) => (
                    <div 
                      key={idx}
                      onClick={() => { setActiveStep(idx); setIsPlaying(false); }}
                      className={`p-4 rounded border transition-all cursor-pointer text-left font-mono relative ${
                        activeStep === idx 
                          ? "bg-zinc-950 border-orange-500/40 shadow-lg shadow-orange-500/5" 
                          : "bg-transparent border-transparent hover:bg-zinc-950/30 hover:border-zinc-900"
                      }`}
                    >
                      {activeStep === idx && (
                        <div className="absolute top-0 left-0 bottom-0 w-[2px] bg-orange-600" />
                      )}
                      
                      <div className="flex items-start gap-3">
                        <div className={`text-[10px] font-mono mt-0.5 ${activeStep === idx ? "text-orange-400" : "text-zinc-500"}`}>
                          [{idx + 1}]
                        </div>
                        <div>
                          <h4 className={`text-xs font-bold uppercase tracking-wider ${activeStep === idx ? "text-white" : "text-zinc-400"}`}>
                            {step.title}
                          </h4>
                          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">{step.subtitle}</span>
                          {activeStep === idx && (
                            <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed font-sans normal-case">
                              {step.desc}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 pl-4 flex items-center justify-between text-[10px] font-mono text-zinc-600">
                  <span>SELECT_STEP = MANUAL_OVERRIDE</span>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="text-orange-400 hover:underline"
                  >
                    {isPlaying ? "PAUSE_CYCLE" : "PLAY_CYCLE"}
                  </button>
                </div>
              </div>

              {/* Console / Simulator (Right 7 Cols) */}
              <div className="lg:col-span-7 bg-black border border-zinc-900 rounded p-6 shadow-2xl relative h-[380px] overflow-hidden flex flex-col font-mono text-xs">
                {/* Visual grid inside sandbox */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4 shrink-0 relative z-10">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-zinc-800" />
                    <span className="text-[9px] text-zinc-500">OPERON_PIPELINE.LOG</span>
                  </div>
                  <span className="text-[8px] bg-orange-500/15 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded uppercase tracking-widest font-bold">
                    {activeStep === 0 && "PARSING"}
                    {activeStep === 1 && "NORMALIZING"}
                    {activeStep === 2 && "AUDITING"}
                    {activeStep === 3 && "SYNTHESIZING"}
                  </span>
                </div>

                {/* Animated Widget Content */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none text-left relative z-10">
                  
                  {/* Step 0: Ingestion */}
                  {activeStep === 0 && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="text-zinc-400 flex items-center gap-2">
                        <Loader2 className="animate-spin text-orange-400 shrink-0" size={12} />
                        <span>Scanning directory for datasets...</span>
                      </div>
                      <div className="p-3 bg-zinc-950 border border-zinc-900 rounded flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-orange-400" />
                          <span className="text-zinc-300 text-[10px]">ledger_transactions.csv</span>
                        </div>
                        <span className="text-orange-400 text-[9px]">12.4 MB</span>
                      </div>
                      <div className="space-y-1 text-zinc-500 text-[10px]">
                        <p>{`> Parsing rows 0-1500...`}</p>
                        <p className="text-emerald-500">{`✔ Byte schema validated. No corrupt records found.`}</p>
                        <p className="text-orange-400">{`ℹ Detected 1,492 lines matching transactions format.`}</p>
                      </div>
                      
                      <table className="w-full text-[9px] border-collapse mt-2 text-zinc-500">
                        <thead>
                          <tr className="border-b border-zinc-900 text-zinc-600 text-left">
                            <th className="pb-1">Row</th>
                            <th className="pb-1">Inv_Cost</th>
                            <th className="pb-1">Vendor_Name</th>
                            <th className="pb-1">Cat</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-zinc-900/60">
                            <td className="py-1">001</td>
                            <td className="py-1 text-zinc-300">$18,450.00</td>
                            <td className="py-1">Freight_Global</td>
                            <td className="py-1">Logistics</td>
                          </tr>
                          <tr className="border-b border-zinc-900/60">
                            <td className="py-1">002</td>
                            <td className="py-1 text-zinc-300">$3,120.00</td>
                            <td className="py-1">Acme_Corp_LLC</td>
                            <td className="py-1">MRO</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Step 1: Schema Mapping */}
                  {activeStep === 1 && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="text-orange-400 flex items-center gap-2">
                        <Cpu size={12} />
                        <span>Semantic Mapping engine standardizing fields...</span>
                      </div>
                      
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center justify-between p-2 bg-zinc-950 border border-zinc-900 rounded">
                          <span className="text-zinc-500 bg-black px-1.5 py-0.5 rounded text-[9px]">Inv_Cost</span>
                          <span className="text-zinc-700">➡️</span>
                          <span className="text-orange-400 bg-orange-500/15 px-1.5 py-0.5 rounded text-[9px] font-bold">revenue</span>
                          <span className="text-[9px] text-emerald-400 font-bold">98% match</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-zinc-950 border border-zinc-900 rounded">
                          <span className="text-zinc-500 bg-black px-1.5 py-0.5 rounded text-[9px]">Vendor_Name</span>
                          <span className="text-zinc-700">➡️</span>
                          <span className="text-orange-400 bg-orange-500/15 px-1.5 py-0.5 rounded text-[9px] font-bold">customer</span>
                          <span className="text-[9px] text-emerald-400 font-bold">94% match</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-zinc-950 border border-zinc-900 rounded">
                          <span className="text-zinc-500 bg-black px-1.5 py-0.5 rounded text-[9px]">Txn_Dt</span>
                          <span className="text-zinc-700">➡️</span>
                          <span className="text-orange-400 bg-orange-500/15 px-1.5 py-0.5 rounded text-[9px] font-bold">date</span>
                          <span className="text-[9px] text-emerald-400 font-bold">100% match</span>
                        </div>
                      </div>
                      <div className="text-[9px] text-zinc-600">{`[MAPPING_ENG] Alignment complete. Ingesting transactions.`}</div>
                    </div>
                  )}

                  {/* Step 2: Cost & P&L Audit */}
                  {activeStep === 2 && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="text-orange-400 flex items-center gap-2">
                        <AlertCircle size={12} />
                        <span>Running cost leak audit calculations...</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="p-2 bg-red-950/15 border border-red-900/30 rounded flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0 animate-pulse" />
                          <div>
                            <p className="text-red-400 font-bold text-[9px] tracking-wider">REVENUE CONCENTRATION</p>
                            <p className="text-zinc-500 text-[9px]">Vendor Acme Corp LLC represents 38.2% of regional margins in Q2.</p>
                          </div>
                        </div>

                        <div className="p-2 bg-orange-950/15 border border-orange-900/30 rounded flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-1 shrink-0 animate-pulse" />
                          <div>
                            <p className="text-orange-400 font-bold text-[9px] tracking-wider">FREIGHT SHIPPING PRICE CREEP</p>
                            <p className="text-zinc-500 text-[9px]">Region West freight rates expanded by 12.5% despite fixed pricing.</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[9px] text-zinc-600 border-t border-zinc-900 pt-2 mt-2">
                        <span>Rows audited: 1,492 / 1,492</span>
                        <span className="text-orange-400 font-bold animate-pulse font-mono">Running metrics check...</span>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Executive Action Plan */}
                  {activeStep === 3 && (
                    <div className="space-y-3 animate-fadeIn">
                      <div className="flex items-center gap-4 p-3 bg-zinc-950 border border-zinc-900 rounded">
                        <div className="relative w-10 h-10 rounded-full border border-orange-500/20 flex items-center justify-center shrink-0">
                          <div className="absolute inset-0.5 rounded-full border-t border-r border-orange-500 animate-spin" />
                          <span className="text-[10px] font-bold text-orange-400">76%</span>
                        </div>
                        <div className="text-left">
                          <h5 className="font-bold text-zinc-300 text-[10px]">OPERATIONAL HEALTH = 76.2%</h5>
                          <p className="text-[9px] text-zinc-500">Freight Logistics exhibits cost leakage. Action required.</p>
                        </div>
                      </div>

                      <div className="bg-zinc-950/80 p-3 rounded border border-zinc-900 text-left space-y-1.5">
                        <p className="text-orange-400 font-bold tracking-wider text-[8px]">PROPOSED PLAN DRAFT</p>
                        <ul className="space-y-1 text-zinc-400 text-[9px] list-disc list-inside">
                          <li>Consolidate West region carrier accounts to plug pricing leakage.</li>
                          <li>Audit invoice lines from Acme Corp LLC to remove double billings.</li>
                        </ul>
                      </div>
                      
                      <div className="flex items-center justify-center pt-2">
                        <a href="/dashboard" className="text-[10px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1">
                          OPEN_ANALYTICS_DASHBOARD <ChevronRight size={10} />
                        </a>
                      </div>
                    </div>
                  )}

                </div>

                {/* Simulated Console Controls */}
                <div className="border-t border-zinc-900 pt-3 mt-3 flex items-center justify-between shrink-0 relative z-10">
                  <span className="text-[9px] text-zinc-600">CYCLE_INTERVAL = 4.5s</span>
                  <div className="flex items-center gap-1.5">
                    {stepsData.map((_, idx) => (
                      <button 
                        key={idx}
                        onClick={() => { setActiveStep(idx); setIsPlaying(false); }}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          activeStep === idx ? "bg-orange-600 scale-125" : "bg-zinc-800 hover:bg-zinc-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        </section>

        {/* Section: What is Operon? */}
        <section id="about" className="py-24 border-t border-zinc-900 max-w-5xl mx-auto px-6 scroll-mt-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-6 text-left">
              <div className="inline-block px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[9px] rounded tracking-wider uppercase">
                OPERATIONAL COPILOT
              </div>
              <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-white leading-tight font-mono">
                AUTOMATED INTELLIGENCE FOR SPREADSHEETS
              </h2>
              <p className="text-zinc-500 text-sm leading-relaxed font-sans">
                Operon is your intelligence layer for business operations. It transforms raw transactions, ledger files, and invoice spreadsheets into clear, audit-grade action plans. 
              </p>
              <p className="text-zinc-500 text-sm leading-relaxed font-sans">
                By running automated checks across your billing data, vendor payments, and inventory records, Operon acts as your virtual operations analyst. It maps custom fields dynamically, spots margin leakages, calculates exact health scores, and delivers recommendations to improve your bottom line.
              </p>

              <div className="space-y-2.5 pt-2 font-mono text-[11px] text-zinc-400">
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500" />
                  <span>No complex configuration or custom schema mapping</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500" />
                  <span>Generates structured executive PDF reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-500" />
                  <span>Encrypted sandboxed execution of operational data</span>
                </div>
              </div>
            </div>

            {/* Visual card container (Base44 style mockup) */}
            <div className="bg-zinc-950 border border-zinc-900 rounded p-6 sm:p-8 backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full filter blur-3xl" />
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-zinc-800" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-zinc-800" />
              
              <div className="space-y-6 text-left relative z-10">
                <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
                  <h4 className="font-bold text-xs text-zinc-300 font-mono tracking-widest">KPI_MONITORING</h4>
                  <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">STABLE</span>
                </div>

                <div className="space-y-4 font-mono text-[10px]">
                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-500">
                      <span>CLIENT_CONCENTRATION</span>
                      <span className="text-zinc-300">38.2%</span>
                    </div>
                    <div className="w-full bg-black h-1 rounded overflow-hidden">
                      <div className="bg-orange-500 h-1 w-[38.2%]" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-500">
                      <span>FREIGHT_OVERCHARGE_DRIFT</span>
                      <span className="text-zinc-300">12.5%</span>
                    </div>
                    <div className="w-full bg-black h-1 rounded overflow-hidden">
                      <div className="bg-orange-600 h-1 w-[65%]" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-zinc-500">
                      <span>GROSS_MARGIN_STABILITY</span>
                      <span className="text-zinc-300">54.8%</span>
                    </div>
                    <div className="w-full bg-black h-1 rounded overflow-hidden">
                      <div className="bg-emerald-500 h-1 w-[54.8%]" />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={handleUseSample}
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono text-[10px] py-3 rounded border border-zinc-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Play size={10} /> LOAD_INTERACTIVE_MOCK_DATA
                  </button>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* Section: Standardized Audit Capabilities */}
        <section id="capabilities" className="py-24 border-t border-zinc-900 scroll-mt-20">
          <div className="max-w-5xl mx-auto px-6 space-y-12">
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-light text-white font-mono tracking-tight">ENGINE CAPABILITIES</h2>
              <p className="text-zinc-500 max-w-lg mx-auto text-xs font-mono">
                No pipeline customizations required. The core engine applies audit validation rules to any financial database or ledger out-of-the-box.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div 
                className="bg-zinc-950 border border-zinc-900 rounded p-6 text-left space-y-3 hover:border-zinc-700 transition-colors relative"
                onMouseEnter={() => setHoveredCard(0)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/5 rounded-full filter blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center text-orange-400">
                  <DollarSign size={16} />
                </div>
                <h4 className="font-mono text-xs font-bold text-zinc-200 uppercase tracking-wider">Profit Leakage Scan</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Automatically flags billing overlaps, freight overcharges, and shipping tariff discrepancies across large, custom spreadsheet logs.
                </p>
              </div>

              <div 
                className="bg-zinc-950 border border-zinc-900 rounded p-6 text-left space-y-3 hover:border-zinc-700 transition-colors relative"
                onMouseEnter={() => setHoveredCard(1)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center text-orange-400">
                  <Activity size={16} />
                </div>
                <h4 className="font-mono text-xs font-bold text-zinc-200 uppercase tracking-wider">Margin Creep Tracking</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Traces unit costs and freight inflation over time, identifying which branches or products contract overall margin growth.
                </p>
              </div>

              <div 
                className="bg-zinc-950 border border-zinc-900 rounded p-6 text-left space-y-3 hover:border-zinc-700 transition-colors relative"
                onMouseEnter={() => setHoveredCard(2)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-center text-orange-400">
                  <TrendingUp size={16} />
                </div>
                <h4 className="font-mono text-xs font-bold text-zinc-200 uppercase tracking-wider">Concentration Audits</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Determines client and supplier revenue concentration indexes, warning developers of critical bottlenecks and single point of failures.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* Section: Accordion FAQ */}
        <section id="faq" className="py-24 border-t border-zinc-900 scroll-mt-20">
          <div className="max-w-3xl mx-auto px-6 space-y-12">
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-light text-white font-mono tracking-tight">FAQ / DOCS</h2>
              <p className="text-zinc-500 text-xs font-mono">
                Quick specs regarding ingestion, mappings, and pipeline security.
              </p>
            </div>

            <div className="space-y-4 font-mono">
              
              <div className="p-5 bg-zinc-950 border border-zinc-900 rounded text-left space-y-2">
                <h4 className="font-bold text-zinc-300 text-xs flex items-center gap-2">
                  <HelpCircle size={12} className="text-orange-400" />
                  WHAT SPREADSHEET TYPES ARE SUPPORTED?
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed font-sans normal-case">
                  Operon supports standard CSV, XLSX, and XLS transaction records. You don&apos;t have to format the files. As long as they contain transaction lines, dates, and cost metrics, our mapping engine will parse them successfully.
                </p>
              </div>

              <div className="p-5 bg-zinc-950 border border-zinc-900 rounded text-left space-y-2">
                <h4 className="font-bold text-zinc-300 text-xs flex items-center gap-2">
                  <HelpCircle size={12} className="text-orange-400" />
                  HOW DOES QUERY-BASED OPERATIONS AUDITING WORK?
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed font-sans normal-case">
                  When you submit a specific concern (e.g. *&quot;Scan Region 2 freight costs&quot;*), our engine isolates calculations corresponding to those segments and custom-compiles the executive summary to focus precisely on answering your core question.
                </p>
              </div>

              <div className="p-5 bg-zinc-950 border border-zinc-900 rounded text-left space-y-2">
                <h4 className="font-bold text-zinc-300 text-xs flex items-center gap-2">
                  <HelpCircle size={12} className="text-orange-400" />
                  IS MY TRANSACTION DATA SECURE?
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed font-sans normal-case">
                  Yes. All files are ingested directly into private databases and processing pipelines. Mappings and metrics calculation runs mathematically within isolated environments, and data is only accessible to authorized permanent accounts.
                </p>
              </div>

            </div>

          </div>
        </section>

        {/* Section: CTA Banner */}
        <section className="py-24 border-t border-zinc-900 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-orange-500/5 rounded-full filter blur-[120px] pointer-events-none" />
          
          <div className="max-w-4xl mx-auto px-6 text-center space-y-6 relative z-10 font-mono">
            <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-white uppercase">PLUG PROFIT LEAKAGES TODAY</h2>
            <p className="text-zinc-500 text-xs max-w-sm mx-auto leading-relaxed normal-case font-sans">
              Upload your transaction datasets and trigger the analytics engine. Receive a consultant-grade operational report within minutes.
            </p>
            <div>
              <button 
                onClick={() => {
                  window.scrollTo({ top: 200, behavior: 'smooth' });
                  fileInputRef.current?.click();
                }}
                className="bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs px-8 py-4 rounded shadow-xl shadow-orange-500/10 transition-all inline-flex items-center gap-2 group"
              >
                UPLOAD_AND_AUDIT_LEDGERS
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black py-12 relative z-10 text-[10px] font-mono text-zinc-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-orange-600 flex items-center justify-center">
              <span className="font-extrabold text-black text-[10px]">O</span>
            </div>
            <span className="font-bold text-zinc-300">OPERON</span>
          </div>
          <p className="text-zinc-600">© 2026 Operon Inc. All rights reserved. Operations Intelligence & Business Auditing Layer.</p>
          <div className="flex items-center gap-4">
            <a href="#console" className="hover:text-zinc-300 transition-colors">CONSOLE</a>
            <a href="#how-it-works" className="hover:text-zinc-300 transition-colors">PIPELINE</a>
            <a href="#capabilities" className="hover:text-zinc-300 transition-colors">CAPABILITIES</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
