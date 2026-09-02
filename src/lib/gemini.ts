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

// OpenAI-compatible tools format (works with Groq)
export const GROQ_TOOLS = [
  {
    type: "function",
    function: {
      name: "listProducts",
      description: "Search NexusStore catalog products by keyword, name, or category",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string", description: "Product name or search keyword (e.g. shirt, shoes, watch, bag)" },
          category: { type: "string", description: "Filter category (e.g. Clothing, Electronics, Books, Accessories)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "viewCart",
      description: "View current shopping cart contents, total amount, and item count",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "addToCart",
      description: "Add a specific product to the user's shopping cart",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string", description: "The unique ID of the product" },
          quantity: { type: "integer", description: "Number of units to add (default: 1)" },
        },
        required: ["productId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "checkoutOrder",
      description: "Place order from active cart with delivery address and payment method",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Full name of the recipient" },
          street: { type: "string", description: "Street address" },
          city: { type: "string", description: "City" },
          country: { type: "string", description: "Country (e.g. USA, India)" },
          zip: { type: "string", description: "Postal or ZIP code" },
          paymentMethod: { type: "string", enum: ["card", "cash"], description: "Payment method" },
        },
        required: ["name", "street", "city", "country", "zip"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getOrderHistory",
      description: "Fetch list of past orders and tracking status",
      parameters: {
        type: "object",
        properties: {},
      },
    },
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
