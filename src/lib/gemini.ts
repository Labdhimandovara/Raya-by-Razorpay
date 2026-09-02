export interface ShoppingToolCall {
  name: string;
  args: any;
}

export interface ToolExecutionResult {
  tool: string;
  args: any;
  status: "SUCCESS" | "FAILED";
  result: any;
}

export interface AgentChatResponse {
  text: string;
  toolExecutions: ToolExecutionResult[];
  products?: any[];
  cart?: any;
  receipt?: any;
  history: any[];
}

export const RAYA_SYSTEM_INSTRUCTION = `
You are Raya, an autonomous AI shopping agent built by Razorpay for NexusStore.
Your role:
1. Search catalog products using the 'listProducts' tool when the user looks for items, categories, or price ranges.
2. View user's cart using 'viewCart'.
3. Add items to cart using 'addToCart'.
4. Checkout orders using 'checkoutOrder'.
   - When the user is ready to order, confirm their delivery address (name, street, city, country, zip).
   - If the user provided the address in the prompt, execute 'checkoutOrder' directly.
5. Track previous orders using 'getOrderHistory'.

Tone & Persona:
- Be fast, professional, helpful, and concise.
- Highlight product highlights, prices in ₹ (INR), and stock availability.
- Always reassure the user that payments and orders are protected under Razorpay purchase guard.
`;

export const GEMINI_TOOLS = [
  {
    functionDeclarations: [
      {
        name: "listProducts",
        description: "Search NexusStore catalog products by keyword, name, or category",
        parameters: {
          type: "OBJECT",
          properties: {
            search: { type: "STRING", description: "Product name or search keyword (e.g. shirt, shoes, watch, bag)" },
            category: { type: "STRING", description: "Filter category (e.g. Clothing, Electronics, Books, Accessories)" },
          },
        },
      },
      {
        name: "viewCart",
        description: "View current shopping cart contents, total amount, and item count",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },
      {
        name: "addToCart",
        description: "Add a specific product to the user's shopping cart",
        parameters: {
          type: "OBJECT",
          properties: {
            productId: { type: "STRING", description: "The unique ID of the product" },
            quantity: { type: "INTEGER", description: "Number of units to add (default: 1)" },
          },
          required: ["productId"],
        },
      },
      {
        name: "checkoutOrder",
        description: "Place order from active cart with delivery address and payment method",
        parameters: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING", description: "Full name of the recipient" },
            street: { type: "STRING", description: "Street address" },
            city: { type: "STRING", description: "City" },
            country: { type: "STRING", description: "Country (e.g. USA, India)" },
            zip: { type: "STRING", description: "Postal or ZIP code" },
            paymentMethod: { type: "STRING", enum: ["card", "cash"], description: "Payment method" },
          },
          required: ["name", "street", "city", "country", "zip"],
        },
      },
      {
        name: "getOrderHistory",
        description: "Fetch list of past orders and tracking status",
        parameters: {
          type: "OBJECT",
          properties: {},
        },
      },
    ],
  },
];

// Helper to execute tool against the NexusStore Bridge Gateway
export async function executeBridgeTool(
  toolName: string,
  args: any,
  bridgeBaseUrl: string
): Promise<{ status: "SUCCESS" | "FAILED"; data: any }> {
  const normalizedBase = bridgeBaseUrl.replace(/\/$/, "");

  try {
    switch (toolName) {
      case "listProducts": {
        const params = new URLSearchParams();
        if (args?.search) params.append("search", args.search);
        if (args?.category) params.append("category", args.category);
        const qs = params.toString();
        const url = `${normalizedBase}/products${qs ? `?${qs}` : ""}`;
        const res = await fetch(url, { method: "GET" });
        const json = await res.json();
        return { status: res.ok ? "SUCCESS" : "FAILED", data: json };
      }

      case "viewCart": {
        const url = `${normalizedBase}/cart`;
        const res = await fetch(url, { method: "GET" });
        const json = await res.json();
        return { status: res.ok ? "SUCCESS" : "FAILED", data: json };
      }

      case "addToCart": {
        const url = `${normalizedBase}/cart`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: args.productId,
            quantity: args.quantity || 1,
          }),
        });
        const json = await res.json();
        return { status: res.ok ? "SUCCESS" : "FAILED", data: json };
      }

      case "checkoutOrder": {
        const url = `${normalizedBase}/checkout`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: {
              name: args.name,
              street: args.street,
              city: args.city,
              country: args.country,
              zip: args.zip,
            },
            paymentMethod: args.paymentMethod || "card",
          }),
        });
        const json = await res.json();
        return { status: res.ok ? "SUCCESS" : "FAILED", data: json };
      }

      case "getOrderHistory": {
        const url = `${normalizedBase}/orders`;
        const res = await fetch(url, { method: "GET" });
        const json = await res.json();
        return { status: res.ok ? "SUCCESS" : "FAILED", data: json };
      }

      default:
        return { status: "FAILED", data: { error: `Unsupported tool: ${toolName}` } };
    }
  } catch (err: any) {
    return {
      status: "FAILED",
      data: { error: err.message || "Failed to reach NexusStore bridge" },
    };
  }
}
