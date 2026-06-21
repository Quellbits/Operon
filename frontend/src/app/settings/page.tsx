"use client";

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { API_BASE } from '@/config';
import { 
  User, Bot, Key, CreditCard, LogOut, Loader2, CheckCircle2, 
  AlertTriangle, Shield, Eye, EyeOff, Save, ChevronRight, Zap
} from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Tab control: 'account' | 'agent' | 'api' | 'billing'
  const [activeTab, setActiveTab] = useState<'account' | 'agent' | 'api' | 'billing'>('account');

  // Account states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Agent customization states
  const [agentName, setAgentName] = useState("ARIA");
  const [agentPersona, setAgentPersona] = useState("ops_analyst");
  const [agentTone, setAgentTone] = useState("professional");
  const [agentInstructions, setAgentInstructions] = useState("");

  // API & Custom model states
  const [customApiKey, setCustomApiKey] = useState("");
  const [customBaseUrl, setCustomBaseUrl] = useState("");
  const [customModelName, setCustomModelName] = useState("");
  const [showKey, setShowKey] = useState(false);

  // Subscription plan & telemetry states
  const [plan, setPlan] = useState("SANDBOX_INIT");
  const [totalTokensUsed, setTotalTokensUsed] = useState(0);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageLimit, setStorageLimit] = useState(10);
  const [tokenCap, setTokenCap] = useState(100000);

  // Fetch settings on mount
  const fetchSettings = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/auth/settings`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/signup";
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setFullName(data.full_name || "");
        setEmail(data.email || "");
        setAgentName(data.agent_name || "ARIA");
        setAgentPersona(data.agent_persona || "ops_analyst");
        setAgentTone(data.agent_tone || "professional");
        setAgentInstructions(data.agent_instructions || "");
        setCustomApiKey(data.custom_api_key || "");
        setCustomBaseUrl(data.custom_base_url || "");
        setCustomModelName(data.custom_model_name || "");
        setPlan(data.plan || "SANDBOX_INIT");
        setTotalTokensUsed(data.total_tokens_used || 0);
        setStorageUsed(data.storage_used || 0.0);
        setStorageLimit(data.storage_limit || 10.0);
        setTokenCap(data.token_cap || 100000);
      }
    } catch (err) {
      console.error("Failed to load user settings", err);
      setError("Failed to fetch settings from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkToken = setInterval(() => {
      const token = localStorage.getItem("token");
      if (token) {
        clearInterval(checkToken);
        fetchSettings();
      }
    }, 300);

    return () => clearInterval(checkToken);
  }, []);

  const handleSave = async (e: React.FormEvent, tabType: string) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const payload: any = {};

      if (tabType === 'account') {
        if (!fullName.trim() || !email.trim()) {
          setError("Full Name and Email are required fields.");
          setSaving(false);
          return;
        }
        payload.full_name = fullName.trim();
        payload.email = email.trim();
        if (password) {
          if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setSaving(false);
            return;
          }
          if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            setSaving(false);
            return;
          }
          payload.password = password;
        }
      } else if (tabType === 'agent') {
        payload.agent_name = agentName.trim() || "ARIA";
        payload.agent_persona = agentPersona;
        payload.agent_tone = agentTone;
        payload.agent_instructions = agentInstructions.trim();
      } else if (tabType === 'api') {
        payload.custom_api_key = customApiKey.trim();
        payload.custom_base_url = customBaseUrl.trim();
        payload.custom_model_name = customModelName.trim();
      }

      const res = await fetch(`${API_BASE}/auth/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setSuccess("Settings updated successfully.");
        // Refresh local inputs with updated response
        setFullName(data.full_name || "");
        setEmail(data.email || "");
        setAgentName(data.agent_name || "ARIA");
        setAgentPersona(data.agent_persona || "ops_analyst");
        setAgentTone(data.agent_tone || "professional");
        setAgentInstructions(data.agent_instructions || "");
        setCustomApiKey(data.custom_api_key || "");
        setCustomBaseUrl(data.custom_base_url || "");
        setCustomModelName(data.custom_model_name || "");
        setPassword("");
        setConfirmPassword("");
      } else {
        const errJson = await res.json();
        setError(errJson.detail || "Failed to save settings details.");
      }
    } catch (err) {
      console.error("Save settings failure:", err);
      setError("Network or server connection error.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpgradePlan = async (tierName: string, tierPrice: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    if (tierName === "SANDBOX_INIT") {
      try {
        const res = await fetch(`${API_BASE}/organizations/plan`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ plan: tierName })
        });
        if (res.ok) {
          setSuccess(`Successfully reverted plan to ${tierName}.`);
          localStorage.setItem("user_plan", tierName);
          fetchSettings();
        } else {
          setError("Failed to update plan.");
        }
      } catch (err) {
        console.error("Revert plan failed", err);
        setError("Revert plan connection failed.");
      }
    } else {
      // Redirect to simulated Stripe payment gateway
      window.location.href = `/checkout?tier=${encodeURIComponent(tierName)}&price=${encodeURIComponent(tierPrice)}`;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_plan");
    localStorage.removeItem("user_plan_price");
    window.location.href = "/signup";
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-400 font-mono">
          <Loader2 className="animate-spin text-orange-400" size={24} />
          <p className="text-xs">LOADING_SYSTEM_SETTINGS...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Quota percentage calculations
  const storagePercentage = Math.min(100, (storageUsed / storageLimit) * 100);
  const tokenPercentage = Math.min(100, (totalTokensUsed / tokenCap) * 100);

  const planTitles: Record<string, string> = {
    "SANDBOX_INIT": "Sandbox Init",
    "AUDIT_PROFESSIONAL": "Audit Professional",
    "ENTERPRISE_COMMAND": "Enterprise Command",
    "QUANT_INTELLIGENCE": "Quant Intelligence"
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 font-sans text-left">
        
        {/* Title Banner */}
        <div className="border-b border-zinc-800 pb-4 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-light text-white uppercase tracking-wider font-mono">SYSTEM_SETTINGS</h2>
            <p className="text-zinc-400 text-xs mt-1">Configure your workspace coordinates, customize AI persona rules, and monitor API telemetry.</p>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono hidden sm:block">
            SYS.SETTINGS_CONSOLE // WORKSPACE_ACTIVE
          </div>
        </div>

        {/* Success / Error Alerts */}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded text-xs font-mono flex items-center gap-2.5">
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded text-xs font-mono flex items-center gap-2.5">
            <AlertTriangle size={16} />
            <span>⚠️ ERROR_LOG: {error}</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Settings Tabs Sidebar */}
          <div className="w-full lg:w-1/4 shrink-0">
            <div className="bg-zinc-950/60 border border-zinc-900 rounded p-4 space-y-1 font-mono text-xs uppercase tracking-wider">
              <button 
                onClick={() => { setActiveTab('account'); setError(""); setSuccess(""); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all duration-150 cursor-pointer ${
                  activeTab === 'account' 
                    ? 'bg-orange-500/15 text-white border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.05)]' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                }`}
              >
                <User size={16} />
                <span>Account Profile</span>
              </button>

              <button 
                onClick={() => { setActiveTab('agent'); setError(""); setSuccess(""); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all duration-150 cursor-pointer ${
                  activeTab === 'agent' 
                    ? 'bg-orange-500/15 text-white border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.05)]' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                }`}
              >
                <Bot size={16} />
                <span>Agent Customize</span>
              </button>

              <button 
                onClick={() => { setActiveTab('api'); setError(""); setSuccess(""); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all duration-150 cursor-pointer ${
                  activeTab === 'api' 
                    ? 'bg-orange-500/15 text-white border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.05)]' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                }`}
              >
                <Key size={16} />
                <span>API Keys & LLM</span>
              </button>

              <button 
                onClick={() => { setActiveTab('billing'); setError(""); setSuccess(""); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded transition-all duration-150 cursor-pointer ${
                  activeTab === 'billing' 
                    ? 'bg-orange-500/15 text-white border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.05)]' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40'
                }`}
              >
                <CreditCard size={16} />
                <span>Subscription Plan</span>
              </button>

              <div className="border-t border-zinc-900 my-2 pt-2">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded text-rose-500 hover:bg-rose-950/20 transition-all cursor-pointer font-bold"
                >
                  <LogOut size={16} />
                  <span>Log Out Session</span>
                </button>
              </div>
            </div>
          </div>

          {/* Settings Tab Content */}
          <div className="flex-1">
            <div className="bg-zinc-950/40 border border-zinc-900 rounded p-6 sm:p-8 relative">
              
              {/* Decorative visual corner marks */}
              <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-800" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-800" />
              <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-zinc-800" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-zinc-800" />

              {/* ACCOUNT TAB */}
              {activeTab === 'account' && (
                <form onSubmit={(e) => handleSave(e, 'account')} className="space-y-6">
                  <div>
                    <h3 className="text-base font-mono text-white uppercase tracking-wider">Account Settings</h3>
                    <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-widest mt-0.5">UPDATE_IDENTITY // SECURITY_PARAMS</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">Full Name</label>
                      <input 
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Alex Rivera"
                        className="w-full bg-black border border-zinc-900 focus:border-orange-500 rounded px-4 py-2.5 text-xs text-zinc-200 focus:outline-none transition-all font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">Email Address</label>
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full bg-black border border-zinc-900 focus:border-orange-500 rounded px-4 py-2.5 text-xs text-zinc-200 focus:outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="border-t border-zinc-900 my-6 pt-6">
                    <h4 className="text-xs font-mono text-white uppercase mb-4">Change Password</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">New Password</label>
                        <input 
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-black border border-zinc-900 focus:border-orange-500 rounded px-4 py-2.5 text-xs text-zinc-200 focus:outline-none transition-all font-mono"
                        />
                        <span className="text-[8px] text-zinc-650 block">Leave blank to keep current password.</span>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">Confirm New Password</label>
                        <input 
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-black border border-zinc-900 focus:border-orange-500 rounded px-4 py-2.5 text-xs text-zinc-200 focus:outline-none transition-all font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={saving}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-805 text-white font-mono text-xs py-2.5 px-6 rounded transition-all flex items-center gap-2 uppercase font-bold cursor-pointer"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin text-orange-400" /> : <Save size={14} />}
                    <span>Save Account Profile</span>
                  </button>
                </form>
              )}

              {/* AGENT TAB */}
              {activeTab === 'agent' && (
                <form onSubmit={(e) => handleSave(e, 'agent')} className="space-y-6">
                  <div>
                    <h3 className="text-base font-mono text-white uppercase tracking-wider">Agent Personalization</h3>
                    <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-widest mt-0.5">CUSTOMIZE_ARIA_COGNITIVE_BLUEPRINT</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">Agent Name</label>
                      <input 
                        type="text"
                        required
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        placeholder="ARIA"
                        className="w-full bg-black border border-zinc-900 focus:border-orange-500 rounded px-4 py-2.5 text-xs text-zinc-200 focus:outline-none transition-all font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">Agent Persona Profile</label>
                      <select 
                        value={agentPersona}
                        onChange={(e) => setAgentPersona(e.target.value)}
                        className="w-full bg-black border border-zinc-900 focus:border-orange-500 rounded px-4 py-2.5 text-xs text-zinc-200 focus:outline-none transition-all font-mono"
                      >
                        <option value="ops_analyst">Standard Operations Analyst</option>
                        <option value="rev_consultant">Executive Revenue Consultant</option>
                        <option value="cost_auditor">Leakage Cost Auditor</option>
                        <option value="layman_guide">Layman Operations Guide</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">Response Tone Style</label>
                      <select 
                        value={agentTone}
                        onChange={(e) => setAgentTone(e.target.value)}
                        className="w-full bg-black border border-zinc-900 focus:border-orange-500 rounded px-4 py-2.5 text-xs text-zinc-200 focus:outline-none transition-all font-mono"
                      >
                        <option value="professional">Highly Professional</option>
                        <option value="detailed">Thorough & Detailed</option>
                        <option value="direct">Direct & Action-First</option>
                        <option value="conversational">Friendly & Conversational</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">Custom System Directives</label>
                      <span className="text-[8px] text-zinc-600 font-mono">APPENDS_TO_SYS_PROMPT</span>
                    </div>
                    <textarea 
                      rows={5}
                      value={agentInstructions}
                      onChange={(e) => setAgentInstructions(e.target.value)}
                      placeholder="e.g. Always prioritize restaurant waste analysis. Highlight food truck margins. Use EUR conversions when talking about shipping."
                      className="w-full bg-black border border-zinc-900 focus:border-orange-500 rounded px-4 py-3 text-xs text-zinc-200 focus:outline-none transition-all font-mono resize-none"
                    />
                    <span className="text-[8px] text-zinc-650 block">These instructions will guide the LLM agent behavior across all conversations.</span>
                  </div>

                  <button 
                    type="submit" 
                    disabled={saving}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-805 text-white font-mono text-xs py-2.5 px-6 rounded transition-all flex items-center gap-2 uppercase font-bold cursor-pointer"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin text-orange-400" /> : <Save size={14} />}
                    <span>Save Agent Config</span>
                  </button>
                </form>
              )}

              {/* API TAB */}
              {activeTab === 'api' && (
                <form onSubmit={(e) => handleSave(e, 'api')} className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-mono text-white uppercase tracking-wider">Custom Model & API Config</h3>
                      <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-widest mt-0.5">OVERRIDE_DEFAULT_OPENAI_CREDENTIALS</p>
                    </div>
                    <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded text-[8px] font-mono flex items-center gap-1 uppercase">
                      <Shield size={10} /> BYPASS_ACTIVE
                    </div>
                  </div>

                  <div className="bg-zinc-950/80 border border-zinc-900 rounded p-4 text-[10px] text-zinc-400 space-y-1.5 font-mono leading-relaxed">
                    <p className="font-bold text-white uppercase">💡 HOW CUSTOM MODELS WORK:</p>
                    <p>By entering your custom OpenAI key, your prompts are sent directly from your database backend to your specified key. You can also specify custom base URLs (e.g. self-hosted LocalAI, OpenRouter, Anyscale) and custom model strings to completely control API expenditure.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">Custom OpenAI API Key</label>
                    <div className="relative">
                      <input 
                        type={showKey ? "text" : "password"}
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full bg-black border border-zinc-900 focus:border-orange-500 rounded pl-4 pr-10 py-2.5 text-xs text-zinc-200 focus:outline-none transition-all font-mono"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-3 text-zinc-500 hover:text-white"
                      >
                        {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <span className="text-[8px] text-zinc-600 block">Encrypted at rest in SQLite. Overrides server default environment variable.</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">Custom Base URL (Optional)</label>
                      <input 
                        type="text"
                        value={customBaseUrl}
                        onChange={(e) => setCustomBaseUrl(e.target.value)}
                        placeholder="https://api.openai.com/v1"
                        className="w-full bg-black border border-zinc-900 focus:border-orange-500 rounded px-4 py-2.5 text-xs text-zinc-200 focus:outline-none transition-all font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase">Custom Model Name (Optional)</label>
                      <input 
                        type="text"
                        value={customModelName}
                        onChange={(e) => setCustomModelName(e.target.value)}
                        placeholder="gpt-4o"
                        className="w-full bg-black border border-zinc-900 focus:border-orange-500 rounded px-4 py-2.5 text-xs text-zinc-200 focus:outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={saving}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-805 text-white font-mono text-xs py-2.5 px-6 rounded transition-all flex items-center gap-2 uppercase font-bold cursor-pointer"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin text-orange-400" /> : <Save size={14} />}
                    <span>Save API Parameters</span>
                  </button>
                </form>
              )}

              {/* BILLING TAB */}
              {activeTab === 'billing' && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-base font-mono text-white uppercase tracking-wider">Subscription & Quota Analytics</h3>
                    <p className="text-zinc-500 text-[10px] uppercase font-mono tracking-widest mt-0.5">MONITOR_USAGE_LIMITS // NODE_SCALING</p>
                  </div>

                  {/* Quotas Panel */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Token Quota */}
                    <div className="bg-zinc-950 border border-zinc-900 rounded p-5 relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider block">Model Processing Tokens</span>
                          <span className="text-xl font-bold text-white font-mono mt-1 block">
                            {totalTokensUsed.toLocaleString()} / {tokenCap >= 10000000 ? `${tokenCap / 1000000}M` : `${tokenCap / 1000}K`}
                          </span>
                        </div>
                        <div className="bg-zinc-900/60 p-2 border border-zinc-800 rounded">
                          <Zap size={14} className="text-orange-500" />
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-orange-500 h-1.5 rounded-full transition-all duration-500 shadow-[0_0_6px_#f97316]"
                            style={{ width: `${tokenPercentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] font-mono text-zinc-500">
                          <span>{tokenPercentage.toFixed(1)}% CONSUMED</span>
                          <span>RESET_MONTHLY</span>
                        </div>
                      </div>
                    </div>

                    {/* Storage Quota */}
                    <div className="bg-zinc-950 border border-zinc-900 rounded p-5 relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider block">Staging Database Capacity</span>
                          <span className="text-xl font-bold text-white font-mono mt-1 block">
                            {storageUsed.toFixed(2)} MB / {storageLimit} MB
                          </span>
                        </div>
                        <div className="bg-zinc-900/60 p-2 border border-zinc-800 rounded">
                          <CreditCard size={14} className="text-orange-500" />
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-orange-500 h-1.5 rounded-full transition-all duration-500 shadow-[0_0_6px_#f97316]"
                            style={{ width: `${storagePercentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] font-mono text-zinc-500">
                          <span>{storagePercentage.toFixed(1)}% CAPACITY</span>
                          <span>PERSISTENT</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Plan Tiers */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono text-white uppercase tracking-wider">Configure Subscription Node</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Sandbox */}
                      <div className={`border p-5 rounded relative flex flex-col justify-between ${
                        plan === "SANDBOX_INIT" 
                          ? 'border-orange-500 bg-orange-500/5' 
                          : 'border-zinc-900 bg-zinc-950/20 hover:border-zinc-800'
                      }`}>
                        <div>
                          <div className="flex justify-between items-start">
                            <h5 className="text-xs font-bold text-white font-mono uppercase">SANDBOX_INIT</h5>
                            {plan === "SANDBOX_INIT" && (
                              <span className="text-[7px] font-mono bg-orange-500 text-black px-1.5 py-0.5 rounded font-bold">ACTIVE</span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-2">Perfect for standard file validation and initial database schema mappings.</p>
                          <span className="text-lg font-bold text-white font-mono block mt-3">$0 <span className="text-[10px] font-light text-zinc-500 font-sans">/mo</span></span>
                        </div>

                        {plan !== "SANDBOX_INIT" && (
                          <button 
                            onClick={() => handleUpgradePlan("SANDBOX_INIT", "$0")}
                            className="w-full bg-zinc-900 hover:bg-zinc-850 text-white border border-zinc-850 text-[10px] py-2 rounded mt-4 font-mono font-bold cursor-pointer"
                          >
                            REVERT_TO_SANDBOX
                          </button>
                        )}
                      </div>

                      {/* Professional */}
                      <div className={`border p-5 rounded relative flex flex-col justify-between ${
                        plan === "AUDIT_PROFESSIONAL" 
                          ? 'border-orange-500 bg-orange-500/5' 
                          : 'border-zinc-900 bg-zinc-950/20 hover:border-zinc-800'
                      }`}>
                        <div>
                          <div className="flex justify-between items-start">
                            <h5 className="text-xs font-bold text-white font-mono uppercase">AUDIT_PROFESSIONAL</h5>
                            {plan === "AUDIT_PROFESSIONAL" && (
                              <span className="text-[7px] font-mono bg-orange-500 text-black px-1.5 py-0.5 rounded font-bold">ACTIVE</span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-2">Adds PDF reporting features, larger files, and custom prompt memory bounds.</p>
                          <span className="text-lg font-bold text-white font-mono block mt-3">$15 <span className="text-[10px] font-light text-zinc-500 font-sans">/mo</span></span>
                        </div>

                        {plan !== "AUDIT_PROFESSIONAL" && (
                          <button 
                            onClick={() => handleUpgradePlan("AUDIT_PROFESSIONAL", "$15")}
                            className="w-full bg-orange-500 text-black hover:bg-orange-600 text-[10px] py-2 rounded mt-4 font-mono font-bold cursor-pointer"
                          >
                            {plan === "SANDBOX_INIT" ? "UPGRADE_PLAN" : "SELECT_PLAN"}
                          </button>
                        )}
                      </div>

                      {/* Enterprise */}
                      <div className={`border p-5 rounded relative flex flex-col justify-between ${
                        plan === "ENTERPRISE_COMMAND" 
                          ? 'border-orange-500 bg-orange-500/5' 
                          : 'border-zinc-900 bg-zinc-950/20 hover:border-zinc-800'
                      }`}>
                        <div>
                          <div className="flex justify-between items-start">
                            <h5 className="text-xs font-bold text-white font-mono uppercase">ENTERPRISE_COMMAND</h5>
                            {plan === "ENTERPRISE_COMMAND" && (
                              <span className="text-[7px] font-mono bg-orange-500 text-black px-1.5 py-0.5 rounded font-bold">ACTIVE</span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-2">Unlimited uploads, dedicated isolated database backups, and custom script runtimes.</p>
                          <span className="text-lg font-bold text-white font-mono block mt-3">$35 <span className="text-[10px] font-light text-zinc-500 font-sans">/mo</span></span>
                        </div>

                        {plan !== "ENTERPRISE_COMMAND" && (
                          <button 
                            onClick={() => handleUpgradePlan("ENTERPRISE_COMMAND", "$35")}
                            className="w-full bg-orange-500 text-black hover:bg-orange-600 text-[10px] py-2 rounded mt-4 font-mono font-bold cursor-pointer"
                          >
                            SELECT_PLAN
                          </button>
                        )}
                      </div>

                      {/* Quant Intel */}
                      <div className={`border p-5 rounded relative flex flex-col justify-between ${
                        plan === "QUANT_INTELLIGENCE" 
                          ? 'border-orange-500 bg-orange-500/5' 
                          : 'border-zinc-900 bg-zinc-950/20 hover:border-zinc-800'
                      }`}>
                        <div>
                          <div className="flex justify-between items-start">
                            <h5 className="text-xs font-bold text-white font-mono uppercase">QUANT_INTELLIGENCE</h5>
                            {plan === "QUANT_INTELLIGENCE" && (
                              <span className="text-[7px] font-mono bg-orange-500 text-black px-1.5 py-0.5 rounded font-bold">ACTIVE</span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-2">Real-time webhook relays, custom trained weights telemetry, and direct SLA response.</p>
                          <span className="text-lg font-bold text-white font-mono block mt-3">$100 <span className="text-[10px] font-light text-zinc-500 font-sans">/mo</span></span>
                        </div>

                        {plan !== "QUANT_INTELLIGENCE" && (
                          <button 
                            onClick={() => handleUpgradePlan("QUANT_INTELLIGENCE", "$100")}
                            className="w-full bg-orange-500 text-black hover:bg-orange-600 text-[10px] py-2 rounded mt-4 font-mono font-bold cursor-pointer"
                          >
                            SELECT_PLAN
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
