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
  ebay: {
    id: "ebay",
    name: "eBay",
    vibe: "Global Marketplace & Refurbished",
    tagline: "Worldwide marketplace with verified buyer protection & refurbished electronics",
    icon: "🛍️",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    borderClass: "hover:border-blue-400",
    baseUrl: "https://www.ebay.com",
    frontendUrl: "https://www.ebay.com",
  },
};

export const RAYA_SYSTEM_INSTRUCTION = `
You are Raya, an autonomous AI shopping intelligence agent created by Razorpay.
You represent a unified shopping bridge connecting users to live e-commerce stores and global marketplaces:

1. ⚡ NexusStore ('nexusstore'):
   - Vibe: Sleek high-performance smart apparel, connected wearable jackets, and daily tech electronics.
2. 🧵 ThreadVault ('threadvault'):
   - Vibe: Curated minimalist luxury fashion, Mongolian cashmere, bespoke heavyweight streetwear, and audiophile acoustic gear.
3. 🎮 PixelMart ('pixelmart'):
   - Vibe: Cyberpunk streetwear, streaming equipment, macro keypads, and RGB desktop hardware.
4. 🛍️ eBay ('ebay'):
   - Vibe: Global marketplace with certified refurbished electronics, flagship tech, and rare apparel.
   - Important: eBay items cannot be checked out via native Razorpay merchant checkout; users click the "View on eBay" button on product cards to view and purchase directly on eBay.

Your Capabilities & Tools:
1. 'listProducts': Search products across 'all' stores simultaneously (default), or filter to a specific store ('nexusstore', 'threadvault', 'pixelmart', or 'ebay').
2. 'listConnectedStores': Discover the connected stores, their live health, and specializations.
3. 'viewCart': View active shopping cart for a merchant store (specify store name).
4. 'addToCart': Add item to cart with store name and product ID (for NexusStore, ThreadVault, PixelMart).
5. 'checkoutOrder': Place order on a store with shipping address (name, street, city, country, zip) and payment method.
6. 'getOrderHistory': Fetch customer orders and tracking status.

Tone & Persona:
- Fast, friendly, highly knowledgeable, and authoritative on e-commerce.
- Always mention which store each recommended item comes from (e.g., "From eBay: ...", "From ThreadVault: ...").
- Format prices in ₹ (INR) and mention stock levels or condition.
- For eBay items, explain that users can click "View on eBay" to view the listing directly.
- Reassure users that transactions on merchant stores are secured by Razorpay autonomous purchase guard.
`;

