"use client";

import React, { useState } from "react";
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
} from "lucide-react";

export default function MerchantConsole() {
  const [activeTab, setActiveTab] = useState<"orders" | "telemetry" | "copilot" | "guardrails">("orders");
  const [crossStoreRecsEnabled, setCrossStoreRecsEnabled] = useState(true);
  const [maxPolicyCap, setMaxPolicyCap] = useState(25000);
  const [minOrderThreshold, setMinOrderThreshold] = useState(500);

  // Simulated Merchant Copilot chat
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotMessages, setCopilotMessages] = useState<Array<{ role: "user" | "copilot"; text: string; time: string }>>([
    {
      role: "copilot",
      text: "Welcome to the Bazaar Merchant Console. I am your Merchant Agent Copilot. Shopper agents (like Raya) communicate directly with me to verify live stock, check promotions, and negotiate cross-store bundles. How can I assist your stores today?",
      time: "Just now",
    },
  ]);

  const [orders, setOrders] = useState([
    {
      id: "ord_txj_9821",
      razorpayPaymentId: "pay_test_TXJETRVcTcK91j",
      store: "NexusStore",
      storeBadge: "bg-amber-100 text-amber-800",
      customer: "Jane Doe (Autonomous Buyer)",
      items: "Nexus Smart Heated Techwear Bomber Jacket (x1)",
      amount: 7999,
      status: "CAPTURED",
      agentHandshake: "Verified via Raya Purchase Guard",
      time: "2 mins ago",
    },
    {
      id: "ord_txj_9820",
      razorpayPaymentId: "pay_test_99ab72cd",
      store: "PixelMart",
      storeBadge: "bg-purple-100 text-purple-800",
      customer: "Alex Vance",
      items: "4K60 Pro HDR Ultra-Low Latency Capture Card (x1)",
      amount: 17999,
      status: "CAPTURED",
      agentHandshake: "In-Limit Autonomous Approval",
      time: "14 mins ago",
    },
    {
      id: "ord_txj_9819",
      razorpayPaymentId: "pay_test_34ef88a1",
      store: "NexusStore",
      storeBadge: "bg-amber-100 text-amber-800",
      customer: "Michael Scott",
      items: "Nexus Pro Wireless ANC Studio Headphones (x1)",
      amount: 4899,
      status: "SETTLED",
      agentHandshake: "Direct Test Payment Approved",
      time: "32 mins ago",
    },
    {
      id: "ord_txj_9818",
      razorpayPaymentId: "pay_test_55cd1209",
      store: "ThreadVault",
      storeBadge: "bg-stone-200 text-stone-800",
      customer: "Elena Rostova",
      items: "Minimalist Cashmere Mockneck Sweater (x1)",
      amount: 6499,
      status: "SETTLED",
      agentHandshake: "Curated Luxury Recommendation",
      time: "1 hr ago",
    },
  ]);

  const handleCopilotSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!copilotInput.trim()) return;

    const userQuery = copilotInput.trim();
    const newMsg = { role: "user" as const, text: userQuery, time: "Just now" };
    setCopilotMessages((prev) => [...prev, newMsg]);
    setCopilotInput("");

    setTimeout(() => {
      let reply = "";
      const lower = userQuery.toLowerCase();
      if (lower.includes("order") || lower.includes("sales") || lower.includes("revenue")) {
        const total = orders.reduce((acc, o) => acc + o.amount, 0);
        reply = `Revenue Summary:\n• Total Processed GMV: ₹${total.toLocaleString()}\n• Captured Orders: ${orders.length}\n• Top Performing Store: PixelMart (₹17,999 item) followed by NexusStore (₹12,898 total). All payments verified via Razorpay Test Gateway.`;
      } else if (lower.includes("raya") || lower.includes("shopper") || lower.includes("agent")) {
        reply = `Inter-Agent Handshake Report:\nRaya (Shopper Agent) regularly pings the Merchant Console Agent for product availability. In the last hour, Raya requested 14 catalog syncs and 3 checkout authorizations. All transactions adhered to active merchant policy guardrails.`;
      } else if (lower.includes("ebay") || lower.includes("cross")) {
        reply = `Cross-Store & eBay Intelligence:\nCross-Store Add-ons are currently active. Shoppers with gaming gear are converting at +34% when recommended Nexus MagVolt Powerbanks or studio audio accessories.`;
      } else {
        reply = `Action completed: Your store parameters and telemetry across NexusStore, ThreadVault, PixelMart, and eBay are fully operational. Current Razorpay API Test Mode status: Verified & Active.`;
      }

      setCopilotMessages((prev) => [
        ...prev,
        { role: "copilot", text: reply, time: "Just now" },
      ]);
    }, 600);
  };

  const totalGMV = orders.reduce((sum, o) => sum + o.amount, 0);

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
                  <span>Powered by Razorpay & Autonomous Agent Bridge</span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              <span>Razorpay Test Gateway: Connected</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>4/4 Stores Live</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6 flex-1">
        {/* Executive Metrics Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Gross Merchandise Value</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              ₹{totalGMV.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
              <span>+18.4%</span>
              <span className="text-slate-400">via Raya autonomous checkout</span>
            </span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Autonomous Orders</span>
              <ShoppingBag className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">{orders.length}</div>
            <span className="text-[10px] text-blue-600 font-semibold">100% Captured in Test Mode</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Average Order Value</span>
              <Layers className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              ₹{Math.round(totalGMV / orders.length).toLocaleString()}
            </div>
            <span className="text-[10px] text-purple-600 font-semibold">Cross-store bundles enabled</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Purchase Guardrails</span>
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">100% Safe</div>
            <span className="text-[10px] text-slate-500">0 budget cap violations</span>
          </div>
        </div>

        {/* Connected Stores Telemetry Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span>Connected Store Telemetry</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">Inter-Agent Protocol v1.4</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-amber-200/70 bg-amber-50/40 flex items-center justify-between">
              <div>
                <div className="font-extrabold text-xs text-amber-900">⚡ NexusStore</div>
                <div className="text-[10px] text-amber-700 font-medium">Smart Techwear & Audio • 40 SKUs</div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>

            <div className="p-3 rounded-xl border border-stone-200/70 bg-stone-50 flex items-center justify-between">
              <div>
                <div className="font-extrabold text-xs text-stone-900">🧵 ThreadVault</div>
                <div className="text-[10px] text-stone-700 font-medium">Minimalist Luxury • 40 SKUs</div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>

            <div className="p-3 rounded-xl border border-purple-200/70 bg-purple-50/40 flex items-center justify-between">
              <div>
                <div className="font-extrabold text-xs text-purple-900">🎮 PixelMart</div>
                <div className="text-[10px] text-purple-700 font-medium">Creator & RGB Gear • 40 SKUs</div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>

            <div className="p-3 rounded-xl border border-blue-200/70 bg-blue-50/40 flex items-center justify-between">
              <div>
                <div className="font-extrabold text-xs text-blue-900">🛍️ eBay Marketplace</div>
                <div className="text-[10px] text-blue-700 font-medium">Browse API OAuth • Live Certified</div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
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
            Live Orders & Razorpay Settlements
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

        {/* Tab 1: Orders Table */}
        {activeTab === "orders" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Recent Customer Transactions</h3>
                <p className="text-[11px] text-slate-500">Real-time settlements via Razorpay Test Gateway</p>
              </div>
              <button
                onClick={() => {
                  setOrders((prev) => [
                    {
                      id: `ord_live_${Math.random().toString(36).substring(2, 6)}`,
                      razorpayPaymentId: `pay_test_${Math.random().toString(36).substring(2, 10)}`,
                      store: "NexusStore",
                      storeBadge: "bg-amber-100 text-amber-800",
                      customer: "Shopper Agent (Raya)",
                      items: "Nexus MagVolt 10000mAh Wireless Powerbank (x1)",
                      amount: 2199,
                      status: "CAPTURED",
                      agentHandshake: "Frequently Bought Together Add-on",
                      time: "Just now",
                    },
                    ...prev,
                  ]);
                }}
                className="px-3 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Simulate New Sale</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="p-3 pl-4">Order ID & Gateway Reference</th>
                    <th className="p-3">Store</th>
                    <th className="p-3">Purchased Items</th>
                    <th className="p-3">Customer / Protocol</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3 pl-4">
                        <div className="font-bold text-slate-900">{o.id}</div>
                        <div className="font-mono text-[10px] text-blue-600">{o.razorpayPaymentId}</div>
                        <div className="text-[10px] text-slate-400">{o.time}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.storeBadge}`}>
                          {o.store}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="font-medium text-slate-800">{o.items}</span>
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
          </div>
        )}

        {/* Tab 2: Merchant Copilot */}
        {activeTab === "copilot" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col h-[520px]">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Merchant Copilot</h3>
                  <p className="text-[10px] text-slate-500">Autonomous Store Intelligence & Inter-Agent Relay</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                Active Relay
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
            </div>

            <form onSubmit={handleCopilotSend} className="p-3 border-t border-slate-200 flex items-center gap-2 bg-slate-50">
              <input
                type="text"
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                placeholder="Ask Merchant Copilot (e.g. 'Summarize sales', 'How is Raya cross-selling my items?')..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
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
                  ✓ Active: Nexus MagVolt, Pulse Earbuds & Techwear Bomber Jacket recommended as complementary items.
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
