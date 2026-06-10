"use client";

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { FileText, Download, Clock, CheckCircle2, ChevronRight, FilePieChart } from 'lucide-react';

export default function ReportsPage() {
  const reports = [
    { title: 'Q2 Executive Operational Review', date: 'June 10, 2023', type: 'Full Analysis', status: 'Ready' },
    { title: 'May Performance Audit', date: 'June 01, 2023', type: 'Monthly Audit', status: 'Archive' },
    { title: 'Q1 Comprehensive Risk Report', date: 'April 05, 2023', type: 'Risk Assessment', status: 'Archive' },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Executive Reports</h2>
            <p className="text-slate-500 mt-2">Downloadable consultant-grade reports based on your latest business data.</p>
          </div>
          <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2">
            Generate New Report <FileText size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-slate-200">
             <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <FilePieChart size={24} />
             </div>
             <h3 className="font-bold text-slate-900">Report Customization</h3>
             <p className="text-sm text-slate-500 mt-2 leading-relaxed">
               Configure the depth and focus areas of your generated reports. 
             </p>
             <div className="mt-6 space-y-3">
               {['Executive Summary', 'Financial Tables', 'Risk Heatmap'].map((opt, i) => (
                 <div key={i} className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded border border-indigo-500 bg-indigo-500 flex items-center justify-center">
                     <CheckCircle2 size={10} className="text-white" />
                   </div>
                   <span className="text-xs font-medium text-slate-700">{opt}</span>
                 </div>
               ))}
             </div>
          </div>

          <div className="md:col-span-2 space-y-4">
             {reports.map((report, idx) => (
               <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors flex items-center gap-6 group">
                 <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    <FileText size={28} />
                 </div>
                 <div className="flex-1">
                   <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{report.title}</h4>
                   <div className="flex items-center gap-3 mt-1">
                     <span className="text-xs text-slate-400 font-medium">{report.date}</span>
                     <span className="text-slate-200 text-xs">•</span>
                     <span className="text-xs text-slate-400 font-medium">{report.type}</span>
                   </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                      report.status === 'Ready' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {report.status}
                    </span>
                    <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                       <Download size={20} />
                    </button>
                    <ChevronRight className="text-slate-300" size={20} />
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
