"use client";

import React from "react";
import { CheckCircle2, ShieldCheck, MapPin, Package, CreditCard } from "lucide-react";
import { CONNECTED_STORES } from "@/lib/gemini";

interface OrderReceiptProps {
  receipt: {
    orderId: string;
    details?: any;
    store?: string;
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
  const orderId = receipt.orderId || "ORD-SUCCESS";
  const storeKey = (receipt.store || "nexusstore").toLowerCase();
  const storeMeta = CONNECTED_STORES[storeKey] || CONNECTED_STORES.nexusstore;

  return (
    <div className="my-3 sm:my-4 p-4 sm:p-5 rounded-2xl bg-white border-2 border-raya-success/30 shadow-xs max-w-lg w-full space-y-3.5 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex items-start justify-between border-b border-raya-lightGray/60 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-raya-success flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-raya-navy">Order Placed Successfully!</h4>
            <p className="text-[11px] font-mono text-raya-coolGray">ID: #{orderId}</p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider shrink-0">
          Confirmed
        </span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
        <div className="p-3 rounded-xl bg-raya-softWhite border border-raya-lightGray">
          <div className="flex items-center gap-1.5 text-raya-coolGray font-semibold text-[10px] uppercase mb-1">
            <MapPin className="w-3.5 h-3.5 text-raya-blue" />
            <span>Delivery Destination</span>
          </div>
          <p className="font-bold text-raya-navy">{addr.name || "Customer"}</p>
          <p className="text-raya-stone text-[11px] mt-0.5 leading-tight">
            {addr.street ? `${addr.street}, ` : ""}
            {addr.city ? `${addr.city} ` : ""}
            {addr.zip ? `(${addr.zip})` : ""}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-raya-softWhite border border-raya-lightGray">
          <div className="flex items-center gap-1.5 text-raya-coolGray font-semibold text-[10px] uppercase mb-1">
            <CreditCard className="w-3.5 h-3.5 text-raya-blue" />
            <span>Payment Method</span>
          </div>
          <p className="font-bold text-raya-navy capitalize">{receipt.paymentMethod || "Razorpay Card"}</p>
          <p className="text-raya-success text-[11px] font-semibold mt-0.5 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            <span>Payment Authorized</span>
          </p>
        </div>
      </div>

      {/* Footer Fulfillment */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-raya-coolGray pt-1 gap-1">
        <span className="flex items-center gap-1 text-raya-stone font-medium">
          <Package className="w-3.5 h-3.5 text-raya-blue" />
          <span>Fulfillment via <strong>{storeMeta.icon} {storeMeta.name}</strong></span>
        </span>
        <span className="font-bold text-raya-blue">Protected by Razorpay Guard</span>
      </div>
    </div>
  );
}
