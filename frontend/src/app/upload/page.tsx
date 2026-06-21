"use client";
import Logo from '../../components/Logo';
import { API_BASE } from '@/config';

 
import React, { useState, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CloudUpload, FileCheck, HelpCircle, ArrowRight, Loader2, Check } from 'lucide-react';
 
export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadId, setUploadId] = useState<number | null>(null);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [sampleData, setSampleData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Storage limit state
  const [storageUsed, setStorageUsed] = useState<number>(0);
  const [storageLimit, setStorageLimit] = useState<number>(10);
  const [orgPlan, setOrgPlan] = useState<string>("SANDBOX_INIT");
 
  const fetchStorageInfo = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/organizations/active`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStorageUsed(data.storage_used);
        setStorageLimit(data.storage_limit);
        setOrgPlan(data.plan);
      }
    } catch (err) {
      console.error("Failed to load storage details", err);
    }
  };

  React.useEffect(() => {
    fetchStorageInfo();
  }, []);
 
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadFile(e.target.files[0]);
    }
  };
 
  const uploadFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setLoading(true);
    setError("");
    setStatusMsg("Analyzing file schema...");
 
    const formData = new FormData();
    formData.append("file", selectedFile);
 
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const response = await fetch(`${API_BASE}/uploads/`, {
        method: "POST",
        headers,
        body: formData,
      });
 
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to parse file. Please upload a valid CSV or XLSX spreadsheet.");
      }
 
      const data = await response.json();
      setUploadId(data.id);
      setMappings(data.detected_mappings);
      setSampleData(data.sample_data || []);
      setStatusMsg("Schema detected successfully.");
      
      // Sync local storage display
      await fetchStorageInfo();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setFile(null);
    } finally {
      setLoading(false);
    }
  };
 
  const handleMappingChange = (column: string, newCanonical: string) => {
    setMappings((prev) => ({
      ...prev,
      [column]: newCanonical,
    }));
  };
 
  const handleProcess = async () => {
    if (!uploadId) return;
    setProcessing(true);
    setError("");
    setStatusMsg("Operon Operations Engine is normalizing transactions, calculating deterministic metrics, and running the P&L audit engine...");
 
    const token = localStorage.getItem("token");
 
    try {
      const response = await fetch(`${API_BASE}/uploads/${uploadId}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(mappings)
      });
 
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Operational processing failed.");
      }
 
      setStatusMsg("Audit complete! Routing to overview dashboard...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1000);
    } catch (err: any) {
      setError(err.message || "An error occurred during metrics calculations.");
      setProcessing(false);
    }
  };
 
  const canonicalOptions = [
    "date", "revenue", "cost", "customer", "product", "quantity", 
    "inventory", "expense", "employee", "location"
  ];
 
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 font-sans text-left">
        
        {/* Intro */}
        <div className="border-b border-zinc-800 pb-4 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-light text-white uppercase tracking-wider font-mono">INGEST_BUSINESS_DATA</h2>
            <p className="text-zinc-450 text-xs mt-1 font-light">
              Upload your operational Excel or CSV files. Operon&apos;s schema engine will map your columns to standardized business concepts.
            </p>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            SYS.NODE_INGEST // ACTIVE
          </div>
        </div>
 
        {/* Storage capacity status card */}
        <div className="glass-panel rounded-xl p-5 relative shadow-md">
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-700" />
          <div className="flex justify-between items-center text-xs font-bold text-zinc-300 font-mono">
            <span>ACTIVE_NODE_PLAN: <span className="text-orange-400">{orgPlan}</span></span>
            <span>STORAGE_USAGE: {storageUsed.toFixed(2)} MB / {storageLimit} MB</span>
          </div>
          <div className="w-full bg-zinc-950 border border-zinc-800/80 h-2 mt-3.5 rounded-full overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${storageUsed >= storageLimit ? 'bg-red-500' : 'bg-gradient-to-r from-orange-500 to-amber-600'}`}
              style={{ width: `${Math.min((storageUsed / storageLimit) * 100, 100)}%` }}
            />
          </div>
          {storageUsed >= storageLimit && (
            <p className="text-[10px] text-red-500 font-bold uppercase mt-2 font-mono">
              ⚠️ Storage limit exceeded. Please upgrade your node plan to ingest additional files.
            </p>
          )}
        </div>

        {/* Upload Zone */}
        {!file && (
          <div 
            onClick={() => {
              if (storageUsed >= storageLimit) {
                alert("Storage limit exceeded. Please upgrade your node plan under the SYS.PRICING page.");
                return;
              }
              fileInputRef.current?.click();
            }}
            className={`glass-panel border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer group relative shadow-lg ${
              storageUsed >= storageLimit 
                ? 'border-red-900/40 bg-red-500/5 cursor-not-allowed' 
                : 'border-zinc-800 hover:border-orange-500/40 hover:bg-orange-500/5 duration-300'
            }`}
          >
            {/* Corner marks */}
            <div className={`absolute top-0 left-0 w-3 h-3 border-t border-l ${storageUsed >= storageLimit ? 'border-red-500/30' : 'border-zinc-800 group-hover:border-orange-500/50'}`} />
            <div className={`absolute top-0 right-0 w-3 h-3 border-t border-r ${storageUsed >= storageLimit ? 'border-red-500/30' : 'border-zinc-800 group-hover:border-orange-500/50'}`} />
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".csv,.xlsx" 
              disabled={storageUsed >= storageLimit}
              className="hidden" 
            />
            <div className={`w-16 h-16 bg-zinc-900/80 border text-orange-400 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-105 ${storageUsed >= storageLimit ? 'border-red-900/50 text-red-400' : 'border-zinc-800 group-hover:border-orange-500/30'}`}>
              {loading ? <Loader2 size={28} className="animate-spin text-orange-400" /> : <CloudUpload size={28} />}
            </div>
            <h3 className="text-sm font-bold text-zinc-200 font-mono tracking-wide">
              {loading ? "ANALYZING_SPREADSHEET..." : storageUsed >= storageLimit ? "STORAGE_CAPACITY_EXCEEDED" : "DROP_DATA_FILE_HERE"}
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1.5 uppercase font-mono tracking-wider">
              {storageUsed >= storageLimit ? "Upgrade plan to enable uploads" : "Support for .csv and .xlsx up to 50MB"}
            </p>
            {storageUsed < storageLimit && (
              <button className="mt-6 bg-orange-500 hover:bg-orange-600 text-black px-6 py-2.5 rounded-lg font-bold text-xs transition-all font-mono shadow-md shadow-orange-500/15 cursor-pointer">
                SELECT_FILE
              </button>
            )}
          </div>
        )}
 
        {/* Status Overlay */}
        {statusMsg && !error && (
          <div className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg flex items-center gap-3 text-orange-400 text-xs font-mono">
            {processing || loading ? <Loader2 className="animate-spin shrink-0" size={14} /> : <Check className="shrink-0" size={14} />}
            <span className="leading-relaxed">{statusMsg}</span>
          </div>
        )}
 
        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-950/10 border border-red-900/30 rounded-lg text-red-400 text-xs flex items-center justify-between font-mono">
            <span className="font-semibold">⚠️ ERROR: {error}</span>
            <button onClick={() => setFile(null)} className="underline font-bold hover:text-red-350 cursor-pointer">TRY_AGAIN</button>
          </div>
        )}
  
        {/* Mapping Tool */}
        {file && uploadId && !processing && (
          <section className="glass-panel p-6 sm:p-8 rounded-xl relative space-y-6 shadow-xl">
            {/* Corner marks */}
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-700" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-700" />
            
            <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
              <div className="text-left">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">AUTOMATIC_SCHEMA_MAPPING</h3>
                <p className="text-zinc-500 text-[10px] mt-1 font-mono">Review how Operon maps &apos;{file.name}&apos; fields</p>
              </div>
              <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded font-mono">CONFIDENCE: HIGH</span>
            </div>
  
            <div className="space-y-3">
              {Object.keys(mappings).map((col) => (
                <div key={col} className="flex flex-col md:flex-row md:items-center justify-between p-3.5 bg-zinc-950/40 rounded-lg border border-zinc-850/60 gap-4 transition-all hover:border-zinc-800">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-900/60 font-mono">{col}</span>
                    <ArrowRight size={12} className="text-zinc-700 hidden md:block" />
                  </div>
                  
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-zinc-500">maps to</span>
                    <select 
                      value={mappings[col]}
                      onChange={(e) => handleMappingChange(col, e.target.value)}
                      className="bg-zinc-950 text-orange-400 font-bold border border-zinc-800 rounded p-1.5 focus:outline-none focus:border-orange-500 font-mono cursor-pointer transition-colors"
                    >
                      {canonicalOptions.map((opt) => (
                        <option key={opt} value={opt} className="bg-zinc-950 text-zinc-300">{opt.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
 
            <button 
              onClick={handleProcess}
              className="w-full mt-6 bg-orange-500 hover:bg-orange-600 text-black py-3.5 rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-500/10 font-mono cursor-pointer"
            >
              BEGIN_OPERATIONS_AUDIT_PROCESSING <ArrowRight size={14} />
            </button>
          </section>
        )}
 
        {/* Capabilities Detail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 font-sans">
          <div className="glass-panel p-5 rounded-xl relative text-left shadow-md">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-700" />
            <div className="flex items-center gap-3 mb-4 font-mono text-xs">
              <div className="p-2 bg-zinc-900 border border-zinc-800 text-orange-400 rounded-lg">
                <FileCheck size={14} />
              </div>
              <h4 className="font-bold text-zinc-300 uppercase tracking-widest">Canonical Normalization</h4>
            </div>
            <p className="text-xs text-zinc-450 leading-relaxed font-light normal-case">
              Operon normalizes raw ledger fields (e.g. &quot;Total Price Net&quot;) into deterministic operational categories (e.g. &quot;revenue&quot;) to run exact mathematical algorithms.
            </p>
          </div>
  
          <div className="glass-panel p-5 rounded-xl relative text-left shadow-md">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-700" />
            <div className="flex items-center gap-3 mb-4 font-mono text-xs">
              <div className="p-2 bg-zinc-900 border border-zinc-800 text-orange-400 rounded-lg">
                <HelpCircle size={14} />
              </div>
              <h4 className="font-bold text-zinc-300 uppercase tracking-widest">AI Narrative Layer</h4>
            </div>
            <p className="text-xs text-zinc-450 leading-relaxed font-light normal-case">
              Once data metrics are computed mathematically, our LLM layer compiles a customized, consultant-grade executive summary highlighting profit leakages and wastage trends.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
