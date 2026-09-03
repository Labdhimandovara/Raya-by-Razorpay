import { NextRequest, NextResponse } from "next/server";
import { addDecisionEvent } from "@/lib/merchant-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    
    // Default demo parameters or passed from client
    const items = body.items || [
      { name: "Nexus Pro Studio ANC Headphones", price: 6799, quantity: 1 },
      { name: "Apex Pro Creator High-Performance Laptop", price: 54999, quantity: 1 },
    ];
    const maxSpendAllowed = body.maxSpend || 10000;
    
    const requestedTotal = items.reduce((sum: number, item: any) => sum + item.price * (item.quantity || 1), 0);
    const exceededAmount = requestedTotal - maxSpendAllowed;

    // Server-Side Policy Guardrail Evaluation
    if (requestedTotal > maxSpendAllowed) {
      // Record blocked event in Decision Ledger
      addDecisionEvent({
        id: `evt_block_${Date.now()}`,
        step: "POLICY_GATE_REJECTED",
        title: "PURCHASE BLOCKED: MAX_SPEND EXCEEDED",
        timestamp: "Just now",
        status: "BLOCKED",
        decisionType: "SYSTEM",
        summary: `Transaction rejected server-side: Requested ₹${requestedTotal.toLocaleString()} exceeds authorized policy limit of ₹${maxSpendAllowed.toLocaleString()}.`,
        details: {
          gateTriggered: "GATE_01_MAX_SPEND",
          requestedAmount: `₹${requestedTotal.toLocaleString()}`,
          authorizedCeiling: `₹${maxSpendAllowed.toLocaleString()}`,
          overageAmount: `₹${exceededAmount.toLocaleString()}`,
          paymentStatus: "NEVER_INITIATED",
          razorpayOrderCreation: "BLOCKED_BEFORE_API_CALL",
          serverAuditOutcome: "REJECTED_BY_PURCHASE_CONTROL",
        },
      });

      return NextResponse.json({
        allowed: false,
        status: "PURCHASE_BLOCKED",
        errorCode: "MAX_SPEND",
        message: "Purchase blocked: Requested amount exceeds authorized policy spending ceiling.",
        requested: requestedTotal,
        allowedLimit: maxSpendAllowed,
        exceeded: exceededAmount,
        paymentInitiated: false,
        razorpayOrderStatus: "NOT_CREATED",
        explanation: "Payment was never initiated. Razorpay order was blocked server-side before gateway creation.",
        items,
        timestamp: new Date().toISOString(),
      }, { status: 400 });
    }

    return NextResponse.json({
      allowed: true,
      status: "APPROVED",
      total: requestedTotal,
      message: "Purchase approved within policy limit.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to evaluate policy demo" }, { status: 500 });
  }
}
