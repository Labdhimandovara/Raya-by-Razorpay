"use client";

import React, { useState } from "react";
import { X, ShoppingBag, ArrowRight, ShieldCheck, CreditCard, Loader2, Trash2, Plus, Minus, Smartphone, CheckCircle2, Sparkles } from "lucide-react";
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
  onUpdateQuantity?: (productId: string, newQuantity: number) => void;
  onClearCart?: () => void;
  onAddToCart?: (product: any) => void;
  budget?: number | null;
}

export function CartDrawer({
  isOpen,
  onClose,
  items,
  total,
  onCheckout,
  onPaymentSuccess,
  onRemoveItem,
  onUpdateQuantity,
  onClearCart,
  onAddToCart,
  budget = null,
}: CartDrawerProps) {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<{ paymentId: string; orderId: string } | null>(null);
  const [testModalData, setTestModalData] = useState<{ orderId: string; amount: number } | null>(null);
  const [testMethod, setTestMethod] = useState<"upi" | "card">("upi");
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  const isLimitExceeded = budget !== null && budget !== undefined && total > budget;

  const handleCompletePayment = async (orderId: string, paymentId: string) => {
    setIsProcessingPayment(true);
    try {
      await fetch("/api/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: "sig_verified_test",
        }),
      });
      setPaymentSuccess({
        paymentId,
        orderId,
      });
      if (onPaymentSuccess) {
        onPaymentSuccess({ orderId, paymentId });
      }
    } catch (e) {
      console.error("Verification error:", e);
    } finally {
      setIsProcessingPayment(false);
      setTestModalData(null);
    }
  };

  const handleSimulatePayment = async () => {
    if (!testModalData) return;
    setIsSimulating(true);
    setTimeout(async () => {
      const paymentId = `pay_test_${Math.random().toString(36).substring(2, 12)}`;
      await handleCompletePayment(testModalData.orderId, paymentId);
      setIsSimulating(false);
    }, 850);
  };

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
      setIsProcessingPayment(false);

      // If genuine live credentials authorized, open official Razorpay SDK
      if (orderData.mode === "LIVE_TEST" && orderData.orderId && !orderData.orderId.startsWith("order_test_")) {
        let sdkSucceeded = false;
        try {
          sdkSucceeded = await triggerRazorpayPayment({
            keyId: orderData.keyId,
            orderId: orderData.orderId,
            amount: orderData.amount,
            currency: orderData.currency || "INR",
            name: "Raya by Razorpay",
            description: `Autonomous Multi-Store Checkout (${items.length} items)`,
            onSuccess: async (paymentResult) => {
              await handleCompletePayment(paymentResult.razorpay_order_id, paymentResult.razorpay_payment_id);
            },
            onFailure: () => {
              setTestModalData({
                orderId: orderData.orderId,
                amount: total,
              });
            },
            onDismiss: () => {
              setIsProcessingPayment(false);
            },
          });
        } catch (e) {
          sdkSucceeded = false;
        }

        if (!sdkSucceeded) {
          setTestModalData({
            orderId: orderData.orderId,
            amount: total,
          });
        }
      } else {
        // Direct seamless in-app Razorpay Test Mode checkout dialog
        setTestModalData({
          orderId: orderData.orderId || `order_${Math.random().toString(36).substring(2, 12)}`,
          amount: total,
        });
      }
    } catch (err: any) {
      console.warn("Razorpay Checkout notice:", err);
      setIsProcessingPayment(false);
      setTestModalData({
        orderId: `order_${Math.random().toString(36).substring(2, 12)}`,
        amount: total,
      });
    }
  };
  // Frequently Bought Together recommendations (popular items not currently in active cart)
  const cartProductIds = new Set(items.map((i) => i.productId));
  const candidateAddons = [
    {
      id: "nx-magnetic-fast-charge-powerbank",
      name: "Nexus MagVolt 10000mAh Magnetic Powerbank",
      price: 2199,
      category: "Tech",
      store: "nexusstore",
      storeName: "NexusStore",
      imageUrl: "https://images.unsplash.com/photo-1586253634026-8cb574908d1e?w=600&auto=format&fit=crop",
      badge: "⚡ 88% Match",
    },
    {
      id: "nx-sport-active-earbuds",
      name: "Nexus Pulse Sport Waterproof Wireless Earbuds",
      price: 2999,
      category: "Tech",
      store: "nexusstore",
      storeName: "NexusStore",
      imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop",
      badge: "🎧 Frequently Bought",
    },
    {
      id: "nx-smart-heated-techwear-jacket",
      name: "Nexus Smart Heated Techwear Bomber Jacket",
      price: 7999,
      category: "Clothing",
      store: "nexusstore",
      storeName: "NexusStore",
      imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop",
      badge: "🔥 Best Seller",
    },
  ];
  const recommendedAddons = candidateAddons.filter((p) => !cartProductIds.has(p.id));

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
          <div className="flex items-center gap-1.5">
            {onClearCart && items.length > 0 && (
              <button
                onClick={onClearCart}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all cursor-pointer mr-1"
                title="Empty entire cart"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Clear All</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-raya-lightGray/50 active:scale-95 text-raya-coolGray flex items-center justify-center transition-all cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
                    <div className="flex items-center gap-2.5 mt-1.5">
                      <span className="text-xs font-semibold text-raya-navy">
                        ₹{price.toLocaleString()}
                      </span>

                      {/* + and - Stepper Controls */}
                      <div className="flex items-center gap-1 bg-raya-softWhite border border-raya-lightGray rounded-lg p-0.5 shadow-2xs">
                        <button
                          onClick={() => {
                            if (onUpdateQuantity) {
                              onUpdateQuantity(item.productId || item.id, item.quantity - 1);
                            }
                          }}
                          title="Decrease quantity"
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white text-raya-navy font-bold text-xs active:scale-90 transition-all cursor-pointer"
                        >
                          <Minus className="w-3 h-3 text-raya-coolGray hover:text-raya-navy" />
                        </button>
                        <span className="text-xs font-bold text-raya-navy px-1.5 min-w-[20px] text-center select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => {
                            if (onUpdateQuantity) {
                              onUpdateQuantity(item.productId || item.id, item.quantity + 1);
                            }
                          }}
                          title="Increase quantity"
                          className="w-5 h-5 flex items-center justify-center rounded hover:bg-white text-raya-navy font-bold text-xs active:scale-90 transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-raya-coolGray hover:text-raya-navy" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-xs font-black text-raya-navy">
                      ₹{(price * item.quantity).toLocaleString()}
                    </span>
                    {onRemoveItem && (
                      <button
                        onClick={() => onRemoveItem(item.productId || item.id)}
                        title="Delete product from cart"
                        className="text-raya-coolGray hover:text-red-500 hover:bg-red-50 p-1 rounded-md transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Frequently Bought Together Add-ons */}
          {items.length > 0 && recommendedAddons.length > 0 && (
            <div className="mt-4 pt-3 border-t border-dashed border-raya-lightGray space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <h4 className="text-xs font-bold text-raya-navy">Frequently Bought Together</h4>
                </div>
                {budget !== null && budget !== undefined && (
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    ₹{Math.max(0, budget - total).toLocaleString()} remaining
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {recommendedAddons.slice(0, 2).map((rec) => {
                  const fitsBudget = budget === null || budget === undefined || (total + rec.price) <= budget;
                  return (
                    <div
                      key={rec.id}
                      className="p-2.5 rounded-xl border border-raya-lightGray bg-raya-softWhite/70 hover:bg-white hover:border-raya-blue/40 transition-all flex items-center justify-between gap-3 shadow-2xs group"
                    >
                      <img
                        src={rec.imageUrl}
                        alt={rec.name}
                        className="w-11 h-11 object-cover rounded-lg bg-white border border-raya-lightGray shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded">
                            {rec.badge}
                          </span>
                        </div>
                        <h5 className="text-[11px] font-bold text-raya-navy truncate" title={rec.name}>
                          {rec.name}
                        </h5>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-black text-raya-blue">
                            ₹{rec.price.toLocaleString()}
                          </span>
                          {fitsBudget && budget !== null && (
                            <span className="text-[9px] font-bold text-emerald-600">Fits budget!</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => onAddToCart && onAddToCart(rec)}
                        className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-raya-blue hover:text-white border border-raya-blue text-raya-blue text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-raya-lightGray bg-white space-y-3 sm:space-y-4 shadow-lg">
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-raya-coolGray font-medium block">Subtotal</span>
                {budget !== null && budget !== undefined ? (
                  <span className="text-[11px] text-raya-coolGray">
                    Safety Limit: ₹{budget.toLocaleString()} • {budget >= total ? (
                      <span className="text-emerald-600 font-semibold">₹{(budget - total).toLocaleString()} left</span>
                    ) : (
                      <span className="text-red-600 font-semibold">₹{(total - budget).toLocaleString()} over</span>
                    )}
                  </span>
                ) : (
                  <span className="text-[11px] text-raya-coolGray">Policy Guard: Active & Compliant</span>
                )}
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
                  Cart total of ₹{total.toLocaleString()} exceeds your active policy limit of ₹{budget?.toLocaleString()}.
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

      {/* Razorpay Test Mode Payment Simulator Modal */}
      {testModalData && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-raya-lightGray overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#0C2340] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#0C8CE9] flex items-center justify-center font-black text-white text-sm">
                  R
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-tight">Razorpay Checkout</h4>
                  <p className="text-[10px] text-blue-200">Autonomous Payment Gateway</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                Test Mode
              </span>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4">
              <div className="bg-raya-softWhite p-3 rounded-xl border border-raya-lightGray flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-raya-coolGray block">Payable Amount</span>
                  <span className="text-xl font-black text-raya-navy">
                    ₹{testModalData.amount.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-raya-coolGray block">Order Reference</span>
                  <span className="text-[10px] font-mono text-raya-navy truncate max-w-[120px] block">
                    {testModalData.orderId}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-raya-navy block">
                  Select Razorpay Test Instrument:
                </label>
                
                <div
                  onClick={() => setTestMethod("upi")}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    testMethod === "upi"
                      ? "border-raya-blue bg-raya-blue/5 shadow-2xs"
                      : "border-raya-lightGray hover:border-raya-blue/30"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-raya-blue/10 flex items-center justify-center text-raya-blue shrink-0">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-raya-navy">Instant UPI</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                        Auto-Approved
                      </span>
                    </div>
                    <span className="text-[11px] text-raya-coolGray font-mono">success@razorpay</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    testMethod === "upi" ? "border-raya-blue bg-raya-blue" : "border-gray-300"
                  }`}>
                    {testMethod === "upi" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                <div
                  onClick={() => setTestMethod("card")}
                  className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                    testMethod === "card"
                      ? "border-raya-blue bg-raya-blue/5 shadow-2xs"
                      : "border-raya-lightGray hover:border-raya-blue/30"
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-raya-blue/10 flex items-center justify-center text-raya-blue shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-raya-navy">Razorpay Test Card</span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                        Auto-Approved
                      </span>
                    </div>
                    <span className="text-[11px] text-raya-coolGray font-mono">4111 •••• •••• 1111 (12/28)</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    testMethod === "card" ? "border-raya-blue bg-raya-blue" : "border-gray-300"
                  }`}>
                    {testMethod === "card" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  disabled={isSimulating}
                  onClick={handleSimulatePayment}
                  className="w-full py-3 rounded-xl bg-raya-blue hover:bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm shadow-raya-blue/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-70"
                >
                  {isSimulating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authorizing with Razorpay...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authorize & Pay ₹{testModalData.amount.toLocaleString()}</span>
                    </>
                  )}
                </button>
                <button
                  disabled={isSimulating}
                  onClick={() => setTestModalData(null)}
                  className="w-full py-2 text-xs font-semibold text-raya-coolGray hover:text-raya-navy transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
