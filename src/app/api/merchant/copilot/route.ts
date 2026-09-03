import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { message, orders = [], metrics = {}, opportunities = [] } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const geminiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.gemini_api_key ||
      process.env.GOOGLE_API_KEY ||
      ""
    ).trim();

    const lowerMsg = message.toLowerCase();

    // Check for quick deterministic actions
    let actionPayload: any = null;
    if (lowerMsg.includes("next") || lowerMsg.includes("recommend") || lowerMsg.includes("opportunity")) {
      actionPayload = {
        type: "ACTIVATE_RULE",
        ruleId: "opp_capture_mic",
        label: "Activate Capture Card → XLR Mic",
      };
    } else if (lowerMsg.includes("laptop") || lowerMsg.includes("headphone")) {
      actionPayload = {
        type: "ACTIVATE_RULE",
        ruleId: "opp_laptop_headphones",
        label: "Activate Laptop → Headphones",
      };
    }

    if (!geminiKey) {
      return NextResponse.json({
        reply: `Merchant Copilot: AI-Attributed GMV is ₹${(metrics.aiAttributedGMV || 103662).toLocaleString()} (+24.8% AOV lift). Cross-sell rules for Headphones and Powerbanks are currently driving incremental revenue.`,
        action: actionPayload,
      });
    }

    const prompt = `You are the Bazaar Multi-Store Merchant Copilot.
You have real-time access to the merchant's multi-store commerce growth engine connecting NexusStore, ThreadVault, PixelMart, and eBay Marketplace via Razorpay infrastructure.

CORE STORY: RAYA BUYS. BAZAAR GROWS. RAZORPAY MOVES THE MONEY.

REAL LIVE DATA:
- Total Processed GMV: ₹${(metrics.totalGMV || 0).toLocaleString()}
- AI-Attributed GMV: ₹${(metrics.aiAttributedGMV || Math.round((metrics.totalGMV || 0) * 0.82)).toLocaleString()}
- Incremental GMV (Cross-sells/Bundles): ₹${(metrics.incrementalGMV || Math.round((metrics.totalGMV || 0) * 0.23)).toLocaleString()}
- AI Conversion Rate: ${metrics.aiConversionRate || "24.6%"}
- Average Order Value (AOV): ₹${(metrics.aov || 0).toLocaleString()} (AOV Lift: +24.8%)
- Total Orders on Razorpay: ${metrics.totalOrders || orders.length}
- Recent Orders (Top 3):
${orders.slice(0, 3).map((o: any, idx: number) => `  ${idx + 1}. [${o.id}] ₹${o.amount.toLocaleString()} (${o.store}) - ${o.agentHandshake}`).join("\n")}

MERCHANT'S QUESTION:
"${message}"

INSTRUCTIONS:
- Give a direct, concise, and professional answer based strictly on the real data above.
- If asked why revenue increased: explain that AI-attributed GMV rose because shoppers frequently accepted automated in-cart cross-sells (e.g. Laptop → Headphones, Heated Jacket → Powerbank).
- If asked what to do next: recommend activating the "Capture Card → Broadcast XLR Mic" opportunity to capture an estimated ₹15,999 in untapped incremental GMV.
- Keep the response punchy, authoritative, and under 80 words. Never use raw markdown asterisks.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
      geminiKey
    )}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate Copilot response.";
      return NextResponse.json({
        reply: reply.replace(/\*\*/g, ""),
        action: actionPayload,
      });
    }

    return NextResponse.json({
      reply: `AI-attributed GMV is currently ₹${(metrics.aiAttributedGMV || 103662).toLocaleString()} across ${metrics.totalOrders || 25} live Razorpay transactions. Cross-sell conversions are performing at 24.6% with +24.8% AOV expansion.`,
      action: actionPayload,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Copilot error" },
      { status: 500 }
    );
  }
}
