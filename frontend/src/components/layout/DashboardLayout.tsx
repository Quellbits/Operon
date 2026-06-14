"use client";

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileUp, BarChart, AlertCircle, FileText, Menu, X, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import Logo from '../Logo';
import AIAgent from '../AIAgent';
import { API_BASE } from '@/config';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userPlan, setUserPlan] = useState<string>("SANDBOX_INIT");
  const [storageUsed, setStorageUsed] = useState<number>(0);
  const [storageLimit, setStorageLimit] = useState<number>(10);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const savedPlan = localStorage.getItem("user_plan");
      if (savedPlan) {
        setUserPlan(savedPlan);
      }
    }
    const seedAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        // Fetch active organization details
        try {
          const res = await fetch(`${API_BASE}/organizations/active`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUserPlan(data.plan);
            setStorageUsed(data.storage_used);
            setStorageLimit(data.storage_limit);
            localStorage.setItem("user_plan", data.plan);
          }
        } catch (err) {
          console.error("Failed to fetch organization info", err);
        }
        return;
      }
      
      try {
        await fetch(`${API_BASE}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "operon_default@example.com",
            password: "defaultpassword123",
            full_name: "Default Demo User"
          })
        });
      } catch (err) {
        console.log("Signup check:", err);
      }
      
      try {
        const formBody = new URLSearchParams();
        formBody.append("username", "operon_default@example.com");
        formBody.append("password", "defaultpassword123");
        
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formBody
        });
        
        if (loginRes.ok) {
          const loginData = await loginRes.json();
          if (loginData.access_token) {
            localStorage.setItem("token", loginData.access_token);
            console.log("Auto-seeded auth token.");
            window.location.reload();
          }
        }
      } catch (err) {
        console.error("Auto-login failed:", err);
      }
    };
    
    seedAuth();
  }, []);

  const menuItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Overview', href: '/dashboard' },
    { icon: <FileUp size={18} />, label: 'Upload Data', href: '/upload' },
    { icon: <AlertCircle size={18} />, label: 'Insights', href: '/insights' },
    { icon: <BarChart size={18} />, label: 'Metrics', href: '/metrics' },
    { icon: <FileText size={18} />, label: 'Reports', href: '/reports' },
  ];

  const getHeaderTitle = () => {
    if (!mounted || typeof window === "undefined") return "OVERVIEW";
    const path = window.location.pathname;
    if (path === "/upload") return "UPLOAD_AND_INGEST";
    if (path === "/insights") return "OPERATIONAL_INSIGHTS";
    if (path === "/metrics") return "OPERATIONAL_METRICS";
    if (path === "/reports") return "EXECUTIVE_REPORTS";
    return "OPERATIONS_OVERVIEW";
  };

  const getActiveState = (href: string) => {
    if (!mounted || typeof window === "undefined") return false;
    return window.location.pathname === href;
  };

  return (
    <div className="flex h-screen bg-black text-zinc-100 font-sans relative overflow-hidden">
      
      {/* Dynamic scan line inside main panel */}
      <style>{`
        @keyframes header-scan {
          0% { left: -5%; opacity: 0; }
          10% { opacity: 0.1; }
          90% { opacity: 0.1; }
          100% { left: 105%; opacity: 0; }
        }
        .header-laser {
          box-shadow: 0 0 10px 1px rgba(99, 102, 241, 0.2);
        }
      `}</style>

      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-zinc-950 border-r border-zinc-900 text-zinc-300 flex flex-col transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo and system status */}
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between shrink-0">
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2.5 font-mono">
              <Logo size={20} />
              OPERON
            </h1>
            <span className="text-[8px] text-zinc-500 font-mono tracking-widest pl-7 mt-0.5 uppercase">Operations Dashboard</span>
          </div>
          <button 
            className="p-1 text-zinc-500 hover:text-white md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1 font-mono text-[11px] uppercase tracking-wider">
          {menuItems.map((item) => {
            const isActive = getActiveState(item.href);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded transition-all ${
                  isActive 
                		? 'bg-orange-500/15 text-orange-450 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.08)] font-bold' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent font-medium'
                }`}
              >
                <span className={isActive ? 'text-orange-400' : 'text-zinc-500'}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile section */}
        <div className="p-4 border-t border-zinc-900 bg-black/40 space-y-4">
          {/* Storage Usage Progress */}
          <div className="font-mono text-[9px] text-zinc-500 text-left space-y-1.5 px-1">
            <div className="flex justify-between font-bold">
              <span>STORAGE_CAPACITY</span>
              <span className="text-zinc-350">{storageUsed.toFixed(2)}MB / {storageLimit}MB</span>
            </div>
            <div className="w-full bg-zinc-900 border border-zinc-750 h-2 rounded overflow-hidden relative">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-amber-600 h-full transition-all duration-500" 
                  style={{ width: `${Math.min((storageUsed / storageLimit) * 100, 100)}%` }} 
                />
              </div>
            <div className="text-[7px] text-zinc-650 tracking-wider">
              {Math.min((storageUsed / storageLimit) * 100, 100).toFixed(1)}% OF STORAGE ALLOCATION USED
            </div>
          </div>

          <div className="flex items-center gap-3 p-2 rounded border border-zinc-900 bg-zinc-950/40 transition-colors font-mono">
            <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300">
              AR
            </div>
            <div className="flex-1 overflow-hidden text-left">
              <p className="text-xs font-bold text-zinc-200 truncate">Alex Rivera</p>
              <p className="text-[9px] text-zinc-500 truncate uppercase">STELLAR_CORP</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Coordinate horizontal/vertical divider grids in background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />
        
        {/* Thin crosshairs at fixed layout bounds */}
        <div className="absolute left-[30%] top-0 bottom-0 w-[1px] bg-zinc-800/20 pointer-events-none" />
        <div className="absolute left-[70%] top-0 bottom-0 w-[1px] bg-zinc-800/20 pointer-events-none" />
        <div className="absolute top-[40%] left-0 right-0 h-[1px] bg-zinc-800/20 pointer-events-none" />
        
        <span className="absolute left-[30%] top-[40%] text-zinc-750 font-mono text-[10px] select-none pointer-events-none transform -translate-x-1/2 -translate-y-1/2">+</span>
        <span className="absolute left-[70%] top-[40%] text-zinc-750 font-mono text-[10px] select-none pointer-events-none transform -translate-x-1/2 -translate-y-1/2">+</span>

        {/* Header */}
        <header className="h-16 bg-black border-b border-zinc-900 flex items-center justify-between px-8 shrink-0 relative z-10">
          <div className="flex items-center">
            <button 
              className="p-2 -ml-2 mr-3 text-zinc-500 hover:text-white md:hidden focus:outline-none"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h2 className="text-xs font-mono font-bold tracking-widest text-white uppercase">{getHeaderTitle()}</h2>
          </div>
          
          <div className="flex items-center gap-4 font-mono text-[9px] tracking-wider text-zinc-500">
            <Link href="/pricing" className="hover:text-white uppercase transition-colors">
              SYS.PRICING
            </Link>
            <div className="h-3 w-px bg-zinc-900"></div>
            <button 
              onClick={() => alert("Help documentation is available under standard user console.")}
              className="hover:text-white uppercase transition-colors"
            >
              SYS.HELP
            </button>
            <div className="h-3 w-px bg-zinc-900"></div>
            <div className="text-orange-405 bg-orange-500/15 border border-orange-500/30 px-2.5 py-0.5 rounded font-bold uppercase">
              {userPlan}
            </div>
          </div>
        </header>
        
        {/* Content canvas container */}
        <div className="flex-1 overflow-y-auto p-6 relative z-10 bg-black/25">
          {children}
        </div>
      </main>

      {/* ARIA — Floating AI Operations Analyst */}
      <AIAgent mode="dashboard" />
    </div>
  );
};

export default DashboardLayout;
