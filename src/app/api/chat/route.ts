import { NextRequest, NextResponse } from "next/server";
import {
  RAYA_SYSTEM_INSTRUCTION,
  GROQ_TOOLS,
  executeBridgeTool,
  ToolExecutionResult,
} from "@/lib/gemini";

// Ensure Next.js treats this endpoint as dynamic and reads process.env on every request
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getGeminiCandidateModels(geminiKey: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(geminiKey)}`
    );
    if (res.ok) {
      const data = await res.json();
      const models = data.models || [];
      const supported: string[] = models
        .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m: any) => m.name.replace("models/", ""));

      console.log("[Raya Gemini Supported Models]:", supported);

      const preferred = [
        "gemini-3.6-flash",
        "gemini-3.6-pro",
        "gemini-2.0-flash",
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-8b",
        "gemini-1.5-pro",
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
      if (sorted.length > 0) return sorted;
    }
  } catch (e) {
    console.warn("[Raya Gemini] ListModels error:", e);
  }
  return ["gemini-3.6-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
}

// Native function declarations for Google Gemini
const GEMINI_FUNCTION_DECLARATIONS = GROQ_TOOLS.map((t) => t.function);

async function callNativeGemini(
  contents: any[],
  geminiKey: string
): Promise<{ text?: string; functionCalls?: Array<{ name: string; args: any }>; rawContent?: any }> {
  let lastError = "Unknown Gemini error";

  const candidateModels = await getGeminiCandidateModels(geminiKey);

  for (const modelToUse of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${encodeURIComponent(
        geminiKey
      )}`;

      const payload = {
        system_instruction: {
          parts: [{ text: RAYA_SYSTEM_INSTRUCTION }],
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
        const data = await res.json();
        const candidate = data.candidates?.[0];
        const content = candidate?.content;

        if (!content || !content.parts) {
          return { text: "I processed your request, but received an empty response from Gemini." };
        }

        const functionCalls: Array<{ name: string; args: any }> = [];
        let accumulatedText = "";

        for (const part of content.parts) {
          if (part.functionCall) {
            functionCalls.push({
              name: part.functionCall.name,
              args: part.functionCall.args || {},
            });
          }
          if (part.text) {
            accumulatedText += part.text;
          }
        }

        return {
          text: accumulatedText || undefined,
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
    const { message, history = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

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
      return NextResponse.json({
        text: "👋 Welcome to Raya by Razorpay! Please configure your `gemini_api_key` in Vercel environment variables.",
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

    // Add current user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const toolExecutions: ToolExecutionResult[] = [];
    let extractedProducts: any[] | undefined = undefined;
    let extractedCart: any | undefined = undefined;
    let extractedReceipt: any | undefined = undefined;

    let iterations = 0;
    const MAX_ITERATIONS = 5;
    let finalText = "";

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const geminiResult = await callNativeGemini(contents, geminiKey);

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

          // Extract specialized UI data
          if (toolName === "listProducts" && Array.isArray(execResult.data)) {
            extractedProducts = execResult.data;
          } else if (toolName === "listProducts" && execResult.data?.products) {
            extractedProducts = execResult.data.products;
          }

          if (toolName === "viewCart" || toolName === "addToCart") {
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

    return NextResponse.json({
      text: finalText || "I have processed your request across the connected stores.",
      toolExecutions,
      products: extractedProducts,
      cart: extractedCart,
      receipt: extractedReceipt,
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
