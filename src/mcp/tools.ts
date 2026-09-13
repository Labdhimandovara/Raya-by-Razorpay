// Raya MCP Tools Definitions and Handlers
// Declarations and JSON schemas conforming to Model Context Protocol (MCP) standards.

import { McpToolDeclaration } from "./types";
import {
  searchProductsAdapter,
  getProductAdapter,
  compareProductsAdapter,
  createCartAdapter,
  getCartAdapter,
  addToCartAdapter,
  prepareCheckoutAdapter,
  requestPurchaseApprovalAdapter,
  getOrderAdapter,
} from "./raya-adapter";

export const RAYA_MCP_TOOLS: McpToolDeclaration[] = [
  {
    name: "search_products",
    description:
      "Search catalog products across Raya's connected merchant stores (NexusStore, ThreadVault, PixelMart, eBay) with category, budget limits, user objective, and priorities. Applies genuine value-based recommendation scoring rather than lowest-price bias.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search keyword, intent phrase, or product requirements (e.g. 'headphones for travel under 10k', 'laptop for gaming')",
        },
        category: {
          type: "string",
          description: "Optional category filter: 'smartphone', 'headphones', 'laptop', 'apparel', 'smartwatch', 'Tech', 'Clothing'",
        },
        max_price: {
          type: "number",
          description: "Strict upper budget limit in INR. Products above this limit are excluded.",
        },
        store: {
          type: "string",
          description: "Store to target: 'all' (default, searches all stores), 'nexusstore', 'threadvault', 'pixelmart', or 'ebay'",
          enum: ["all", "nexusstore", "threadvault", "pixelmart", "ebay"],
        },
        objective: {
          type: "string",
          description: "Recommendation objective: 'best_value' (default: identifies best overall quality/fit within constraints) or 'cheapest' (prioritizes lowest price upon explicit user intent)",
          enum: ["best_value", "cheapest", "performance"],
        },
        priority: {
          type: "string",
          description: "Specialized priority to emphasize (e.g. 'gaming', 'camera', 'anc', 'travel', 'battery')",
        },
      },
      required: [],
    },
  },
  {
    name: "get_product",
    description: "Get detailed information, full specifications, merchant details, stock status, and explainability breakdown for a specific product ID.",
    inputSchema: {
      type: "object",
      properties: {
        product_id: {
          type: "string",
          description: "Unique product ID (e.g. 'nx-pro-wireless-anc-headphones', 'ebay-anker-soundcore-q30')",
        },
        store: {
          type: "string",
          description: "Optional store filter where product is listed",
        },
      },
      required: ["product_id"],
    },
  },
  {
    name: "compare_products",
    description: "Compare 2 or more products side-by-side, analyzing price, hardware specifications, overall value score, and trade-offs.",
    inputSchema: {
      type: "object",
      properties: {
        product_ids: {
          type: "array",
          items: { type: "string" },
          description: "List of product IDs to compare (minimum 2 products)",
        },
        user_intent: {
          type: "string",
          description: "Optional context or intended use case for the comparison (e.g. 'frequent air travel', 'competitive gaming')",
        },
      },
      required: ["product_ids"],
    },
  },
  {
    name: "create_cart",
    description: "Create a new isolated shopping cart session for the user with optional spending cap and initial items.",
    inputSchema: {
      type: "object",
      properties: {
        budget_limit: {
          type: "number",
          description: "Optional safety spending policy cap for this cart in INR",
        },
        initial_items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              product_id: { type: "string" },
              quantity: { type: "integer", default: 1 },
              store: { type: "string" },
            },
            required: ["product_id"],
          },
          description: "Optional initial items to add to the cart",
        },
      },
      required: [],
    },
  },
  {
    name: "get_cart",
    description: "Retrieve current shopping cart contents, line items, subtotal, and 6-gate financial safety evaluation status.",
    inputSchema: {
      type: "object",
      properties: {
        cart_id: {
          type: "string",
          description: "Cart session ID (optional, defaults to active cart session)",
        },
      },
      required: [],
    },
  },
  {
    name: "add_to_cart",
    description: "Add a product to the user's cart session. Strictly enforces Gate 02 limit (maximum 5 units per SKU) and checks spend limits.",
    inputSchema: {
      type: "object",
      properties: {
        product_id: {
          type: "string",
          description: "Unique product ID to add",
        },
        quantity: {
          type: "integer",
          description: "Quantity to add (default: 1, max: 5 per SKU)",
          default: 1,
        },
        cart_id: {
          type: "string",
          description: "Target cart ID (optional, will create or use current cart if omitted)",
        },
        store: {
          type: "string",
          description: "Store ID (optional)",
        },
      },
      required: ["product_id"],
    },
  },
  {
    name: "prepare_checkout",
    description: "Evaluate the 6 server-side financial safety gates (Spend Cap, SKU Limit, Price Revalidation, Currency Match, Merchant Auth, TTL) and prepare a checkout order draft awaiting explicit user approval.",
    inputSchema: {
      type: "object",
      properties: {
        cart_id: {
          type: "string",
          description: "Cart session ID to checkout",
        },
        recipient_name: {
          type: "string",
          description: "Full name of delivery recipient",
        },
        delivery_address: {
          type: "object",
          properties: {
            street: { type: "string" },
            city: { type: "string" },
            zip: { type: "string" },
            country: { type: "string", default: "India" },
          },
          description: "Delivery address details",
        },
      },
      required: [],
    },
  },
  {
    name: "request_purchase_approval",
    description: "Explicit User Approval Gate. Verifies explicit confirmation, re-checks live catalog prices against volatility (Gate 03), and creates a server-side Razorpay test mode order. Unrestricted autonomous payments are blocked.",
    inputSchema: {
      type: "object",
      properties: {
        user_confirmed: {
          type: "boolean",
          description: "Must be TRUE indicating the buyer has explicitly reviewed the order and authorized payment.",
        },
        checkout_order_id: {
          type: "string",
          description: "Checkout draft order ID from prepare_checkout",
        },
        cart_id: {
          type: "string",
          description: "Cart ID (if checkout_order_id not specified)",
        },
        simulate_price_spike: {
          type: "boolean",
          description: "Demonstration flag to simulate live price spike between recommendation and approval, verifying Gate 03 rejection.",
        },
      },
      required: ["user_confirmed"],
    },
  },
  {
    name: "get_order",
    description: "Fetch order details, settlement status, Razorpay tracking, and decision audit logs for an order ID.",
    inputSchema: {
      type: "object",
      properties: {
        order_id: {
          type: "string",
          description: "Order ID or Razorpay order ID to look up",
        },
      },
      required: ["order_id"],
    },
  },
];

/**
 * Dispatches an MCP tool call to the corresponding adapter function.
 */
export async function executeMcpTool(toolName: string, args: any = {}): Promise<any> {
  switch (toolName) {
    case "search_products":
      return await searchProductsAdapter(args);

    case "get_product":
      return await getProductAdapter(args);

    case "compare_products":
      return await compareProductsAdapter(args);

    case "create_cart":
      return await createCartAdapter(args);

    case "get_cart":
      return await getCartAdapter(args);

    case "add_to_cart":
      return await addToCartAdapter(args);

    case "prepare_checkout":
      return await prepareCheckoutAdapter(args);

    case "request_purchase_approval":
      return await requestPurchaseApprovalAdapter(args);

    case "get_order":
      return await getOrderAdapter(args);

    default:
      throw new Error(`Unsupported MCP tool: '${toolName}'`);
  }
}
