"use client";

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { AlertCircle, TrendingDown, Users, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export default function InsightsPage() {
  const insights = [
    {
      type: 'Risk',
      title: 'High Customer Concentration',
      impact: 'Critical',
      desc: 'Top 3 clients contribute 45% of total revenue. Losing any of these clients would result in a significant operational deficit.',
      icon: <ShieldAlert className="text-rose-600" />,
      color: 'rose',
      action: 'Start Customer Diversification Program'
    },
    {
      type: 'Growth',
      title: 'Region 2 Upsell Opportunity',
      impact: 'High',
      desc: 'Active users in Region 2 have increased transaction frequency by 18%, but average order value remains flat.',
      icon: <TrendingDown className="text-emerald-600 rotate-180" />,
      color: 'emerald',
      action: 'Launch Volume-based Discounting in R2'
    },
    {
      type: 'Efficiency',
      title: 'Automated Logistics Savings',
      impact: 'Medium',
      desc: 'Recent normalization of distribution routes shows a potential 12% saving in last-mile costs.',
      icon: <CheckCircle2 className="text-indigo-600" />,
      color: 'indigo',
      action: 'Apply New Routing Logic'
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Operational Intelligence</h2>
          <p className="text-slate-500 mt-2">Rules-based insights generated from your normalized business model.</p>
        </div>

        <div className="space-y-6">
          {insights.map((insight, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
              <div className={`w-3 md:w-2 bg-${insight.color}-500 shrink-0`}></div>
              <div className="p-8 flex-1 flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${insight.color}-50 rounded-lg`}>
                      {insight.icon}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest text-${insight.color}-600`}>{insight.type}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{insight.impact} IMPACT</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{insight.title}</h3>
                  <p className="text-slate-500 leading-relaxed max-w-2xl">{insight.desc}</p>
                </div>
                <div className="md:w-64 shrink-0 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center md:text-left">Consultant Recommendation</p>
                   <p className="text-sm font-bold text-slate-800 leading-snug mb-6 text-center md:text-left">{insight.action}</p>
                   <button className={`w-full py-3 rounded-xl bg-${insight.color}-600 text-white font-bold text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shadow-${insight.color}-600/20`}>
                      Execute Plan <ArrowRight size={14} />
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