export const GROQ_TOOLS = [
  {
    type: "function",
    function: {
      name: "listConnectedStores",
      description: "List all connected merchant stores and marketplaces (NexusStore, ThreadVault, PixelMart, eBay) with their vibes and live status",
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
      description: "Search catalog products across all stores simultaneously or target a specific store or eBay marketplace",
      parameters: {
        type: "object",
        properties: {
          store: {
            type: "string",
            description: "Store to search: 'all' (default, searches all stores + eBay), 'nexusstore', 'threadvault', 'pixelmart', or 'ebay'",
            enum: ["all", "nexusstore", "threadvault", "pixelmart", "ebay"],
          },
          search: {
            type: "string",
            description: "Product keyword, item name, or style (e.g. cashmere, iPhone, headphones, jacket, keyboard)",
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

export const SAMPLE_EBAY_PRODUCTS = [
  {
    id: "ebay-iphone-15-pro-max",
    name: "Apple iPhone 15 Pro Max 256GB Titanium (Refurbished Excellent)",
    description: "Certified Refurbished with 1-Year Allstate Warranty, 100% battery health, unlocked worldwide.",
    price: 89999,
    stock: 8,
    category: "Tech",
    imageUrl: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop",
    store: "ebay",
    storeName: "eBay",
    storeUrl: "https://www.ebay.com",
    productUrl: "https://www.ebay.com/itm/386123456789",
    isEbay: true,
    source: "ebay",
  },
  {
    id: "ebay-sony-wh1000xm5",
    name: "Sony WH-1000XM5 Wireless Noise-Canceling Headphones - Black",
    description: "Industry-leading noise cancellation, dual processors, 30-hour battery life with quick charge.",
    price: 24999,
    stock: 14,
    category: "Tech",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop",
    store: "ebay",
    storeName: "eBay",
    storeUrl: "https://www.ebay.com",
    productUrl: "https://www.ebay.com/itm/386234567890",
    isEbay: true,
    source: "ebay",
  },
  {
    id: "ebay-apple-watch-ultra-2",
    name: "Apple Watch Ultra 2 GPS + Cellular 49mm Titanium - Orange Band",
    description: "Rugged and capable smartwatch with precision dual-frequency GPS, up to 36 hours of battery life.",
    price: 62999,
    stock: 5,
    category: "Tech",
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop",
    store: "ebay",
    storeName: "eBay",
    storeUrl: "https://www.ebay.com",
    productUrl: "https://www.ebay.com/itm/386345678901",
    isEbay: true,
    source: "ebay",
  },
  {
    id: "ebay-bose-qc-ultra-earbuds",
    name: "Bose QuietComfort Ultra Wireless Earbuds with Spatial Audio",
    description: "Breakthrough spatial audio for immersive listening, world-class active noise cancellation.",
    price: 19999,
    stock: 12,
    category: "Tech",
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop",
    store: "ebay",
    storeName: "eBay",
    storeUrl: "https://www.ebay.com",
    productUrl: "https://www.ebay.com/itm/386456789012",
    isEbay: true,
    source: "ebay",
  },
  {
    id: "ebay-steam-deck-oled-1tb",
    name: "Steam Deck OLED 1TB Handheld Gaming Console (Certified)",
    description: "7.4-inch 90Hz HDR OLED display, faster downloads with Wi-Fi 6E, 50Whr battery.",
    price: 54999,
    stock: 6,
    category: "Tech",
    imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop",
    store: "ebay",
    storeName: "eBay",
    storeUrl: "https://www.ebay.com",
    productUrl: "https://www.ebay.com/itm/386567890123",
    isEbay: true,
    source: "ebay",
  },
  {
    id: "ebay-vintage-nike-acg-jacket",
    name: "Vintage 90s Nike ACG Storm-FIT Mountain Parka Jacket",
    description: "Heavyweight weather-resistant technical mountaineering jacket in contrast retro purple/teal.",
    price: 14999,
    stock: 4,
    category: "Clothing",
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop",
    store: "ebay",
    storeName: "eBay",
    storeUrl: "https://www.ebay.com",
    productUrl: "https://www.ebay.com/itm/386789012345",
    isEbay: true,
    source: "ebay",
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

        // Direct eBay search
        if (store === "ebay") {
          const search = (args?.search || "").toLowerCase();
          const filtered = search
            ? SAMPLE_EBAY_PRODUCTS.filter(
                (p) =>
                  p.name.toLowerCase().includes(search) ||
                  p.description.toLowerCase().includes(search) ||
                  p.category.toLowerCase().includes(search)
              )
            : SAMPLE_EBAY_PRODUCTS;
          return { status: "SUCCESS", data: filtered };
        }

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
              productUrl: p.productUrl || (p.store === "ebay" ? "https://www.ebay.com" : undefined),
              isEbay: p.store === "ebay" || p.source === "ebay",
            }));
            return { status: "SUCCESS", data: products };
          }
        } catch (e) {
          console.warn("[Raya] Bridge search failed, falling back to direct store endpoints:", e);
        }

        // Direct Fallback to Store Endpoints
        const targetStores =
          store === "all"
            ? Object.values(CONNECTED_STORES).filter((s) => s.id !== "ebay")
            : [CONNECTED_STORES[store] || CONNECTED_STORES.nexusstore];

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

        // If "all" was requested, also append top eBay items
        if (store === "all") {
          directResults.push(...SAMPLE_EBAY_PRODUCTS.slice(0, 2));
        }

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
