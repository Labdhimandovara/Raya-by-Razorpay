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

export interface StoreInfo {
  id: string;
  name: string;
  vibe: string;
  tagline: string;
  icon: string;
  badgeClass: string;
  borderClass: string;
  baseUrl: string;
  frontendUrl: string;
}

export const CONNECTED_STORES: Record<string, StoreInfo> = {
  nexusstore: {
    id: "nexusstore",
    name: "NexusStore",
    vibe: "Smart Tech & Activewear",
    tagline: "Sleek, high-performance smart apparel & tech-forward electronics",
    icon: "⚡",
    badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200",
    borderClass: "hover:border-indigo-400",
    baseUrl: process.env.NEXUS_API_URL || "https://demo-shop-api.onrender.com/api",
    frontendUrl: "https://demo-shop-frontend.vercel.app",
  },
  threadvault: {
    id: "threadvault",
    name: "ThreadVault",
    vibe: "Minimalist Luxury & Audio",
    tagline: "Curated minimalist luxury fashion, bespoke streetwear & artisan acoustic audio",
    icon: "🧵",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    borderClass: "hover:border-amber-400",
    baseUrl: process.env.THREADVAULT_API_URL || "https://threadvault-api-i120.onrender.com/api",
    frontendUrl: "https://threadvault-frontend.vercel.app",
  },
  pixelmart: {
    id: "pixelmart",
    name: "PixelMart",
    vibe: "Cyberpunk Creator Gear",
    tagline: "Next-gen creator equipment, interactive RGB hardware & cyberpunk streetwear",
    icon: "🎮",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    borderClass: "hover:border-emerald-400",
    baseUrl: process.env.PIXELMART_API_URL || "https://pixelmart-api-2d25.onrender.com/api",
    frontendUrl: "https://pixelmart-frontend.vercel.app",
  },
};

export const RAYA_SYSTEM_INSTRUCTION = `
You are Raya, an autonomous AI shopping intelligence agent created by Razorpay.
You represent a unified shopping bridge connecting users to 3 live e-commerce stores:

1. ⚡ NexusStore ('nexusstore'):
   - Vibe: Sleek high-performance smart apparel, connected wearable jackets, and daily tech electronics.
2. 🧵 ThreadVault ('threadvault'):
   - Vibe: Curated minimalist luxury fashion, Mongolian cashmere, bespoke heavyweight streetwear, and audiophile acoustic gear.
3. 🎮 PixelMart ('pixelmart'):
   - Vibe: Cyberpunk streetwear, streaming equipment, macro keypads, and RGB desktop hardware.

Your Capabilities & Tools:
1. 'listProducts': Search products across 'all' stores simultaneously (default), or filter to a specific store ('nexusstore', 'threadvault', or 'pixelmart').
2. 'listConnectedStores': Discover the 3 connected stores, their live health, and specializations.
3. 'viewCart': View active shopping cart for a store (specify store name).
4. 'addToCart': Add item to cart with store name and product ID.
5. 'checkoutOrder': Place order on a store with shipping address (name, street, city, country, zip) and payment method.
6. 'getOrderHistory': Fetch customer orders and tracking status.

Tone & Persona:
- Fast, friendly, highly knowledgeable, and authoritative on e-commerce.
- Always mention which store each recommended item comes from (e.g., "From ThreadVault: ...", "From PixelMart: ...").
- Format prices in ₹ (INR) and mention stock levels.
- Reassure users that transactions are secured by Razorpay autonomous purchase guard.
`;

