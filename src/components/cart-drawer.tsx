"use client";

import React from "react";
import { X, ShoppingBag, ArrowRight, ShieldCheck } from "lucide-react";
import { CONNECTED_STORES } from "@/lib/gemini";

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  store?: string;
  product?: {
    name: string;
    price: number;
    imageUrl?: string;
    store?: string;
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
    <div className="fixed inset-0 z-50 flex justify-end bg-raya-navy/50 backdrop-blur-xs transition-opacity animate-fadeIn">
      <div className="w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-raya-lightGray">
        
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-raya-lightGray flex items-center justify-between bg-raya-softWhite/70">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-raya-blue" />
            <h3 className="font-bold text-raya-navy text-base">Your Active Cart</h3>
            <span className="px-2 py-0.5 rounded-full bg-raya-blue/10 text-raya-blue text-xs font-bold">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-raya-lightGray/50 active:scale-95 text-raya-coolGray flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 sm:space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-raya-softWhite flex items-center justify-center text-raya-coolGray border border-raya-lightGray">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-raya-navy">Your cart is currently empty</h4>
              <p className="text-xs text-raya-coolGray max-w-xs leading-relaxed">
                Ask Raya to discover items from NexusStore, ThreadVault, or PixelMart.
              </p>
            </div>
          ) : (
            items.map((item, idx) => {
              const name = item.product?.name || `Product (${item.productId})`;
              const price = item.product?.price || 0;
              const img = item.product?.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200";
              const storeKey = (item.store || item.product?.store || "nexusstore").toLowerCase();
              const storeMeta = CONNECTED_STORES[storeKey] || CONNECTED_STORES.nexusstore;

              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-raya-lightGray bg-raya-softWhite/50 flex items-center gap-3"
                >
                  <img
                    src={img}
                    alt={name}
                    className="w-13 h-13 object-cover rounded-lg bg-white border border-raya-lightGray shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${storeMeta.badgeClass}`}>
                        {storeMeta.icon} {storeMeta.name}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-raya-navy truncate">{name}</h5>
                    <p className="text-xs font-semibold text-raya-blue mt-0.5">
                      ₹{price.toLocaleString()} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-raya-navy">
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
          <div className="p-4 sm:p-5 border-t border-raya-lightGray bg-white space-y-3 sm:space-y-4 shadow-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-raya-coolGray font-medium">Subtotal</span>
              <span className="text-lg font-black text-raya-navy">₹{total.toLocaleString()}</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-raya-softWhite text-raya-navy text-[11px] font-medium border border-raya-lightGray">
              <ShieldCheck className="w-4 h-4 shrink-0 text-raya-blue" />
              <span>Razorpay FastCheckout & Multi-Store Buyer Safety</span>
            </div>

            <button
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className="w-full py-3 rounded-xl bg-raya-blue hover:bg-blue-600 active:scale-[0.98] text-white font-medium text-sm transition-all shadow-sm shadow-raya-blue/20 flex items-center justify-center gap-2 cursor-pointer"
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
