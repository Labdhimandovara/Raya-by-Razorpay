// Merchant Growth & Decision Ledger Store
// Maintains merchant configuration, active growth rules, and the chronological Decision Ledger

export interface GrowthOpportunity {
  id: string;
  title: string;
  category: string;
  evidence: string;
  potentialGMV: number;
  conversionLift: string;
  recommendedAction: string;
  triggerCategory: string;
  crossSellProduct: {
    id: string;
    name: string;
    price: number;
    store: string;
    storeName: string;
    imageUrl: string;
    badge: string;
  };
  isActive: boolean;
  activatedAt?: string;
}

export interface DecisionLedgerEvent {
  id: string;
  step: string;
  title: string;
  timestamp: string;
  status: "SUCCESS" | "BLOCKED" | "INVALIDATED" | "ACTIVE" | "INFO";
  summary: string;
  details: Record<string, any>;
}

export interface GrowthExperiment {
  id: string;
  name: string;
  targetStore: string;
  exposed: number;
  recommended: number;
  added: number;
  purchased: number;
  conversion: string;
  incrementalGMV: number;
  status: "KEEP ACTIVE" | "PAUSE";
  trend: string;
}

// Initial state of Growth Opportunities
let growthOpportunities: GrowthOpportunity[] = [
  {
    id: "opp_laptop_headphones",
    title: "Computing / Laptop → Studio ANC Headphones",
    category: "Electronics",
    evidence: "18 computing & laptop shoppers did not add acoustic audio accessories in the last 7 days.",
    potentialGMV: 12400,
    conversionLift: "+18.2% Basket Size",
    recommendedAction: "Auto-suggest Nexus ANC Studio Headphones when laptop or computing rigs enter cart.",
    triggerCategory: "computing",
    crossSellProduct: {
      id: "nx-wireless-anc-headphones",
      name: "Nexus Pro Wireless ANC Studio Headphones",
      price: 4899,
      store: "nexusstore",
      storeName: "NexusStore",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop",
      badge: "⚡ 88% Match",
    },
    isActive: true,
    activatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "opp_jacket_powerbank",
    title: "Techwear Bomber Jacket → MagVolt Wireless Powerbank",
    category: "Clothing & Techwear",
    evidence: "32 smart heated jacket buyers checkout without the recommended companion heating powerbank.",
    potentialGMV: 8796,
    conversionLift: "+31.6% Cross-Sell Rate",
    recommendedAction: "Bundle MagVolt 10,000mAh Magnetic Powerbank with 1-click in-cart companion discount.",
    triggerCategory: "jacket",
    crossSellProduct: {
      id: "nx-magnetic-fast-charge-powerbank",
      name: "Nexus MagVolt 10000mAh Magnetic Powerbank",
      price: 2199,
      store: "nexusstore",
      storeName: "NexusStore",
      imageUrl: "https://images.unsplash.com/photo-1586253634026-8cb574908d1e?w=600&auto=format&fit=crop",
      badge: "🔋 Top Companion",
    },
    isActive: true,
    activatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "opp_capture_mic",
    title: "4K60 Pro Capture Card → Broadcast XLR Boom Microphone",
    category: "Streaming & Creator Hardware",
    evidence: "14 streaming hardware purchases showed high intent for audio clarity upgrades.",
    potentialGMV: 15999,
    conversionLift: "+22.0% Margin Expansion",
    recommendedAction: "Auto-suggest studio XLR microphone when video capture card is placed in basket.",
    triggerCategory: "capture card",
    crossSellProduct: {
      id: "nx-sport-active-earbuds",
      name: "Nexus Pulse Sport Waterproof Wireless Earbuds",
      price: 2999,
      store: "nexusstore",
      storeName: "NexusStore",
      imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop",
      badge: "🎙️ Streamer Favorite",
    },
    isActive: false,
  },
  {
    id: "opp_luxury_audio_cable",
    title: "ThreadVault Cashmere Knit → Artisan Silver Audio Cable",
    category: "Artisan Luxury",
    evidence: "High cross-store affinity between ThreadVault luxury apparel and artisan acoustic hardware.",
    potentialGMV: 14200,
    conversionLift: "+19.8% Multi-Store GMV",
    recommendedAction: "Promote ThreadVault artisan audio accessories in luxury apparel sessions.",
    triggerCategory: "luxury",
    crossSellProduct: {
      id: "ebay-sony-wh1000xm5",
      name: "Sony WH-1000XM5 ANC Studio Headphones",
      price: 24999,
      store: "ebay",
      storeName: "eBay",
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop",
      badge: "🛍️ eBay Certified",
    },
    isActive: false,
  },
];

