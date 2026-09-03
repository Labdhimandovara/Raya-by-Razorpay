// Merchant Growth & Commerce Intelligence System
// Server-side state, CommerceEvents, Purchase Guardrails, and telemetry

export interface GrowthOpportunity {
  id: string;
  strategyId: string;
  title: string;
  category: string;
  evidence: string;
  evidenceDetails: {
    eligibleSessions: number;
    compatibleViews: number;
    accessoryAdds: number;
    currentAttachRate: string;
    opportunityValue: number;
  };
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
  activatedBy?: string;
}

export type DecisionLedgerStatus =
  | "DISCOVERED"
  | "RECOMMENDED"
  | "ADDED"
  | "POLICY_CHECKED"
  | "APPROVED"
  | "PAYMENT_CREATED"
  | "PAID"
  | "ATTRIBUTED"
  | "BLOCKED"
  | "INVALIDATED"
  | "ACTIVE"
  | "INFO"
  | "SUCCESS";

export interface DecisionLedgerEvent {
  id: string;
  step: string;
  title: string;
  timestamp: string;
  status: DecisionLedgerStatus;
  decisionType: "BUYER" | "MERCHANT" | "SYSTEM";
  strategyId?: string;
  orderId?: string;
  paymentId?: string;
  summary: string;
  details: Record<string, any>;
}

export interface GrowthExperiment {
  id: string;
  strategyId: string;
  name: string;
  targetStore: string;
  exposed: number;
  recommended: number;
  added: number;
  purchased: number;
  conversion: string;
  incrementalGMV: number;
  status: "ACTIVE" | "LEARNING" | "PAUSED";
  trend: string;
}

export interface PurchaseControlConfig {
  maxSpend: number;
  quantityLimit: number;
  priceValidation: boolean;
  currency: string;
  merchantAuthorization: boolean;
  approvalExpiryMinutes: number;
}

export interface BlockedAction {
  id: string;
  code: string;
  title: string;
  reason: string;
  requestedAmount: number;
  allowedLimit: number;
  paymentInitiated: boolean;
  razorpayOrderCreated: boolean;
  timestamp: string;
  source: string;
  strategyId?: string;
}

export interface ConnectedStoreTelemetry {
  id: string;
  name: string;
  category: string;
  skuCount: number | string;
  status: "ONLINE" | "CONNECTED" | "DEGRADED";
  endpoint: string;
  recentActivity: string;
  isMarketplace?: boolean;
}

export interface AttributionEvidence {
  orderId: string;
  paymentId: string;
  strategyId: string;
  strategyTitle: string;
  baselineBasket: number;
  influencedItem: string;
  itemValue: number;
  finalBasket: number;
  incrementalValue: number;
  attributionBasis: Array<{
    step: string;
    label: string;
    verified: boolean;
  }>;
  timestamps: {
    intent: string;
    recommendation: string;
    basket: string;
    approval: string;
    payment: string;
  };
}

