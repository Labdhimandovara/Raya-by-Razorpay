"use client";

import React, { useState } from "react";
import { RayaHeader } from "@/components/raya-header";
import { RayaChat, Message } from "@/components/raya-chat";
import { RayaInput } from "@/components/raya-input";
import { CartDrawer } from "@/components/cart-drawer";

export default function RayaHome() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro-msg",
      role: "assistant",
      text: "👋 Hi! I am Raya, your autonomous shopping agent by Razorpay. I can help you discover products on NexusStore, manage your cart, and complete verified checkouts.\n\nTry asking me: \"Find backpacks or white shirts under ₹2,000\"!",
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
        text: data.text || "Here are the details from NexusStore.",
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
          text: `⚠️ Error: ${err.message || "Unable to reach Raya agent service. Please check your Gemini API key and NexusStore bridge connection."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCartFromCard = (product: any) => {
    // Add locally to cart items for immediate feedback
    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { id: `cart-${Date.now()}`, productId: product.id, quantity: 1, product }];
    });

    // Send command to Raya to persist in the backend
    handleSendMessage(`Add the product "${product.name}" (ID: ${product.id}) to my cart`);
  };

  const handleCheckoutFromDrawer = () => {
    handleSendMessage(
      "Please checkout my active cart with paymentMethod: card for recipient: Jane Doe, 100 Broadway, New York, USA, 10005"
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* Top Navbar */}
      <RayaHeader
        cartCount={cartItems.length}
        onOpenCart={() => setCartOpen(true)}
        budget={15000}
      />

      {/* Main Chat Flow */}
      <main className="flex-1 flex flex-col justify-between max-w-5xl w-full mx-auto">
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
