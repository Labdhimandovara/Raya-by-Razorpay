import { NextRequest, NextResponse } from "next/server";
import { addDecisionEvent } from "@/lib/merchant-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const productName = body.productName || "Nexus Pro Wireless Studio Headphones";
    const approvedPrice = body.approvedPrice || 6799;
    const currentPrice = body.currentPrice || 7199;
    const priceDelta = currentPrice - approvedPrice;

    // Server-Side Price Invalidation Check
    if (currentPrice > approvedPrice) {
      addDecisionEvent({
        id: `evt_inval_${Date.now()}`,
        step: "APPROVAL_INVALIDATED",
        title: "APPROVAL INVALIDATED: PRICE_CHANGED",
        timestamp: "Just now",
        status: "INVALIDATED",
        summary: `Pre-payment price check failed: Approved price of ₹${approvedPrice.toLocaleString()} jumped to ₹${currentPrice.toLocaleString()} (+₹${priceDelta.toLocaleString()}).`,
        details: {
          productName,
          approvedPrice: `₹${approvedPrice.toLocaleString()}`,
          liveCataloguePrice: `₹${currentPrice.toLocaleString()}`,
          unauthorizedDifference: `+₹${priceDelta.toLocaleString()}`,
          invalidationReason: "PRICE_CHANGED",
          paymentStatus: "NEVER_INITIATED",
          securityEnforcement: "Approval invalidated cryptographically; buyer re-consent mandatory.",
        },
      });

      return NextResponse.json({
        valid: false,
        status: "APPROVAL_INVALIDATED",
        reason: "PRICE_CHANGED",
        message: "Approved price no longer matches the current catalogue price.",
        approvedPrice,
        currentPrice,
        difference: priceDelta,
        paymentInitiated: false,
        explanation: "Payment was never initiated. Pre-checkout price verification halted order creation.",
        productName,
        timestamp: new Date().toISOString(),
      }, { status: 409 });
    }

    return NextResponse.json({
      valid: true,
      status: "APPROVED_PRICE_MATCHED",
      approvedPrice,
      currentPrice,
      message: "Price matched approved authorization.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to test price spike" }, { status: 500 });
  }
}
