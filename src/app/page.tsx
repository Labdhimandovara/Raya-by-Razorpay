"use client";

import React, { useState } from "react";
import { RayaHeader } from "@/components/raya-header";
import { RayaChat, Message } from "@/components/raya-chat";
import { RayaInput } from "@/components/raya-input";
import { CartDrawer } from "@/components/cart-drawer";
import { CONNECTED_STORES } from "@/lib/gemini";
import { Sparkles, Layers } from "lucide-react";

export default function RayaHome() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro-msg",
      role: "assistant",
      text: `👋 Hi! I am Raya, your autonomous shopping agent by Razorpay.

I am connected to 3 live e-commerce stores across the Bazaar ecosystem:
• ⚡ **NexusStore**: Sleek high-performance smart apparel & tech electronics
• 🧵 **ThreadVault**: Curated minimalist luxury fashion, Mongolian cashmere & artisan audio
• 🎮 **PixelMart**: Cyberpunk creator equipment, macro keypads & RGB hardware

Try asking me:
• *"Find luxury sweaters from ThreadVault and RGB desk gear from PixelMart"*
• *"Show me the best techwear jackets across all stores under ₹5,000"*
• Or click one of the store pills below to start browsing!`,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const cartTotal = cartItems.reduce((acc, item) => {
    const price = item.product?.price || item.price || 0;
    const qty = item.quantity || 1;
    return acc + price * qty;
  }, 0);

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || loading) return;

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
      if (data.cart?.items) {
        setCartItems(data.cart.items);
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
    // Add locally to cart items for immediate feedback
    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { id: `cart-${Date.now()}`, productId: product.id, quantity: 1, store, product }];
    });

    // Send command to Raya to persist in the backend on the correct store
    handleSendMessage(`Add product "${product.name}" (ID: ${product.id}) from ${store} to my cart`);
  };

  const handleCheckoutFromDrawer = () => {
    handleSendMessage(
      "Please checkout my active cart with paymentMethod: card for recipient: Jane Doe, 100 Broadway, New York, USA, 10005"
    );
  };

  const storeButtons = [
    { label: "🌐 All 3 Stores", query: "Show me the top recommended products across all 3 stores" },
    { label: "⚡ NexusStore", query: "Show me smart apparel and electronics from NexusStore" },
    { label: "🧵 ThreadVault", query: "Show me luxury clothing and acoustic gear from ThreadVault" },
    { label: "🎮 PixelMart", query: "Show me cyberpunk streetwear and creator gear from PixelMart" },
  ];

  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh] bg-raya-cloud bg-brand-pattern-light">
      {/* Top Navbar */}
      <RayaHeader
        cartCount={cartItems.length}
        onOpenCart={() => setCartOpen(true)}
        budget={15000}
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
      />
    </div>
  );
}
