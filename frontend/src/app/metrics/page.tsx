"use client";

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { BarChart, AreaChart, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const data = [
  { name: 'Jan', revenue: 42000, cost: 28000 },
  { name: 'Feb', revenue: 45000, cost: 29000 },
  { name: 'Mar', revenue: 58000, cost: 34000 },
  { name: 'Apr', revenue: 62000, cost: 38000 },
  { name: 'May', revenue: 54000, cost: 33000 },
  { name: 'Jun', revenue: 48000, cost: 31000 },
];

const productData = [
  { name: 'Industrial Pumps', value: 45 },
  { name: 'Seals & Gaskets', value: 25 },
  { name: 'Maintenance Kits', value: 20 },
  { name: 'Other', value: 10 },
];

const COLORS = ['#4f46e5', '#818cf8', '#a5b4fc', '#e0e7ff'];

export default function MetricsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Deterministic Metrics</h2>
          <p className="text-slate-500 mt-2">Calculated by our Python-based analytics engine. No AI estimations.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue vs Cost */}
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 px-2">Revenue Growth vs Operations Cost</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="cost" stroke="#94a3b8" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Product Distribution */}
          <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 px-2">Revenue by Product Category</h3>
            <div className="flex items-center justify-center h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {productData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
               </ResponsiveContainer>
               <div className="w-1/3 space-y-3 pr-4">
                 {productData.map((item, i) => (
                   <div key={i} className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i]}}></div>
                       <span className="text-xs font-medium text-slate-600 truncate">{item.name}</span>
                     </div>
                     <span className="text-xs font-bold text-slate-900">{item.value}%</span>
                   </div>
                 ))}
               </div>
            </div>
          </section>
        </div>

        {/* Detailed Metrics Table */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
             <h3 className="text-lg font-bold text-slate-900">Period Performance</h3>
             <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Export CSV</button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Month</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Growth</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Margin</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { month: 'Jun 2023', rev: '$48,290', growth: '-12%', margin: '35%', status: 'Warning' },
                { month: 'May 2023', rev: '$54,100', growth: '-8%', margin: '38%', status: 'Stable' },
                { month: 'Apr 2023', rev: '$62,400', growth: '+14%', margin: '42%', status: 'Peak' },
                { month: 'Mar 2023', rev: '$58,000', growth: '+22%', margin: '40%', status: 'Healthy' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{row.month}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{row.rev}</td>
                  <td className={`px-6 py-4 text-sm font-medium ${row.growth.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {row.growth}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{row.margin}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${
                      row.status === 'Warning' ? 'bg-rose-50 text-rose-600' : 
                      row.status === 'Peak' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </DashboardLayout>
  );
}
