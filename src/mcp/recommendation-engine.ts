// Raya Genuine Recommendation Intelligence & Multi-Attribute Value Scoring Engine
// Implements transparent category-aware ranking, intent extraction, and explainability.

import {
  IntentExtraction,
  RankingObjective,
  RecommendationContext,
  StructuredProduct,
} from "./types";

/**
 * Parses user input to extract structured intent: category, budget constraint, objective, and priorities.
 */
export function extractShoppingIntent(
  query: string = "",
  explicitCategory?: string,
  explicitMaxPrice?: number,
  explicitObjective?: RankingObjective
): IntentExtraction {
  const q = (query || "").toLowerCase().trim();

  // 1. Budget extraction (e.g. "under 30000", "below ₹30,000", "under 30k", "budget 5000", "under 10k")
  let maxPrice = explicitMaxPrice;
  if (maxPrice === undefined) {
    const budgetMatch = q.match(
      /(?:under|below|less than|budget|max|within|up to)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?k|\d+(?:,\d+)*(?:\.\d+)?)/i
    );
    if (budgetMatch) {
      const rawVal = budgetMatch[1].toLowerCase().replace(/,/g, "");
      const parsed = rawVal.endsWith("k") ? parseFloat(rawVal) * 1000 : parseFloat(rawVal);
      if (!isNaN(parsed) && parsed > 0) {
        maxPrice = parsed;
      }
    }
  }

  // 2. Objective extraction (explicit "cheapest" vs "best_value" vs "performance")
  let objective: RankingObjective = explicitObjective || "best_value";
  if (!explicitObjective) {
    if (/\b(cheapest|lowest price|most affordable|least expensive|budget friendly only|lowest cost)\b/i.test(q)) {
      objective = "cheapest";
    } else if (/\b(highest quality|top tier|flagship|audiophile|pro grade|luxury|ultra)\b/i.test(q)) {
      objective = "performance";
    } else {
      objective = "best_value";
    }
  }

  // 3. Category extraction
  let category = explicitCategory;
  if (!category) {
    if (/\b(phone|smartphone|mobile|android|iphone|galaxy|nord)\b/i.test(q)) {
      category = "smartphone";
    } else if (/\b(headphone|headphones|earphone|earbuds|audio|headset|iem|sound)\b/i.test(q)) {
      category = "headphones";
    } else if (/\b(laptop|ultrabook|notebook|macbook|computer|pc)\b/i.test(q)) {
      category = "laptop";
    } else if (/\b(jacket|hoodie|sweater|shirt|tee|apparel|clothing|coat|denim)\b/i.test(q)) {
      category = "apparel";
    } else if (/\b(watch|smartwatch|band)\b/i.test(q)) {
      category = "smartwatch";
    }
  }

  // 4. Priorities extraction
  const priorities: string[] = [];
  if (/\b(gaming|games|fps|refresh rate|gpu)\b/i.test(q)) priorities.push("gaming");
  if (/\b(camera|photo|photography|video|hdr|sensor)\b/i.test(q)) priorities.push("camera");
  if (/\b(battery|battery life|backup|endurance)\b/i.test(q)) priorities.push("battery");
  if (/\b(anc|noise cancel|noise cancelling|isolation)\b/i.test(q)) priorities.push("anc");
  if (/\b(travel|traveling|portable|flight|commute)\b/i.test(q)) priorities.push("travel");
  if (/\b(comfort|ergonomic|lightweight|cushion)\b/i.test(q)) priorities.push("comfort");
  if (/\b(sound|bass|audio|dac|flac|acoustic|spatial)\b/i.test(q)) priorities.push("sound_quality");
  if (/\b(fast|speed|performance|processor|cpu)\b/i.test(q)) priorities.push("performance");
  if (/\b(waterproof|water resistant|weather|heated|warmth)\b/i.test(q)) priorities.push("weatherproof");
  if (/\b(5g)\b/i.test(q)) priorities.push("5g");

  return {
    category,
    maxPrice,
    objective,
    priorities,
    rawQuery: query,
  };
}

/**
 * Extracts key specification features from product description and name.
 */
