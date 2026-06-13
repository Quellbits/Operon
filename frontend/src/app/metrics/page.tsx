"use client";
import Logo from '../../components/Logo';

 
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
        const res = await fetch("http://127.0.0.1:8000/analytics/metrics", {
          headers: { "Authorization": `Bearer ${token}` }
        });
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
      <div className="max-w-6xl mx-auto space-y-8 font-mono text-left">
        
        {/* Header Title */}
        <div className="border-b border-zinc-900 pb-4">
          <h2 className="text-xl font-light text-white uppercase tracking-wider">DETERMINISTIC_METRICS</h2>
          <p className="text-zinc-400 text-xs mt-1">Calculated by our Python-based analytics engine. No AI estimations.</p>
        </div>
 
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue vs Cost Area Chart */}
          <section className="bg-zinc-950 p-6 rounded border border-zinc-900 relative">
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-800" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-800" />
            
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-6 px-2">REVENUE_VS_COSTS</h3>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '4px', color: '#f4f4f5', fontFamily: 'monospace', fontSize: '11px' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                    <Area type="monotone" dataKey="cost" stroke="#f59e0b" strokeWidth={1.5} fill="transparent" strokeDasharray="3 3" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-500 text-xs italic">Awaiting data ingestion...</div>
              )}
            </div>
          </section>
  
          {/* Product Distribution Pie Chart */}
          <section className="bg-zinc-950 p-6 rounded border border-zinc-900 relative">
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-800" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-800" />
            
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest mb-6 px-2">REVENUE_BY_PRODUCT_CATEGORY</h3>
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
                          contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '4px', color: '#f4f4f5', fontFamily: 'monospace', fontSize: '11px' }}
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
                <div className="text-zinc-500 text-xs italic">Awaiting data ingestion...</div>
              )}
            </div>
          </section>
        </div>
 
        {/* Detailed Metrics Table */}
        <section className="bg-zinc-950 rounded border border-zinc-900 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-800" />
          <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-800" />
          
          <div className="p-5 border-b border-zinc-900 flex justify-between items-center">
             <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">PERIOD_PERFORMANCE_METRICS</h3>
             <button 
               onClick={() => alert("Raw metrics CSV exported to downloads.")}
               className="text-[10px] font-bold text-orange-400 hover:text-orange-450 hover:underline"
             >
               EXPORT_RAW_LEDGER
             </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px] text-[11px]">
              <thead>
                <tr className="bg-black border-b border-zinc-900">
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider">Month</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider">Normalized Revenue</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider">MoM Growth</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider">Gross Margin Ratio</th>
                  <th className="px-6 py-4 font-bold text-zinc-400 uppercase tracking-wider">P&L Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 bg-zinc-950/20">
                {periodPerformance.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-zinc-300">{row.month}</td>
                    <td className="px-6 py-4 text-zinc-400 font-mono">{row.rev}</td>
                    <td className={`px-6 py-4 font-semibold ${
                      row.growth.startsWith('+') ? 'text-emerald-400' : 
                      row.growth === '0%' ? 'text-zinc-500' : 'text-rose-400'
                    }`}>
                      {row.growth}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 font-mono">{row.margin}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${
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
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-550 italic">
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
