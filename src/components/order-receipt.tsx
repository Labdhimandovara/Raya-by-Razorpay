"use client";

import React from "react";
import { CheckCircle2, ShieldCheck, MapPin, Package, CreditCard } from "lucide-react";

interface OrderReceiptProps {
  receipt: {
    orderId: string;
    details?: any;
    address?: {
      name?: string;
      street?: string;
      city?: string;
      country?: string;
      zip?: string;
    };
    paymentMethod?: string;
    timestamp?: string;
  };
}

export function OrderReceipt({ receipt }: OrderReceiptProps) {
  if (!receipt) return null;

  const addr = receipt.address || {};
  const orderId = receipt.orderId || "NX-ORDER";

  return (
    <div className="my-4 p-5 rounded-2xl bg-white border-2 border-emerald-500/30 shadow-lg shadow-emerald-500/5 max-w-lg space-y-4 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="flex items-start justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-[#0C2340]">Order Placed Successfully!</h4>
            <p className="text-[11px] font-mono text-[#64748B]">ID: #{orderId}</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
          Confirmed
        </span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <div className="flex items-center gap-1.5 text-[#64748B] font-semibold text-[10px] uppercase mb-1">
            <MapPin className="w-3.5 h-3.5 text-[#0C66E4]" />
            <span>Delivery Destination</span>
          </div>
          <p className="font-bold text-[#0C2340]">{addr.name || "Customer"}</p>
          <p className="text-[#475569] text-[11px] mt-0.5 leading-tight">
            {addr.street ? `${addr.street}, ` : ""}
            {addr.city ? `${addr.city} ` : ""}
            {addr.zip ? `(${addr.zip})` : ""}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
          <div className="flex items-center gap-1.5 text-[#64748B] font-semibold text-[10px] uppercase mb-1">
            <CreditCard className="w-3.5 h-3.5 text-[#0C66E4]" />
            <span>Payment Method</span>
          </div>
          <p className="font-bold text-[#0C2340] capitalize">{receipt.paymentMethod || "Razorpay Card"}</p>
          <p className="text-emerald-600 text-[11px] font-semibold mt-0.5 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Payment Authorized</span>
          </p>
        </div>
      </div>

      {/* Footer Assurance */}
      <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
        <span className="flex items-center gap-1 text-slate-500 font-medium">
          <Package className="w-3.5 h-3.5 text-[#00D09C]" />
          <span>Fulfillment via NexusStore</span>
        </span>
        <span className="font-semibold text-[#0C66E4]">Protected by Razorpay Guard</span>
      </div>
    </div>
  );
}