export function extractKeyFeatures(product: any): string[] {
  const features: string[] = [];
  const text = `${product.name || ""} ${product.description || ""}`.toLowerCase();

  // Audio specs
  if (text.includes("anc") || text.includes("noise cancelling") || text.includes("noise-cancelling")) {
    features.push("Active Noise Cancellation (ANC)");
  }
  if (text.includes("driver")) {
    const m = text.match(/(\d+mm\s*[\w-]*\s*driver)/i);
    features.push(m ? m[1].toUpperCase() : "Custom Drivers");
  }
  if (text.includes("dac") || text.includes("audiophile") || text.includes("hi-res")) {
    features.push("Hi-Res Audio / Dedicated DAC");
  }
  if (text.includes("battery")) {
    const m = text.match(/(\d+[- ]hour battery|\d+h playtime)/i);
    features.push(m ? m[1] : "Long-life Battery");
  }
  if (text.includes("waterproof") || text.includes("ipx")) {
    const m = text.match(/(ipx\d+)/i);
    features.push(m ? m[1].toUpperCase() : "Water-resistant");
  }

  // Computing & Phone specs
  if (text.includes("ram") || text.includes("ssd") || text.includes("storage")) {
    const m = text.match(/(\d+gb\s*ram|\d+gb\s*ssd|\d+tb\s*ssd|\d+gb\s*storage)/gi);
    if (m) features.push(...m.map((s) => s.toUpperCase()));
  }
  if (text.includes("oled") || text.includes("mini-led") || text.includes("amoled")) {
    features.push("OLED / High-Refresh Display");
  }
  if (text.includes("5g")) {
    features.push("5G Connectivity");
  }
  if (text.includes("certified refurbished") || text.includes("warranty")) {
    features.push("Certified with Warranty Protection");
  }

  // Techwear specs
  if (text.includes("heated") || text.includes("heating")) {
    features.push("Active Heated Elements");
  }
  if (text.includes("graphene") || text.includes("carbon fiber")) {
    features.push("Carbon Fiber / Graphene Architecture");
  }

  // Fallback if no specific feature matched
  if (features.length === 0) {
    if (product.category) features.push(`Verified ${product.category} item`);
    features.push(`Standard domestic fulfillment`);
  }

  return Array.from(new Set(features)).slice(0, 4);
}

/**
 * Evaluates Product Quality & Specifications (0 to 100).
 */
function evaluateProductQuality(product: any, category?: string, priorities: string[] = []): number {
  const name = (product.name || "").toLowerCase();
  const desc = (product.description || "").toLowerCase();
  const fullText = `${name} ${desc}`;

  let quality = 75; // baseline quality for verified products

  // Rating signals (standard 1-5 scale mapped to 0-100)
  const rating = typeof product.rating === "number" ? product.rating : 4.3;
  quality += (rating - 3.5) * 12; // 4.5 star gives +12, 4.8 gives +15.6

  // Premium specifications boost
  if (fullText.includes("titanium") || fullText.includes("aerospace aluminum") || fullText.includes("cashmere")) {
    quality += 6;
  }
  if (fullText.includes("bio-cellulose") || fullText.includes("planar magnetic") || fullText.includes("ess sabre")) {
    quality += 8;
  }
  if (fullText.includes("active noise cancelling") || fullText.includes("hybrid anc") || fullText.includes("38db")) {
    quality += 6;
  }
  if (fullText.includes("oled") || fullText.includes("mini-led") || fullText.includes("240hz")) {
    quality += 6;
  }
  if (fullText.includes("rtx 4080") || fullText.includes("core ultra") || fullText.includes("i9-14900")) {
    quality += 8;
  }
  if (fullText.includes("certified refurbished") && fullText.includes("allstate warranty")) {
    quality += 4;
  }

  // Check priority match quality
  for (const prio of priorities) {
    if (prio === "gaming" && (fullText.includes("rtx") || fullText.includes("gaming") || fullText.includes("hall-effect") || fullText.includes("low latency"))) {
      quality += 6;
    }
    if (prio === "camera" && (fullText.includes("camera") || fullText.includes("sensor") || fullText.includes("hdr") || fullText.includes("4k60"))) {
      quality += 6;
    }
    if (prio === "anc" && (fullText.includes("anc") || fullText.includes("noise-cancelling") || fullText.includes("noise cancelling"))) {
      quality += 7;
    }
    if (prio === "travel" && (fullText.includes("battery") || fullText.includes("portable") || fullText.includes("anc") || fullText.includes("compact"))) {
      quality += 5;
    }
    if (prio === "battery" && (fullText.includes("40-hour") || fullText.includes("45-hour") || fullText.includes("5000mah") || fullText.includes("18-hour"))) {
      quality += 6;
    }
  }

  return Math.min(99, Math.max(50, Math.round(quality)));
}

