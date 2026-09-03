"use client";

import React, { useState } from "react";
import {
  Plus,
  MessageSquare,
  ShoppingBag,
  Clock,
  Trash2,
  ChevronRight,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  CheckCircle2,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  messageCount: number;
  previewText: string;
}

export interface SavedCart {
  id: string;
  title: string;
  createdAt: number;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price?: number;
    store?: string;
    product?: {
      id: string;
      name: string;
      price: number;
      store?: string;
      storeName?: string;
      imageUrl?: string;
    };
  }>;
  total: number;
  status: "ACTIVE_DRAFT" | "PAID_ORDER";
  orderId?: string;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  savedCarts: SavedCart[];
  onRestoreCart: (cart: SavedCart) => void;
  onDeleteSavedCart: (cartId: string) => void;
}

export function ChatSidebar({
  isOpen,
  onToggle,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  savedCarts,
  onRestoreCart,
  onDeleteSavedCart,
}: ChatSidebarProps) {
  const [activeTab, setActiveTab] = useState<"conversations" | "carts">("conversations");
  const [expandedCartId, setExpandedCartId] = useState<string | null>(null);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-3.5 left-3.5 z-50 p-2 rounded-xl bg-white border border-[#E6E0D6] text-[#172033] hover:text-[#0C8CE9] shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="Open Conversations & Past Carts Sidebar"
        aria-label="Open sidebar"
      >
        <PanelLeftOpen className="w-4 h-4" />
      </button>
    );
  }

  return (
    <aside className="w-72 lg:w-80 h-[100dvh] bg-[#F7F5F0] border-r border-[#E6E0D6] flex flex-col shrink-0 z-40 transition-all shadow-lg select-none">
      {/* Top Header */}
      <div className="p-3.5 border-b border-[#E6E0D6] flex items-center justify-between bg-white/80 backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#172033] text-white flex items-center justify-center font-black text-xs">
            R
          </div>
          <span className="font-extrabold text-xs text-[#172033] tracking-tight">
            RAYA SESSIONS
          </span>
        </div>

        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg text-[#667085] hover:text-[#172033] hover:bg-[#F7F5F0] transition-all cursor-pointer"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="w-full py-2.5 px-3.5 rounded-xl bg-[#172033] hover:bg-slate-800 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>+ New Shopping Chat</span>
        </button>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="px-3 pb-2">
        <div className="grid grid-cols-2 p-1 rounded-xl bg-white border border-[#E6E0D6] text-xs font-bold">
          <button
            onClick={() => setActiveTab("conversations")}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "conversations"
                ? "bg-[#172033] text-white shadow-2xs"
                : "text-[#667085] hover:text-[#172033]"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chats ({sessions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("carts")}
            className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "carts"
                ? "bg-[#172033] text-white shadow-2xs"
                : "text-[#667085] hover:text-[#172033]"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Past Carts ({savedCarts.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-3 space-y-2 py-1">
        {/* Tab 1: Conversations List */}
        {activeTab === "conversations" && (
          <div className="space-y-1.5">
            {sessions.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#667085] space-y-2">
                <MessageSquare className="w-6 h-6 mx-auto text-[#667085]/50" />
                <p>No past conversations yet.</p>
                <p className="text-[11px]">Start asking Raya about headphones, techwear, or eBay chess sets!</p>
              </div>
            ) : (
              sessions.map((s) => {
                const isActive = s.id === activeSessionId;
                return (
                  <div
                    key={s.id}
                    onClick={() => onSelectSession(s.id)}
                    className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 text-xs ${
                      isActive
                        ? "bg-white border-[#0C8CE9] shadow-2xs ring-1 ring-[#0C8CE9]/20"
                        : "bg-white/60 hover:bg-white border-[#E6E0D6] hover:border-slate-300"
                    }`}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-[#172033] truncate text-[11px]">
                          {s.title}
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0C8CE9] shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-[#667085] truncate">
                        {s.previewText}
                      </p>
                      <div className="text-[9px] text-[#667085]/80 flex items-center gap-1 pt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{new Date(s.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                        <span>•</span>
                        <span>{s.messageCount} msg{s.messageCount !== 1 ? "s" : ""}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(s.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#667085] hover:text-rose-600 transition-all rounded hover:bg-rose-50 cursor-pointer"
                      title="Delete chat session"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Saved & Past Carts */}
        {activeTab === "carts" && (
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-[#667085] uppercase tracking-wider px-1">
              View & Restore Cart Snapshots
            </div>

            {savedCarts.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#667085] space-y-2">
                <ShoppingBag className="w-6 h-6 mx-auto text-[#667085]/50" />
                <p>No saved or past carts found.</p>
                <p className="text-[11px]">Any items placed in your cart or ordered will appear here so you can re-order anytime.</p>
              </div>
            ) : (
              savedCarts.map((cart) => {
                const isExpanded = expandedCartId === cart.id;
                return (
                  <div
                    key={cart.id}
                    className="p-3 rounded-xl bg-white border border-[#E6E0D6] shadow-2xs space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-[#172033] text-[11px]">
                            {cart.title}
                          </span>
                          {cart.status === "PAID_ORDER" ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              PAID
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-[#0C8CE9] border border-blue-200">
                              SAVED
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#667085] flex items-center gap-1 mt-0.5">
                          <span>{cart.items.length} item{cart.items.length !== 1 ? "s" : ""}</span>
                          <span>•</span>
                          <span className="font-bold text-[#172033]">₹{cart.total.toLocaleString()}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteSavedCart(cart.id)}
                        className="p-1 text-[#667085] hover:text-rose-600 transition-all rounded hover:bg-rose-50 cursor-pointer"
                        title="Remove cart"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Expand/Collapse Item List */}
                    <div className="pt-1 border-t border-[#E6E0D6]/60">
                      <button
                        onClick={() => setExpandedCartId(isExpanded ? null : cart.id)}
                        className="text-[10px] font-bold text-[#667085] hover:text-[#172033] flex items-center gap-1 cursor-pointer w-full justify-between"
                      >
                        <span>{isExpanded ? "Hide item details" : "View items preview"}</span>
                        <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </button>

                      {isExpanded && (
                        <div className="mt-1.5 space-y-1.5 bg-[#F7F5F0] p-2 rounded-lg border border-[#E6E0D6]">
                          {cart.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] gap-2">
                              <span className="truncate text-[#172033] font-medium">
                                {item.product?.name || item.productId} (x{item.quantity})
                              </span>
                              <span className="font-mono text-[10px] text-[#667085] shrink-0">
                                ₹{((item.product?.price || item.price || 0) * item.quantity).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Restore Cart Action Button */}
                    <button
                      onClick={() => onRestoreCart(cart)}
                      className="w-full py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>Restore to Active Cart</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#E6E0D6] bg-white/80 text-[10px] text-[#667085] flex items-center justify-between">
        <span className="flex items-center gap-1 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Autonomous Multi-Store Ready</span>
        </span>
        <span className="font-mono font-bold text-[#172033]">v2.4 Fast</span>
      </div>
    </aside>
  );
}
