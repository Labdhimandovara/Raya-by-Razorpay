import { NextRequest, NextResponse } from "next/server";
import {
  RAYA_SYSTEM_INSTRUCTION,
  GEMINI_TOOLS,
  executeBridgeTool,
  ToolExecutionResult,
} from "@/lib/gemini";

const BRIDGE_URL = process.env.NEXUS_STORE_BRIDGE_URL || "https://bazaar-ai-lm2z.onrender.com/bazaar";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const CUSTOM_MODEL = process.env.GEMINI_MODEL;

// Resilient list of Gemini model endpoints attempted in order
const CANDIDATE_ENDPOINTS = [
  ...(CUSTOM_MODEL ? [{ version: "v1beta", model: CUSTOM_MODEL }, { version: "v1", model: CUSTOM_MODEL }] : []),
  { version: "v1beta", model: "gemini-1.5-flash-latest" },
  { version: "v1beta", model: "gemini-2.0-flash" },
  { version: "v1",     model: "gemini-1.5-flash" },
  { version: "v1beta", model: "gemini-1.5-flash-001" },
  { version: "v1beta", model: "gemini-1.5-flash-002" },
  { version: "v1beta", model: "gemini-1.5-pro-latest" },
  { version: "v1",     model: "gemini-1.5-pro" },
];

let workingEndpointConfig: { version: string; model: string } | null = null;

async function callGeminiWithFallback(payload: any, apiKey: string): Promise<any> {
  // If we already resolved a working model for this server instance, try it first
  if (workingEndpointConfig) {
    const url = `https://generativelanguage.googleapis.com/${workingEndpointConfig.version}/models/${workingEndpointConfig.model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      return await res.json();
    }
    // If it failed, invalidate cache and proceed to fallback loop
    workingEndpointConfig = null;
  }

  let lastError: any = null;

  for (const candidate of CANDIDATE_ENDPOINTS) {
    try {
      const url = `https://generativelanguage.googleapis.com/${candidate.version}/models/${candidate.model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        workingEndpointConfig = candidate; // Cache successful model!
        return await res.json();
      }

      const errData = await res.json().catch(() => null);
      lastError = errData?.error?.message || `HTTP ${res.status}`;
    } catch (e: any) {
      lastError = e.message;
    }
  }

  throw new Error(`Gemini API Error: ${lastError || "Could not connect to any available Gemini model endpoint."}`);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    if (!GEMINI_API_KEY) {
      // Graceful fallback if user has not yet set their Gemini key
      return NextResponse.json({
        text: "👋 Welcome to Raya by Razorpay! Please configure your `GEMINI_API_KEY` in your environment variables or Vercel dashboard to enable live agentic tool calling.",
        toolExecutions: [],
        history: [...history, { role: "user", parts: [{ text: message }] }],
      });
    }

    // Build the Gemini conversation contents
    const contents: any[] = [];

    // Map history
    for (const h of history) {
      if (h.role && h.parts) {
        contents.push(h);
      } else if (h.role && h.content) {
        contents.push({
          role: h.role === "assistant" ? "model" : "user",
          parts: [{ text: h.content }],
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

      const payload = {
        contents,
        systemInstruction: {
          parts: [{ text: RAYA_SYSTEM_INSTRUCTION }],
        },
        tools: GEMINI_TOOLS,
      };

      const data = await callGeminiWithFallback(payload, GEMINI_API_KEY);
      const candidate = data.candidates?.[0];
      const modelParts = candidate?.content?.parts || [];

      // Add model response to contents history
      contents.push({
        role: "model",
        parts: modelParts,
      });

      // Check if model called any function
      const functionCallPart = modelParts.find((p: any) => p.functionCall);

      if (functionCallPart && functionCallPart.functionCall) {
        const { name, args } = functionCallPart.functionCall;
        console.log(`[RAYA TOOL EXECUTION] Tool: ${name}`, args);

        // Execute against NexusStore Bridge
        const execResult = await executeBridgeTool(name, args, BRIDGE_URL);

        toolExecutions.push({
          tool: name,
          args,
          status: execResult.status,
          result: execResult.data,
        });

        // Extract specialized UI data for Generative UI
        if (name === "listProducts" && Array.isArray(execResult.data)) {
          extractedProducts = execResult.data;
        } else if (name === "listProducts" && execResult.data?.products) {
          extractedProducts = execResult.data.products;
        }

        if (name === "viewCart" || name === "addToCart") {
          extractedCart = execResult.data;
        }

        if (name === "checkoutOrder" && execResult.status === "SUCCESS") {
          extractedReceipt = {
            orderId: execResult.data?.id || execResult.data?.orderId || `ORD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            details: execResult.data,
            address: args,
            paymentMethod: args.paymentMethod || "card",
            timestamp: new Date().toISOString(),
          };
        }

        // Feed function response back to Gemini
        contents.push({
          role: "function",
          parts: [
            {
              functionResponse: {
                name,
                response: {
                  result: execResult.data,
                },
              },
            },
          ],
        });
      } else {
        // No more function calls, capture final text
        const textParts = modelParts.filter((p: any) => p.text).map((p: any) => p.text);
        finalText = textParts.join("\n").trim();
        break;
      }
    }

    return NextResponse.json({
      text: finalText || "I have processed your request.",
      toolExecutions,
      products: extractedProducts,
      cart: extractedCart,
      receipt: extractedReceipt,
      history: contents,
    });
  } catch (error: any) {
    console.error("[RAYA AGENT ERROR]", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to process chat message",
      },
      { status: 500 }
    );
  }
}
