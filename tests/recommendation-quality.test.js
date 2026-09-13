// Raya Genuine Product Recommendation Quality Test Suite
// Verifies:
// 1. "Best phone under ₹30,000" selects best overall value, NOT simply cheapest.
// 2. "Best headphones under ₹10,000 for travel" considers ANC/comfort/battery over lowest price.
// 3. "Cheapest phone under ₹20,000" explicitly prioritizes lowest price upon user intent.
// 4. "Best phone under ₹30,000 for gaming" prioritizes gaming/performance attributes.
// 5. Price shift after recommendation triggers revalidation and invalidates approval.

const assert = require("assert");
const { extractShoppingIntent, rankAndScoreProducts } = require("../src/mcp/recommendation-engine.ts");
const { requestPurchaseApprovalAdapter, prepareCheckoutAdapter, createCartAdapter } = require("../src/mcp/raya-adapter.ts");

async function runRecommendationQualityTests() {
  console.log("==================================================");
  console.log("STARTING RAYA RECOMMENDATION QUALITY TEST SUITE");
  console.log("==================================================\n");

  // Sample real-world phone dataset representing different market tiers
  const phoneCandidates = [
    {
      id: "phone-budget-entry",
      name: "Redmi 13C 5G (4GB RAM, 128GB)",
      description: "Entry-level smartphone with MediaTek Dimensity 6100+, 50MP AI dual camera, 5000mAh battery, and basic 90Hz LCD screen.",
      price: 12999,
      category: "Tech",
      rating: 3.9,
      stock: 25,
      store: "nexusstore",
      storeName: "NexusStore",
    },
    {
      id: "phone-balanced-mid",
      name: "Samsung Galaxy M34 5G (6GB RAM, 128GB)",
      description: "Balanced mid-ranger with 120Hz Super AMOLED display, 50MP OIS camera, monster 6000mAh battery, and Exynos 1280 processor.",
      price: 18999,
      category: "Tech",
      rating: 4.3,
      stock: 18,
      store: "nexusstore",
      storeName: "NexusStore",
    },
    {
      id: "phone-gaming-flagship-killer",
      name: "OnePlus Nord 4 5G Snapdragon 7+ Gen 3 (8GB RAM, 256GB)",
      description: "High-performance all-metal smartphone with Snapdragon 7+ Gen 3 gaming processor, 120Hz Ultra-Bright AMOLED, 50MP Sony LYT-600 OIS camera, 5500mAh battery, and 100W SUPERVOOC fast charge.",
      price: 28499,
      category: "Tech",
      rating: 4.6,
      stock: 12,
      store: "nexusstore",
      storeName: "NexusStore",
    },
  ];

  // =========================================================================
  // TEST 1: "Best phone under ₹30,000" -> MUST NOT simply return the cheapest
  // =========================================================================
  console.log("TEST 1: User asks 'Suggest me the best phone under ₹30,000'");
  const intent1 = extractShoppingIntent("Suggest me the best phone under ₹30,000");
  assert.strictEqual(intent1.maxPrice, 30000, "Should extract maxPrice of 30000");
  assert.strictEqual(intent1.objective, "best_value", "Default objective must be best_value");

  const ranked1 = rankAndScoreProducts(phoneCandidates, intent1);
  assert(ranked1.length === 3, "All 3 candidates within budget should be scored");

  const top1 = ranked1[0];
  console.log(`   • #1 Recommendation: ${top1.name} (₹${top1.price.toLocaleString()})`);
  console.log(`   • Buyer Score: ${top1.recommendation_context?.overall_score}/100`);
  console.log(`   • Why: ${top1.recommendation_context?.why_recommended}`);

  // CRITICAL ASSERTION: Must NOT be the cheapest phone (₹12,999)!
  assert.notStrictEqual(
    top1.price,
    12999,
    "FAILED: System simply chose the cheapest phone! It must evaluate genuine value."
  );
  assert.strictEqual(
    top1.product_id,
    "phone-gaming-flagship-killer",
    "Should recommend the ₹28,499 OnePlus Nord 4 as offering the best overall value and specs within ₹30,000"
  );
  assert(top1.recommendation_context?.alternatives.length > 0, "Should provide structured alternatives");
  console.log("✓ TEST 1 PASSED: Best phone within budget recommended based on quality & value, NOT cheapest price.\n");

  // =========================================================================
  // TEST 2: "Best headphones under ₹10,000 for travel" -> Prioritizes ANC & battery
  // =========================================================================
  console.log("TEST 2: User asks 'Best headphones under ₹10,000 for travel'");
  const headphoneCandidates = [
    {
      id: "nx-pro-wireless-anc-headphones",
      name: "Nexus Pro Wireless ANC Studio Headphones",
      description: "40mm custom bio-cellulose drivers, 38dB hybrid active noise cancellation, 45-hour battery life, travel hard case.",
      price: 4899,
      category: "Tech",
      rating: 4.7,
      stock: 20,
      store: "nexusstore",
      storeName: "NexusStore",
    },
    {
      id: "ebay-jbl-tune-510bt",
      name: "JBL Tune 510BT Wireless On-Ear Bluetooth Headphones",
      description: "JBL Pure Bass sound, 40-hour battery life, lightweight on-ear design, no active noise cancellation.",
      price: 2799,
      category: "Tech",
      rating: 4.2,
      stock: 35,
      store: "ebay",
      storeName: "eBay",
    },
    {
      id: "px-rgb-gaming-headset",
      name: "PixelMart CyberPulse RGB 7.1 Spatial Gaming Headset",
      description: "50mm audio drivers, virtual 7.1 surround sound, fixed USB/3.5mm cable, RGB lighting for desk gaming setups.",
      price: 3999,
      category: "Tech",
      rating: 4.3,
      stock: 15,
      store: "pixelmart",
      storeName: "PixelMart",
    },
  ];

  const intent2 = extractShoppingIntent("Best headphones under ₹10,000 for travel");
  assert(intent2.priorities.includes("travel") || intent2.priorities.includes("anc"), "Should extract travel/anc priority");

  const ranked2 = rankAndScoreProducts(headphoneCandidates, intent2);
  const top2 = ranked2[0];
  console.log(`   • #1 Recommendation: ${top2.name} (₹${top2.price.toLocaleString()})`);
  console.log(`   • Buyer Score: ${top2.recommendation_context?.overall_score}/100`);

  // CRITICAL ASSERTION: The cheapest headphone is JBL Tune at ₹2,799, but it lacks ANC for travel.
  // The Nexus ANC at ₹4,899 has 38dB ANC and 45h battery, making it the best travel option!
  assert.strictEqual(
    top2.product_id,
    "nx-pro-wireless-anc-headphones",
    "Should recommend Nexus Pro ANC Headphones for travel rather than cheaper non-ANC JBL"
  );
  assert(top2.recommendation_context?.overall_score > ranked2.find(p => p.product_id === "ebay-jbl-tune-510bt").recommendation_context.overall_score);
  console.log("✓ TEST 2 PASSED: Travel headphones correctly prioritized ANC and battery over lowest price.\n");

  // =========================================================================
  // TEST 3: "Cheapest phone under ₹20,000" -> Explicit intent MUST prioritize price
  // =========================================================================
  console.log("TEST 3: User explicitly asks 'Cheapest phone under ₹20,000'");
  const intent3 = extractShoppingIntent("Cheapest phone under ₹20,000");
  assert.strictEqual(intent3.objective, "cheapest", "Explicit 'cheapest' keyword must set objective to 'cheapest'");
  assert.strictEqual(intent3.maxPrice, 20000, "Max price should be 20000");

  const ranked3 = rankAndScoreProducts(phoneCandidates, intent3);
  const top3 = ranked3[0];
  console.log(`   • #1 Recommendation: ${top3.name} (₹${top3.price.toLocaleString()})`);
  console.log(`   • Why: ${top3.recommendation_context?.why_recommended}`);

  // CRITICAL ASSERTION: For explicit cheapest query, the ₹12,999 phone SHOULD be #1!
  assert.strictEqual(
    top3.price,
    12999,
    "When explicit user intent is cheapest, the lowest priced option within budget must be #1"
  );
  console.log("✓ TEST 3 PASSED: System honored explicit 'cheapest' intent by prioritizing lowest price.\n");

  // =========================================================================
  // TEST 4: "Best phone under ₹30,000 for gaming" -> Prioritizes gaming performance
  // =========================================================================
  console.log("TEST 4: User asks 'Best phone under 30k for gaming'");
  const intent4 = extractShoppingIntent("Best phone under 30k for gaming");
  assert(intent4.priorities.includes("gaming"), "Should extract gaming priority");

  const ranked4 = rankAndScoreProducts(phoneCandidates, intent4);
  const top4 = ranked4[0];
  console.log(`   • #1 Recommendation: ${top4.name} (₹${top4.price.toLocaleString()})`);

  assert.strictEqual(
    top4.product_id,
    "phone-gaming-flagship-killer",
    "Should select the high-performance gaming Snapdragon phone for gaming query"
  );
  assert(top4.recommendation_context?.overall_score >= 90, "Gaming phone should have high score for gaming intent");
  console.log("✓ TEST 4 PASSED: Gaming priority correctly weighted hardware specs & performance.\n");

  // =========================================================================
  // TEST 5: Live Price Shift Revalidation (Gate 03 Safety Invalidation)
  // =========================================================================
  console.log("TEST 5: Price change between recommendation and approval invalidates approval");
  const cartRes = await createCartAdapter({
    initial_items: [{ product_id: "nx-pro-wireless-anc-headphones", quantity: 1 }],
  });
  const cartId = cartRes.cart.cart_id;

  const checkoutRes = await prepareCheckoutAdapter({ cart_id: cartId });
  assert.strictEqual(checkoutRes.status, "READY_FOR_APPROVAL", "Checkout should be ready for approval");

  // Attempt approval with simulated price spike
  const approvalWithSpike = await requestPurchaseApprovalAdapter({
    cart_id: cartId,
    checkout_order_id: checkoutRes.checkout_order?.checkout_order_id,
    user_confirmed: true,
    simulate_price_spike: true,
  });

  console.log(`   • Approval Status: ${approvalWithSpike.status}`);
  console.log(`   • Message: ${approvalWithSpike.message}`);

  assert.strictEqual(
    approvalWithSpike.status,
    "APPROVAL_INVALIDATED",
    "Price shift must invalidate approval (Gate 03)"
  );
  assert.strictEqual(approvalWithSpike.approved, false, "Order must NOT be approved when price changed");
  console.log("✓ TEST 5 PASSED: Live price shift invalidated approval prior to payment creation.\n");

  console.log("==================================================");
  console.log("ALL RECOMMENDATION QUALITY TESTS PASSED (5/5)!");
  console.log("==================================================");
}

runRecommendationQualityTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
