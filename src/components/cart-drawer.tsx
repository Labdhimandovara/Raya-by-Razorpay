"use client";

import React from "react";
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product?: {
    name: string;
    price: number;
    imageUrl?: string;
  };
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  total: number;
  onCheckout: () => void;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  total,
  onCheckout,
}: CartDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-[#E2E8F0]">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#0C66E4]" />
            <h3 className="font-extrabold text-[#0C2340] text-base">Your Active Cart</h3>
            <span className="px-2 py-0.5 rounded-full bg-[#EBF3FF] text-[#0C66E4] text-xs font-bold">
              {items.length} items
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-[#64748B] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-[#94A3B8]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-[#0C2340]">Your cart is currently empty</h4>
              <p className="text-xs text-[#64748B] max-w-xs">
                Ask Raya to search for shirts, shoes, or electronics on NexusStore to add items here.
              </p>
            </div>
          ) : (
            items.map((item, idx) => {
              const name = item.product?.name || `Product (${item.productId})`;
              const price = item.product?.price || 0;
              const img = item.product?.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200";

              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-3.5"
                >
                  <img
                    src={img}
                    alt={name}
                    className="w-14 h-14 object-cover rounded-lg bg-white border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-[#0C2340] truncate">{name}</h5>
                    <p className="text-xs font-semibold text-[#0C66E4] mt-0.5">
                      ₹{price.toLocaleString()} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-[#0C2340]">
                      ₹{(price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-5 border-t border-[#E2E8F0] bg-white space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#64748B] font-semibold">Subtotal</span>
              <span className="text-lg font-black text-[#0C2340]">₹{total.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#EBF3FF] text-[#0C66E4] text-[11px] font-medium border border-[#0C66E4]/20">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#00D09C]" />
              <span>Razorpay FastCheckout & Buyer Safety Active</span>
            </div>

            <button
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#0C66E4] to-[#00D09C] hover:opacity-95 text-white font-extrabold text-sm transition-all shadow-md shadow-[#0C66E4]/20 flex items-center justify-center gap-2"
            >
              <span>Instant Checkout with Raya</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
