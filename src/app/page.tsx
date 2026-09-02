"use client";

import React, { useState } from "react";
import { RayaHeader } from "@/components/raya-header";
import { RayaChat, Message } from "@/components/raya-chat";
import { RayaInput } from "@/components/raya-input";
import { CartDrawer } from "@/components/cart-drawer";
import { CONNECTED_STORES, SAMPLE_NEXUS_PRODUCTS, SAMPLE_EBAY_PRODUCTS } from "@/lib/gemini";
import { Sparkles, Layers } from "lucide-react";

function lookupProduct(productId: string) {
  const all = [...SAMPLE_NEXUS_PRODUCTS, ...SAMPLE_EBAY_PRODUCTS];
  return all.find((p) => p.id === productId);
}

export default function RayaHome() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro-msg",
      role: "assistant",
      text: `👋 Hi! I am Raya, your autonomous shopping agent by Razorpay.

I am connected to live merchant stores and marketplaces across the Bazaar ecosystem:
• ⚡ NexusStore: Sleek high-performance smart apparel & tech electronics
• 🧵 ThreadVault: Curated minimalist luxury fashion, cashmere & artisan audio
• 🎮 PixelMart: Cyberpunk creator equipment, macro keypads & RGB hardware
• 🛍️ eBay: Global marketplace with certified refurbished tech & direct listings

Try asking me:
• "Find luxury clothing from ThreadVault and gaming gear from PixelMart"
• "Show me certified refurbished tech deals on eBay"
• "Show me the best jackets across all stores and eBay under ₹15,000"
• Or click one of the store pills below to start browsing!`,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [budget, setBudget] = useState(15000);

  const cartTotal = cartItems.reduce((acc, item) => {
    const productMeta = item.product || lookupProduct(item.productId);
    const price = productMeta?.price || item.price || 0;
    const qty = item.quantity || 1;
    return acc + price * qty;
  }, 0);

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || loading) return;

    // Detect dynamic budget constraints (e.g. "under 5000", "budget 5k", "below ₹5,000")
    const budgetMatch = userText.match(/(?:under|below|less than|budget)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?|\d+k)/i);
    if (budgetMatch) {
      let rawVal = budgetMatch[1].toLowerCase().replace(/,/g, "");
      let parsedBudget = rawVal.endsWith("k") ? parseFloat(rawVal) * 1000 : parseFloat(rawVal);
      if (!isNaN(parsedBudget) && parsedBudget > 0) {
        setBudget(parsedBudget);
      }
    }

    const userMsgId = `user-${Date.now()}`;
    const newMsg: Message = {
      id: userMsgId,
      role: "user",
      text: userText,
    };

    setMessages((prev) => [...prev, newMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const data = await res.json();

      const assistantMsg: Message = {
        id: `ast-${Date.now()}`,
        role: "assistant",
        text: data.text || "Here are the details from the connected stores.",
        products: data.products,
        receipt: data.receipt,
        toolExecutions: data.toolExecutions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (data.history) setHistory(data.history);

      // Update cart state if cart was modified in the tool call
      if (data.cart?.items && Array.isArray(data.cart.items)) {
        setCartItems((prev) => {
          return data.cart.items.map((newItem: any) => {
            const prevItem = prev.find(
              (p) => p.productId === newItem.productId || p.id === newItem.id
            );
            const product =
              newItem.product ||
              prevItem?.product ||
              lookupProduct(newItem.productId);

            return {
              ...newItem,
              id: newItem.id || prevItem?.id || `cart-${newItem.productId}`,
              product,
              store: newItem.store || prevItem?.store || product?.store || "nexusstore",
            };
          });
        });
      } else if (data.receipt) {
        // Order confirmed, clear cart
        setCartItems([]);
      }
    } catch (err: any) {
      console.error("Chat request failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          text: `⚠️ Error: ${err.message || "Unable to reach Raya agent service. Please check your AI API key and store bridge connection."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCartFromCard = (product: any) => {
    const store = product.store || "nexusstore";
    // Add locally to cart items for immediate feedback with full product metadata
    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1, product: i.product || product } : i
        );
      }
      return [...prev, { id: `cart-${Date.now()}`, productId: product.id, quantity: 1, store, product }];
    });

    // Send command to Raya to persist in the backend on the correct store
    handleSendMessage(`Add product "${product.name}" (ID: ${product.id}) from ${store} to my cart`);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId && i.id !== productId));
  };

  const handleCheckoutFromDrawer = () => {
    handleSendMessage(
      "Please checkout my active cart with paymentMethod: card for recipient: Jane Doe, 100 Broadway, New York, USA, 10005"
    );
  };

  const storeButtons = [
    { label: "🎧 Headphones under ₹5,000", query: "Show me headphones and audio electronics from all stores and eBay under 5000" },
    { label: "🌐 All Stores", query: "Show me the top recommended products across all stores and eBay" },
    { label: "⚡ NexusStore", query: "Show me smart apparel and electronics from NexusStore" },
    { label: "🧵 ThreadVault", query: "Show me luxury clothing and acoustic gear from ThreadVault" },
    { label: "🎮 PixelMart", query: "Show me cyberpunk streetwear and creator gear from PixelMart" },
    { label: "🛍️ eBay", query: "Show me certified tech deals and items on eBay" },
  ];

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] bg-raya-cloud bg-brand-pattern-light">
      {/* Top Navbar */}
      <RayaHeader
        cartCount={cartItems.length}
        onOpenCart={() => setCartOpen(true)}
        budget={budget}
        onSelectStore={(storeId) => {
          const store = CONNECTED_STORES[storeId];
          if (store) {
            handleSendMessage(`Show me the featured products from ${store.name}`);
          }
        }}
      />

      {/* Store Quick Filter Bar */}
      <div className="max-w-5xl w-full mx-auto px-3.5 sm:px-6 pt-3 pb-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-bold text-raya-coolGray uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-raya-blue" />
          <span>Quick Explore:</span>
        </span>
        {storeButtons.map((btn, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(btn.query)}
            disabled={loading}
            className="px-3 py-1 rounded-full bg-white hover:bg-raya-softWhite active:scale-95 border border-raya-lightGray text-raya-navy text-xs font-semibold whitespace-nowrap shadow-2xs hover:border-raya-blue/50 transition-all cursor-pointer disabled:opacity-50"
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Main Chat Flow */}
      <main className="flex-1 flex flex-col justify-between max-w-5xl w-full mx-auto relative">
        <RayaChat
          messages={messages}
          loading={loading}
          onAddToCart={handleAddToCartFromCard}
        />

        <RayaInput onSend={handleSendMessage} loading={loading} />
      </main>

      {/* Slide-out Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        total={cartTotal}
        onCheckout={handleCheckoutFromDrawer}
        onRemoveItem={handleRemoveFromCart}
        onPaymentSuccess={({ orderId, paymentId }) => {
          setCartItems([]);
          handleSendMessage(
            `Payment completed successfully via Razorpay Test Mode! Razorpay Payment ID: ${paymentId}, Order ID: ${orderId}. Please confirm my receipt and tracking.`
          );
        }}
        budget={budget}
      />
    </div>
  );
}
