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

const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
];

let workingModel: string | null = null;

async function getAvailableGroqModel(groqKey: string): Promise<string> {
  if (workingModel) return workingModel;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${groqKey}` },
    });
    if (res.ok) {
      const data = await res.json();
      const modelIds: string[] = (data.data || []).map((m: any) => m.id);
      
      // Filter out non-chat models (guard, whisper, embed)
      const chatModels = modelIds.filter((id: string) => {
        const lower = id.toLowerCase();
        return (
          !lower.includes("guard") &&
          !lower.includes("whisper") &&
          !lower.includes("embed") &&
          (lower.includes("llama") || lower.includes("gemma") || lower.includes("qwen"))
        );
      });

      console.log("[Raya Groq Available Chat Models]:", chatModels);

      // Prefer large versatile models first, then standard 8b
      const preferred = [
        "llama-3.3-70b-versatile",
        "llama-3.1-70b-versatile",
        "llama-3.1-8b-instant",
        "llama3-70b-8192",
        "llama3-8b-8192",
        "gemma2-9b-it",
      ];

      for (const p of preferred) {
        const match = chatModels.find((m) => m.toLowerCase() === p.toLowerCase() || m.includes(p));
        if (match) {
          workingModel = match;
          return match;
        }
      }

      if (chatModels.length > 0) {
        workingModel = chatModels[0];
        return chatModels[0];
      }
    }
  } catch (e) {
    console.warn("[Raya Groq] Models endpoint fetch error:", e);
  }
  return "llama-3.3-70b-versatile";
}

async function callAI(
  messages: any[],
  groqKey: string,
  geminiKey: string,
  openaiKey: string
): Promise<any> {
  let lastError = "No AI provider succeeded.";

  // 1. Try Groq if key is available
  if (groqKey) {
    const modelToUse = await getAvailableGroqModel(groqKey);

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: modelToUse,
          messages,
          tools: GROQ_TOOLS,
          tool_choice: "auto",
          max_tokens: 4096,
        }),
      });

      if (res.ok) {
        workingModel = modelToUse;
        return await res.json();
      }

      const errData = await res.json().catch(() => null);
      lastError = `[Model ${modelToUse}]: ${errData?.error?.message || `HTTP ${res.status}`}`;
      console.error(`[Raya Groq Error]`, lastError);
      workingModel = null;
    } catch (e: any) {
      workingModel = null;
      lastError = e.message;
    }
    console.warn(`[Raya] Groq attempts failed: ${lastError}. Checking alternative providers...`);
  }

  // 2. Fallback to Google Gemini
  if (geminiKey) {
    try {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${geminiKey}`,
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

  // 3. Fallback to OpenAI
  if (openaiKey) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
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

  if (groqKey) {
    throw new Error(`Groq API Error: ${lastError}`);
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

    // Read environment variables dynamically at request time
    const groqKey = (process.env.GROQ_API_KEY || "").trim();
    const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
    const openaiKey = (process.env.OPENAI_API_KEY || "").trim();

    const bridgeUrl = (
      process.env.BAZAAR_BRIDGE_URL ||
      process.env.NEXUS_STORE_BRIDGE_URL ||
      "https://bazaar-ai-backend.onrender.com/api/bridge"
    ).trim();

    if (!groqKey && !geminiKey && !openaiKey) {
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

      const data = await callAI(messages, groqKey, geminiKey, openaiKey);
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
    console.error("[RAYA AGENT ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to process chat message" },
      { status: 500 }
    );
  }
}
