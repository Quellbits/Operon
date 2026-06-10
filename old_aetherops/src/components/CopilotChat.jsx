import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare, Bot, User, X, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CopilotChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm your AetherOps Copilot. How can I help you optimize your operations today?" }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Based on current trends, I recommend increasing inventory for the Q3 peak by 15%.",
        "Your team's efficiency has increased by 4% after the latest workflow adjustment.",
        "I've identified a bottleneck in the fulfillment process. Would you like to see a process map?",
        "Revenue projections for this month are looking strong, estimated at $54,000."
      ];
      const randomResponse = { 
        role: 'assistant', 
        content: responses[Math.floor(Math.random() * responses.length)] 
      };
      setMessages(prev => [...prev, randomResponse]);
    }, 1000);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-8 right-8 w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white shadow-2xl shadow-violet-500/40 z-50 border border-white/20"
        >
          <Bot size={28} />
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-8 right-8 w-[400px] h-[600px] glass-panel flex flex-col z-50 overflow-hidden border-violet-500/30"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">AetherOps Copilot</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">AI Thinking</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsOpen(false)} className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 no-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.role === 'assistant' ? 'bg-violet-500/20 text-violet-400' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm max-w-[80%] ${
                    msg.role === 'assistant' 
                    ? 'bg-zinc-900/50 border border-white/5 text-zinc-200' 
                    : 'bg-violet-600 text-white'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 bg-black/20">
              <div className="flex items-center gap-2 bg-zinc-900/80 border border-white/5 rounded-xl px-4 py-3 focus-within:border-violet-500/50 transition-all">
                <input
                  type="text"
                  placeholder="Ask me about your operations..."
                  className="bg-transparent border-none outline-none text-sm w-full text-white"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} className="text-violet-400 hover:text-violet-300 transition-colors">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CopilotChat;
