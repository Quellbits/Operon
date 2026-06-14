"use client";

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { API_BASE } from '@/config';
import { 
  ArrowUpRight, ArrowDownRight, Activity, TrendingUp, DollarSign, 
  ShieldCheck, AlertTriangle, Loader2, RefreshCw, Layers, 
  Terminal, ShieldAlert, Cpu, CheckCircle2, AlertOctagon, Info, HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// Polymorphic configs for 6 different industry domains
const DOMAIN_CONFIGS: Record<string, {
  consoleTitle: string;
  subTitle: string;
  metricLabels: {
    overall: string;
    revenue: string;
    costs: string;
    customers: string;
    products: string;
  };
  sliders: {
    margin: { label: string; minLabel: string; maxLabel: string; min: number; max: number; def: number };
    cost: { label: string; minLabel: string; maxLabel: string; min: number; max: number; def: number };
    revenue: { label: string; minLabel: string; maxLabel: string; min: number; max: number; def: number };
    tolerance: { label: string; minLabel: string; maxLabel: string; min: number; max: number; def: number };
    custom: { label: string; minLabel: string; maxLabel: string; min: number; max: number; def: number };
  };
  adaptiveWidgets: {
    testerTitle: string;
    testerSliderLabel: string;
    testerAlertText: string;
    testerSliderMax: number;
    testerSliderStep: number;
    
    optimizerTitle: string;
    optimizerSliderLabel: string;
    optimizerSliderMax: number;
    optimizerSliderStep: number;
    optimizerLeftText: string;
    optimizerRightText: string;
  };
  pAndLChartTitle: string;
  pAndLChartLabel: string;
  pAndLRecoveryLabel: string;
}> = {
  GENERAL: {
    consoleTitle: "OPERON_INTEGRATED_TACTICAL_CONSOLE",
    subTitle: "Real-time simulation engine & AI interactive controller.",
    metricLabels: {
      overall: "SYS_HEALTH",
      revenue: "REVENUE_IDX",
      costs: "COSTS_IDX",
      customers: "CUSTOMER_IDX",
      products: "PRODUCTS_IDX"
    },
    sliders: {
      margin: { label: "TARGET_GROSS_MARGIN", minLabel: "MIN: 10%", maxLabel: "MAX: 80%", min: 10, max: 80, def: 40 },
      cost: { label: "COST_COMPRESSION_FACTOR", minLabel: "BASE: 0%", maxLabel: "MAX REDUCTION: 40%", min: 0, max: 40, def: 0 },
      revenue: { label: "REVENUE_EXPANSION_FACTOR", minLabel: "DEEP CHURN: -20%", maxLabel: "GROWTH: +50%", min: -20, max: 50, def: 0 },
      tolerance: { label: "LEAKAGE_TOLERANCE_THRESHOLD", minLabel: "STRICT: $5K", maxLabel: "TOLERANT: $40K", min: 5000, max: 40000, def: 25000 },
      custom: { label: "SUCCESS_BUDGET_INVESTMENT", minLabel: "$0 BUDGET", maxLabel: "MAX CS INVEST: $10K", min: 0, max: 10000, def: 0 }
    },
    adaptiveWidgets: {
      testerTitle: "CONCENTRATION_STRESS_TESTER",
      testerSliderLabel: "TOP_ACCOUNT_VOLUME_LOSS",
      testerAlertText: "Top account accounts for 76.8% of total revenue.",
      testerSliderMax: 100,
      testerSliderStep: 10,
      optimizerTitle: "FREIGHT_OPTIMIZATION_CONSOLE",
      optimizerSliderLabel: "SHIPPING_CONSOLIDATION_TARGET",
      optimizerSliderMax: 50,
      optimizerSliderStep: 5,
      optimizerLeftText: "COGS Saved",
      optimizerRightText: "Delivery SLA Delay"
    },
    pAndLChartTitle: "P&L_PROJECTION_GRAPH",
    pAndLChartLabel: "SIM_PROFIT_POOL",
    pAndLRecoveryLabel: "RECOVERY_POOL"
  },
  RESTAURANT: {
    consoleTitle: "RESTAURANT_PERFORMANCE_SIMULATION_CONSOLE",
    subTitle: "Live culinary operations analyzer & menu profitability modeler.",
    metricLabels: {
      overall: "REST_HEALTH",
      revenue: "TICKET_SALES_IDX",
      costs: "FOOD_COST_IDX",
      customers: "GUEST_SATISFACTION_IDX",
      products: "MENU_DIVERSITY_IDX"
    },
    sliders: {
      margin: { label: "MENU_PRICE_ADJUSTMENT", minLabel: "MARKDOWN: -10%", maxLabel: "MARKUP: +40%", min: -10, max: 40, def: 0 },
      cost: { label: "LABOR_HOURS_COMPRESSION", minLabel: "BASE: 0%", maxLabel: "MAX REDUCTION: 35%", min: 0, max: 35, def: 0 },
      revenue: { label: "TABLE_TURN_RATE_FACTOR", minLabel: "SLOW: -20%", maxLabel: "FAST TURN: +50%", min: -20, max: 50, def: 0 },
      tolerance: { label: "SPOILAGE_WASTE_TOLERANCE", minLabel: "STRICT: $500", maxLabel: "TOLERANT: $5K", min: 500, max: 5000, def: 2500 },
      custom: { label: "INGREDIENT_QUALITY_INVESTMENT", minLabel: "$0 BUDGET", maxLabel: "MAX QUALITY INVEST: $10K", min: 0, max: 10000, def: 0 }
    },
    adaptiveWidgets: {
      testerTitle: "MENU_CONCENTRATION_STRESS_TESTER",
      testerSliderLabel: "TOP_DISH_SUPPLY_LOSS",
      testerAlertText: "The signature dish accounts for 45% of total table revenue.",
      testerSliderMax: 100,
      testerSliderStep: 10,
      optimizerTitle: "KITCHEN_WASTE_OPTIMIZER",
      optimizerSliderLabel: "PREP_BATCH_CONSOLIDATION",
      optimizerSliderMax: 50,
      optimizerSliderStep: 5,
      optimizerLeftText: "Waste Saved",
      optimizerRightText: "Freshness Rating"
    },
    pAndLChartTitle: "DAILY_MENU_PROFITABILITY_GRAPH",
    pAndLChartLabel: "SIM_CULINARY_PROFIT",
    pAndLRecoveryLabel: "WASTE_RECOVERY_POOL"
  },
  LOGISTICS: {
    consoleTitle: "FLEET_LOGISTICS_OPERATIONS_CONTROL",
    subTitle: "Real-time dispatch modeler & tonnage-cost optimization simulator.",
    metricLabels: {
      overall: "FLEET_HEALTH",
      revenue: "BILLING_RATE_IDX",
      costs: "FUEL_&_MAINT_IDX",
      customers: "ON-TIME_DELIVERY_IDX",
      products: "ROUTE_COVERAGE_IDX"
    },
    sliders: {
      margin: { label: "FUEL_SURCHARGE_MARKUP", minLabel: "BASE: 0%", maxLabel: "MARKUP: +50%", min: 0, max: 50, def: 0 },
      cost: { label: "FLEET_MAINTENANCE_OPTIMIZATION", minLabel: "MIN: 0%", maxLabel: "MAX EFFICIENCY: 30%", min: 0, max: 30, def: 0 },
      revenue: { label: "ROUTE_UTILIZATION_FACTOR", minLabel: "EMPTY: -10%", maxLabel: "MAX CAPACITY: +40%", min: -10, max: 40, def: 0 },
      tolerance: { label: "CARRIER_DRIFT_TOLERANCE", minLabel: "STRICT: $2K", maxLabel: "TOLERANT: $30K", min: 2000, max: 30000, def: 15000 },
      custom: { label: "DRIVER_RETENTION_INCENTIVES", minLabel: "$0 BUDGET", maxLabel: "MAX BONUS: $10K", min: 0, max: 10000, def: 0 }
    },
    adaptiveWidgets: {
      testerTitle: "ROUTE_DEPENDENCY_STRESS_TESTER",
      testerSliderLabel: "PRIMARY_CORRIDOR_SHUTDOWN_PCT",
      testerAlertText: "The primary corridor represents 65% of total haulage tonnage.",
      testerSliderMax: 100,
      testerSliderStep: 10,
      optimizerTitle: "ROUTE_CONSOLIDATION_UNIT",
      optimizerSliderLabel: "HUB-AND-SPOKE_CONSOLIDATION_PCT",
      optimizerSliderMax: 50,
      optimizerSliderStep: 5,
      optimizerLeftText: "Fuel Saved",
      optimizerRightText: "Delivery SLA Delay"
    },
    pAndLChartTitle: "TONNAGE_PROFITABILITY_PROJECTION",
    pAndLChartLabel: "FLEET_OPERATING_PROFIT",
    pAndLRecoveryLabel: "DRIFT_RECOVERED"
  },
  ECOMMERCE: {
    consoleTitle: "E-COMMERCE_CONVERSION_&_LOGISTICS_HUB",
    subTitle: "Average Order Value & traffic acquisition simulation console.",
    metricLabels: {
      overall: "E-COMM_INDEX",
      revenue: "ORDER_SALES_IDX",
      costs: "CAC_&_FULFILLMENT",
      customers: "RETENTION_RATING",
      products: "CATEGORY_DIVERSITY"
    },
    sliders: {
      margin: { label: "CATALOG_PRICE_MARKUP", minLabel: "BASE: 0%", maxLabel: "MARKUP: +40%", min: 0, max: 40, def: 0 },
      cost: { label: "WAREHOUSE_STAFF_OPTIMIZE", minLabel: "MIN: 0%", maxLabel: "MAX REDUCTION: 30%", min: 0, max: 30, def: 0 },
      revenue: { label: "TRAFFIC_ACQUISITION_FACTOR", minLabel: "LOW: -20%", maxLabel: "GROWTH: +50%", min: -20, max: 50, def: 0 },
      tolerance: { label: "INVENTORY_SHRINKAGE_LIMIT", minLabel: "STRICT: $1K", maxLabel: "TOLERANT: $20K", min: 1000, max: 20000, def: 10000 },
      custom: { label: "AD_CAMPAIGN_SPEND", minLabel: "$0 AD SPEND", maxLabel: "MAX AD SPEND: $10K", min: 0, max: 10000, def: 0 }
    },
    adaptiveWidgets: {
      testerTitle: "CPC_AD_INFLATION_STRESS_TEST",
      testerSliderLabel: "CPC_AD_COSTS_INFLATION",
      testerAlertText: "Paid advertising traffic represents 68.2% of customer acquisition channels.",
      testerSliderMax: 100,
      testerSliderStep: 10,
      optimizerTitle: "FULFILLMENT_CONSOLIDATION",
      optimizerSliderLabel: "FREE_SHIPPING_THRESHOLD_MARKUP",
      optimizerSliderMax: 50,
      optimizerSliderStep: 5,
      optimizerLeftText: "Costs Saved",
      optimizerRightText: "Average SLA Delay"
    },
    pAndLChartTitle: "E-COMM_NET_PROFITABILITY",
    pAndLChartLabel: "SIM_NET_PROFIT",
    pAndLRecoveryLabel: "SHRINKAGE_RECOVERED"
  },
  SAAS: {
    consoleTitle: "SAAS_RECURRING_REVENUE_MONITOR",
    subTitle: "MRR expansion, Net Retention, and churn prevention simulator.",
    metricLabels: {
      overall: "SAAS_HEALTH_IDX",
      revenue: "RECURRING_MRR_IDX",
      costs: "CLOUD_INFRA_OVERHEAD",
      customers: "NET_RETENTION_NRR",
      products: "R&D_INNOVATION_INDEX"
    },
    sliders: {
      margin: { label: "SUBSCRIPTION_PRICE_ADJUST", minLabel: "MARKDOWN: -15%", maxLabel: "MARKUP: +50%", min: -15, max: 50, def: 0 },
      cost: { label: "INFRASTRUCTURE_SERVER_CUTS", minLabel: "MIN: 0%", maxLabel: "MAX REDUCTION: 40%", min: 0, max: 40, def: 0 },
      revenue: { label: "TRIAL_CONVERSION_BOOST", minLabel: "LOW: -10%", maxLabel: "HIGH YIELD: +40%", min: -10, max: 40, def: 0 },
      tolerance: { label: "PLATFORM_OVERAGE_LIMIT", minLabel: "STRICT: $5K", maxLabel: "TOLERANT: $50K", min: 5000, max: 50000, def: 25000 },
      custom: { label: "PRODUCT_R&D_REINVESTMENT", minLabel: "$0 BUDGET", maxLabel: "MAX R&D REINVEST: $10K", min: 0, max: 10000, def: 0 }
    },
    adaptiveWidgets: {
      testerTitle: "CLOUD_OUTAGE_CHURN_STRESS_TEST",
      testerSliderLabel: "DOWNTIME_OUTAGE_HOURS",
      testerAlertText: "Infrastructure runs on single-region configurations.",
      testerSliderMax: 24,
      testerSliderStep: 1,
      optimizerTitle: "SALES_COMMISSION_TIER",
      optimizerSliderLabel: "INCENTIVE_COMMISSION_PCT",
      optimizerSliderMax: 50,
      optimizerSliderStep: 5,
      optimizerLeftText: "Conversion Gains",
      optimizerRightText: "Commission Cost"
    },
    pAndLChartTitle: "RECURRING_MRR_PROJECTIONS",
    pAndLChartLabel: "SIM_OPERATING_MRR",
    pAndLRecoveryLabel: "OVERAGE_RECOVERED"
  },
  HEALTHCARE: {
    consoleTitle: "HEALTHCARE_CLINIC_TELEMETRY_DESK",
    subTitle: "Patient billing yield and scheduling capacity optimizer.",
    metricLabels: {
      overall: "CLINIC_HEALTH_IDX",
      revenue: "PATIENT_YIELD_IDX",
      costs: "STAFFING_&_EQUIP_OVERHEAD",
      customers: "PATIENT_SATISFACTION_IDX",
      products: "CLINICAL_UTILIZATION"
    },
    sliders: {
      margin: { label: "CONSULTATION_FEE_ADJUST", minLabel: "REDUCE: -10%", maxLabel: "HIKE: +40%", min: -10, max: 40, def: 0 },
      cost: { label: "NURSE_STAFFING_COMPRESSION", minLabel: "BASE: 0%", maxLabel: "MAX REDUCTION: 30%", min: 0, max: 30, def: 0 },
      revenue: { label: "APPOINTMENT_UTILIZATION_BOOST", minLabel: "LOW: -15%", maxLabel: "MAX SCHEDULE: +50%", min: -15, max: 50, def: 0 },
      tolerance: { label: "MEDICAL_SUPPLY_DRIFT_LIMIT", minLabel: "STRICT: $2K", maxLabel: "TOLERANT: $25K", min: 2000, max: 25000, def: 12000 },
      custom: { label: "TELEHEALTH_SERVICE_BUDGET", minLabel: "$0 BUDGET", maxLabel: "MAX TELEHEALTH INVEST: $10K", min: 0, max: 10000, def: 0 }
    },
    adaptiveWidgets: {
      testerTitle: "STAFF_CHURN_CAPACITY_STRESS_TESTER",
      testerSliderLabel: "STAFF_RESIGNATION_PCT",
      testerAlertText: "Patient wait times currently exceed 45 minutes on busy shifts.",
      testerSliderMax: 80,
      testerSliderStep: 10,
      optimizerTitle: "PATIENT_CARE_CONSOLIDATION",
      optimizerSliderLabel: "PREVENTIVE_VISIT_CONSOLIDATION_PCT",
      optimizerSliderMax: 50,
      optimizerSliderStep: 5,
      optimizerLeftText: "Supplies Saved",
      optimizerRightText: "Patient Visit Time"
    },
    pAndLChartTitle: "PATIENT_BILLING_YIELD_PROJECTIONS",
    pAndLChartLabel: "SIM_CLINIC_PROFIT",
    pAndLRecoveryLabel: "SUPPLY_SAVINGS"
  }
};

export default function DashboardOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [column2Tab, setColumn2Tab] = useState<'radar' | 'anomalies'>('radar');
  const [chartView, setChartView] = useState<'profit' | 'rev_vs_cost'>('profit');

  // Simulation Control States (Polymorphic inputs)
  const [marginTarget, setMarginTarget] = useState(40);
  const [costCompression, setCostCompression] = useState(0);
  const [revenueExpansion, setRevenueExpansion] = useState(0);
  const [leakageTolerance, setLeakageTolerance] = useState(25000);
  const [productFilter, setProductFilter] = useState("ALL");
  const [mitigatedLeakageTitles, setMitigatedLeakageTitles] = useState<Set<string>>(new Set());
  const [resolveAll, setResolveAll] = useState(false);

  // New Simulation Controls for Multi-Factor Modeling
  const [customerSuccessInvestment, setCustomerSuccessInvestment] = useState(0);
  const [topCustomerLossPct, setTopCustomerLossPct] = useState(0);
  const [shippingConsolidation, setShippingConsolidation] = useState(0);
  const [focusTopic, setFocusTopic] = useState("NONE");

  // UI Interactive States
  const [selectedInsight, setSelectedInsight] = useState<any>(null);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SYSTEM] OPERON MULTI-FACTOR SIMULATOR BOOTED.",
    "[SYSTEM] Polymorphic schema classifier enabled: GENERAL, RESTAURANT, LOGISTICS, ECOMMERCE, SAAS, HEALTHCARE."
  ]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanPulse, setScanPulse] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Add items to console log
  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTerminalLogs(prev => [...prev.slice(-25), `[${timestamp}] ${msg}`]);
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

  // Determine active industry domain dynamically based on data content
  const detectDomain = () => {
    if (!data) return "GENERAL";
    
    // Check filename of uploads
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
    
    // Check insights text
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
    
    // Check product names
    const productsText = (metricsData?.product_distribution || []).map((p: any) => p.name).join(" ").toLowerCase();
    if (productsText.includes("pizza") || productsText.includes("pasta") || productsText.includes("burger") || productsText.includes("steak") || productsText.includes("dish")) {
      return "RESTAURANT";
    }
    if (productsText.includes("route") || productsText.includes("carrier") || productsText.includes("freight") || productsText.includes("delivery")) {
      return "LOGISTICS";
    }
    if (productsText.includes("t-shirt") || productsText.includes("bag") || productsText.includes("shoe") || productsText.includes("clothing")) {
      return "ECOMMERCE";
    }
    if (productsText.includes("api") || productsText.includes("license") || productsText.includes("plan") || productsText.includes("database")) {
      return "SAAS";
    }
    if (productsText.includes("patient") || productsText.includes("consult") || productsText.includes("clinic") || productsText.includes("therapy")) {
      return "HEALTHCARE";
    }

    return "GENERAL";
  };

  const domain = detectDomain();
  const activeConfig = DOMAIN_CONFIGS[domain] || DOMAIN_CONFIGS.GENERAL;

  // Initialize polymorphic defaults when domain changes
  useEffect(() => {
    if (data) {
      setMarginTarget(activeConfig.sliders.margin.def);
      setCostCompression(activeConfig.sliders.cost.def);
      setLeakageTolerance(activeConfig.sliders.tolerance.def);
      addLog(`[SYSTEM] Syncing console interface to industry profile: ${domain}`);
    }
  }, [domain]);

  // Listen to AI Agent commands in real-time
  useEffect(() => {
    const handleAgentCommand = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { command, value } = customEvent.detail;
      
      setIsScanning(true);
      setScanPulse(true);
      setTimeout(() => setScanPulse(false), 800);
      setTimeout(() => setIsScanning(false), 1200);

      addLog(`[AGENT] INTERCEPTED COMMAND: ${command} = "${value}"`);

      switch(command) {
        case 'SET_MARGIN': {
          const val = Math.min(activeConfig.sliders.margin.max, Math.max(activeConfig.sliders.margin.min, parseInt(value)));
          setMarginTarget(val);
          addLog(`[SYSTEM] ${activeConfig.sliders.margin.label} set to ${val}%`);
          break;
        }
        case 'SET_COST_COMPRESSION': {
          const val = Math.min(activeConfig.sliders.cost.max, Math.max(activeConfig.sliders.cost.min, parseInt(value)));
          setCostCompression(val);
          addLog(`[SYSTEM] ${activeConfig.sliders.cost.label} set to ${val}%`);
          break;
        }
        case 'SET_REVENUE_EXPANSION': {
          const val = Math.min(activeConfig.sliders.revenue.max, Math.max(activeConfig.sliders.revenue.min, parseInt(value)));
          setRevenueExpansion(val);
          addLog(`[SYSTEM] ${activeConfig.sliders.revenue.label} set to ${val}%`);
          break;
        }
        case 'SET_LEAKAGE_TOLERANCE': {
          const val = Math.min(activeConfig.sliders.tolerance.max, Math.max(activeConfig.sliders.tolerance.min, parseInt(value)));
          setLeakageTolerance(val);
          addLog(`[SYSTEM] ${activeConfig.sliders.tolerance.label} set to $${val.toLocaleString()}`);
          break;
        }
        case 'SET_SUCCESS_INVESTMENT': {
          const val = Math.min(activeConfig.sliders.custom.max, Math.max(activeConfig.sliders.custom.min, parseInt(value)));
          setCustomerSuccessInvestment(val);
          addLog(`[SYSTEM] ${activeConfig.sliders.custom.label} set to $${val.toLocaleString()}`);
          break;
        }
        case 'SET_TOP_CUSTOMER_LOSS': {
          const val = Math.min(activeConfig.adaptiveWidgets.testerSliderMax, Math.max(0, parseInt(value)));
          setTopCustomerLossPct(val);
          addLog(`[SYSTEM] ${activeConfig.adaptiveWidgets.testerSliderLabel} stress set to ${val}%`);
          break;
        }
        case 'SET_SHIPPING_CONSOLIDATION': {
          const val = Math.min(activeConfig.adaptiveWidgets.optimizerSliderMax, Math.max(0, parseInt(value)));
          setShippingConsolidation(val);
          addLog(`[SYSTEM] ${activeConfig.adaptiveWidgets.optimizerSliderLabel} set to ${val}%`);
          break;
        }
        case 'FILTER_PRODUCT': {
          const formatted = value.replace(/"/g, '').trim();
          setProductFilter(formatted);
          addLog(`[SYSTEM] product filter active: "${formatted}"`);
          break;
        }
        case 'SET_FOCUS_TOPIC': {
          const formatted = value.replace(/"/g, '').trim().toUpperCase();
          setFocusTopic(formatted);
          addLog(`[SYSTEM] SPOTLIGHT focus set to: "${formatted}"`);
          break;
        }
        case 'RESOLVE_ALL_LEAKAGES': {
          const active = value === 'true';
          setResolveAll(active);
          if (active && data?.insights) {
            const allTitles = new Set<string>(data.insights.map((ins: any) => String(ins.title)));
            setMitigatedLeakageTitles(allTitles);
            addLog(`[SYSTEM] MITIGATION OVERRIDE: 100% containment enabled.`);
          } else {
            setMitigatedLeakageTitles(new Set());
            addLog(`[SYSTEM] MITIGATION OVERRIDE: 100% containment disabled.`);
          }
          break;
        }
        case 'HIGHLIGHT_ANOMALY': {
          const formatted = value.replace(/"/g, '').trim();
          addLog(`[SYSTEM] Syncing and focusing on Anomaly: "${formatted}"`);
          const found = (metricsData?.anomalies || []).find((a: any) => 
            a.title.toLowerCase().includes(formatted.toLowerCase()) ||
            formatted.toLowerCase().includes(a.title.toLowerCase())
          );
          if (found) {
            setSelectedInsight(found);
            setFocusTopic("ANOMALIES");
            setColumn2Tab("anomalies");
          } else {
            const foundInsight = (data?.insights || []).find((ins: any) => 
              ins.title.toLowerCase().includes(formatted.toLowerCase())
            );
            if (foundInsight) {
              const mappedInsight = {
                ...foundInsight,
                id: `leakage-focus`,
                impactVal: getLeakageImpactVal(foundInsight),
                x: 50,
                y: 50
              };
              setSelectedInsight(mappedInsight);
              setFocusTopic("ANOMALIES");
            }
          }
          break;
        }
        case 'RESET_SIMULATION': {
          setMarginTarget(activeConfig.sliders.margin.def);
          setCostCompression(activeConfig.sliders.cost.def);
          setRevenueExpansion(activeConfig.sliders.revenue.def);
          setLeakageTolerance(activeConfig.sliders.tolerance.def);
          setProductFilter("ALL");
          setMitigatedLeakageTitles(new Set());
          setResolveAll(false);
          setCustomerSuccessInvestment(0);
          setTopCustomerLossPct(0);
          setShippingConsolidation(0);
          setFocusTopic("NONE");
          addLog(`[SYSTEM] RESET: Restored metrics to baseline settings.`);
          break;
        }
        default:
          addLog(`[WARNING] Unhandled AI command: ${command}`);
      }
    };

    window.addEventListener('operon-agent-command', handleAgentCommand);
    return () => window.removeEventListener('operon-agent-command', handleAgentCommand);
  }, [data, activeConfig]);

  // Helper: map insights to estimated financial values
  const getLeakageImpactVal = (insight: any) => {
    const text = (insight.impact + " " + insight.description + " " + insight.title).toLowerCase();
    const match = text.match(/\$[\d,]+/);
    if (match) {
      return parseInt(match[0].replace(/[$,]/g, ''));
    }
    if (text.includes("supplier") || text.includes("vendor")) return 14200;
    if (text.includes("freight") || text.includes("shipping")) return 8400;
    if (text.includes("churn") || text.includes("customer")) return 28000;
    if (text.includes("inventory") || text.includes("stock")) return 6500;
    return 5000;
  };

  const insights = data?.insights || [];

  const concentrationAlert = insights.some((ins: any) => 
    /concentration|dependency|single customer|risk/i.test(ins.title + " " + ins.description)
  ) || true;

  const freightAlert = insights.some((ins: any) => 
    /freight|shipping|logistics|delivery|carrier/i.test(ins.title + " " + ins.description)
  ) || true;

  const churnAlert = insights.some((ins: any) => 
    /churn|retention|attrition|loyalty/i.test(ins.title + " " + ins.description)
  ) || true;

  // Generate 2D positions for leakage radar nodes
  const insightsWithImpact = insights.map((ins: any, idx: number) => {
    const impactVal = getLeakageImpactVal(ins);
    const angles = [35, 120, 210, 300, 75, 165, 255, 345];
    const angle = angles[idx % angles.length];
    const radius = 30 + (idx * 14) % 45;
    const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
    const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
    
    return {
      ...ins,
      id: `leakage-${idx}`,
      impactVal,
      x,
      y
    };
  });

  // Calculate sums of active leakages
  let totalLeakageAmount = 0;
  let mitigatedLeakageAmount = 0;
  let activeLeakagesCount = 0;

  insightsWithImpact.forEach((ins: any) => {
    const isMitigated = mitigatedLeakageTitles.has(ins.title) || resolveAll;
    totalLeakageAmount += ins.impactVal;
    if (isMitigated) {
      mitigatedLeakageAmount += ins.impactVal;
    } else {
      activeLeakagesCount++;
    }
  });

  // Cross-Factor Math Simulation Model (Realistic Multi-Factor trade-offs)
  // 1. Price Elasticity / Fee Markups vs Volume & Churn
  const rawPriceElasticityStrain = marginTarget * 1.5;
  
  // Offsets (Internal savings compression + customer retention investments)
  const cogsCompressionOffset = costCompression * 0.8;
  const csInvestmentOffset = (customerSuccessInvestment / 1000) * 3.5;
  const netPricingStrain = Math.max(0, rawPriceElasticityStrain - cogsCompressionOffset - csInvestmentOffset);

  // 2. Shipping Consolidation / Scheduling Optimization trade-offs
  const shippingCostSavings = shippingConsolidation * 0.45;
  const shippingCustomerImpact = shippingConsolidation * 0.6; // hurts patient/guest wait time ratings

  // 3. Customer success / telemedicine / marketing cash expense
  const monthlyCSCost = customerSuccessInvestment / 6;

  // 4. Concentration / Corridors / Outage Loss Impact
  const concentrationRevLossMultiplier = 1 - (0.768 * topCustomerLossPct / 100);
  const concentrationCustomerScorePenalty = (topCustomerLossPct / 100) * 45;
  const concentrationOverallScorePenalty = (topCustomerLossPct / 100) * 25;

  // Calculate simulated health scores dynamically
  // - Costs Score: rises with cost compression + consolidations + leakages resolved, drops with margin hikes
  const simulatedCostsScore = Math.min(100, Math.max(0, Math.round(
    baseHealth.costs + 
    (costCompression * 0.7) +
    shippingCostSavings - 
    (rawPriceElasticityStrain * 0.4) +
    (totalLeakageAmount > 0 ? (mitigatedLeakageAmount / totalLeakageAmount) * 15 : 0)
  )));

  // - Revenue Score: scales with growth expansion, penalised by price elasticity, and customer loss
  const simulatedRevenueScore = Math.min(100, Math.max(0, Math.round(
    (baseHealth.revenue + (revenueExpansion * 0.6) - (netPricingStrain * 0.5)) * concentrationRevLossMultiplier
  )));

  // - Customer Score: drops from pricing strain + consolidation delays + concentration penalties, boosted by CS/quality investments
  const simulatedCustomersScore = Math.min(100, Math.max(0, Math.round(
    baseHealth.customers - 
    (netPricingStrain * 0.7) - 
    shippingCustomerImpact + 
    (customerSuccessInvestment / 1000) * 3 -
    concentrationCustomerScorePenalty
  )));

  // - Overall Score: cumulative index
  const simulatedOverallScore = Math.min(100, Math.max(0, Math.round(
    ((simulatedCostsScore + simulatedRevenueScore + simulatedCustomersScore + baseHealth.products) / 4) - 
    (concentrationOverallScorePenalty * 0.5)
  )));

  const scoreVariance = simulatedOverallScore - baseHealth.overall;

  // Monthly trend simulator data
  const baseMonthlyTrend = React.useMemo(() => {
    if (!metricsData) return [
      { name: "Jan", revenue: 42000, cost: 28000, isForecast: false },
      { name: "Feb", revenue: 45000, cost: 29000, isForecast: false },
      { name: "Mar", revenue: 58000, cost: 34000, isForecast: false },
      { name: "Apr", revenue: 62000, cost: 38000, isForecast: false },
      { name: "May", revenue: 54000, cost: 33000, isForecast: false },
      { name: "Jun", revenue: 48000, cost: 31000, isForecast: false },
      { name: "Jul (Proj)", revenue: 51000, cost: 32000, isForecast: true },
      { name: "Aug (Proj)", revenue: 53500, cost: 33200, isForecast: true },
      { name: "Sep (Proj)", revenue: 56000, cost: 34500, isForecast: true },
      { name: "Oct (Proj)", revenue: 58200, cost: 35600, isForecast: true },
      { name: "Nov (Proj)", revenue: 61000, cost: 37000, isForecast: true },
      { name: "Dec (Proj)", revenue: 63400, cost: 38100, isForecast: true },
    ];
    const historical = (metricsData.monthly_trend || []).map((t: any) => ({ ...t, isForecast: false }));
    const forecast = (metricsData.forecast_trend || []).map((t: any) => ({ ...t, isForecast: true }));
    return [...historical, ...forecast];
  }, [metricsData]);

  const simulatedMonthlyTrend = baseMonthlyTrend.map((item: any) => {
    const pricingRevLoss = 1 - (netPricingStrain * 0.005);
    let rev = item.revenue * (1 + revenueExpansion / 100) * pricingRevLoss * concentrationRevLossMultiplier;
    
    const mitigationPct = totalLeakageAmount > 0 ? (mitigatedLeakageAmount / totalLeakageAmount) * 0.08 : 0;
    const shippingReduction = shippingCostSavings / 100;
    
    let cost = item.cost * (1 - costCompression / 100) * (1 - mitigationPct - shippingReduction) + monthlyCSCost;
    
    if (productFilter !== "ALL") {
      rev = rev * 0.45;
      cost = cost * 0.45;
    }

    return {
      name: item.name,
      revenue: Math.round(rev),
      cost: Math.round(cost),
      profit: Math.round(rev - cost),
      isForecast: item.isForecast
    };
  });

  // Calculate total projected margins
  const totalSimulatedRevenue = simulatedMonthlyTrend.reduce((acc, c) => acc + c.revenue, 0);
  const totalSimulatedCost = simulatedMonthlyTrend.reduce((acc, c) => acc + c.cost, 0);
  const simulatedGrossMargin = totalSimulatedRevenue > 0 
    ? Math.round(((totalSimulatedRevenue - totalSimulatedCost) / totalSimulatedRevenue) * 100) 
    : 0;

  // Chart data preparing actual vs forecast
  const chartData = React.useMemo(() => {
    let lastHistorical: any = null;
    for (let i = simulatedMonthlyTrend.length - 1; i >= 0; i--) {
      if (!simulatedMonthlyTrend[i].isForecast) {
        lastHistorical = simulatedMonthlyTrend[i];
        break;
      }
    }
    
    return simulatedMonthlyTrend.map((item: any) => {
      const isForecast = item.isForecast;
      return {
        name: item.name,
        revHist: isForecast ? null : item.revenue,
        costHist: isForecast ? null : item.cost,
        profitHist: isForecast ? null : item.profit,
        
        revFore: isForecast ? item.revenue : (item === lastHistorical ? item.revenue : null),
        costFore: isForecast ? item.cost : (item === lastHistorical ? item.cost : null),
        profitFore: isForecast ? item.profit : (item === lastHistorical ? item.profit : null),
        
        revenue: item.revenue,
        cost: item.cost,
        profit: item.profit,
        isForecast
      };
    });
  }, [simulatedMonthlyTrend]);

  const getCorrColor = (val: number) => {
    if (val >= 0.7) return "text-emerald-400";
    if (val <= -0.5) return "text-rose-400";
    if (Math.abs(val) < 0.3) return "text-zinc-500";
    return "text-orange-400";
  };
  
  const formatCorr = (val: number) => {
    return val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
  };
  
  const getCorrLabel = (val: number) => {
    const abs = Math.abs(val);
    if (abs >= 0.7) return val >= 0 ? "Strong Pos" : "Strong Neg";
    if (abs >= 0.4) return val >= 0 ? "Moderate Pos" : "Moderate Neg";
    return "Weak/None";
  };

  // Reset all simulation sliders and configurations
  const handleReset = () => {
    setMarginTarget(activeConfig.sliders.margin.def);
    setCostCompression(activeConfig.sliders.cost.def);
    setRevenueExpansion(activeConfig.sliders.revenue.def);
    setLeakageTolerance(activeConfig.sliders.tolerance.def);
    setProductFilter("ALL");
    setMitigatedLeakageTitles(new Set());
    setResolveAll(false);
    setCustomerSuccessInvestment(0);
    setTopCustomerLossPct(0);
    setShippingConsolidation(0);
    setFocusTopic("NONE");
    addLog("[SYSTEM] Manual simulation values reset to baseline.");
  };

  // Save simulation state globally for ARIA context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).operonSimulationState = {
        domain,
        marginTarget,
        costCompression,
        revenueExpansion,
        leakageTolerance,
        customerSuccessInvestment,
        topCustomerLossPct,
        shippingConsolidation,
        productFilter,
        focusTopic,
        resolveAll,
        simulatedOverallScore,
        simulatedRevenueScore,
        simulatedCostsScore,
        simulatedCustomersScore,
        totalLeakageAmount,
        mitigatedLeakageAmount,
        activeLeakagesCount,
        totalSimulatedRevenue,
        totalSimulatedCost,
        simulatedGrossMargin
      };
    }
  }, [
    domain, marginTarget, costCompression, revenueExpansion, leakageTolerance,
    customerSuccessInvestment, topCustomerLossPct, shippingConsolidation,
    productFilter, focusTopic, resolveAll, simulatedOverallScore,
    simulatedRevenueScore, simulatedCostsScore, simulatedCustomersScore,
    totalLeakageAmount, mitigatedLeakageAmount, activeLeakagesCount,
    totalSimulatedRevenue, totalSimulatedCost, simulatedGrossMargin
  ]);

  // Handle single node mitigation click
  const toggleMitigate = (title: string, impactVal: number) => {
    const nextSet = new Set(mitigatedLeakageTitles);
    if (nextSet.has(title)) {
      nextSet.delete(title);
      addLog(`[SYSTEM] Mitigation override REMOVED: "${title}" (-$${impactVal.toLocaleString()})`);
    } else {
      nextSet.add(title);
      addLog(`[SYSTEM] Mitigation override APPLIED: "${title}" (+$${impactVal.toLocaleString()} recovery)`);
    }
    setMitigatedLeakageTitles(nextSet);
  };
  const strokeOffset = dialCircumference - (dialCircumference * simulatedOverallScore) / 100;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 font-mono text-left relative">
        
        {/* Agent active scanning visual sweep */}
        {isScanning && (
          <div className="fixed inset-x-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent z-50 pointer-events-none opacity-85 shadow-[0_0_12px_#f97316]"
            style={{
              animation: 'laser-scan-drop 1.2s cubic-bezier(0.25, 1, 0.5, 1) forwards'
            }}
          />
        )}

        {/* Global Telemetry Overview Banner */}
        <div className="bg-zinc-950 p-4 border border-zinc-900 rounded flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-800" />
          
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_#f97316]" />
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">{activeConfig.consoleTitle}</h2>
              <p className="text-[10px] text-zinc-400 mt-0.5">{activeConfig.subTitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 font-mono text-[10px]">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">DETECTED_PROFILE:</span>
              <span className="px-2 py-0.5 rounded border border-orange-500/30 bg-orange-500/10 text-orange-400 font-bold text-[9px]">
                {domain}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-zinc-500">FILTER:</span>
              <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${productFilter !== 'ALL' ? 'border-orange-500/30 bg-orange-500/5 text-orange-400' : 'border-zinc-850 text-zinc-400'}`}>
                {productFilter}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">AI_SYNC:</span>
              <span className="text-orange-400 font-bold flex items-center gap-1">
                ONLINE
                <span className={`inline-block w-1.5 h-1.5 rounded-full bg-orange-400 ${scanPulse ? 'animate-ping' : ''}`} />
              </span>
            </div>
            
            <button 
              onClick={handleReset}
              className="bg-zinc-900 hover:bg-zinc-850 text-zinc-350 hover:text-white border border-zinc-800 px-3 py-1.5 rounded text-[9px] font-bold transition-all flex items-center gap-1.5"
            >
              <RefreshCw size={11} className={isScanning ? 'animate-spin' : ''} />
              RESET_SYSTEM
            </button>
          </div>
        </div>

        {/* Dashboard 3-Column Tactical Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* COLUMN 1: Simulation Matrix & Control Panel (4 Cols) */}
          <div className={`lg:col-span-4 flex flex-col gap-6 rounded border transition-all duration-500 ${
            focusTopic === "COSTS" 
              ? "border-orange-500/80 shadow-[0_0_20px_rgba(249,115,22,0.15)] bg-orange-500/[0.01]" 
              : "border-transparent"
          }`}>
            
            {/* Simulation Controls */}
            <div className="bg-zinc-950 border border-zinc-900 p-5 rounded relative flex-1 flex flex-col justify-between">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-800" />
              
              {focusTopic === "COSTS" && (
                <span className="absolute top-2 right-2 text-[7px] text-orange-400 font-bold bg-orange-500/10 border border-orange-500/30 px-1.5 py-0.5 rounded tracking-widest animate-pulse">
                  ◉ ACTIVE_SPOTLIGHT
                </span>
              )}

              <div>
                <div className="flex items-center gap-2 mb-5">
                  <Cpu size={14} className="text-orange-400" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">QUANTUM_SIMULATION_PARAMETERS</h3>
                </div>

                <div className="space-y-5">
                  {/* Slider 1: Gross Margin / Fee Adjustment */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-400">{activeConfig.sliders.margin.label}</span>
                      <span className="text-orange-400 font-bold">{marginTarget}%</span>
                    </div>
                    <input 
                      type="range" 
                      min={activeConfig.sliders.margin.min} 
                      max={activeConfig.sliders.margin.max} 
                      value={marginTarget}
                      onChange={(e) => {
                        setMarginTarget(parseInt(e.target.value));
                        addLog(`[SYSTEM] Adjusted ${activeConfig.sliders.margin.label} to ${e.target.value}%`);
                      }}
                      className="w-full accent-orange-500 bg-zinc-900 h-1.5 rounded cursor-pointer border border-zinc-850"
                    />
                    <div className="flex justify-between text-[8px] text-zinc-650">
                      <span>{activeConfig.sliders.margin.minLabel}</span>
                      <span>{activeConfig.sliders.margin.maxLabel}</span>
                    </div>
                  </div>

                  {/* Slider 2: Cost Compression / Labor Cuts */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-400">{activeConfig.sliders.cost.label}</span>
                      <span className="text-orange-400 font-bold">{costCompression}%</span>
                    </div>
                    <input 
                      type="range" 
                      min={activeConfig.sliders.cost.min} 
                      max={activeConfig.sliders.cost.max} 
                      value={costCompression}
                      onChange={(e) => {
                        setCostCompression(parseInt(e.target.value));
                        addLog(`[SYSTEM] Adjusted ${activeConfig.sliders.cost.label} to ${e.target.value}%`);
                      }}
                      className="w-full accent-orange-500 bg-zinc-900 h-1.5 rounded cursor-pointer border border-zinc-850"
                    />
                    <div className="flex justify-between text-[8px] text-zinc-650">
                      <span>{activeConfig.sliders.cost.minLabel}</span>
                      <span>{activeConfig.sliders.cost.maxLabel}</span>
                    </div>
                  </div>

                  {/* Slider 3: Revenue Expansion / Turns */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-400">{activeConfig.sliders.revenue.label}</span>
                      <span className="text-orange-400 font-bold">{revenueExpansion > 0 ? `+${revenueExpansion}` : revenueExpansion}%</span>
                    </div>
                    <input 
                      type="range" 
                      min={activeConfig.sliders.revenue.min} 
                      max={activeConfig.sliders.revenue.max} 
                      value={revenueExpansion}
                      onChange={(e) => {
                        setRevenueExpansion(parseInt(e.target.value));
                        addLog(`[SYSTEM] Adjusted ${activeConfig.sliders.revenue.label} to ${e.target.value}%`);
                      }}
                      className="w-full accent-orange-500 bg-zinc-900 h-1.5 rounded cursor-pointer border border-zinc-850"
                    />
                    <div className="flex justify-between text-[8px] text-zinc-650">
                      <span>{activeConfig.sliders.revenue.minLabel}</span>
                      <span>{activeConfig.sliders.revenue.maxLabel}</span>
                    </div>
                  </div>

                  {/* Slider 4: Leakage / Spoilage Tolerance */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-400">{activeConfig.sliders.tolerance.label}</span>
                      <span className="text-orange-400 font-bold">${leakageTolerance.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" 
                      min={activeConfig.sliders.tolerance.min} 
                      max={activeConfig.sliders.tolerance.max} 
                      step={Math.round((activeConfig.sliders.tolerance.max - activeConfig.sliders.tolerance.min) / 15)}
                      value={leakageTolerance}
                      onChange={(e) => {
                        setLeakageTolerance(parseInt(e.target.value));
                        addLog(`[SYSTEM] Adjusted ${activeConfig.sliders.tolerance.label} to $${parseInt(e.target.value).toLocaleString()}`);
                      }}
                      className="w-full accent-orange-500 bg-zinc-900 h-1.5 rounded cursor-pointer border border-zinc-850"
                    />
                    <div className="flex justify-between text-[8px] text-zinc-650">
                      <span>{activeConfig.sliders.tolerance.minLabel}</span>
                      <span>{activeConfig.sliders.tolerance.maxLabel}</span>
                    </div>
                  </div>

                  {/* Slider 5: Success / Telehealth / Quality Budget */}
                  <div className="space-y-1.5 pt-2 border-t border-zinc-900/40">
                    <div className="flex justify-between text-[10px]">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <span>{activeConfig.sliders.custom.label}</span>
                        <span title="Direct investment that improves customer score indices but increases monthly operations costs.">
                          <HelpCircle size={10} className="text-zinc-600 hover:text-zinc-400 cursor-pointer" />
                        </span>
                      </div>
                      <span className="text-orange-400 font-bold">${customerSuccessInvestment.toLocaleString()}</span>
                    </div>
                    <input 
                      type="range" 
                      min={activeConfig.sliders.custom.min} 
                      max={activeConfig.sliders.custom.max} 
                      step="1000"
                      value={customerSuccessInvestment}
                      onChange={(e) => {
                        setCustomerSuccessInvestment(parseInt(e.target.value));
                        addLog(`[SYSTEM] Budget allocation for ${activeConfig.sliders.custom.label} set to $${parseInt(e.target.value).toLocaleString()}`);
                      }}
                      className="w-full accent-orange-500 bg-zinc-900 h-1.5 rounded cursor-pointer border border-zinc-850"
                    />
                    <div className="flex justify-between text-[8px] text-zinc-650">
                      <span>{activeConfig.sliders.custom.minLabel}</span>
                      <span>{activeConfig.sliders.custom.maxLabel}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mitigation controls */}
              <div className="pt-4 mt-4 border-t border-zinc-900 space-y-3">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400">AUTO_CONTAIN_ALL_LEAKAGES</span>
                  <button 
                    onClick={() => {
                      const nextVal = !resolveAll;
                      setResolveAll(nextVal);
                      if (nextVal && data?.insights) {
                        const allTitles = new Set<string>(data.insights.map((ins: any) => String(ins.title)));
                        setMitigatedLeakageTitles(allTitles);
                        addLog(`[SYSTEM] Mitigated all active profit leakages.`);
                      } else {
                        setMitigatedLeakageTitles(new Set());
                        addLog(`[SYSTEM] Restored all active profit leakages.`);
                      }
                    }}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${resolveAll ? 'bg-orange-500' : 'bg-zinc-800'}`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-black transition-transform duration-200 transform ${resolveAll ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrolling Console Log Terminal */}
            <div className="bg-zinc-950 border border-zinc-900 p-4 rounded h-40 flex flex-col justify-between relative font-mono text-[9px]">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-800" />
              
              <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2 mb-2 text-zinc-400 font-bold uppercase tracking-wider shrink-0">
                <Terminal size={11} />
                <span>SYS_OPERATIONS_STREAM_LOG</span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1" style={{ scrollbarWidth: 'thin' }}>
                {terminalLogs.map((log, idx) => {
                  let color = "text-zinc-400";
                  if (log.includes("[AGENT]")) color = "text-orange-400 font-bold";
                  if (log.includes("[SYSTEM]")) color = "text-zinc-350";
                  if (log.includes("[ERROR]")) color = "text-rose-500 font-bold";
                  if (log.includes("[WARNING]")) color = "text-amber-500";
                  
                  return (
                    <div key={idx} className={`${color} leading-tight font-mono`}>
                      {log}
                    </div>
                  );
                })}
                <div ref={terminalEndRef} />
              </div>
            </div>

          </div>

          {/* COLUMN 2: Dial & Interactive Grid (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Diagnostics Hub & Dial */}
            <div className={`bg-zinc-950 p-5 rounded relative flex flex-col items-center justify-center min-h-[260px] text-center border transition-all duration-500 ${
              focusTopic === "CUSTOMERS" 
                ? "border-orange-500/80 shadow-[0_0_20px_rgba(249,115,22,0.15)] bg-orange-500/[0.01]" 
                : "border-zinc-900"
            }`}>
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-800" />
              
              {focusTopic === "CUSTOMERS" && (
                <span className="absolute top-2 right-2 text-[7px] text-orange-400 font-bold bg-orange-500/10 border border-orange-500/30 px-1.5 py-0.5 rounded tracking-widest animate-pulse">
                  ◉ ACTIVE_SPOTLIGHT
                </span>
              )}

              <div className="absolute top-4 left-4 flex items-center gap-1.5">
                <Layers size={13} className="text-orange-400" />
                <span className="text-[9px] font-bold text-zinc-400 tracking-wider">TELEMETRY_DIAGNOSTICS_DIAL</span>
              </div>

              {/* Beautiful custom SVG Dial */}
              <div className="relative mt-4 flex items-center justify-center">
                <svg width="170" height="170" viewBox="0 0 170 170" className="transform -rotate-90">
                  <circle 
                    cx="85" 
                    cy="85" 
                    r={dialRadius} 
                    stroke="#18181b" 
                    strokeWidth="8" 
                    fill="none" 
                  />
                  <circle 
                    cx="85" 
                    cy="85" 
                    r={dialRadius - 6} 
                    stroke="#27272a" 
                    strokeWidth="0.5" 
                    strokeDasharray="2 3"
                    fill="none" 
                  />
                  <circle 
                    cx="85" 
                    cy="85" 
                    r={dialRadius} 
                    stroke="url(#orangeGradient)" 
                    strokeWidth="8" 
                    strokeDasharray={dialCircumference}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    fill="none" 
                    filter="url(#glow)"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                
                {/* Center score readout */}
                <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                  <span className="text-3xl font-extrabold text-white tracking-tight">{simulatedOverallScore}</span>
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{activeConfig.metricLabels.overall}</span>
                  
                  {/* Score variance tag */}
                  <div className={`text-[9px] font-bold flex items-center mt-1 px-1.5 py-0.5 rounded ${scoreVariance >= 0 ? 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/10' : 'text-rose-400 bg-rose-500/5 border border-rose-500/10'}`}>
                    {scoreVariance >= 0 ? '+' : ''}{scoreVariance} Variance
                  </div>
                </div>
              </div>

              {/* Sub-breakdowns below dial */}
              <div className="grid grid-cols-3 gap-2 w-full mt-6 pt-5 border-t border-zinc-900 font-mono text-[9px]">
                <div className="text-center">
                  <p className="text-zinc-500 uppercase">{activeConfig.metricLabels.revenue}</p>
                  <p className="text-white font-bold mt-1 text-xs">{simulatedRevenueScore}/100</p>
                </div>
                <div className="text-center border-x border-zinc-900">
                  <p className="text-zinc-500 uppercase">{activeConfig.metricLabels.costs}</p>
                  <p className="text-white font-bold mt-1 text-xs">{simulatedCostsScore}/100</p>
                </div>
                <div className="text-center">
                  <p className="text-zinc-500 uppercase">{activeConfig.metricLabels.customers}</p>
                  <p className="text-white font-bold mt-1 text-xs">{simulatedCustomersScore}/100</p>
                </div>
              </div>
            </div>

            {/* Interactive Operations Grid Map / Anomalies List */}
            <div className={`bg-zinc-950 border p-5 rounded relative flex-1 flex flex-col justify-between min-h-[290px] transition-all duration-500 ${
              focusTopic === "ANOMALIES" 
                ? "border-orange-500/80 shadow-[0_0_20px_rgba(249,115,22,0.15)] bg-orange-500/[0.01]" 
                : "border-zinc-900"
            }`}>
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-800" />
              
              {focusTopic === "ANOMALIES" && (
                <span className="absolute top-2 right-2 text-[7px] text-orange-400 font-bold bg-orange-500/10 border border-orange-500/30 px-1.5 py-0.5 rounded tracking-widest animate-pulse">
                  ◉ ACTIVE_SPOTLIGHT
                </span>
              )}

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {/* Tab switches */}
                    <button
                      onClick={() => setColumn2Tab('radar')}
                      className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-all pb-1 border-b-2 ${
                        column2Tab === 'radar'
                          ? 'border-orange-500 text-white font-mono'
                          : 'border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <Activity size={12} className={column2Tab === 'radar' ? 'text-orange-400 animate-pulse' : ''} />
                      RADAR_MAP
                    </button>
                    <button
                      onClick={() => setColumn2Tab('anomalies')}
                      className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-all pb-1 border-b-2 ${
                        column2Tab === 'anomalies'
                          ? 'border-orange-500 text-white font-mono'
                          : 'border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <ShieldAlert size={12} className={column2Tab === 'anomalies' ? 'text-orange-400 animate-pulse' : ''} />
                      ANOMALIES_LIST
                    </button>
                  </div>
                  <span className="text-[8px] bg-rose-955/40 border border-rose-500/30 text-rose-455 font-bold px-2 py-0.5 rounded animate-pulse">
                    {metricsData?.anomalies?.length || activeLeakagesCount} OUTLIERS
                  </span>
                </div>

                {column2Tab === 'radar' ? (
                  /* Radar coordinate board */
                  <div className="relative w-full aspect-square max-h-[240px] bg-black border border-zinc-900 rounded overflow-hidden flex items-center justify-center z-10">
                    <div className="absolute w-[80%] aspect-square border border-zinc-900/60 rounded-full pointer-events-none" />
                    <div className="absolute w-[55%] aspect-square border border-zinc-900/40 rounded-full pointer-events-none" />
                    <div className="absolute w-[30%] aspect-square border border-zinc-900/20 rounded-full pointer-events-none" />
                    
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-zinc-900/50 pointer-events-none" />
                    <div className="absolute left-0 right-0 top-1/2 h-px bg-zinc-900/50 pointer-events-none" />
                    
                    <div 
                      className="absolute w-[200%] h-[200%] pointer-events-none opacity-[0.03]"
                      style={{
                        background: 'conic-gradient(from 0deg, #f97316 0deg, transparent 90deg, transparent 360deg)',
                        animation: 'sonar-sweep 6s linear infinite'
                      }}
                    />

                    {/* Pulsing Coordinate Dots */}
                    {insightsWithImpact.map((ins: any) => {
                      const isMitigated = mitigatedLeakageTitles.has(ins.title) || resolveAll;
                      const isViolated = ins.impactVal > leakageTolerance;
                      
                      let dotColor = "bg-orange-500 shadow-[0_0_8px_#f97316]";
                      if (isMitigated) {
                        dotColor = "bg-emerald-500 shadow-[0_0_8px_#10b981]";
                      } else if (isViolated) {
                        dotColor = "bg-rose-500 animate-ping shadow-[0_0_12px_#f43f5e]";
                      }

                      return (
                        <button
                          key={ins.id}
                          onClick={() => setSelectedInsight(ins)}
                          className={`absolute w-3.5 h-3.5 rounded-full border border-black transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 hover:scale-125 transition-all ${dotColor}`}
                          style={{ left: `${ins.x}%`, top: `${ins.y}%` }}
                          title={`${ins.title} ($${ins.impactVal.toLocaleString()})`}
                        />
                      );
                    })}
                    
                    <span className="absolute left-3 top-3 text-[8px] text-zinc-700 font-mono">COORD: 34.09 // 118.24</span>
                    <span className="absolute right-3 bottom-3 text-[8px] text-zinc-700 font-mono">STATUS: RADAR_ONLINE</span>
                  </div>
                ) : (
                  /* Decrypted anomalies list */
                  <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                    {(metricsData?.anomalies || []).map((anomaly: any) => {
                      const isSelected = selectedInsight?.id === anomaly.id;
                      const severityColor = 
                        anomaly.severity === 'critical' ? 'text-rose-500 border-rose-900/30 bg-rose-950/20' :
                        anomaly.severity === 'high' ? 'text-orange-500 border-orange-900/30 bg-orange-950/20' :
                        'text-yellow-500 border-yellow-900/30 bg-yellow-950/20';
                      
                      return (
                        <div
                          key={anomaly.id}
                          onClick={() => setSelectedInsight(anomaly)}
                          className={`p-2.5 rounded border text-left cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_8px_rgba(249,115,22,0.1)]' 
                              : 'bg-black/40 border-zinc-900 hover:border-zinc-800'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider truncate max-w-[70%]">{anomaly.title}</h4>
                            <span className={`text-[7px] font-mono tracking-widest px-1.5 py-0.5 rounded border uppercase font-bold shrink-0 ${severityColor}`}>
                              {anomaly.severity}
                            </span>
                          </div>
                          <p className="text-[9px] text-zinc-400 font-sans normal-case mt-1 leading-relaxed line-clamp-2">
                            {anomaly.description}
                          </p>
                          <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-zinc-900/50 text-[8px] text-zinc-500 font-mono">
                            <span>DATE: {anomaly.date}</span>
                            <span className="text-orange-400 font-bold">IMPACT: ${anomaly.impact.toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                    {(metricsData?.anomalies || []).length === 0 && (
                      <div className="text-center py-12 text-[9px] text-zinc-650 font-mono">
                        No Z-score outliers detected in current ledger.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="text-[8px] text-zinc-500 italic mt-3 text-center">
                {column2Tab === 'radar' 
                  ? "Click any coordinate node above to decrypt telemetry and toggle containment."
                  : "Click any anomaly item above to decrypt telemetry details."
                }
              </div>
            </div>

          </div>

          {/* COLUMN 3: Telemetry Inspector & Adaptive Modeler Widgets (3 Cols) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            
            {/* Decryption Telemetry Inspector Card */}
            <div className="bg-zinc-950 border border-zinc-900 p-5 rounded relative flex-1 flex flex-col justify-between min-h-[260px]">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-800" />
              
              <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-3 mb-4">
                <AlertOctagon size={14} className="text-orange-400" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">TELEMETRY_DECRYPTION_UNIT</h3>
              </div>

              {selectedInsight ? (
                <div className="flex-1 flex flex-col justify-between font-mono">
                  <div className="space-y-3">
                    <div>
                      <span className="text-[8px] text-zinc-500 uppercase block">INCIDENT_CLASSIFICATION</span>
                      <h4 className="text-[11px] font-bold text-white uppercase mt-0.5">{selectedInsight.title}</h4>
                    </div>

                    <div>
                      <span className="text-[8px] text-zinc-500 uppercase block">TELEMETRY_STREAM</span>
                      <p className="text-[10px] text-zinc-400 font-sans normal-case mt-0.5 leading-relaxed">
                        {selectedInsight.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div>
                        <span className="text-[8px] text-zinc-500 uppercase block">SEVERITY</span>
                        <span className={`text-[9px] font-bold uppercase ${
                          selectedInsight.severity === 'critical' || selectedInsight.severity === 'high' ? 'text-rose-400' : 'text-amber-400'
                        }`}>
                          ◉ {selectedInsight.severity}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] text-zinc-500 uppercase block">EST_IMPACT</span>
                        <span className="text-[10px] font-bold text-orange-400">
                          ${(selectedInsight.impactVal !== undefined ? selectedInsight.impactVal : (selectedInsight.impact || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Override controls inside inspector */}
                  <div className="pt-4 mt-4 border-t border-zinc-900">
                    <button
                      onClick={() => toggleMitigate(selectedInsight.title, selectedInsight.impactVal)}
                      className={`w-full text-center py-2 rounded text-[10px] font-bold tracking-wider transition-all border ${
                        mitigatedLeakageTitles.has(selectedInsight.title) || resolveAll
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-orange-500 hover:bg-orange-600 text-black border-transparent font-bold'
                      }`}
                    >
                      {mitigatedLeakageTitles.has(selectedInsight.title) || resolveAll
                        ? 'OVERRIDE_ENABLED'
                        : 'ENABLE_MITIGATION_OVERRIDE'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                  <AlertOctagon size={20} className="text-zinc-700 animate-pulse mb-2" />
                  <p className="text-[9px] text-zinc-500 font-sans">No node selected. Select a leakage marker on the radar mapping grid.</p>
                </div>
              )}
            </div>

            {/* ADAPTIVE SIMULATION WIDGET 1: Top dependency stress-tester */}
            {concentrationAlert && (
              <div className={`bg-zinc-950 p-5 rounded relative min-h-[170px] flex flex-col justify-between border transition-all duration-500 ${
                focusTopic === "CONCENTRATION" 
                  ? "border-orange-500/80 shadow-[0_0_20px_rgba(249,115,22,0.15)] bg-orange-500/[0.01]" 
                  : "border-zinc-900"
              }`}>
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-800" />
                
                {focusTopic === "CONCENTRATION" && (
                  <span className="absolute top-2 right-2 text-[7px] text-orange-400 font-bold bg-orange-500/10 border border-orange-500/30 px-1.5 py-0.5 rounded tracking-widest animate-pulse">
                    ◉ ACTIVE_SPOTLIGHT
                  </span>
                )}

                <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2 mb-3">
                  <ShieldAlert size={14} className="text-orange-400" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">{activeConfig.adaptiveWidgets.testerTitle}</h3>
                </div>

                <div className="space-y-3 font-mono">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-zinc-500">{activeConfig.adaptiveWidgets.testerSliderLabel}</span>
                    <span className="text-rose-455 font-bold">{topCustomerLossPct}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max={activeConfig.adaptiveWidgets.testerSliderMax} 
                    step={activeConfig.adaptiveWidgets.testerSliderStep}
                    value={topCustomerLossPct}
                    onChange={(e) => {
                      setTopCustomerLossPct(parseInt(e.target.value));
                      addLog(`[SYSTEM] Stress testing ${activeConfig.adaptiveWidgets.testerSliderLabel} at ${e.target.value}%`);
                    }}
                    className="w-full accent-orange-500 bg-zinc-900 h-1.5 rounded cursor-pointer border border-zinc-850"
                  />
                  
                  <div className="p-2 bg-rose-500/5 border border-rose-500/15 rounded text-[8px] leading-normal text-rose-400 font-sans normal-case">
                    {activeConfig.adaptiveWidgets.testerAlertText} Stress tests model structural volume drops across billing streams.
                  </div>
                </div>
              </div>
            )}

            {/* ADAPTIVE SIMULATION WIDGET 2: Consolidations/Commissions optimization widget */}
            {freightAlert && (
              <div className={`bg-zinc-950 p-5 rounded relative min-h-[170px] flex flex-col justify-between border transition-all duration-500 ${
                focusTopic === "SHIPPING" 
                  ? "border-orange-500/80 shadow-[0_0_20px_rgba(249,115,22,0.15)] bg-orange-500/[0.01]" 
                  : "border-zinc-900"
              }`}>
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-800" />
                
                {focusTopic === "SHIPPING" && (
                  <span className="absolute top-2 right-2 text-[7px] text-orange-400 font-bold bg-orange-500/10 border border-orange-500/30 px-1.5 py-0.5 rounded tracking-widest animate-pulse">
                    ◉ ACTIVE_SPOTLIGHT
                  </span>
                )}

                <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-2 mb-3">
                  <TrendingUp size={14} className="text-orange-400" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">{activeConfig.adaptiveWidgets.optimizerTitle}</h3>
                </div>

                <div className="space-y-3 font-mono">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-zinc-500">{activeConfig.adaptiveWidgets.optimizerSliderLabel}</span>
                    <span className="text-emerald-450 font-bold">{shippingConsolidation}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max={activeConfig.adaptiveWidgets.optimizerSliderMax} 
                    step={activeConfig.adaptiveWidgets.optimizerSliderStep}
                    value={shippingConsolidation}
                    onChange={(e) => {
                      setShippingConsolidation(parseInt(e.target.value));
                      addLog(`[SYSTEM] Optimization consolidator adjusted to ${e.target.value}%`);
                    }}
                    className="w-full accent-orange-500 bg-zinc-900 h-1.5 rounded cursor-pointer border border-zinc-850"
                  />
                  
                  <div className="flex justify-between text-[8px] text-zinc-550 leading-relaxed font-sans">
                    <span>{activeConfig.adaptiveWidgets.optimizerLeftText}: +{(shippingConsolidation * 0.45).toFixed(1)}%</span>
                    <span className="text-rose-400">{activeConfig.adaptiveWidgets.optimizerRightText}: -{(shippingConsolidation * 0.6).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Simulated P&L Projection Chart Widget */}
            <div className={`bg-zinc-950 p-5 rounded relative min-h-[260px] flex flex-col justify-between border transition-all duration-500 ${
              focusTopic === "REVENUE" 
                ? "border-orange-500/80 shadow-[0_0_20px_rgba(249,115,22,0.15)] bg-orange-500/[0.01]" 
                : "border-zinc-900"
            }`}>
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-800" />
              
              {focusTopic === "REVENUE" && (
                <span className="absolute top-2 right-2 text-[7px] text-orange-400 font-bold bg-orange-500/10 border border-orange-500/30 px-1.5 py-0.5 rounded tracking-widest animate-pulse">
                  ◉ ACTIVE_SPOTLIGHT
                </span>
              )}

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-orange-400" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">{activeConfig.pAndLChartTitle}</h3>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChartView('profit')}
                    className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all border ${chartView === 'profit' ? 'bg-orange-500/15 border-orange-500/40 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                  >
                    NET_PROFIT
                  </button>
                  <button
                    onClick={() => setChartView('rev_vs_cost')}
                    className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all border ${chartView === 'rev_vs_cost' ? 'bg-orange-500/15 border-orange-500/40 text-orange-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400'}`}
                  >
                    REV_VS_COGS
                  </button>
                </div>
              </div>

              {/* Chart */}
              <div className="h-[130px] w-full mt-2 font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <defs>
                      <linearGradient id="colorProfitHist" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorProfitFore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 8}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 8}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '4px', color: '#f4f4f5', fontFamily: 'monospace', fontSize: '9px' }}
                      formatter={(value: any, name: any, props: any) => {
                        const isForecast = props.payload.isForecast;
                        const formattedVal = typeof value === 'number' ? `$${value.toLocaleString()}` : value;
                        const displayName = isForecast ? `${name} (Proj)` : name;
                        return [formattedVal, displayName];
                      }}
                    />
                    
                    {chartView === 'profit' ? (
                      <>
                        <Area type="monotone" dataKey="profitHist" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfitHist)" name="Actual Net Profit" />
                        <Area type="monotone" dataKey="profitFore" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorProfitFore)" name="Projected Net Profit" />
                      </>
                    ) : (
                      <>
                        <Area type="monotone" dataKey="revHist" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" name="Actual Revenue" />
                        <Line type="monotone" dataKey="revFore" stroke="#f97316" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Projected Revenue" />
                        <Line type="monotone" dataKey="costHist" stroke="#f87171" strokeWidth={1.5} dot={{ r: 1.5 }} name="Actual COGS" />
                        <Line type="monotone" dataKey="costFore" stroke="#f87171" strokeWidth={1.2} strokeDasharray="3 3" dot={false} name="Projected COGS" />
                      </>
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Readout calculations */}
              <div className="flex justify-between items-center text-[9px] mt-4 pt-3 border-t border-zinc-900 font-mono">
                <div className="text-left">
                  <p className="text-zinc-500 uppercase">{activeConfig.pAndLChartLabel}</p>
                  <p className="text-white font-bold mt-0.5">
                    ${(totalSimulatedRevenue - totalSimulatedCost).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-500 uppercase">{activeConfig.pAndLRecoveryLabel}</p>
                  <p className="text-emerald-455 font-bold mt-0.5">
                    +${mitigatedLeakageAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Multi-Variable Correlations & Advanced KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pearson Correlation matrix heatmap */}
          <div className="lg:col-span-2 bg-zinc-950 border border-zinc-900 p-5 rounded relative flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-800" />
            
            <div>
              <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-3 mb-4">
                <Activity size={14} className="text-orange-400" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">MULTI_VARIABLE_PEARSON_CORRELATION_MATRIX</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-[9px]">
                {/* Cell 1: Quantity vs Revenue */}
                <div className="bg-black/30 p-3 rounded border border-zinc-900 flex flex-col justify-between min-h-[90px] group hover:border-orange-500/30 transition-all relative">
                  <div>
                    <span className="text-zinc-500 text-[8px] block tracking-wide">QTY_VS_REVENUE</span>
                    <span className="text-[10px] font-bold text-zinc-350 block mt-1">Transaction Scale</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs font-bold ${getCorrColor(metricsData?.correlations?.qty_rev ?? 0.85)}`}>
                      {formatCorr(metricsData?.correlations?.qty_rev ?? 0.85)}
                    </span>
                    <span className="text-[7px] text-zinc-550 border border-zinc-850 px-1 py-0.5 rounded font-sans uppercase">
                      {getCorrLabel(metricsData?.correlations?.qty_rev ?? 0.85)}
                    </span>
                  </div>
                  {/* Tooltip helper */}
                  <div className="hidden group-hover:block absolute bottom-12 left-6 right-6 bg-zinc-900 border border-zinc-855 p-2.5 rounded text-[9px] text-zinc-300 font-sans leading-normal z-30 shadow-xl max-w-[280px]">
                    <strong>Transaction Scale Correlation:</strong> Shows how strongly order quantity correlates with revenue. A high value suggests that larger order sizes directly drive billing growth.
                  </div>
                </div>

                {/* Cell 2: Price Elasticity of Demand (Price vs Quantity) */}
                <div className="bg-black/30 p-3 rounded border border-zinc-900 flex flex-col justify-between min-h-[90px] group hover:border-orange-500/30 transition-all relative">
                  <div>
                    <span className="text-zinc-500 text-[8px] block tracking-wide">PRICE_VS_QUANTITY</span>
                    <span className="text-[10px] font-bold text-zinc-350 block mt-1">Price Elasticity</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs font-bold ${getCorrColor(metricsData?.correlations?.price_qty ?? -0.65)}`}>
                      {formatCorr(metricsData?.correlations?.price_qty ?? -0.65)}
                    </span>
                    <span className="text-[7px] text-zinc-550 border border-zinc-850 px-1 py-0.5 rounded font-sans uppercase">
                      {getCorrLabel(metricsData?.correlations?.price_qty ?? -0.65)}
                    </span>
                  </div>
                  {/* Tooltip helper */}
                  <div className="hidden group-hover:block absolute bottom-12 left-6 right-6 bg-zinc-900 border border-zinc-855 p-2.5 rounded text-[9px] text-zinc-300 font-sans leading-normal z-30 shadow-xl max-w-[280px]">
                    <strong>Price Elasticity Correlation:</strong> Measures demand sensitivity. A negative correlation indicates that raising prices compresses unit volume (standard elasticity). A value close to zero means inelastic demand.
                  </div>
                </div>

                {/* Cell 3: Cost to Revenue */}
                <div className="bg-black/30 p-3 rounded border border-zinc-900 flex flex-col justify-between min-h-[90px] group hover:border-orange-500/30 transition-all relative">
                  <div>
                    <span className="text-zinc-500 text-[8px] block tracking-wide">COST_VS_REVENUE</span>
                    <span className="text-[10px] font-bold text-zinc-350 block mt-1">COGS Elasticity</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs font-bold ${getCorrColor(metricsData?.correlations?.cost_rev ?? 0.90)}`}>
                      {formatCorr(metricsData?.correlations?.cost_rev ?? 0.90)}
                    </span>
                    <span className="text-[7px] text-zinc-550 border border-zinc-850 px-1 py-0.5 rounded font-sans uppercase">
                      {getCorrLabel(metricsData?.correlations?.cost_rev ?? 0.90)}
                    </span>
                  </div>
                  {/* Tooltip helper */}
                  <div className="hidden group-hover:block absolute bottom-12 left-6 right-6 bg-zinc-900 border border-zinc-855 p-2.5 rounded text-[9px] text-zinc-300 font-sans leading-normal z-30 shadow-xl max-w-[280px]">
                    <strong>COGS Elasticity:</strong> Measures how costs expand alongside revenues. A high positive value indicates that variable supplier cost scales linearly with sales, pointing to high variable costs.
                  </div>
                </div>

                {/* Cell 4: Revenue to Profit */}
                <div className="bg-black/30 p-3 rounded border border-zinc-900 flex flex-col justify-between min-h-[90px] group hover:border-orange-500/30 transition-all relative">
                  <div>
                    <span className="text-zinc-500 text-[8px] block tracking-wide">REVENUE_VS_PROFIT</span>
                    <span className="text-[10px] font-bold text-zinc-350 block mt-1">Margin Stability</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs font-bold ${getCorrColor(metricsData?.correlations?.rev_profit ?? 0.72)}`}>
                      {formatCorr(metricsData?.correlations?.rev_profit ?? 0.72)}
                    </span>
                    <span className="text-[7px] text-zinc-550 border border-zinc-850 px-1 py-0.5 rounded font-sans uppercase">
                      {getCorrLabel(metricsData?.correlations?.rev_profit ?? 0.72)}
                    </span>
                  </div>
                  {/* Tooltip helper */}
                  <div className="hidden group-hover:block absolute bottom-12 left-6 right-6 bg-zinc-900 border border-zinc-855 p-2.5 rounded text-[9px] text-zinc-300 font-sans leading-normal z-30 shadow-xl max-w-[280px]">
                    <strong>Margin Stability:</strong> Measures how top-line expansion translates to bottom-line profit. A weak correlation implies margin compression (costs eating up new revenues).
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced KPIs List */}
          <div className="bg-zinc-950 border border-zinc-900 p-5 rounded relative flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-800" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-800" />
            
            <div>
              <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-3 mb-4">
                <Layers size={13} className="text-orange-400" />
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">ADVANCED_OPERATIONAL_KPIS</h3>
              </div>
              
              <div className="space-y-3 font-mono text-[9px]">
                {/* KPI 1: AOV */}
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-900/50">
                  <span className="text-zinc-500">AVERAGE_ORDER_VALUE (AOV)</span>
                  <span className="text-white font-bold">${(metricsData?.kpis?.aov ?? 3450.0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                </div>
                {/* KPI 2: HHI Customer Concentration */}
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-900/50">
                  <div className="flex flex-col">
                    <span>CUSTOMER_CONCENTRATION (HHI)</span>
                    <span className="text-[7px] text-zinc-600 font-sans normal-case">Herfindahl-Hirschman index dependency</span>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-bold">{(metricsData?.kpis?.hhi_dependency ?? 0.58).toFixed(3)}</span>
                    <span className={`block text-[7px] font-bold ${(metricsData?.kpis?.hhi_dependency ?? 0.58) > 0.25 ? 'text-rose-400' : 'text-emerald-450'}`}>
                      {(metricsData?.kpis?.hhi_dependency ?? 0.58) > 0.25 ? 'HIGH_DEPENDENCY' : 'HEALTHY_SPREAD'}
                    </span>
                  </div>
                </div>
                {/* KPI 3: Cost Leakage to Revenue Ratio */}
                <div className="flex justify-between items-center py-1.5">
                  <div className="flex flex-col">
                    <span>COST_LEAKAGE_RATIO</span>
                    <span className="text-[7px] text-zinc-600 font-sans normal-case">Direct leakage as % of top line</span>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-bold">{((metricsData?.kpis?.cost_leakage_ratio ?? 0.18) * 100).toFixed(1)}%</span>
                    <span className={`block text-[7px] font-bold ${(metricsData?.kpis?.cost_leakage_ratio ?? 0.18) > 0.10 ? 'text-rose-400' : 'text-emerald-450'}`}>
                      {(metricsData?.kpis?.cost_leakage_ratio ?? 0.18) > 0.10 ? 'ATTENTION_REQUIRED' : 'ACCEPTABLE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Executive AI Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-orange-500/5 border border-orange-500/20 p-5 rounded relative overflow-hidden group shadow-[0_0_20px_rgba(249,115,22,0.02)]">
            <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-orange-500/35" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-orange-500/35" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-orange-500/35" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-orange-500/35" />
            
            <div className="flex items-center gap-2.5 mb-3">
              <ShieldCheck size={16} className="text-orange-400" />
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-orange-400">EXECUTIVE_AI_PERSPECTIVE</h3>
            </div>
            
            <p className="text-zinc-300 text-xs leading-relaxed font-sans normal-case">
              &ldquo;{data?.summary}&rdquo;
            </p>
            
            <div className="mt-4 flex flex-wrap gap-3 font-mono text-[9px]">
              <Link href="/reports" className="bg-orange-500 hover:bg-orange-600 text-black px-4.5 py-2 rounded font-bold transition-all hover:scale-[1.02]">
                VIEW_REPORTS
              </Link>
              <Link href="/insights" className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white px-4.5 py-2 rounded font-bold transition-colors">
                PROACTIVE_RECOMMENDATIONS
              </Link>
            </div>
          </div>

          {/* Action checklist */}
          <div className="bg-zinc-950 border border-zinc-900 p-5 rounded relative flex-col justify-between">
            <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-zinc-800" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-zinc-800" />
            
            <div>
              <h3 className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-orange-455" />
                RECOMMENDED_NEXT_ACTIONS
              </h3>
              
              <div className="space-y-2.5">
                {(data?.actions || []).map((action: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-2.5 p-2 bg-black/40 rounded border border-zinc-900 text-left">
                    <span className="text-[9px] text-orange-400 font-bold shrink-0 mt-0.5">0{idx + 1}.</span>
                    <span className="text-[10px] text-zinc-400 leading-normal font-sans normal-case">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes sonar-sweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes laser-scan-drop {
          0% { top: 0%; opacity: 0; }
          15% { opacity: 0.95; }
          85% { opacity: 0.95; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </DashboardLayout>
  );
}

const baseHealth = { overall: 68, revenue: 70, customers: 65, costs: 60, products: 80 };
const dialRadius = 65;
const dialCircumference = 2 * Math.PI * dialRadius;