// Chronological Decision Ledger Seed (Real events trace)
let decisionLedger: DecisionLedgerEvent[] = [
  {
    id: "evt_10",
    step: "10. PAYMENT_CAPTURED",
    title: "Razorpay Payment Captured (Test Mode)",
    timestamp: "12 mins ago",
    status: "SUCCESS",
    summary: "Razorpay payment verified & captured autonomously via Test Mode gateway.",
    details: {
      paymentId: "pay_test_TXJETRVcTcK91j",
      orderId: "order_TXa8ET3XESs2vF",
      amountINR: "₹42,999.00",
      currency: "INR",
      method: "Instant UPI (success@razorpay)",
      gatewayStatus: "captured",
      complianceVerification: "100% compliant with Merchant Policy Guard",
    },
  },
  {
    id: "evt_09",
    step: "09. RAZORPAY_ORDER_CREATED",
    title: "Razorpay Order Generated Server-Side",
    timestamp: "13 mins ago",
    status: "SUCCESS",
    summary: "Server-side Razorpay REST API order created with zero token exposure.",
    details: {
      orderId: "order_TXa8ET3XESs2vF",
      amountPaise: 4299900,
      receipt: "rcpt_raya_1788442377820",
      apiEndpoint: "https://api.razorpay.com/v1/orders",
      serverValidation: "Pre-payment signature & amount check passed",
    },
  },
  {
    id: "evt_08",
    step: "08. USER_APPROVAL",
    title: "Shopper Approved Purchase Intent",
    timestamp: "14 mins ago",
    status: "SUCCESS",
    summary: "User authorized purchase of items within policy boundaries.",
    details: {
      approvalToken: "appr_sec_77a9c1",
      expiresIn: "15 minutes (TTL active)",
      userAction: "Confirmed in Raya chat interface",
    },
  },
  {
    id: "evt_07",
    step: "07. POLICY_CHECK",
    title: "Autonomous Purchase Control: 6/6 GATES PASSED",
    timestamp: "14 mins ago",
    status: "SUCCESS",
    summary: "All 6 merchant guardrails evaluated & cleared server-side.",
    details: {
      spendLimit: "✓ Passed (Requested ₹42,999 within allowed threshold)",
      quantityLimit: "✓ Passed (1 unit per SKU)",
      priceValidation: "✓ Passed (Catalog price ₹42,999 matches live DB)",
      currencyValidation: "✓ Passed (Strict INR domestic settlement)",
      merchantAuthorization: "✓ Passed (ThreadVault: Active Razorpay Merchant)",
      approvalExpiry: "✓ Passed (Session TTL valid)",
    },
  },
  {
    id: "evt_06",
    step: "06. BASKET_CREATED",
    title: "Multi-Store Basket Formed",
    timestamp: "15 mins ago",
    status: "SUCCESS",
    summary: "Consolidated cart containing 1 primary item and 0 violations.",
    details: {
      itemCount: 1,
      totalPaise: 4299900,
      totalINR: "₹42,999",
      fulfillmentStore: "ThreadVault",
    },
  },
  {
    id: "evt_05",
    step: "05. GROWTH_ACTION",
    title: "Bazaar Growth Engine: Cross-Sell Prompted",
    timestamp: "16 mins ago",
    status: "ACTIVE",
    summary: "Evaluated in-cart cross-sell opportunity based on merchant active rule.",
    details: {
      ruleApplied: "rule_laptop_headphones",
      crossSellOffered: "Nexus MagVolt 10000mAh Powerbank",
      incrementalPotential: "₹2,199",
      merchantAttribution: "NexusStore / ThreadVault cross-channel",
    },
  },
  {
    id: "evt_04",
    step: "04. RECOMMENDATION_SELECTED",
    title: "Autonomous Recommendation: #1 Best Match",
    timestamp: "17 mins ago",
    status: "SUCCESS",
    summary: "Ranked DAP #1 with Buyer Match Score 96/100 based on audiophile criteria.",
    details: {
      buyerScore: "96/100",
      topMatchReason: "Exceptional acoustic resolution, native DSD support, verified ThreadVault warranty.",
      tradeoff: "Premium tier pricing, but verified audiophile DAC and 2-day priority delivery.",
    },
  },
  {
    id: "evt_03",
    step: "03. PRODUCTS_SHORTLISTED",
    title: "Ranked & Shortlisted (3 Finalists)",
    timestamp: "17 mins ago",
    status: "SUCCESS",
    summary: "Applied 5-dimensional scoring model to rank top 3 merchant items.",
    details: {
      shortlistedCount: 3,
      dimensions: "Buyer Fit, Budget Fit, Quality, Delivery, Merchant Fit",
    },
  },
  {
    id: "evt_02",
    step: "02. PRODUCTS_DISCOVERED",
    title: "Multi-Store Catalog Search: 14 Candidates Found",
    timestamp: "18 mins ago",
    status: "SUCCESS",
    summary: "Queried across NexusStore, ThreadVault, PixelMart and live eBay marketplace.",
    details: {
      nexusStoreCount: 4,
      threadVaultCount: 6,
      pixelMartCount: 2,
      ebayCount: 2,
    },
  },
  {
    id: "evt_01",
    step: "01. INTENT_RECEIVED",
    title: "Shopper Query Received",
    timestamp: "18 mins ago",
    status: "INFO",
    summary: "Raya parsed natural language shopping request.",
    details: {
      query: "Portable High-Resolution Audio Player (DAP)",
      category: "Audio / Electronics",
      budgetConstraint: "No limit specified (Unlimited)",
    },
  },
];

