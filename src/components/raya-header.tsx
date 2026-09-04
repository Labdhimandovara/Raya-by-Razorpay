"use client";

import React from "react";
import Link from "next/link";
import { ShoppingBag, PanelLeft, Store, User } from "lucide-react";
import { RayaLogo } from "./raya-logo";
import { useLocale } from "@/lib/locale-context";
import { LanguageSwitcher } from "./language-switcher";

interface RayaHeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  budget?: number | null;
  onSelectStore?: (storeId: string) => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  onNewChat?: () => void;
}

export function RayaHeader({
  cartCount,
  onOpenCart,
  budget = null,
  onToggleSidebar,
  sidebarOpen,
  onNewChat,
}: RayaHeaderProps) {
  const { t } = useLocale();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E6E0D6] shadow-xs px-4 sm:px-6 py-2.5 flex items-center justify-between transition-all">
      {/* LEFT: Sidebar Toggle & Minimal Brand Identity */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && !sidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-[#667085] hover:text-[#172033] hover:bg-[#F7F5F0] border border-transparent hover:border-[#E6E0D6] transition-all cursor-pointer"
            title={t("chat.newChat")}
            aria-label={t("chat.newChat")}
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <RayaLogo variant="light" size="sm" />
          <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-slate-200">
            <span className="text-[11px] font-medium text-[#667085]">
              {t("chat.welcomeTitle")}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT: Language Selector, Merchant Link, Cart Icon with Badge, Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <LanguageSwitcher />

        <Link
          href="/merchant"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white hover:bg-[#F7F5F0] border border-[#E6E0D6] text-[#172033] text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
          title={t("merchant.controlRoom")}
        >
          <Store className="w-3.5 h-3.5 text-[#0A63FF]" />
          <span className="hidden md:inline">{t("nav.merchantConsole")}</span>
        </Link>

        {/* Cart Icon with Item Count */}
        <button
          onClick={onOpenCart}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#172033] hover:bg-slate-800 active:scale-95 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          aria-label={t("cart.title")}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden xs:inline">{t("nav.cart")}</span>
          {cartCount > 0 ? (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#0A63FF] text-white text-[10px] font-black">
              {cartCount}
            </span>
          ) : (
            <span className="text-[10px] text-slate-400">0</span>
          )}
        </button>

        {/* Profile Pill */}
        <div
          className="w-8 h-8 rounded-xl bg-[#F7F5F0] border border-[#E6E0D6] flex items-center justify-center text-[#172033] shadow-2xs"
          title="Jane Doe (Buyer Account)"
        >
          <User className="w-3.5 h-3.5 text-[#667085]" />
        </div>
      </div>
    </header>
  );
}
