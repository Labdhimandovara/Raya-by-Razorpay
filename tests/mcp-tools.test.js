// Comprehensive Raya MCP Tools Automated Verification Test Suite
// Verifies:
// 1. JSON-RPC 2.0 initialize, tools/list, and tools/call protocol handling
// 2. All 9 tools: search_products, get_product, compare_products, create_cart,
//    get_cart, add_to_cart, prepare_checkout, request_purchase_approval, get_order
// 3. 6-Gate safety checks: SKU limit blocking (Gate 02), Spend cap blocking (Gate 01)
// 4. Explicit user approval requirement
// 5. Razorpay order generation & Decision Ledger audit logging

const assert = require("assert");
const { handleJsonRpcMessage, SERVER_INFO } = require("../src/mcp/server.ts");
const { RAYA_MCP_TOOLS } = require("../src/mcp/tools.ts");
const { updatePurchaseControlConfig, getDecisionLedger } = require("../src/lib/merchant-store.ts");

async function runMcpToolsTests() {
  console.log("==================================================");
  console.log("STARTING RAYA MCP TOOLS & SAFETY VERIFICATION TEST SUITE");
  console.log("==================================================\n");

  // 1. Verify initialize
  console.log("1. Testing MCP 'initialize' handshake...");
  const initRes = await handleJsonRpcMessage({
    jsonrpc: "2.0",
    id: "test_init_1",
    method: "initialize",
    params: {},
  });
  assert.strictEqual(initRes.jsonrpc, "2.0");
  assert.strictEqual(initRes.id, "test_init_1");
  assert.strictEqual(initRes.result.serverInfo.name, "raya-by-razorpay-mcp");
  assert(initRes.result.capabilities.tools, "Must advertise tool capabilities");
  console.log("   ✓ Protocol handshake passed.\n");

  // 2. Verify tools/list
  console.log("2. Testing MCP 'tools/list'...");
  const listRes = await handleJsonRpcMessage({
    jsonrpc: "2.0",
    id: "test_list_1",
    method: "tools/list",
  });
  assert.strictEqual(listRes.result.tools.length, 9, "Must expose exactly 9 initial tools");
  const toolNames = listRes.result.tools.map((t) => t.name);
  console.log(`   • Exposed Tools (${toolNames.length}): ${toolNames.join(", ")}`);

  const EXPECTED_TOOLS = [
    "search_products",
    "get_product",
    "compare_products",
    "create_cart",
    "get_cart",
    "add_to_cart",
    "prepare_checkout",
    "request_purchase_approval",
    "get_order",
  ];
  for (const exp of EXPECTED_TOOLS) {
    assert(toolNames.includes(exp), `Missing tool: ${exp}`);
  }
  // Verify NO unrestricted payment tool is exposed
  assert(!toolNames.includes("make_payment"), "Must NOT expose unrestricted payment tool");
  assert(!toolNames.includes("charge_card"), "Must NOT expose charge_card tool");
  console.log("   ✓ All 9 required tools declared with strict payment gating.\n");

  // 3. Testing search_products tool
  console.log("3. Testing MCP tool: 'search_products'...");
  const searchRes = await handleJsonRpcMessage({
    jsonrpc: "2.0",
    id: "test_search_1",
    method: "tools/call",
    params: {
      name: "search_products",
      arguments: {
        query: "headphones under 5000",
        max_price: 5000,
      },
    },
  });
  assert.strictEqual(searchRes.result.isError, false);
  const searchData = searchRes.result.structured;
  assert.strictEqual(searchData.success, true);
  assert(searchData.products.length > 0, "Should return matching products");

  const firstProd = searchData.products[0];
  console.log(`   • Search match: ${firstProd.name} (₹${firstProd.price})`);
  assert(firstProd.product_id, "Product must have product_id");
  assert(typeof firstProd.price === "number", "Product must have price");
  assert(firstProd.currency === "INR", "Product currency must be INR");
  assert(firstProd.recommendation_context, "Must include recommendation_context");
  assert(firstProd.key_features && Array.isArray(firstProd.key_features), "Must include key_features");
  console.log("   ✓ search_products structured model-friendly output verified.\n");

  // 4. Testing get_product tool
  console.log("4. Testing MCP tool: 'get_product'...");
  const getProdRes = await handleJsonRpcMessage({
    jsonrpc: "2.0",
    id: "test_get_prod_1",
    method: "tools/call",
    params: {
      name: "get_product",
      arguments: {
        product_id: "nx-pro-wireless-anc-headphones",
      },
    },
  });
  assert.strictEqual(getProdRes.result.isError, false);
  assert.strictEqual(getProdRes.result.structured.success, true);
  assert.strictEqual(getProdRes.result.structured.product.product_id, "nx-pro-wireless-anc-headphones");
  assert(getProdRes.result.structured.explainability, "Should attach explainability metadata");
  console.log(`   • Retrieved: ${getProdRes.result.structured.product.name} (₹${getProdRes.result.structured.product.price})`);
  console.log("   ✓ get_product verified.\n");

  // 5. Testing compare_products tool
  console.log("5. Testing MCP tool: 'compare_products'...");
  const compareRes = await handleJsonRpcMessage({
    jsonrpc: "2.0",
    id: "test_comp_1",
    method: "tools/call",
    params: {
      name: "compare_products",
      arguments: {
        product_ids: ["nx-pro-wireless-anc-headphones", "ebay-jbl-tune-510bt"],
        user_intent: "travel listening with active noise cancellation",
      },
    },
  });
  assert.strictEqual(compareRes.result.isError, false);
  const compData = compareRes.result.structured.comparison;
  assert.strictEqual(compData.products.length, 2);
  assert(compData.verdict.best_overall_match.includes("Nexus Pro Wireless ANC"), "Should identify ANC as better travel fit");
  console.log(`   • Comparison verdict: ${compData.verdict.best_overall_match}`);
  console.log(`   • Trade-off summary: ${compData.verdict.tradeoff_summary}`);
  console.log("   ✓ compare_products verified.\n");

  // 6. Testing create_cart & get_cart tools
  console.log("6. Testing MCP tools: 'create_cart' & 'get_cart'...");
  const createCartRes = await handleJsonRpcMessage({
    jsonrpc: "2.0",
    id: "test_cart_1",
    method: "tools/call",
    params: {
      name: "create_cart",
      arguments: {
        budget_limit: 15000,
      },
    },
  });
  assert.strictEqual(createCartRes.result.structured.success, true);
  const createdCartId = createCartRes.result.structured.cart.cart_id;
  assert(createdCartId.startsWith("cart_"), "Must return generated cart_id");
  console.log(`   • Created Cart Session: ${createdCartId}`);

  const getCartRes = await handleJsonRpcMessage({
    jsonrpc: "2.0",
    id: "test_get_cart_1",
    method: "tools/call",
    params: {
      name: "get_cart",
      arguments: {
        cart_id: createdCartId,
      },
    },
  });
  assert.strictEqual(getCartRes.result.structured.cart.cart_id, createdCartId);
  assert.strictEqual(getCartRes.result.structured.policy_evaluation.allowed, true);
  console.log("   ✓ create_cart and get_cart verified.\n");

  // 7. Testing add_to_cart & Gate 02 limit enforcement
  console.log("7. Testing MCP tool: 'add_to_cart' & Gate 02 limit (max 5 per SKU)...");
  const addRes1 = await handleJsonRpcMessage({
    jsonrpc: "2.0",
    id: "test_add_1",
    method: "tools/call",
    params: {
      name: "add_to_cart",
      arguments: {
        cart_id: createdCartId,
        product_id: "nx-pro-wireless-anc-headphones",
        quantity: 2,
      },
    },
  });
  assert.strictEqual(addRes1.result.structured.success, true);
  assert.strictEqual(addRes1.result.structured.cart.items[0].quantity, 2);
  assert.strictEqual(addRes1.result.structured.cart.subtotal, 4899 * 2);
  console.log(`   • Added 2 units. Cart subtotal: ₹${addRes1.result.structured.cart.subtotal.toLocaleString()}`);

  // Test Gate 02: Attempting to add 4 more units (total 6 > max limit 5) must be BLOCKED
  const addOverLimit = await handleJsonRpcMessage({
    jsonrpc: "2.0",
    id: "test_add_over",
    method: "tools/call",
    params: {
      name: "add_to_cart",
      arguments: {
        cart_id: createdCartId,
        product_id: "nx-pro-wireless-anc-headphones",
        quantity: 4,
      },
    },
  });
  assert.strictEqual(addOverLimit.result.structured.success, false);
  assert.strictEqual(addOverLimit.result.structured.error, "QUANTITY_LIMIT_EXCEEDED");
  console.log(`   • Blocked: ${addOverLimit.result.structured.message}`);
  console.log("   ✓ Gate 02 (SKU quantity limit <= 5) verified.\n");

  // 8. Testing prepare_checkout & 6-gate safety validation
  console.log("8. Testing MCP tool: 'prepare_checkout' & Gate 01 spend cap...");
  const prepRes = await handleJsonRpcMessage({
    jsonrpc: "2.0",
    id: "test_prep_1",
    method: "tools/call",
    params: {
      name: "prepare_checkout",
      arguments: {
        cart_id: createdCartId,
        recipient_name: "Anita Sharma",
        delivery_address: {
          street: "12 Lavelle Road",
          city: "Bengaluru",
          zip: "560001",
          country: "India",
        },
      },
    },
  });
  assert.strictEqual(prepRes.result.structured.success, true);
  assert.strictEqual(prepRes.result.structured.status, "READY_FOR_APPROVAL");
  const checkoutOrderId = prepRes.result.structured.checkout_order.checkout_order_id;
  console.log(`   • Prepared checkout draft: ${checkoutOrderId}`);
  console.log(`   • Safety Gates Cleared: ${prepRes.result.structured.safety_evaluation.checks.length}/6`);
  console.log("   ✓ prepare_checkout passed all 6 gates.\n");

  // Test Gate 01 Spend Cap Breach Blocking
  console.log("8b. Testing Gate 01 spend cap breach rejection...");
  // Temporarily set purchase control maxSpend to ₹5,000 (current cart is ₹9,798)
  updatePurchaseControlConfig({ maxSpend: 5000 });
  const prepBlocked = await handleJsonRpcMessage({
    jsonrpc: "2.0",
    id: "test_prep_blocked",
    method: "tools/call",
    params: {
      name: "prepare_checkout",
      arguments: {
        cart_id: createdCartId,
      },
    },
  });
  assert.strictEqual(prepBlocked.result.structured.success, false);
  assert.strictEqual(prepBlocked.result.structured.status, "BLOCKED");
  assert.strictEqual(prepBlocked.result.structured.error, "SPEND_CAP_EXCEEDED");
  console.log(`   • Gate 01 Breach Blocked: ${prepBlocked.result.structured.message}`);

  // Restore spend limit
  updatePurchaseControlConfig({ maxSpend: 50000 });
  console.log("   ✓ Gate 01 spend cap blocking verified.\n");

  // 9. Testing request_purchase_approval explicit user consent & Razorpay order
  console.log("9. Testing MCP tool: 'request_purchase_approval'...");
  // 9a. Refuse if user_confirmed is false
  const unconfirmedRes = await handleJsonRpcMessage({
    jsonrpc: "2.0",
    id: "test_appr_unconfirmed",
    method: "tools/call",
    params: {
      name: "request_purchase_approval",
      arguments: {
        cart_id: createdCartId,
        checkout_order_id: checkoutOrderId,
        user_confirmed: false,
      },
    },
  });
  assert.strictEqual(unconfirmedRes.result.structured.approved, false);
  assert.strictEqual(unconfirmedRes.result.structured.status, "APPROVAL_REQUIRED");
  console.log("   ✓ Blocked purchase when explicit confirmation was false.");

  // 9b. Grant explicit approval: server-side Razorpay order generated
  const approvedRes = await handleJsonRpcMessage({
    jsonrpc: "2.0",
    id: "test_appr_confirmed",
    method: "tools/call",
    params: {
      name: "request_purchase_approval",
      arguments: {
        cart_id: createdCartId,
        checkout_order_id: checkoutOrderId,
        user_confirmed: true,
      },
    },
  });
  assert.strictEqual(approvedRes.result.structured.approved, true);
  assert.strictEqual(approvedRes.result.structured.status, "APPROVED_AWAITING_PAYMENT");
  assert(approvedRes.result.structured.approval_token.startsWith("appr_sec_"), "Must return approval token");
  assert(approvedRes.result.structured.razorpay_order_id.startsWith("order_"), "Must generate Razorpay order ID");
  assert.strictEqual(approvedRes.result.structured.amount_paise, 979800);
  console.log(`   • Approval Token: ${approvedRes.result.structured.approval_token}`);
  console.log(`   • Razorpay Order ID: ${approvedRes.result.structured.razorpay_order_id}`);
  console.log(`   • Decision Audit ID: ${approvedRes.result.structured.audit_event_id}`);
  console.log("   ✓ request_purchase_approval successfully generated server-side Razorpay order.\n");

  // 10. Testing get_order tool
  console.log("10. Testing MCP tool: 'get_order'...");
  const orderRes = await handleJsonRpcMessage({
    jsonrpc: "2.0",
    id: "test_order_1",
    method: "tools/call",
    params: {
      name: "get_order",
      arguments: {
        order_id: checkoutOrderId,
      },
    },
  });
  assert.strictEqual(orderRes.result.structured.success, true);
  assert.strictEqual(orderRes.result.structured.order.order_id, checkoutOrderId);
  console.log(`   • Order ${checkoutOrderId} status: ${orderRes.result.structured.order.status}`);
  console.log(`   • Linked Razorpay Order: ${orderRes.result.structured.order.razorpay_order_id}`);
  console.log("   ✓ get_order verified.\n");

  // 11. Verify Decision Ledger records
  console.log("11. Verifying Decision Ledger audit trail...");
  const ledger = getDecisionLedger();
  const mcpEvents = ledger.filter((e) => e.id.includes("mcp"));
  assert(mcpEvents.length >= 3, `Expected at least 3 MCP events in ledger, found ${mcpEvents.length}`);
  console.log(`   • Found ${mcpEvents.length} immutable MCP events recorded in Decision Ledger:`);
  mcpEvents.slice(0, 3).forEach((e) => console.log(`     - [${e.step}] ${e.title} (${e.status})`));
  console.log("   ✓ Decision Ledger audit trail verified.\n");

  console.log("==================================================");
  console.log("ALL MCP TOOLS & SAFETY CHECKS PASSED (11/11)!");
  console.log("==================================================");
}

runMcpToolsTests().catch((err) => {
  console.error("MCP Test Suite Failed:", err);
  process.exit(1);
});
