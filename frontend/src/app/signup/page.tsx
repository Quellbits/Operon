"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowRight, Terminal, Activity, Database, Check, AlertCircle, Shield, Play, ArrowUpRight } from 'lucide-react';
import Logo from '../../components/Logo';

const APP_STAGE = process.env.NEXT_PUBLIC_APP_STAGE || "sandbox";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL Params to pass down to processing or checkout redirects
  const uploadIds = searchParams.get("uploadIds") || "";
  const queryParam = searchParams.get("query") || "";
  const sampleParam = searchParams.get("sample") || "false";
  
  const redirectTo = searchParams.get("redirect_to") || "";
  const tierParam = searchParams.get("tier") || "";
  const priceParam = searchParams.get("price") || "";

  // Auth States
  const [isLogin, setIsLogin] = useState(true); // default to Login like the mockup
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter Details (Name, Password)

  useEffect(() => {
    if (APP_STAGE !== "production") {
      setIsLogin(true);
    }
  }, []);
  
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  const logsSequence = [
    "[SYS] INITIALIZING OPERATIONS INTEL ENGINE...",
    "[SYS] SECURITY NODE SECURE_L4 ACTIVE",
    "[DATA] STREAMING INGESTION FROM STAGING AREA...",
    "[DATA] FILE: mock_transactions.csv (11.8 KB)",
    "[DATA] ROW COUNT: 1,492 VALID RECORDS",
    "[SCHEMA] RESOLVING COLUMN MAPPING PATTERNS...",
    "[SCHEMA] MAPPED: 'Supplier Cost' -> 'cost'",
    "[SCHEMA] MAPPED: 'Client Identifier' -> 'customer'",
    "[AUDIT] EXECUTING LEAKAGE DETECTOR CODE-G2...",
    "[AUDIT] WARNING: FREIGHT CONTRACT MISMATCH (WEST)",
    "[AUDIT] WARNING: ANOMALOUS OVERCHARGE IN ACME CORP",
    "[AUDIT] CALC_COMPLETE: 2 CRITICAL ANOMALIES FOUND",
    "[INTEL] HEALTH SCORE CALCULATED: 55.6/100",
    "[INTEL] EXECUTIVE PDF REPORT DRAFT READY",
    "[INTEL] ARIA AGENT MEMORY SYNCED."
  ];

  useEffect(() => {
    let index = 0;
    setTerminalLogs([logsSequence[0]]);
    const interval = setInterval(() => {
      index = (index + 1) % logsSequence.length;
      if (index === 0) {
        setTerminalLogs([logsSequence[0]]);
      } else {
        setTerminalLogs(prev => [...prev.slice(-6), logsSequence[index]]);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const API_BASE = "http://127.0.0.1:8000";

  // If already logged in, redirect directly (unless it is the default demo account)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload && payload.sub === "operon_default@example.com") {
          // Do not auto-redirect the default demo account, allow them to sign up / log in with their own account
          return;
        }
      } catch (e) {
        console.error("Token parsing error:", e);
      }

      if (redirectTo === "checkout") {
        router.push(`/checkout?tier=${encodeURIComponent(tierParam)}&price=${encodeURIComponent(priceParam)}`);
      } else {
        router.push(`/process?uploadIds=${uploadIds}&query=${encodeURIComponent(queryParam)}&sample=${sampleParam}`);
      }
    }
  }, [router, uploadIds, queryParam, sampleParam, redirectTo, tierParam, priceParam]);

  const handleContinueEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Log in flow
        const formBody = new URLSearchParams();
        formBody.append("username", email);
        formBody.append("password", password);

        const response = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formBody
        });

        if (!response.ok) {
          throw new Error("Invalid email or password.");
        }

        const data = await response.json();
        localStorage.setItem("token", data.access_token);
        
        // Redirect accordingly
        if (redirectTo === "checkout") {
          window.location.href = `/checkout?tier=${encodeURIComponent(tierParam)}&price=${encodeURIComponent(priceParam)}`;
        } else {
          window.location.href = `/process?uploadIds=${uploadIds}&query=${encodeURIComponent(queryParam)}&sample=${sampleParam}`;
        }
      } else {
        // Sign up flow
        const guestUploadId = uploadIds ? parseInt(uploadIds.split(",")[0]) : null;
        
        const response = await fetch(`${API_BASE}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            password: password,
            full_name: fullName || "Guest User",
            guest_upload_id: guestUploadId
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Registration failed. Account may already exist.");
        }

        // Authenticate immediately after signup
        const formBody = new URLSearchParams();
        formBody.append("username", email);
        formBody.append("password", password);

        const loginRes = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formBody
        });

        if (!loginRes.ok) {
          throw new Error("Login failed following registration.");
        }

        const loginData = await loginRes.json();
        localStorage.setItem("token", loginData.access_token);
        
        // Redirect accordingly
        if (redirectTo === "checkout") {
          window.location.href = `/checkout?tier=${encodeURIComponent(tierParam)}&price=${encodeURIComponent(priceParam)}`;
        } else {
          window.location.href = `/process?uploadIds=${uploadIds}&query=${encodeURIComponent(queryParam)}&sample=${sampleParam}`;
        }
      }
    } catch (err: any) {
      setError(err.message || "An authentication error occurred.");
      setLoading(false);
    }
  };

  const toggleMode = () => {
    if (APP_STAGE !== "production") return;
    setIsLogin(!isLogin);
    setStep(1);
    setError("");
    setPassword("");
    setFullName("");
  };

  // Render social login buttons
  const renderSocialButtons = () => (
    <div className="space-y-2.5">
      <button 
        type="button" 
        onClick={() => alert("Google SSO is simulated for this environment.")}
        className="w-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-zinc-300 font-mono text-[10px] py-2.5 px-4 rounded transition-all flex items-center justify-center gap-2 uppercase font-bold cursor-pointer"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        Log in with Google
      </button>

      <button 
        type="button" 
        onClick={() => alert("Apple SSO is simulated for this environment.")}
        className="w-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-zinc-300 font-mono text-[10px] py-2.5 px-4 rounded transition-all flex items-center justify-center gap-2 uppercase font-bold cursor-pointer"
      >
        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2 1.08-2.92 1.93-.63.75-1.18 1.9-1.03 3.01 1.11.09 2.27-.67 2.96-1.88z" />
        </svg>
        Log in with Apple
      </button>
    </div>
  );

  const vLines = ['10%', '25%', '40%', '55%', '70%', '85%'];
  const hLines = ['15%', '30%', '45%', '60%', '75%', '90%'];

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex relative overflow-hidden selection:bg-orange-500/30 selection:text-orange-200 w-full">
      
      {/* Global CSS style for laser sweep, blinking cursor and neon border */}
      <style>{`
        @keyframes scan-sweep {
          0% { top: -5%; opacity: 0; }
          10% { opacity: 0.15; }
          90% { opacity: 0.15; }
          100% { top: 105%; opacity: 0; }
        }
        @keyframes horizontal-flow {
          0% { left: -5%; opacity: 0; }
          5% { opacity: 0.8; }
          95% { opacity: 0.8; }
          100% { left: 105%; opacity: 0; }
        }
        .laser-glow {
          box-shadow: 0 0 15px 1px rgba(249, 115, 22, 0.3);
        }
        .neon-border-glow:hover {
          border-color: rgba(249, 115, 22, 0.35);
          box-shadow: 0 0 30px -5px rgba(249, 115, 22, 0.15);
        }
        .blinking-cursor {
          animation: blink 1s step-end infinite;
        }
        @keyframes blink {
          from, to { border-color: transparent }
          50% { border-color: #f97316 }
        }
      `}</style>

      {/* Coordinate Layout Grid Lines Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {vLines.map((left, idx) => (
          <div key={`v-${idx}`} className="absolute top-0 bottom-0 w-[1px] bg-zinc-900/30" style={{ left }} />
        ))}
        {hLines.map((top, idx) => (
          <div key={`h-${idx}`} className="absolute left-0 right-0 h-[1px] bg-zinc-900/30" style={{ top }} />
        ))}
        {vLines.map((left) => 
          hLines.map((top, hidx) => (
            <span key={`cross-${left}-${hidx}`} className="absolute text-zinc-800 font-mono text-[9px] select-none transform -translate-x-1/2 -translate-y-1/2 font-light" style={{ left, top }}>
              +
            </span>
          ))
        )}
      </div>

      {/* Moving Data Packet Flow Animation */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[
          { id: 1, top: '15%', duration: 14, delay: 0 },
          { id: 2, top: '45%', duration: 18, delay: 3 },
          { id: 3, top: '75%', duration: 16, delay: 6 }
        ].map((p) => (
          <div 
            key={`h-pkt-${p.id}`}
            className="absolute w-1 h-1 bg-orange-500 rounded-full shadow-[0_0_8px_#f97316] z-10"
            style={{
              top: p.top,
              animation: `horizontal-flow ${p.duration}s linear infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Left side: Authentication interface */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16 min-h-screen z-10 relative">
        
        {/* Header */}
        <div className="flex items-center gap-3">
          <Logo size={22} />
          <span className="font-bold text-xs tracking-wider text-white font-mono uppercase">OPERON</span>
          <span className="text-[7px] font-mono text-zinc-500 tracking-widest uppercase">SECURE_L4</span>
        </div>

        {/* Form area */}
        <div className="max-w-md w-full mx-auto my-auto p-6 sm:p-8 bg-zinc-950/60 border border-zinc-900 rounded backdrop-blur-md shadow-2xl relative group neon-border-glow transition-all duration-500 space-y-7">
          {/* Corner visual marks */}
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-700" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-700" />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-zinc-700" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-zinc-700" />

          <div className="space-y-1 text-left">
            <h1 className="text-xl sm:text-2xl font-light font-mono tracking-tight text-white uppercase">
              {isLogin ? "Welcome back" : "Create Account"}
            </h1>
            <p className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest">
              {isLogin ? "LOG_IN_PROMPT // IDENTIFY_USER" : "SIGN_UP_PROMPT // CREATE_WORKSPACE"}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleContinueEmail} className="space-y-5">
              {renderSocialButtons()}
              
              {/* OR divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-zinc-900"></div>
                <span className="flex-shrink mx-4 text-[9px] font-mono text-zinc-500 uppercase tracking-wider">OR_EMAIL_AUTH</span>
                <div className="flex-grow border-t border-zinc-900"></div>
              </div>

              {/* Email Input */}
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">EMAIL ADDRESS</label>
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-black border border-zinc-900 focus:border-orange-500 rounded px-4 py-2.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none transition-all font-mono"
                />
              </div>

              {error && (
                <p className="text-[10px] font-mono text-red-500 text-left">⚠️ ERROR_VAL: {error}</p>
              )}

              <button 
                type="submit"
                className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-white font-mono text-xs py-3 rounded transition-all flex items-center justify-center gap-1.5 uppercase font-bold cursor-pointer"
              >
                Continue with email
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4 text-left">
                {/* Email (Readonly representation) */}
                <div className="bg-black border border-zinc-900 rounded px-4 py-3.5 flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400 truncate pr-2">{email}</span>
                  <button 
                    type="button" 
                    onClick={() => setStep(1)} 
                    className="text-[9px] font-mono text-orange-400 hover:text-orange-350 underline uppercase shrink-0"
                  >
                    Change
                  </button>
                </div>

                {/* Additional details depending on mode */}
                {!isLogin && (
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">FULL NAME</label>
                    <input 
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full bg-black border border-zinc-900 focus:border-orange-500 rounded px-4 py-2 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none transition-all font-mono"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">PASSWORD</label>
                  <input 
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter security key"
                    className="w-full bg-black border border-zinc-900 focus:border-orange-500 rounded px-4 py-2 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {error && (
                <p className="text-[10px] font-mono text-red-500 text-left">⚠️ ERROR_VAL: {error}</p>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black font-mono font-bold text-xs py-3 rounded transition-all flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    PROCESSING...
                  </>
                ) : (
                  <>
                    {isLogin ? "LOG IN & CONTINUE" : "SIGN UP & CONTINUE"}
                    <ArrowRight size={12} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Toggle login/signup mode */}
          {APP_STAGE === "production" ? (
            <div className="text-center pt-2">
              <button 
                type="button"
                onClick={toggleMode}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors font-mono uppercase tracking-wider underline cursor-pointer"
              >
                {isLogin ? (
                  <>Don&apos;t have an account? <span className="font-bold text-orange-400">Sign up</span></>
                ) : (
                  <>Already have an account? <span className="font-bold text-orange-400">Log in</span></>
                )}
              </button>
            </div>
          ) : (
            <div className="text-center pt-2 text-[9px] text-zinc-650 font-mono uppercase tracking-wider">
              Registration is disabled during sandbox stage.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-[9px] text-zinc-650 text-center font-mono uppercase tracking-wider">
          By signing up, you agree to our{" "}
          <a href="#" className="underline hover:text-zinc-400">Terms of Service</a>{" "}
          and{" "}
          <a href="#" className="underline hover:text-zinc-400">Privacy Policy</a>.
        </div>

      </div>

      {/* Right side: Operations Intelligence Scan Visual (Dark panel with scanning animations) */}
      <div className="hidden lg:flex w-1/2 bg-zinc-950 border-l border-zinc-900 items-center justify-center min-h-screen relative overflow-hidden z-10">
        
        {/* Coordinate horizontal/vertical divider grids in background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />
        
        {/* Scanning laser line sweep */}
        <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent pointer-events-none z-0 laser-glow" style={{ animation: 'scan-sweep 10s linear infinite' }} />

        {/* Intersect Crosses */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
          {vLines.map((left) => 
            hLines.map((top, hidx) => (
              <span key={`cross-r-${left}-${hidx}`} className="absolute text-zinc-800 font-mono text-[9px] select-none transform -translate-x-1/2 -translate-y-1/2" style={{ left, top }}>
                +
              </span>
            ))
          )}
        </div>

        {/* Visual Content Stack */}
        <div className="w-11/12 max-w-md space-y-6 relative z-10">
          
          {/* Visual 1: Translucent Input Console with custom orange caret */}
          <div className="bg-black border border-zinc-900 p-5 rounded shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center justify-between transition-all duration-300 hover:border-zinc-700">
            <div className="flex items-center gap-3 truncate pr-4 text-left">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shrink-0" />
              <span className="text-zinc-350 font-mono text-[11px] truncate uppercase tracking-wider">
                {redirectTo === "checkout" ? `Subscribe to ${tierParam}` : queryParam ? decodeURIComponent(queryParam) : "Scan for freight cost leakages"}
              </span>
              <span className="w-[1.5px] h-3.5 bg-orange-500 blinking-cursor border-l"></span>
            </div>
            <div className="w-6 h-6 rounded bg-orange-500 text-black flex items-center justify-center shrink-0">
              <span className="text-[10px] font-bold">↑</span>
            </div>
          </div>

          {/* Visual 2: Live Operations Scanning Logs console */}
          <div className="bg-black border border-zinc-900 rounded p-5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative font-mono text-[10px] text-left h-56 overflow-hidden flex flex-col justify-between">
            {/* Terminal Header */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3 text-[8px] text-zinc-500 tracking-widest uppercase">
              <span className="flex items-center gap-1.5 font-bold">
                <Terminal size={10} className="text-orange-400 animate-pulse" />
                CONSOLE_SYSTEM_LOG
              </span>
              <span className="text-orange-500 animate-pulse flex items-center gap-1 font-bold">
                <span className="w-1 h-1 rounded-full bg-orange-500 animate-ping" />
                STATUS_SCANNING
              </span>
            </div>

            {/* Scrollable logs */}
            <div className="flex-1 space-y-2 overflow-hidden flex flex-col justify-end">
              {terminalLogs.map((log, i) => {
                const isWarning = log.includes("WARNING");
                const isSuccess = log.includes("complete") || log.includes("OK") || log.includes("READY");
                return (
                  <div key={i} className={`flex items-start gap-2 leading-relaxed tracking-wide ${
                    isWarning ? 'text-orange-400 animate-pulse' : isSuccess ? 'text-emerald-400' : 'text-zinc-400'
                  }`}>
                    <span className="text-zinc-700 select-none">&gt;</span>
                    <span className="flex-1 font-mono">{log}</span>
                  </div>
                );
              })}
            </div>

            {/* Terminal Footer */}
            <div className="border-t border-zinc-900 pt-2.5 mt-3 flex justify-between text-[7px] text-zinc-600 tracking-wider uppercase font-bold">
              <span>LATENCY_STRL = 1.25s</span>
              <span>BUFFER_STATUS = OK</span>
            </div>
          </div>

          {/* Visual 3: Standardized Audit Pulse Indicator Card */}
          <div className="bg-black/60 border border-zinc-900 rounded p-4 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-3 text-left font-mono">
              <div className="w-9 h-9 rounded bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                <Activity size={16} className="animate-pulse" />
              </div>
              <div>
                <p className="text-[8px] text-zinc-500 uppercase tracking-wider">Operational Audit Scan</p>
                <p className="text-[10px] font-bold text-zinc-200 uppercase tracking-widest mt-0.5">Calculating Health Metrics</p>
              </div>
            </div>
            <div className="text-right font-mono">
              <span className="text-[9px] font-bold text-orange-400 bg-orange-500/15 border border-orange-500/30 px-2.5 py-0.5 rounded">
                ACTIVE
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-zinc-400 flex items-center justify-center font-mono text-xs uppercase tracking-widest">
        LOADING_AUTHENTICATION_PORTAL...
      </div>
    }>
      <SignupForm />
    </Suspense>
  );
}