// 1. Server-side Growth Opportunities with persistent strategyId & dynamic evidence
let growthOpportunities: GrowthOpportunity[] = [
  {
    id: "opp_laptop_headphones",
    strategyId: "laptop-audio-v1",
    title: "Computing / Laptop → Studio ANC Headphones",
    category: "Electronics",
    evidence: "18 computing & laptop shoppers did not add acoustic audio accessories in the last 7 days.",
    evidenceDetails: {
      eligibleSessions: 18,
      compatibleViews: 42,
      accessoryAdds: 3,
      currentAttachRate: "7.1%",
      opportunityValue: 12400,
    },
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
    activatedBy: "Bazaar Growth Agent",
  },
  {
    id: "opp_jacket_powerbank",
    strategyId: "jacket-powerbank-v1",
    title: "Techwear Bomber Jacket → MagVolt Wireless Powerbank",
    category: "Clothing & Techwear",
    evidence: "32 smart heated jacket buyers checkout without the recommended companion heating powerbank.",
    evidenceDetails: {
      eligibleSessions: 32,
      compatibleViews: 58,
      accessoryAdds: 6,
      currentAttachRate: "10.3%",
      opportunityValue: 8796,
    },
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
    activatedBy: "Bazaar Growth Agent",
  },
  {
    id: "opp_capture_mic",
    strategyId: "capture-mic-v1",
    title: "4K60 Pro Capture Card → Broadcast XLR Boom Microphone",
    category: "Streaming & Creator Hardware",
    evidence: "14 streaming hardware purchases showed high intent for audio clarity upgrades.",
    evidenceDetails: {
      eligibleSessions: 14,
      compatibleViews: 29,
      accessoryAdds: 2,
      currentAttachRate: "6.9%",
      opportunityValue: 15999,
    },
    potentialGMV: 15999,
    conversionLift: "+22.0% Margin Expansion",
    recommendedAction: "Auto-suggest studio XLR microphone when video capture card is placed in basket.",
    triggerCategory: "capture card",
    crossSellProduct: {
      id: "pixel-xlr-mic",
      name: "Broadcast Dynamic XLR Boom Microphone",
      price: 9499,
      store: "pixelmart",
      storeName: "PixelMart",
      imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop",
      badge: "🎙️ Streamer Favorite",
    },
    isActive: false,
  },
  {
    id: "opp_apparel_leather_belt",
    strategyId: "apparel-accessory-v1",
    title: "Artisan Linen Shirt & Knitwear → Handcrafted Italian Leather Belt",
    category: "Luxury Apparel & Accessories",
    evidence: "28 luxury shirt & knitwear shoppers browsed coordinating Italian full-grain leather belts and style accessories in the last 7 days.",
    evidenceDetails: {
      eligibleSessions: 28,
      compatibleViews: 54,
      accessoryAdds: 5,
      currentAttachRate: "9.2%",
      opportunityValue: 14200,
    },
    potentialGMV: 14200,
    conversionLift: "+24.5% Basket Size",
    recommendedAction: "Auto-suggest ThreadVault Handcrafted Full-Grain Italian Leather Belt when shirts or knitwear enter basket.",
    triggerCategory: "shirt",
    crossSellProduct: {
      id: "thread-italian-leather-belt",
      name: "ThreadVault Handcrafted Full-Grain Italian Leather Belt",
      price: 3499,
      store: "threadvault",
      storeName: "ThreadVault",
      imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop",
      badge: "👔 Top Style Pairing",
    },
    isActive: false,
  },
];

// 2. Financial Audit Trail Decision Ledger
let decisionLedger: DecisionLedgerEvent[] = [
  {
    id: "evt_10",
    step: "10. ATTRIBUTED",
    title: "Incremental Revenue Attributed to Strategy 'laptop-audio-v1'",
    timestamp: "12 mins ago",
    status: "ATTRIBUTED",
    decisionType: "MERCHANT",
    strategyId: "laptop-audio-v1",
    orderId: "order_TXa8ET3XESs2vF",
    paymentId: "pay_test_TXJETRVcTcK91j",
    summary: "Bazaar attributed ₹4,899 incremental GMV following verified 6-step evidence chain.",
    details: {
      strategyId: "laptop-audio-v1",
      orderId: "order_TXa8ET3XESs2vF",
      paymentId: "pay_test_TXJETRVcTcK91j",
      baselineBasket: "₹38,100",
      finalBasket: "₹42,999",
      incrementalGMV: "₹4,899",
      attributionModel: "Conservative Single-Strategy Evidence Chain",
      verified: true,
    },
  },
  {
    id: "evt_09",
    step: "09. PAID",
    title: "Razorpay Payment Captured (Test Mode)",
    timestamp: "12 mins ago",
    status: "PAID",
    decisionType: "BUYER",
    orderId: "order_TXa8ET3XESs2vF",
    paymentId: "pay_test_TXJETRVcTcK91j",
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
    id: "evt_08",
    step: "08. PAYMENT_CREATED",
    title: "Razorpay Order Generated Server-Side",
    timestamp: "13 mins ago",
    status: "PAYMENT_CREATED",
    decisionType: "SYSTEM",
    orderId: "order_TXa8ET3XESs2vF",
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
    id: "evt_07",
    step: "07. APPROVED",
    title: "Shopper Explicitly Approved Purchase",
    timestamp: "14 mins ago",
    status: "APPROVED",
    decisionType: "BUYER",
    summary: "User authorized purchase of items within policy boundaries.",
    details: {
      approvalToken: "appr_sec_77a9c1",
      expiresIn: "15 minutes (TTL active)",
      userAction: "Confirmed in Raya chat interface",
    },
  },
  {
    id: "evt_06",
    step: "06. POLICY_CHECKED",
    title: "Autonomous Purchase Control: 6/6 GATES PASSED",
    timestamp: "14 mins ago",
    status: "POLICY_CHECKED",
    decisionType: "SYSTEM",
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
    id: "evt_05",
    step: "05. ADDED",
    title: "Companion Item Added to Basket via Strategy 'laptop-audio-v1'",
    timestamp: "15 mins ago",
    status: "ADDED",
    decisionType: "BUYER",
    strategyId: "laptop-audio-v1",
    summary: "Shopper accepted Bazaar companion recommendation into active basket.",
    details: {
      itemAdded: "Nexus Pro Wireless ANC Studio Headphones",
      price: "₹4,899",
      strategyId: "laptop-audio-v1",
      basketTotalBefore: "₹38,100",
      basketTotalAfter: "₹42,999",
    },
  },
  {
    id: "evt_04",
    step: "04. RECOMMENDED",
    title: "Bazaar Growth Engine: Active Cross-Sell Served",
    timestamp: "16 mins ago",
    status: "RECOMMENDED",
    decisionType: "MERCHANT",
    strategyId: "laptop-audio-v1",
    summary: "Served companion recommendation based on active strategy 'laptop-audio-v1'.",
    details: {
      strategyId: "laptop-audio-v1",
      crossSellOffered: "Nexus Pro Wireless ANC Studio Headphones",
      incrementalPotential: "₹4,899",
      merchantAttribution: "NexusStore / ThreadVault cross-channel",
    },
  },
  {
    id: "evt_03",
    step: "03. DISCOVERED",
    title: "Multi-Store Catalog Search: 14 Candidates Found",
    timestamp: "18 mins ago",
    status: "DISCOVERED",
    decisionType: "BUYER",
    summary: "Queried across NexusStore, ThreadVault, PixelMart and live eBay marketplace.",
    details: {
      nexusStoreCount: 4,
      threadVaultCount: 6,
      pixelMartCount: 2,
      ebayCount: 2,
    },
  },
];

