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
import { CartItem } from "@/components/cart-drawer";

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
  items: CartItem[];
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
  sessionCarts?: Record<string, CartItem[]>;
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
  sessionCarts = {},
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
        className="fixed top-3.5 left-3.5 z-50 p-2 rounded-xl bg-white border border-[#E6E0D6] text-[#172033] hover:text-raya-blue shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="Open Conversations & Past Carts Sidebar"
        aria-label="Open sidebar"
      >
        <PanelLeftOpen className="w-4 h-4" />
      </button>
    );
  }

  return (
    <aside className="w-68 sm:w-72 lg:w-76 h-[100dvh] bg-[#F7F5F0] border-r border-[#E6E0D6] flex flex-col shrink-0 z-40 transition-all shadow-sm select-none">
      {/* Top Header */}
      <div className="p-3 border-b border-[#E6E0D6] flex items-center justify-between bg-white/80 backdrop-blur-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#172033] text-white flex items-center justify-center font-black text-xs">
            R
          </div>
          <div>
            <span className="font-extrabold text-xs text-[#172033] tracking-tight block">
              RAYA SESSIONS
            </span>
            <span className="text-[10px] text-raya-coolGray">Autonomous Shopper</span>
          </div>
        </div>

        <button
          onClick={onToggle}
          className="p-1 rounded-lg hover:bg-slate-200/60 text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
          title="Collapse Sidebar"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* New Chat Primary Action */}
      <div className="p-3 shrink-0">
        <button
          onClick={onNewChat}
          className="w-full py-2.5 px-3 rounded-xl bg-[#172033] hover:bg-slate-800 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>New Shopping Chat</span>
        </button>
      </div>

      {/* Sub-Tabs: Chats vs Past Carts */}
      <div className="px-3 pb-2 shrink-0">
        <div className="grid grid-cols-2 p-1 bg-[#EBE7DF] rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab("conversations")}
            className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "conversations"
                ? "bg-white text-[#172033] shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chats ({sessions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("carts")}
            className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "carts"
                ? "bg-white text-[#172033] shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Past Carts ({savedCarts.length})</span>
          </button>
        </div>
      </div>

      {/* Body List */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-2">
        {activeTab === "conversations" ? (
          /* CONVERSATIONS LIST */
          sessions.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No conversations yet. Start a new shopping chat!
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const cart = sessionCarts[session.id] || [];
              const cartItemCount = cart.reduce((acc, it) => acc + (it.quantity || 1), 0);
              const cartTotal = cart.reduce((acc, it) => acc + ((it.price || it.product?.price || 0) * (it.quantity || 1)), 0);

              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className={`group relative p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? "bg-white border-raya-blue shadow-xs ring-1 ring-raya-blue/30"
                      : "bg-white/60 hover:bg-white border-[#E6E0D6] hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-raya-blue" : "bg-slate-300"}`} />
                      <h4 className={`text-xs font-bold truncate ${isActive ? "text-[#172033]" : "text-slate-700"}`}>
                        {session.title}
                      </h4>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-all shrink-0"
                      title="Delete chat & dedicated cart"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-[11px] text-raya-coolGray truncate mt-1">
                    {session.previewText || "Start shopping conversation..."}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(session.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>

                    {/* Dedicated Cart Badge */}
                    {cartItemCount > 0 ? (
                      <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                        🛒 {cartItemCount} item{cartItemCount > 1 ? "s" : ""} • ₹{cartTotal.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-slate-400">Cart Empty</span>
                    )}
                  </div>
                </div>
              );
            })
          )
        ) : (
          /* SAVED & PAST CARTS LIST */
          savedCarts.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No saved carts or past orders recorded yet.
            </div>
          ) : (
            savedCarts.map((c) => {
              const isExpanded = expandedCartId === c.id;
              const itemCount = c.items.reduce((acc, it) => acc + (it.quantity || 1), 0);

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-xl border border-[#E6E0D6] p-2.5 shadow-2xs hover:border-raya-blue/30 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                          c.status === "PAID_ORDER"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-blue-50 text-raya-blue border border-blue-200"
                        }`}>
                          {c.status === "PAID_ORDER" ? "Paid Order" : "Saved Cart"}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#172033] truncate">{c.title}</h4>
                      <p className="text-[11px] font-black text-raya-blue mt-0.5">
                        ₹{c.total.toLocaleString()} • {itemCount} item{itemCount > 1 ? "s" : ""}
                      </p>
                    </div>

                    <button
                      onClick={() => onDeleteSavedCart(c.id)}
                      className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-all shrink-0"
                      title="Remove saved snapshot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setExpandedCartId(isExpanded ? null : c.id)}
                      className="text-[10px] text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                    >
                      {isExpanded ? "Hide items" : "View items"}
                    </button>

                    <button
                      onClick={() => onRestoreCart(c)}
                      className="px-2 py-1 rounded-lg bg-raya-blue hover:bg-blue-600 text-white text-[10.5px] font-bold transition-all shadow-2xs active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <span>Restore</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="p-2 bg-[#F7F5F0] rounded-lg text-[10.5px] space-y-1 mt-1.5 border border-[#E6E0D6]">
                      {c.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-slate-700">
                          <span className="truncate max-w-[140px]">
                            {it.quantity}x {it.product?.name || it.name || it.productId}
                          </span>
                          <span className="font-mono font-bold">
                            ₹{((it.price || it.product?.price || 0) * (it.quantity || 1)).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#E6E0D6] bg-white/70 text-[11px] text-slate-500 shrink-0">
        <a
          href="/merchant"
          className="w-full py-2 px-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 transition-all font-bold text-slate-700 flex items-center justify-between text-xs cursor-pointer shadow-2xs"
        >
          <span className="flex items-center gap-1.5">
            <span>🏪</span>
            <span>Bazaar Growth Control Room</span>
          </span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>
      </div>
    </aside>
  );
}
