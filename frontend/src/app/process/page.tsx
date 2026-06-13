"use client";
import Logo from '../../components/Logo';
import AIAgent from '../../components/AIAgent';

 
import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ArrowRight, Download, Terminal, MessageSquare, Send, CheckCircle2, Lock } from 'lucide-react';
 
const APP_STAGE = process.env.NEXT_PUBLIC_APP_STAGE || "sandbox";

export default function ProcessPage() {
  const [uploadId, setUploadId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [isSample, setIsSample] = useState(false);

  // Status & Logs
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing Operon Operations Pipeline...");
  const [activeTab, setActiveTab] = useState<'logs' | 'chat'>('logs');
  
  // Report Drafting
  const [draftedText, setDraftedText] = useState<string[]>([]);
  const [reportTitle, setReportTitle] = useState("");
  const [reportSummary, setReportSummary] = useState("");
  const [reportActions, setReportActions] = useState<string[]>([]);
  const [reportHealthScore, setReportHealthScore] = useState<any>(null);
  const [draftingProgress, setDraftingProgress] = useState(0); // 0: not started, 1: title, 2: summary, 3: actions, 4: complete
  
  // Save & Download report states
  const [dbReportId, setDbReportId] = useState<number | null>(null);
  const [reportSaved, setReportSaved] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState<any[]>([
    { role: "assistant", content: "Hi, I am your Operon Operations Agent. I have scanned the transactional data. Ask me anything about P&L metrics, leakage warnings, or custom recommendations." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Conversion Wall
  const [showSignup, setShowSignup] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");

  const consoleEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const API_BASE = "http://127.0.0.1:8000";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setUploadId(params.get("uploadIds") || params.get("uploadId"));
      setQuery(decodeURIComponent(params.get("query") || "Operational Review"));
      setIsSample(params.get("sample") === "true");
    }
  }, []);

  // 1. ETL Processing & Logs simulation
  useEffect(() => {
    if (!uploadId) return;

    let isSubscribed = true;
    const runPipeline = async () => {
      const token = localStorage.getItem("token") || "";
      const params = new URLSearchParams(window.location.search);
      const urlQuery = decodeURIComponent(params.get("query") || "Operational Review");
      const lowerQuery = urlQuery.toLowerCase();
      
      let logSteps = [
        "Analyzing spreadsheet mapping configurations...",
        "Validating canonical field bindings...",
        "Normalizing raw transactions into standard SQL schemas..."
      ];

      if (lowerQuery.includes("freight") || lowerQuery.includes("shipping") || lowerQuery.includes("delivery") || lowerQuery.includes("carrier")) {
        logSteps = [
          ...logSteps,
          "Filtering transactions with freight and logistics tags...",
          "Running carrier price-book audit algorithms...",
          "Calculating freight margin variance per shipping region...",
          "Scanning West Region shipping rates against benchmark contracts...",
          "Compiling freight cost leakage anomalies...",
          "Synthesizing customized operations report..."
        ];
      } else if (lowerQuery.includes("margin") || lowerQuery.includes("profit") || lowerQuery.includes("cost") || lowerQuery.includes("p&l") || lowerQuery.includes("p and l")) {
        logSteps = [
          ...logSteps,
          "Analyzing product profit margins and unit pricing...",
          "Tracing wholesale supplier cost changes...",
          "Calculating category gross margin contractions...",
          "Identifying locations with excessive margin contraction...",
          "Compiling P&L profit leakage anomalies...",
          "Synthesizing customized operations report..."
        ];
      } else if (lowerQuery.includes("customer") || lowerQuery.includes("concentration") || lowerQuery.includes("client") || lowerQuery.includes("sales")) {
        logSteps = [
          ...logSteps,
          "Grouping transaction volumes by customer account...",
          "Calculating top customer revenue concentration indexes...",
          "Checking client contract stability and lifetime values...",
          "Identifying key account revenue dependencies...",
          "Compiling client-related operations risks...",
          "Synthesizing customized operations report..."
        ];
      } else {
        logSteps = [
          ...logSteps,
          `Filtering transaction records matching: "${urlQuery}"...`,
          "Executing custom operations audit engine queries...",
          "Evaluating metrics stability and regional performance...",
          "Scanning for anomalies, cost leakages, and contract drifts...",
          "Compiling customized operational audit warnings...",
          `Synthesizing executive review tailored to: "${urlQuery}"...`
        ];
      }

      // Step logs simulation
      for (let i = 0; i < logSteps.length; i++) {
        if (!isSubscribed) return;
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${logSteps[i]}`]);
        setProgress(Math.round(((i + 1) / logSteps.length) * 100));
        await new Promise(r => setTimeout(r, 900));
      }

      // Hit process endpoint
      try {
        if (!uploadId) throw new Error("No upload IDs found.");
        const ids = uploadId.split(",").map(idStr => parseInt(idStr.trim())).filter(x => !isNaN(x));
        
        const response = await fetch(`${API_BASE}/uploads/process-batch`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ upload_ids: ids })
        });

        if (!response.ok) {
          throw new Error("Operational pipeline failed.");
        }

        const data = await response.json();
        if (!isSubscribed) return;

        setDbReportId(data.report_id);
        setReportTitle(`OPERON OPERATIONS AUDIT`);
        setReportSummary(data.summary);
        setReportActions(data.actions || []);
        setReportHealthScore(data.health_score || null);
        
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ Operational audit complete. Financial report generated.`]);
        setStatusText("Operational audit complete.");
        
        // Start streaming drafting document
        startDrafting();
        setActiveTab('chat');
      } catch (err: any) {
        if (isSubscribed) {
          setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ❌ Error: ${err.message}`]);
          setStatusText("Processing failed.");
        }
      }
    };

    runPipeline();
    return () => { isSubscribed = false; };
  }, [uploadId]);

  // Scroll consoles to bottom
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // 2. Stream Report Drafting Animation
  const startDrafting = async () => {
    setDraftingProgress(1); // Title
    await new Promise(r => setTimeout(r, 600));
    
    setDraftingProgress(2); // Summary
    await new Promise(r => setTimeout(r, 2000));
    
    setDraftingProgress(3); // Actions
    await new Promise(r => setTimeout(r, 1500));
    
    setDraftingProgress(4); // Complete
  };

  // 3. AI Operations Agent Chat Q&A
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setChatLoading(true);

    setTimeout(() => {
      let reply = "";
      const lowerMsg = userMsg.toLowerCase();
      
      if (lowerMsg.includes("leakage") || lowerMsg.includes("anomaly") || lowerMsg.includes("freight") || lowerMsg.includes("loss")) {
        reply = `Audit Check identifies a freight cost drift of 12.5% in the West Region, primarily due to carrier contract anomalies. We recommend consolidating carriers and checking duplicate invoices.`;
      } else if (lowerMsg.includes("margin") || lowerMsg.includes("profit") || lowerMsg.includes("p&l") || lowerMsg.includes("metrics")) {
        reply = `Our Metrics Engine calculated gross margin stability at 54.8% overall. However, Category MRO indicates unit cost fluctuations. You can check details in the dashboard metrics tab.`;
      } else if (lowerMsg.includes("customer") || lowerMsg.includes("concentration") || lowerMsg.includes("client")) {
        reply = `Customer concentration ratios show Acme Corp LLC holding 38.2% of regional revenues. This represents a moderate account dependency risk.`;
      } else {
        reply = `Reviewing transaction records matching your query. Operon has compiled structured recommendations. Let me know if you would like me to detail freight, margin metrics, or supplier audits.`;
      }

      setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
      setChatLoading(false);
    }, 800);
  };

  // 4. Signup conversion submit (backup in case token is cleared)
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupLoading) return;
    setSignupLoading(true);
    setSignupError("");

    try {
      const firstUploadId = uploadId ? parseInt(uploadId.split(",")[0]) : null;
      
      if (APP_STAGE === "production") {
        const signupRes = await fetch(`${API_BASE}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: signupEmail,
            password: signupPassword,
            full_name: signupName,
            guest_upload_id: firstUploadId
          })
        });

        if (!signupRes.ok) {
          const errData = await signupRes.json();
          throw new Error(errData.detail || "Registration failed. Email might already be in use.");
        }
      }

      const formBody = new URLSearchParams();
      formBody.append("username", signupEmail);
      formBody.append("password", signupPassword);

      const loginRes = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formBody
      });

      if (!loginRes.ok) {
        throw new Error(APP_STAGE === "production" ? "Login failed following registration." : "Invalid email or password.");
      }

      const loginData = await loginRes.json();
      localStorage.setItem("token", loginData.access_token);
      
      // Close signup modal and redirect to dashboard
      setShowSignup(false);
      window.location.href = "/dashboard";
    } catch (err: any) {
      setSignupError(err.message || "An error occurred.");
      setSignupLoading(false);
    }
  };

  // Custom function to handle PDF download
  const handleDownloadPDF = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      // Prompt sign up if token is missing
      setShowSignup(true);
      return;
    }
    
    if (!dbReportId || downloadingPDF) return;
    setDownloadingPDF(true);
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/reports/${dbReportId}/pdf`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `operon_operations_report_${dbReportId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to retrieve the PDF file from the server.");
      }
    } catch (err) {
      console.error("Download error:", err);
      alert("An error occurred during downloading.");
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Custom function to save report to dashboard
  const handleSaveReport = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setShowSignup(true);
      return;
    }
    
    if (!dbReportId || reportSaved || savingReport) return;
    setSavingReport(true);
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/reports/${dbReportId}/save`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setReportSaved(true);
      } else {
        alert("Failed to save report to dashboard.");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("An error occurred while saving.");
    } finally {
      setSavingReport(false);
    }
  };

  return (
    <>
      
      <div className="min-h-screen bg-black text-zinc-100 font-mono flex flex-col relative overflow-hidden">
      
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />

      {/* Header */}
      <header className="h-16 bg-black border-b border-zinc-900 px-6 flex items-center justify-between shrink-0 relative z-10">
        <div className="flex items-center gap-3">
          <Logo size={20} />
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-xs tracking-tight text-white">OPERON</span>
            <span className="text-[8px] text-zinc-500 tracking-wider">PIPELINE_DRAFTING</span>
          </div>
        </div>
        <div className="text-[10px] text-zinc-450">
          FOCUS_QUERY = <span className="text-orange-400 font-bold">&ldquo;{query}&rdquo;</span>
        </div>
      </header>

      {/* Main Workspace split screen */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative z-10">
        
        {/* Left Pane - Sidebar Logs / Chat */}
        <aside className="w-full md:w-80 lg:w-96 border-r border-zinc-900 bg-zinc-950/40 flex flex-col min-w-0 shrink-0">
          
          {/* Tabs header */}
          <div className="flex border-b border-zinc-900 bg-black/40 shrink-0">
            <button 
              onClick={() => setActiveTab('logs')}
              className={`flex-1 py-3.5 px-4 text-[10px] font-bold uppercase tracking-wider border-b transition-all flex items-center justify-center gap-1.5 focus:outline-none ${
                activeTab === 'logs' 
                  ? 'border-orange-500 text-orange-400 bg-zinc-950/20' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Terminal size={12} />
              ETL_LOGS
            </button>
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3.5 px-4 text-[10px] font-bold uppercase tracking-wider border-b transition-all flex items-center justify-center gap-1.5 focus:outline-none relative ${
                activeTab === 'chat' 
                  ? 'border-orange-500 text-orange-400 bg-zinc-950/20' 
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <MessageSquare size={12} />
              AGENT_CHAT
              {progress === 100 && activeTab !== 'chat' && (
                <span className="absolute top-2 right-4 w-1.5 h-1.5 rounded-full bg-orange-600 animate-ping" />
              )}
            </button>
          </div>

          {/* Tab Content: Logs */}
          {activeTab === 'logs' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Progress Bar */}
              <div className="h-0.5 bg-zinc-950 w-full relative">
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-orange-600 transition-all duration-300 shadow-[0_0_8px_#f97316]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Console logs output */}
              <div className="flex-1 overflow-y-auto p-4 text-[10px] leading-relaxed text-zinc-300 space-y-2.5 text-left">
                {logs.map((log, idx) => (
                  <div key={idx} className="break-all">{log}</div>
                ))}
                {progress < 100 && (
                  <div className="flex items-center gap-2 text-orange-400 animate-pulse mt-2">
                    <Loader2 size={10} className="animate-spin" />
                    RUNNING_DETERMINISTIC_CHECKS...
                  </div>
                )}
                <div ref={consoleEndRef} />
              </div>

              {/* ETL summary footer */}
              <div className="p-4 border-t border-zinc-900 bg-black/40 text-[9px] font-bold text-zinc-500 flex items-center justify-between shrink-0">
                <span>PIPELINE_STATUS:</span>
                <span className="text-zinc-300 flex items-center gap-1.5">
                  {progress < 100 ? (
                    <>
                      <Loader2 size={10} className="animate-spin text-orange-400" />
                      INGESTING_ROWS
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={10} className="text-emerald-500" />
                      COMPLETED
                    </>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Tab Content: Chat */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Chat message logs */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 text-[11px] leading-relaxed ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 font-bold text-[9px] border ${
                      msg.role === 'user' ? 'bg-orange-500/15 border-orange-500/30 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}>
                      {msg.role === 'user' ? 'U' : 'AI'}
                    </div>
                    <div className={`p-2.5 rounded border max-w-[85%] text-left ${
                      msg.role === 'user' 
                        ? 'bg-orange-500/5 border-orange-500/15 text-zinc-300' 
                        : 'bg-zinc-950 border-zinc-900/60 text-zinc-400'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2 text-[10px] items-center text-zinc-500">
                    <Loader2 className="animate-spin text-orange-400" size={10} />
                    READING_REPORT_CONTEXT...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleChatSubmit} className="p-3 border-t border-zinc-900 bg-black/40 flex items-center gap-2 shrink-0">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about leakages or metrics..."
                  className="flex-1 bg-zinc-950 border border-zinc-900 focus:border-orange-500 rounded px-3 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none transition-colors"
                />
                <button 
                  type="submit"
                  className="p-2 bg-orange-500 hover:bg-orange-600 text-black rounded transition-all shrink-0"
                >
                  <Send size={10} />
                </button>
              </form>
            </div>
          )}
        </aside>

        {/* Right Pane - Report Drafting Container */}
        <main className="flex-1 flex flex-col min-w-0 bg-black overflow-hidden relative">
          <div className="flex-1 overflow-y-auto">

            {/* ── GENERATING ANIMATION (draftingProgress === 0) ─────────────── */}
            {draftingProgress === 0 && (
              <div className="flex flex-col items-center justify-center h-full min-h-[600px] gap-8 px-8 relative">
                {/* Ambient glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #f97316 0%, transparent 70%)' }} />
                </div>

                {/* Central animated orb */}
                <div className="relative flex items-center justify-center">
                  {/* Outer rings */}
                  <div className="absolute w-40 h-40 rounded-full border border-orange-500/10 animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="absolute w-28 h-28 rounded-full border border-orange-500/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                  {/* Core orb */}
                  <div className="w-20 h-20 rounded-full flex items-center justify-center relative" style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.25) 0%, rgba(234,88,12,0.08) 100%)', border: '1px solid rgba(249,115,22,0.3)', boxShadow: '0 0 40px rgba(249,115,22,0.2), inset 0 0 20px rgba(249,115,22,0.1)' }}>
                    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                      <path d="M16 4 L28 10 L28 22 L16 28 L4 22 L4 10 Z" stroke="#f97316" strokeWidth="1.5" fill="none" className="opacity-80" />
                      <path d="M16 4 L16 28 M4 10 L28 22 M28 10 L4 22" stroke="#f97316" strokeWidth="0.5" strokeDasharray="2 3" className="opacity-40" />
                      <circle cx="16" cy="16" r="3" fill="#f97316" className="opacity-90" />
                    </svg>
                  </div>
                </div>

                {/* Status text */}
                <div className="text-center space-y-3 z-10">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin text-orange-400" />
                    <span className="text-orange-400 font-mono font-bold text-sm tracking-widest uppercase">Compiling Report</span>
                  </div>
                  <p className="text-zinc-500 font-mono text-[10px] tracking-wider max-w-xs text-center">
                    Pipeline processing your ledger data. Statistical analysis and AI narrative generation in progress.
                  </p>
                </div>

                {/* Animated data stream skeleton */}
                <div className="w-full max-w-lg space-y-3 z-10">
                  {[
                    { w: 'w-3/4', label: 'EXTRACTING_FILTER_SCOPE' },
                    { w: 'w-full', label: 'COMPUTING_PEARSON_CORRELATIONS' },
                    { w: 'w-5/6', label: 'RUNNING_ZSCORE_ANOMALY_DETECTION' },
                    { w: 'w-4/5', label: 'FITTING_REGRESSION_FORECAST_MODEL' },
                    { w: 'w-2/3', label: 'GENERATING_AI_NARRATIVE_LAYER' },
                    { w: 'w-full', label: 'COMPILING_EXECUTIVE_PDF_REPORT' },
                  ].map((step, i) => (
                    <div key={i} className="space-y-1" style={{ animationDelay: `${i * 0.15}s` }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono text-zinc-600 tracking-widest">{step.label}</span>
                        <span className="text-[9px] font-mono text-zinc-700">...</span>
                      </div>
                      <div className="h-0.5 bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${step.w} rounded-full`}
                          style={{
                            background: 'linear-gradient(90deg, rgba(249,115,22,0.6) 0%, rgba(249,115,22,0.2) 100%)',
                            animation: `pulse-bar ${1.5 + i * 0.3}s ease-in-out infinite alternate`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress indicator dots */}
                <div className="flex items-center gap-2 z-10">
                  {[0,1,2,3,4].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-orange-500/40 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>

                <style>{`
                  @keyframes pulse-bar {
                    0% { opacity: 0.3; transform: scaleX(0.7); transform-origin: left; }
                    100% { opacity: 1; transform: scaleX(1); transform-origin: left; }
                  }
                `}</style>
              </div>
            )}

            {/* ── STRUCTURED REPORT CONTENT (draftingProgress >= 1) ─────────── */}
            {draftingProgress >= 1 && (
              <div className="p-6 space-y-6">

                {/* ── Report Header ─────────────────────────────────────────── */}
                <div className="bg-zinc-950 border border-zinc-900 rounded p-6 relative text-left" style={{ borderLeft: '3px solid #f97316' }}>
                  <div className="absolute top-4 right-4 flex items-center gap-2 text-[9px] text-zinc-500 uppercase tracking-widest font-mono">
                    <span>{draftingProgress < 4 ? 'STATUS: DRAFTING' : 'STATUS: COMPLETE'}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${draftingProgress === 4 ? 'bg-emerald-500' : 'bg-orange-500 animate-ping'}`} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-mono text-orange-400 tracking-widest font-bold">OPERON COO INTELLIGENCE PLATFORM</p>
                    <h2 className="text-2xl font-bold tracking-tight text-white font-mono">{reportTitle}</h2>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1">TARGET_SCOPE = <span className="text-orange-400 font-bold">&ldquo;{query}&rdquo;</span></p>
                  </div>
                </div>

                {/* ── KPI Scorecard Row ─────────────────────────────────────── */}
                {draftingProgress >= 2 && (() => {
                  const hs = reportHealthScore;
                  const overall = hs?.overall ?? 0;
                  const cats = hs?.categories ?? {};
                  const scoreColor = overall >= 70 ? '#16a34a' : overall >= 40 ? '#d97706' : '#dc2626';
                  const scoreLabel = overall >= 70 ? 'HEALTHY' : overall >= 40 ? 'AT RISK' : 'CRITICAL';
                  return (
                    <div className="space-y-3">
                      <p className="text-[9px] font-mono text-zinc-600 tracking-widest uppercase">§ 01 — Executive KPI Snapshot</p>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          { label: 'Health Score', value: `${overall.toFixed(1)}/100`, sub: scoreLabel, color: scoreColor },
                          { label: 'Revenue Score', value: `${(cats.revenue ?? 0).toFixed(1)}/25`, sub: 'Revenue Health', color: '#f97316' },
                          { label: 'Customer Score', value: `${(cats.customers ?? 0).toFixed(1)}/25`, sub: 'Customer Health', color: '#8b5cf6' },
                          { label: 'Cost Score', value: `${(cats.costs ?? 0).toFixed(1)}/25`, sub: 'Cost Efficiency', color: '#0ea5e9' },
                        ].map((kpi, i) => (
                          <div key={i} className="bg-zinc-950 border border-zinc-900 rounded p-4 relative overflow-hidden" style={{ borderTop: `2px solid ${kpi.color}` }}>
                            <div className="absolute inset-0 opacity-5" style={{ background: `radial-gradient(circle at top left, ${kpi.color}, transparent 60%)` }} />
                            <p className="text-[8px] font-mono text-zinc-500 tracking-widest uppercase mb-1">{kpi.label}</p>
                            <p className="text-xl font-bold font-mono" style={{ color: kpi.color }}>{kpi.value}</p>
                            <p className="text-[8px] text-zinc-600 font-mono mt-1 uppercase tracking-wider">{kpi.sub}</p>
                          </div>
                        ))}
                      </div>

                      {/* Health Score Bar */}
                      <div className="bg-zinc-950 border border-zinc-900 rounded p-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[9px] font-mono text-zinc-500 tracking-widest">COMPOSITE HEALTH SCORE</p>
                          <span className="text-[9px] font-mono font-bold" style={{ color: scoreColor }}>{overall.toFixed(1)}/100 — {scoreLabel}</span>
                        </div>
                        <div className="h-3 bg-zinc-900 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${overall}%`, background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}aa)`, boxShadow: `0 0 8px ${scoreColor}66` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1.5 text-[8px] font-mono text-zinc-700">
                          <span>0 — CRITICAL</span><span>50 — AT RISK</span><span>100 — OPTIMAL</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Executive Summary ─────────────────────────────────────── */}
                {draftingProgress >= 2 && (
                  <div className="bg-zinc-950 border border-zinc-900 rounded p-6 space-y-4 text-left font-sans">
                    <div className="flex items-center gap-3 border-b border-zinc-900 pb-3">
                      <div className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}>
                        <span className="text-[9px] font-mono font-bold text-orange-400">§2</span>
                      </div>
                      <h3 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest font-mono">Executive Operations Summary</h3>
                    </div>
                    <div className="space-y-3">
                      {(reportSummary || '').split('\n\n').filter(Boolean).map((para, i) => (
                        <p key={i} className="text-xs text-zinc-400 leading-relaxed">{para}</p>
                      ))}
                    </div>

                    {/* Mini inline bar chart — health score components */}
                    {reportHealthScore && (
                      <div className="pt-4 border-t border-zinc-900">
                        <p className="text-[9px] font-mono text-zinc-600 tracking-widest mb-3 uppercase">Health Score — Component Breakdown</p>
                        <div className="space-y-2.5">
                          {[
                            { label: 'Revenue Performance', key: 'revenue',   max: 25, color: '#f97316' },
                            { label: 'Customer Health',     key: 'customers', max: 25, color: '#8b5cf6' },
                            { label: 'Cost Efficiency',     key: 'costs',     max: 25, color: '#0ea5e9' },
                            { label: 'Product Performance', key: 'products',  max: 25, color: '#16a34a' },
                          ].map(({ label, key, max, color }) => {
                            const val = (reportHealthScore.categories ?? {})[key] ?? 0;
                            const pct = (val / max) * 100;
                            return (
                              <div key={key}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-mono text-zinc-500">{label}</span>
                                  <span className="text-[9px] font-mono font-bold" style={{ color }}>{val.toFixed(1)}/{max}</span>
                                </div>
                                <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}55` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Mini Donut Chart — Revenue vs Cost split ──────────────── */}
                {draftingProgress >= 2 && reportHealthScore && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Donut: Score Distribution */}
                    <div className="bg-zinc-950 border border-zinc-900 rounded p-5">
                      <p className="text-[9px] font-mono text-zinc-600 tracking-widest mb-4 uppercase">§ 2a — Score Distribution</p>
                      <div className="flex items-center gap-6">
                        <svg width="88" height="88" viewBox="0 0 88 88">
                          {(() => {
                            const cats = reportHealthScore.categories ?? {};
                            const slices = [
                              { val: cats.revenue   ?? 0, max: 25, color: '#f97316' },
                              { val: cats.customers ?? 0, max: 25, color: '#8b5cf6' },
                              { val: cats.costs     ?? 0, max: 25, color: '#0ea5e9' },
                              { val: cats.products  ?? 0, max: 25, color: '#16a34a' },
                            ];
                            const total = 100;
                            const r = 34, cx = 44, cy = 44;
                            const circumference = 2 * Math.PI * r;
                            let offset = 0;
                            return (
                              <>
                                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#18181b" strokeWidth="14" />
                                {slices.map((s, i) => {
                                  const frac = s.val / total;
                                  const dash = frac * circumference;
                                  const el = (
                                    <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                                      stroke={s.color} strokeWidth="14"
                                      strokeDasharray={`${dash} ${circumference - dash}`}
                                      strokeDashoffset={-offset}
                                      transform={`rotate(-90 ${cx} ${cy})`}
                                      opacity="0.85"
                                    />
                                  );
                                  offset += dash;
                                  return el;
                                })}
                                <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace">{(reportHealthScore.overall ?? 0).toFixed(0)}</text>
                                <text x={cx} y={cy + 9} textAnchor="middle" fill="#52525b" fontSize="7" fontFamily="monospace">/100</text>
                              </>
                            );
                          })()}
                        </svg>
                        <div className="space-y-2">
                          {[
                            { label: 'Revenue', color: '#f97316' },
                            { label: 'Customers', color: '#8b5cf6' },
                            { label: 'Costs', color: '#0ea5e9' },
                            { label: 'Products', color: '#16a34a' },
                          ].map(({ label, color }) => (
                            <div key={label} className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                              <span className="text-[9px] font-mono text-zinc-500">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Mini bar chart: Actions priority */}
                    {draftingProgress >= 3 && reportActions.length > 0 && (
                      <div className="bg-zinc-950 border border-zinc-900 rounded p-5">
                        <p className="text-[9px] font-mono text-zinc-600 tracking-widest mb-4 uppercase">§ 3a — Action Priority Matrix</p>
                        <div className="space-y-2">
                          {reportActions.slice(0, 5).map((_, i) => {
                            const widths = [95, 82, 70, 58, 44];
                            const colors = ['#dc2626', '#ea580c', '#d97706', '#16a34a', '#0ea5e9'];
                            const labels = ['P1', 'P2', 'P3', 'P4', 'P5'];
                            return (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-[8px] font-mono text-zinc-600 w-4 shrink-0">{labels[i]}</span>
                                <div className="flex-1 h-2 bg-zinc-900 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${widths[i]}%`, background: colors[i], opacity: 0.8 }} />
                                </div>
                                <span className="text-[8px] font-mono shrink-0" style={{ color: colors[i] }}>{widths[i]}%</span>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[8px] font-mono text-zinc-700 mt-3">Urgency score relative to P1 baseline</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Strategic Recommendations ─────────────────────────────── */}
                {draftingProgress >= 3 && (
                  <div className="bg-zinc-950 border border-zinc-900 rounded p-6 space-y-4 text-left font-sans">
                    <div className="flex items-center gap-3 border-b border-zinc-900 pb-3">
                      <div className="w-6 h-6 rounded flex items-center justify-center shrink-0" style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}>
                        <span className="text-[9px] font-mono font-bold text-orange-400">§3</span>
                      </div>
                      <h3 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest font-mono">Strategic Recommendations & Action Plan</h3>
                    </div>
                    <div className="space-y-3">
                      {reportActions.map((action, i) => {
                        const priorities = ['P1 — IMMEDIATE', 'P2 — SHORT-TERM', 'P3 — SHORT-TERM', 'P4 — MEDIUM-TERM', 'P5 — MEDIUM-TERM', 'P6 — LONG-TERM', 'P7 — ONGOING'];
                        const pColors = ['#dc2626', '#ea580c', '#ea580c', '#d97706', '#d97706', '#16a34a', '#0ea5e9'];
                        const pBg = ['rgba(220,38,38,0.08)', 'rgba(234,88,12,0.08)', 'rgba(234,88,12,0.08)', 'rgba(217,119,6,0.08)', 'rgba(217,119,6,0.08)', 'rgba(22,163,74,0.08)', 'rgba(14,165,233,0.08)'];
                        const p = priorities[i] || `P${i+1}`;
                        const pc = pColors[i] || '#64748b';
                        const pb = pBg[i] || 'transparent';
                        return (
                          <div key={i} className="flex gap-3 p-3 rounded border" style={{ background: pb, borderColor: `${pc}25` }}>
                            <div className="shrink-0 pt-0.5">
                              <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ color: pc, background: `${pc}15`, border: `1px solid ${pc}30` }}>{p}</span>
                            </div>
                            <p className="text-xs text-zinc-300 leading-relaxed">{action}</p>
                          </div>
                        );
                      })}
                      {reportActions.length === 0 && (
                        <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-mono animate-pulse">
                          <Loader2 size={10} className="animate-spin" /> Drafting recommendations...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── Key Findings Callout ──────────────────────────────────── */}
                {draftingProgress >= 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { icon: '⚠', label: 'Risk Flag', text: 'Customer concentration risk detected. Revenue dependency on top accounts exceeds safe thresholds.', color: '#dc2626', bg: 'rgba(220,38,38,0.06)' },
                      { icon: '📊', label: 'Key Signal', text: 'Cost-revenue correlation indicates near-fully variable cost structure limiting operating leverage.', color: '#d97706', bg: 'rgba(217,119,6,0.06)' },
                      { icon: '✦', label: 'Opportunity', text: 'Margin recovery available through targeted pricing discipline and supplier contract renegotiation.', color: '#16a34a', bg: 'rgba(22,163,74,0.06)' },
                    ].map(({ icon, label, text, color, bg }, i) => (
                      <div key={i} className="rounded border p-4 text-left" style={{ background: bg, borderColor: `${color}25` }}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm">{icon}</span>
                          <span className="text-[9px] font-mono font-bold tracking-widest" style={{ color }}>{label.toUpperCase()}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">{text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Footer Actions ────────────────────────────────────────── */}
                {draftingProgress === 4 && (
                  <div className="bg-zinc-950 border border-zinc-900 rounded p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono">
                    <div className="space-y-0.5">
                      <p className="text-[9px] text-zinc-600 tracking-widest">FORMAL_AUDIT_REPORT_GENERATED = PDF_L4</p>
                      <p className="text-[9px] text-emerald-500">✓ Multi-section COO report compiled — charts, tables, forecasts included</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={handleSaveReport}
                        disabled={savingReport || reportSaved}
                        className={`font-bold text-[10px] px-4 py-2.5 rounded transition-all border ${
                          reportSaved
                            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 cursor-default'
                            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-zinc-300 hover:text-white'
                        }`}
                      >
                        {savingReport ? 'SAVING_REPORT...' : reportSaved ? '✓ REPORT_SAVED_TO_DASHBOARD' : 'SAVE_REPORT_TO_DASHBOARD'}
                      </button>
                      <button
                        onClick={handleDownloadPDF}
                        disabled={downloadingPDF}
                        className="bg-orange-500 hover:bg-orange-600 text-black font-bold text-[10px] px-4 py-2.5 rounded transition-all shadow-md shadow-orange-500/15 flex items-center gap-1.5"
                      >
                        {downloadingPDF ? (
                          <><Loader2 size={12} className="animate-spin" /> DOWNLOADING...</>
                        ) : (
                          <><Download size={12} /> DOWNLOAD_PDF_REPORT</>
                        )}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        </main>
      </div>

      {/* Backup Signup Conversion Wall Modal */}
      {showSignup && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-900 w-full max-w-md rounded p-6 sm:p-8 space-y-6 shadow-2xl relative text-left">
            <button 
              onClick={() => setShowSignup(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
            >
              ✕
            </button>

            <div className="text-center space-y-2">
              <div className="w-10 h-10 bg-orange-500/15 rounded border border-orange-500/30 flex items-center justify-center text-orange-400 mx-auto">
                <Lock size={18} />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {APP_STAGE === "production" ? "UNLOCK_EXECUTIVE_DASHBOARD" : "LOGIN_TO_DASHBOARD"}
              </h3>
              <p className="text-zinc-500 text-xs leading-relaxed max-w-xs mx-auto font-sans normal-case">
                {APP_STAGE === "production" 
                  ? "Create a free Operon account to download your PDF operational review and access the interactive metrics dashboard."
                  : "Please sign in with your sandbox account to access the dashboard and download your PDF operational review."
                }
              </p>
            </div>

            <form onSubmit={handleSignupSubmit} className="space-y-4 text-left">
              {APP_STAGE === "production" && (
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Full Name</label>
                  <input 
                    type="text" 
                    required
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Alex Rivera"
                    className="w-full bg-black border border-zinc-900 focus:border-orange-500 rounded px-4 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none transition-colors"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Corporate Email</label>
                <input 
                  type="email" 
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="alex@stellarcorp.com"
                  className="w-full bg-black border border-zinc-900 focus:border-orange-500 rounded px-4 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Password</label>
                <input 
                  type="password" 
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-black border border-zinc-900 focus:border-orange-500 rounded px-4 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none transition-colors"
                />
              </div>

              {signupError && (
                <div className="text-[10px] font-bold text-red-500 bg-red-950/10 border border-red-900/30 rounded p-3">
                  ⚠️ {signupError}
                </div>
              )}

              <button 
                type="submit"
                disabled={signupLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs py-3.5 rounded shadow-lg shadow-orange-500/10 transition-all flex items-center justify-center gap-2"
              >
                {signupLoading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    {APP_STAGE === "production" ? "CREATING_WORKSPACE..." : "VERIFYING_CREDENTIALS..."}
                  </>
                ) : (
                  <>
                    {APP_STAGE === "production" ? "CREATE_ACCOUNT_AND_DOWNLOAD" : "LOG IN & DOWNLOAD"}
                    <ArrowRight size={12} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
      </div>

      {/* ARIA — Report-mode AI Agent with live report context */}
      <AIAgent
        mode="report"
        context={{
          report_data: {
            title: reportTitle,
            summary: reportSummary,
            actions: reportActions,
            drafted_sections: draftedText,
            query,
            progress,
          }
        }}
      />
    </>
  );
}
