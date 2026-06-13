"use client";

import React, { useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import Logo from '../../components/Logo';

export default function PricingPage() {
  const [activeTier, setActiveTier] = useState<number>(1); // default to Audit Professional

  // Coordinates data for grid lines
  const vLines = ['10%', '25%', '40%', '55%', '70%', '85%'];
  const hLines = ['12%', '28%', '48%', '68%', '85%'];

  const tiers = [
    {
      name: "SANDBOX_INIT",
      price: "$0",
      description: "For startups and small ledgers needing basic validation.",
      features: [
        "Up to 5 file uploads per month",
        "Single user workspace",
        "Standard schema mapping confidence",
        "Basic P&L health scores",
        "Email support response (48h)"
      ],
      cta: "START_FREE_TRIAL",
      popular: false
    },
    {
      name: "AUDIT_PROFESSIONAL",
      price: "$15",
      description: "For growing companies requiring comprehensive audits.",
      features: [
        "Up to 50 file uploads per month",
        "3 workspace member accounts",
        "Advanced deterministic price checking",
        "Query-based custom analytics",
        "Executive PDF report downloads",
        "Priority support response (12h)"
      ],
      cta: "UPGRADE_TO_PRO",
      popular: true
    },
    {
      name: "ENTERPRISE_COMMAND",
      price: "$35",
      description: "For multi-branch corporations auditing high volumes.",
      features: [
        "Unlimited file uploads & processing",
        "Unlimited team members",
        "Dedicated isolated database storage",
        "Custom rule-engine scripts integration",
        "Automated vendor contract checks",
        "24/7 dedicated engineer support"
      ],
      cta: "DEPLOY_ENTERPRISE",
      popular: false
    },
    {
      name: "QUANT_INTELLIGENCE",
      price: "$100",
      description: "For quantitative operational reviews and maximum throughput.",
      features: [
        "Real-time API callbacks & streams",
        "Multi-tenant isolated databases",
        "Dedicated SLA (99.9% uptime)",
        "SOX/ISO compliance report templates",
        "Custom AI training metrics",
        "Direct executive-level support"
      ],
      cta: "ACTIVATE_QUANT",
      popular: false
    }
  ];

  const handleSelectPlan = (tier: typeof tiers[0]) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    const finalTier = encodeURIComponent(tier.name);
    const finalPrice = encodeURIComponent(tier.price);

    if (token) {
      // Already logged in, go directly to checkout page
      window.location.href = `/checkout?tier=${finalTier}&price=${finalPrice}`;
    } else {
      // Not logged in, go to signup page first and pass redirect destination
      window.location.href = `/signup?redirect_to=checkout&tier=${finalTier}&price=${finalPrice}`;
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-orange-500/30 selection:text-orange-200 overflow-x-hidden relative">
      
      {/* CSS Styles for laser sweep and grid data packets */}
      <style>{`
        @keyframes scan-sweep {
          0% { top: -5%; opacity: 0; }
          10% { opacity: 0.15; }
          90% { opacity: 0.15; }
          100% { top: 105%; opacity: 0; }
        }
        .laser-glow {
          box-shadow: 0 0 15px 1px rgba(249, 115, 22, 0.3);
        }
      `}</style>

      {/* Coordinate Layout Grid Lines Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {vLines.map((left, idx) => (
          <div key={`v-${idx}`} className="absolute top-0 bottom-0 w-[1px] bg-zinc-900/40" style={{ left }} />
        ))}
        {hLines.map((top, idx) => (
          <div key={`h-${idx}`} className="absolute left-0 right-0 h-[1px] bg-zinc-900/40" style={{ top }} />
        ))}
        {vLines.map((left) => 
          hLines.map((top, hidx) => (
            <span key={`cross-${left}-${hidx}`} className="absolute text-zinc-800 font-mono text-[10px] select-none transform -translate-x-1/2 -translate-y-1/2" style={{ left, top }}>
              +
            </span>
          ))
        )}
      </div>

      {/* Scanning laser line sweep */}
      <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent pointer-events-none z-0 laser-glow" style={{ animation: 'scan-sweep 18s linear infinite' }} />

      {/* Header */}
      <header className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-zinc-900 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={20} />
            <a href="/" className="font-bold text-xs tracking-tight text-white uppercase flex items-baseline gap-1.5">
              OPERON <span className="text-[7px] text-zinc-650 tracking-wider">PRICING</span>
            </a>
          </div>
          
          <nav className="flex items-center gap-6 text-[10px] tracking-wider text-zinc-400">
            <a href="/" className="hover:text-white transition-colors">HOME</a>
            <a href="/#console" className="hover:text-white transition-colors">CONSOLE</a>
            <a href="/#how-it-works" className="hover:text-white transition-colors">PIPELINE</a>
          </nav>

          <div>
            <button onClick={() => window.location.href = "/dashboard"} className="text-[9px] border border-zinc-800 hover:border-zinc-650 text-zinc-300 hover:text-white bg-zinc-950 px-4 py-1.5 rounded transition-all">
              CONSOLE_DASHBOARD
            </button>
          </div>
        </div>
      </header>

      {/* Pricing workspace */}
      <main className="max-w-7xl mx-auto px-6 py-20 relative z-10 space-y-16">
        
        {/* Intro */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900/60 border border-zinc-800 rounded text-[9px] text-zinc-500 tracking-widest uppercase">
            OPERATIONS_INGEST_TARIFFS // SECURITY_LEVEL = 4
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-light tracking-tight leading-none text-white uppercase">
            PLAN_TARIFF_MATRIX
          </h1>
          
          <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-lg mx-auto font-sans normal-case">
            Deterministic operations intelligence requires transparent, predictable computing nodes. Choose the tier aligned with your transaction log volume.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
          {tiers.map((tier, idx) => {
            const isSelected = activeTier === idx;
            return (
              <div 
                key={idx}
                onClick={() => setActiveTier(idx)}
                className={`bg-zinc-950 border rounded p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 relative group text-left ${
                  isSelected 
                    ? 'border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.08)] bg-zinc-950/80 scale-[1.01]' 
                    : 'border-zinc-900 bg-zinc-950/30 hover:border-zinc-700'
                }`}
              >
                {/* Corner markers */}
                <div className={`absolute top-0 left-0 w-2.5 h-2.5 border-t border-l ${isSelected ? 'border-orange-500' : 'border-zinc-800 group-hover:border-zinc-600'}`} />
                <div className={`absolute top-0 right-0 w-2.5 h-2.5 border-t border-r ${isSelected ? 'border-orange-500' : 'border-zinc-800 group-hover:border-zinc-600'}`} />
                <div className={`absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l ${isSelected ? 'border-orange-500' : 'border-zinc-800 group-hover:border-zinc-600'}`} />
                <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r ${isSelected ? 'border-orange-500' : 'border-zinc-800 group-hover:border-zinc-600'}`} />

                {tier.popular && (
                  <span className="absolute top-4 right-4 bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[7px] font-bold px-2 py-0.5 rounded tracking-widest uppercase animate-pulse">
                    RECOMMENDED_NODE
                  </span>
                )}

                <div className="space-y-6">
                  {/* Title and pricing */}
                  <div>
                    <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{tier.name}</h3>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-3xl font-light text-white tracking-tight">{tier.price}</span>
                      <span className="text-zinc-600 text-[9px] ml-2 font-mono">/ MONTH</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 font-sans normal-case mt-3 leading-relaxed min-h-[48px]">{tier.description}</p>
                  </div>

                  <div className="border-t border-zinc-900 my-2" />

                  {/* Features List */}
                  <ul className="space-y-2 font-sans normal-case text-xs text-zinc-400">
                    {tier.features.map((feature, fidx) => (
                      <li key={fidx} className="flex gap-2 items-start">
                        <Check size={10} className="text-orange-400 shrink-0 mt-0.5" />
                        <span className="font-light text-[11px] leading-tight">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPlan(tier);
                    }}
                    className={`w-full py-2.5 rounded font-mono font-bold text-[10px] transition-all flex items-center justify-center gap-1.5 ${
                      isSelected 
                        ? 'bg-orange-500 hover:bg-orange-600 text-black shadow-md shadow-orange-500/15' 
                        : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                    }`}
                  >
                    {tier.cta} <ArrowRight size={10} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Specs Accordion FAQ */}
        <section className="pt-16 border-t border-zinc-900 max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">TARIFFS_SPECIFICATIONS_FAQ</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-zinc-950/40 p-5 rounded border border-zinc-900 text-left space-y-2 relative">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
              <h4 className="text-xs font-bold text-zinc-300 uppercase flex items-center gap-2">
                Can I cancel my node plan at any time?
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans normal-case">
                Yes. Operon subscriptions operate on a month-to-month period. You can downgrade, upgrade, or cancel billing parameters at any point within the organization console settings.
              </p>
            </div>

            <div className="bg-zinc-950/40 p-5 rounded border border-zinc-900 text-left space-y-2 relative">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-800" />
              <h4 className="text-xs font-bold text-zinc-300 uppercase flex items-center gap-2">
                Are there limits on file row volumes?
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans normal-case">
                Sandbox Init supports spreadsheets containing up to 10,000 transaction rows. Audit Professional extends rows parsing capacity up to 500,000 transaction rows per file batch.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-black py-12 relative z-10 text-[10px] font-mono text-zinc-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span className="font-bold text-zinc-300">OPERON</span>
          </div>
          <p className="text-zinc-650">© 2026 Operon Inc. All rights reserved. Operations Intelligence & Business Auditing Layer.</p>
          <div className="flex items-center gap-4">
            <a href="/" className="hover:text-zinc-300 transition-colors">HOME</a>
            <a href="/#console" className="hover:text-zinc-300 transition-colors">CONSOLE</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
