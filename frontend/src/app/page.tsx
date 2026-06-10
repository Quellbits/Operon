"use client";

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, DollarSign, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function Home() {
  const stats = [
    { label: 'Revenue Health', value: '88/100', change: '+2.4%', icon: <DollarSign />, color: 'emerald' },
    { label: 'Customer Health', value: '72/100', change: '-4.1%', icon: <Activity />, color: 'amber' },
    { label: 'Cost Efficiency', value: '94/100', change: '+1.2%', icon: <ShieldCheck />, color: 'indigo' },
    { label: 'Overall Score', value: '85', change: '+0.8%', icon: <TrendingUp />, color: 'violet' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Executive Summary</h2>
          <p className="text-slate-500 mt-2">Welcome back. Here is your consultant-grade business overview.</p>
        </div>

        {/* Health Scores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                  {stat.icon}
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${stat.change.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {stat.change}
                  {stat.change.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Perspective */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-md">
                   <ShieldCheck size={24} />
                </div>
                <h3 className="text-xl font-bold">Executive Intelligence</h3>
              </div>
              <p className="text-indigo-100 text-lg leading-relaxed font-medium">
                "The business is exhibiting strong revenue growth but faces a critical customer concentration risk. 
                Your top 3 clients now account for 45% of total Q2 revenue. We recommend immediate diversification 
                strategies while gross margins remain healthy at 38%."
              </p>
              <div className="mt-8 flex gap-4">
                <button className="bg-white text-indigo-700 px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors">
                  Read Full Report
                </button>
                <button className="bg-indigo-500/30 border border-indigo-400/30 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-500/40 transition-colors">
                  Action Plan
                </button>
              </div>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
               <h3 className="text-lg font-bold text-slate-900 mb-6">Critical Insights</h3>
               <div className="space-y-4">
                 {[
                   { title: 'Customer Churn Risk', desc: 'Sustained decline in Region 4 transaction frequency.', severity: 'high' },
                   { title: 'Inventory Inefficiency', desc: 'Category-B products are showing a 22-day stock surplus.', severity: 'medium' },
                   { title: 'Revenue Milestone', desc: 'Monthly revenue has exceeded $250k for the first time.', severity: 'low' },
                 ].map((insight, idx) => (
                   <div key={idx} className="flex gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors group">
                     <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                       insight.severity === 'high' ? 'bg-rose-50 text-rose-600' : 
                       insight.severity === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                     }`}>
                        <AlertTriangle size={20} />
                     </div>
                     <div>
                       <h4 className="font-bold text-slate-900">{insight.title}</h4>
                       <p className="text-sm text-slate-500">{insight.desc}</p>
                     </div>
                     <ArrowUpRight className="ml-auto text-slate-300 group-hover:text-slate-600 transition-colors" size={18} />
                   </div>
                 ))}
               </div>
            </section>
          </div>

          {/* Side Panel: Actions & Status */}
          <div className="space-y-6">
            <div className="bg-slate-900 p-6 rounded-3xl text-white">
              <h3 className="font-bold mb-4">Recommended Actions</h3>
              <div className="space-y-3">
                {[
                  'Draft Customer Diversification Plan',
                  'Optimize US-West Inventory levels',
                  'Schedule Q3 Strategic Review'
                ].map((action, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div className="w-5 h-5 rounded-md border border-slate-600 bg-slate-800"></div>
                    <span className="text-sm font-medium text-slate-300">{action}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-4">Upload History</h3>
              <div className="space-y-4">
                {[
                  { name: 'Q2_Sales_v2.csv', status: 'Completed', date: '2h ago' },
                  { name: 'July_Expenses.xlsx', status: 'Processing', date: '5m ago' }
                ].map((file, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{file.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{file.date}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      file.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {file.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
