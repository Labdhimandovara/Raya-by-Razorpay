import { NextRequest, NextResponse } from "next/server";
import {
  RAYA_SYSTEM_INSTRUCTION,
  GROQ_TOOLS,
  executeBridgeTool,
  ToolExecutionResult,
} from "@/lib/gemini";

const BRIDGE_URL =
  process.env.BAZAAR_BRIDGE_URL ||
  process.env.NEXUS_STORE_BRIDGE_URL ||
  "https://bazaar-ai-backend.onrender.com/api/bridge";

const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

// Current active Groq production models (updated Sept 2026)
const GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
  "qwen/qwen3.6-27b",
  "llama-3.3-70b-versatile",
];

let workingModel: string | null = null;

async function callAI(messages: any[]): Promise<any> {
  // 1. Try Groq if GROQ_API_KEY is available
  if (GROQ_API_KEY) {
    const modelsToTry = workingModel
      ? [workingModel, ...GROQ_MODELS.filter((m) => m !== workingModel)]
      : GROQ_MODELS;

    let lastError = "Unknown Groq error";
    for (const model of modelsToTry) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages,
            tools: GROQ_TOOLS,
            tool_choice: "auto",
            max_tokens: 4096,
          }),
        });

        if (res.ok) {
          workingModel = model;
          return await res.json();
        }

        const errData = await res.json().catch(() => null);
        lastError = errData?.error?.message || `HTTP ${res.status}`;
      } catch (e: any) {
        lastError = e.message;
      }
    }
    console.warn(`[Raya] Groq attempts failed: ${lastError}. Checking alternative providers...`);
  }

  // 2. Fallback to Google Gemini (OpenAI-compatible endpoint)
  if (GEMINI_API_KEY) {
    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GEMINI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gemini-1.5-flash",
            messages,
            tools: GROQ_TOOLS,
            tool_choice: "auto",
          }),
        }
      );

      if (res.ok) {
        return await res.json();
      }
    } catch (e: any) {
      console.warn("[Raya] Gemini fallback error:", e.message);
    }
  }

  // 3. Fallback to OpenAI if OPENAI_API_KEY is available
  if (OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        tools: GROQ_TOOLS,
        tool_choice: "auto",
      }),
    });

    if (res.ok) {
      return await res.json();
    }
  }

  throw new Error("No AI provider credentials available. Please configure GROQ_API_KEY or GEMINI_API_KEY.");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    if (!GROQ_API_KEY && !GEMINI_API_KEY && !OPENAI_API_KEY) {
      return NextResponse.json({
        text: "👋 Welcome to Raya by Razorpay! Please configure `GROQ_API_KEY` or `GEMINI_API_KEY` in your environment variables.",
        toolExecutions: [],
        history: [],
      });
    }

    // Build OpenAI-compatible messages array
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

      const data = await callAI(messages);
      const choice = data.choices?.[0];
      const assistantMessage = choice?.message;

      if (!assistantMessage) {
        finalText = "I couldn't process your request. Please try again.";
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

          console.log(`[RAYA TOOL EXECUTION] Tool: ${toolName}`, args);

          const execResult = await executeBridgeTool(toolName, args, BRIDGE_URL);

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
    console.error("[RAYA AGENT ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to process chat message" },
      { status: 500 }
    );
  }
}
