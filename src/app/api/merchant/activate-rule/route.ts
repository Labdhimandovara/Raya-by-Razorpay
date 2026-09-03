import { NextRequest, NextResponse } from "next/server";
import { activateGrowthRule } from "@/lib/merchant-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { ruleId, strategyId, active = true, actor = "Bazaar Growth Agent" } = await req.json();
    const identifier = strategyId || ruleId;

    if (!identifier) {
      return NextResponse.json({ error: "strategyId or ruleId is required" }, { status: 400 });
    }

    const updated = activateGrowthRule(identifier, active, actor);
    if (!updated) {
      return NextResponse.json({ error: "Opportunity rule not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      strategyId: updated.strategyId,
      ruleId: updated.id,
      isActive: updated.isActive,
      title: updated.title,
      activatedAt: updated.activatedAt,
      activatedBy: updated.activatedBy,
      message: `Growth action ${updated.isActive ? "ACTIVATED" : "PAUSED"}: Raya buyer agent will now prioritize "${updated.crossSellProduct.name}".`,
      opportunity: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update growth rule" }, { status: 500 });
  }
}
