"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Sparkles, ChevronDown, RotateCcw, Loader2, Bot } from 'lucide-react';
import Logo from './Logo';
import { API_BASE } from '@/config';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  streaming?: boolean;
  commands?: { command: string; value: string }[];
}

interface AIAgentProps {
  mode?: 'dashboard' | 'report';
  context?: Record<string, any>;
}

const SUGGESTED_PROMPTS: Record<string, string[]> = {
  dashboard: [
    "What are my biggest cost leakages?",
    "Summarize my revenue health",
    "Which vendors need renegotiation?",
    "What needs my attention right now?",
    "How can I improve my audit score?",
  ],
  report: [
    "Explain the key findings in this report",
    "What's causing the revenue decline?",
    "Which anomalies are most critical?",
    "Give me a 3-step action plan",
    "What's the financial impact of these issues?",
  ],
};

const ARIA_GREETINGS: Record<string, string> = {
  dashboard: "**ARIA online.** I'm your embedded operations analyst. I can detect cost leakages, analyze revenue health, flag vendor drift, and surface critical insights from your data.\n\nHow can I help you today?",
  report: "**ARIA connected to your report.** I have visibility into the analysis being generated. Ask me anything about the findings — anomalies, root causes, financial impact, or recommended actions.",
};

export default function AIAgent({ mode = 'dashboard', context }: AIAgentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [pulseActive, setPulseActive] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Show greeting when panel opens for first time
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      setHasGreeted(true);
      setPulseActive(false);
      const greeting: Message = {
        id: `greeting-${Date.now()}`,
        role: 'assistant',
        content: ARIA_GREETINGS[mode],
        timestamp: new Date(),
      };
      setMessages([greeting]);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, hasGreeted, mode]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    const assistantMsgId = `aria-${Date.now()}`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      streaming: true,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setIsStreaming(true);

    // Build history for context (exclude greeting)
    const history = [...messages.filter(m => m.id !== `greeting-${Date.now()}`), userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    abortRef.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: history,
          context: (typeof window !== 'undefined' ? (window as any).operonSimulationState : null) || context || null,
          mode,
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let accumulatedRaw = '';
      const processedCommands = new Set<string>();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.token) {
              accumulatedRaw += parsed.token;

              // Parse matches
              const regex = /\[CMD:([A-Z0-9_]+)=([^\]]+)\]/g;
              let match;
              const matches: { command: string; value: string }[] = [];

              regex.lastIndex = 0;
              while ((match = regex.exec(accumulatedRaw)) !== null) {
                const rawCmd = match[0];
                const cmdName = match[1];
                const cmdVal = match[2].replace(/^"|"$/g, '');

                matches.push({ command: cmdName, value: cmdVal });

                if (!processedCommands.has(rawCmd)) {
                  processedCommands.add(rawCmd);
                  console.log("AIAgent: Intercepted command:", cmdName, cmdVal);
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('operon-agent-command', {
                      detail: { command: cmdName, value: cmdVal }
                    }));
                  }
                }
              }

              // Strip completed tags
              let displayVal = accumulatedRaw.replace(/\[CMD:[A-Z0-9_]+=[^\]]+\]/g, '');
              // Temporarily hide partial unclosed tags at the end
              const lastOpenBracket = displayVal.lastIndexOf('[');
              if (lastOpenBracket !== -1 && lastOpenBracket > displayVal.lastIndexOf(']')) {
                displayVal = displayVal.substring(0, lastOpenBracket);
              }

              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, content: displayVal.trim(), commands: matches.length > 0 ? matches : undefined, streaming: true }
                    : m
                )
              );
            }
            if (parsed.error) {
              const errMsg = `⚠️ ${parsed.error}`;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, content: errMsg, streaming: false }
                    : m
                )
              );
            }
          } catch {}
        }
      }

      // Mark streaming complete
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, streaming: false }
            : m
        )
      );
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId
              ? { ...m, content: '⚠️ Connection error. Make sure the backend server is running at port 8000.', streaming: false }
              : m
          )
        );
      }
    } finally {
      setIsStreaming(false);
    }
  }, [messages, isStreaming, context, mode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleClear = () => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages([]);
    setHasGreeted(false);
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-zinc-800 px-1 rounded text-orange-300 text-[10px] font-bold font-mono">$1</code>')
      .replace(/\n\n/g, '</p><p class="mt-2">')
      .replace(/\n/g, '<br/>')
      .replace(/^- (.*)/gm, '<span class="flex gap-1.5 mt-0.5"><span class="text-orange-400 shrink-0">•</span><span class="text-zinc-200">$1</span></span>');
  };

  const showSuggestions = messages.length <= 1 && !isStreaming;

  return (
    <>
      {/* Floating trigger button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {/* Tooltip label when closed */}
        {!isOpen && (
          <div className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-[10px] font-mono px-2.5 py-1 rounded-full tracking-wider animate-fade-in font-bold">
            ARIA · OPS ANALYST
          </div>
        )}

        <button
          onClick={() => setIsOpen(o => !o)}
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 group"
          style={{
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #f59e0b 100%)',
            boxShadow: '0 0 30px rgba(249,115,22,0.4), 0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          {/* Pulse ring */}
          {pulseActive && !isOpen && (
            <span className="absolute inset-0 rounded-full animate-ping opacity-30"
              style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
            />
          )}
          {isOpen ? (
            <ChevronDown size={22} className="text-white" />
          ) : (
            <Sparkles size={20} className="text-white" />
          )}
        </button>
      </div>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-24 right-6 z-50 w-[380px] flex flex-col rounded-2xl overflow-hidden transition-all duration-300 ease-out ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
        style={{
          height: '520px',
          background: 'rgba(9,9,11,0.97)',
          border: '1px solid rgba(249,115,22,0.25)',
          boxShadow: '0 0 60px rgba(249,115,22,0.15), 0 32px 64px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0 border-b border-zinc-800/60"
          style={{
            background: 'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(234,88,12,0.08) 100%)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #f59e0b 100%)',
                boxShadow: '0 0 12px rgba(249,115,22,0.4)',
              }}
            >
              <Bot size={14} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-xs font-mono tracking-wider">ARIA</p>
              <p className="text-[9px] text-orange-400 font-mono tracking-widest font-bold">
                {isStreaming ? (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
                    ANALYZING...
                  </span>
                ) : 'OPERATIONS ANALYST · GPT-4o'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleClear}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors rounded"
              title="Clear conversation"
            >
              <RotateCcw size={13} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors rounded"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Mode badge */}
        <div className="px-4 py-2 border-b border-zinc-900/60 shrink-0">
          <span
            className={`text-[9px] font-mono tracking-widest px-2 py-0.5 rounded border font-bold ${
              mode === 'report'
                ? 'text-amber-400 border-amber-500/20 bg-amber-500/5'
                : 'text-orange-400 border-orange-500/20 bg-orange-500/5'
            }`}
          >
            {mode === 'report' ? '◉ REPORT_CONTEXT_ACTIVE' : '◎ DASHBOARD_MODE'}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 font-sans"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272a transparent' }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              {msg.role === 'assistant' && (
                <div
                  className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #f97316, #ea580c, #f59e0b)',
                  }}
                >
                  <Bot size={10} className="text-white" />
                </div>
              )}

              <div
                className={`max-w-[85%] px-3 py-2.5 rounded-xl text-[12px] leading-relaxed font-medium ${
                  msg.role === 'user'
                    ? 'bg-orange-500/10 border border-orange-500/20 text-zinc-100 rounded-tr-sm font-semibold'
                    : 'bg-zinc-900/95 border border-zinc-800/80 text-zinc-100 rounded-tl-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div>
                    <div
                      dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(msg.content)}</p>` }}
                    />
                    {msg.commands && msg.commands.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex flex-wrap gap-1.5">
                        {msg.commands.map((cmd, idx) => (
                          <span
                            key={idx}
                            className="text-[8px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/25 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1 hover:bg-orange-500/15 transition-all"
                          >
                            <span className="w-1 h-1 bg-orange-400 rounded-full animate-ping" />
                            {cmd.command.replace('SET_', '')}: {cmd.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
                {msg.streaming && (
                  <span
                    className="inline-block w-1.5 h-3.5 ml-0.5 rounded-sm align-middle animate-pulse"
                    style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                  />
                )}
              </div>
            </div>
          ))}

          {/* Suggested prompts */}
          {showSuggestions && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[9px] text-zinc-500 font-mono tracking-widest font-bold">SUGGESTED_QUERIES</p>
              {SUGGESTED_PROMPTS[mode].map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestion(prompt)}
                  className="w-full text-left text-[11px] text-zinc-300 hover:text-orange-400 bg-zinc-900/80 hover:bg-orange-500/5 border border-zinc-800 hover:border-orange-500/30 rounded-lg px-3 py-2 transition-all duration-200 font-sans font-medium"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <form
          onSubmit={handleSubmit}
          className="px-3 py-3 border-t border-zinc-800/60 shrink-0 flex items-center gap-2"
          style={{ background: 'rgba(9,9,11,0.8)' }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask ARIA anything..."
            disabled={isStreaming}
            className="flex-1 bg-zinc-900/90 border border-zinc-750 focus:border-orange-500/50 rounded-xl px-3.5 py-2.5 text-[12px] text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all font-sans font-medium"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all disabled:opacity-30"
            style={{
              background: input.trim() && !isStreaming
                ? 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #f59e0b 100%)'
                : '#18181b',
              border: '1px solid rgba(249,115,22,0.3)',
              boxShadow: input.trim() && !isStreaming ? '0 0 16px rgba(249,115,22,0.3)' : 'none',
            }}
          >
            {isStreaming ? (
              <Loader2 size={14} className="text-orange-400 animate-spin" />
            ) : (
              <Send size={13} className="text-white" />
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </>
  );
}
