"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';
import Logo from '../../components/Logo';
import { API_BASE } from '@/config';

function CheckoutForm() {
  const searchParams = useSearchParams();
  const tierName = searchParams.get("tier") || "AUDIT_PROFESSIONAL";
  const tierPrice = searchParams.get("price") || "$15";

  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("242");
  const [cardName, setCardName] = useState("Alex Rivera");
  
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");

  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState("");

  const handleApplyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (code === "FREEACCESS" || code === "OPERONFREE" || code === "PROMO100") {
      setPromoApplied(true);
      setPromoError("");
    } else {
      setPromoError("Invalid promo code.");
    }
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (processing) return;
    setProcessing(true);

    if (promoApplied) {
      setStatus("Applying free access promo...");
      setTimeout(() => {
        setStatus("Activating premium node plan...");
        setTimeout(async () => {
          // Sync plan with the database
          const token = localStorage.getItem("token");
          if (token) {
            try {
              await fetch(`${API_BASE}/organizations/plan`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ plan: tierName })
              });
            } catch (err) {
              console.error("Failed to sync plan to backend", err);
            }
          }

          // Store active plan in localStorage
          localStorage.setItem("user_plan", tierName);
          localStorage.setItem("user_plan_price", "Free (Promo)");
          
          // Redirect to dashboard
          window.location.href = "/dashboard?payment=success";
        }, 1000);
      }, 1000);
      return;
    }

    setStatus("Verifying card parameters...");

    setTimeout(() => {
      setStatus("Authorizing payment via Stripe gateway...");
      setTimeout(() => {
        setStatus("Payment confirmed. Activating node...");
        setTimeout(async () => {
          // Sync plan with the database
          const token = localStorage.getItem("token");
          if (token) {
            try {
              await fetch(`${API_BASE}/organizations/plan`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ plan: tierName })
              });
            } catch (err) {
              console.error("Failed to sync plan to backend", err);
            }
          }

          // Store active plan in localStorage
          localStorage.setItem("user_plan", tierName);
          localStorage.setItem("user_plan_price", tierPrice);
          
          // Redirect to dashboard
          window.location.href = "/dashboard?payment=success";
        }, 1200);
      }, 1200);
    }, 1200);
  };

  const getCleanPrice = () => {
    return tierPrice.replace(/[^0-9]/g, "");
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex flex-col md:flex-row relative">
      
      {/* Back button */}
      <a 
        href="/pricing" 
        className="absolute top-6 left-6 text-[10px] text-zinc-500 hover:text-white flex items-center gap-1.5 font-mono z-25 transition-colors uppercase tracking-widest font-bold"
      >
        <ArrowLeft size={14} className="text-zinc-650" /> Back to pricing
      </a>

      {/* Left side: Stripe Product summary (Slate background) */}
      <div className="w-full md:w-5/12 bg-zinc-950 border-r border-zinc-900 text-zinc-300 p-8 sm:p-12 lg:p-16 flex flex-col justify-between min-h-[300px] md:min-h-screen relative">
        
        {/* Coordinate Layout lines in background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />
        
        {/* Logo */}
        <div className="flex items-center gap-2 mb-12 relative z-10">
          <Logo size={20} />
          <span className="font-bold text-xs tracking-widest text-white font-mono uppercase">OPERON</span>
        </div>

        {/* Product specs */}
        <div className="space-y-6 my-auto text-left relative z-10">
          <div>
            <span className="text-[9px] text-zinc-500 uppercase font-mono tracking-widest block">Subscribe to Node</span>
            <h1 className="text-2xl font-bold text-white mt-1.5 font-mono tracking-wider">{tierName}</h1>
          </div>

          <div className="flex items-baseline border-b border-zinc-900 pb-6">
            {promoApplied ? (
              <>
                <span className="text-4xl font-light text-white tracking-tight">$0.00</span>
                <span className="text-[10px] text-zinc-500 line-through ml-2 font-mono">{tierPrice}.00</span>
              </>
            ) : (
              <span className="text-4xl font-light text-white tracking-tight">{tierPrice}.00</span>
            )}
            <span className="text-[10px] text-zinc-500 ml-2.5 font-mono uppercase tracking-widest">USD / month</span>
          </div>

          <div className="space-y-4 font-mono text-[10px]">
            <div className="flex justify-between">
              <span className="text-zinc-500">OPERON_NODE_TACK</span>
              <span className="text-zinc-300">{tierPrice}.00</span>
            </div>
            {promoApplied && (
              <div className="flex justify-between text-emerald-450">
                <span className="text-emerald-500 font-bold">PROMO DISCOUNT (100%)</span>
                <span className="text-emerald-500 font-bold">-{tierPrice}.00</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-zinc-500">TAX (0%)</span>
              <span className="text-zinc-300">$0.00</span>
            </div>
            <div className="flex justify-between border-t border-zinc-900 pt-4 text-xs font-bold text-white tracking-wider">
              <span>TOTAL DUE</span>
              <span>{promoApplied ? "$0.00" : `${tierPrice}.00`}</span>
            </div>
          </div>
        </div>

        {/* Secure SSL indicator */}
        <div className="text-[9px] text-zinc-500 flex items-center gap-1.5 mt-8 font-mono relative z-10 uppercase tracking-widest">
          <ShieldCheck size={14} className="text-zinc-650" />
          <span>SECURE_ENCRYPTION // Powered by Stripe</span>
        </div>

      </div>

      {/* Right side: Payment form (Dark background) */}
      <div className="w-full md:w-7/12 bg-[#0c0e14] p-8 sm:p-12 lg:p-16 flex items-center justify-center min-h-screen relative">
        
        {/* Coordinate Layout lines in background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />
        
        {/* Loading Overlay */}
        {processing && (
          <div className="absolute inset-0 bg-black/90 z-20 flex flex-col items-center justify-center gap-4 text-center p-6 font-mono">
            <Loader2 size={32} className="animate-spin text-orange-500" />
            <p className="text-xs font-bold text-zinc-300 uppercase tracking-widest">{status}</p>
          </div>
        )}

        <form onSubmit={handlePay} className="max-w-md w-full space-y-6 text-left relative z-10 bg-zinc-950/40 p-8 rounded-lg border border-zinc-900 backdrop-blur-md">
          
          <h2 className="text-sm font-bold text-white font-mono uppercase border-b border-zinc-900 pb-4 tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            {promoApplied ? "Promo Access Activated" : "Pay with Credit Card"}
          </h2>
          
          <div className="space-y-4">
            
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@stellarcorp.com"
                className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-orange-500 rounded px-4 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none transition-all font-mono focus:ring-1 focus:ring-orange-500/30"
              />
            </div>

            {/* Card Information & Other Details (Hidden if promo code applied) */}
            {!promoApplied ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Card Information</label>
                  <div className="border border-zinc-800 rounded divide-y divide-zinc-800 overflow-hidden bg-zinc-900/60">
                    <input 
                      type="text" 
                      required={!promoApplied}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      placeholder="4242 4242 4242 4242"
                      className="w-full bg-transparent px-4 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none font-mono"
                    />
                    <div className="flex divide-x divide-zinc-800">
                      <input 
                        type="text" 
                        required={!promoApplied}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM/YY"
                        className="w-1/2 bg-transparent px-4 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none font-mono"
                      />
                      <input 
                        type="text" 
                        required={!promoApplied}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="CVC"
                        className="w-1/2 bg-transparent px-4 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Cardholder Name</label>
                  <input 
                    type="text" 
                    required={!promoApplied}
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Name on card"
                    className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-orange-500 rounded px-4 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none transition-all font-mono focus:ring-1 focus:ring-orange-500/30"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Country</label>
                    <select className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-orange-500 rounded px-3 py-2.5 text-xs text-zinc-300 focus:outline-none transition-all focus:ring-1 focus:ring-orange-500/30 font-mono">
                      <option className="bg-zinc-900">United States</option>
                      <option className="bg-zinc-900">Canada</option>
                      <option className="bg-zinc-900">United Kingdom</option>
                      <option className="bg-zinc-900">Germany</option>
                      <option className="bg-zinc-900">Japan</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">ZIP Code</label>
                    <input 
                      type="text" 
                      required={!promoApplied}
                      placeholder="10001"
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-orange-500 rounded px-3 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none transition-all font-mono focus:ring-1 focus:ring-orange-500/30"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-4 text-emerald-400 font-mono text-[10px] space-y-1">
                <span className="font-bold uppercase tracking-widest block text-[9px] text-emerald-350">FREE_ACCESS_GRANTED</span>
                <span>Promo code applied successfully. Plan price reduced to $0.00. No card details required.</span>
              </div>
            )}

            {/* Promo Code Input */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-900">
              <label className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">Promo Code</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  disabled={promoApplied}
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value);
                    setPromoError("");
                  }}
                  placeholder="e.g. FREEACCESS"
                  className="flex-1 bg-zinc-900/60 border border-zinc-800 focus:border-orange-500 rounded px-4 py-2 text-xs text-white placeholder-zinc-700 focus:outline-none transition-all font-mono uppercase"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={promoApplied}
                  className={`px-4 py-2 font-mono font-bold text-xs rounded transition-all cursor-pointer ${
                    promoApplied 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                  }`}
                >
                  {promoApplied ? "Applied" : "Apply"}
                </button>
              </div>
              {promoError && (
                <p className="text-[10px] font-mono text-red-500 mt-1">⚠️ {promoError}</p>
              )}
              {promoApplied && (
                <p className="text-[10px] font-mono text-emerald-400 mt-1">✓ Promo code applied successfully! 100% discount active.</p>
              )}
            </div>

          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-black font-mono font-bold text-xs py-3.5 rounded transition-all flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 active:scale-95 cursor-pointer"
            >
              {promoApplied ? `Activate ${tierName} Plan` : `Pay ${tierPrice}.00`}
            </button>
          </div>

          <p className="text-[9px] text-zinc-500 text-center leading-relaxed font-sans normal-case">
            By confirming your payment, you authorize Operon to charge your card on a recurring monthly basis. You can cancel at any time.
          </p>

        </form>

      </div>

    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white text-zinc-900 flex items-center justify-center font-mono text-xs">
        LOADING_STRIPE_GATEWAY...
      </div>
    }>
      <CheckoutForm />
    </Suspense>
  );
}
