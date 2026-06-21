"use client";
import Logo from '../../components/Logo';

 
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { API_BASE } from '@/config';
import { BarChart as RechartBarChart, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Loader2, AlertCircle } from 'lucide-react';
 
export default function MetricsPage() {
  const [metricsData, setMetricsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/analytics/metrics`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/signup";
          return;
        }
        if (res.ok) {
          const json = await res.json();
          setMetricsData(json);
        }
      } catch (err) {
        console.error("Failed to load metrics data", err);
      } finally {
        setLoading(false);
      }
    };

    const checkToken = setInterval(() => {
      const token = localStorage.getItem("token");
      if (token) {
        clearInterval(checkToken);
        fetchMetrics();
      }
    }, 300);

    return () => clearInterval(checkToken);
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-zinc-400 font-mono">
          <Loader2 className="animate-spin text-orange-400" size={24} />
          <p className="text-xs">CRUNCHING_LEDGER_CALCULATIONS...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Brand specific colors matching the landing page accents
  const COLORS = ['#f97316', '#ea580c', '#c2410c', '#f59e0b', '#d97706', '#b45309'];

  const monthlyTrend = metricsData?.monthly_trend || [];
  const productDistribution = metricsData?.product_distribution || [];
  const periodPerformance = metricsData?.period_performance || [];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 text-left font-sans">
        
        {/* Header Title */}
        <div className="border-b border-zinc-800 pb-4 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-light text-zinc-100 uppercase tracking-wider font-mono">DETERMINISTIC_METRICS</h2>
            <p className="text-zinc-400 text-xs mt-1">Calculated by our Python-based analytics engine. No AI estimations.</p>
          </div>
          <div className="text-[10px] text-zinc-500 font-mono">
            SYS.NODE_METRICS // SECURE
          </div>
        </div>
 
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue vs Cost Area Chart */}
          <section className="glass-panel p-6 rounded-xl relative overflow-hidden transition-all duration-300 hover:border-zinc-700/60 shadow-xl">
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-700" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-700" />
            
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-6 px-2 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              REVENUE_VS_COSTS
            </h3>
            <div className="h-[280px] w-full">
              {monthlyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(43,51,72,0.3)" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#889ac2', fontSize: 10, fontFamily: 'monospace'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#889ac2', fontSize: 10, fontFamily: 'monospace'}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(18,22,32,0.95)', border: '1px solid rgba(43,51,72,0.8)', borderRadius: '8px', color: '#eef2fc', fontFamily: 'monospace', fontSize: '11px', backdropFilter: 'blur(10px)' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                    <Area type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={1.5} fill="transparent" strokeDasharray="3 3" name="Cost" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-500 text-xs italic font-mono">Awaiting data ingestion...</div>
              )}
            </div>
          </section>
  
          {/* Product Distribution Pie Chart */}
          <section className="glass-panel p-6 rounded-xl relative overflow-hidden transition-all duration-300 hover:border-zinc-700/60 shadow-xl">
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-700" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-700" />
            
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-6 px-2 font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              REVENUE_BY_PRODUCT_CATEGORY
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-center h-[280px] gap-6">
              {productDistribution.length > 0 ? (
                <>
                  <div className="h-[200px] w-[200px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={productDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {productDistribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(18,22,32,0.95)', border: '1px solid rgba(43,51,72,0.8)', borderRadius: '8px', color: '#eef2fc', fontFamily: 'monospace', fontSize: '11px', backdropFilter: 'blur(10px)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2.5 max-h-[180px] overflow-y-auto pr-2 w-full">
                    {productDistribution.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between gap-4 font-mono text-[10px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                          <span className="text-zinc-400 truncate">{item.name}</span>
                        </div>
                        <span className="text-zinc-200 font-bold shrink-0">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-zinc-500 text-xs italic font-mono">Awaiting data ingestion...</div>
              )}
            </div>
          </section>
        </div>
 
        {/* Detailed Metrics Table */}
        <section className="glass-panel rounded-xl overflow-hidden relative shadow-xl">
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-700" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-700" />
          
          <div className="p-5 border-b border-zinc-800/80 flex justify-between items-center">
             <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">PERIOD_PERFORMANCE_METRICS</h3>
             <button 
               onClick={() => alert("Raw metrics CSV exported to downloads.")}
               className="text-[10px] font-bold text-orange-400 hover:text-orange-300 hover:underline font-mono"
             >
               EXPORT_RAW_LEDGER
             </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px] text-[12px]">
              <thead>
                <tr className="bg-zinc-950/80 border-b border-zinc-800">
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider font-mono">Month</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider font-mono">Normalized Revenue</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider font-mono">MoM Growth</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider font-mono">Gross Margin Ratio</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider font-mono">P&L Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850/60 bg-zinc-950/20">
                {periodPerformance.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-zinc-200">{row.month}</td>
                    <td className="px-6 py-4 text-zinc-400 font-mono">{row.rev}</td>
                    <td className={`px-6 py-4 font-semibold font-mono ${
                      row.growth.startsWith('+') ? 'text-emerald-400' : 
                      row.growth === '0%' ? 'text-zinc-500' : 'text-rose-400'
                    }`}>
                      {row.growth}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 font-mono">{row.margin}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest font-mono ${
                        row.status === 'Warning' ? 'border-rose-500/20 bg-rose-500/5 text-rose-400' : 
                        row.status === 'Peak' ? 'border-orange-500/20 bg-orange-500/15 text-orange-400' : 
                        row.status === 'Stable' ? 'border-zinc-800 bg-zinc-900 text-zinc-500' : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {periodPerformance.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500 italic font-mono">
                      Please upload and process transactions to compile periodic P&L stats.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
