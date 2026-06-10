import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const data = [
  { name: 'Mon', revenue: 4000, efficiency: 2400 },
  { name: 'Tue', revenue: 3000, efficiency: 1398 },
  { name: 'Wed', revenue: 2000, efficiency: 9800 },
  { name: 'Thu', revenue: 2780, efficiency: 3908 },
  { name: 'Fri', revenue: 1890, efficiency: 4800 },
  { name: 'Sat', revenue: 2390, efficiency: 3800 },
  { name: 'Sun', revenue: 3490, efficiency: 4300 },
];

const StatCard = ({ title, value, change, icon: Icon, color }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="glass-panel p-6 flex flex-col gap-4 group cursor-default shadow-sm border-white/5"
  >
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-xl bg-${color}-500/10 text-${color}-400 group-hover:scale-110 transition-transform duration-300`}>
        <Icon size={24} />
      </div>
      <div className={`flex items-center gap-1 text-sm ${change.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'} font-medium`}>
        {change}
        {change.startsWith('+') ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
      </div>
    </div>
    <div>
      <p className="text-zinc-400 text-sm font-medium">{title}</p>
      <h3 className="text-2xl font-bold mt-1">{value}</h3>
    </div>
  </motion.div>
);

const Dashboard = () => {
  return (
    <div className="p-8 flex flex-col gap-8 h-full overflow-y-auto no-scrollbar pb-24">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Operational Overview</h2>
        <p className="text-zinc-500 mt-1">Hello Alex, here's what's happening in your business today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value="$42,890" change="+12.5%" icon={DollarSign} color="violet" />
        <StatCard title="System Efficiency" value="94.2%" change="+2.1%" icon={Activity} color="cyan" />
        <StatCard title="Avg. Response" value="1.2s" change="-18%" icon={Clock} color="indigo" />
        <StatCard title="Workflow Health" value="Stable" change="+4.2%" icon={TrendingUp} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
        {/* Main Chart */}
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col gap-4 border-white/5">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-lg font-semibold">Growth Trend</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                <span className="text-xs text-zinc-400">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                <span className="text-xs text-zinc-400">Efficiency</span>
              </div>
            </div>
          </div>
          <div className="flex-1 w-full h-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                <Area type="monotone" dataKey="efficiency" stroke="#06b6d4" fillOpacity={1} fill="url(#colorEff)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Insight Box */}
        <div className="glass-panel p-6 flex flex-col gap-6 border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/20 text-violet-400">
               <AlertTriangle size={20} />
            </div>
            <h3 className="font-semibold text-lg">AI Anomalies</h3>
          </div>
          
          <div className="flex flex-col gap-4 flex-1">
            <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-violet-400 uppercase tracking-widest leading-none">High Priority</span>
                <span className="text-[10px] text-zinc-500">2m ago</span>
              </div>
              <p className="text-sm font-medium">Inventory dip detected in Region 4. Projected stockout in 3 days.</p>
              <button className="text-xs text-zinc-400 hover:text-white mt-2 flex items-center gap-1 transition-colors">
                View Solutions <ArrowUpRight size={12} />
              </button>
            </div>

            <div className="p-4 bg-zinc-900/50 rounded-xl border border-white/5 flex flex-col gap-2 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest leading-none">Efficiency</span>
                <span className="text-[10px] text-zinc-500">1h ago</span>
              </div>
              <p className="text-sm font-medium">Auto-scaling recommendation for cloud infrastructure in US-East.</p>
            </div>
          </div>

          <button className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-600/20 transition-all">
            Resolve Anomalies
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
