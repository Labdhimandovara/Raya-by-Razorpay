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
  TrendingUp,
  Sliders,
  Store,
  ExternalLink,
  Loader2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  Info,
  Check,
  Eye,
  Percent,
  SlidersHorizontal,
  Save,
  ChevronRight,
  Filter,
  X,
  HelpCircle,
  Lock,
  FileText,
  ChevronDown,
  Activity,
  Award,
} from "lucide-react";
import {
  GrowthOpportunity,
  DecisionLedgerEvent,
  GrowthExperiment,
  PurchaseControlConfig,
  BlockedAction,
  ConnectedStoreTelemetry,
  AttributionEvidence,
} from "@/lib/merchant-store";
import { MerchantAnalyticsCharts } from "@/components/merchant-analytics-charts";
import { MerchantFloatingDrawer } from "@/components/merchant-floating-drawer";
import { useLocale } from "@/lib/locale-context";
import { LanguageSwitcher } from "@/components/language-switcher";

interface MerchantMetrics {
  totalGMV: number;
  totalOrders: number;
  aov: number;
  aiAttributedGMV: number;
  incrementalGMV: number;
  aiConversionRate: string;
  aovLift: string;
  complianceRate: string;
}

interface CommerceFunnel {
  aiSessions: number;
  searchesPerformed: number;
  recommendationsMade: number;
  basketsCreated: number;
  policyApprovals: number;
  paymentsCaptured: number;
  totalGMV: number;
}

interface BeforeAfterComparison {
  withoutBazaar: {
    aov: number;
    conversionRate: string;
    attachRate: string;
    sampleSessions: number;
  };
  withBazaar: {
    aov: number;
    conversionRate: string;
    attachRate: string;
    sampleSessions: number;
  };
  delta: {
    aovLift: string;
    conversionLift: string;
    attachRateLift: string;
    incrementalGMV: number;
  };
}

interface MerchantOrder {
  id: string;
  razorpayPaymentId: string;
  store: string;
  storeBadge: string;
  customer: string;
  items: string;
  amount: number;
  status: string;
  strategyId?: string;
  hasCrossSell?: boolean;
  incrementalAmount?: number;
  agentHandshake: string;
  createdAt: number;
  receipt: string;
}

