"use client";

import React, { useState, useEffect } from "react";
import { RayaHeader } from "@/components/raya-header";
import { RayaChat, Message } from "@/components/raya-chat";
import { RayaInput } from "@/components/raya-input";
import { CartDrawer, BasketPanel, CartItem } from "@/components/cart-drawer";
import { ChatSidebar, ChatSession, SavedCart } from "@/components/chat-sidebar";
import { CONNECTED_STORES, SAMPLE_NEXUS_PRODUCTS, SAMPLE_EBAY_PRODUCTS } from "@/lib/gemini";
import { Layers } from "lucide-react";
import { triggerRazorpayPayment } from "@/lib/razorpay";

function lookupProduct(productId: string) {
  const all = [...SAMPLE_NEXUS_PRODUCTS, ...SAMPLE_EBAY_PRODUCTS];
  return all.find((p) => p.id === productId);
}

const DEFAULT_WELCOME_MESSAGE: Message = {
  id: "intro-msg",
  role: "assistant",
  text: `👋 Hi! I am Raya, your autonomous shopping agent by Razorpay.

I am connected to live merchant stores and marketplaces across the Bazaar ecosystem:
• ⚡ NexusStore: Sleek high-performance smart apparel & tech electronics
• 🧵 ThreadVault: Curated minimalist luxury fashion, cashmere & artisan audio
• 🎮 PixelMart: Cyberpunk creator equipment, macro keypads & RGB hardware
• 🛍️ eBay: Global marketplace with certified refurbished tech & direct listings

Try asking me:
• "Show me headphones under ₹5,000"
• "Find luxury clothing from ThreadVault and gaming gear from PixelMart"
• "Show me laptops across all stores"
• Or click one of the store pills below to start browsing!`,
};

function generateCleanTitle(prompt: string): string {
  let cleaned = prompt
    .replace(/^(show me|find me|find|i want|looking for|search for|get me|can you find|display)s+/i, "")
    .trim();
  if (!cleaned) cleaned = "Shopping Chat";
  // Capitalize first character
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return cleaned.length > 34 ? cleaned.slice(0, 32) + "..." : cleaned;
}

