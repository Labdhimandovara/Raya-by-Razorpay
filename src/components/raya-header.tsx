"use client";

import React from "react";
import { ShoppingBag, ShieldCheck, Zap } from "lucide-react";

interface RayaHeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  budget?: number;
}

export function RayaHeader({ cartCount, onOpenCart, budget = 15000 }: RayaHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[#E2E8F0] shadow-sm px-4 sm:px-8 py-3.5 flex items-center justify-between">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0C66E4] to-[#00D09C] flex items-center justify-center text-white shadow-md shadow-[#0C66E4]/20 font-bold text-lg tracking-wider">
          <Zap className="w-5 h-5 fill-current text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#0C2340] text-lg tracking-tight">Raya</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#EBF3FF] text-[#0C66E4] border border-[#0C66E4]/20">
              by Razorpay
            </span>
          </div>
          <p className="text-[11px] text-[#64748B] hidden sm:block">Autonomous Shopping Intelligence</p>
        </div>
      </div>

      {/* Trust & Safety Status Bar */}
      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>NexusStore Bridge Active</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[#475569] text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0C66E4]" />
          <span>Max Budget: ₹{budget.toLocaleString()}</span>
        </div>
      </div>

      {/* Cart & Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenCart}
          className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0C2340] hover:bg-[#112B50] text-white text-xs font-bold transition-all shadow-sm"
        >
          <ShoppingBag className="w-4 h-4 text-[#00D09C]" />
          <span>Cart</span>
          {cartCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#00D09C] text-[#0C2340] text-[11px] font-black animate-bounce">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
