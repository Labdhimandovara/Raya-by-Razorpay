"use client";

import React from "react";
import { ShoppingBag, ShieldCheck, Sparkles } from "lucide-react";
import { RayaLogo } from "./raya-logo";

interface RayaHeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  budget?: number;
}

export function RayaHeader({ cartCount, onOpenCart, budget = 15000 }: RayaHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-raya-lightGray/60 shadow-xs px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between transition-all">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <RayaLogo variant="light" size="sm" />
        <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-raya-lightGray/80">
          <span className="text-[11px] font-medium text-raya-coolGray">
            Autonomous Shopping Intelligence
          </span>
        </div>
      </div>

      {/* Trust & Safety Status Bar (Hidden on small mobile, visible on tablet+) */}
      <div className="hidden sm:flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-raya-success text-xs font-semibold shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-raya-success animate-pulse" />
          <span>NexusStore Live</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-raya-softWhite border border-raya-lightGray text-raya-stone text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-raya-blue" />
          <span className="hidden md:inline">Max Budget:</span>
          <span>₹{budget.toLocaleString()}</span>
        </div>
      </div>

      {/* Cart & Quick Action */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenCart}
          className="relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-raya-navy hover:bg-raya-slate active:scale-95 text-white text-xs font-bold transition-all shadow-sm"
          aria-label="View Shopping Cart"
        >
          <ShoppingBag className="w-4 h-4 text-raya-sky" />
          <span className="hidden xs:inline">Cart</span>
          {cartCount > 0 ? (
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-raya-blue text-white text-[10px] font-extrabold animate-bounce">
              {cartCount}
            </span>
          ) : (
            <span className="text-[10px] text-raya-coolGray hidden sm:inline">0</span>
          )}
        </button>
      </div>
    </header>
  );
}