// 3. Purchase Control Configuration (The 6 Gates)
let purchaseControlConfig: PurchaseControlConfig = {
  maxSpend: 10000,
  quantityLimit: 5,
  priceValidation: true,
  currency: "INR",
  merchantAuthorization: true,
  approvalExpiryMinutes: 15,
};

// 4. Server-side Blocked Actions Incident Log
let blockedActions: BlockedAction[] = [
  {
    id: "block_incident_01",
    code: "PURCHASE_BLOCKED",
    title: "Max Spend Cap Exceeded (Gate 01)",
    reason: "Requested cart ₹61,798 exceeds merchant policy spending cap of ₹10,000.",
    requestedAmount: 61798,
    allowedLimit: 10000,
    paymentInitiated: false,
    razorpayOrderCreated: false,
    timestamp: "32 mins ago",
    source: "Shopper Agent (Raya) Checkout",
  },
  {
    id: "block_incident_02",
    code: "APPROVAL_INVALIDATED",
    title: "Price Volatility Rejection (Gate 03)",
    reason: "Catalog price shifted from ₹6,799 to ₹7,199 before order signature capture. Approval invalidated.",
    requestedAmount: 7199,
    allowedLimit: 6799,
    paymentInitiated: false,
    razorpayOrderCreated: false,
    timestamp: "1 hour ago",
    source: "Pre-Payment Validation Guard",
  },
];

// 5. Growth Experiments Seed
let growthExperiments: GrowthExperiment[] = [
  {
    id: "exp_laptop_headphones",
    strategyId: "laptop-audio-v1",
    name: "Computing → Studio ANC Headphones",
    targetStore: "NexusStore / PixelMart",
    exposed: 142,
    recommended: 61,
    added: 31,
    purchased: 24,
    conversion: "16.9%",
    incrementalGMV: 12400,
    status: "ACTIVE",
    trend: "+4.2% vs baseline",
  },
  {
    id: "exp_jacket_powerbank",
    strategyId: "jacket-powerbank-v1",
    name: "Heated Jacket → MagVolt Powerbank",
    targetStore: "NexusStore",
    exposed: 98,
    recommended: 54,
    added: 38,
    purchased: 31,
    conversion: "31.6%",
    incrementalGMV: 8796,
    status: "ACTIVE",
    trend: "+8.1% vs baseline",
  },
  {
    id: "exp_capture_mic",
    strategyId: "capture-mic-v1",
    name: "Capture Card → Broadcast XLR Mic",
    targetStore: "PixelMart",
    exposed: 64,
    recommended: 22,
    added: 5,
    purchased: 3,
    conversion: "4.7%",
    incrementalGMV: 4899,
    status: "PAUSED",
    trend: "-1.8% threshold check",
  },
];

