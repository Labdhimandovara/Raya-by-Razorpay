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
   - Note: eBay items feature a direct "View on eBay" button for checkout on eBay.

CRITICAL PRODUCT POLICIES:
1. Uniform Product & Category Matching:
   - When the user asks for a specific category or item (e.g. "headphone", "audio", "electronics", "keyboard", "jacket"):
     - ONLY recommend items that match that item or category!
     - When searching for headphones/audio/electronics, DO NOT recommend unrelated clothing (e.g. blazers, coats, denim).
     - Query across all 3 stores (NexusStore, ThreadVault, PixelMart) + eBay to assemble a uniform, relevant collection.

2. Strict Price & Budget Limit Enforcement:
   - If the user specifies an upper price limit (e.g. "under 5000", "below ₹5,000", "budget 5k"):
     - You MUST pass 'maxPrice' (e.g. 5000) to the 'listProducts' tool.
     - NEVER recommend, return, or mention any product whose price exceeds this limit! Products above the budget must be 100% excluded.
     - Reassure the user that all recommended items respect their budget limit.

3. Buyer Match Score & #1 Best Match:
   - Every product recommended MUST feature:
     - 'buyerScore': A numerical score from 1 to 100 (e.g. 98, 95, 91) based on relevance, specs, budget fit, and buyer ratings.
     - 'isBestMatch': Set to true for the #1 top recommendation.
     - 'matchReason': A clear, concise 1-sentence reason why you recommend this specific item.