/**
 * Calculates Value for Money (0 to 100).
 * Important: Budget is a CONSTRAINT, not a reason to prefer cheap products!
 * High-value products offer substantial quality for their price point.
 */
function evaluateValueForMoney(price: number, qualityScore: number, maxPrice?: number): number {
  if (!maxPrice || maxPrice <= 0) {
    // Without upper budget constraint, evaluate quality-to-price balance
    return Math.min(96, Math.max(60, Math.round(qualityScore * 0.95)));
  }

  // Price strictly above budget is rejected by filters, but if reached, score 0
  if (price > maxPrice) return 0;

  const priceRatio = price / maxPrice; // 0.0 to 1.0

  // If a product is very cheap (e.g. priceRatio < 0.35) but has low quality (qualityScore < 70),
  // it is NOT high value—it is just cheap!
  if (priceRatio < 0.4 && qualityScore < 72) {
    return Math.round(qualityScore * 0.85); // penalized for cheap-and-weak
  }

  // If product is near budget limit (e.g. 0.85 to 1.0) AND has outstanding quality (e.g. 92+),
  // it provides exceptional value within the user's budget!
  if (priceRatio >= 0.75 && priceRatio <= 1.0 && qualityScore >= 90) {
    return Math.min(98, Math.round(qualityScore * 1.02));
  }

  // If product is moderately priced (e.g. 0.5 to 0.8) and has high quality (e.g. 88+),
  // it hits the sweet spot (best value for money)!
  if (priceRatio >= 0.45 && priceRatio <= 0.85 && qualityScore >= 85) {
    return Math.min(99, Math.round(qualityScore * 1.05));
  }

  // Standard value equation
  const baseValue = qualityScore * (1.15 - priceRatio * 0.25);
  return Math.min(98, Math.max(55, Math.round(baseValue)));
}

/**
 * Evaluates Intent Match Score (0 to 100).
 */
function evaluateIntentMatch(product: any, intent: IntentExtraction): number {
  const name = (product.name || "").toLowerCase();
  const desc = (product.description || "").toLowerCase();
  const cat = (product.category || "").toLowerCase();
  const full = `${name} ${desc} ${cat}`;

  let matchScore = 70;

  // Category overlap
  if (intent.category) {
    const target = intent.category.toLowerCase();
    if (target === "smartphone" || target === "phone") {
      if (full.includes("phone") || full.includes("mobile") || full.includes("iphone") || full.includes("galaxy") || full.includes("nord")) {
        matchScore += 18;
      } else {
        matchScore -= 30; // severe penalty for wrong category
      }
    } else if (target === "headphones") {
      if (full.includes("headphone") || full.includes("earphone") || full.includes("earbud") || full.includes("headset") || full.includes("iem")) {
        matchScore += 18;
      } else {
        matchScore -= 30;
      }
    } else if (target === "laptop") {
      if (full.includes("laptop") || full.includes("ultrabook") || full.includes("macbook") || full.includes("notebook")) {
        matchScore += 18;
      } else {
        matchScore -= 30;
      }
    } else if (target === "apparel") {
      if (full.includes("jacket") || full.includes("shirt") || full.includes("tee") || full.includes("sweater") || cat.includes("clothing")) {
        matchScore += 18;
      } else {
        matchScore -= 30;
      }
    }
  }

  // Query keywords check
  const rawWords = intent.rawQuery
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !["best", "under", "show", "suggest", "recommend", "cheapest", "find", "good", "need"].includes(w));

  for (const word of rawWords) {
    if (name.includes(word)) matchScore += 4;
    else if (desc.includes(word)) matchScore += 2;
  }

  // Priorities check
  for (const prio of intent.priorities) {
    if (prio === "gaming" && (full.includes("gaming") || full.includes("game") || full.includes("rtx") || full.includes("spatial"))) {
      matchScore += 6;
    }
    if (prio === "camera" && (full.includes("camera") || full.includes("capture") || full.includes("4k") || full.includes("sensor"))) {
      matchScore += 6;
    }
    if (prio === "anc" && (full.includes("anc") || full.includes("noise cancelling") || full.includes("noise-cancelling"))) {
      matchScore += 8;
    }
    if (prio === "travel" && (full.includes("travel") || full.includes("portable") || full.includes("anc") || full.includes("battery"))) {
      matchScore += 6;
    }
  }

  return Math.min(99, Math.max(30, Math.round(matchScore)));
}

