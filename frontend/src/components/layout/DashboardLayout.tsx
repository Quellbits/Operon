import React from 'react';
import { LayoutDashboard, FileUp, BarChart, AlertCircle, FileText, Settings, Users } from 'lucide-react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Overview', href: '/' },
    { icon: <FileUp size={20} />, label: 'Upload Data', href: '/upload' },
    { icon: <AlertCircle size={20} />, label: 'Insights', href: '/insights' },
    { icon: <BarChart size={20} />, label: 'Metrics', href: '/metrics' },
    { icon: <FileText size={20} />, label: 'Reports', href: '/reports' },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart className="text-indigo-400" />
            BizOps Copilot
          </h1>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          {menuItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {item.icon}
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
              AR
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-slate-200 truncate">Alex Rivera</p>
              <p className="text-xs text-slate-500 truncate">Stellar Corp</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <h2 className="text-lg font-semibold text-slate-800 capitalize">Overview</h2>
          <div className="flex items-center gap-4">
            <button className="text-sm font-medium text-slate-500 hover:text-slate-800">Need Help?</button>
            <div className="h-4 w-px bg-slate-200"></div>
            <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">PRO PLAN</div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
