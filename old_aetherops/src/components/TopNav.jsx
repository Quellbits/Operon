import React from 'react';
import { Search, Bell, User, Command } from 'lucide-react';

const TopNav = () => {
  return (
    <div className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-black/20 backdrop-blur-md">
      <div className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2 w-96 group focus-within:border-violet-500/50 transition-all">
        <Search size={18} className="text-zinc-500 group-focus-within:text-violet-400" />
        <input 
          type="text" 
          placeholder="Ask AetherOps anything..." 
          className="bg-transparent border-none outline-none text-sm text-zinc-300 w-full"
        />
        <div className="flex items-center gap-1 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 text-[10px] text-zinc-500 font-bold">
          <Command size={10} />
          <span>K</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-zinc-400 hover:text-white transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-violet-500 rounded-full border-2 border-zinc-900"></span>
        </button>
        <div className="flex items-center gap-3 pl-6 border-l border-white/10">
          <div className="text-right">
            <p className="text-sm font-semibold text-white">Alex Rivera</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">COO - Stellar Corp</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-900 border border-zinc-700 flex items-center justify-center p-0.5">
            <div className="w-full h-full rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
               <User size={24} className="text-zinc-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNav;