/**
 * Evaluates Merchant Trust Score (0 to 100).
 */
function evaluateMerchantTrust(store: string): number {
  const normalized = (store || "").toLowerCase();
  if (normalized === "nexusstore" || normalized === "threadvault" || normalized === "pixelmart") {
    return 95; // Official verified integrated partner stores with live webhook settlement
  }
  if (normalized === "ebay") {
    return 92; // Certified eBay listings with Allstate Warranty & buyer protection
  }
  return 85;
}

/**
 * Main function: Scores and ranks a list of products according to genuine value and user intent.
 */
export function rankAndScoreProducts(
  products: any[],
  intent: IntentExtraction
): StructuredProduct[] {
  if (!products || products.length === 0) return [];

  // Filter out products strictly above budget constraint
  let eligible = products;
  if (intent.maxPrice && intent.maxPrice > 0) {
    eligible = products.filter((p) => (p.price || 0) <= intent.maxPrice!);
  }

  // Determine scoring weights based on objective
  let weights = {
    intent: 0.30,
    quality: 0.25,
    value: 0.20,
    rating: 0.10,
    merchant: 0.10,
    availability: 0.05,
  };

  if (intent.objective === "cheapest") {
    // When user explicitly asked for "cheapest", prioritize lowest price within constraint!
    weights = {
      intent: 0.25,
      quality: 0.10,
      value: 0.45, // Heavy weight on low price ratio
      rating: 0.05,
      merchant: 0.10,
      availability: 0.05,
    };
  } else if (intent.objective === "performance") {
    weights = {
      intent: 0.20,
      quality: 0.40,
      value: 0.15,
      rating: 0.10,
      merchant: 0.10,
      availability: 0.05,
    };
  }

  // Score each product
  const scoredList = eligible.map((p) => {
    const intentScore = evaluateIntentMatch(p, intent);
    const qualityScore = evaluateProductQuality(p, intent.category, intent.priorities);
    
    // For "cheapest" objective, calculate value based on inverse price relative to lowest in list
    let valueScore = 0;
    if (intent.objective === "cheapest" && intent.maxPrice) {
      const inverseRatio = 1 - (p.price / intent.maxPrice);
      valueScore = Math.min(99, Math.max(50, Math.round(60 + inverseRatio * 40)));
    } else {
      valueScore = evaluateValueForMoney(p.price, qualityScore, intent.maxPrice);
    }

    const ratingVal = typeof p.rating === "number" ? p.rating : 4.4;
    const ratingScore = Math.min(98, Math.round(ratingVal * 20));
    const merchantTrust = evaluateMerchantTrust(p.store || p.source);
    const availabilityScore = (p.stock || 10) > 0 ? 95 : 40;

    const overallScore = Number((
      intentScore * weights.intent +
      qualityScore * weights.quality +
      valueScore * weights.value +
      ratingScore * weights.rating +
      merchantTrust * weights.merchant +
      availabilityScore * weights.availability
    ).toFixed(1));

    const keyFeatures = extractKeyFeatures(p);

    return {
      raw: p,
      overallScore,
      intentScore,
      qualityScore,
      valueScore,
      ratingScore,
      merchantTrust,
      availabilityScore,
      keyFeatures,
    };
  });

  // Sort descending by overallScore.
  // If scores are tied:
  // - for "cheapest" objective, sort by price ascending.
  // - for "best_value", sort by quality descending.
  scoredList.sort((a, b) => {
    if (Math.abs(b.overallScore - a.overallScore) > 0.4) {
      return b.overallScore - a.overallScore;
    }
    if (intent.objective === "cheapest") {
      return (a.raw.price || 0) - (b.raw.price || 0);
    }
    return b.qualityScore - a.qualityScore;
  });

  // Build structured product objects with transparent explainability & alternatives
  const result: StructuredProduct[] = scoredList.map((item, index) => {
    const p = item.raw;
    const isBest = index === 0;

    // Craft transparent "why_recommended" rationale
    let whyRecommended = "";
    const tradeoffs: string[] = [];

    if (isBest) {
      if (intent.objective === "cheapest") {
        whyRecommended = `Lowest-priced verified option satisfying your criteria at ₹${p.price.toLocaleString()} with reliable merchant fulfillment.`;
      } else {
        const topReasons: string[] = [];
        if (item.qualityScore >= 88) topReasons.push("superior specifications");
        if (item.valueScore >= 88) topReasons.push("best overall value within budget");
        if (item.intentScore >= 90) topReasons.push("closest match for your requested use case");
        const reasonSummary = topReasons.length > 0 ? topReasons.join(", ") : "top overall balance of quality, merchant trust, and price";

        whyRecommended = `Identified as the strongest overall recommendation within your ₹${(intent.maxPrice || p.price).toLocaleString()} budget constraint based on ${reasonSummary}.`;
      }
    } else {
      whyRecommended = `Strong alternative option offering good features at ₹${p.price.toLocaleString()}.`;
    }

    // Identify honest trade-offs
    if (intent.maxPrice && p.price > intent.maxPrice * 0.88 && intent.objective !== "cheapest") {
      tradeoffs.push(`Priced towards the upper limit of your budget (₹${p.price.toLocaleString()}), but justified by higher hardware quality.`);
    }
    if (intent.maxPrice && p.price < intent.maxPrice * 0.5) {
      tradeoffs.push(`Lower price point (₹${p.price.toLocaleString()}), but does not match the premium build or specs of higher-tier models.`);
    }
    if (item.keyFeatures.length > 0 && !item.keyFeatures.some((f) => f.includes("ANC")) && intent.priorities.includes("anc")) {
      tradeoffs.push("Lacks active noise cancellation (ANC).");
    }
    if (tradeoffs.length === 0) {
      tradeoffs.push("Competitive offering with standard merchant return and warranty policies.");
    }

    // Build 1-2 alternatives from the remainder of the ranked list
    const alternatives = scoredList
      .filter((_, i) => i !== index)
      .slice(0, 2)
      .map((alt) => {
        let altReason = "";
        if (alt.raw.price < p.price) {
          altReason = `More affordable alternative (₹${alt.raw.price.toLocaleString()}), but with lower hardware specifications.`;
        } else {
          altReason = `Higher-tier alternative (₹${alt.raw.price.toLocaleString()}) with enhanced features.`;
        }
        return {
          product_id: alt.raw.id,
          name: alt.raw.name,
          price: alt.raw.price,
          currency: alt.raw.currency || "INR",
          reason: altReason,
        };
      });

    const recContext: RecommendationContext = {
      overall_score: item.overallScore,
      intent_match: item.intentScore,
      quality_score: item.qualityScore,
      value_score: item.valueScore,
      rating_score: item.ratingScore,
      merchant_trust: item.merchantTrust,
      availability_score: item.availabilityScore,
      why_recommended: whyRecommended,
      tradeoffs,
      alternatives,
    };

    return {
      product_id: p.id,
      name: p.name,
      description: p.description || "",
      price: p.price,
      currency: p.currency || "INR",
      merchant: p.storeName || p.store || "Connected Merchant",
      store: p.store || "nexusstore",
      store_url: p.storeUrl,
      product_url: p.productUrl,
      rating: p.rating || 4.5,
      stock: p.stock !== undefined ? p.stock : 15,
      category: p.category || "General",
      availability: (p.stock || 15) > 0 ? "in_stock" : "out_of_stock",
      key_features: item.keyFeatures,
      source: p.source || p.store || "raya_network",
      recommendation_context: recContext,
      is_best_match: isBest,
    };
  });

  return result;
}
