"use client";
import Logo from '../../components/Logo';

 
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { API_BASE } from '@/config';
import { FileText, Download, CheckCircle2, ChevronRight, FilePieChart, Loader2, AlertCircle, LayoutDashboard } from 'lucide-react';
 
export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [customQuery, setCustomQuery] = useState("");
  const [generating, setGenerating] = useState(false);
  const [compilationLog, setCompilationLog] = useState("");
  const [compilationProgress, setCompilationProgress] = useState(0);

  const handleGenerateCustomReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim() || generating) return;
    
    setGenerating(true);
    setCompilationLog("EXTRACTING_FILTER_SCOPE...");
    setCompilationProgress(15);
    
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in.");
      setGenerating(false);
      return;
    }
    
    const timer1 = setTimeout(() => {
      setCompilationLog("COMPUTING_SUBSET_STATISTICS...");
      setCompilationProgress(50);
    }, 1200);
    
    const timer2 = setTimeout(() => {
      setCompilationLog("COMPILING_PDF_REPORT...");
      setCompilationProgress(80);
    }, 2800);
    
    try {
      const res = await fetch(`${API_BASE}/reports/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ query: customQuery })
      });
      
      if (res.ok) {
        const newReport = await res.json();
        setCompilationProgress(100);
        setCompilationLog("REPORT_GENERATION_SUCCESSFUL");
        
        setReports(prev => [newReport, ...prev]);
        setCustomQuery("");
        
        // Wait a brief moment to show success state, then redirect to dashboard
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.detail || "Failed to generate report.");
      }
    } catch (err) {
      console.error(err);
      alert("Error generating custom report.");
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setTimeout(() => {
        setGenerating(false);
        setCompilationProgress(0);
        setCompilationLog("");
      }, 800);
    }
  };

  useEffect(() => {
    const fetchReports = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/reports/`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/signup";
          return;
        }
        if (res.ok) {
          const json = await res.json();
          setReports(json || []);
        }
      } catch (err) {
        console.error("Failed to load reports", err);
      } finally {
        setLoading(false);
      }
    };

    const checkToken = setInterval(() => {
      const token = localStorage.getItem("token");
      if (token) {
        clearInterval(checkToken);
        fetchReports();
      }
    }, 300);

    return () => clearInterval(checkToken);
  }, []);

  const handleDownload = async (reportId: number, title: string) => {
    setDownloading(reportId);
    const token = localStorage.getItem("token");
    const cleanTitle = title.replace(/\s+/g, "_").toLowerCase();
    
    try {
      const res = await fetch(`${API_BASE}/reports/${reportId}/pdf`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `operon_${cleanTitle}_${reportId}.pdf`;
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
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-400 font-mono">
          <Loader2 className="animate-spin text-orange-400" size={24} />
          <p className="text-xs">ASSEMBLING_AUDIT_CATALOG...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 font-sans text-left">
        
        {/* Title */}
        <div className="border-b border-zinc-800 pb-4 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div>
            <h2 className="text-2xl font-light text-white uppercase tracking-wider font-mono">EXECUTIVE_REPORTS</h2>
            <p className="text-zinc-400 text-xs mt-1">Downloadable consultant-grade reports based on your latest business operations.</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.location.href = "/dashboard"}
              className="border border-zinc-850 hover:border-zinc-750 bg-[#121620]/30 hover:bg-[#121620]/60 text-zinc-400 hover:text-white px-3 py-1.8 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 font-mono cursor-pointer"
            >
              <LayoutDashboard size={11} className="text-orange-400" />
              Return_to_Dashboard
            </button>
            <div className="text-[10px] text-zinc-500 font-mono hidden sm:block">
              SYS.NODE_REPORTS // ARCHIVE
            </div>
          </div>
        </div>

        {/* Custom Report Generator Console */}
        <div className="glass-panel p-6 rounded-xl relative overflow-hidden shadow-lg transition-all duration-300 hover:border-zinc-700/60">
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-700" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-700" />
          
          <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-3 font-mono">CUSTOM_AUDIT_CONSOLE</h3>
          <p className="text-zinc-400 text-xs mb-5 leading-relaxed font-sans normal-case font-light">
            Target a specific product, customer segment, or ledger concern. Operon's AI will parse your query parameters, filter the ledger dynamically, calculate Pearson correlations and regression forecasts, and compile a tailored COO executive PDF.
          </p>
          
          <form onSubmit={handleGenerateCustomReport} className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase text-zinc-500 font-mono tracking-wider">FOCUS_QUERY_PARAMETER</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="e.g. Identify cost leakages in Seals & Gaskets"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  className="flex-1 bg-zinc-950/80 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-3 text-xs font-mono focus:outline-none focus:border-orange-500/50 transition-all focus:ring-1 focus:ring-orange-500/20"
                  disabled={generating}
                />
                <button
                  type="submit"
                  disabled={generating || !customQuery.trim()}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black text-xs font-bold px-6 py-3 rounded-lg transition-all shrink-0 tracking-wider flex items-center justify-center gap-2 font-mono shadow-md shadow-orange-500/10 cursor-pointer"
                >
                  {generating ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>COMPILING...</span>
                    </>
                  ) : (
                    <span>GENERATE_AUDIT</span>
                  )}
                </button>
              </div>
            </div>
          </form>

          {generating && (
            <div className="mt-5 p-4 bg-zinc-900/40 border border-zinc-800 rounded-lg flex items-center gap-3">
              <Loader2 size={16} className="animate-spin text-orange-400" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-zinc-300 font-mono uppercase tracking-wider">{compilationLog}</p>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-amber-600 h-full transition-all duration-500 rounded-full" 
                    style={{ width: `${compilationProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
 
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Scope Card */}
          <div className="md:col-span-1 glass-panel p-6 rounded-xl h-fit relative shadow-lg">
             <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-700" />
             
             <div className="w-10 h-10 bg-zinc-900/80 border border-zinc-800 text-orange-400 rounded-lg flex items-center justify-center mb-6">
                <FilePieChart size={18} />
             </div>
             
             <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest font-mono">AUDIT_SCOPE</h3>
             <p className="text-xs text-zinc-450 mt-2 leading-relaxed normal-case font-light">
               Operon generates formal business reviews mapping metrics to action items.
             </p>
             
             <div className="mt-6 space-y-3 font-mono text-[10px]">
                {['AI Executive Summary', 'Profit Leak Auditing', 'Wastage Disclosures', 'Health Score Verification'].map((opt, i) => (
                   <div key={i} className="flex items-center gap-2">
                     <div className="w-4 h-4 rounded border border-orange-500/20 bg-orange-500/10 flex items-center justify-center shrink-0">
                       <CheckCircle2 size={10} className="text-orange-400" />
                     </div>
                     <span className="text-zinc-400 font-semibold">{opt}</span>
                   </div>
                ))}
             </div>
          </div>
  
          {/* Reports List */}
          <div className="md:col-span-2 space-y-4">
             {reports.map((report, idx) => {
               const dateStr = new Date(report.generated_at).toLocaleDateString(undefined, {
                 year: 'numeric', month: 'long', day: 'numeric'
               });
               const title = `OPERON_EXECUTIVE_AUDIT_${report.id}`;
               
               return (
                 <div key={idx} className="glass-panel p-5 rounded-xl hover:border-orange-500/35 transition-all flex items-center gap-6 group relative shadow-md hover:scale-[1.005] duration-300">
                    {/* Corner markers */}
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-700" />
                    
                    <div className="w-12 h-12 bg-zinc-900/80 text-zinc-650 border border-zinc-800 rounded-lg flex items-center justify-center group-hover:border-orange-500/30 group-hover:text-orange-400 transition-colors shrink-0">
                       <FileText size={20} />
                    </div>
                    
                    <div className="flex-1 min-w-0 text-left">
                      <h4 className="text-xs font-bold text-zinc-200 group-hover:text-orange-450 transition-colors truncate font-mono">{title}</h4>
                      <div className="flex items-center gap-3 mt-1.5 text-[9px] text-zinc-400">
                        <span className="normal-case font-light">{dateStr}</span>
                        <span className="text-zinc-800">•</span>
                        <span className="font-mono">{report.report_type.toUpperCase()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 shrink-0 font-mono">
                       <span className="text-[8px] font-bold px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 tracking-widest uppercase">
                         READY
                       </span>
                       <button 
                         onClick={() => handleDownload(report.id, title)}
                         disabled={downloading !== null}
                         className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                       >
                          {downloading === report.id ? (
                            <Loader2 size={16} className="animate-spin text-orange-400" />
                          ) : (
                            <Download size={16} />
                          )}
                       </button>
                       <ChevronRight className="text-zinc-700" size={16} />
                    </div>
                 </div>
               );
             })}
             {reports.length === 0 && (
               <div className="glass-panel p-12 rounded-xl text-center text-zinc-500 space-y-4 relative shadow-lg">
                 <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-700" />
                 <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-700" />
                 
                 <AlertCircle className="mx-auto text-zinc-700" size={36} />
                 <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider font-mono">NO_REPORTS_AVAILABLE</h3>
                 <p className="max-w-md mx-auto text-xs text-zinc-450 normal-case font-light">Please upload your operations CSV/XLSX file to automatically generate your first operational report.</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