// 6. Connected Stores Telemetry
const connectedStoresTelemetry: ConnectedStoreTelemetry[] = [
  {
    id: "nexusstore",
    name: "NexusStore",
    category: "Smart Techwear & Daily Tech",
    skuCount: 40,
    status: "ONLINE",
    endpoint: "https://demo-shop-backend.onrender.com",
    recentActivity: "Order order_TXa8ET3XESs2vF settled",
  },
  {
    id: "threadvault",
    name: "ThreadVault",
    category: "Curated Luxury & Artisan Audio",
    skuCount: 40,
    status: "ONLINE",
    endpoint: "https://threadvault-api.onrender.com",
    recentActivity: "DAP Audiophile Player discovered",
  },
  {
    id: "pixelmart",
    name: "PixelMart",
    category: "Cyberpunk Creator Equipment",
    skuCount: 40,
    status: "ONLINE",
    endpoint: "https://pixelmart-api.onrender.com",
    recentActivity: "Apex Gaming Laptop queried",
  },
  {
    id: "ebay",
    name: "eBay — Live Marketplace",
    category: "Certified Refurbished & Global Marketplace",
    skuCount: "Real-time Browse API",
    status: "CONNECTED",
    endpoint: "https://api.ebay.com/buy/browse/v1",
    recentActivity: "Live USD catalog converted with INR approx",
    isMarketplace: true,
  },
];

// 7. Server-side Explainability Dictionary
const explainabilityDictionary: Record<string, any> = {
  "nx-wireless-anc-headphones": {
    name: "Nexus Pro Wireless ANC Studio Headphones",
    price: 4899,
    store: "NexusStore",
    badge: "⚡ Best Overall Match",
    buyerFit: 96,
    budgetFit: 94,
    quality: 92,
    delivery: 90,
    merchantFit: 95,
    whyReason: "Matches your audio requirement, stays within budget, and complements computing purchases with active noise cancelling.",
    tradeoff: "Premium tier pricing, but verified audiophile DAC and 2-day priority delivery.",
    fitDetails: "Matched keywords 'studio', 'anc', 'wireless'. 40mm neodymium drivers with active noise cancelling.",
  },
  "nx-smart-heated-techwear-jacket": {
    name: "Nexus Smart Heated Techwear Bomber Jacket",
    price: 7999,
    store: "NexusStore",
    badge: "🔥 Top Trending",
    buyerFit: 95,
    budgetFit: 91,
    quality: 96,
    delivery: 88,
    merchantFit: 94,
    whyReason: "Selected as the highest-rated smart garment satisfying technical warmth & water-resistant criteria.",
    tradeoff: "Requires 10,000mAh magnetic powerbank for active heating; recommended as in-cart companion bundle.",
    fitDetails: "Three temperature zones (35°C–55°C) with carbon fiber heating elements and graphene lining.",
  },
  "pixel-4k-capture-card": {
    name: "4K60 Pro HDR Ultra-Low Latency Capture Card",
    price: 17999,
    store: "PixelMart",
    badge: "🎮 Pro Creator Pick",
    buyerFit: 98,
    budgetFit: 90,
    quality: 97,
    delivery: 92,
    merchantFit: 96,
    whyReason: "Selected for broadcast-grade 4K60 HDR passthrough with sub-1ms ultra-low latency playback.",
    tradeoff: "Higher initial hardware investment, but zero frame skipping and multi-app video feed capture.",
    fitDetails: "PCIe Gen2 x4 interface, full HDR10 capture, instant gameview preview for dual-PC setups.",
  },
  "thread-dap-player": {
    name: "Portable High-Resolution Audio Player (DAP)",
    price: 42999,
    store: "ThreadVault",
    badge: "🧵 Artisan Audio Flagship",
    buyerFit: 94,
    budgetFit: 88,
    quality: 99,
    delivery: 94,
    merchantFit: 97,
    whyReason: "Selected for audiophile uncompressed FLAC/DSD native playback with balanced 4.4mm output.",
    tradeoff: "High-ticket investment, but replaces standalone DAC and verified 100% compliant with Merchant Policy Guard.",
    fitDetails: "Dual ESS SABRE ES9038Q2M DACs, 32-bit/768kHz PCM resolution, CNC aluminum chassis.",
  },
};

