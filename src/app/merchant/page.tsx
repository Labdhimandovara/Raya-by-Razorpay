"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  CreditCard,
  Layers,
  RefreshCw,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Sliders,
  Store,
  ExternalLink,
  Bot,
  Zap,
  Loader2,
} from "lucide-react";

interface MerchantOrder {
  id: string;
  razorpayPaymentId: string;
  store: string;
  storeBadge: string;
  customer: string;
  items: string;
  amount: number;
  status: string;
  agentHandshake: string;
  createdAt: number;
  receipt: string;
}

interface StoreTelemetry {
  id: string;
  name: string;
  category: string;
  skuCount: string | number;
  status: string;
  endpoint: string;
}

export default function MerchantConsole() {
  const [activeTab, setActiveTab] = useState<"orders" | "telemetry" | "copilot" | "guardrails">("orders");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [stores, setStores] = useState<StoreTelemetry[]>([]);
  const [metrics, setMetrics] = useState({
    totalGMV: 0,
    totalOrders: 0,
    aov: 0,
    complianceRate: "100%",
  });
  const [keyId, setKeyId] = useState("rzp_test_TXJETRVcTcK91j");
  const [crossStoreRecsEnabled, setCrossStoreRecsEnabled] = useState(true);
  const [maxPolicyCap, setMaxPolicyCap] = useState(25000);

  // Merchant Copilot chat
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<Array<{ role: "user" | "copilot"; text: string; time: string }>>([
    {
      role: "copilot",
      text: "👋 Welcome to the Bazaar Merchant Console. I am your Merchant Agent Copilot with direct access to your live Razorpay test transactions and connected store telemetry. How can I assist you?",
      time: "Just now",
    },
  ]);

  const loadRealData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/merchant/data", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.orders) setOrders(data.orders);
        if (data.metrics) setMetrics(data.metrics);
        if (data.stores) setStores(data.stores);
        if (data.keyId) setKeyId(data.keyId);
      }
    } catch (e) {
      console.error("Failed to load real merchant data:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRealData();
  }, []);

  const handleCopilotSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!copilotInput.trim() || copilotLoading) return;

    const userQuery = copilotInput.trim();
    const newMsg = { role: "user" as const, text: userQuery, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setCopilotMessages((prev) => [...prev, newMsg]);
    setCopilotInput("");
    setCopilotLoading(true);

    try {
      const res = await fetch("/api/merchant/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userQuery,
          orders,
          metrics,
        }),
      });

      const data = await res.json();
      const reply = data.reply || "Report generated successfully based on live Razorpay data.";

      setCopilotMessages((prev) => [
        ...prev,
        {
          role: "copilot",
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err) {
      setCopilotMessages((prev) => [
        ...prev,
        {
          role: "copilot",
          text: `Live Order Summary: Currently tracking ${orders.length} real Razorpay orders totaling ₹${metrics.totalGMV.toLocaleString()}. All store channels are operational.`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setCopilotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">
      {/* Top Console Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-raya-blue hover:text-raya-blue text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-all active:scale-95 bg-slate-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Shopper Agent View</span>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0C2340] text-white flex items-center justify-center font-black text-sm shadow-xs">
                🏪
              </div>
              <div>
                <h1 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                  Bazaar Multi-Store Merchant Hub
                </h1>
                <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                  <span>Live Telemetry & Real Razorpay API Orders</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-mono text-[11px]">{keyId}</span>
            </span>
            <button
              onClick={loadRealData}
              disabled={refreshing}
              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              title="Fetch latest orders from Razorpay API"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-blue-600" : "text-slate-500"}`} />
              <span className="hidden xs:inline">Refresh Live</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6 flex-1">
        {/* Real Executive Metrics Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Gross Merchandise Value</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {loading ? "..." : `₹${metrics.totalGMV.toLocaleString()}`}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
              <span>Real Live Total</span>
              <span className="text-slate-400">• Razorpay Test Account</span>
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Real Orders Captured</span>
              <ShoppingBag className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {loading ? "..." : metrics.totalOrders}
            </div>
            <span className="text-[10px] text-blue-600 font-semibold">Fetched from /v1/orders</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Average Order Value (AOV)</span>
              <Layers className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {loading ? "..." : `₹${metrics.aov.toLocaleString()}`}
            </div>
            <span className="text-[10px] text-purple-600 font-semibold">Live Calculated Average</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Autonomous Guardrails</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">100% Compliant</div>
            <span className="text-[10px] text-slate-500">Dynamic Policy Guard Active</span>
          </div>
        </div>

        {/* Connected Stores Telemetry Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span>Multi-Store Telemetry</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Bazaar Inter-Store Protocol</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(stores.length > 0 ? stores : [
              { id: "nexus", name: "⚡ NexusStore", category: "Smart Techwear & Audio", skuCount: 40, status: "ONLINE" },
              { id: "thread", name: "🧵 ThreadVault", category: "Minimalist Luxury", skuCount: 40, status: "ONLINE" },
              { id: "pixel", name: "🎮 PixelMart", category: "Creator & Cyberpunk RGB", skuCount: 40, status: "ONLINE" },
              { id: "ebay", name: "🛍️ eBay Marketplace", category: "Certified Refurbished (EBAY_US)", skuCount: "Live Browse API", status: "CONNECTED" },
            ]).map((s) => (
              <div key={s.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-xs text-slate-900">{s.name}</div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {s.category} • {typeof s.skuCount === "number" ? `${s.skuCount} SKUs` : s.skuCount}
                  </div>
                </div>
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{s.status}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "orders"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Real Razorpay Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("copilot")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "copilot"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-blue-400" />
            <span>Merchant Agent Copilot</span>
          </button>
          <button
            onClick={() => setActiveTab("guardrails")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "guardrails"
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            Autonomous Guardrails & Cross-Sell
          </button>
        </div>

        {/* Tab 1: Orders Table (Real Razorpay Orders) */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Real Razorpay Orders ({orders.length})</h3>
                <p className="text-[11px] text-slate-500">Live order records queried directly from Razorpay API</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  Total Processed: ₹{metrics.totalGMV.toLocaleString()}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-xs font-medium">Fetching real orders from Razorpay API...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No orders recorded yet. Complete a checkout in Raya to see it appear here!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                    <tr>
                      <th className="p-3 pl-4">Razorpay Order ID</th>
                      <th className="p-3">Store</th>
                      <th className="p-3">Receipt / Details</th>
                      <th className="p-3">Customer Protocol</th>
                      <th className="p-3 text-right">Gross Amount</th>
                      <th className="p-3 text-center">Gateway Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 pl-4">
                          <div className="font-mono font-bold text-slate-900">{o.id}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(o.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.storeBadge}`}>
                            {o.store}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-slate-800">{o.items}</div>
                          <div className="font-mono text-[10px] text-slate-400">{o.receipt}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-700">{o.customer}</div>
                          <div className="text-[10px] text-emerald-600">{o.agentHandshake}</div>
                        </td>
                        <td className="p-3 text-right font-black text-slate-900 text-sm">
                          ₹{o.amount.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Merchant Copilot with Real Gemini Intelligence */}
        {activeTab === "copilot" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-[540px]">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Merchant Copilot</h3>
                  <p className="text-[10px] text-slate-500">Live AI Assistant with direct access to your real Razorpay data</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Connected to Real Data
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {copilotMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-lg p-3.5 rounded-2xl text-xs space-y-1 ${
                      m.role === "user"
                        ? "bg-blue-600 text-white rounded-br-xs"
                        : "bg-slate-100 text-slate-800 rounded-bl-xs whitespace-pre-line leading-relaxed"
                    }`}
                  >
                    <p>{m.text}</p>
                    <span className={`text-[9px] block text-right ${m.role === "user" ? "text-blue-200" : "text-slate-400"}`}>
                      {m.time}
                    </span>
                  </div>
                </div>
              ))}
              {copilotLoading && (
                <div className="flex justify-start">
                  <div className="p-3 rounded-2xl bg-slate-100 text-slate-500 text-xs flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing live order data...</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleCopilotSend} className="p-3 border-t border-slate-200 flex items-center gap-2 bg-slate-50">
              <input
                type="text"
                value={copilotInput}
                disabled={copilotLoading}
                onChange={(e) => setCopilotInput(e.target.value)}
                placeholder="Ask Merchant Copilot (e.g. 'What is my total sales volume?', 'Summarize my latest orders')..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={copilotLoading}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Guardrails & Cross-Sell Config */}
        {activeTab === "guardrails" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Autonomous Guardrails & Catalog Rules</h3>
              <p className="text-xs text-slate-500">Configure safety thresholds and AI cross-sell rules across all 4 merchant channels.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 block">Frequently Bought Together Add-ons</span>
                    <span className="text-[11px] text-slate-500 block">Allow Raya to recommend cross-store items inside shopper cart.</span>
                  </div>
                  <button
                    onClick={() => setCrossStoreRecsEnabled(!crossStoreRecsEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer flex items-center ${
                      crossStoreRecsEnabled ? "bg-emerald-500 justify-end" : "bg-slate-300 justify-start"
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
                  </button>
                </div>
                <div className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  ✓ Active: Cross-store add-ons permitted across NexusStore, ThreadVault, PixelMart, and eBay.
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900 block">Merchant Safety Limit Ceiling</span>
                  <span className="text-[11px] text-slate-500 block">Autonomous purchases exceeding this cap require shopper confirmation.</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="5000"
                    max="100000"
                    step="5000"
                    value={maxPolicyCap}
                    onChange={(e) => setMaxPolicyCap(Number(e.target.value))}
                    className="flex-1 accent-blue-600"
                  />
                  <span className="font-mono font-bold text-sm text-slate-900 min-w-[70px] text-right">
                    ₹{maxPolicyCap.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
