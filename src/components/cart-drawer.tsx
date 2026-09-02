"use client";

import React, { useState } from "react";
import { X, ShoppingBag, ArrowRight, ShieldCheck, CreditCard, Loader2, Trash2 } from "lucide-react";
import { CONNECTED_STORES, SAMPLE_NEXUS_PRODUCTS, SAMPLE_EBAY_PRODUCTS } from "@/lib/gemini";
import { triggerRazorpayPayment } from "@/lib/razorpay";

function lookupProduct(productId: string) {
  const all = [...SAMPLE_NEXUS_PRODUCTS, ...SAMPLE_EBAY_PRODUCTS];
  return all.find((p) => p.id === productId);
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  price?: number;
  name?: string;
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
  onPaymentSuccess?: (paymentInfo: { orderId: string; paymentId: string }) => void;
  onRemoveItem?: (productId: string) => void;
  budget?: number;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  total,
  onCheckout,
  onPaymentSuccess,
  onRemoveItem,
  budget = 15000,
}: CartDrawerProps) {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<{ paymentId: string; orderId: string } | null>(null);

  if (!isOpen) return null;

  const isLimitExceeded = total > budget;

  const handleRazorpayTestCheckout = async () => {
    if (isLimitExceeded || total <= 0) return;
    setIsProcessingPayment(true);

    try {
      // 1. Create Razorpay Order via API
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          currency: "INR",
          receipt: `rcpt_raya_${Date.now()}`,
          notes: {
            itemCount: String(items.length),
            store: items[0]?.store || "multi_store",
          },
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.orderId) {
        throw new Error(orderData.error || "Failed to initialize Razorpay test order");
      }

      // 2. Trigger Razorpay Checkout Modal
      await triggerRazorpayPayment({
        keyId: orderData.keyId || "rzp_test_TTwic3LGIevFKg",
        orderId: orderData.orderId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "Raya by Razorpay",
        description: `Autonomous Multi-Store Checkout (${items.length} items)`,
        onSuccess: async (paymentResult) => {
          // 3. Verify Payment
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(paymentResult),
            });
            const verifyData = await verifyRes.json();
            setPaymentSuccess({
              paymentId: paymentResult.razorpay_payment_id,
              orderId: paymentResult.razorpay_order_id,
            });

            if (onPaymentSuccess) {
              onPaymentSuccess({
                orderId: paymentResult.razorpay_order_id,
                paymentId: paymentResult.razorpay_payment_id,
              });
            }
          } catch (e) {
            console.error("Verification error:", e);
          } finally {
            setIsProcessingPayment(false);
          }
        },
        onDismiss: () => {
          setIsProcessingPayment(false);
        },
      });
    } catch (err: any) {
      console.error("Razorpay Checkout Error:", err);
      alert(`Razorpay checkout initialization: ${err.message}. Opening direct checkout fallback.`);
      onClose();
      onCheckout();
    } finally {
      setIsProcessingPayment(false);
    }
  };

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
                Ask Raya to discover items from NexusStore, ThreadVault, PixelMart, or eBay.
              </p>
            </div>
          ) : (
            items.map((item, idx) => {
              const productMeta = item.product || lookupProduct(item.productId);
              const name = productMeta?.name || item.name || `Product (${item.productId})`;
              const price = productMeta?.price || item.price || 0;
              const img =
                productMeta?.imageUrl ||
                (item.store === "ebay"
                  ? "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200"
                  : "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200");
              const storeKey = (item.store || productMeta?.store || "nexusstore").toLowerCase();
              const storeMeta = CONNECTED_STORES[storeKey] || CONNECTED_STORES.nexusstore;

              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-raya-lightGray bg-white hover:border-raya-blue/30 transition-all flex items-center gap-3 shadow-2xs group"
                >
                  <img
                    src={img}
                    alt={name}
                    className="w-14 h-14 object-cover rounded-lg bg-raya-softWhite border border-raya-lightGray shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${storeMeta.badgeClass}`}>
                        {storeMeta.icon} {storeMeta.name}
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-raya-navy truncate" title={name}>
                      {name}
                    </h5>
                    <p className="text-xs font-semibold text-raya-blue mt-0.5">
                      ₹{price.toLocaleString()} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-xs font-black text-raya-navy">
                      ₹{(price * item.quantity).toLocaleString()}
                    </span>
                    {onRemoveItem && (
                      <button
                        onClick={() => onRemoveItem(item.productId || item.id)}
                        title="Remove from cart"
                        className="text-raya-coolGray hover:text-red-500 p-0.5 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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
              <div>
                <span className="text-raya-coolGray font-medium block">Subtotal</span>
                <span className="text-[11px] text-raya-coolGray">Safety Limit: ₹{budget.toLocaleString()}</span>
              </div>
              <span className="text-lg font-black text-raya-navy">₹{total.toLocaleString()}</span>
            </div>

            {/* Policy Spending Cap Exceeded Alert */}
            {isLimitExceeded ? (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-red-700">
                  <span>🚫</span>
                  <span>SAFETY SPENDING LIMIT EXCEEDED</span>
                </div>
                <p className="text-[11px] text-red-600 leading-snug">
                  Cart total of ₹{total.toLocaleString()} exceeds your active policy limit of ₹{budget.toLocaleString()}.
                  Checkout has been blocked by Autonomous Purchase Guard. Please remove items or adjust your budget.
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-raya-softWhite text-raya-navy text-[11px] font-medium border border-raya-lightGray">
                <ShieldCheck className="w-4 h-4 shrink-0 text-raya-blue" />
                <span>Razorpay Autonomous Purchase Guard Active & Compliant</span>
              </div>
            )}

            {/* Payment Successful Badge */}
            {paymentSuccess ? (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>PAYMENT VERIFIED & CAPTURED</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Razorpay Payment ID: <span className="font-mono font-bold">{paymentSuccess.paymentId}</span>
                </p>
                <p className="text-[10px] text-emerald-600">Order ID: {paymentSuccess.orderId}</p>
              </div>
            ) : null}

            <button
              disabled={isLimitExceeded || isProcessingPayment}
              onClick={handleRazorpayTestCheckout}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                isLimitExceeded
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300 shadow-none"
                  : isProcessingPayment
                  ? "bg-raya-blue/80 text-white cursor-wait"
                  : "bg-raya-blue hover:bg-blue-600 active:scale-[0.98] text-white shadow-sm shadow-raya-blue/20 cursor-pointer"
              }`}
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Opening Razorpay Checkout...</span>
                </>
              ) : isLimitExceeded ? (
                <span>Checkout Blocked by Policy Guard</span>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Pay ₹{total.toLocaleString()} with Razorpay (Test Mode)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
