"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, ShieldCheck, ExternalLink, Store } from "lucide-react";
import { RayaLogo } from "./raya-logo";
import { CONNECTED_STORES } from "@/lib/gemini";

interface RayaHeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  budget?: number | null;
  onSelectStore?: (storeId: string) => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export function RayaHeader({
  cartCount,
  onOpenCart,
  budget = null,
  onSelectStore,
  onToggleSidebar,
  sidebarOpen,
}: RayaHeaderProps) {
  const stores = Object.values(CONNECTED_STORES);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-raya-lightGray/60 shadow-xs px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between transition-all">
      {/* Brand Identity & Sidebar Trigger */}
      <div className="flex items-center gap-2.5">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-[#0C8CE9] transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Toggle Sessions & Past Carts Sidebar"
            aria-label="Toggle sidebar"
          >
            <span className="text-sm leading-none">☰</span>
          </button>
        )}
        <RayaLogo variant="light" size="sm" />
        <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-raya-lightGray/80">
          <span className="text-[11px] font-medium text-raya-coolGray">
            Autonomous Multi-Store Commerce Bridge
          </span>
        </div>
      </div>

      {/* Connected 3 Stores Live Badges */}
      <div className="hidden md:flex items-center gap-2">
        {stores.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelectStore && onSelectStore(s.id)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-raya-lightGray hover:border-raya-blue/50 text-raya-navy text-[11px] font-semibold transition-all shadow-2xs hover:scale-102 cursor-pointer"
            title={`${s.name}: ${s.vibe}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{s.icon} {s.name}</span>
          </button>
        ))}

        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-raya-softWhite border border-raya-lightGray text-raya-stone text-xs font-semibold ml-1">
          <ShieldCheck className="w-3.5 h-3.5 text-raya-blue" />
          <span>
            {budget !== null && budget !== undefined ? `₹${budget.toLocaleString()} Cap` : "Policy Guard Active"}
          </span>
        </div>
      </div>

      {/* Cart & Merchant Console Link */}
      <div className="flex items-center gap-2">
        <Link
          href="/merchant"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 border border-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
          title="Open Bazaar Multi-Store Merchant Console"
        >
          <span>🏪</span>
          <span className="hidden sm:inline">Merchant Console</span>
        </Link>

        <button
          onClick={onOpenCart}
          className="relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-raya-navy hover:bg-raya-slate active:scale-95 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
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
