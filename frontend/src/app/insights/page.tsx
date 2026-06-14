"use client";
import Logo from '../../components/Logo';

 
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { API_BASE } from '@/config';
import { AlertCircle, TrendingDown, ShieldAlert, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
 
export default function InsightsPage() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/analytics/overview`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setInsights(json.insights || []);
        }
      } catch (err) {
        console.error("Failed to load insights", err);
      } finally {
        setLoading(false);
      }
    };

    const checkToken = setInterval(() => {
      const token = localStorage.getItem("token");
      if (token) {
        clearInterval(checkToken);
        fetchInsights();
      }
    }, 300);

    return () => clearInterval(checkToken);
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-400 font-mono">
          <Loader2 className="animate-spin text-orange-400" size={24} />
          <p className="text-xs">ANALYZING_TRANSACTION_ANOMALIES...</p>
        </div>
      </DashboardLayout>
    );
  }

  const getSeverityStyle = (sev: string) => {
    if (sev === "critical" || sev === "high") {
      return {
        color: "rose",
        borderColor: "border-rose-500/20 bg-rose-500/5 text-rose-400",
        btnColor: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/10",
        icon: <ShieldAlert size={14} className="text-rose-400" />
      };
    } else if (sev === "medium") {
      return {
        color: "amber",
        borderColor: "border-amber-500/20 bg-amber-500/5 text-amber-400",
        btnColor: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/10",
        icon: <TrendingDown size={14} className="text-amber-400 rotate-180" />
      };
    } else {
      return {
        color: "orange",
        borderColor: "border-orange-500/20 bg-orange-500/5 text-orange-400",
        btnColor: "bg-orange-500 hover:bg-orange-600 text-black shadow-orange-500/10",
        icon: <CheckCircle2 size={14} className="text-orange-400" />
      };
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 font-mono text-left">
        
        {/* Title */}
        <div className="border-b border-zinc-900 pb-4">
          <h2 className="text-xl font-light text-white uppercase tracking-wider">OPERATIONAL_INTELLIGENCE</h2>
          <p className="text-zinc-400 text-xs mt-1">Rules-based insights generated from your normalized business model to isolate P&L leakages.</p>
        </div>
 
        <div className="space-y-6">
          {insights.map((insight, idx) => {
            const style = getSeverityStyle(insight.severity);
            return (
              <div key={idx} className="bg-zinc-950 rounded border border-zinc-900 overflow-hidden flex flex-col md:flex-row relative">
                {/* Side indicator strip */}
                <div className={`w-1 md:w-1.5 shrink-0 ${
                  style.color === 'rose' ? 'bg-rose-500' : style.color === 'amber' ? 'bg-amber-500' : 'bg-orange-500'
                }`}></div>
                
                {/* Corner markers */}
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-800" />
                
                <div className="p-6 sm:p-8 flex-1 flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3 text-[9px]">
                      <div className={`p-1.5 rounded border ${style.borderColor} flex items-center justify-center shrink-0`}>
                        {style.icon}
                      </div>
                      <span className="font-bold uppercase tracking-widest text-zinc-300">{insight.category}</span>
                      <span className="text-zinc-700">•</span>
                      <span className="font-bold uppercase tracking-widest text-zinc-500">{insight.severity.toUpperCase()}_IMPACT</span>
                    </div>
                    <h3 className="text-base font-bold text-zinc-200 uppercase">{insight.title}</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed font-sans normal-case">{insight.description}</p>
                    {insight.impact && (
                      <p className="text-[11px] text-zinc-300 font-sans italic normal-case">Impact Potential: {insight.impact}</p>
                    )}
                  </div>
                  
                  <div className="md:w-64 shrink-0 flex flex-col justify-center border-t md:border-t-0 md:border-l border-zinc-900 pt-6 md:pt-0 md:pl-8">
                     <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-3 text-center md:text-left">RECOMMENDATION</p>
                     <p className="text-xs font-bold text-zinc-300 leading-relaxed mb-6 text-center md:text-left font-sans normal-case">
                       Proactively audit vendor bills and optimize category costs.
                     </p>
                     <button 
                       onClick={() => alert("Insight acknowledged and logged in system parameters.")}
                       className={`w-full py-2.5 rounded font-mono font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-md ${style.btnColor}`}
                     >
                        ACKNOWLEDGE_RISK <ArrowRight size={12} />
                     </button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {insights.length === 0 && (
            <div className="bg-zinc-950 p-12 rounded border border-zinc-900 text-center text-zinc-400 space-y-4 relative">
              <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-800" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-800" />
              
              <AlertCircle className="mx-auto text-zinc-700" size={36} />
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">NO_INSIGHTS_GENERATED</h3>
              <p className="max-w-md mx-auto text-xs text-zinc-400 font-sans normal-case">Upload operations data to calculate metrics and run the automated rules engine.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