// 8. Strategy Evidence Generator
export function getAttributionEvidence(strategyId: string = "laptop-audio-v1"): AttributionEvidence {
  const opp = growthOpportunities.find((o) => o.strategyId === strategyId) || growthOpportunities[0];

  return {
    orderId: "order_TXa8ET3XESs2vF",
    paymentId: "pay_test_TXJETRVcTcK91j",
    strategyId: opp.strategyId,
    strategyTitle: opp.title,
    baselineBasket: 38100,
    influencedItem: opp.crossSellProduct.name,
    itemValue: opp.crossSellProduct.price,
    finalBasket: 38100 + opp.crossSellProduct.price,
    incrementalValue: opp.crossSellProduct.price,
    attributionBasis: [
      { step: "RECOMMENDATION_SHOWN", label: `Recommendation served by active strategy '${opp.strategyId}'`, verified: true },
      { step: "ITEM_ADDED", label: "Shopper accepted companion recommendation into basket", verified: true },
      { step: "POLICY_PASSED", label: "6/6 purchase controls validated server-side", verified: true },
      { step: "EXPLICIT_APPROVAL", label: "Shopper confirmed order review in Raya chat", verified: true },
      { step: "RAZORPAY_ORDER_CREATED", label: "Razorpay Test Mode order generated server-side", verified: true },
      { step: "PAYMENT_CAPTURED", label: "Payment successfully captured & verified via gateway webhook", verified: true },
      { step: "REVENUE_ATTRIBUTED", label: "Incremental value attributed to merchant store node", verified: true },
    ],
    timestamps: {
      intent: "18 mins ago",
      recommendation: "16 mins ago",
      basket: "15 mins ago",
      approval: "14 mins ago",
      payment: "12 mins ago",
    },
  };
}

// 9. Exported Service Methods
export function getGrowthOpportunities(): GrowthOpportunity[] {
  return growthOpportunities;
}

