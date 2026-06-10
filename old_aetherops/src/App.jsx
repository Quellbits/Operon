import React from 'react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import Dashboard from './components/Dashboard';
import CopilotChat from './components/CopilotChat';

function App() {
  return (
    <div className="flex h-screen w-screen bg-[#050507] text-white overflow-hidden selection:bg-violet-500/30">
      <Sidebar />
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <TopNav />
        <main className="flex-1 overflow-hidden">
          <Dashboard />
        </main>
        <CopilotChat />
      </div>
    </div>
  );
}

export default App;
