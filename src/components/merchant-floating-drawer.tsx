"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  Loader2,
  Zap,
} from "lucide-react";

// Iridescent Swirling AI Assistant Orb matching user design
function AiSwirlOrb({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        <defs>
          <radialGradient id="aiOrbBase" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#80E9FF" />
            <stop offset="35%" stopColor="#00E5FF" />
            <stop offset="70%" stopColor="#00A3FF" />
            <stop offset="100%" stopColor="#0066FF" />
          </radialGradient>
          <radialGradient id="aiOrbHighlight" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="40%" stopColor="#38BDF8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0" />
          </radialGradient>
          <filter id="swirlBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.8" />
          </filter>
        </defs>

        {/* Outer glowing sphere */}
        <circle cx="20" cy="20" r="19" fill="url(#aiOrbBase)" />

        {/* Internal Swirling Petals / Vortex Aperture */}
        <g filter="url(#swirlBlur)" opacity="0.95">
          <path
            d="M20 6C23 12 19 18 13 19C7 20 5 15 8 10C10 6 15 4 20 6Z"
            fill="#38BDF8"
          />
          <path
            d="M34 21C28 24 23 20 22 14C21 8 26 6 30 9C34 11 36 16 34 21Z"
            fill="#00F0FF"
          />
          <path
            d="M16 34C13 28 17 23 23 22C29 21 31 26 29 30C27 34 21 36 16 34Z"
            fill="#0077FF"
          />
        </g>

        {/* Center core light */}
        <circle cx="20" cy="20" r="18" fill="url(#aiOrbHighlight)" />
        <circle cx="20" cy="20" r="3.5" fill="#FFFFFF" opacity="0.9" filter="url(#swirlBlur)" />
      </svg>
    </div>
  );
}

export function MerchantFloatingDrawer() {
  const [isOpen, setIsOpen] = useState(false);
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

  // Fetch telemetry when opened
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function fetchTelemetry() {
      try {
        const res = await fetch("/api/merchant/data");
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) {
          if (data.metrics) setMetrics(data.metrics);
          if (data.opportunities) setOpportunities(data.opportunities);
        }
      } catch (err) {
        console.error("Telemetry fetch error:", err);
      }
    }

    fetchTelemetry();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleSendQuery = async (presetText?: string) => {
    const q = presetText || input.trim();
    if (!q || copilotLoading) return;

    const userMsg = {
      role: "user" as const,
      text: q,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!presetText) setInput("");
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
      {/* 1. FLOATING ACTION PILL (BOTTOM CORNER TRIGGER) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 bg-white hover:bg-[#FBFBFB] border border-slate-200/90 shadow-md hover:shadow-lg rounded-full pl-2 pr-4 sm:pr-5 py-1.5 sm:py-2 flex items-center gap-2.5 sm:gap-3 cursor-pointer transition-all active:scale-95 group select-none"
        title="Tap to ask Merchant Assistant & inspect live store metrics"
      >
        <AiSwirlOrb className="w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-105 transition-transform" />
        <span className="text-xs sm:text-[13px] font-semibold text-[#172033] tracking-tight whitespace-nowrap">
          Ask any questions
        </span>
      </button>

      {/* 2. SLIDE-OVER SHEET / DRAWER */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200">
            {/* Clean Drawer Header — No 'Control Room' at top */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AiSwirlOrb className="w-8 h-8" />
                <div>
                  <h3 className="font-bold text-sm text-[#172033] tracking-tight">
                    Merchant Assistant
                  </h3>
                  <p className="text-[11px] text-[#667085]">
                    Live Commerce Intelligence & Razorpay Telemetry
                  </p>
                </div>
              </div>

              {/* Clean Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Minimalist Live KPI Strip */}
            <div className="px-5 py-2.5 bg-[#FBFBFB] border-b border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-[#667085]">Total GMV:</span>
                <span className="font-mono font-bold text-[#172033]">
                  {metrics ? `₹${metrics.totalGMV.toLocaleString()}` : "—"}
                </span>
              </div>

              <div className="text-slate-300">|</div>

              <div className="text-[11px]">
                <span className="text-[#667085]">Settled: </span>
                <span className="font-bold text-emerald-700">
                  {metrics ? `${metrics.totalOrders} Orders` : "—"}
                </span>
              </div>

              <div className="text-slate-300">|</div>

              <div className="text-[11px]">
                <span className="text-[#667085]">AI Lift: </span>
                <span className="font-bold text-[#0A63FF]">
                  {metrics ? `+₹${metrics.incrementalGMV.toLocaleString()}` : "—"}
                </span>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-[#FAF9F5]/40 text-xs">
              {/* Clean Minimalist Quick Question Pills */}
              <div className="flex flex-wrap gap-1.5 pb-1">
                {[
                  "Why did revenue increase?",
                  "What should I do next?",
                  "Guardrails Status",
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendQuery(q)}
                    className="px-3 py-1 rounded-full bg-white hover:bg-slate-50 active:scale-95 border border-slate-200 text-[#172033] text-[11px] font-medium transition-all shadow-2xs cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed space-y-1 ${
                      m.role === "user"
                        ? "bg-[#172033] text-white rounded-br-xs"
                        : "bg-white text-[#172033] border border-slate-200/80 rounded-tl-xs shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[9.5px] text-slate-400">
                      <span className="font-semibold">{m.role === "user" ? "You" : "Merchant Copilot"}</span>
                      <span>{m.time}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{m.text}</p>

                    {m.action && (
                      <div className="pt-2 border-t border-slate-100 mt-2">
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
                <div className="flex items-center gap-2 text-xs text-[#667085] p-2 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0A63FF]" />
                  <span>Synthesizing live commerce telemetry...</span>
                </div>
              )}
            </div>

            {/* Clean Integrated Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuery();
              }}
              className="p-3 sm:p-4 border-t border-slate-100 bg-white"
            >
              <div className="relative flex items-center bg-[#F7F5F0] hover:bg-[#F3F1EB] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#0A63FF]/20 border border-slate-200 focus-within:border-[#0A63FF] rounded-full px-3.5 py-1.5 transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about revenue, conversion, or guardrails..."
                  className="flex-1 bg-transparent text-xs text-[#172033] placeholder-slate-400 focus:outline-none min-w-0 pr-2"
                />
                <button
                  type="submit"
                  disabled={copilotLoading || !input.trim()}
                  className="w-7 h-7 rounded-full bg-[#172033] hover:bg-[#0A63FF] disabled:bg-slate-300 text-white flex items-center justify-center cursor-pointer disabled:cursor-not-allowed transition-all active:scale-95 shrink-0 shadow-2xs"
                  title="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
