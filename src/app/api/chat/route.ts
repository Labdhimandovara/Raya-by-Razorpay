import { NextRequest, NextResponse } from "next/server";
import {
  RAYA_SYSTEM_INSTRUCTION,
  getRayaSystemInstruction,
  GROQ_TOOLS,
  executeBridgeTool,
  ToolExecutionResult,
} from "@/lib/gemini";
import { getActiveStrategyForCategory, addDecisionEvent } from "@/lib/merchant-store";

// Ensure Next.js treats this endpoint as dynamic and reads process.env on every request
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

let cachedCandidateModels: string[] | null = null;
let cachedModelsTimestamp = 0;

async function getGeminiCandidateModels(geminiKey: string): Promise<string[]> {
  if (cachedCandidateModels && Date.now() - cachedModelsTimestamp < 3600000) {
    return cachedCandidateModels;
  }

  // Fast default list prioritizing stable gemini-1.5-flash
  const fastDefaults = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.0-flash"];

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(geminiKey)}`,
      { signal: AbortSignal.timeout(2000) }
    );
    if (res.ok) {
      const data = await res.json();
      const models = data.models || [];
      const supported: string[] = models
        .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m: any) => m.name.replace("models/", ""));

      const preferred = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-2.0-flash",
        "gemini-1.5-flash-8b",
        "gemini-2.0-flash-exp",
      ];

      const sorted: string[] = [];
      for (const p of preferred) {
        if (supported.includes(p)) sorted.push(p);
      }
      for (const s of supported) {
        if (!sorted.includes(s) && !s.includes("embed") && !s.includes("aqa")) {
          sorted.push(s);
        }
      }
      if (sorted.length > 0) {
        cachedCandidateModels = sorted;
        cachedModelsTimestamp = Date.now();
        return sorted;
      }
    }
  } catch (e) {
    console.warn("[Raya Gemini] ListModels error:", e);
  }
  cachedCandidateModels = fastDefaults;
  cachedModelsTimestamp = Date.now();
  return fastDefaults;
}

// Native function declarations for Google Gemini
const GEMINI_FUNCTION_DECLARATIONS = GROQ_TOOLS.map((t) => t.function);

let workingModel: string | null = null;

function sanitizeHumanReadableText(text: string): string {
  if (!text) return "";
  let clean = text.replace(/<thought>[\s\S]*?<\/thought>/gi, "").trim();

  // Strip raw tool names / invocations e.g. listProducts() viewCart()
  clean = clean.replace(/\b(?:listProducts|viewCart|listConnectedStores|checkoutOrder|addToCart|searchEbayRefurbished)\s*\([^)]*\)/gi, "").trim();
  clean = clean.replace(/^(?:listProducts|viewCart|listConnectedStores)\(\)+/g, "").trim();

  // Strip internal third-person monologue / scratchpads
  const markerIndex = clean.search(/(?:I have |I've found |Here are |To complete |Which store |Would you like |I found )/i);
  if (markerIndex > 0 && /^(?:The user|Looking at|Plan:|Wait,|Actually)/i.test(clean)) {
    clean = clean.substring(markerIndex).trim();
  }

  // Remove trailing prompt meta-thinking if any
  clean = clean.replace(/\n(?:Wait,|Actually,|Plan:)[\s\S]*$/i, "").trim();

  return clean.replace(/\*\*/g, "").trim();
}

async function callNativeGemini(
  contents: any[],
  geminiKey: string,
  locale: string = "en"
): Promise<{ text?: string; functionCalls?: Array<{ name: string; args: any }>; rawContent?: any }> {
  let lastError = "Unknown Gemini error";

  const rawCandidates = await getGeminiCandidateModels(geminiKey);
  const candidateModels = workingModel
    ? [workingModel, ...rawCandidates.filter((m) => m !== workingModel)]
    : rawCandidates;

  for (const modelToUse of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${encodeURIComponent(
        geminiKey
      )}`;

      const payload = {
        system_instruction: {
          parts: [{ text: getRayaSystemInstruction(locale) }],
        },
        contents,
        tools: [
          {
            function_declarations: GEMINI_FUNCTION_DECLARATIONS,
          },
        ],
      };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        workingModel = modelToUse;
        const data = await res.json();
        const candidate = data.candidates?.[0];
        const content = candidate?.content;

        if (!content || !content.parts) {
          return { text: "I processed your request, but received an empty response from Gemini." };
        }

        const functionCalls: Array<{ name: string; args: any }> = [];
        let accumulatedText = "";

        for (const part of content.parts) {
          if (part.thought) continue;
          if (part.functionCall) {
            functionCalls.push({
              name: part.functionCall.name,
              args: part.functionCall.args || {},
            });
          }
          if (part.text && !part.thought) {
            accumulatedText += part.text;
          }
        }

        return {
          text: sanitizeHumanReadableText(accumulatedText) || undefined,
          functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
          rawContent: content,
        };
      }

      const errData = await res.json().catch(() => null);
      lastError = `[Model ${modelToUse}]: ${errData?.error?.message || `HTTP ${res.status}`}`;
      console.warn(`[Raya Gemini Model Attempt Failed]`, lastError);
    } catch (e: any) {
      lastError = e.message;
    }
  }

  throw new Error(`Google Gemini Error: ${lastError}`);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], currentCart = [], locale = "en" } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const isCheckoutOrCartQuery = /\b(checkout|check out|pay|payment|proceed to (?:pay|checkout)|buy now|place order|my cart|my basket|view cart|do for me|order for me|buy for me|complete (?:order|purchase|checkout))\b/i.test(message);

    // Read Gemini API key dynamically (supports both uppercase and lowercase)
    const geminiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.gemini_api_key ||
      process.env.Gemini_Api_Key ||
      process.env.GOOGLE_API_KEY ||
      process.env.google_api_key ||
      process.env.GOOGLE_GENAI_API_KEY ||
      ""
    ).trim();

    const bridgeUrl = (
      process.env.BAZAAR_BRIDGE_URL ||
      process.env.NEXUS_STORE_BRIDGE_URL ||
      "https://bazaar-ai-backend.onrender.com/api/bridge"
    ).trim();

    if (!geminiKey) {
      const welcomeMessages: Record<string, string> = {
        en: "👋 Welcome to Raya by Razorpay! Please configure your `gemini_api_key` in Vercel environment variables.",
        hi: "👋 Raya by Razorpay में आपका स्वागत है! कृपया अपने Vercel वातावरण में `gemini_api_key` कॉन्फ़िगर करें।",
        mr: "👋 Raya by Razorpay मध्ये आपले स्वागत आहे! कृपया आपल्या Vercel वातावरणात `gemini_api_key` कॉन्फिगर करा.",
        ta: "👋 Raya by Razorpay-க்கு வரவேற்கிறோம்! உங்கள் Vercel சூழலில் `gemini_api_key`-ஐ கட்டமைக்கவும்.",
        bn: "👋 Raya by Razorpay-এ আপনাকে স্বাগতম! অনুগ্রহ করে আপনার Vercel পরিবেশে `gemini_api_key` কনফিগার করুন।",
      };
      return NextResponse.json({
        text: welcomeMessages[locale] || welcomeMessages.en,
        toolExecutions: [],
        history: [],
      });
    }

    // Build Gemini native contents history
    const contents: any[] = [];

    // Map existing history into Gemini roles ("user" | "model")
    // Keep only the most recent 4 turns to keep context sharp and prevent old topics (e.g. previous searches) from polluting new queries
    const recentHistory = history.slice(-4);
    for (const h of recentHistory) {
      const role = h.role === "assistant" ? "model" : "user";
      let textContent = (h.content || h.text || "").trim();
      // If previous model message was a huge product dump, summarize/truncate it to keep focus on new prompt
      if (role === "model" && textContent.length > 300) {
        textContent = textContent.substring(0, 200) + "... [Previous recommendations displayed in UI]";
      }
      if (textContent) {
        contents.push({
          role,
          parts: [{ text: textContent }],
        });
      }
    }

    // Add current user message with basket context if checking out
    if (isCheckoutOrCartQuery && Array.isArray(currentCart) && currentCart.length > 0) {
      const itemsDesc = currentCart
        .map((i: any) => `${i.quantity || 1}x ${i.name || i.product?.name || i.productId} (₹${(i.price || i.product?.price || 0) * (i.quantity || 1)}) from ${i.store || "connected store"}`)
        .join(", ");
      contents.push({
        role: "user",
        parts: [
          {
            text: `[SYSTEM NOTE: The shopper currently has ${currentCart.length} item(s) in their active basket: ${itemsDesc}. DO NOT call listProducts or re-search for products. Let the shopper know their active basket is ready with these exact items and they can click the 'Pay with Razorpay (Test Mode)' button directly in their basket on the right to complete payment.]\n${message}`,
          },
        ],
      });
    } else {
      contents.push({
        role: "user",
        parts: [{ text: message }],
      });
    }

    const toolExecutions: ToolExecutionResult[] = [];
    let extractedProducts: any[] | undefined = undefined;
    let extractedCart: any | undefined = undefined;
    let extractedReceipt: any | undefined = undefined;

    let iterations = 0;
    const MAX_ITERATIONS = 5;
    let finalText = "";

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const geminiResult = await callNativeGemini(contents, geminiKey, locale);

      // If Gemini called tools
      if (geminiResult.functionCalls && geminiResult.functionCalls.length > 0) {
        // Append model's tool call turn to contents history
        if (geminiResult.rawContent) {
          contents.push(geminiResult.rawContent);
        }

        // Execute each tool call
        for (const call of geminiResult.functionCalls) {
          const toolName = call.name;
          const args = call.args || {};

          // Safety net: Auto-detect maxPrice from user message if LLM missed it
          if (toolName === "listProducts" && args.maxPrice === undefined) {
            const budgetMatch = (message || "").match(/(?:under|below|less than|budget)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?|\d+k)/i);
            if (budgetMatch) {
              const rawVal = budgetMatch[1].toLowerCase().replace(/,/g, "");
              const parsed = rawVal.endsWith("k") ? parseFloat(rawVal) * 1000 : parseFloat(rawVal);
              if (!isNaN(parsed) && parsed > 0) {
                args.maxPrice = parsed;
              }
            }
          }

          console.log(`[RAYA GEMINI NATIVE TOOL] Executing ${toolName}:`, args);

          const execResult = await executeBridgeTool(toolName, args, bridgeUrl);

          toolExecutions.push({
            tool: toolName,
            args,
            status: execResult.status,
            result: execResult.data,
          });

          // Extract specialized UI data (never attach product cards if shopper is checking out)
          if (toolName === "listProducts" && !isCheckoutOrCartQuery) {
            let prods: any[] = [];
            if (Array.isArray(execResult.data)) {
              prods = execResult.data;
            } else if (execResult.data?.products) {
              prods = execResult.data.products;
            }

            // Real Growth Strategy Injection: Check if active merchant strategy applies to this search
            const activeStrategy = getActiveStrategyForCategory(message);
            if (activeStrategy && prods.length > 0) {
              const alreadyPresent = prods.some((p: any) => p.id === activeStrategy.crossSellProduct.id);
              if (!alreadyPresent) {
                const companion = {
                  ...activeStrategy.crossSellProduct,
                  badge: "⚡ Bazaar Strategy Pick",
                  strategyId: activeStrategy.strategyId,
                  isCrossSell: true,
                  whyReason: `Recommended by active merchant strategy '${activeStrategy.strategyId}' to complement this category.`,
                  score: 95,
                };
                prods.push(companion);

                // Emitted to the server-side audit trail Decision Ledger
                addDecisionEvent({
                  id: `evt_rec_${Date.now()}`,
                  step: "RECOMMENDED",
                  title: `Bazaar Growth Strategy '${activeStrategy.strategyId}' Served`,
                  timestamp: "Just now",
                  status: "RECOMMENDED",
                  decisionType: "MERCHANT",
                  strategyId: activeStrategy.strategyId,
                  summary: `Injected companion item "${activeStrategy.crossSellProduct.name}" into discovery stream based on active merchant rule.`,
                  details: {
                    strategyId: activeStrategy.strategyId,
                    query: message,
                    companionItem: activeStrategy.crossSellProduct.name,
                    store: activeStrategy.crossSellProduct.storeName,
                    ruleTitle: activeStrategy.title,
                  },
                });
              }
            }

            extractedProducts = prods;
          }

          if (toolName === "viewCart") {
            if (Array.isArray(currentCart) && currentCart.length > 0) {
              execResult.data = {
                items: currentCart,
                total: currentCart.reduce((s: number, i: any) => s + (i.price || i.product?.price || 0) * (i.quantity || 1), 0),
              };
            }
            extractedCart = execResult.data;
          } else if (toolName === "addToCart") {
            extractedCart = execResult.data;
          }

          if (toolName === "checkoutOrder" && execResult.status === "SUCCESS") {
            extractedReceipt = {
              orderId:
                execResult.data?.id ||
                execResult.data?.orderId ||
                `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
              details: execResult.data,
              address: args,
              store: args.store || "nexusstore",
              paymentMethod: args.paymentMethod || "card",
              timestamp: new Date().toISOString(),
            };
          }

          // Feed function result back to Gemini in its native role: "function" format
          contents.push({
            role: "function",
            parts: [
              {
                functionResponse: {
                  name: toolName,
                  response: {
                    name: toolName,
                    content: execResult.data,
                  },
                },
              },
            ],
          });
        }
      } else {
        // No function calls — final answer reached
        finalText = geminiResult.text || "I have processed your request.";
        break;
      }
    }

    // Build clean history for the frontend client
    const clientHistory = contents
      .filter((c) => c.role === "user" || c.role === "model")
      .map((c) => ({
        role: c.role === "model" ? "assistant" : "user",
        content: c.parts?.map((p: any) => p.text || "").join("") || "",
      }));

    if (isCheckoutOrCartQuery) {
      extractedProducts = undefined;
    }

    const checkoutBasket = isCheckoutOrCartQuery && Array.isArray(currentCart) && currentCart.length > 0 ? currentCart : undefined;

    return NextResponse.json({
      text: sanitizeHumanReadableText(finalText) || "I have processed your request across the connected stores.",
      toolExecutions,
      products: extractedProducts,
      cart: extractedCart,
      receipt: extractedReceipt,
      checkoutBasket,
      history: clientHistory,
    });
  } catch (error: any) {
    console.error("[RAYA GEMINI ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to process chat message with Gemini" },
      { status: 500 }
    );
  }
}
