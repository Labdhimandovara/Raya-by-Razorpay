import { NextRequest, NextResponse } from "next/server";
import { activateGrowthRule } from "@/lib/merchant-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { ruleId, active = true } = await req.json();

    if (!ruleId) {
      return NextResponse.json({ error: "ruleId is required" }, { status: 400 });
    }

    const updated = activateGrowthRule(ruleId, active);
    if (!updated) {
      return NextResponse.json({ error: "Opportunity rule not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ruleId: updated.id,
      isActive: updated.isActive,
      title: updated.title,
      message: `Growth action ${updated.isActive ? "ACTIVATED" : "PAUSED"}: Raya buyer agent will now prioritize "${updated.crossSellProduct.name}".`,
      opportunity: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update growth rule" }, { status: 500 });
  }
}