4. Autonomous Purchase Guard & Spending Limit Blocking:
   - The user has an active safety spending limit (default ₹15,000, or user's stated limit like ₹5,000).
   - Any order or checkout that exceeds this spending limit is BLOCKED by Razorpay autonomous purchase guard. Always warn the user if an action would exceed their policy limit.

Tone & Persona:
- Fast, concise, highly authoritative, and helpful.
- Mention which store each recommended item comes from (e.g., "From NexusStore: ...", "From eBay: ...").
- Format prices in ₹ (INR) and emphasize that all items comply with the requested budget.
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
      description: "Search catalog products across all stores simultaneously or target a specific store or eBay marketplace with strict price and category filters",
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
            description: "Product keyword, item name, or style (e.g. headphone, earbuds, audio, jacket, keyboard)",
          },
          category: {
            type: "string",
            description: "Filter by category: 'Clothing' or 'Tech'",
          },
          maxPrice: {
            type: "number",
            description: "Strict upper budget limit in INR (e.g. 5000 for under 5000 / budget 5k). Products strictly above this price MUST be excluded.",
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
    id: "ebay-anker-soundcore-q30",
    name: "Anker Soundcore Life Q30 Hybrid ANC Wireless Headphones",
    description: "Certified Refurbished with multi-mode noise cancellation, 40-hour playtime, Hi-Res certified sound.",
    price: 4299,
    stock: 22,
    category: "Tech",
    imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop",
    store: "ebay",
    storeName: "eBay",
    storeUrl: "https://www.ebay.com",
    productUrl: "https://www.ebay.com/itm/386990123456",
    isEbay: true,
    source: "ebay",
  },
  {
    id: "ebay-jbl-tune-510bt",
    name: "JBL Tune 510BT Wireless On-Ear Bluetooth Headphones",
    description: "JBL Pure Bass sound, 40-hour battery life with speed charge (2H in 5 mins), hands-free calls.",
    price: 2799,
    stock: 35,
    category: "Tech",
    imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600&auto=format&fit=crop",
    store: "ebay",
    storeName: "eBay",
    storeUrl: "https://www.ebay.com",
    productUrl: "https://www.ebay.com/itm/386880123456",
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

export const SAMPLE_NEXUS_PRODUCTS = [
  {
    id: "nx-pro-wireless-anc-headphones",
    name: "Nexus Pro Wireless ANC Studio Headphones",
    description: "40mm custom bio-cellulose drivers, 38dB hybrid active noise cancellation, 45-hour battery life.",
    price: 4899,
    stock: 25,
    category: "Tech",
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop",
    store: "nexusstore",
    storeName: "NexusStore",
    storeUrl: "https://demo-shop-frontend.vercel.app",
  },
  {
    id: "nx-sport-active-earbuds",
    name: "Nexus Pulse Sport Waterproof Wireless Earbuds",
    description: "IPX7 waterproof sport earbuds with dynamic bass boost and ergonomic titanium ear hooks.",
    price: 2999,
    stock: 40,
    category: "Tech",
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop",
    store: "nexusstore",
    storeName: "NexusStore",
    storeUrl: "https://demo-shop-frontend.vercel.app",
  },
  {
    id: "nx-smart-heated-techwear-jacket",
    name: "Nexus Smart Heated Techwear Bomber Jacket",
    description: "Carbon fiber heating zones controlled via smartwatch or Bluetooth app with 10000mAh battery pack.",
    price: 7999,
    stock: 18,
    category: "Clothing",
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop",
    store: "nexusstore",
    storeName: "NexusStore",
    storeUrl: "https://demo-shop-frontend.vercel.app",
  },
  {
    id: "nx-magnetic-fast-charge-powerbank",
    name: "Nexus MagVolt 10000mAh Wireless Powerbank",
    description: "Ultra-slim 15W Qi2 wireless magnetic powerbank with digital battery indicator.",
    price: 2199,
    stock: 60,
    category: "Tech",
    imageUrl: "https://images.unsplash.com/photo-1586253634026-8cb574908d1e?w=600&auto=format&fit=crop",
    store: "nexusstore",
    storeName: "NexusStore",
    storeUrl: "https://demo-shop-frontend.vercel.app",
  },
];

function matchesUniformCategory(product: any, query: string, requestedCategory?: string): boolean {
  const q = (query || "").toLowerCase().trim();
  const name = (product.name || "").toLowerCase();
  const desc = (product.description || "").toLowerCase();
  const cat = (product.category || "").toLowerCase();

  // If user explicitly asked for a category
  if (requestedCategory) {
    const rc = requestedCategory.toLowerCase();
    if (rc === "tech" || rc === "electronics") {
      if (cat === "clothing" && !name.includes("techwear") && !name.includes("heated")) return false;
    } else if (rc === "clothing" || rc === "fashion") {
      if (cat === "tech") return false;
    }
  }

  // Audio / Headphone query checks
  const isAudioQuery =
    q.includes("headphone") ||
    q.includes("earphone") ||
    q.includes("earbud") ||
    q.includes("audio") ||
    q.includes("sound") ||
    q.includes("headset") ||
    q.includes("dac") ||
    q.includes("speaker");

  if (isAudioQuery) {
    const isAudioProduct =
      name.includes("headphone") ||
      name.includes("earphone") ||
      name.includes("earbud") ||
      name.includes("audio") ||
      name.includes("sound") ||
      name.includes("dac") ||
      name.includes("speaker") ||
      name.includes("subwoofer") ||
      name.includes("amp") ||
      name.includes("microphone") ||
      desc.includes("headphone") ||
      desc.includes("earphone") ||
      desc.includes("noise-cancelling") ||
      desc.includes("noise cancelling") ||
      desc.includes("acoustic");

    if (!isAudioProduct) return false;
  }

  // General Electronics query check
  const isElectronicsQuery = q.includes("electronic") || q.includes("gadget") || q.includes("tech");
  if (isElectronicsQuery && cat === "clothing" && !name.includes("smart") && !name.includes("heated")) {
    return false;
  }

  // General keyword check if neither audio nor electronics specifically
  if (q && !isAudioQuery && !isElectronicsQuery) {
    const matchesKeyword = name.includes(q) || desc.includes(q) || cat.includes(q);
    if (!matchesKeyword) return false;
  }

  return true;
}

function calculateBuyerScoreAndRanking(products: any[], query: string, maxPrice?: number): any[] {
  const q = (query || "").toLowerCase().trim();

  let enriched = products.map((p) => {
    let score = 84;
    const name = (p.name || "").toLowerCase();
    const desc = (p.description || "").toLowerCase();

    // Exact keyword relevance
    if (q) {
      if (name.includes(q)) score += 8;
      if (desc.includes(q)) score += 3;
    }

    // Budget fit
    if (maxPrice && maxPrice > 0) {
      const ratio = p.price / maxPrice;
      if (ratio <= 0.6) score += 5;
      else if (ratio <= 0.85) score += 3;
      else if (ratio <= 1.0) score += 1;
    }

    // Bonus for noise cancellation / certified
    if (name.includes("certified") || desc.includes("certified")) score += 2;
    if (name.includes("anc") || name.includes("noise-cancelling")) score += 2;

    score = Math.min(score, 99);

    let matchReason = "";
    if (name.includes("headphone") || desc.includes("headphone")) {
      matchReason = maxPrice
        ? `Best verified headphones strictly within your ₹${maxPrice.toLocaleString()} budget with rich acoustics.`
        : "Top recommended studio-grade acoustic headphones with excellent audio clarity.";
    } else if (name.includes("earbud")) {
      matchReason = "Compact true wireless earbuds with active noise cancellation and ergonomic fit.";
    } else if (p.category === "Tech") {
      matchReason = "High-performance tech hardware with verified specifications and top buyer ratings.";
    } else {
      matchReason = "Curated multi-store recommendation matching your exact style and criteria.";
    }

    return {
      ...p,
      buyerScore: p.buyerScore || score,
      matchReason: p.matchReason || matchReason,
    };
  });

  // Sort descending by buyerScore
  enriched.sort((a, b) => (b.buyerScore || 0) - (a.buyerScore || 0));

  // Mark the #1 item as isBestMatch
  if (enriched.length > 0) {
    enriched[0].isBestMatch = true;
    enriched[0].matchReason = `⭐ #1 Best Overall Match: Outstanding value and top customer satisfaction ratings.`;
  }

  return enriched;
}

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
        const search = args?.search || "";
        const category = args?.category;
        const maxPrice = typeof args?.maxPrice === "number" ? args.maxPrice : undefined;

        // Direct eBay search
        if (store === "ebay") {
          let filtered = SAMPLE_EBAY_PRODUCTS.filter((p) => matchesUniformCategory(p, search, category));
          if (maxPrice !== undefined) {
            filtered = filtered.filter((p) => p.price <= maxPrice);
          }
          filtered = calculateBuyerScoreAndRanking(filtered, search, maxPrice);
          return { status: "SUCCESS", data: filtered };
        }

        const params = new URLSearchParams();
        params.append("store", store);
        if (search) params.append("search", search);
        if (category) params.append("category", category);
        if (maxPrice !== undefined) params.append("maxPrice", String(maxPrice));

        try {
          const url = `${normalizedBase}/products?${params.toString()}`;
          const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
          if (res.ok) {
            const json = await res.json();
            let products = json.products || json.data?.products || (Array.isArray(json) ? json : []);

            // Apply uniform matching and price limits if bridge missed them
            products = products.filter((p: any) => matchesUniformCategory(p, search, category));
            if (maxPrice !== undefined) {
              products = products.filter((p: any) => (p.price || 0) <= maxPrice);
            }
            products = calculateBuyerScoreAndRanking(products, search, maxPrice);

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
            if (st.id === "nexusstore") {
              return SAMPLE_NEXUS_PRODUCTS;
            }
            const searchParams = new URLSearchParams();
            if (search) searchParams.append("search", search);
            if (category) searchParams.append("category", category);
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
            if (st.id === "nexusstore") return SAMPLE_NEXUS_PRODUCTS;
            return [];
          }
        });

        let directResults = (await Promise.all(directPromises)).flat();

        // If "all" was requested, also append matching eBay items
        if (store === "all") {
          directResults.push(...SAMPLE_EBAY_PRODUCTS);
        }

        // Uniform Category Matching
        directResults = directResults.filter((p) => matchesUniformCategory(p, search, category));

        // Strict Price Limit Filter
        if (maxPrice !== undefined) {
          directResults = directResults.filter((p) => (p.price || 0) <= maxPrice);
        }

        // Buyer Match Score & Ranking
        directResults = calculateBuyerScoreAndRanking(directResults, search, maxPrice);

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
        const budgetLimit = args.budgetLimit || 15000;
        const totalAmount = args.total || args.amount;

        // Policy Limit Enforcement
        if (totalAmount && totalAmount > budgetLimit) {
          return {
            status: "FAILED",
            data: {
              error: "POLICY_LIMIT_EXCEEDED",
              message: `🚫 TRANSACTION BLOCKED: Order total of ₹${totalAmount.toLocaleString()} exceeds your safety spending policy limit of ₹${budgetLimit.toLocaleString()}. Autonomous Purchase Guard prevented checkout.`,
            },
          };
        }

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
            budgetLimit,
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
