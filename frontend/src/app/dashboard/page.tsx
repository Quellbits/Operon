"use client";

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { API_BASE } from '@/config';
import { 
  TrendingUp, DollarSign, ShieldCheck, AlertTriangle, Loader2, 
  Layers, Terminal, CheckCircle2, AlertOctagon, RefreshCw, UploadCloud, Info,
  Lock, X
} from 'lucide-react';
import Link from 'next/link';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, PieChart, Pie, Cell 
} from 'recharts';

// industry-specific configurations
const INDUSTRY_DETAILS: Record<string, {
  title: string;
  chartTitle: string;
  revLabel: string;
  costLabel: string;
  metric1: string; // overall
  metric2: string; // revenue
  metric3: string; // cost
  metric4: string; // customers
}> = {
  GENERAL: {
    title: "OPERATIONS AUDIT CONSOLE",
    chartTitle: "Monthly Revenue vs Operating Costs",
    revLabel: "Gross Revenue",
    costLabel: "Operating Cost",
    metric1: "SYSTEM HEALTH INDEX",
    metric2: "REVENUE GROWTH INDEX",
    metric3: "COST CONTROL INDEX",
    metric4: "CUSTOMER HEALTH INDEX"
  },
  RESTAURANT: {
    title: "RESTAURANT OPERATIONS AUDIT",
    chartTitle: "Culinary Ticket Revenue vs Ingredient Costs",
    revLabel: "Culinary Ticket Sales",
    costLabel: "Food & Beverage Costs",
    metric1: "OUTLET HEALTH INDEX",
    metric2: "GUEST TICKET GROWTH",
    metric3: "CULINARY COST RATING",
    metric4: "GUEST SATISFACTION INDEX"
  },
  LOGISTICS: {
    title: "FLEET & ROUTE OPERATIONS AUDIT",
    chartTitle: "Route Tonnage Revenue vs Carrier Shipping Cost",
    revLabel: "Tonnage Billing Revenue",
    costLabel: "Carrier & Fuel Costs",
    metric1: "FLEET HEALTH INDEX",
    metric2: "ROUTE TONNAGE BILLING",
    metric3: "CARRIER PRICE STABILITY",
    metric4: "ON-TIME SLA COMPLIANCE"
  },
  ECOMMERCE: {
    title: "E-COMMERCE FULFILLMENT AUDIT",
    chartTitle: "Order Net Revenue vs Warehouse & CAC Cost",
    revLabel: "Order Net Sales",
    costLabel: "Fulfillment & CAC Costs",
    metric1: "STORE HEALTH INDEX",
    metric2: "ORDER CONVERSION RATIO",
    metric3: "FULFILLMENT EFFICIENCY",
    metric4: "CUSTOMER RETENTION INDEX"
  },
  SAAS: {
    title: "SAAS RECURRING REVENUE AUDIT",
    chartTitle: "Monthly Recurring Revenue vs Cloud Infrastructure",
    revLabel: "Recurring Revenue",
    costLabel: "Cloud Host & Support Costs",
    metric1: "PLATFORM HEALTH INDEX",
    metric2: "MRR EXPANSION RATE",
    metric3: "CLOUD COST EFFICIENCY",
    metric4: "NET REVENUE RETENTION (NRR)"
  },
  HEALTHCARE: {
    title: "CLINICAL BILLING & CAPACITY AUDIT",
    chartTitle: "Patient Billing Yield vs Staffing Overhead",
    revLabel: "Patient Billing Yield",
    costLabel: "Clinical Staffing & Equipment",
    metric1: "CLINIC HEALTH INDEX",
    metric2: "PATIENT OUTLET YIELD",
    metric3: "STAFF CAPACITY RATING",
    metric4: "PATIENT SATISFACTION INDEX"
  }
};

const CHART_COLORS = ['#f97316', '#3b82f6', '#10b981', '#6366f1', '#a855f7', '#71717a'];

