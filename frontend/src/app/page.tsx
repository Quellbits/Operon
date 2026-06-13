"use client";
import Logo from '../components/Logo';
import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Terminal, 
  Cpu, 
  TrendingUp, 
  ShieldAlert, 
  Target, 
  Sparkles,
  MessageSquare,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WaitingListLanding() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState({ signups: 142, target: 500 });

  const API_BASE = "http://127.0.0.1:8000";

  // Stepper preview states
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    {
      title: "01. Ledger Ingestion",
      tagline: "AUTOLOAD_SCHEMA",
      description: "Drop standard CSV/Excel transaction sheets. Operon maps schema columns dynamically and normalizes unit pricing, volumes, and dates in seconds.",
      icon: <FileSpreadsheet className="text-orange-500" size={18} />
    },
    {
      title: "02. Margin Leak Scanner",
      tagline: "Z_SCORE_ANOMALIES",
      description: "Run statistical audits isolating supplier price drifts, duplicate billing, and customer-concentration risks mapping direct COGS exposure.",
      icon: <ShieldAlert className="text-purple-500" size={18} />
    },
    {
      title: "03. Strategic Timelines",
      tagline: "PHASED_IMPLEMENTATION",
      description: "Receive actionable 3-phase strategic roadmaps and compile executive-ready PDF audit briefs directly from your computed metrics.",
      icon: <Target className="text-blue-500" size={18} />
    },
    {
      title: "04. Converse with ARIA",
      tagline: "AI_COO_CHAT",
      description: "Consult your automated operations partner. Ask about profit trends, run regression forecasts, and verify outlier transaction details.",
      icon: <MessageSquare className="text-emerald-500" size={18} />
    }
  ];

  // Rotate demo steps automatically
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep(prev => (prev + 1) % steps.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API_BASE}/auth/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Something went wrong.");
      }

      setSubmitted(true);
      setMessage(data.message || "Thank you! You have been successfully added to our waiting list.");
      setMetrics(prev => ({ ...prev, signups: prev.signups + 1 }));
    } catch (err: any) {
      setError(err.message || "Unable to join waitlist. Please check your email format.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0e14] text-zinc-150 font-mono flex flex-col justify-between relative overflow-hidden selection:bg-orange-500/20 selection:text-orange-400">
      
      {/* Background coordinate grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none z-0" />

      {/* Cyberpunk glowing orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[450px] h-[450px] rounded-full opacity-5 blur-3xl pointer-events-none z-0 bg-radial from-orange-500 to-transparent" />
      <div className="absolute bottom-10 right-10 w-[200px] h-[200px] rounded-full opacity-[0.03] blur-3xl pointer-events-none z-0 bg-orange-600" />

      {/* Header */}
      <header className="h-20 max-w-7xl mx-auto w-full px-6 flex items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <Logo size={22} />
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-sm tracking-tight text-white">OPERON</span>
            <span className="text-[8px] text-zinc-550 tracking-widest font-bold">COO_LABS</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 border border-zinc-800 bg-[#121620]/30 px-3 py-1 rounded text-[9px] text-zinc-500">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
            <span>BUILD_PHASE: ACTIVE</span>
          </div>
          <a 
            href="/dashboard" 
            className="text-[9px] font-bold text-orange-400 border border-orange-500/20 hover:border-orange-500/50 bg-orange-500/5 hover:bg-orange-500/10 px-3 py-1.5 rounded transition-all"
          >
            ENTER_SANDBOX_DEMO
          </a>
        </div>
      </header>

      {/* Main Waiting list Content */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Headline and Form */}
          <div className="lg:col-span-7 space-y-8 text-left max-w-2xl">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/5 text-[9px] font-bold tracking-widest text-orange-400">
                <Sparkles size={10} className="animate-pulse" />
                <span>INTELLIGENT OPERATIONS INFRASTRUCTURE</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white font-mono leading-none">
                The Automated COO <br className="hidden sm:inline"/>
                for Data-Driven Teams
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-sans normal-case max-w-xl">
                Operon auto-ingests transaction sheets, exposes supplier rate drifts, details gross margin leakages, and drafts 3-phase strategic timelines. Stop losing percentages to ledger complexity.
              </p>
            </div>

            {/* Email form container */}
            <div className="bg-[#121620]/45 border border-zinc-800 rounded p-6 relative overflow-hidden max-w-lg">
              <div className="absolute top-0 right-0 w-24 h-[1px] bg-gradient-to-r from-transparent to-orange-500/40" />
              <div className="absolute bottom-0 left-0 w-24 h-[1px] bg-gradient-to-r from-orange-500/40 to-transparent" />
              
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form 
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit} 
                    className="space-y-4"
                  >
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest">ENTER CORPORATE EMAIL</label>
                      <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="coo@enterprise.com"
                          className="flex-1 bg-[#0c0e14] border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 rounded px-4 py-3 text-xs text-white placeholder-zinc-700 focus:outline-none transition-all"
                        />
                        <button 
                          type="submit"
                          disabled={loading}
                          className="bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs py-3 px-6 rounded transition-all flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 active:scale-95"
                        >
                          {loading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <>
                              REQUEST_EARLY_ACCESS
                              <ArrowRight size={12} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    {error && (
                      <p className="text-[10px] font-bold text-red-400 bg-red-950/10 border border-red-900/30 rounded p-2.5">
                        ⚠️ {error}
                      </p>
                    )}
                  </motion.form>
                ) : (
                  <motion.div 
                    key="success"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="py-4 text-center space-y-3"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
                      <CheckCircle2 size={20} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">WAITING_LIST_REGISTERED</h4>
                      <p className="text-[10px] text-zinc-400 font-sans normal-case px-4 leading-relaxed">
                        {message} We will reach out as soon as custom operations beta slots open.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Waitlist stats level indicator */}
            <div className="max-w-lg space-y-2">
              <div className="flex items-center justify-between text-[8px] font-bold text-zinc-550 uppercase tracking-widest">
                <span>Early Access Slots</span>
                <span className="text-orange-400 font-bold">{metrics.signups} / {metrics.target} joined</span>
              </div>
              <div className="h-1 bg-[#121620] rounded-full overflow-hidden flex gap-[2px]">
                {Array.from({ length: 20 }).map((_, idx) => {
                  const percentPerNode = 5;
                  const currentPercent = (metrics.signups / metrics.target) * 100;
                  const isActive = currentPercent >= (idx + 1) * percentPerNode;
                  return (
                    <div 
                      key={idx}
                      className="flex-1 h-full rounded-sm transition-all duration-1000"
                      style={{
                        backgroundColor: isActive ? '#f97316' : '#1e293b',
                        boxShadow: isActive ? '0 0 4px #f9731666' : 'none'
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Idea Showcase Widget */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            
            {/* Visual Terminal panel */}
            <div className="w-full bg-[#121620]/60 border border-zinc-800 rounded p-6 shadow-2xl space-y-6 text-left relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none bg-radial from-orange-500/5 to-transparent" />
              
              {/* Terminal header */}
              <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500/60" />
                  <span className="w-2 h-2 rounded-full bg-amber-500/60" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
                </div>
                <div className="text-[9px] text-zinc-650 flex items-center gap-1.5">
                  <Terminal size={10} />
                  <span>CORE_AUDIT_ENGINE_v0.2</span>
                </div>
              </div>

              {/* Steps interactive list */}
              <div className="space-y-3">
                {steps.map((step, idx) => {
                  const isActive = idx === activeStep;
                  return (
                    <div 
                      key={idx} 
                      onClick={() => setActiveStep(idx)}
                      className={`p-3 rounded border cursor-pointer transition-all duration-300 ${
                        isActive 
                          ? 'bg-[#191e2b] border-orange-500/30' 
                          : 'bg-zinc-950/20 border-transparent hover:border-zinc-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {step.icon}
                          <span className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-zinc-550'}`}>{step.title}</span>
                        </div>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border text-zinc-600 border-zinc-900 font-mono">
                          {step.tagline}
                        </span>
                      </div>
                      
                      {/* Smooth description expand */}
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: "auto", opacity: 1, marginTop: 8 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="text-[9.5px] text-zinc-400 font-sans leading-relaxed normal-case">
                              {step.description}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Small telemetry visualizer */}
              <div className="border border-zinc-850 rounded p-3 bg-zinc-950/30 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[8px] text-zinc-650 tracking-wider font-bold">OPERATIONS CORE STATUS</p>
                  <p className="text-[9px] text-zinc-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    SANDBOX_SIMULATOR_ACTIVE
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-[#0c0e14] border border-zinc-850 px-2 py-1 rounded">
                  <Cpu size={10} className="text-orange-400" />
                  <span className="text-[8px] text-orange-400 font-bold">98.2% ACC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-zinc-900 bg-zinc-950/20 px-6 shrink-0 relative z-10 flex items-center justify-between text-[8px] sm:text-[9px] text-zinc-650 max-w-7xl mx-auto w-full font-mono">
        <span>© 2026 OPERON SYSTEMS INC. ALL RIGHTS RESERVED.</span>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-zinc-400 transition-colors">SECURITY_STANDARD</a>
          <a href="#" className="hover:text-zinc-400 transition-colors">PRIVACY_MEMO</a>
        </div>
      </footer>
    </div>
  );
}
