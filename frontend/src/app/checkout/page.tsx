"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';
import Logo from '../../components/Logo';

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

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (processing) return;
    setProcessing(true);
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
              await fetch("http://127.0.0.1:8000/organizations/plan", {
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
    <div className="min-h-screen bg-white text-zinc-800 font-sans flex flex-col md:flex-row relative">
      
      {/* Back button */}
      <a 
        href="/pricing" 
        className="absolute top-6 left-6 text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1.5 font-medium z-25 transition-colors"
      >
        <ArrowLeft size={14} /> Back to pricing
      </a>

      {/* Left side: Stripe Product summary (Slate background) */}
      <div className="w-full md:w-5/12 bg-zinc-900 text-zinc-300 p-8 sm:p-12 lg:p-16 flex flex-col justify-between min-h-[300px] md:min-h-screen">
        
        {/* Logo */}
        <div className="flex items-center gap-2 mb-12">
          <Logo size={20} />
          <span className="font-bold text-xs tracking-tight text-white font-mono">OPERON</span>
        </div>

        {/* Product specs */}
        <div className="space-y-6 my-auto text-left">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-widest">Subscribe to</span>
            <h1 className="text-2xl font-bold text-white mt-1 font-mono">{tierName}</h1>
          </div>

          <div className="flex items-baseline border-b border-zinc-800 pb-6">
            <span className="text-4xl font-semibold text-white">{tierPrice}.00</span>
            <span className="text-xs text-zinc-500 ml-2 font-mono">USD / month</span>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">OPERON_NODE_TACK</span>
              <span className="text-zinc-300">{tierPrice}.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">TAX (0%)</span>
              <span className="text-zinc-300">$0.00</span>
            </div>
            <div className="flex justify-between border-t border-zinc-800 pt-4 text-sm font-bold text-white">
              <span>TOTAL DUE</span>
              <span>{tierPrice}.00</span>
            </div>
          </div>
        </div>

        {/* Secure SSL indicator */}
        <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 mt-8 font-mono">
          <ShieldCheck size={14} className="text-zinc-500" />
          SECURE_ENCRYPTION // Powered by Stripe
        </div>

      </div>

      {/* Right side: Payment form (White background) */}
      <div className="w-full md:w-7/12 bg-white p-8 sm:p-12 lg:p-16 flex items-center justify-center min-h-screen relative">
        
        {/* Loading Overlay */}
        {processing && (
          <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center gap-4 text-center p-6 font-mono">
            <Loader2 size={32} className="animate-spin text-orange-500" />
            <p className="text-xs font-bold text-zinc-800 uppercase tracking-wider">{status}</p>
          </div>
        )}

        <form onSubmit={handlePay} className="max-w-md w-full space-y-6 text-left">
          
          <h2 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-4">Pay with Card</h2>
          
          <div className="space-y-4">
            
            {/* Email Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Email Address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@stellarcorp.com"
                className="w-full bg-white border border-zinc-200 focus:border-zinc-900 rounded px-4 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none transition-all"
              />
            </div>

            {/* Card Information */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Card Information</label>
              <div className="border border-zinc-200 rounded divide-y divide-zinc-200 overflow-hidden">
                <input 
                  type="text" 
                  required
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="4242 4242 4242 4242"
                  className="w-full bg-white px-4 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none"
                />
                <div className="flex divide-x divide-zinc-200">
                  <input 
                    type="text" 
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-1/2 bg-white px-4 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none"
                  />
                  <input 
                    type="text" 
                    required
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    placeholder="CVC"
                    className="w-1/2 bg-white px-4 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Cardholder name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cardholder Name</label>
              <input 
                type="text" 
                required
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Name on card"
                className="w-full bg-white border border-zinc-200 focus:border-zinc-900 rounded px-4 py-2.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none transition-all"
              />
            </div>

            {/* Country and region */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Country</label>
                <select className="w-full bg-white border border-zinc-200 focus:border-zinc-900 rounded px-3 py-2 text-xs text-zinc-800 focus:outline-none">
                  <option>United States</option>
                  <option>Canada</option>
                  <option>United Kingdom</option>
                  <option>Germany</option>
                  <option>Japan</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">ZIP Code</label>
                <input 
                  type="text" 
                  required
                  placeholder="10001"
                  className="w-full bg-white border border-zinc-200 focus:border-zinc-900 rounded px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none transition-all"
                />
              </div>
            </div>

          </div>

          <div className="pt-4">
            <button 
              type="submit"
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm py-3 rounded transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-zinc-900/10"
            >
              Pay {tierPrice}.00
            </button>
          </div>

          <p className="text-[10px] text-zinc-400 text-center leading-normal font-sans">
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