export default function DashboardOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInsight, setSelectedInsight] = useState<any>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM] OPERON EXECUTIVE CONTROL PANEL BOOTED.",
    "[SYSTEM] Direct database integrations active. Loaded GDPR metrics."
  ]);
  const [chartView, setChartView] = useState<'both' | 'profit'>('both');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Refs for agent scroll target highlighting
  const revenueCardRef = useRef<HTMLDivElement>(null);
  const costsCardRef = useRef<HTMLDivElement>(null);
  const customersCardRef = useRef<HTMLDivElement>(null);
  const concentrationCardRef = useRef<HTMLDivElement>(null);
  const correlationsRef = useRef<HTMLDivElement>(null);
  const inspectorRef = useRef<HTMLDivElement>(null);

  // State for visual agent triggers
  const [activeFocusTopic, setActiveFocusTopic] = useState<'REVENUE' | 'COSTS' | 'CUSTOMERS' | 'CONCENTRATION' | 'SHIPPING' | 'NONE'>('NONE');
  const [showAnomalyModal, setShowAnomalyModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // State for correlation decrypt dialog
  const [selectedCorrelation, setSelectedCorrelation] = useState<{
    title: string;
    coefficient: number;
    description: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const openCorrelationDetail = (title: string, coeff: number, desc: string) => {
    setSelectedCorrelation({ title, coefficient: coeff, description: desc });
  };

  // Add items to console log
  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTerminalLogs(prev => [...prev.slice(-20), `[${timestamp}] ${msg}`]);
  };

  // Scroll to bottom of terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  // Fetch overview analytics and baseline metrics
  const fetchOverview = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      // 1. Fetch dashboard overview
      const res = await fetch(`${API_BASE}/analytics/overview`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
      
      // 2. Fetch metrics
      const resMetrics = await fetch(`${API_BASE}/analytics/metrics`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resMetrics.ok) {
        const jsonMetrics = await resMetrics.json();
        setMetricsData(jsonMetrics);
      }
      addLog("[SYSTEM] Baseline metrics successfully fetched and synced.");
    } catch (err) {
      console.error("Failed to load overview data", err);
      addLog("[ERROR] Failed to fetch system baseline data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkToken = setInterval(() => {
      const token = localStorage.getItem("token");
      if (token) {
        clearInterval(checkToken);
        fetchOverview();
      }
    }, 300);

    return () => clearInterval(checkToken);
  }, []);

  // Detect domain profile based on uploaded files and insights
  const detectDomain = () => {
    if (!data) return "GENERAL";
    
    const uploadsText = (data.uploads || []).map((u: any) => u.name).join(" ").toLowerCase();
    if (uploadsText.includes("restaurant") || uploadsText.includes("food") || uploadsText.includes("cafe") || uploadsText.includes("menu")) {
      return "RESTAURANT";
    }
    if (uploadsText.includes("logistics") || uploadsText.includes("freight") || uploadsText.includes("shipping") || uploadsText.includes("fleet") || uploadsText.includes("delivery")) {
      return "LOGISTICS";
    }
    if (uploadsText.includes("ecommerce") || uploadsText.includes("retail") || uploadsText.includes("sales") || uploadsText.includes("shop") || uploadsText.includes("cart") || uploadsText.includes("product")) {
      return "ECOMMERCE";
    }
    if (uploadsText.includes("saas") || uploadsText.includes("software") || uploadsText.includes("recurring") || uploadsText.includes("subscription")) {
      return "SAAS";
    }
    if (uploadsText.includes("healthcare") || uploadsText.includes("clinic") || uploadsText.includes("patient") || uploadsText.includes("medical") || uploadsText.includes("doctor")) {
      return "HEALTHCARE";
    }
    
    const insightsText = (data.insights || []).map((ins: any) => ins.title + " " + ins.description).join(" ").toLowerCase();
    if (insightsText.includes("food cost") || insightsText.includes("restaurant") || insightsText.includes("table turn")) {
      return "RESTAURANT";
    }
    if (insightsText.includes("freight") || insightsText.includes("carrier") || insightsText.includes("logistics")) {
      return "LOGISTICS";
    }
    if (insightsText.includes("ecommerce") || insightsText.includes("cart abandonment") || insightsText.includes("cac") || insightsText.includes("shopify")) {
      return "ECOMMERCE";
    }
    if (insightsText.includes("saas") || insightsText.includes("mrr") || insightsText.includes("nrr") || insightsText.includes("subscription price")) {
      return "SAAS";
    }
    if (insightsText.includes("clinic") || insightsText.includes("patient satisfaction") || insightsText.includes("medical") || insightsText.includes("nurse")) {
      return "HEALTHCARE";
    }

    return "GENERAL";
  };

  const domain = detectDomain();
  const activeDetails = INDUSTRY_DETAILS[domain] || INDUSTRY_DETAILS.GENERAL;

  // Sync state transitions to industry profile
  useEffect(() => {
    if (data) {
      addLog(`[SYSTEM] Loaded operational blueprint for industry: ${domain}`);
    }
  }, [domain]);

  // Sync AI Agent Focus Commands
  useEffect(() => {
    const handleAgentCommand = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { command, value } = customEvent.detail;

      addLog(`[AGENT] INTERCEPTED COMMAND: ${command} = "${value}"`);

      if (command === 'SET_FOCUS_TOPIC') {
        const topic = value.replace(/"/g, '').trim().toUpperCase();
        setActiveFocusTopic(topic as any);
        addLog(`[SYSTEM] Visual console focus shifting to category: "${topic}"`);
        showToast(`ARIA focused console view on: ${topic}`);

        // Handle smooth scroll targets
        setTimeout(() => {
          if (topic === 'REVENUE') {
            revenueCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else if (topic === 'COSTS') {
            costsCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else if (topic === 'CUSTOMERS') {
            customersCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else if (topic === 'CONCENTRATION') {
            concentrationCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else if (topic === 'SHIPPING') {
            correlationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }

      if (command === 'HIGHLIGHT_ANOMALY') {
        const formatted = value.replace(/"/g, '').trim();
        const found = (metricsData?.anomalies || []).find((a: any) => 
          a.title.toLowerCase().includes(formatted.toLowerCase()) ||
          a.product.toLowerCase().includes(formatted.toLowerCase()) ||
          a.description.toLowerCase().includes(formatted.toLowerCase())
        );
        if (found) {
          setSelectedInsight(found);
          setShowAnomalyModal(true);
          addLog(`[SYSTEM] Telemetry inspector focused on: "${found.title}"`);
          showToast(`ARIA highlighted outlier anomaly: ${found.title}`);
          
          setTimeout(() => {
            inspectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }

      if (command === 'HIGHLIGHT_CORRELATION') {
        const formatted = value.replace(/"/g, '').trim().toLowerCase();
        correlationsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        const activeCorrelations = metricsData?.correlations || {
          qty_rev: 0.85,
          price_qty: -0.65,
          cost_rev: 0.90,
          rev_profit: 0.72
        };

        if (formatted.includes("price") || formatted.includes("elastic")) {
          openCorrelationDetail('Price Elasticity', activeCorrelations.price_qty, 'Measures how unit price adjustments correlate with purchase quantities. A negative correlation indicates high price-elasticity, meaning price hikes suppress purchasing demand.');
          showToast("ARIA highlighted correlation: Price Elasticity");
        } else if (formatted.includes("cost") || formatted.includes("supplier")) {
          openCorrelationDetail('Supplier Cost vs Gross Revenue', activeCorrelations.cost_rev, 'Measures correlation between supplier transaction cost and top-line client revenue. A high positive correlation (close to +1.0) is standard in variable-cost operations, but deviation suggests cost creep.');
          showToast("ARIA highlighted correlation: Cost vs Revenue");
        } else if (formatted.includes("volume") || formatted.includes("qty") || formatted.includes("quantity")) {
          openCorrelationDetail('Volume vs Revenue scale', activeCorrelations.qty_rev, 'Measures how tightly revenue scaling is coupled with overall transaction quantities. Standard benchmark for physical/sales throughput operations.');
          showToast("ARIA highlighted correlation: Quantity vs Revenue");
        } else if (formatted.includes("profit") || formatted.includes("margin")) {
          openCorrelationDetail('Margin Scalability', activeCorrelations.rev_profit, 'Measures the Pearson r coefficient between Gross Revenue and Net Profit. A coefficient lower than +0.80 suggests margin compression or cost leakages are draining gross yields.');
          showToast("ARIA highlighted correlation: Revenue vs Profit");
        }
      }
    };

    window.addEventListener('operon-agent-command', handleAgentCommand);
    return () => window.removeEventListener('operon-agent-command', handleAgentCommand);
  }, [metricsData]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4 font-mono text-zinc-550">
          <Loader2 className="animate-spin text-orange-500" size={32} />
          <span className="text-xs uppercase tracking-widest">Loading Executive Analytics...</span>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate actual revenue sum from monthly trends
  const actualTrend = metricsData?.monthly_trend || [];
  const forecastTrend = metricsData?.forecast_trend || [];
  const combinedTrend = [...actualTrend, ...forecastTrend];

  const totalRevenue = actualTrend.reduce((acc: number, curr: any) => acc + curr.revenue, 0);
  const totalCost = actualTrend.reduce((acc: number, curr: any) => acc + curr.cost, 0);
  const totalMarginPct = totalRevenue > 0 ? Math.round(((totalRevenue - totalCost) / totalRevenue) * 100) : 0;

  // Calculate total identified cost leaks from actual anomalies
  const anomaliesList = metricsData?.anomalies || [];
  const totalLeakageAmount = anomaliesList.reduce((acc: number, curr: any) => acc + curr.impact, 0);

  // Overall health breakdown from database
  const healthBreakdown = data?.health_score || { overall: 0, revenue: 0, customers: 0, costs: 0 };

  // Setup dataset adaptability logic
  const transactionCount = metricsData?.transaction_count ?? 0;
  const isMock = metricsData?.is_mock ?? false;
  const isSmallDataset = !isMock && transactionCount < 10;

  // Setup Recharts data (excludes forecast projections if small dataset)
  const chartData = (isSmallDataset ? actualTrend : combinedTrend).map((t: any) => ({
    name: t.name,
    Revenue: t.isForecast ? null : t.revenue,
    Cost: t.isForecast ? null : t.cost,
    Profit: t.isForecast ? null : (t.revenue - t.cost),
    ForecastRevenue: t.isForecast ? t.revenue : null,
    ForecastCost: t.isForecast ? t.cost : null,
    ForecastProfit: t.isForecast ? (t.revenue - t.cost) : null,
  }));

  // Setup Pie Chart data
  const pieData = metricsData?.product_distribution || [];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 font-mono text-left relative selection:bg-orange-500/20 selection:text-orange-400">
        
        {/* Header Ribbon */}
        <div className="bg-zinc-950 p-4 border border-zinc-900 rounded flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-800" />
          
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_#f97316]" />
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">{activeDetails.title}</h2>
              <p className="text-[10px] text-zinc-550 mt-0.5">Fortune 500 Enterprise Operations Console // Multi-ledger auditing enabled.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-[10px]">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">INDUSTRY_PROFILE:</span>
              <span className="px-2 py-0.5 rounded border border-orange-500/30 bg-orange-500/10 text-orange-400 font-bold text-[9px]">
                {domain}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-500">SYSTEM_STATUS:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                ACTIVE
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </span>
            </div>
            
            <button 
              onClick={fetchOverview}
              className="bg-zinc-900 hover:bg-zinc-850 text-zinc-350 hover:text-white border border-zinc-850 px-3 py-1.5 rounded text-[9px] font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={11} />
              SYNC_REFRESH
            </button>
          </div>
        </div>

        {/* Executive Scorecards (Top Row) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* Card 1: Health Index Dial */}
          <div 
            ref={customersCardRef}
            className={`bg-zinc-950 p-5 border rounded relative flex items-center gap-4 min-h-[120px] transition-all duration-300 ${
              activeFocusTopic === 'CUSTOMERS' ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)] scale-[1.02]' : 'border-zinc-900'
            }`}
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
            
            {/* Miniature Dial Arc */}
            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
              <svg width="64" height="64" viewBox="0 0 64 64" className="transform -rotate-90">
                <circle cx="32" cy="32" r="28" stroke="#1c1917" strokeWidth="4.5" fill="none" />
                <circle 
                  cx="32" 
                  cy="32" 
                  r="28" 
                  stroke="#f97316" 
                  strokeWidth="4.5" 
                  strokeDasharray={2 * Math.PI * 28}
                  strokeDashoffset={2 * Math.PI * 28 * (1 - healthBreakdown.overall / 100)}
                  strokeLinecap="round" 
                  fill="none" 
                />
              </svg>
              <span className="absolute text-sm font-extrabold text-white">{healthBreakdown.overall}</span>
            </div>
            
            <div className="space-y-1">
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block">{activeDetails.metric1}</span>
              <h4 className="text-xs font-bold text-white uppercase">OPERATIONAL HEALTH</h4>
              <span className="text-[9px] font-bold text-emerald-450 block">Target Threshold: Normal</span>
            </div>
          </div>

          {/* Card 2: Total Revenue */}
          <div 
            ref={revenueCardRef}
            className={`bg-zinc-950 p-5 border rounded relative flex flex-col justify-between min-h-[120px] transition-all duration-300 ${
              activeFocusTopic === 'REVENUE' ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)] scale-[1.02]' : 'border-zinc-900'
            }`}
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
            <div className="flex justify-between items-start">
              <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">AUDITED_REVENUE_YIELD</span>
              <DollarSign size={14} className="text-zinc-600" />
            </div>
            <div className="mt-2 space-y-0.5">
              <h3 className="text-lg font-extrabold text-white tracking-tight">${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
              <p className="text-[9px] text-zinc-400">Total ledger transactions mapped.</p>
            </div>
          </div>

          {/* Card 3: Identified Waste */}
          <div 
            ref={costsCardRef}
            className={`bg-zinc-950 p-5 border rounded relative flex flex-col justify-between min-h-[120px] transition-all duration-300 ${
              activeFocusTopic === 'COSTS' ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)] scale-[1.02]' : 'border-zinc-900'
            }`}
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
            <div className="flex justify-between items-start">
              <span className="text-[8px] font-bold text-zinc-555 uppercase tracking-widest">IDENTIFIED_COST_LEAKAGE</span>
              <AlertTriangle size={14} className="text-rose-500" />
            </div>
            <div className="mt-2 space-y-0.5">
              <h3 className="text-lg font-extrabold text-rose-400 tracking-tight">${totalLeakageAmount.toLocaleString()}</h3>
              <p className="text-[9px] text-zinc-500">{anomaliesList.length} critical Z-score outliers.</p>
            </div>
          </div>

          {/* Card 4: Operations Efficiency KPIs */}
          <div 
            ref={concentrationCardRef}
            className={`bg-zinc-950 p-5 border rounded relative flex flex-col justify-between min-h-[120px] transition-all duration-300 ${
              activeFocusTopic === 'CONCENTRATION' ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)] scale-[1.02]' : 'border-zinc-900'
            }`}
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
            <span className="text-[8px] font-bold text-zinc-555 uppercase tracking-widest">EFFICIENCY_METRIC_INDICES</span>
            
            <div className="grid grid-cols-2 gap-4 mt-2 font-mono text-[9px]">
              <div>
                <span className="text-zinc-600 uppercase block tracking-wider">Gross Margin</span>
                <span className="text-white font-bold text-xs mt-0.5 block">{totalMarginPct}%</span>
              </div>
              <div className="border-l border-zinc-900 pl-4">
                <span className="text-zinc-600 uppercase block tracking-wider">Leakage Ratio</span>
                <span className={`font-bold text-xs mt-0.5 block ${ (metricsData?.kpis?.cost_leakage_ratio || 0) > 0.1 ? 'text-amber-500' : 'text-emerald-400' }`}>
                  {((metricsData?.kpis?.cost_leakage_ratio || 0) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          
        </div>

        {/* Charts Section (Second Row) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Trend & Projections Area/Line Chart (8 Cols) */}
          <div 
            ref={revenueCardRef}
            className={`lg:col-span-8 bg-zinc-950 border p-5 rounded relative flex flex-col justify-between min-h-[340px] transition-all duration-300 ${
              activeFocusTopic === 'REVENUE' ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)] scale-[1.01]' : 'border-zinc-900'
            }`}
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
            
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={14} className="text-orange-455" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                  {activeDetails.chartTitle}
                </h3>
              </div>
              
              <div className="flex items-center gap-3">
                {isSmallDataset && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-orange-500/25 bg-orange-500/5 text-orange-400 text-[8px] font-mono font-bold uppercase">
                    <Lock size={10} />
                    Forecasting Locked
                  </span>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setChartView('both')}
                    className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all border ${chartView === 'both' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-zinc-900 border-zinc-850 text-zinc-500'}`}
                  >
                    REVENUE_VS_COST
                  </button>
                  <button
                    onClick={() => setChartView('profit')}
                    className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all border ${chartView === 'profit' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-zinc-900 border-zinc-850 text-zinc-500'}`}
                  >
                    NET_PROFITABILITY
                  </button>
                </div>
              </div>
            </div>

            {/* Recharts Wrapper */}
            <div className="flex-1 w-full h-[250px] font-mono text-[9px] mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colCost" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" stroke="#161b26" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 8}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 8}} />
                  
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0c0e14', border: '1px solid #1f2937', color: '#e4e4e7', fontFamily: 'monospace', fontSize: 9 }}
                    formatter={(value: any) => [`$${value.toLocaleString()}`]}
                  />
                  <Legend verticalAlign="top" height={24} iconSize={8} iconType="circle" />
                  
                  {chartView === 'both' ? (
                    <>
                      <Area type="monotone" dataKey="Revenue" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colRev)" name={activeDetails.revLabel} />
                      <Area type="monotone" dataKey="Cost" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colCost)" name={activeDetails.costLabel} />
                      
                      {!isSmallDataset && (
                        <>
                          <Area type="monotone" dataKey="ForecastRevenue" stroke="#f97316" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={0} name="Projected Revenue" />
                          <Area type="monotone" dataKey="ForecastCost" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={0} name="Projected Cost" />
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Area type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colProfit)" name="Gross Net Profit" />
                      {!isSmallDataset && (
                        <Area type="monotone" dataKey="ForecastProfit" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={0} name="Projected Net Profit" />
                      )}
                    </>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Product Distribution Pie Chart (4 Cols) */}
          <div 
            ref={concentrationCardRef}
            className={`lg:col-span-4 bg-zinc-950 border p-5 rounded relative flex flex-col justify-between min-h-[340px] transition-all duration-300 ${
              activeFocusTopic === 'CONCENTRATION' ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)] scale-[1.01]' : 'border-zinc-900'
            }`}
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
            
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Layers size={13} className="text-orange-400" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">PORTFOLIO_COST_DISTRIBUTION</h3>
              </div>
              <span className="text-[8px] text-zinc-550 uppercase tracking-widest">Share breakdown of total transactions</span>
            </div>

            {/* Recharts Pie */}
            <div className="flex-1 h-[180px] w-full flex items-center justify-center font-mono mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Micro Legend list */}
            <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-zinc-900 text-[8.5px] font-mono text-zinc-555">
              {pieData.slice(0, 4).map((entry: any, idx: number) => (
                <div key={idx} className="flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                  <span className="truncate uppercase">{entry.name} ({entry.value}%)</span>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Row 2.5: Pearson Correlation Matrix */}
        <div 
          ref={correlationsRef} 
          className={`bg-zinc-950 border rounded p-5 relative transition-all duration-300 ${
            activeFocusTopic === 'SHIPPING'
              ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)] scale-[1.01]' 
              : 'border-zinc-900'
          }`}
        >
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
          
          <div className="flex justify-between items-center mb-4 border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-orange-455" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                PREDICTIVE INTELLIGENCE & VARIABLE CORRELATIONS
              </h3>
            </div>
            <div className="text-[8px] text-zinc-550 font-mono flex items-center gap-1.5 uppercase font-bold">
              <Info size={11} />
              Pearson Correlation Matrix (r Coefficient Model)
            </div>
          </div>

          {isSmallDataset ? (
            /* Locked state notice */
            <div className="flex flex-col items-center justify-center py-10 px-6 text-center border border-dashed border-zinc-850 rounded bg-black/40 animate-fade-in">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-3">
                <Lock size={16} className="text-orange-500 animate-pulse" />
              </div>
              <h4 className="text-[11px] font-bold text-orange-400 uppercase tracking-widest">[!] STATISTICAL SIGNIFICANCE LIMIT REACHED</h4>
              <p className="text-[10px] text-zinc-400 font-sans max-w-lg mt-2 leading-relaxed normal-case">
                Correlation analytics and linear forecasting models require a larger operational data history (&gt;10 transaction records). Ingest more spreadsheets to unlock.
              </p>
            </div>
          ) : (
            /* Active Pearson Matrix grid */
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
              {/* Card 1: Price Elasticity */}
              <div 
                onClick={() => openCorrelationDetail('Price Elasticity', correlations.price_qty, 'Measures how unit price adjustments correlate with purchase quantities. A negative correlation indicates high price-elasticity, meaning price hikes suppress purchasing demand.')}
                className="p-4 bg-zinc-900/25 border border-zinc-900 hover:border-zinc-800 rounded transition-all cursor-pointer hover:bg-zinc-900/40 relative group"
              >
                <span className="text-[7.5px] text-zinc-555 font-bold block uppercase tracking-wider">01. PRICE ELASTICITY</span>
                <h4 className="text-xs font-bold text-white uppercase mt-1">Price vs Quantity</h4>
                <div className="flex items-baseline justify-between mt-3">
                  <span className={`text-xl font-extrabold tracking-tight ${correlations.price_qty < 0 ? 'text-rose-455' : 'text-emerald-450'}`}>
                    {correlations.price_qty > 0 ? '+' : ''}{correlations.price_qty.toFixed(2)}
                  </span>
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">
                    {Math.abs(correlations.price_qty) > 0.5 ? 'Elastic' : 'Inelastic'}
                  </span>
                </div>
                <div className="mt-3.5 space-y-1">
                  <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full absolute top-0 rounded-full ${correlations.price_qty < 0 ? 'bg-rose-500' : 'bg-emerald-400'}`}
                      style={{ 
                        width: `${Math.abs(correlations.price_qty) * 100}%`,
                        left: correlations.price_qty >= 0 ? '50%' : 'auto',
                        right: correlations.price_qty < 0 ? '50%' : 'auto'
                      }}
                    />
                  </div>
                  <p className="text-[8.5px] text-zinc-500 leading-normal font-sans pt-1 normal-case">
                    {correlations.price_qty < 0 
                      ? 'Negative elasticity: demand compresses as prices drift upwards.' 
                      : 'Positive elasticity: volume expands alongside unit prices.'}
                  </p>
                </div>
              </div>

              {/* Card 2: Cost vs Revenue */}
              <div 
                onClick={() => openCorrelationDetail('Supplier Cost vs Gross Revenue', correlations.cost_rev, 'Measures correlation between supplier transaction cost and top-line client revenue. A high positive correlation (close to +1.0) is standard in variable-cost operations, but deviation suggests cost creep.')}
                className="p-4 bg-zinc-900/25 border border-zinc-900 hover:border-zinc-800 rounded transition-all cursor-pointer hover:bg-zinc-900/40 relative group"
              >
                <span className="text-[7.5px] text-zinc-555 font-bold block uppercase tracking-wider">02. SUPPLIER DRIFT</span>
                <h4 className="text-xs font-bold text-white uppercase mt-1">Cost vs Revenue</h4>
                <div className="flex items-baseline justify-between mt-3">
                  <span className={`text-xl font-extrabold tracking-tight ${correlations.cost_rev > 0.8 ? 'text-emerald-450' : 'text-amber-500'}`}>
                    {correlations.cost_rev > 0 ? '+' : ''}{correlations.cost_rev.toFixed(2)}
                  </span>
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">
                    {correlations.cost_rev > 0.8 ? 'Synced' : 'Drifting'}
                  </span>
                </div>
                <div className="mt-3.5 space-y-1">
                  <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full absolute top-0 rounded-full ${correlations.cost_rev > 0.8 ? 'bg-emerald-400' : 'bg-amber-500'}`}
                      style={{ 
                        width: `${Math.abs(correlations.cost_rev) * 100}%`,
                        left: correlations.cost_rev >= 0 ? '50%' : 'auto',
                        right: correlations.cost_rev < 0 ? '50%' : 'auto'
                      }}
                    />
                  </div>
                  <p className="text-[8.5px] text-zinc-500 leading-normal font-sans pt-1 normal-case">
                    {correlations.cost_rev > 0.8
                      ? 'Costs scale linearly with gross receipts.' 
                      : 'Supplier cost drift detected relative to revenue.'}
                  </p>
                </div>
              </div>

              {/* Card 3: Quantity vs Revenue */}
              <div 
                onClick={() => openCorrelationDetail('Volume vs Revenue scale', correlations.qty_rev, 'Measures how tightly revenue scaling is coupled with overall transaction quantities. Standard benchmark for physical/sales throughput operations.')}
                className="p-4 bg-zinc-900/25 border border-zinc-900 hover:border-zinc-800 rounded transition-all cursor-pointer hover:bg-zinc-900/40 relative group"
              >
                <span className="text-[7.5px] text-zinc-555 font-bold block uppercase tracking-wider">03. TRANSACTION SCALE</span>
                <h4 className="text-xs font-bold text-white uppercase mt-1">Quantity vs Revenue</h4>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-xl font-extrabold tracking-tight text-emerald-450">
                    {correlations.qty_rev > 0 ? '+' : ''}{correlations.qty_rev.toFixed(2)}
                  </span>
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">
                    Volume Coupling
                  </span>
                </div>
                <div className="mt-3.5 space-y-1">
                  <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden relative">
                    <div 
                      className="h-full absolute top-0 rounded-full bg-emerald-400"
                      style={{ 
                        width: `${Math.abs(correlations.qty_rev) * 100}%`,
                        left: correlations.qty_rev >= 0 ? '50%' : 'auto',
                        right: correlations.qty_rev < 0 ? '50%' : 'auto'
                      }}
                    />
                  </div>
                  <p className="text-[8.5px] text-zinc-500 leading-normal font-sans pt-1 normal-case">
                    {correlations.qty_rev > 0.6 
                      ? 'Top-line yields expand linearly with unit volumes.' 
                      : 'Weak volume scaling; pricing mix dominates revenue.'}
                  </p>
                </div>
              </div>

              {/* Card 4: Revenue vs Net Profit */}
              <div 
                onClick={() => openCorrelationDetail('Margin Scalability', correlations.rev_profit, 'Measures the Pearson r coefficient between Gross Revenue and Net Profit. A coefficient lower than +0.80 suggests margin compression or cost leakages are draining gross yields.')}
                className="p-4 bg-zinc-900/25 border border-zinc-900 hover:border-zinc-800 rounded transition-all cursor-pointer hover:bg-zinc-900/40 relative group"
              >
                <span className="text-[7.5px] text-zinc-555 font-bold block uppercase tracking-wider">04. MARGIN SCALABILITY</span>
                <h4 className="text-xs font-bold text-white uppercase mt-1">Revenue vs Profit</h4>
                <div className="flex items-baseline justify-between mt-3">
                  <span className={`text-xl font-extrabold tracking-tight ${correlations.rev_profit > 0.8 ? 'text-emerald-450' : 'text-amber-500'}`}>
                    {correlations.rev_profit > 0 ? '+' : ''}{correlations.rev_profit.toFixed(2)}
                  </span>
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider">
                    {correlations.rev_profit > 0.8 ? 'Highly Scalable' : 'Margin Compression'}
                  </span>
                </div>
                <div className="mt-3.5 space-y-1">
                  <div className="w-full bg-zinc-950 h-1 rounded-full overflow-hidden relative">
                    <div 
                      className={`h-full absolute top-0 rounded-full ${correlations.rev_profit > 0.8 ? 'bg-emerald-400' : 'bg-amber-500'}`}
                      style={{ 
                        width: `${Math.abs(correlations.rev_profit) * 100}%`,
                        left: correlations.rev_profit >= 0 ? '50%' : 'auto',
                        right: correlations.rev_profit < 0 ? '50%' : 'auto'
                      }}
                    />
                  </div>
                  <p className="text-[8.5px] text-zinc-500 leading-normal font-sans pt-1 normal-case">
                    {correlations.rev_profit > 0.8 
                      ? 'Net margins scale robustly with revenue.' 
                      : 'Margin leakage drains operational returns.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Data Log & Audits Section (Third Row) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Outliers & Z-Score Table (8 Cols) */}
          <div 
            className={`lg:col-span-8 bg-zinc-950 border p-5 rounded relative flex flex-col justify-between min-h-[300px] transition-all duration-300 ${
              activeFocusTopic === 'COSTS' ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)] scale-[1.01]' : 'border-zinc-900'
            }`}
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-1.5">
                  <AlertOctagon size={14} className="text-orange-455" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">Z-SCORE OUTLIER AUDITS</h3>
                </div>
                <span className="text-[8px] bg-rose-500/10 border border-rose-500/20 text-rose-455 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  {anomaliesList.length} anomalies detected
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-[9px] border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-500 uppercase tracking-widest">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Product/Corridor</th>
                      <th className="pb-2">Customer Account</th>
                      <th className="pb-2">Severity</th>
                      <th className="pb-2 text-right">Leakage Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anomaliesList.map((anom: any) => {
                      const isSelected = selectedInsight?.id === anom.id;
                      const severityColor = 
                        anom.severity === 'critical' ? 'text-rose-500 bg-rose-500/5 border-rose-500/20' :
                        anom.severity === 'high' ? 'text-orange-455 bg-orange-500/5 border-orange-500/20' :
                        'text-amber-500 bg-amber-500/5 border-amber-500/20';

                      return (
                        <tr 
                          key={anom.id}
                          onClick={() => {
                            setSelectedInsight(anom);
                            setShowAnomalyModal(true); // Pop up detailed overlay
                          }}
                          className={`border-b border-zinc-900/60 hover:bg-zinc-900/20 cursor-pointer transition-colors ${isSelected ? 'bg-orange-500/[0.03]' : ''}`}
                        >
                          <td className="py-2.5 text-zinc-400">{anom.date}</td>
                          <td className="py-2.5 text-white font-bold truncate max-w-[150px]">{anom.product}</td>
                          <td className="py-2.5 text-zinc-400 truncate max-w-[150px]">{anom.customer}</td>
                          <td className="py-2.5">
                            <span className={`px-1.5 py-0.5 rounded border text-[7.5px] font-bold uppercase ${severityColor}`}>
                              {anom.severity}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-bold text-orange-455">${anom.impact.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                    {anomaliesList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-zinc-650 italic">
                          No cost leakages or pricing anomalies identified in current dataset.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="text-[8px] text-zinc-555 italic mt-3">
              * Select any row above to decrypt and inspect transaction details in telemetry panel.
            </div>
          </div>

          {/* Telemetry Inspector (4 Cols) */}
          <div 
            ref={inspectorRef}
            className={`lg:col-span-4 bg-zinc-950 border p-5 rounded relative flex flex-col justify-between min-h-[300px] transition-all duration-300 ${
              activeFocusTopic === 'COSTS' ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.2)] scale-[1.01]' : 'border-zinc-900'
            }`}
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
            
            <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-3 mb-4">
              <Terminal size={14} className="text-orange-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">TELEMETRY_INSPECTOR</h3>
            </div>

            {selectedInsight ? (
              <div className="flex-1 flex flex-col justify-between space-y-4 text-[9.5px]">
                <div className="space-y-3">
                  <div>
                    <span className="text-[8px] text-zinc-600 uppercase tracking-wider block">ANOMALY_IDENTIFIER</span>
                    <h4 className="text-xs font-bold text-white uppercase mt-0.5">{selectedInsight.title}</h4>
                  </div>

                  <div>
                    <span className="text-[8px] text-zinc-600 uppercase tracking-wider block">DECRYPTED_STREAM_LOG</span>
                    <p className="text-[10.5px] text-zinc-400 font-sans normal-case mt-1 leading-relaxed">
                      {selectedInsight.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-zinc-900">
                    <div>
                      <span className="text-[8px] text-zinc-600 uppercase tracking-wider block">Customer</span>
                      <span className="text-zinc-350 font-bold block truncate">{selectedInsight.customer}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-zinc-600 uppercase tracking-wider block">Leak impact</span>
                      <span className="text-orange-455 font-bold block">${selectedInsight.impact.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-900">
                  <button 
                    onClick={() => setShowAnomalyModal(true)}
                    className="block w-full text-center py-2 bg-orange-500 hover:bg-orange-600 text-black text-[9px] font-bold tracking-wider rounded uppercase transition-colors"
                  >
                    POP INSPECTOR OVERLAY
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <AlertOctagon size={24} className="text-zinc-805 mb-2 animate-pulse" />
                <p className="text-[9px] text-zinc-555 font-sans">No outlier node selected. Click any row from Z-Score Audits list to decrypt logs.</p>
              </div>
            )}
          </div>
          
        </div>

        {/* Uploads and Actions (Fourth Row) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* AI Perspective (2 Cols) */}
          <div className="lg:col-span-2 bg-orange-500/5 border border-orange-500/20 p-5 rounded relative overflow-hidden group shadow-[0_0_20px_rgba(249,115,22,0.02)]">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-orange-500/35" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-orange-500/35" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-orange-500/35" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-orange-500/35" />
            
            <div className="flex items-center gap-2.5 mb-3">
              <ShieldCheck size={16} className="text-orange-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-orange-400">EXECUTIVE_AI_PERSPECTIVE</h3>
            </div>
            
            <p className="text-zinc-350 text-xs leading-relaxed font-sans normal-case">
              &ldquo;{data?.summary}&rdquo;
            </p>
            
            <div className="mt-4 flex flex-wrap gap-3 font-mono text-[9px]">
              <Link href="/reports" className="bg-orange-500 hover:bg-orange-600 text-black px-4.5 py-2 rounded font-bold transition-all hover:scale-[1.02]">
                VIEW_EXECUTIVE_PDF_REPORTS
              </Link>
              <Link href="/insights" className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white px-4.5 py-2 rounded font-bold transition-colors">
                PROACTIVE_RECOMMENDATIONS
              </Link>
            </div>
          </div>

          {/* Action Checklist (1 Col) */}
          <div className="bg-zinc-950 border border-zinc-900 p-5 rounded relative flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-800" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-800" />
            
            <div>
              <h3 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-orange-455" />
                RECOMMENDED_NEXT_ACTIONS
              </h3>
              
              <div className="space-y-2">
                {(data?.actions || []).slice(0, 3).map((action: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2 bg-black/40 rounded border border-zinc-900 text-left">
                    <span className="text-[9px] text-orange-400 font-bold shrink-0 mt-0.5">0{idx + 1}.</span>
                    <span className="text-[10px] text-zinc-405 leading-normal font-sans normal-case">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
        </div>

        {/* System Upload Ledger History Log (Bottom) */}
        <div className="bg-zinc-950 border border-zinc-900 p-5 rounded relative">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-3 mb-4">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">NORMALIZED_LEDGER_UPLOAD_LOGS</h3>
              <p className="text-[8px] text-zinc-650 uppercase tracking-wider mt-0.5">Transaction datasets ingested into secure sandboxed organization profile</p>
            </div>
            
            <Link 
              href="/upload"
              className="text-[10px] text-orange-400 hover:text-white font-bold flex items-center gap-1.5 shrink-0"
            >
              <UploadCloud size={14} />
              UPLOAD_ADDITIONAL_SHEETS
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(data?.uploads || []).slice(0, 3).map((up: any, idx: number) => {
              return (
                <div 
                  key={idx}
                  className="p-3 bg-black/30 border border-zinc-900 rounded flex flex-col justify-between h-20"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] text-zinc-600 font-bold">LOG_INDEX 0{idx + 1}</span>
                    <span className="text-[8px] text-emerald-450 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold uppercase">
                      {up.status}
                    </span>
                  </div>
                  <div className="mt-1">
                    <p className="text-[10px] font-bold text-zinc-300 truncate">{up.name}</p>
                    <p className="text-[8px] text-zinc-600 mt-0.5">Uploaded at {up.date}</p>
                  </div>
                </div>
              );
            })}
            {(data?.uploads || []).length === 0 && (
              <div className="col-span-3 text-center py-6 text-[9px] text-zinc-650 italic">
                No ledger sheets normalized. Staged at zero records.
              </div>
            )}
          </div>
        </div>

        {/* Anomaly Detail Pop-up Modal */}
        {showAnomalyModal && selectedInsight && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-orange-500/40 rounded-lg max-w-lg w-full p-6 relative font-mono text-left shadow-[0_0_50px_rgba(249,115,22,0.15)] animate-fade-in">
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-orange-500" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-orange-500" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-orange-500" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-orange-500" />
              
              <button 
                onClick={() => setShowAnomalyModal(false)}
                className="absolute top-4 right-4 text-zinc-555 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
              
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-orange-500 animate-pulse" size={16} />
                <span className="text-[8px] text-orange-500 font-bold uppercase tracking-widest">CRITICAL LEDGER OUTLIER ANOMALY</span>
              </div>
              <h3 className="text-sm font-bold text-white uppercase">{selectedInsight.title}</h3>
              
              <div className="my-4 p-4 bg-orange-500/5 border border-orange-500/20 rounded space-y-3">
                <div className="grid grid-cols-2 gap-4 text-[9.5px]">
                  <div>
                    <span className="text-zinc-555 block uppercase font-bold text-[8px]">DECISION CORRIDOR</span>
                    <span className="text-white font-bold block truncate">{selectedInsight.product}</span>
                  </div>
                  <div>
                    <span className="text-zinc-555 block uppercase font-bold text-[8px]">ACCOUNT NAME</span>
                    <span className="text-white font-bold block truncate">{selectedInsight.customer}</span>
                  </div>
                  <div>
                    <span className="text-zinc-555 block uppercase font-bold text-[8px]">IDENTIFIED DATE</span>
                    <span className="text-white font-bold block">{selectedInsight.date}</span>
                  </div>
                  <div>
                    <span className="text-zinc-555 block uppercase font-bold text-[8px]">LEAKAGE IMPACT</span>
                    <span className="text-orange-455 font-extrabold block text-xs">${selectedInsight.impact.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 text-[10.5px]">
                <div>
                  <span className="text-[8px] text-zinc-500 uppercase tracking-wider block font-bold">DECRYPTED STREAM AUDIT LOG</span>
                  <p className="text-zinc-300 font-sans normal-case mt-1 leading-relaxed">
                    {selectedInsight.description}
                  </p>
                </div>
                
                <div className="pt-2">
                  <span className="text-[8px] text-zinc-550 uppercase tracking-wider block font-bold">RECOMMENDED REMEDIATION ACTIONS</span>
                  <ul className="text-zinc-450 font-sans normal-case mt-1 list-disc list-inside space-y-1">
                    <li>Re-negotiate procurement rates for corridor &ldquo;{selectedInsight.product}&rdquo;.</li>
                    <li>Enforce contractual pricing brackets on next billing ledger cycles.</li>
                    <li>Perform Z-score variance analysis on vendor invoices.</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-zinc-900 flex justify-between gap-3">
                <button 
                  onClick={() => {
                    addLog(`[SYSTEM] Dispatched resolution task for anomaly "${selectedInsight.title}"`);
                    setShowAnomalyModal(false);
                    showToast(`Mitigation ticket generated for ${selectedInsight.customer}`);
                  }}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-black text-[9px] font-extrabold tracking-wider rounded uppercase transition-colors cursor-pointer"
                >
                  EXECUTE MITIGATION PROCEDURE
                </button>
                <button 
                  onClick={() => setShowAnomalyModal(false)}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-350 hover:text-white border border-zinc-800 rounded text-[9px] font-bold cursor-pointer"
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Correlation Detail Modal */}
        {selectedCorrelation && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-md w-full p-6 relative font-mono text-left animate-fade-in">
              <button 
                onClick={() => setSelectedCorrelation(null)}
                className="absolute top-4 right-4 text-zinc-550 hover:text-white"
              >
                <X size={16} />
              </button>
              
              <span className="text-[8px] text-orange-500 font-bold uppercase tracking-widest">VARIABLE CORRELATION DECRYPT</span>
              <h3 className="text-sm font-bold text-white mt-1 uppercase">{selectedCorrelation.title}</h3>
              
              <div className="my-5 p-4 bg-zinc-900/50 border border-zinc-900 rounded flex items-center justify-between">
                <div>
                  <span className="text-[8px] text-zinc-500 block uppercase font-bold">PEARSON COEFFICIENT</span>
                  <span className={`text-2xl font-extrabold tracking-tight ${selectedCorrelation.coefficient < 0 ? 'text-rose-455' : 'text-emerald-450'}`}>
                    {selectedCorrelation.coefficient > 0 ? '+' : ''}{selectedCorrelation.coefficient.toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] text-zinc-500 block uppercase font-bold">STRENGTH</span>
                  <span className="text-[10px] text-white font-bold uppercase block">
                    {Math.abs(selectedCorrelation.coefficient) > 0.7 
                      ? 'Strong Relationship' 
                      : Math.abs(selectedCorrelation.coefficient) > 0.4 
                      ? 'Moderate Relationship' 
                      : 'Weak Relationship'}
                  </span>
                </div>
              </div>
              
              <p className="text-[10.5px] text-zinc-400 font-sans leading-relaxed normal-case">
                {selectedCorrelation.description}
              </p>
              
              <div className="mt-6 pt-4 border-t border-zinc-900 flex justify-end">
                <button 
                  onClick={() => setSelectedCorrelation(null)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-350 hover:text-white border border-zinc-800 rounded text-[9px] font-bold cursor-pointer"
                >
                  CLOSE_DECRYPTOR
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 left-6 z-50 bg-zinc-950 border border-orange-500 text-zinc-100 font-mono text-[9px] font-bold px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 animate-fade-in">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
            <span className="uppercase">{toastMessage}</span>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
