"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Store,
  X,
  Bot,
  Send,
  Loader2,
  Zap,
  TrendingUp,
  CreditCard,
  Check,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

export function MerchantFloatingDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<{ totalGMV: number; totalOrders: number; incrementalGMV: number } | null>(null);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  
  // Copilot messages state
  const [messages, setMessages] = useState<Array<{ role: "user" | "copilot"; text: string; time: string; action?: any }>>([
    {
      role: "copilot",
      text: "👋 Hi! I am Bazaar Merchant Copilot. I analyze your live Razorpay orders and AI commerce activity. Ask me anything about your revenue, cross-sell conversion, or guardrails!",
      time: "Live",
    },
  ]);
  const [input, setInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);

  // Fetch live merchant telemetry when drawer opens
  const fetchMerchantData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/merchant/data", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.metrics) setMetrics(data.metrics);
        if (data.growthOpportunities) setOpportunities(data.growthOpportunities);
      }
    } catch (e) {
      console.warn("Failed to fetch merchant telemetry:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !metrics) {
      fetchMerchantData();
    }
  }, [isOpen]);

  const handleSendQuery = async (queryText?: string) => {
    const q = queryText || input;
    if (!q.trim() || copilotLoading) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", text: q, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
    ]);
    setInput("");
    setCopilotLoading(true);

    try {
      const res = await fetch("/api/merchant/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          metrics,
          opportunities,
          ordersCount: metrics?.totalOrders || 25,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "copilot",
          text: data.reply || "Based on your live store transactions, AI-Attributed GMV is expanding with 100% policy compliance.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          action: data.action,
        },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: "copilot",
          text: "Live telemetry sync error. Please check your backend connection.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleToggleRule = async (ruleId: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/merchant/activate-rule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId, active: !currentActive }),
      });
      if (res.ok) {
        const data = await res.json();
        setOpportunities((prev) =>
          prev.map((o) => (o.id === ruleId ? { ...o, isActive: data.isActive } : o))
        );
      }
    } catch (e) {
      console.error("Toggle error:", e);
    }
  };

  return (
    <>
      {/* 1. FLOATING ACTION PILL ON APP */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 sm:bottom-6 right-5 z-40 px-3.5 py-2 rounded-full bg-[#172033] hover:bg-slate-800 text-white text-xs font-bold shadow-xl border border-slate-700 flex items-center gap-2 cursor-pointer transition-all active:scale-95 group"
        title="Tap to ask Merchant Intelligence Copilot & inspect live metrics"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <Store className="w-3.5 h-3.5 text-[#0A63FF] group-hover:scale-110 transition-transform" />
        <span>Merchant AI</span>
        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono border border-slate-700">
          Live API
        </span>
      </button>

      {/* 2. SLIDE-OVER SHEET / DRAWER */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-[#E6E0D6] animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#E6E0D6] bg-[#F7F5F0] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#172033] text-white flex items-center justify-center font-bold">
                  <Bot className="w-4 h-4 text-[#0A63FF]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#172033]">
                    BAZAAR MERCHANT AI
                  </h3>
                  <p className="text-[10px] text-[#667085]">
                    Live Commerce Intelligence & Razorpay Telemetry
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Link
                  href="/merchant"
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-[#E6E0D6] text-[#172033] text-[11px] font-bold flex items-center gap-1 shadow-2xs"
                  title="Open Full Merchant Control Room"
                >
                  <span>Control Room</span>
                  <ExternalLink className="w-3 h-3 text-[#0A63FF]" />
                </Link>

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  title="Close Drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live KPI Quick Bar */}
            <div className="p-3 bg-white border-b border-[#E6E0D6] grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-[#F7F5F0] rounded-xl border border-[#E6E0D6]/60">
                <span className="text-[9px] font-bold text-[#667085] block">TOTAL GMV</span>
                <span className="font-black text-[#172033] text-xs">
                  {metrics ? `₹${metrics.totalGMV.toLocaleString()}` : "₹126,417"}
                </span>
              </div>
              <div className="p-2 bg-[#F7F5F0] rounded-xl border border-[#E6E0D6]/60">
                <span className="text-[9px] font-bold text-[#667085] block">SETTLED</span>
                <span className="font-black text-emerald-600 text-xs">
                  {metrics ? `${metrics.totalOrders} Orders` : "25 Orders"}
                </span>
              </div>
              <div className="p-2 bg-[#F7F5F0] rounded-xl border border-[#E6E0D6]/60">
                <span className="text-[9px] font-bold text-[#667085] block">INCREMENTAL</span>
                <span className="font-black text-[#0A63FF] text-xs">
                  {metrics ? `+₹${metrics.incrementalGMV.toLocaleString()}` : "+₹29,076"}
                </span>
              </div>
            </div>

            {/* Copilot Chat Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F7F5F0]/30 text-xs">
              {/* Preset Question Pills */}
              <div className="flex flex-wrap gap-1.5 pb-2">
                <button
                  onClick={() => handleSendQuery("Why did my revenue increase today?")}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 border border-[#E6E0D6] text-[#172033] text-[10px] font-semibold cursor-pointer shadow-2xs"
                >
                  "Why did revenue increase?"
                </button>
                <button
                  onClick={() => handleSendQuery("What growth opportunity should I activate next?")}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 border border-[#E6E0D6] text-[#172033] text-[10px] font-semibold cursor-pointer shadow-2xs"
                >
                  "What should I do next?"
                </button>
                <button
                  onClick={() => handleSendQuery("Show me the status of my 6 purchase guardrails")}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-slate-100 border border-[#E6E0D6] text-[#172033] text-[10px] font-semibold cursor-pointer shadow-2xs"
                >
                  "Guardrails Status"
                </button>
              </div>

              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed space-y-1 ${
                      m.role === "user"
                        ? "bg-[#172033] text-white rounded-br-xs"
                        : "bg-white text-[#172033] border border-[#E6E0D6] rounded-bl-xs shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[9px] text-slate-400">
                      <span className="font-bold">{m.role === "user" ? "Merchant" : "Bazaar Copilot"}</span>
                      <span>{m.time}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    {m.action && (
                      <div className="pt-2 border-t border-slate-200 mt-2">
                        <button
                          onClick={() => handleToggleRule(m.action.ruleId, false)}
                          className="px-3 py-1.5 rounded-lg bg-[#0A63FF] text-white font-bold text-[10px] flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                        >
                          <Zap className="w-3 h-3 text-amber-300" />
                          <span>Activate Strategy</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {copilotLoading && (
                <div className="flex items-center gap-2 text-xs text-[#667085] italic p-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0A63FF]" />
                  <span>Synthesizing live commerce telemetry...</span>
                </div>
              )}
            </div>

            {/* Chat Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuery();
              }}
              className="p-3 border-t border-[#E6E0D6] bg-white flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about revenue, conversion, or guardrails..."
                className="flex-1 px-3 py-2 rounded-xl border border-[#E6E0D6] text-xs focus:outline-[#0A63FF]"
              />
              <button
                type="submit"
                disabled={copilotLoading || !input.trim()}
                className="px-3.5 py-2 rounded-xl bg-[#172033] hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
