"use client";

import Logo from '../components/Logo';
import React, { useState, useEffect } from 'react';
import { API_BASE } from '@/config';
import { 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Sparkles,
  MessageSquare,
  FileSpreadsheet,
  Zap,
  Cpu,
  Check,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RealAppLanding from '@/components/RealAppLanding';

export default function Home() {
  const [appStage, setAppStage] = useState<string | null>(null);
  const [stageLoading, setStageLoading] = useState(true);

  useEffect(() => {
    const fetchStage = async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/settings`);
        if (res.ok) {
          const data = await res.json();
          const stage = data.app_stage === 'sandbox' ? 'development' : data.app_stage;
          setAppStage(stage);
        } else {
          setAppStage("development");
        }
      } catch (err) {
        console.warn("Failed to fetch app stage config, defaulting to development mode.", err);
        setAppStage("development");
      } finally {
        setStageLoading(false);
      }
    };
    fetchStage();
  }, []);

  if (stageLoading) {
    return (
      <div className="min-h-screen bg-[#0c0e14] text-zinc-400 font-mono flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full opacity-[0.03] blur-3xl pointer-events-none bg-orange-500" />
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-orange-500" size={24} />
          <span className="text-[10px] tracking-widest uppercase text-zinc-655 font-bold">Initializing System Console...</span>
        </div>
      </div>
    );
  }

  if (appStage === 'production') {
    return <RealAppLanding />;
  }

  return <WaitingListLanding />;
}

function WaitingListLanding() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [metrics, setMetrics] = useState({ signups: 142, target: 500 });

  // Interactive Simulator Step State
  const [activeStep, setActiveStep] = useState(0);

  // Chat interactive state
  const [chatAnswers, setChatAnswers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const steps = [
    {
      title: "1. Drop in spreadsheets",
      shortTitle: "Spreadsheet Import",
      description: "Drop in your standard business transaction or billing logs. We instantly organize them into clean columns so they make sense, with zero manual data entry required.",
      icon: <FileSpreadsheet className="text-orange-500" size={18} />
    },
    {
      title: "2. Scan for hidden waste",
      shortTitle: "Smart Cost Scanner",
      description: "Our system audits every row of your files to flag duplicate charges, billing errors, and supplier price hikes you weren't warned about.",
      icon: <AlertTriangle className="text-amber-500" size={18} />
    },
    {
      title: "3. Get a direct saving plan",
      shortTitle: "Phased Saving Plan",
      description: "Receive a simple, step-by-step roadmap showing you exactly what rate to renegotiate or which duplicate bills to cancel to recover your cash.",
      icon: <FileText className="text-blue-500" size={18} />
    },
    {
      title: "4. Ask your finance partner",
      shortTitle: "Conversational Partner",
      description: "Chat with your virtual finance partner anytime. Ask where your money went, how to reduce monthly overhead, and get immediate, simple answers.",
      icon: <MessageSquare className="text-emerald-500" size={18} />
    }
  ];

  // Rotate simulator step automatically if the user isn't interacting
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep(prev => (prev + 1) % steps.length);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  // Reset chat simulations when step changes
  useEffect(() => {
    if (activeStep !== 3) {
      setChatAnswers([]);
      setIsTyping(false);
    } else {
      setIsTyping(true);
      const t = setTimeout(() => {
        setIsTyping(false);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [activeStep]);

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

  const handleChatOption = (option: string) => {
    if (isTyping) return;
    setChatAnswers(prev => [...prev, option]);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#0c0e14] text-zinc-150 font-mono flex flex-col justify-between relative overflow-x-hidden selection:bg-orange-500/20 selection:text-orange-400 w-full">
      
      {/* Background coordinate grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.008)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.008)_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none z-0" />

      {/* Cyberpunk glowing orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full opacity-[0.06] blur-3xl pointer-events-none z-0 bg-radial from-orange-500 to-transparent" />
      <div className="absolute bottom-10 right-10 w-[250px] h-[250px] rounded-full opacity-[0.02] blur-3xl pointer-events-none z-0 bg-orange-600" />
      <div className="absolute top-10 left-10 w-[200px] h-[200px] rounded-full opacity-[0.02] blur-3xl pointer-events-none z-0 bg-orange-650" />

      {/* Header */}
      <header className="h-20 max-w-7xl mx-auto w-full px-6 flex items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <Logo size={22} />
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-sm tracking-tight text-white">OPERON</span>
            <span className="text-[8px] text-zinc-550 tracking-widest font-bold">SMART_FINANCE</span>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2 border border-zinc-900 bg-[#121620]/30 px-3 py-1.5 rounded text-[9px] text-zinc-500 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
            <span>EARLY ACCESS WAITLIST</span>
          </div>
        </div>
      </header>

      {/* Main Waiting list Content */}
      <main className="flex-grow flex flex-col justify-center max-w-7xl mx-auto w-full px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Headline and Form */}
          <div className="lg:col-span-6 space-y-8 text-left max-w-2xl">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/5 text-[9px] font-bold tracking-widest text-orange-400">
                <Sparkles size={10} className="animate-pulse text-orange-455" />
                <span>MEET YOUR INTELLIGENT FINANCIAL PARTNER</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.15] uppercase">
                Find Hidden Waste & <br />
                Save Business Cash
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed font-sans normal-case max-w-xl">
                Tired of losing profit in complicated bills? Operon automatically scans your business files, alerts you to duplicate charges, and gives you a clear, step-by-step saving plan to keep more of what you earn.
              </p>
            </div>

            {/* Email form container */}
            <div className="bg-[#121620]/40 border border-zinc-900 rounded p-6 relative overflow-hidden max-w-lg shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-[1px] bg-gradient-to-r from-transparent to-orange-500/30" />
              <div className="absolute bottom-0 left-0 w-24 h-[1px] bg-gradient-to-r from-orange-500/30 to-transparent" />
              
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
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">JOIN THE EARLY ACCESS WAITING LIST</label>
                      <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                        <input 
                          type="email" 
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your.email@business.com"
                          className="flex-1 bg-[#0c0e14] border border-zinc-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 rounded px-4 py-3.5 text-xs text-white placeholder-zinc-800 focus:outline-none transition-all"
                        />
                        <button 
                          type="submit"
                          disabled={loading}
                          className="bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 text-black font-bold text-xs py-3.5 px-6 rounded transition-all flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 active:scale-95 cursor-pointer"
                        >
                          {loading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <>
                              RESERVE SLOT
                              <ArrowRight size={12} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    {error && (
                      <p className="text-[10px] font-bold text-red-400 bg-red-950/15 border border-red-955/40 rounded p-2.5">
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
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-455 mx-auto animate-bounce">
                      <CheckCircle2 size={20} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Access Slot Reserved</h4>
                      <p className="text-[10px] text-zinc-400 font-sans normal-case px-4 leading-relaxed">
                        {message} We've cataloged your registration and will contact you as slots open.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Progress indicators */}
            <div className="max-w-lg space-y-2">
              <div className="flex items-center justify-between text-[8px] font-bold text-zinc-550 uppercase tracking-widest">
                <span>Reserved Slots Status</span>
                <span className="text-orange-455 font-bold">{metrics.signups} / {metrics.target} joined</span>
              </div>
              <div className="h-1.5 bg-[#121620] rounded-full overflow-hidden flex gap-[2.5px] p-[1px]">
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
                        boxShadow: isActive ? '0 0 5px #f97316' : 'none'
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Visual Interactive Simulator */}
          <div className="lg:col-span-6 relative flex flex-col items-stretch justify-center space-y-6">
            
            {/* Visual Simulator Display Screen */}
            <div className="w-full bg-[#121620]/65 border border-zinc-900 rounded p-6 shadow-2xl space-y-5 text-left relative overflow-hidden backdrop-blur-sm min-h-[350px] flex flex-col justify-between">
              
              {/* Decorative corners */}
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-800" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-800" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-800" />
              
              {/* Screen Header */}
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 select-none">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                    <span className="w-1 h-1 rounded-full bg-orange-500 animate-ping" />
                  </span>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Interactive Sandbox Preview</span>
                </div>
                <div className="text-[8px] font-bold text-zinc-555 border border-zinc-850 px-2 py-0.5 rounded tracking-widest uppercase">
                  Step {activeStep + 1} of 4
                </div>
              </div>

              {/* Main Animated Display Area */}
              <div className="flex-grow flex items-center justify-center py-4 overflow-hidden relative">
                
                <AnimatePresence mode="wait">
                  
                  {activeStep === 0 && (
                    <motion.div 
                      key="step1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4 }}
                      className="w-full space-y-4 flex flex-col items-center justify-center text-center"
                    >
                      <div className="relative">
                        <motion.div 
                          animate={{ y: [0, -8, 0] }}
                          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                          className="w-14 h-14 bg-orange-500/10 border border-orange-500/30 rounded flex items-center justify-center text-orange-400 shadow-lg shadow-orange-500/5"
                        >
                          <FileSpreadsheet size={28} />
                        </motion.div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-955 border border-zinc-850 flex items-center justify-center">
                          <Check className="text-emerald-400" size={10} />
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 max-w-sm">
                        <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider block">Automatic Mapping</span>
                        <p className="text-[11px] text-zinc-350 leading-relaxed font-sans normal-case">
                          "Drag and drop spreadsheet... Normalizing transaction dates, supplier codes, and cleaning raw records..."
                        </p>
                      </div>

                      {/* Mock loading block */}
                      <div className="w-48 h-1.5 bg-zinc-900 border border-zinc-855 rounded-full overflow-hidden relative">
                        <motion.div 
                          initial={{ left: "-100%" }}
                          animate={{ left: "100%" }}
                          transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                          className="absolute top-0 bottom-0 w-24 bg-gradient-to-r from-transparent via-orange-500 to-transparent"
                        />
                      </div>
                    </motion.div>
                  )}

                  {activeStep === 1 && (
                    <motion.div 
                      key="step2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4 }}
                      className="w-full space-y-3 flex flex-col justify-center"
                    >
                      <span className="text-[8px] font-bold text-zinc-650 uppercase tracking-widest block mb-1">Scanning transactions...</span>
                      
                      <div className="space-y-2 relative">
                        <motion.div 
                          animate={{ y: [0, 92, 0] }}
                          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                          className="absolute left-0 right-0 h-[1.5px] bg-orange-500/50 shadow-md shadow-orange-500 z-10 pointer-events-none"
                        />

                        <div className="p-2 border border-zinc-850/60 bg-zinc-950/20 rounded flex items-center justify-between text-[10px] opacity-60">
                          <span className="text-zinc-400 font-sans">Office Rental Invoice</span>
                          <span className="text-zinc-400 font-bold">$1,800.00</span>
                        </div>

                        <motion.div 
                          animate={{ scale: [1, 1.01, 1], borderColor: ["#3f3f46", "#f97316", "#3f3f46"] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="p-2.5 border border-orange-500/20 bg-orange-500/5 rounded flex items-center justify-between text-[10px]"
                        >
                          <div className="space-y-0.5">
                            <span className="text-zinc-200 font-sans block">Software Hosting Service</span>
                            <span className="text-[7.5px] text-orange-455 font-bold uppercase tracking-widest block">Duplicate Bill Detected</span>
                          </div>
                          <span className="text-red-400 font-bold">-$450.00</span>
                        </motion.div>

                        <div className="p-2 border border-zinc-855/60 bg-zinc-955/20 rounded flex items-center justify-between text-[10px] opacity-60">
                          <span className="text-zinc-400 font-sans">Supplier Delivery Charge</span>
                          <span className="text-zinc-400 font-bold">$840.00</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeStep === 2 && (
                    <motion.div 
                      key="step3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4 }}
                      className="w-full space-y-4 flex flex-col justify-center"
                    >
                      <span className="text-[8px] font-bold text-zinc-650 uppercase tracking-widest block">Actionable Roadmaps</span>
                      
                      <div className="grid grid-cols-3 gap-3 relative font-sans text-[10px] normal-case text-zinc-300">
                        
                        <div className="p-3 border border-zinc-855 bg-zinc-950/20 rounded text-center relative flex flex-col justify-between min-h-[90px]">
                          <span className="text-[7px] text-zinc-650 font-bold uppercase tracking-wider font-mono">Immediate</span>
                          <p className="mt-1 leading-normal">Dispute Hosting Double Billing</p>
                          <span className="text-[8px] font-bold text-emerald-455 mt-1 font-mono uppercase">Save $450</span>
                        </div>

                        <div className="p-3 border border-orange-500/20 bg-orange-500/5 rounded text-center relative flex flex-col justify-between min-h-[90px]">
                          <span className="text-[7px] text-orange-400 font-bold uppercase tracking-wider font-mono">Week 2</span>
                          <p className="mt-1 leading-normal">Renegotiate Supplier Shipping Rates</p>
                          <span className="text-[8px] font-bold text-orange-400 mt-1 font-mono uppercase">Action Plan</span>
                        </div>

                        <div className="p-3 border border-zinc-855 bg-zinc-950/20 rounded text-center relative flex flex-col justify-between min-h-[90px] opacity-60">
                          <span className="text-[7px] text-zinc-655 font-bold uppercase tracking-wider font-mono">Month 1</span>
                          <p className="mt-1 leading-normal">Consolidate Software Licenses</p>
                          <span className="text-[8px] font-bold text-zinc-500 mt-1 font-mono uppercase">Review</span>
                        </div>

                      </div>
                    </motion.div>
                  )}

                  {activeStep === 3 && (
                    <motion.div 
                      key="step4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4 }}
                      className="w-full space-y-3 flex flex-col justify-between min-h-[160px] text-[10px]"
                    >
                      <div className="space-y-2 flex-grow overflow-y-auto max-h-[120px]">
                        <div className="flex gap-2 items-start text-left">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 text-[8px] font-bold">
                            AR
                          </div>
                          <div className="bg-[#191e2b] border border-emerald-500/10 text-zinc-200 p-2.5 rounded max-w-[85%] font-sans normal-case leading-relaxed">
                            "Hello! I analyzed your software expenses. I found that you are paying for 4 active software seats that haven't logged in for 90 days. Shall I draft the cancelation request?"
                          </div>
                        </div>

                        {chatAnswers.map((answer, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex gap-2 items-start justify-end text-right">
                              <div className="bg-zinc-900 border border-zinc-800 text-zinc-300 p-2.5 rounded max-w-[85%] font-sans normal-case leading-relaxed">
                                {answer}
                              </div>
                            </div>
                            
                            {!isTyping && index === chatAnswers.length - 1 && (
                              <div className="flex gap-2 items-start text-left">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 text-[8px] font-bold">
                                  AR
                                </div>
                                <div className="bg-[#191e2b] border border-emerald-500/10 text-zinc-200 p-2.5 rounded max-w-[85%] font-sans normal-case leading-relaxed">
                                  "Understood. I have compiled the email drafts. You can copy and send them, saving your business approximately $140 per month."
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {isTyping && (
                          <div className="flex gap-2 items-center text-left text-zinc-555 italic pl-7 text-[8.5px]">
                            <Loader2 className="animate-spin text-emerald-500" size={10} />
                            <span>ARIA is replying...</span>
                          </div>
                        )}
                      </div>

                      {chatAnswers.length === 0 && !isTyping && (
                        <div className="flex gap-2 justify-start pt-1.5 font-sans normal-case">
                          <button 
                            onClick={() => handleChatOption("Yes, please write the drafts.")}
                            className="px-2.5 py-1.5 rounded border border-zinc-800 hover:border-orange-500 hover:text-white bg-zinc-955/40 text-[9px] transition-colors cursor-pointer text-left"
                          >
                            "Yes, write the drafts"
                          </button>
                          <button 
                            onClick={() => handleChatOption("How much did we spend on software in total?")}
                            className="px-2.5 py-1.5 rounded border border-zinc-800 hover:border-orange-500 hover:text-white bg-zinc-955/40 text-[9px] transition-colors cursor-pointer text-left"
                          >
                            "What is our total spend?"
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                  
                </AnimatePresence>
              </div>

              {/* Step indicator description bottom */}
              <div className="border-t border-zinc-900 pt-3 flex items-start gap-2 text-zinc-500">
                <div className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center text-orange-455 shrink-0">
                  <Zap size={8} />
                </div>
                <p className="text-[9.5px] font-sans normal-case leading-relaxed">
                  {steps[activeStep].description}
                </p>
              </div>
            </div>

            {/* Stepper Selection Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {steps.map((step, idx) => {
                const isActive = idx === activeStep;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`p-2.5 rounded border transition-all text-center uppercase tracking-wider text-[8.5px] font-bold cursor-pointer select-none flex flex-col items-center gap-1.5 ${
                      isActive 
                        ? 'bg-orange-500/5 border-orange-500/30 text-orange-400 font-bold shadow-md shadow-orange-500/5'
                        : 'bg-zinc-950/20 border-zinc-900 text-zinc-555 hover:border-zinc-800 hover:text-zinc-300'
                    }`}
                  >
                    {step.icon}
                    <span>{step.shortTitle}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-zinc-900 bg-zinc-950/20 px-6 shrink-0 relative z-10 flex items-center justify-between text-[8px] sm:text-[9px] text-zinc-650 max-w-7xl mx-auto w-full font-mono select-none">
        <span>© 2026 OPERON SYSTEMS INC. ALL RIGHTS RESERVED.</span>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-zinc-400 transition-colors">SECURITY_STANDARD</a>
          <a href="#" className="hover:text-zinc-400 transition-colors">PRIVACY_MEMO</a>
        </div>
      </footer>
    </div>
  );
}