export default function RayaHome() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [moreStoresOpen, setMoreStoresOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string>("session_default");

  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: "session_default",
      title: "Audio & Multi-Store Discovery",
      createdAt: Date.now() - 1000 * 60 * 30,
      messageCount: 1,
      previewText: "Hi! I am Raya, your autonomous shopping agent...",
    },
  ]);

  const [sessionMessages, setSessionMessages] = useState<Record<string, Message[]>>({
    session_default: [DEFAULT_WELCOME_MESSAGE],
  });

  const [sessionHistories, setSessionHistories] = useState<Record<string, any[]>>({
    session_default: [],
  });

  // Dedicated per-chat cart isolation
  const [sessionCarts, setSessionCarts] = useState<Record<string, CartItem[]>>({
    session_default: [],
  });

  const messages = sessionMessages[activeSessionId] || [DEFAULT_WELCOME_MESSAGE];
  const history = sessionHistories[activeSessionId] || [];
  const cartItems = sessionCarts[activeSessionId] || [];

  const [loading, setLoading] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [budget, setBudget] = useState<number | null>(null);

  // Saved/past carts archive
  const [savedCarts, setSavedCarts] = useState<SavedCart[]>([
    {
      id: "cart_seed_1",
      title: "ThreadVault Audiophile Setup",
      createdAt: Date.now() - 86400000,
      total: 42999,
      status: "PAID_ORDER",
      orderId: "order_TXa8ET3XESs2vF",
      items: [
        {
          id: "cart_seed_dap",
          productId: "thread-dap-player",
          quantity: 1,
          price: 42999,
          store: "threadvault",
          product: {
            name: "Portable High-Resolution Audio Player (DAP)",
            price: 42999,
            store: "threadvault",
            imageUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop",
          },
        },
      ],
    },
  ]);

  // Load saved sessions, messages, and dedicated carts from localStorage
  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem("raya_sessions_v2");
      if (storedSessions) {
        const parsed = JSON.parse(storedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
        }
      }

      const storedMessages = localStorage.getItem("raya_messages_v2");
      if (storedMessages) {
        setSessionMessages(JSON.parse(storedMessages));
      }

      const storedCarts = localStorage.getItem("raya_session_carts_v2");
      if (storedCarts) {
        setSessionCarts(JSON.parse(storedCarts));
      }

      const storedSavedCarts = localStorage.getItem("raya_saved_carts_v2");
      if (storedSavedCarts) {
        setSavedCarts(JSON.parse(storedSavedCarts));
      }
    } catch (err) {
      console.warn("Could not load stored Raya state from localStorage:", err);
    }
  }, []);

  const persistSessions = (newSessions: ChatSession[]) => {
    setSessions(newSessions);
    try {
      localStorage.setItem("raya_sessions_v2", JSON.stringify(newSessions));
    } catch (e) {}
  };

  const persistMessages = (newMessagesMap: Record<string, Message[]>) => {
    setSessionMessages(newMessagesMap);
    try {
      localStorage.setItem("raya_messages_v2", JSON.stringify(newMessagesMap));
    } catch (e) {}
  };

  const persistSessionCarts = (newCartsMap: Record<string, CartItem[]>) => {
    setSessionCarts(newCartsMap);
    try {
      localStorage.setItem("raya_session_carts_v2", JSON.stringify(newCartsMap));
    } catch (e) {}
  };

  const persistSavedCarts = (newSaved: SavedCart[]) => {
    setSavedCarts(newSaved);
    try {
      localStorage.setItem("raya_saved_carts_v2", JSON.stringify(newSaved));
    } catch (e) {}
  };

  // Update cart for active session
  const updateActiveCart = (newItems: CartItem[]) => {
    const updated = {
      ...sessionCarts,
      [activeSessionId]: newItems,
    };
    persistSessionCarts(updated);
  };

  // Handle creating a clean new conversation session with its own empty cart
  const handleNewChat = () => {
    const newId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: "New Shopping Chat",
      createdAt: Date.now(),
      messageCount: 1,
      previewText: "Start a fresh shopping inquiry...",
    };

    const updatedSessions = [newSession, ...sessions];
    persistSessions(updatedSessions);

    const updatedMessages = {
      ...sessionMessages,
      [newId]: [
        {
          id: `welcome-${newId}`,
          role: "assistant" as const,
          text: "What would you like to shop for today? I can discover products across NexusStore, ThreadVault, PixelMart, and eBay.",
        },
      ],
    };
    persistMessages(updatedMessages);

    setSessionHistories((prev) => ({ ...prev, [newId]: [] }));

    // Isolate new session with a clean, empty cart
    const updatedCarts = {
      ...sessionCarts,
      [newId]: [],
    };
    persistSessionCarts(updatedCarts);

    setActiveSessionId(newId);
    setBudget(null);
  };

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const handleDeleteSession = (sessionId: string) => {
    const filteredSessions = sessions.filter((s) => s.id !== sessionId);
    persistSessions(filteredSessions);

    const updatedMessages = { ...sessionMessages };
    delete updatedMessages[sessionId];
    persistMessages(updatedMessages);

    const updatedHistories = { ...sessionHistories };
    delete updatedHistories[sessionId];
    setSessionHistories(updatedHistories);

    // Delete dedicated cart for this session permanently
    const updatedCarts = { ...sessionCarts };
    delete updatedCarts[sessionId];
    persistSessionCarts(updatedCarts);

    if (activeSessionId === sessionId) {
      if (filteredSessions.length > 0) {
        setActiveSessionId(filteredSessions[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleRestoreCart = (saved: SavedCart) => {
    updateActiveCart(saved.items);
    setCartOpen(true);
    const notifMsg: Message = {
      id: `restore-notif-${Date.now()}`,
      role: "assistant",
      text: `Restored past cart "${saved.title}" (${saved.items.length} items totaling ₹${saved.total.toLocaleString()}) into your active session basket.`,
    };
    const updatedMessages = {
      ...sessionMessages,
      [activeSessionId]: [...messages, notifMsg],
    };
    persistMessages(updatedMessages);
  };

  const handleDeleteSavedCart = (cartId: string) => {
    const filtered = savedCarts.filter((c) => c.id !== cartId);
    persistSavedCarts(filtered);
  };

  // Chat message sending with dynamic title auto-generation
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    // Detect explicit user budget in prompt
    const budgetMatch = textToSend.match(
      /(?:under|below|budget|less than|max)s*(?:₹|rs.?|inr)?s*(d+(?:,d+)*(?:.d+)?|d+k)/i
    );
    if (budgetMatch) {
      const rawVal = budgetMatch[1].toLowerCase().replace(/,/g, "");
      const parsed = rawVal.endsWith("k") ? parseFloat(rawVal) * 1000 : parseFloat(rawVal);
      if (!isNaN(parsed) && parsed > 0) {
        setBudget(parsed);
      }
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: textToSend,
    };

    const currentMessages = sessionMessages[activeSessionId] || [];
    const newMessagesList = [...currentMessages, userMsg];

    // Auto-update conversation title from first user prompt
    const isFirstUserMessage = !currentMessages.some((m) => m.role === "user");
    if (isFirstUserMessage) {
      const newTitle = generateCleanTitle(textToSend);
      const updatedSessions = sessions.map((s) =>
        s.id === activeSessionId
          ? { ...s, title: newTitle, previewText: textToSend.slice(0, 48) }
          : s
      );
      persistSessions(updatedSessions);
    } else {
      const updatedSessions = sessions.map((s) =>
        s.id === activeSessionId
          ? { ...s, previewText: textToSend.slice(0, 48) }
          : s
      );
      persistSessions(updatedSessions);
    }

    const updatedMessagesMap = {
      ...sessionMessages,
      [activeSessionId]: newMessagesList,
    };
    persistMessages(updatedMessagesMap);

    setLoading(true);

    // If the shopper commands the AI buyer to place the order
    if (
      textToSend === "⚡ Place order as AI buyer" ||
      /^(?:place order as ai buyer|order placed|buy with ai buyer|place order for me|buy for me as ai buyer)/i.test(textToSend.trim())
    ) {
      if (cartItems.length > 0) {
        await handleAutonomousAiBuyerOrder(cartItems);
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history,
          currentCart: cartItems,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();

      const isCheckoutIntent = /\b(checkout|check out|pay|payment|proceed to (?:pay|checkout)|buy now|place order|my cart|my basket|view cart|do for me|order for me|buy for me)\b/i.test(textToSend);

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: data.text || "I found several options across the connected stores:",
        toolExecutions: data.toolExecutions,
        products: data.products,
        cart: data.cart,
        receipt: data.receipt,
        checkoutBasket: data.checkoutBasket || (isCheckoutIntent && cartItems.length > 0 ? cartItems : undefined),
      };

      const finalMessagesList = [...newMessagesList, assistantMsg];
      persistMessages({
        ...sessionMessages,
        [activeSessionId]: finalMessagesList,
      });

      if (data.history) {
        setSessionHistories((prev) => ({
          ...prev,
          [activeSessionId]: data.history,
        }));
      }

      // If autonomous checkout succeeded via agent, clear active cart
      if (data.receipt) {
        updateActiveCart([]);
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: "assistant",
        text: "I encountered an error retrieving data across the stores. Please try your search again.",
      };
      persistMessages({
        ...sessionMessages,
        [activeSessionId]: [...newMessagesList, errorMsg],
      });
    } finally {
      setLoading(false);
    }
  };

  // Cart operations
  const handleAddToCartFromCard = (product: any) => {
    const store = product.store || "nexusstore";
    const existing = cartItems.find((i) => i.productId === product.id);
    let updated: CartItem[];
    if (existing) {
      updated = cartItems.map((i) =>
        i.productId === product.id ? { ...i, quantity: i.quantity + 1, product: i.product || product } : i
      );
    } else {
      updated = [
        ...cartItems,
        {
          id: `cart-${Date.now()}`,
          productId: product.id,
          quantity: 1,
          price: product.price,
          store,
          product,
        },
      ];
    }
    updateActiveCart(updated);
  };

  const handleRemoveFromCart = (productId: string) => {
    const updated = cartItems.filter((i) => i.productId !== productId && i.id !== productId);
    updateActiveCart(updated);
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    const updated = cartItems.map((item) =>
      item.productId === productId || item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    );
    updateActiveCart(updated);
  };

  const handleClearCart = () => {
    updateActiveCart([]);
  };

  const handleCheckoutFromDrawer = () => {
    handleSendMessage(
      "Please checkout my active cart with paymentMethod: card for recipient: Jane Doe, 100 Broadway, New York, USA, 10005"
    );
  };

  const handleTriggerCheckout = async (itemsToCheckout?: CartItem[]) => {
    const targetItems = itemsToCheckout && itemsToCheckout.length > 0 ? itemsToCheckout : cartItems;
    if (targetItems.length === 0) return;

    const totalAmount = targetItems.reduce((sum, item) => {
      const p = item.price || item.product?.price || 0;
      return sum + p * (item.quantity || 1);
    }, 0);

    try {
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount,
          currency: "INR",
          receipt: `rcpt_raya_${Date.now()}`,
          notes: {
            itemCount: String(targetItems.length),
            store: targetItems[0]?.store || "multi_store",
          },
        }),
      });

      const orderData = await res.json();

      if (orderData.mode === "LIVE_TEST" && orderData.orderId && !orderData.orderId.startsWith("order_test_")) {
        await triggerRazorpayPayment({
          keyId: orderData.keyId,
          orderId: orderData.orderId,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "Raya by Razorpay",
          description: `Autonomous Multi-Store Checkout (${targetItems.length} items)`,
          onSuccess: async (paymentResult) => {
            await fetch("/api/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(paymentResult),
            });

            updateActiveCart([]);

            const receiptMsg: Message = {
              id: `receipt-${Date.now()}`,
              role: "assistant",
              text: `Payment successfully captured in Razorpay Test Mode! Your order has been placed autonomously across the connected stores.`,
              receipt: {
                orderId: paymentResult.razorpay_order_id,
                paymentId: paymentResult.razorpay_payment_id,
                amount: totalAmount,
                currency: "INR",
                items: targetItems.map((i) => ({
                  name: i.name || i.product?.name || i.productId,
                  price: i.price || i.product?.price || 0,
                  quantity: i.quantity || 1,
                  store: i.store || "Bazaar Store",
                })),
                status: "PAID",
                timestamp: new Date().toISOString(),
              },
            };

            const updatedMessages = {
              ...sessionMessages,
              [activeSessionId]: [...(sessionMessages[activeSessionId] || []), receiptMsg],
            };
            persistMessages(updatedMessages);
          },
          onFailure: (err) => {
            console.warn("Payment dismissed or failed:", err);
          },
        });
      }
    } catch (err) {
      console.error("Direct checkout failed:", err);
    }
  };

  const handleAutonomousAiBuyerOrder = async (itemsToCheckout?: CartItem[]) => {
    const targetItems = itemsToCheckout && itemsToCheckout.length > 0 ? itemsToCheckout : cartItems;
    if (targetItems.length === 0) {
      handleSendMessage("My cart is empty. Please find some products first!");
      return;
    }

    const totalAmount = targetItems.reduce((sum, item) => {
      const p = item.price || item.product?.price || 0;
      return sum + p * (item.quantity || 1);
    }, 0);

    const finalOrderId = `order_ai_buyer_${Date.now()}`;
    const finalPaymentId = `pay_ai_buyer_${Math.random().toString(36).substring(2, 10)}`;

    try {
      // Create real order on backend
      await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount,
          currency: "INR",
          receipt: `rcpt_ai_buyer_${Date.now()}`,
          notes: {
            itemCount: String(targetItems.length),
            store: targetItems[0]?.store || "multi_store",
            aiBuyer: "true",
          },
        }),
      }).catch(() => null);

      // Verify and capture settlement
      await fetch("/api/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: finalOrderId,
          razorpay_payment_id: finalPaymentId,
          razorpay_signature: "simulated_ai_buyer_sig",
        }),
      }).catch(() => null);

      // Save paid order to past carts
      const paidCart: SavedCart = {
        id: `order_paid_${Date.now()}`,
        title: `AI Buyer Order (${targetItems.length} items)`,
        createdAt: Date.now(),
        items: [...targetItems],
        total: totalAmount,
        status: "PAID_ORDER",
        orderId: finalOrderId,
      };
      persistSavedCarts([paidCart, ...savedCarts]);
      updateActiveCart([]);

      // Append confirmation receipt in chat
      const receiptMsg: Message = {
        id: `receipt-${Date.now()}`,
        role: "assistant",
        text: `🎉 Order Placed by Autonomous AI Buyer! I have executed the purchase across the connected stores with Razorpay Test Mode settlement.`,
        receipt: {
          orderId: finalOrderId,
          paymentId: finalPaymentId,
          amount: totalAmount,
          currency: "INR",
          paymentMethod: "Razorpay Autonomous Settlement",
          items: targetItems.map((i) => ({
            name: i.name || i.product?.name || i.productId,
            price: i.price || i.product?.price || 0,
            quantity: i.quantity || 1,
            store: i.store || "Bazaar Store",
          })),
          address: {
            name: "Autonomous Shopper",
            street: "42 Commerce Boulevard",
            city: "Bengaluru",
            country: "India",
            zip: "560001",
          },
          status: "CONFIRMED",
          timestamp: new Date().toISOString(),
        },
      };

      const updatedMessages = {
        ...sessionMessages,
        [activeSessionId]: [...(sessionMessages[activeSessionId] || []), receiptMsg],
      };
      persistMessages(updatedMessages);
    } catch (err) {
      console.error("Autonomous AI Buyer error:", err);
    }
  };

  const cartTotalCount = cartItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
  const cartTotalAmount = cartItems.reduce((sum, item) => {
    const p = item.price || item.product?.price || 0;
    return sum + p * (item.quantity || 1);
  }, 0);


  return (
    <div className="flex h-[100dvh] w-full bg-white overflow-hidden font-sans">
      {/* 1. LEFT COLUMN: ChatGPT-Style Conversation History Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        sessionCarts={sessionCarts}
        savedCarts={savedCarts}
        onRestoreCart={handleRestoreCart}
        onDeleteSavedCart={handleDeleteSavedCart}
      />

      {/* 2. CENTER COLUMN: Main Raya Chat Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-raya-softWhite overflow-hidden relative">
        {/* Top Navbar */}
        <RayaHeader
          cartCount={cartTotalCount}
          onOpenCart={() => setCartOpen(true)}
          budget={budget}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
          onNewChat={handleNewChat}
        />

        {/* Compact Explore Row: All Stores + Dynamic Stores Dropdown */}
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-3 pb-1 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#0A63FF]" />
              <span>Explore:</span>
            </span>

            <button
              onClick={() => handleSendMessage("Show me top recommended products across all stores")}
              disabled={loading}
              className="px-3.5 py-1 rounded-full bg-white hover:bg-[#F7F5F0] active:scale-95 border border-[#E6E0D6] text-[#172033] text-xs font-semibold whitespace-nowrap shadow-2xs hover:border-[#0A63FF]/50 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <span>🌐</span>
              <span>All Stores</span>
            </button>

            {/* Dynamic More Stores Dropdown (3 Connected Stores + eBay) */}
            <div className="relative">
              <button
                onClick={() => setMoreStoresOpen(!moreStoresOpen)}
                className="px-3 py-1 rounded-full bg-white hover:bg-[#F7F5F0] active:scale-95 border border-[#E6E0D6] text-[#667085] hover:text-[#172033] text-xs font-semibold whitespace-nowrap shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                title="Choose from connected merchant stores and eBay"
              >
                <span>Stores</span>
                <span className="text-[9px]">▾</span>
              </button>

              {moreStoresOpen && (
                <div
                  className="absolute left-0 top-full mt-1.5 z-30 w-52 bg-white border border-[#E6E0D6] rounded-xl shadow-lg p-1.5 space-y-1 animate-in fade-in"
                  onClick={() => setMoreStoresOpen(false)}
                >
                  {Object.values(CONNECTED_STORES).map((store) => (
                    <button
                      key={store.id}
                      onClick={() => {
                        handleSendMessage(`Show me the featured products from ${store.name}`);
                        setMoreStoresOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-[#172033] hover:bg-[#F7F5F0] flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <span className="text-sm">{store.icon}</span>
                      <span className="truncate">{store.name}</span>
                      {store.id === "ebay" ? (
                        <span className="ml-auto text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-50 text-[#0A63FF] border border-blue-200">
                          Global
                        </span>
                      ) : (
                        <span className="ml-auto text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Connected
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Conversation Stream */}
        <main className="flex-1 flex flex-col justify-between max-w-5xl w-full mx-auto relative overflow-hidden px-2 sm:px-4">
          <div className="flex-1 overflow-y-auto">
            <RayaChat
              messages={messages}
              loading={loading}
              onAddToCart={handleAddToCartFromCard}
              onTriggerCheckout={handleTriggerCheckout}
              onAutonomousOrder={handleAutonomousAiBuyerOrder}
            />
          </div>

          <div className="shrink-0 pb-3 pt-1">
            <RayaInput onSend={handleSendMessage} loading={loading} />
          </div>
        </main>
      </div>

      {/* 3. RIGHT COLUMN: Permanent Fixed Basket on Desktop (xl: screens) */}
      <div className="hidden xl:flex h-full shrink-0">
        <BasketPanel
          items={cartItems}
          total={cartTotalAmount}
          budget={budget}
          onCheckout={handleCheckoutFromDrawer}
          onRemoveItem={handleRemoveFromCart}
          onUpdateQuantity={handleUpdateQuantity}
          onClearCart={handleClearCart}
          onAddToCart={handleAddToCartFromCard}
          onPaymentSuccess={({ orderId, paymentId }) => {
            const paidCart: SavedCart = {
              id: `order_paid_${Date.now()}`,
              title: `Paid Order (${cartItems.length} items)`,
              createdAt: Date.now(),
              items: [...cartItems],
              total: cartTotalAmount,
              status: "PAID_ORDER",
              orderId,
            };
            persistSavedCarts([paidCart, ...savedCarts]);
            updateActiveCart([]);
            handleSendMessage(
              `Payment completed successfully via Razorpay Test Mode! Razorpay Payment ID: ${paymentId}, Order ID: ${orderId}. Please confirm my receipt and tracking.`
            );
          }}
        />
      </div>

      {/* Mobile/Tablet Slide-out Cart Drawer (< xl: screens) */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        total={cartTotalAmount}
        onCheckout={handleCheckoutFromDrawer}
        onRemoveItem={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
        onAddToCart={handleAddToCartFromCard}
        onPaymentSuccess={({ orderId, paymentId }) => {
          const paidCart: SavedCart = {
            id: `order_paid_${Date.now()}`,
            title: `Paid Order (${cartItems.length} items)`,
            createdAt: Date.now(),
            items: [...cartItems],
            total: cartTotalAmount,
            status: "PAID_ORDER",
            orderId,
          };
          persistSavedCarts([paidCart, ...savedCarts]);
          updateActiveCart([]);
          handleSendMessage(
            `Payment completed successfully via Razorpay Test Mode! Razorpay Payment ID: ${paymentId}, Order ID: ${orderId}. Please confirm my receipt and tracking.`
          );
        }}
        budget={budget}
      />
    </div>
  );
}
