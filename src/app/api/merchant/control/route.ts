import { NextRequest, NextResponse } from "next/server";
import { getPurchaseControlConfig, updatePurchaseControlConfig } from "@/lib/merchant-store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    success: true,
    purchaseControl: getPurchaseControlConfig(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { maxSpend, quantityLimit, priceValidation, currency, merchantAuthorization, approvalExpiryMinutes } = body;

    const updated = updatePurchaseControlConfig({
      ...(typeof maxSpend === "number" ? { maxSpend } : {}),
      ...(typeof quantityLimit === "number" ? { quantityLimit } : {}),
      ...(typeof priceValidation === "boolean" ? { priceValidation } : {}),
      ...(typeof currency === "string" ? { currency } : {}),
      ...(typeof merchantAuthorization === "boolean" ? { merchantAuthorization } : {}),
      ...(typeof approvalExpiryMinutes === "number" ? { approvalExpiryMinutes } : {}),
    });

    return NextResponse.json({
      success: true,
      purchaseControl: updated,
      message: "Purchase control guardrails updated successfully",
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message || "Failed to update guardrails" }, { status: 500 });
  }
}