export const GROQ_TOOLS = [
  {
    type: "function",
    function: {
      name: "listConnectedStores",
      description: "List all 3 connected merchant stores (NexusStore, ThreadVault, PixelMart) with their vibes and live status",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listProducts",
      description: "Search catalog products across all stores simultaneously or target a specific store",
      parameters: {
        type: "object",
        properties: {
          store: {
            type: "string",
            description: "Store to search: 'all' (default, searches all 3 stores), 'nexusstore', 'threadvault', or 'pixelmart'",
            enum: ["all", "nexusstore", "threadvault", "pixelmart"],
          },
          search: {
            type: "string",
            description: "Product keyword, item name, or style (e.g. cashmere, microphone, headphones, jacket, keyboard)",
          },
          category: {
            type: "string",
            description: "Filter by category: 'Clothing' or 'Tech'",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "viewCart",
      description: "View current shopping cart contents, total amount, and item count for a store",
      parameters: {
        type: "object",
        properties: {
          store: {
            type: "string",
            description: "Store to check cart on: 'nexusstore', 'threadvault', or 'pixelmart'",
            enum: ["nexusstore", "threadvault", "pixelmart"],
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "addToCart",
      description: "Add a product to the user's shopping cart on a specific store",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string", description: "The unique ID of the product" },
          quantity: { type: "integer", description: "Number of units to add (default: 1)" },
          store: {
            type: "string",
            description: "Target store: 'nexusstore', 'threadvault', or 'pixelmart'",
            enum: ["nexusstore", "threadvault", "pixelmart"],
          },
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
          store: {
            type: "string",
            description: "Store to checkout from: 'nexusstore', 'threadvault', or 'pixelmart'",
            enum: ["nexusstore", "threadvault", "pixelmart"],
          },
        },
        required: ["name", "street", "city", "country", "zip"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getOrderHistory",
      description: "Fetch list of past orders and tracking status for a store",
      parameters: {
        type: "object",
        properties: {
          store: {
            type: "string",
            description: "Store to check orders on: 'nexusstore', 'threadvault', or 'pixelmart'",
            enum: ["nexusstore", "threadvault", "pixelmart"],
          },
        },
      },
    },
  },
];

// Execute tool against Bazaar AI Multi-Store Bridge or direct store backends
export async function executeBridgeTool(
  toolName: string,
  args: any,
  bridgeBaseUrl: string
): Promise<{ status: "SUCCESS" | "FAILED"; data: any }> {
  const normalizedBase = bridgeBaseUrl.replace(/\/$/, "");

  try {
    switch (toolName) {
      case "listConnectedStores": {
        try {
          const res = await fetch(`${normalizedBase}/stores`, { signal: AbortSignal.timeout(5000) });
          if (res.ok) {
            const json = await res.json();
            return { status: "SUCCESS", data: json.stores || json };
          }
        } catch {}
        return { status: "SUCCESS", data: Object.values(CONNECTED_STORES) };
      }

      case "listProducts": {
        const store = args?.store || "all";
        const params = new URLSearchParams();
        params.append("store", store);
        if (args?.search) params.append("search", args.search);
        if (args?.category) params.append("category", args.category);

        try {
          const url = `${normalizedBase}/products?${params.toString()}`;
          const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
          if (res.ok) {
            const json = await res.json();
            let products = json.products || json.data?.products || (Array.isArray(json) ? json : []);
            products = products.map((p: any) => ({
              ...p,
              store: p.store || store,
              storeName: p.storeName || CONNECTED_STORES[p.store || store]?.name || "Store",
              storeUrl: p.storeUrl || CONNECTED_STORES[p.store || store]?.frontendUrl || "",
            }));
            return { status: "SUCCESS", data: products };
          }
        } catch (e) {
          console.warn("[Raya] Bridge search failed, falling back to direct store endpoints:", e);
        }

        // Direct Fallback to Store Endpoints
        const targetStores = store === "all" ? Object.values(CONNECTED_STORES) : [CONNECTED_STORES[store] || CONNECTED_STORES.nexusstore];
        const directPromises = targetStores.map(async (st) => {
          try {
            const searchParams = new URLSearchParams();
            if (args?.search) searchParams.append("search", args.search);
            if (args?.category) searchParams.append("category", args.category);
            const r = await fetch(`${st.baseUrl}/products?${searchParams.toString()}`, { signal: AbortSignal.timeout(5000) });
            if (!r.ok) return [];
            const j = await r.json();
            const prods = j.data?.products || j.products || [];
            return prods.map((p: any) => ({
              ...p,
              store: st.id,
              storeName: st.name,
              storeUrl: st.frontendUrl,
            }));
          } catch {
            return [];
          }
        });

        const directResults = (await Promise.all(directPromises)).flat();
        return { status: "SUCCESS", data: directResults };
      }

      case "viewCart": {
        const store = args?.store || "nexusstore";
        const url = `${normalizedBase}/cart?store=${store}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        const json = await res.json();
        return { status: res.ok ? "SUCCESS" : "FAILED", data: json };
      }

      case "addToCart": {
        const store = args?.store || "nexusstore";
        const url = `${normalizedBase}/cart`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: args.productId,
            quantity: args.quantity || 1,
            store,
          }),
          signal: AbortSignal.timeout(6000),
        });
        const json = await res.json();
        return { status: res.ok ? "SUCCESS" : "FAILED", data: json };
      }

      case "checkoutOrder": {
        const store = args?.store || "nexusstore";
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
            store,
          }),
          signal: AbortSignal.timeout(8000),
        });
        const json = await res.json();
        return { status: res.ok ? "SUCCESS" : "FAILED", data: json };
      }

      case "getOrderHistory": {
        const store = args?.store || "nexusstore";
        const url = `${normalizedBase}/orders?store=${store}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        const json = await res.json();
        return { status: res.ok ? "SUCCESS" : "FAILED", data: json };
      }

      default:
        return { status: "FAILED", data: { error: `Unsupported tool: ${toolName}` } };
    }
  } catch (err: any) {
    return {
      status: "FAILED",
      data: { error: err.message || "Failed to reach multi-store bridge" },
    };
  }
}
