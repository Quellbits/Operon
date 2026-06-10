import React from 'react';
import { LayoutDashboard, Users, BarChart3, Settings, Zap, Compass, Database } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', active: true },
    { icon: <Compass size={20} />, label: 'Operations' },
    { icon: <BarChart3 size={20} />, label: 'Intelligence' },
    { icon: <Users size={20} />, label: 'Team' },
    { icon: <Database size={20} />, label: 'Datasets' },
    { icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className="w-64 h-full glass-panel border-r-0 rounded-none m-0 flex flex-col p-6 gap-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Zap className="text-white fill-white" size={24} />
        </div>
        <h1 className="text-xl font-bold tracking-tight gradient-text">AetherOps</h1>
      </div>

      <nav className="flex flex-col gap-2">
        {menuItems.map((item, index) => (
          <div
            key={index}
            className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
              item.active 
                ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.1)]' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40'
            }`}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </div>
        ))}
      </nav>

      <div className="mt-auto">
        <div className="p-4 glass-panel bg-zinc-900/40 border-zinc-800/50 rounded-2xl flex flex-col gap-3">
          <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Aether Cloud</p>
          <div className="flex justify-between items-center text-sm">
            <span>Utilization</span>
            <span className="text-cyan-400">76%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 w-[76%] rounded-full shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
