import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { message, orders = [], metrics = {} } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const geminiKey = (
      process.env.GEMINI_API_KEY ||
      process.env.gemini_api_key ||
      process.env.GOOGLE_API_KEY ||
      ""
    ).trim();

    if (!geminiKey) {
      return NextResponse.json({
        reply: `Merchant Copilot: Active Orders: ${orders.length} | Gross GMV: ₹${(metrics.totalGMV || 0).toLocaleString()}. Configure gemini_api_key for natural language responses.`,
      });
    }

    const prompt = `You are the Bazaar Multi-Store Merchant Copilot.
You have real-time access to the merchant's multi-store commerce operations connecting NexusStore, ThreadVault, PixelMart, and eBay Marketplace via the Razorpay Autonomous Agent Bridge.

REAL LIVE DATA:
- Total Processed GMV: ₹${(metrics.totalGMV || 0).toLocaleString()}
- Total Orders on Razorpay: ${metrics.totalOrders || orders.length}
- Average Order Value (AOV): ₹${(metrics.aov || 0).toLocaleString()}
- Recent Real Orders (Top 5):
${orders.slice(0, 5).map((o: any, idx: number) => `  ${idx + 1}. [${o.id}] ₹${o.amount.toLocaleString()} - Store: ${o.store}, Status: ${o.status}, Receipt: ${o.receipt}`).join("\n")}

MERCHANT'S QUESTION:
"${message}"

INSTRUCTIONS:
- Give a direct, concise, and professional answer based on the real data above.
- Mention specific order numbers, exact amounts, or store names where relevant.
- Keep it punchy and actionable (under 80 words).`;

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
      return NextResponse.json({ reply: reply.replace(/\*\*/g, "") });
    }

    return NextResponse.json({
      reply: `Merchant Copilot Summary: Total GMV is ₹${(metrics.totalGMV || 0).toLocaleString()} across ${metrics.totalOrders || orders.length} live orders. NexusStore and ThreadVault are leading checkout volume.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Copilot error" },
      { status: 500 }
    );
  }
}
