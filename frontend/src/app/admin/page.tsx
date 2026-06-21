"use client";

import React, { useState, useEffect } from 'react';
import Logo from '../../components/Logo';
import { 
  ShieldAlert, ShieldCheck, Loader2, ArrowRight, LogOut, Lock, 
  Users, Eye, Landmark, Globe, Activity, RefreshCw, Download, 
  Search, Terminal, Database, CreditCard, HelpCircle, Gauge, Cpu, Zap
} from 'lucide-react';
import { API_BASE } from '@/config';

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [data, setData] = useState<any>(null);
  const [appStage, setAppStage] = useState<string>("development");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [searchEmail, setSearchEmail] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Load auth state from session
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = sessionStorage.getItem("admin_token");
      if (savedToken) {
        setToken(savedToken);
      } else {
        setLoading(false);
      }
    }
  }, []);

  // Fetch analytics data when authenticated
  const fetchAnalytics = async (currentToken: string) => {
    setLoading(true);
    setError("");
    try {
      const [res, settingsRes] = await Promise.all([
        fetch(`${API_BASE}/admin/analytics`, {
          headers: { "X-Admin-Token": currentToken }
        }),
        fetch(`${API_BASE}/admin/settings`, {
          headers: { "X-Admin-Token": currentToken }
        })
      ]);

      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.removeItem("admin_token");
          setToken(null);
          throw new Error("Admin token expired or invalid.");
        }
        throw new Error("Failed to fetch analytics data.");
      }
      const json = await res.json();
      setData(json);

      if (settingsRes.ok) {
        const settingsJson = await settingsRes.json();
        const stage = settingsJson.app_stage === "sandbox" ? "development" : settingsJson.app_stage;
        setAppStage(stage);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAnalytics(token);
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loginLoading) return;
    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      
      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.detail || "Authentication failed.");
      }

      sessionStorage.setItem("admin_token", resJson.token);
      setToken(resJson.token);
      setPassword("");
    } catch (err: any) {
      setLoginError(err.message || "Unable to authenticate.");
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    setToken(null);
    setData(null);
    setLoading(false);
  };

  const handleToggleStage = async (stage: string) => {
    if (!token || savingSettings || stage === appStage) return;
    setSavingSettings(true);
    try {
      const res = await fetch(`${API_BASE}/admin/settings`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Admin-Token": token
        },
        body: JSON.stringify({ app_stage: stage })
      });
      if (res.ok) {
        const json = await res.json();
        const newStage = json.app_stage === "sandbox" ? "development" : json.app_stage;
        setAppStage(newStage);
      } else {
        alert("Failed to save setting configuration.");
      }
    } catch (err) {
      console.error(err);
      alert("Error toggling system mode.");
    } finally {
      setSavingSettings(false);
    }
  };

  const downloadWaitlistCSV = () => {
    if (!data || !data.recent_signups) return;
    const headers = ["ID", "Email", "Signup Date"];
    const rows = data.recent_signups.map((s: any) => [s.id, s.email, s.created_at]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map((e: any) => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "operon_waitlist_registrants.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter waitlist signups by search query
  const filteredSignups = data?.recent_signups?.filter((s: any) => 
    s.email.toLowerCase().includes(searchEmail.toLowerCase())
  ) || [];

  // Calculate Conversion Rate
  const getConversionRate = () => {
    if (!data || !data.unique_visitors) return "0.0%";
    const rate = (data.total_signups / data.unique_visitors) * 100;
    return `${rate.toFixed(1)}%`;
  };

  const getVitalRating = (name: string, value: number) => {
    if (value === undefined || value === null) return { text: "NO DATA", color: "text-zinc-650 border-zinc-850 bg-zinc-950/20" };
    const upperName = name.toUpperCase();
    if (upperName === 'TTFB') {
      if (value <= 800) return { text: "GOOD", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" };
      if (value <= 1800) return { text: "NEEDS IMPR.", color: "text-orange-400 border-orange-500/20 bg-orange-500/5" };
      return { text: "POOR", color: "text-red-400 border-red-500/20 bg-red-500/5" };
    }
    if (upperName === 'FCP') {
      if (value <= 1800) return { text: "GOOD", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" };
      if (value <= 3000) return { text: "NEEDS IMPR.", color: "text-orange-400 border-orange-500/20 bg-orange-500/5" };
      return { text: "POOR", color: "text-red-400 border-red-500/20 bg-red-500/5" };
    }
    if (upperName === 'LCP') {
      if (value <= 2500) return { text: "GOOD", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" };
      if (value <= 4000) return { text: "NEEDS IMPR.", color: "text-orange-400 border-orange-500/20 bg-orange-500/5" };
      return { text: "POOR", color: "text-red-400 border-red-500/20 bg-red-500/5" };
    }
    if (upperName === 'CLS') {
      if (value <= 0.1) return { text: "GOOD", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" };
      if (value <= 0.25) return { text: "NEEDS IMPR.", color: "text-orange-400 border-orange-500/20 bg-orange-500/5" };
      return { text: "POOR", color: "text-red-400 border-red-500/20 bg-red-500/5" };
    }
    if (upperName === 'INP') {
      if (value <= 200) return { text: "GOOD", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" };
      if (value <= 500) return { text: "NEEDS IMPR.", color: "text-orange-400 border-orange-500/20 bg-orange-500/5" };
      return { text: "POOR", color: "text-red-400 border-red-500/20 bg-red-500/5" };
    }
    if (upperName === 'FID') {
      if (value <= 100) return { text: "GOOD", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" };
      if (value <= 300) return { text: "NEEDS IMPR.", color: "text-orange-400 border-orange-500/20 bg-orange-500/5" };
      return { text: "POOR", color: "text-red-400 border-red-500/20 bg-red-500/5" };
    }
    return { text: "OK", color: "text-blue-400 border-blue-500/20 bg-blue-500/5" };
  };

  const getMetricUnit = (name: string) => {
    const upper = name.toUpperCase();
    if (upper === 'CLS') return '';
    return 'ms';
  };

  if (!token) {
    // Render Security Lock Screen
    return (
      <div className="min-h-screen bg-[#0c0e14] text-zinc-100 font-mono flex items-center justify-center relative overflow-hidden selection:bg-orange-500/20 selection:text-orange-400 w-full px-6">
        {/* Background coordinate grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:36px_36px] pointer-events-none z-0" />
        
        {/* Lock Screen Interface Card */}
        <div className="max-w-md w-full bg-[#121620]/60 border border-zinc-800 rounded p-6 sm:p-8 relative backdrop-blur-sm z-10 shadow-2xl space-y-6">
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-700" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-700" />
          <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-zinc-700" />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-zinc-700" />
          
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="w-12 h-12 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-orange-450 mb-2">
              <Lock size={20} className="animate-pulse" />
            </div>
            <h1 className="text-md font-bold uppercase tracking-wider text-white">OPERON SYSTEMS CONSOLE</h1>
            <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">SECURE ADMINISTRATOR GATEWAY</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-[8px] font-bold text-zinc-550 uppercase tracking-widest">ENTER DEPLOYMENT MASTER KEY</label>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••••"
                className="w-full bg-[#0c0e14] border border-zinc-850 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 rounded px-4 py-3 text-xs text-white placeholder-zinc-800 focus:outline-none transition-all"
              />
            </div>

            {loginError && (
              <p className="text-[10px] font-bold text-red-400 bg-red-950/10 border border-red-900/30 rounded p-2.5">
                ⚠️ ERROR: {loginError}
              </p>
            )}

            <button 
              type="submit"
              disabled={loginLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-800 text-black font-bold text-xs py-3 rounded transition-all flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 active:scale-95 cursor-pointer"
            >
              {loginLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>
                  DECRYPT_ACCESS
                  <ArrowRight size={12} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render main Admin Dashboard when authenticated
  return (
    <div className="min-h-screen bg-[#0c0e14] text-zinc-150 font-mono relative overflow-x-hidden selection:bg-orange-500/20 selection:text-orange-400 flex flex-col justify-between">
      
      {/* Background coordinate grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.010)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.010)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />
      
      {/* Header */}
      <header className="h-16 border-b border-zinc-900 bg-black/40 px-6 flex items-center justify-between shrink-0 relative z-10 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Logo size={20} />
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-xs tracking-tight text-white">OPERON</span>
            <span className="text-[8px] text-zinc-550 tracking-widest font-bold uppercase">SYS.ADMIN_PORTAL</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4 text-[9px] text-zinc-500">
          <span className="flex items-center gap-2 border border-zinc-850 px-2.5 py-1 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            CONSOLE_ONLINE
          </span>
          <div className="h-3 w-px bg-zinc-800" />
          <button 
            onClick={handleLogout}
            className="hover:text-white transition-colors flex items-center gap-1 uppercase font-bold"
          >
            <LogOut size={10} /> Logout
          </button>
        </div>
      </header>

      {/* Main dashboard content */}
      <main className="flex-grow w-full max-w-7xl mx-auto p-6 space-y-6 relative z-10 text-left">
        
        {/* Title row */}
        <div className="border-b border-zinc-900 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-lg uppercase tracking-wider text-white font-bold">SYSTEMS_TELEMETRY</h1>
            <p className="text-zinc-550 text-[10px] mt-0.5">Real-time telemetry and deployment parameters for Operon Platform.</p>
          </div>
          
          <button 
            onClick={() => token && fetchAnalytics(token)}
            disabled={loading}
            className="self-start sm:self-center border border-zinc-800 hover:border-zinc-700 bg-[#121620]/30 hover:bg-[#121620]/50 text-zinc-400 hover:text-white px-3 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
          >
            {loading ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
            Reload Data
          </button>
        </div>

        {!data && !error ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-400">
            <Loader2 className="animate-spin text-orange-400" size={24} />
            <p className="text-xs uppercase tracking-wider">Gathering system data metrics...</p>
          </div>
        ) : error ? (
          <div className="bg-red-950/10 border border-red-900/30 p-6 rounded text-red-500 text-xs text-center space-y-2">
            <p className="font-semibold">⚠️ CONNECTION ERROR: {error}</p>
            <button onClick={() => token && fetchAnalytics(token)} className="underline hover:text-red-400 font-bold uppercase text-[9px]">Try Reconnecting</button>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            
            {/* KPI scorecards row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              <div className="bg-[#121620]/50 border border-zinc-900 rounded p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
                <div className="flex items-center justify-between text-zinc-500 mb-2">
                  <span className="text-[8px] uppercase tracking-widest font-bold">Waitlist Signups</span>
                  <Users size={12} className="text-orange-450" />
                </div>
                <h3 className="text-xl font-bold text-white leading-none">{data.total_signups}</h3>
                <p className="text-[8.5px] text-zinc-500 mt-2 font-sans normal-case">Interested product leads captured.</p>
              </div>

              <div className="bg-[#121620]/50 border border-zinc-900 rounded p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
                <div className="flex items-center justify-between text-zinc-500 mb-2">
                  <span className="text-[8px] uppercase tracking-widest font-bold">Total Pageviews</span>
                  <Eye size={12} className="text-orange-450" />
                </div>
                <h3 className="text-xl font-bold text-white leading-none">{data.total_visitors}</h3>
                <p className="text-[8.5px] text-zinc-500 mt-2 font-sans normal-case">Total landing page hits logged.</p>
              </div>

              <div className="bg-[#121620]/50 border border-zinc-900 rounded p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
                <div className="flex items-center justify-between text-zinc-500 mb-2">
                  <span className="text-[8px] uppercase tracking-widest font-bold">Unique Visitors</span>
                  <Globe size={12} className="text-orange-450" />
                </div>
                <h3 className="text-xl font-bold text-white leading-none">{data.unique_visitors}</h3>
                <p className="text-[8.5px] text-zinc-500 mt-2 font-sans normal-case">Unique IP addresses registered.</p>
              </div>

              <div className="bg-[#121620]/50 border border-zinc-900 rounded p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
                <div className="flex items-center justify-between text-zinc-500 mb-2">
                  <span className="text-[8px] uppercase tracking-widest font-bold">Total Revenue</span>
                  <Landmark size={12} className="text-orange-450" />
                </div>
                <h3 className="text-xl font-bold text-white leading-none">${data.total_revenue.toFixed(2)}</h3>
                <p className="text-[8.5px] text-zinc-500 mt-2 font-sans normal-case">Simulated subscription purchases.</p>
              </div>

              <div className="bg-[#121620]/50 border border-zinc-900 rounded p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
                <div className="flex items-center justify-between text-zinc-500 mb-2">
                  <span className="text-[8px] uppercase tracking-widest font-bold">Conversion Rate</span>
                  <Activity size={12} className="text-orange-450" />
                </div>
                <h3 className="text-xl font-bold text-white leading-none">{getConversionRate()}</h3>
                <p className="text-[8.5px] text-zinc-500 mt-2 font-sans normal-case">Visitor signup percentage.</p>
              </div>

            </div>

            {/* Mode Controls and Distribution Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* App Mode Control Panel (1/3 Width) */}
              <div className="bg-[#121620]/45 border border-zinc-900 rounded p-5 relative space-y-5 flex flex-col justify-between">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">DEPLOYMENT_STAGE_CONTROL</h3>
                  <p className="text-[9px] text-zinc-550">Configure whether public account registration is blocked or active.</p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 py-2 font-bold text-[10px]">
                  <button 
                    onClick={() => handleToggleStage("development")}
                    disabled={savingSettings || appStage === "development"}
                    className={`py-3.5 rounded border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      appStage === "development"
                        ? 'border-orange-500/30 bg-orange-500/5 text-orange-400 font-bold shadow-md shadow-orange-500/5'
                        : 'border-zinc-850 hover:border-zinc-700 bg-zinc-950/20 text-zinc-550 hover:text-zinc-300'
                    }`}
                  >
                    <ShieldAlert size={14} className={appStage === "development" ? "text-orange-450" : ""} />
                    DEVELOPMENT MODE
                  </button>

                  <button 
                    onClick={() => handleToggleStage("production")}
                    disabled={savingSettings || appStage === "production"}
                    className={`py-3.5 rounded border transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      appStage === "production"
                        ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400 font-bold shadow-md shadow-emerald-500/5'
                        : 'border-zinc-850 hover:border-zinc-700 bg-zinc-950/20 text-zinc-550 hover:text-zinc-300'
                    }`}
                  >
                    <ShieldCheck size={14} className={appStage === "production" ? "text-emerald-400" : ""} />
                    PRODUCTION MODE
                  </button>
                </div>

                <div className="border border-zinc-850/60 rounded p-3 bg-zinc-950/40 text-[9px] text-zinc-500 leading-relaxed uppercase space-y-1 select-none">
                  <p className="font-bold flex items-center gap-1 text-zinc-400">
                    <Database size={10} className="text-zinc-500" />
                    STAGE STATUS INSTRUCTIONS
                  </p>
                  <p>• **Development**: Block public signups, redirects all page requests to waitlist landing. Sandbox demo account access remains open.</p>
                  <p>• **Production**: Opens email registrations and lets public users sign up for custom accounts.</p>
                </div>
              </div>

              {/* Active Plan Distribution Metrics (2/3 Width) */}
              <div className="lg:col-span-2 bg-[#121620]/45 border border-zinc-900 rounded p-5 relative space-y-4">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">SUBSCRIPTION_PLAN_DISTRIBUTION</h3>
                  <p className="text-[9px] text-zinc-550">Active account volume mapped to pricing packages.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2 font-mono text-[9px] uppercase tracking-wider text-left">
                  {[
                    { key: "SANDBOX_INIT", label: "Sandbox Init (Free)", color: "text-zinc-450", border: "border-zinc-850" },
                    { key: "AUDIT_PROFESSIONAL", label: "Professional ($15)", color: "text-orange-400", border: "border-orange-500/20 bg-orange-500/5" },
                    { key: "ENTERPRISE_COMMAND", label: "Enterprise ($49)", color: "text-amber-400", border: "border-amber-500/20 bg-amber-500/5" },
                    { key: "QUANT_INTELLIGENCE", label: "Quant Intel ($99)", color: "text-blue-400", border: "border-blue-500/20 bg-blue-500/5" }
                  ].map((p) => {
                    const count = data.plan_counts?.find((item: any) => item.plan === p.key)?.count || 0;
                    return (
                      <div key={p.key} className={`p-3 border rounded ${p.border} flex flex-col justify-between min-h-[70px]`}>
                        <span className="text-[8px] text-zinc-500 font-bold">{p.label}</span>
                        <span className={`text-base font-bold mt-1 ${p.color}`}>{count} <span className="text-[10px] text-zinc-650 font-normal">nodes</span></span>
                      </div>
                    );
                  })}
                </div>

                {/* Micro visualizer grid bar */}
                <div className="h-2 bg-[#0c0e14] border border-zinc-850 rounded-full overflow-hidden flex">
                  {(() => {
                    const plans = ["SANDBOX_INIT", "AUDIT_PROFESSIONAL", "ENTERPRISE_COMMAND", "QUANT_INTELLIGENCE"];
                    const colors = ["bg-zinc-700", "bg-orange-500", "bg-amber-500", "bg-blue-500"];
                    const total = data.plan_counts?.reduce((sum: number, item: any) => sum + item.count, 0) || 1;
                    
                    return plans.map((p, idx) => {
                      const count = data.plan_counts?.find((item: any) => item.plan === p)?.count || 0;
                      const percent = (count / total) * 100;
                      return (
                        <div 
                          key={p} 
                          className={`h-full ${colors[idx]} transition-all`} 
                          style={{ width: `${percent}%` }}
                          title={`${p}: ${count} (${percent.toFixed(1)}%)`}
                        />
                      );
                    });
                  })()}
                </div>
              </div>

            </div>

            {/* AI Token Usage Telemetry */}
            <div className="bg-[#121620]/45 border border-zinc-900 rounded p-5 relative space-y-4">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Cpu size={12} className="text-orange-450" />
                    AI_TOKEN_CONSUMPTION_MONITOR
                  </h3>
                  <p className="text-[9px] text-zinc-550">Token utilization and allocation quotas tracked across organization tiers.</p>
                </div>
                <div className="text-[9px] text-zinc-450 border border-zinc-850 px-2 py-1 rounded bg-[#0c0e14]">
                  SYSTEM CAP: <span className="font-bold text-emerald-400">ONLINE</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Aggregated Totals */}
                <div className="space-y-3">
                  <div className="p-3.5 border border-zinc-850 bg-zinc-950/20 rounded flex justify-between items-center">
                    <div>
                      <span className="text-[7.5px] text-zinc-500 font-bold block uppercase">Total Tokens Used</span>
                      <span className="text-base font-bold text-white font-mono block mt-1">
                        {data?.token_usage?.total_total_tokens?.toLocaleString() || "0"}
                      </span>
                    </div>
                    <div className="text-orange-500/20 bg-orange-500/5 p-2 rounded">
                      <Zap size={14} className="text-orange-450" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 border border-zinc-850 bg-zinc-950/20 rounded">
                      <span className="text-[7px] text-zinc-550 font-bold block uppercase">Prompt (Input)</span>
                      <span className="text-xs font-bold text-zinc-300 font-mono block mt-0.5">
                        {data?.token_usage?.total_prompt_tokens?.toLocaleString() || "0"}
                      </span>
                    </div>
                    <div className="p-3 border border-zinc-850 bg-zinc-950/20 rounded">
                      <span className="text-[7px] text-zinc-550 font-bold block uppercase">Completion (Output)</span>
                      <span className="text-xs font-bold text-zinc-300 font-mono block mt-0.5">
                        {data?.token_usage?.total_completion_tokens?.toLocaleString() || "0"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Plan allocation progress bars */}
                <div className="lg:col-span-2 space-y-3">
                  {[
                    { key: "SANDBOX_INIT", label: "Sandbox Init", cap: 100000 },
                    { key: "AUDIT_PROFESSIONAL", label: "Professional Plan", cap: 1000000 },
                    { key: "ENTERPRISE_COMMAND", label: "Enterprise Plan", cap: 10000000 },
                    { key: "QUANT_INTELLIGENCE", label: "Quant Intel Plan", cap: 50000000 }
                  ].map((tier) => {
                    const planUsage = data?.token_usage?.by_plan?.find((p: any) => p.plan === tier.key) || {
                      total_tokens: 0,
                      report_count: 0
                    };
                    const percent = Math.min(100, (planUsage.total_tokens / tier.cap) * 100);
                    const isExceeded = planUsage.total_tokens >= tier.cap;

                    return (
                      <div key={tier.key} className="space-y-1 text-[9px]">
                        <div className="flex justify-between items-baseline font-mono text-zinc-400">
                          <span className="font-bold text-zinc-300">{tier.label} <span className="text-zinc-650">({planUsage.report_count} reports)</span></span>
                          <span>
                            <span className={isExceeded ? "text-red-400 font-bold" : "text-zinc-300"}>
                              {planUsage.total_tokens?.toLocaleString()}
                            </span>
                            <span className="text-zinc-600"> / {tier.cap?.toLocaleString()} tokens</span>
                          </span>
                        </div>
                        <div className="h-1.5 bg-[#0c0e14] border border-zinc-850 rounded-full overflow-hidden flex relative">
                          <div 
                            className={`h-full transition-all ${
                              isExceeded ? "bg-red-500" : percent > 80 ? "bg-orange-500" : "bg-emerald-500"
                            }`} 
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>


            {/* Middle Section: Waitlist registrations and Billing transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Waitlist registrations registry panel */}
              <div className="bg-[#121620]/45 border border-zinc-900 rounded p-5 relative overflow-hidden flex flex-col justify-between min-h-[400px]">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-800" />
                
                <div className="space-y-4">
                  {/* Title and export button */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">WAITLIST_EMAIL_REGISTRY</h3>
                      <p className="text-[9px] text-zinc-550">Captured marketing registrations.</p>
                    </div>
                    
                    <button 
                      onClick={downloadWaitlistCSV}
                      className="border border-zinc-850 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900/70 text-[9px] font-bold text-orange-450 hover:text-orange-400 px-2.5 py-1.5 rounded uppercase flex items-center gap-1.5 transition-all"
                    >
                      <Download size={10} /> Export CSV
                    </button>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-650" size={12} />
                    <input 
                      type="text"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      placeholder="Search email list..."
                      className="w-full bg-[#0c0e14] border border-zinc-850 focus:border-orange-500 rounded pl-8 pr-4 py-2 text-xs text-white placeholder-zinc-750 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Registry Table */}
                  <div className="border border-zinc-850 rounded overflow-hidden max-h-[250px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-black border-b border-zinc-850 text-zinc-500 uppercase tracking-wider font-bold">
                          <th className="px-4 py-2.5">ID</th>
                          <th className="px-4 py-2.5">Email Address</th>
                          <th className="px-4 py-2.5">Registration Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850 bg-zinc-950/20 text-zinc-400">
                        {filteredSignups.map((s: any) => (
                          <tr key={s.id} className="hover:bg-zinc-900/30 transition-colors">
                            <td className="px-4 py-2 font-mono text-zinc-600">#{s.id}</td>
                            <td className="px-4 py-2 text-zinc-200">{s.email}</td>
                            <td className="px-4 py-2 font-mono text-zinc-500">{s.created_at}</td>
                          </tr>
                        ))}
                        {filteredSignups.length === 0 && (
                          <tr>
                            <td colSpan={3} className="px-4 py-6 text-center text-zinc-600 italic">No registrations found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="text-[9.5px] text-zinc-650 font-mono mt-4 pt-3 border-t border-zinc-900 flex justify-between uppercase font-bold">
                  <span>Displaying {filteredSignups.length} rows</span>
                  <span>TOTAL_SIGNUPS = {data.total_signups}</span>
                </div>
              </div>

              {/* Simulated plan purchases payments ledger */}
              <div className="bg-[#121620]/45 border border-zinc-900 rounded p-5 relative overflow-hidden flex flex-col justify-between min-h-[400px]">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-800" />
                
                <div className="space-y-4">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1">
                      <CreditCard size={12} className="text-orange-450" />
                      PURCHASES_PAYMENT_LEDGER
                    </h3>
                    <p className="text-[9px] text-zinc-550">Simulated Stripe transaction logs.</p>
                  </div>

                  {/* Purchases Table */}
                  <div className="border border-zinc-850 rounded overflow-hidden max-h-[300px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-black border-b border-zinc-850 text-zinc-500 uppercase tracking-wider font-bold">
                          <th className="px-4 py-2.5">Org Name</th>
                          <th className="px-4 py-2.5">Plan Selected</th>
                          <th className="px-4 py-2.5">Amount</th>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850 bg-zinc-950/20 text-zinc-400">
                        {data.recent_payments?.map((p: any) => (
                          <tr key={p.id} className="hover:bg-zinc-900/30 transition-colors">
                            <td className="px-4 py-2 text-zinc-200 truncate max-w-[120px]" title={p.org_name}>{p.org_name}</td>
                            <td className="px-4 py-2 font-mono text-zinc-400">{p.plan_name.replace('_', ' ')}</td>
                            <td className="px-4 py-2 font-bold text-emerald-400 font-mono">${p.amount.toFixed(2)}</td>
                            <td className="px-4 py-2 font-mono text-zinc-500">{p.timestamp}</td>
                            <td className="px-4 py-2">
                              <span className="text-[8px] border border-emerald-500/20 bg-emerald-500/5 text-emerald-450 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {(!data.recent_payments || data.recent_payments.length === 0) && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-zinc-650 italic uppercase">No payments recorded. Upgrade plans in sandbox mode to seed data.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="text-[9.5px] text-zinc-650 font-mono mt-4 pt-3 border-t border-zinc-900 flex justify-between uppercase font-bold">
                  <span>Displaying {data.recent_payments?.length || 0} rows</span>
                  <span>ACC_REVENUE = ${data.total_revenue.toFixed(2)}</span>
                </div>
              </div>

            </div>

            {/* Traffic Logs (Full Width) */}
            <div className="bg-[#121620]/45 border border-zinc-900 rounded p-5 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
              
              <div className="space-y-4">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                    <Terminal size={12} className="text-orange-450" />
                    TRAFFIC_LOGS_TELEMETRY
                  </h3>
                  <p className="text-[9px] text-zinc-550">Anonymized page visitor traces logged on public access routes.</p>
                </div>

                <div className="border border-zinc-850 rounded overflow-hidden max-h-[300px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  <table className="w-full text-left border-collapse text-[10px] table-fixed">
                    <thead>
                      <tr className="bg-black border-b border-zinc-850 text-zinc-500 uppercase tracking-wider font-bold">
                        <th className="w-1/6 px-4 py-2.5">Anonymized IP</th>
                        <th className="w-1/12 px-4 py-2.5">Path</th>
                        <th className="w-1/4 px-4 py-2.5">Referrer</th>
                        <th className="w-5/12 px-4 py-2.5">Device User Agent</th>
                        <th className="w-1/6 px-4 py-2.5">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-850 bg-zinc-950/20 text-zinc-400">
                      {data.recent_visitors?.map((v: any) => (
                        <tr key={v.id} className="hover:bg-zinc-900/30 transition-colors">
                          <td className="px-4 py-2 font-mono text-zinc-500 truncate" title={v.ip_hash}>{v.ip_hash}</td>
                          <td className="px-4 py-2 text-zinc-200 font-mono">{v.path}</td>
                          <td className="px-4 py-2 text-zinc-400 truncate font-mono" title={v.referrer || "Direct / None"}>
                            {v.referrer || "Direct / None"}
                          </td>
                          <td className="px-4 py-2 text-zinc-550 truncate font-mono" title={v.user_agent}>{v.user_agent}</td>
                          <td className="px-4 py-2 font-mono text-zinc-550">{v.timestamp}</td>
                        </tr>
                      ))}
                      {(!data.recent_visitors || data.recent_visitors.length === 0) && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-zinc-650 italic uppercase">No traffic hits registered. Telemetry logs will print on client hits.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="text-[9.5px] text-zinc-650 font-mono mt-4 pt-3 border-t border-zinc-900 flex justify-between uppercase font-bold">
                <span>Displaying {data.recent_visitors?.length || 0} rows</span>
                <span>TOTAL_PAGEVIEWS = {data.total_visitors}</span>
              </div>
            </div>

            {/* Speed & Performance Diagnostics (Two columns on large screen, one on small screen) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Server-Side API Latency Table */}
              <div className="bg-[#121620]/45 border border-zinc-900 rounded p-5 relative overflow-hidden flex flex-col justify-between min-h-[400px]">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-800" />
                
                <div className="space-y-4">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                      <Zap size={12} className="text-orange-450" />
                      SERVER_LATENCY_DIAGNOSTICS
                    </h3>
                    <p className="text-[9px] text-zinc-550">Average request processing speed measured in-memory per API route.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-2 text-[9px] font-mono uppercase tracking-wider text-left">
                    <div className="p-3 border border-zinc-850 rounded flex flex-col justify-between min-h-[60px] bg-zinc-950/20">
                      <span className="text-[8px] text-zinc-500 font-bold">Overall Average Latency</span>
                      <span className="text-base font-bold mt-1 text-orange-400">
                        {data.speed_stats?.avg_latency_ms?.toFixed(2) || "0.00"} <span className="text-[10px] text-zinc-650 font-normal">ms</span>
                      </span>
                    </div>

                    <div className="p-3 border border-zinc-850 rounded flex flex-col justify-between min-h-[60px] bg-zinc-950/20">
                      <span className="text-[8px] text-zinc-500 font-bold">Server RAM Footprint</span>
                      <span className="text-base font-bold mt-1 text-blue-400 flex items-center gap-1">
                        <Cpu size={12} className="text-zinc-600" />
                        {data.speed_stats?.server_memory_mb?.toFixed(1) || "0.0"} <span className="text-[10px] text-zinc-650 font-normal">MB</span>
                      </span>
                    </div>
                  </div>

                  {/* Latency Table */}
                  <div className="border border-zinc-850 rounded overflow-hidden max-h-[200px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-black border-b border-zinc-850 text-zinc-500 uppercase tracking-wider font-bold">
                          <th className="px-4 py-2.5">API Endpoint</th>
                          <th className="px-4 py-2.5 text-right">Calls</th>
                          <th className="px-4 py-2.5 text-right">Average Latency</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850 bg-zinc-950/20 text-zinc-400 font-mono">
                        {data.speed_stats?.slowest_endpoints?.map((e: any, idx: number) => {
                          const method = e.endpoint.split(" ")[0];
                          const path = e.endpoint.split(" ")[1];
                          const isSlow = e.avg_duration_ms > 200;
                          return (
                            <tr key={idx} className="hover:bg-zinc-900/30 transition-colors">
                              <td className="px-4 py-2 truncate max-w-[200px]" title={e.endpoint}>
                                <span className={`text-[8px] px-1 py-0.5 rounded font-bold mr-1.5 uppercase ${
                                  method === 'POST' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}>
                                  {method}
                                </span>
                                <span className="text-zinc-300">{path}</span>
                              </td>
                              <td className="px-4 py-2 text-right text-zinc-500">{e.calls}</td>
                              <td className={`px-4 py-2 text-right font-bold ${isSlow ? 'text-red-400' : 'text-emerald-400'}`}>
                                {e.avg_duration_ms.toFixed(1)} ms
                              </td>
                            </tr>
                          );
                        })}
                        {(!data.speed_stats?.slowest_endpoints || data.speed_stats.slowest_endpoints.length === 0) && (
                          <tr>
                            <td colSpan={3} className="px-4 py-8 text-center text-zinc-650 italic uppercase">No latency data. Request endpoints to log latency.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="text-[9.5px] text-zinc-650 font-mono mt-4 pt-3 border-t border-zinc-900 flex justify-between uppercase font-bold">
                  <span>Displaying {data.speed_stats?.slowest_endpoints?.length || 0} routes</span>
                  <span>TOTAL_CALLS = {data.speed_stats?.total_api_requests || 0}</span>
                </div>
              </div>

              {/* Client-Side Web Vitals Metrics */}
              <div className="bg-[#121620]/45 border border-zinc-900 rounded p-5 relative overflow-hidden flex flex-col justify-between min-h-[400px]">
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-800" />
                
                <div className="space-y-4">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                      <Gauge size={12} className="text-orange-450" />
                      CLIENT_WEB_VITALS_DIAGNOSTICS
                    </h3>
                    <p className="text-[9px] text-zinc-550">Real User Experience (RUM) Core Web Vitals reported by client browsers.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-1 font-mono text-[9px] uppercase tracking-wider text-left">
                    {[
                      { name: "TTFB", desc: "Time to First Byte" },
                      { name: "FCP", desc: "First Content Paint" },
                      { name: "LCP", desc: "Largest Content Paint" },
                      { name: "CLS", desc: "Layout Shift Index" },
                      { name: "INP", desc: "Interaction to Paint" },
                      { name: "FID", desc: "First Input Delay" }
                    ].map((metric) => {
                      const val = data.speed_stats?.vitals_averages?.[metric.name];
                      const hasVal = val !== undefined && val !== null;
                      const rating = getVitalRating(metric.name, val);
                      return (
                        <div key={metric.name} className="p-3 border border-zinc-850 rounded flex flex-col justify-between min-h-[85px] bg-zinc-950/20">
                          <div>
                            <span className="text-[8px] text-zinc-500 font-bold block">{metric.desc}</span>
                            <span className="font-bold text-white text-xs mt-1 block">
                              {metric.name}: <span className={hasVal ? 'text-zinc-300' : 'text-zinc-700 italic'}>
                                {hasVal ? val.toFixed(metric.name === 'CLS' ? 3 : 0) + getMetricUnit(metric.name) : "N/A"}
                              </span>
                            </span>
                          </div>
                          
                          <span className={`text-[7.5px] border self-start px-1.5 py-0.5 rounded font-bold uppercase tracking-widest mt-2 ${rating.color}`}>
                            {rating.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border border-zinc-850/60 rounded p-2.5 bg-zinc-950/40 text-[8.5px] text-zinc-650 leading-relaxed uppercase select-none font-mono">
                  <p className="font-bold flex items-center gap-1 text-zinc-500 mb-0.5">
                    <HelpCircle size={10} />
                    GOOGLE PERFORMANCE RATING GUIDES
                  </p>
                  <p>• **GOOD**: Speedy user interaction. No optimization is urgent.</p>
                  <p>• **NEEDS IMPR. / POOR**: Latency bottleneck detected. Profile database queries or client asset size.</p>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-zinc-900 bg-zinc-950/20 px-6 shrink-0 relative z-10 flex items-center justify-between text-[8px] sm:text-[9px] text-zinc-650 max-w-7xl mx-auto w-full font-mono mt-8">
        <span>© 2026 OPERON SYSTEMS INC. ADMIN DIVISION. SECURITY LEVEL 4.</span>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-zinc-400 transition-colors">SYS.INTEGRITY_INDEX</a>
          <a href="#" className="hover:text-zinc-400 transition-colors">SECURE_L4_STANDARDS</a>
        </div>
      </footer>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(3px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
      `}</style>
    </div>
  );
}