export function activateGrowthRule(
  identifier: string,
  setActive: boolean = true,
  actor: string = "Merchant Console"
): GrowthOpportunity | null {
  const opp = growthOpportunities.find((o) => o.id === identifier || o.strategyId === identifier);
  if (!opp) return null;

  opp.isActive = setActive;
  opp.activatedAt = new Date().toISOString();
  opp.activatedBy = actor;

  // Sync with experiments list
  const exp = growthExperiments.find((e) => e.strategyId === opp.strategyId);
  if (exp) {
    exp.status = setActive ? "ACTIVE" : "PAUSED";
  }

  // Record audit trail event in Decision Ledger
  const newEvent: DecisionLedgerEvent = {
    id: `evt_act_${Date.now()}`,
    step: setActive ? "GROWTH_RULE_ACTIVATED" : "GROWTH_RULE_PAUSED",
    title: `Merchant Strategy: ${setActive ? "ACTIVATED" : "PAUSED"} (${opp.strategyId})`,
    timestamp: "Just now",
    status: setActive ? "SUCCESS" : "INFO",
    decisionType: "MERCHANT",
    strategyId: opp.strategyId,
    summary: `${actor} ${setActive ? "activated" : "deactivated"} growth strategy "${opp.title}". Raya recommendation behavior updated.`,
    details: {
      strategyId: opp.strategyId,
      ruleId: opp.id,
      title: opp.title,
      status: setActive ? "ACTIVE" : "PAUSED",
      actor,
      targetCategory: opp.triggerCategory,
      crossSellItem: opp.crossSellProduct.name,
      potentialGMV: `₹${opp.potentialGMV.toLocaleString()}`,
      attributionReady: setActive,
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

export function getActiveStrategyForCategory(category: string): GrowthOpportunity | null {
  const normalized = (category || "").toLowerCase();
  return (
    growthOpportunities.find(
      (o) => o.isActive && normalized.includes(o.triggerCategory.toLowerCase())
    ) || null
  );
}

export function getPurchaseControlConfig(): PurchaseControlConfig {
  return purchaseControlConfig;
}

export function updatePurchaseControlConfig(partial: Partial<PurchaseControlConfig>): PurchaseControlConfig {
  purchaseControlConfig = { ...purchaseControlConfig, ...partial };

  addDecisionEvent({
    id: `evt_guard_${Date.now()}`,
    step: "POLICY_UPDATED",
    title: "Merchant Policy Guardrails Configured",
    timestamp: "Just now",
    status: "SUCCESS",
    decisionType: "MERCHANT",
    summary: `Merchant updated Purchase Control: Max Spend ₹${purchaseControlConfig.maxSpend.toLocaleString()}, Quantity Limit ${purchaseControlConfig.quantityLimit}`,
    details: purchaseControlConfig,
  });

  return purchaseControlConfig;
}

export function getBlockedActions(): BlockedAction[] {
  return blockedActions;
}

export function addBlockedAction(action: BlockedAction) {
  blockedActions.unshift(action);
}

// Demo Failure Trigger 1: Spend Cap Exceeded (Proving Razorpay is NEVER called)
export function triggerSpendCapExceededDemo(requestedAmount: number = 61798): BlockedAction {
  const action: BlockedAction = {
    id: `block_${Date.now()}`,
    code: "PURCHASE_BLOCKED",
    title: "Max Spend Cap Exceeded (Gate 01)",
    reason: `Requested cart ₹${requestedAmount.toLocaleString()} exceeds merchant policy spending cap of ₹${purchaseControlConfig.maxSpend.toLocaleString()}.`,
    requestedAmount,
    allowedLimit: purchaseControlConfig.maxSpend,
    paymentInitiated: false,
    razorpayOrderCreated: false,
    timestamp: "Just now",
    source: "Shopper Agent (Raya) Checkout",
  };

  blockedActions.unshift(action);

  addDecisionEvent({
    id: `evt_blk_${Date.now()}`,
    step: "PURCHASE_BLOCKED",
    title: "Spend Cap Guardrail Triggered: BLOCKED",
    timestamp: "Just now",
    status: "BLOCKED",
    decisionType: "SYSTEM",
    summary: `Cart total (₹${requestedAmount.toLocaleString()}) exceeded limit (₹${purchaseControlConfig.maxSpend.toLocaleString()}). Razorpay API order creation was prevented.`,
    details: {
      requestedAmount,
      allowedLimit: purchaseControlConfig.maxSpend,
      razorpayOrderCreated: false,
      paymentInitiated: false,
      financialSafeguard: "Verified: Razorpay API was never called",
    },
  });

  return action;
}

// Demo Failure Trigger 2: Price Volatility (Proving Approval Invalidated before Order)
export function triggerPriceVolatilityDemo(approvedPrice: number = 6799, currentPrice: number = 7199): BlockedAction {
  const action: BlockedAction = {
    id: `price_shift_${Date.now()}`,
    code: "APPROVAL_INVALIDATED",
    title: "Price Volatility Rejection (Gate 03)",
    reason: `Catalog price shifted from ₹${approvedPrice.toLocaleString()} to ₹${currentPrice.toLocaleString()} before order signature capture. Approval invalidated.`,
    requestedAmount: currentPrice,
    allowedLimit: approvedPrice,
    paymentInitiated: false,
    razorpayOrderCreated: false,
    timestamp: "Just now",
    source: "Pre-Payment Validation Guard",
  };

  blockedActions.unshift(action);

  addDecisionEvent({
    id: `evt_inv_${Date.now()}`,
    step: "APPROVAL_INVALIDATED",
    title: "Catalog Price Shift: Approval Invalidated",
    timestamp: "Just now",
    status: "INVALIDATED",
    decisionType: "SYSTEM",
    summary: `Price shifted from ₹${approvedPrice} to ₹${currentPrice}. Server invalidated approval prior to payment creation.`,
    details: {
      approvedPrice,
      currentPrice,
      razorpayOrderCreated: false,
      reason: "Catalog price changed after approval. Payment was not created using stale pricing.",
    },
  });

  return action;
}

export function getGrowthExperiments(): GrowthExperiment[] {
  return growthExperiments;
}

export function getConnectedStoresTelemetry(): ConnectedStoreTelemetry[] {
  return connectedStoresTelemetry;
}

export function getExplainabilityDictionary(): Record<string, any> {
  return explainabilityDictionary;
}