export function getGrowthOpportunities(): GrowthOpportunity[] {
  return growthOpportunities;
}

export function activateGrowthRule(ruleId: string, setActive: boolean = true): GrowthOpportunity | null {
  const opp = growthOpportunities.find((o) => o.id === ruleId);
  if (!opp) return null;

  opp.isActive = setActive;
  if (setActive) {
    opp.activatedAt = new Date().toISOString();
  }

  // Record CommerceEvent in Decision Ledger
  const newEvent: DecisionLedgerEvent = {
    id: `evt_act_${Date.now()}`,
    step: "GROWTH_RULE_CONFIGURED",
    title: `Merchant Growth Action: ${setActive ? "ACTIVATED" : "PAUSED"}`,
    timestamp: "Just now",
    status: setActive ? "SUCCESS" : "INFO",
    summary: `Merchant updated AI cross-sell rule: "${opp.title}". Raya buyer agent updated.`,
    details: {
      ruleId: opp.id,
      title: opp.title,
      status: setActive ? "ACTIVE" : "PAUSED",
      targetCategory: opp.triggerCategory,
      crossSellItem: opp.crossSellProduct.name,
      potentialGMV: `₹${opp.potentialGMV.toLocaleString()}`,
      actionLoop: "Observe → Decide → Act → Measure → Learn",
    },
  };

  decisionLedger.unshift(newEvent);
  return opp;
}

export function getDecisionLedger(): DecisionLedgerEvent[] {
  return decisionLedger;
}

export function addDecisionEvent(event: DecisionLedgerEvent) {
  decisionLedger.unshift(event);
}

export function getActiveCrossSells(): GrowthOpportunity[] {
  return growthOpportunities.filter((o) => o.isActive);
}
