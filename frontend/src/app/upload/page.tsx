"use client";

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CloudUpload, FileCheck, HelpCircle, ArrowRight } from 'lucide-react';

export default function UploadPage() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">Ingest Business Data</h2>
          <p className="text-slate-500 mt-2 max-w-md mx-auto">
            Upload your operational Excel or CSV files. We'll automatically detect your schema and map your business fields.
          </p>
        </div>

        {/* Upload Zone */}
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center hover:border-indigo-400 hover:bg-slate-50 transition-all cursor-pointer group">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <CloudUpload size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Drop your files here</h3>
          <p className="text-slate-500 mt-1">Support for .csv and .xlsx up to 50MB</p>
          <button className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all">
            Select Files
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
           <div className="bg-white p-6 rounded-2xl border border-slate-200">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FileCheck size={20} />
                </div>
                <h4 className="font-bold text-slate-900">Canonical Mapping</h4>
             </div>
             <p className="text-sm text-slate-500 leading-relaxed">
               Our engine maps your unique column names (e.g. "Net Revenue") to our standardized business fields (e.g. "revenue") for deterministic analysis.
             </p>
           </div>

           <div className="bg-white p-6 rounded-2xl border border-slate-200">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                   <HelpCircle size={20} />
                </div>
                <h4 className="font-bold text-slate-900">Industry Agnostic</h4>
             </div>
             <p className="text-sm text-slate-500 leading-relaxed">
               Whether you're in Retail, SaaS, or Distribution, we normalize your data into a common model to provide consistent reporting.
             </p>
           </div>
        </div>

        {/* Step Preview (Mapping Confirmation mock) */}
        <section className="bg-slate-900 p-8 rounded-3xl text-white">
           <div className="flex justify-between items-center mb-8">
             <div>
               <h3 className="text-xl font-bold">Automatic Schema Detection</h3>
               <p className="text-slate-400 text-sm">Review detected fields for 'Q2_Sales_v2.csv'</p>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                <span className="text-xs font-bold text-indigo-400">92% CONFIDENCE</span>
             </div>
           </div>

           <div className="space-y-3">
             {[
               { file: 'Invoice_Date', mapped: 'date' },
               { file: 'Total_Price_Net', mapped: 'revenue' },
               { file: 'Account_Name', mapped: 'customer' },
               { file: 'Qty', mapped: 'quantity' },
             ].map((mapping, idx) => (
               <div key={idx} className="flex items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-700">
                 <div className="flex items-center gap-4">
                   <span className="text-sm font-mono text-slate-400">{mapping.file}</span>
                   <ArrowRight size={14} className="text-slate-600" />
                   <span className="text-sm font-bold text-indigo-400 underline decoration-dotted underline-offset-4">{mapping.mapped}</span>
                 </div>
                 <button className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-wider">Modify</button>
               </div>
             ))}
           </div>

           <button className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2">
             Begin Intelligence Processing <ArrowRight size={18} />
           </button>
        </section>
      </div>
    </DashboardLayout>
  );
}
