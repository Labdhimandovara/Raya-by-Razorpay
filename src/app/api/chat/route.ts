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

const GEMINI_MODELS = [
  "gemini-1.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-pro",
];

async function callGemini(messages: any[], geminiKey: string): Promise<any> {
  let lastError = "Unknown Gemini error";

  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${geminiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          tools: GROQ_TOOLS,
          tool_choice: "auto",
        }),
      });

      if (res.ok) {
        return await res.json();
      }

      const errData = await res.json().catch(() => null);
      lastError = errData?.error?.message || `HTTP ${res.status}`;
      console.warn(`[Raya Gemini] Model ${model} returned ${res.status}:`, lastError);
    } catch (e: any) {
      lastError = e.message;
      console.warn(`[Raya Gemini] Model ${model} exception:`, e.message);
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
        text: "👋 Welcome to Raya by Razorpay! Please configure your `GEMINI_API_KEY` in Vercel environment variables.",
        toolExecutions: [],
        history: [],
      });
    }

    // Build OpenAI-compatible messages array for Gemini
    const messages: any[] = [{ role: "system", content: RAYA_SYSTEM_INSTRUCTION }];

    // Map existing history
    for (const h of history) {
      if (h.role === "user" || h.role === "assistant") {
        messages.push({ role: h.role, content: h.content || h.text || "" });
      }
    }

    // Add current user message
    messages.push({ role: "user", content: message });

    const toolExecutions: ToolExecutionResult[] = [];
    let extractedProducts: any[] | undefined = undefined;
    let extractedCart: any | undefined = undefined;
    let extractedReceipt: any | undefined = undefined;

    let iterations = 0;
    const MAX_ITERATIONS = 5;
    let finalText = "";

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const data = await callGemini(messages, geminiKey);
      const choice = data.choices?.[0];
      const assistantMessage = choice?.message;

      if (!assistantMessage) {
        finalText = "I couldn't process your request with Gemini. Please try again.";
        break;
      }

      // Add assistant message to conversation
      messages.push(assistantMessage);

      // Check if model called any tools
      const toolCalls = assistantMessage.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        // Execute all tool calls
        for (const toolCall of toolCalls) {
          const toolName = toolCall.function.name;
          let args: any = {};

          try {
            args = JSON.parse(toolCall.function.arguments || "{}");
          } catch {
            args = {};
          }

          console.log(`[RAYA GEMINI TOOL CALL] Tool: ${toolName}`, args);

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

          // Feed tool result back into conversation
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(execResult.data),
          });
        }
      } else {
        // No tool calls — this is the final text response
        finalText = assistantMessage.content || "I have processed your request.";
        break;
      }
    }

    // Build clean history for the client
    const clientHistory = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role,
        content: typeof m.content === "string" ? m.content : "",
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