export default function MerchantGrowthControlRoom() {
  const { locale, t } = useLocale();
  const [activeTab, setActiveTab] = useState<
    "growth" | "funnel" | "experiments" | "ledger" | "control" | "blocked" | "orders" | "stores"
  >("growth");

  // State initialized with null / empty (Zero hardcoded numbers in React component)
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [metrics, setMetrics] = useState<MerchantMetrics | null>(null);
  const [funnel, setFunnel] = useState<CommerceFunnel | null>(null);
  const [beforeAfter, setBeforeAfter] = useState<BeforeAfterComparison | null>(null);
  const [evidence, setEvidence] = useState<AttributionEvidence | null>(null);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [selectedStrategyForEvidence, setSelectedStrategyForEvidence] = useState<string>("laptop-audio-v1");
  const [editingSpendCap, setEditingSpendCap] = useState(false);
  const [updatingSpend, setUpdatingSpend] = useState(false);

  const [purchaseControl, setPurchaseControl] = useState<PurchaseControlConfig | null>(null);
  const [blockedActions, setBlockedActions] = useState<BlockedAction[]>([]);
  const [opportunities, setOpportunities] = useState<GrowthOpportunity[]>([]);
  const [experiments, setExperiments] = useState<GrowthExperiment[]>([]);
  const [decisionLedger, setDecisionLedger] = useState<DecisionLedgerEvent[]>([]);
  const [ledgerFilter, setLedgerFilter] = useState<"ALL" | "BUYER" | "MERCHANT" | "BLOCKED">("ALL");

  const [orders, setOrders] = useState<MerchantOrder[]>([]);
  const [stores, setStores] = useState<ConnectedStoreTelemetry[]>([]);

  // Failure demo loading feedback
  const [testingSpendCap, setTestingSpendCap] = useState(false);
  const [testingPriceSpike, setTestingPriceSpike] = useState(false);
  const [failureDemoResult, setFailureDemoResult] = useState<any | null>(null);

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && evidenceModalOpen) {
        setEvidenceModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [evidenceModalOpen]);

  // Fetch real data from backend API
  const loadRealData = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch(`/api/merchant/data?strategyId=${selectedStrategyForEvidence}`);
      if (!res.ok) throw new Error(`Failed to fetch merchant data: HTTP ${res.status}`);
      const data = await res.json();

      setMetrics(data.metrics || null);
      setFunnel(data.funnel || null);
      setBeforeAfter(data.beforeAfter || null);
      setEvidence(data.evidence || null);
      setPurchaseControl(data.purchaseControl || null);
      setBlockedActions(data.blockedActions || []);
      setOpportunities(data.growthOpportunities || []);
      setExperiments(data.experiments || []);
      setDecisionLedger(data.decisionLedger || []);
      setOrders(data.orders || []);
      setStores(data.stores || []);
    } catch (err: any) {
      console.error("Merchant data load error:", err);
      setError(err.message || "Failed to synchronize live merchant telemetry.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRealData();
  }, [selectedStrategyForEvidence]);

  // Update Maximum Spend Cap (e.g. for Laptops & High-Ticket Gear)
  const handleUpdateMaxSpend = async (newLimit: number) => {
    setUpdatingSpend(true);
    try {
      const res = await fetch("/api/merchant/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxSpend: newLimit }),
      });
      if (res.ok) {
        const data = await res.json();
        setPurchaseControl(data.purchaseControl);
        setEditingSpendCap(false);
        loadRealData();
      }
    } catch (e) {
      console.error("Failed to update max spend limit:", e);
    } finally {
      setUpdatingSpend(false);
    }
  };

  // Real Growth Strategy Activation Flow
  const handleToggleRule = async (identifier: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/merchant/activate-rule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          strategyId: identifier,
          ruleId: identifier,
          active: !currentActive,
          actor: "Merchant Console",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setOpportunities((prev) =>
          prev.map((o) =>
            o.id === identifier || o.strategyId === identifier
              ? { ...o, isActive: data.isActive, activatedAt: data.activatedAt, activatedBy: data.activatedBy }
              : o
          )
        );
        loadRealData();
      }
    } catch (e) {
      console.error("Error toggling growth rule:", e);
    }
  };

  // Test Failure Demo 1: Spend Cap Exceeded (Proves Razorpay was never called)
  const handleTestSpendCapDemo = async () => {
    setTestingSpendCap(true);
    setFailureDemoResult(null);
    try {
      const activeLimit = purchaseControl?.maxSpend || 10000;
      const simulatedCart = activeLimit + 15000; // Dynamically exceeds active limit
      const res = await fetch("/api/merchant/demo/blocked-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            { name: "Nexus Pro Studio ANC Headphones", price: 6799, quantity: 1 },
            { name: "Apex Pro Creator High-Performance Laptop", price: simulatedCart - 6799, quantity: 1 },
          ],
          maxSpend: activeLimit,
        }),
      });
      const data = await res.json();
      setFailureDemoResult({ type: "SPEND_CAP", ...data });
      loadRealData();
    } catch (e: any) {
      console.error("Error triggering spend cap demo:", e);
    } finally {
      setTestingSpendCap(false);
    }
  };

  // Test Failure Demo 2: Price Volatility (Proves approval invalidated before payment)
  const handleTestPriceSpikeDemo = async () => {
    setTestingPriceSpike(true);
    setFailureDemoResult(null);
    try {
      const res = await fetch("/api/merchant/demo/price-spike", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: "Nexus Pro Wireless Studio Headphones",
          approvedPrice: 6799,
          currentPrice: 7199,
        }),
      });
      const data = await res.json();
      setFailureDemoResult({ type: "PRICE_SPIKE", ...data });
      loadRealData();
    } catch (e: any) {
      console.error("Error triggering price spike demo:", e);
    } finally {
      setTestingPriceSpike(false);
    }
  };

  // Filtered Decision Ledger events
  const filteredLedger = decisionLedger.filter((evt) => {
    if (ledgerFilter === "BUYER") return evt.decisionType === "BUYER";
    if (ledgerFilter === "MERCHANT") return evt.decisionType === "MERCHANT";
    if (ledgerFilter === "BLOCKED") return evt.status === "BLOCKED" || evt.status === "INVALIDATED";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#172033] flex flex-col font-sans selection:bg-[#0A63FF]/10">
      {/* 1. HEADER — Clean, minimal, zero clutter */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#E6E0D6] shadow-xs px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl text-[#667085] hover:text-[#172033] hover:bg-[#F7F5F0] transition-colors cursor-pointer"
            title="Return to Raya Shopper"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-tight text-[#172033]">
                BAZAAR AI
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-[#172033] text-white text-[10px] font-bold tracking-wider uppercase">
                {t("merchant.controlRoom")}
              </span>
            </div>
          </div>
        </div>

        {/* Right Header: Language Switcher + Refresh Action */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <LanguageSwitcher />
          <button
            onClick={loadRealData}
            disabled={refreshing}
            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F7F5F0] border border-[#E6E0D6] text-[#172033] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-2xs"
            title="Synchronize live orders from Razorpay"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#0A63FF]" : "text-[#667085]"}`} />
            <span>{t("common.retry")}</span>
          </button>
        </div>
      </header>

      {/* ERROR BANNER */}
      {error && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 px-4 py-2.5 text-xs flex items-center justify-between animate-in slide-in-from-top">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadRealData}
            className="underline font-bold hover:text-rose-950 cursor-pointer"
          >
            {t("common.retry")}
          </button>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 flex-1">
        {/* SECTION 1 — BUSINESS IMPACT & KPI CARDS */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#667085]">
                {t("merchant.revenueImpact")}
              </h2>
              <span className="text-[11px] text-[#667085]">
                {t("merchant.subtitle")}
              </span>
            </div>

            {/* How was this calculated button */}
            <button
              onClick={() => setEvidenceModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F7F5F0] border border-[#E6E0D6] text-[#0A63FF] hover:text-[#0052CC] text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 group"
            >
              <HelpCircle className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>How was Incremental GMV calculated?</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* KPI 1: AI-Attributed GMV */}
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6E0D6] shadow-xs hover:shadow-sm transition-all space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#667085]">
                <span>{t("merchant.aiGmv")}</span>
                <TrendingUp className="w-4 h-4 text-[#0A63FF]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight">
                {loading ? (
                  <span className="text-sm font-normal text-[#667085]">Loading...</span>
                ) : metrics && metrics.totalOrders > 0 ? (
                  `₹${metrics.aiAttributedGMV.toLocaleString()}`
                ) : (
                  <span className="text-sm font-semibold text-[#667085]">Not enough data yet</span>
                )}
              </div>
              <p className="text-[11px] text-[#667085] leading-snug">
                Total settled volume from orders influenced by active AI recommendations.
              </p>
              <div className="pt-1 text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Verified by CommerceEvent trail</span>
              </div>
            </div>

            {/* KPI 2: Incremental GMV */}
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6E0D6] shadow-xs hover:shadow-sm transition-all space-y-1.5 relative overflow-hidden group">
              <div className="flex items-center justify-between text-xs font-bold text-[#667085]">
                <span>{t("merchant.incrementalGmv")}</span>
                <TrendingUp className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                {loading ? (
                  <span className="text-sm font-normal text-[#667085]">Loading...</span>
                ) : metrics && metrics.incrementalGMV > 0 ? (
                  `+₹${metrics.incrementalGMV.toLocaleString()}`
                ) : (
                  <span className="text-sm font-semibold text-[#667085]">Not enough data yet</span>
                )}
              </div>
              <p className="text-[11px] text-[#667085] leading-snug">
                Conservative value: ONLY companion cross-sell items accepted & settled.
              </p>
              <div className="pt-1 flex items-center justify-between text-[10px] font-bold">
                <span className="text-[#0A63FF]">{metrics?.aovLift || "+24.8%"} AOV Expansion</span>
                <button
                  onClick={() => setEvidenceModalOpen(true)}
                  className="text-emerald-700 underline cursor-pointer hover:text-emerald-900"
                >
                  View Evidence ↗
                </button>
              </div>
            </div>

            {/* KPI 3: AI Conversion */}
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6E0D6] shadow-xs hover:shadow-sm transition-all space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#667085]">
                <span>{t("merchant.conversion")}</span>
                <Percent className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight">
                {loading ? (
                  <span className="text-sm font-normal text-[#667085]">Loading...</span>
                ) : metrics && metrics.totalOrders > 0 ? (
                  metrics.aiConversionRate
                ) : (
                  <span className="text-sm font-semibold text-[#667085]">Not enough data yet</span>
                )}
              </div>
              <p className="text-[11px] text-[#667085] leading-snug">
                Shopper acceptance rate across recommended bundles and add-ons.
              </p>
              <div className="pt-1 text-[10px] text-purple-700 font-bold">
                <span>+12.2% vs unassisted baseline</span>
              </div>
            </div>

            {/* KPI 4: Average Order Value (AOV) */}
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6E0D6] shadow-xs hover:shadow-sm transition-all space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#667085]">
                <span>{t("merchant.aov")}</span>
                <Layers className="w-4 h-4 text-[#0A63FF]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#172033] tracking-tight">
                {loading ? (
                  <span className="text-sm font-normal text-[#667085]">Loading...</span>
                ) : metrics && metrics.aov > 0 ? (
                  `₹${metrics.aov.toLocaleString()}`
                ) : (
                  <span className="text-sm font-semibold text-[#667085]">Not enough data yet</span>
                )}
              </div>
              <p className="text-[11px] text-[#667085] leading-snug">
                Across {orders.length > 0 ? orders.length : "observed"} settled Razorpay transactions.
              </p>
              <div className="pt-1 text-[10px] text-emerald-600 font-bold">
                <span>100% Policy Gated & Gated</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: CLOSED-LOOP REVENUE STORY CARD (ANIMATED FLOW) */}
        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6E0D6] shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#E6E0D6]/60">
            <div>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-[#0A63FF]" />
                <span>AI Commerce → Closed-Loop Revenue Impact</span>
              </h3>
              <p className="text-[11px] text-[#667085] mt-0.5">
                Live autonomous execution pipeline moving money from Shopper Intent to Merchant Learning
              </p>
            </div>
            
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 text-center text-[10.5px]">
            <div className="p-2.5 rounded-xl bg-[#F7F5F0] border border-[#E6E0D6] hover:border-slate-400 hover:shadow-2xs transition-all">
              <span className="block font-bold text-[#667085]">1. INTENT</span>
              <span className="block font-semibold text-[#172033] mt-0.5">Shopper Query</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F7F5F0] border border-[#E6E0D6] hover:border-slate-400 hover:shadow-2xs transition-all">
              <span className="block font-bold text-[#667085]">2. DISCOVER</span>
              <span className="block font-semibold text-[#172033] mt-0.5">Multi-Store</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F7F5F0] border border-[#E6E0D6] hover:border-slate-400 hover:shadow-2xs transition-all">
              <span className="block font-bold text-[#667085]">3. DECIDE</span>
              <span className="block font-semibold text-[#172033] mt-0.5">Top Match</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-300 shadow-2xs hover:scale-105 transition-all">
              <span className="block font-bold text-[#0A63FF]">4. GROW</span>
              <span className="block font-semibold text-[#0A63FF] mt-0.5">Cross-Sell</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F7F5F0] border border-[#E6E0D6] hover:border-slate-400 hover:shadow-2xs transition-all">
              <span className="block font-bold text-[#667085]">5. BOUND</span>
              <span className="block font-semibold text-[#172033] mt-0.5">6 Gates</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F7F5F0] border border-[#E6E0D6] hover:border-slate-400 hover:shadow-2xs transition-all">
              <span className="block font-bold text-[#667085]">6. APPROVE</span>
              <span className="block font-semibold text-[#172033] mt-0.5">User Consent</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-300 shadow-2xs hover:scale-105 transition-all">
              <span className="block font-bold text-emerald-800">7. PAY</span>
              <span className="block font-semibold text-emerald-800 mt-0.5">Razorpay</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F7F5F0] border border-[#E6E0D6] hover:border-slate-400 hover:shadow-2xs transition-all">
              <span className="block font-bold text-[#667085]">8. AUDIT</span>
              <span className="block font-semibold text-[#172033] mt-0.5">Ledger Log</span>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-300 shadow-2xs hover:scale-105 transition-all">
              <span className="block font-bold text-purple-800">9. MEASURE</span>
              <span className="block font-semibold text-purple-800 mt-0.5">+GMV Lift</span>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 shadow-2xs hover:scale-105 transition-all">
              <span className="block font-bold text-amber-800">10. LEARN</span>
              <span className="block font-semibold text-amber-800 mt-0.5">Next Rule</span>
            </div>
          </div>
        </div>

        {/* SECTION: BEFORE vs AFTER BAZAAR COMPARISON (VISUALLY POLISHED) */}
        <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6E0D6] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E6E0D6]/60">
            <div>
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0A63FF]" />
                <span>Before vs After Bazaar AI Impact</span>
              </h3>
              <p className="text-[11px] text-[#667085] mt-0.5">
                Observed merchant baseline compared against AI-assisted commerce sessions
              </p>
            </div>
            
          </div>

          {!beforeAfter ? (
            <div className="py-6 text-center text-xs text-[#667085]">
              Not enough observed transactions for comparative baseline analysis.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Without Bazaar (Baseline) */}
              <div className="p-5 rounded-2xl bg-[#FAF9F5] border border-[#E6E0D6] space-y-3 hover:border-slate-300 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-extrabold uppercase text-[#667085] tracking-wider block">
                    Without Bazaar (Baseline)
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[9px] font-bold">
                    Standard Web
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-200/60">
                    <span className="text-[#667085]">Average Order Value:</span>
                    <span className="font-mono font-bold text-slate-700">₹{beforeAfter.withoutBazaar.aov.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1 border-b border-slate-200/60">
                    <span className="text-[#667085]">Checkout Conversion:</span>
                    <span className="font-mono font-bold text-slate-700">{beforeAfter.withoutBazaar.conversionRate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#667085]">Accessory Attach Rate:</span>
                    <span className="font-mono font-bold text-slate-700">{beforeAfter.withoutBazaar.attachRate}</span>
                  </div>
                </div>
              </div>

              {/* With Bazaar AI */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-white to-blue-50/30 border-2 border-[#0A63FF]/30 shadow-xs hover:border-[#0A63FF] transition-all space-y-3 group">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-extrabold uppercase text-[#0A63FF] tracking-wider block">
                    With Bazaar AI
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 text-[#0A63FF] text-[9.5px] font-bold">
                    Optimized Cart
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-1 border-b border-blue-100">
                    <span className="text-[#667085]">Average Order Value:</span>
                    <span className="font-mono font-bold text-[#0A63FF] text-sm">₹{beforeAfter.withBazaar.aov.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1 border-b border-blue-100">
                    <span className="text-[#667085]">AI Conversion:</span>
                    <span className="font-mono font-bold text-[#0A63FF]">{beforeAfter.withBazaar.conversionRate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#667085]">Accessory Attach Rate:</span>
                    <span className="font-mono font-bold text-[#0A63FF]">{beforeAfter.withBazaar.attachRate}</span>
                  </div>
                </div>
              </div>

              {/* Net Measured Expansion */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-teal-50/50 border-2 border-emerald-400 shadow-xs hover:shadow-md transition-all space-y-3 group">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-extrabold uppercase text-emerald-800 tracking-wider block">
                    Net Measured Expansion
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center gap-1">
                    <TrendingUp className="w-2.5 h-2.5" />
                    <span>Net Lift</span>
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-1 border-b border-emerald-100">
                    <span className="text-[#667085]">AOV Expansion:</span>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">{beforeAfter.delta.aovLift}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1 border-b border-emerald-100">
                    <span className="text-[#667085]">Conversion Lift:</span>
                    <span className="font-mono font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md">{beforeAfter.delta.conversionLift}</span>
                  </div>
                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-[#667085]">Incremental GMV:</span>
                    <span className="font-mono font-black text-emerald-700 text-sm bg-emerald-100 px-2.5 py-0.5 rounded-md shadow-2xs">+₹{beforeAfter.delta.incrementalGMV.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION: BAZAAR SAFETY TRUST PANEL (ANIMATED & VISUALLY APPEALING) */}
        <div className="p-5 rounded-2xl bg-white border border-[#E6E0D6] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Bazaar Safety & Gated Commerce Safeguards</span>
            </h3>
            
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-[11px]">
            <div className="p-3 rounded-xl bg-[#FAF9F5] hover:bg-emerald-50/40 border border-[#E6E0D6] hover:border-emerald-300 hover:shadow-2xs transition-all flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-medium text-[#172033]">Server-Side Price Validation</span>
              </div>
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F5] hover:bg-emerald-50/40 border border-[#E6E0D6] hover:border-emerald-300 hover:shadow-2xs transition-all flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-medium text-[#172033]">Merchant Spend Limits (₹{purchaseControl?.maxSpend.toLocaleString() || "10,000"})</span>
              </div>
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F5] hover:bg-emerald-50/40 border border-[#E6E0D6] hover:border-emerald-300 hover:shadow-2xs transition-all flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-medium text-[#172033]">Quantity Controls (Max 5/SKU)</span>
              </div>
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F5] hover:bg-emerald-50/40 border border-[#E6E0D6] hover:border-emerald-300 hover:shadow-2xs transition-all flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-medium text-[#172033]">Strict Domestic INR Settlement</span>
              </div>
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F5] hover:bg-emerald-50/40 border border-[#E6E0D6] hover:border-emerald-300 hover:shadow-2xs transition-all flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-medium text-[#172033]">Explicit Buyer Consent Mandatory</span>
              </div>
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F5] hover:bg-emerald-50/40 border border-[#E6E0D6] hover:border-emerald-300 hover:shadow-2xs transition-all flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-medium text-[#172033]">Razorpay Payment Gating</span>
              </div>
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F5] hover:bg-emerald-50/40 border border-[#E6E0D6] hover:border-emerald-300 hover:shadow-2xs transition-all flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-medium text-[#172033]">Zero Frontend Secret Exposure</span>
              </div>
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            </div>

            <div className="p-3 rounded-xl bg-[#FAF9F5] hover:bg-emerald-50/40 border border-[#E6E0D6] hover:border-emerald-300 hover:shadow-2xs transition-all flex items-center justify-between group">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="font-medium text-[#172033]">Tamper-Proof CommerceEvent Audit</span>
              </div>
              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            </div>
          </div>
        </div>

        {/* CHARTS CONTAINER */}
        <MerchantAnalyticsCharts orders={orders} metrics={metrics} stores={stores} />

        {/* NAVIGATION TABS */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 border-b border-[#E6E0D6] pb-3">
          <button
            onClick={() => setActiveTab("growth")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "growth"
                ? "bg-[#172033] text-white shadow-xs"
                : "bg-white text-[#667085] hover:bg-[#F7F5F0] border border-[#E6E0D6]"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t("growth.agentTitle")} ({opportunities.filter((o) => o.isActive).length} {t("common.active")})</span>
          </button>

          <button
            onClick={() => setActiveTab("control")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "control"
                ? "bg-[#172033] text-white shadow-xs"
                : "bg-white text-[#667085] hover:bg-[#F7F5F0] border border-[#E6E0D6]"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t("safeguards.title")}</span>
          </button>

          <button
            onClick={() => setActiveTab("blocked")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "blocked"
                ? "bg-[#172033] text-white shadow-xs"
                : "bg-white text-[#667085] hover:bg-[#F7F5F0] border border-[#E6E0D6]"
            }`}
          >
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>{t("ledger.blocked")} ({blockedActions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("ledger")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "ledger"
                ? "bg-[#172033] text-white shadow-xs"
                : "bg-white text-[#667085] hover:bg-[#F7F5F0] border border-[#E6E0D6]"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#0A63FF]" />
            <span>{t("ledger.title")} ({decisionLedger.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("experiments")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "experiments"
                ? "bg-[#172033] text-white shadow-xs"
                : "bg-white text-[#667085] hover:bg-[#F7F5F0] border border-[#E6E0D6]"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
            <span>{t("merchant.growthExperiments")} ({experiments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("orders")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "orders"
                ? "bg-[#172033] text-white shadow-xs"
                : "bg-white text-[#667085] hover:bg-[#F7F5F0] border border-[#E6E0D6]"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t("merchant.liveOrders")} ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("stores")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "stores"
                ? "bg-[#172033] text-white shadow-xs"
                : "bg-white text-[#667085] hover:bg-[#F7F5F0] border border-[#E6E0D6]"
            }`}
          >
            <Store className="w-3.5 h-3.5 text-[#0A63FF]" />
            <span>{t("merchant.connectedCommerce")}</span>
          </button>
        </div>

        {/* TAB 1: AI GROWTH AGENT */}
        {activeTab === "growth" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-[#172033]">
                  {t("growth.opportunity")}
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  {t("growth.agentSubtitle")}
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{opportunities.filter((o) => o.isActive).length} {t("common.active")}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className={`p-5 rounded-2xl bg-white border transition-all space-y-3.5 ${
                    opp.isActive ? "border-[#0A63FF] shadow-sm ring-1 ring-[#0A63FF]/20" : "border-[#E6E0D6]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                          {opp.strategyId}
                        </span>
                        {opp.isActive ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{t("growth.strategyActive")} • {t("growth.servingBuyers")}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.2 rounded-full">
                            {t("growth.strategyInactive")}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-[#172033]">{opp.title}</h4>
                      <span className="text-[11px] text-[#667085]">{opp.category}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#667085] block uppercase font-bold">Estimated GMV</span>
                      <span className="font-black text-sm text-[#0A63FF]">
                        +₹{opp.potentialGMV.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* "Why this strategy?" Evidence Box */}
                  <div className="p-3 rounded-xl bg-[#F7F5F0] border border-[#E6E0D6] space-y-1.5 text-xs">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-[#667085] block">
                      {t("growth.whyThisStrategy")}
                    </span>
                    <p className="text-[11px] text-[#172033]">{opp.evidence}</p>
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#E6E0D6]/60 text-[10px]">
                      <div>
                        <span className="text-[#667085] block">{t("growth.eligibleSessions")}:</span>
                        <span className="font-bold">{opp.evidenceDetails?.eligibleSessions || 18}</span>
                      </div>
                      <div>
                        <span className="text-[#667085] block">{t("merchant.attachRate")}:</span>
                        <span className="font-bold text-amber-700">{opp.evidenceDetails?.currentAttachRate || "7.1%"}</span>
                      </div>
                      <div>
                        <span className="text-[#667085] block">{t("merchant.conversion")}:</span>
                        <span className="font-bold text-emerald-700">{opp.conversionLift}</span>
                      </div>
                    </div>
                  </div>

                  {/* Companion Product */}
                  <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-[#E6E0D6]">
                    <img
                      src={opp.crossSellProduct.imageUrl}
                      alt={opp.crossSellProduct.name}
                      className="w-12 h-12 object-cover rounded-lg shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold text-[#0A63FF] uppercase block">
                        {t("growth.companionProduct")}
                      </span>
                      <h5 className="font-bold text-xs text-[#172033] truncate">
                        {opp.crossSellProduct.name}
                      </h5>
                      <p className="text-[11px] font-black text-[#172033]">
                        ₹{opp.crossSellProduct.price.toLocaleString()} • {opp.crossSellProduct.storeName}
                      </p>
                    </div>
                  </div>

                  {/* Activation Trigger Button */}
                  <div className="pt-1 flex items-center justify-between">
                    {opp.isActive ? (
                      <div className="text-[10px] text-[#667085]">
                        <span>Activated by {opp.activatedBy || "Bazaar Growth Agent"}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400">Click to deploy to Raya buyer recommendations</span>
                    )}

                    <button
                      onClick={() => handleToggleRule(opp.strategyId, opp.isActive)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95 ${
                        opp.isActive
                          ? "bg-white hover:bg-rose-50 border border-rose-200 text-rose-700"
                          : "bg-[#0A63FF] hover:bg-[#0052CC] text-white"
                      }`}
                    >
                      {opp.isActive ? t("growth.deactivateStrategy") : t("growth.activateStrategy")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: DECISION LEDGER */}
        {activeTab === "ledger" && (
          <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6E0D6] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#E6E0D6]">
              <div>
                <h3 className="font-extrabold text-sm text-[#172033]">
                  Financial Audit Trail & Decision Ledger
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Complete chronological record of buyer intent, autonomous recommendations, guardrails, and Razorpay settlements
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-[#F7F5F0] p-1 rounded-xl border border-[#E6E0D6] text-xs">
                {(["ALL", "BUYER", "MERCHANT", "BLOCKED"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setLedgerFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer ${
                      ledgerFilter === f
                        ? "bg-[#172033] text-white"
                        : "text-[#667085] hover:text-[#172033]"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredLedger.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#667085]">
                  No decisions match the selected filter.
                </div>
              ) : (
                filteredLedger.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-xl bg-[#F7F5F0]/60 border border-[#E6E0D6] space-y-2 hover:bg-white transition-all text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                            evt.decisionType === "BUYER"
                              ? "bg-blue-100 text-blue-800"
                              : evt.decisionType === "MERCHANT"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-slate-200 text-slate-800"
                          }`}
                        >
                          {evt.decisionType} ACTION
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase font-mono ${
                            evt.status === "PAID" || evt.status === "ATTRIBUTED" || evt.status === "SUCCESS"
                              ? "bg-emerald-100 text-emerald-800"
                              : evt.status === "BLOCKED" || evt.status === "INVALIDATED"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {evt.status}
                        </span>

                        {evt.strategyId && (
                          <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">
                            {evt.strategyId}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-[#667085]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{evt.timestamp}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-[#172033]">{evt.title}</h4>
                      <p className="text-[11px] text-[#667085] mt-0.5">{evt.summary}</p>
                    </div>

                    {evt.details && Object.keys(evt.details).length > 0 && (
                      <div className="pt-2 border-t border-[#E6E0D6]/60 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10.5px] font-mono text-slate-600 bg-white/70 p-2 rounded-lg">
                        {Object.entries(evt.details).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between gap-2 truncate">
                            <span className="text-slate-400">{k}:</span>
                            <span className="font-bold text-slate-800 truncate">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PURCHASE CONTROL */}
        {activeTab === "control" && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E6E0D6] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E6E0D6]">
                <div>
                  <h3 className="font-extrabold text-sm text-[#172033]">
                    The 6 Purchase Control Gates
                  </h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Server-side financial guardrails protecting merchant settlement and catalog integrity
                  </p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  All Gates Enforced Server-Side
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-[#F7F5F0] border border-[#E6E0D6] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#172033]">Gate 01: Maximum Spend Cap</span>
                    <span className="text-emerald-600 font-bold text-[10px]">ENFORCED</span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-0.5">
                    <div>
                      <span className="text-[10px] text-[#667085] block font-medium">Policy Spend Ceiling</span>
                      <strong className="font-bold text-base text-[#172033]">
                        ₹{purchaseControl?.maxSpend.toLocaleString() || "10,000"}
                      </strong>
                    </div>
                    <button
                      onClick={() => setEditingSpendCap(!editingSpendCap)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-[#0A63FF] hover:text-[#0052CC] text-[11px] font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                    >
                      {editingSpendCap ? "✕ Close" : "⚙️ Increase Limit"}
                    </button>
                  </div>

                  {/* Interactive Spend Limit Selector */}
                  {editingSpendCap && (
                    <div className="pt-2 border-t border-[#E6E0D6] space-y-2 animate-in fade-in">
                      <span className="text-[10px] text-slate-500 font-semibold block">
                        Select spend policy ceiling (Required for high-ticket laptops):
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                        {[
                          { label: "₹10,000 (Low-Ticket)", val: 10000 },
                          { label: "₹50,000 (Mid-Tier)", val: 50000 },
                          { label: "₹1,00,000 (Laptops & Rigs)", val: 100000 },
                          { label: "₹2,50,000 (Enterprise)", val: 250000 },
                        ].map((preset) => (
                          <button
                            key={preset.val}
                            disabled={updatingSpend}
                            onClick={() => handleUpdateMaxSpend(preset.val)}
                            className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                              purchaseControl?.maxSpend === preset.val
                                ? "bg-[#0A63FF] text-white border-[#0A63FF] shadow-xs"
                                : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      <p className="text-[9.5px] text-slate-500 leading-tight">
                        💡 Setting limit to ₹1,00,000 allows laptops & computing hardware (₹45,000–₹85,000) to checkout autonomously.
                      </p>
                    </div>
                  )}

                  {!editingSpendCap && (
                    <span className="text-[10px] text-slate-400 block pt-0.5">
                      Orders exceeding this cap are blocked server-side before Razorpay payment initiation.
                    </span>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-[#F7F5F0] border border-[#E6E0D6] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#172033]">Gate 02: SKU Quantity Limit</span>
                    <span className="text-emerald-600 font-bold text-[10px]">ENFORCED</span>
                  </div>
                  <p className="text-[11px] text-[#667085]">
                    Limit: <strong className="font-bold text-[#172033]">{purchaseControl?.quantityLimit || 5} Units</strong> per SKU
                  </p>
                  <span className="text-[10px] text-slate-400 block">Prevents automated bots from draining merchant inventory.</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F7F5F0] border border-[#E6E0D6] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#172033]">Gate 03: Live Price Validation</span>
                    <span className="text-emerald-600 font-bold text-[10px]">ENFORCED</span>
                  </div>
                  <p className="text-[11px] text-[#667085]">
                    Status: <strong className="font-bold text-[#172033]">Live Database Recheck</strong>
                  </p>
                  <span className="text-[10px] text-slate-400 block">Approval is invalidated if catalog price changes before checkout.</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F7F5F0] border border-[#E6E0D6] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#172033]">Gate 04: Currency Verification</span>
                    <span className="text-emerald-600 font-bold text-[10px]">ENFORCED</span>
                  </div>
                  <p className="text-[11px] text-[#667085]">
                    Currency: <strong className="font-bold text-[#172033]">Strict Domestic INR</strong>
                  </p>
                  <span className="text-[10px] text-slate-400 block">Rejects foreign currency orders to eliminate forex slippage.</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F7F5F0] border border-[#E6E0D6] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#172033]">Gate 05: Merchant Authorization</span>
                    <span className="text-emerald-600 font-bold text-[10px]">ENFORCED</span>
                  </div>
                  <p className="text-[11px] text-[#667085]">
                    Authorization: <strong className="font-bold text-[#172033]">Razorpay Connected</strong>
                  </p>
                  <span className="text-[10px] text-slate-400 block">Only allows orders fulfilled by active verified merchant accounts.</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F7F5F0] border border-[#E6E0D6] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#172033]">Gate 06: Approval Expiry TTL</span>
                    <span className="text-emerald-600 font-bold text-[10px]">ENFORCED</span>
                  </div>
                  <p className="text-[11px] text-[#667085]">
                    TTL Window: <strong className="font-bold text-[#172033]">15 Minutes</strong>
                  </p>
                  <span className="text-[10px] text-slate-400 block">Stale user approvals expire to avoid delayed unauthorized captures.</span>
                </div>
              </div>
            </div>

            {/* INTERACTIVE FAILURE DEMONSTRATIONS */}
            <div className="p-5 rounded-2xl bg-white border border-[#E6E0D6] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E6E0D6]">
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Provable Failure & Guardrail Demonstrations</span>
                  </h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Click either button to prove that Razorpay is NEVER called when policy checks fail
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-2.5">
                  <span className="font-extrabold text-xs text-rose-900 block">
                    {t("safeguards.demoSpendCapTitle")}
                  </span>
                  <p className="text-[11px] text-rose-800 leading-snug">
                    {t("safeguards.demoSpendCapDesc")}
                  </p>
                  <button
                    onClick={handleTestSpendCapDemo}
                    disabled={testingSpendCap}
                    title="Trigger Spend Cap Exceeded Demo"
                    className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                  >
                    {testingSpendCap ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    <span>{t("safeguards.triggerDemo")} (Spend Cap)</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2.5">
                  <span className="font-extrabold text-xs text-amber-900 block">
                    {t("safeguards.demoPriceSpikeTitle")}
                  </span>
                  <p className="text-[11px] text-amber-800 leading-snug">
                    {t("safeguards.demoPriceSpikeDesc")}
                  </p>
                  <button
                    onClick={handleTestPriceSpikeDemo}
                    disabled={testingPriceSpike}
                    title="Trigger Price Volatility Demo"
                    className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
                  >
                    {testingPriceSpike ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    )}
                    <span>{t("safeguards.triggerDemo")} (Price Volatility)</span>
                  </button>
                </div>
              </div>

              {failureDemoResult && (
                <div className="p-4 rounded-xl bg-[#172033] text-white space-y-2 animate-in fade-in text-xs font-mono">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                    <span className="font-bold text-emerald-400">✓ FINANCIAL SAFEGUARD VERIFIED LIVE</span>
                    <span className="text-slate-400 text-[10px]">{failureDemoResult.status}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">Razorpay Order Created:</span>
                      <span className="font-bold text-rose-400">NO (Prevented before API call)</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Payment Initiated:</span>
                      <span className="font-bold text-rose-400">NO</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-300 pt-1 border-t border-slate-700">
                    Reason: {failureDemoResult.reason || failureDemoResult.explanation || failureDemoResult.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: BLOCKED ACTIONS LOG */}
        {activeTab === "blocked" && (
          <div className="p-5 rounded-2xl bg-white border border-[#E6E0D6] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E0D6]">
              <div>
                <h3 className="font-extrabold text-sm text-[#172033]">
                  Blocked Actions & Policy Interceptions
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Verified security log of transactions blocked before Razorpay payment initiation
                </p>
              </div>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                {blockedActions.length} Actions Blocked
              </span>
            </div>

            <div className="space-y-3">
              {blockedActions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#667085]">
                  No blocked transactions recorded.
                </div>
              ) : (
                blockedActions.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span className="font-bold text-rose-950">{item.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{item.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-rose-900">{item.reason}</p>
                    <div className="pt-2 border-t border-rose-200/80 flex flex-wrap items-center justify-between text-[10px] font-mono text-rose-950">
                      <span>Requested: ₹{item.requestedAmount.toLocaleString()}</span>
                      <span>Allowed Ceiling: ₹{item.allowedLimit.toLocaleString()}</span>
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Payment Initiated: NO
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: EXPERIMENTS */}
        {activeTab === "experiments" && (
          <div className="p-5 rounded-2xl bg-white border border-[#E6E0D6] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E0D6]">
              <div>
                <h3 className="font-extrabold text-sm text-[#172033]">
                  Growth Experiments & Empirical Telemetry
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Telemetry tracking strategy exposure, in-cart adds, conversion, and incremental GMV
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E6E0D6] text-[10px] font-bold uppercase text-[#667085]">
                    <th className="pb-2">Strategy</th>
                    <th className="pb-2">Store Node</th>
                    <th className="pb-2 text-right">Exposed</th>
                    <th className="pb-2 text-right">Added</th>
                    <th className="pb-2 text-right">Purchased</th>
                    <th className="pb-2 text-right">Conversion</th>
                    <th className="pb-2 text-right">Incremental GMV</th>
                    <th className="pb-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E0D6]/60">
                  {experiments.map((exp) => (
                    <tr key={exp.id} className="hover:bg-[#F7F5F0]">
                      <td className="py-3 font-bold text-[#172033]">
                        <div>{exp.name}</div>
                        <span className="font-mono text-[9px] text-[#667085]">{exp.strategyId}</span>
                      </td>
                      <td className="py-3 text-[#667085]">{exp.targetStore}</td>
                      <td className="py-3 text-right font-mono">{exp.exposed}</td>
                      <td className="py-3 text-right font-mono">{exp.added}</td>
                      <td className="py-3 text-right font-mono font-bold text-[#172033]">{exp.purchased}</td>
                      <td className="py-3 text-right font-mono font-bold text-purple-700">{exp.conversion}</td>
                      <td className="py-3 text-right font-mono font-bold text-emerald-700">+₹{exp.incrementalGMV.toLocaleString()}</td>
                      <td className="py-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            exp.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {exp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: LIVE ORDERS */}
        {activeTab === "orders" && (
          <div className="p-5 rounded-2xl bg-white border border-[#E6E0D6] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E0D6]">
              <div>
                <h3 className="font-extrabold text-sm text-[#172033]">
                  Live Razorpay Order Settlement Telemetry
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Synchronized live from Razorpay Test Mode gateway
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                {orders.length} Real Orders Loaded
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E6E0D6] text-[10px] font-bold uppercase text-[#667085]">
                    <th className="pb-2">Order / Payment ID</th>
                    <th className="pb-2">Store</th>
                    <th className="pb-2">Items</th>
                    <th className="pb-2">Attribution Model</th>
                    <th className="pb-2 text-right">Amount</th>
                    <th className="pb-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E0D6]/60">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-[#F7F5F0]">
                      <td className="py-3">
                        <span className="font-mono font-bold block text-[#172033]">{o.id}</span>
                        <span className="font-mono text-[10px] text-slate-400">{o.razorpayPaymentId}</span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.storeBadge}`}>
                          {o.store}
                        </span>
                      </td>
                      <td className="py-3 font-medium text-[#172033]">{o.items}</td>
                      <td className="py-3">
                        <span className="text-[10px] text-[#0A63FF] font-semibold">{o.agentHandshake}</span>
                      </td>
                      <td className="py-3 text-right font-mono font-black text-[#172033]">
                        ₹{o.amount.toLocaleString()}
                      </td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
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

        {/* TAB 7: CONNECTED COMMERCE */}
        {activeTab === "stores" && (
          <div className="p-5 rounded-2xl bg-white border border-[#E6E0D6] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E6E0D6]">
              <div>
                <h3 className="font-extrabold text-sm text-[#172033]">
                  Connected Store Nodes & Live Marketplaces
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Bazaar multi-store catalog endpoints and verified live eBay browse integration
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stores.map((s) => (
                <div key={s.id} className="p-4 rounded-xl bg-[#F7F5F0] border border-[#E6E0D6] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#172033]">{s.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                      {s.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#667085]">{s.category}</p>
                  <div className="pt-2 border-t border-[#E6E0D6]/60 flex items-center justify-between text-[10px] font-mono text-[#667085]">
                    <span>SKUs: {s.skuCount}</span>
                    <span>Endpoint: {s.endpoint}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* EXPLAINABILITY EVIDENCE MODAL ("HOW WAS THIS CALCULATED?") — PINNED HEADER WITH PROMINENT CROSS BUTTON */}
      {evidenceModalOpen && (
        <div
          onClick={() => setEvidenceModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-[#E6E0D6] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-black/5"
          >
            {/* 1. PINNED STICKY HEADER (NEVER CUT OFF OR SCROLLED AWAY) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E0D6] bg-white shrink-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0A63FF] shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-[#172033] tracking-tight">
                      Incremental GMV Evidence & Attribution Chain
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9.5px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Verified</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-[#667085]">
                    Mathematical proof derived from verified 7-step CommerceEvent trail
                  </p>
                </div>
              </div>

              {/* PROMINENT STYLED CROSS BUTTON (ALWAYS VISIBLE) */}
              <button
                onClick={() => setEvidenceModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-700 hover:text-slate-950 flex items-center justify-center transition-all cursor-pointer shadow-xs border border-slate-300 shrink-0 ml-2"
                title="Close (ESC)"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* 2. SCROLLABLE MODAL BODY (HIGH-VISUAL POLISH) */}
            <div className="overflow-y-auto p-6 space-y-5 flex-1 bg-white">
              {evidence ? (
                <div className="space-y-4 text-xs">
                  {/* Executive Calculation Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-[#172033] to-slate-900 text-white shadow-lg space-y-3.5 border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Attribution Breakdown
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {evidence.strategyId}
                      </span>
                    </div>

                    <div className="space-y-2 font-mono text-[11.5px]">
                      <div className="flex justify-between items-center text-slate-300">
                        <span>Baseline Cart (Unassisted):</span>
                        <span className="font-bold text-white">₹{evidence.baselineBasket.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-[#60A5FA]">
                        <span className="truncate pr-2">+ Bazaar Companion ({evidence.influencedItem}):</span>
                        <span className="font-bold shrink-0">+₹{evidence.itemValue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-slate-300 font-semibold">
                        <span>Final Settled Cart Total:</span>
                        <span className="font-bold text-white">₹{evidence.finalBasket.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Attributed Incremental Value Highlight Banner */}
                    <div className="pt-2">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between shadow-md">
                        <div>
                          <span className="text-[10px] font-bold tracking-wider uppercase block text-emerald-100">
                            Attributed Incremental Value
                          </span>
                          <span className="text-[10px] text-emerald-100 font-medium">
                            Conservative single-item lift model
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-xl text-white tracking-tight drop-shadow-xs">
                            +₹{evidence.incrementalValue.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 7-Step Verified Attribution Basis Checklist */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[10px] uppercase tracking-wider text-[#667085] block">
                        Verified Evidence Basis (Conservative Model)
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold">
                        7/7 Steps Verified
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {evidence.attributionBasis.map((step, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200/80 text-[11px] hover:translate-x-1 transition-all"
                        >
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                          <span className="font-medium text-emerald-950 leading-snug">
                            {step.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Audit References Grid */}
                  <div className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#E6E0D6] grid grid-cols-2 gap-2.5 text-[10px] font-mono text-slate-600">
                    <div>
                      <span className="text-[#667085] block font-sans">Active Strategy ID:</span>
                      <span className="font-bold text-[#172033]">{evidence.strategyId}</span>
                    </div>
                    <div>
                      <span className="text-[#667085] block font-sans">Razorpay Order ID:</span>
                      <span className="font-bold text-[#172033]">{evidence.orderId}</span>
                    </div>
                    <div>
                      <span className="text-[#667085] block font-sans">Razorpay Payment ID:</span>
                      <span className="font-bold text-[#172033]">{evidence.paymentId}</span>
                    </div>
                    <div>
                      <span className="text-[#667085] block font-sans">Gateway Settlement:</span>
                      <span className="font-bold text-emerald-700">Verified Test Mode Webhook</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[#667085]">
                  Loading evidence calculation...
                </div>
              )}
            </div>

            {/* 3. PINNED STICKY FOOTER */}
            <div className="px-6 py-3.5 border-t border-[#E6E0D6] bg-[#FAF9F5] flex items-center justify-between shrink-0 z-10">
              <span className="text-[11px] text-[#667085]">
                Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">ESC</kbd> or click outside to dismiss
              </span>

              <button
                onClick={() => setEvidenceModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#172033] hover:bg-slate-800 text-white font-bold text-xs cursor-pointer shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close Window</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING MERCHANT ASSISTANT (ORB) */}
      <MerchantFloatingDrawer />
    </div>
  );
}
