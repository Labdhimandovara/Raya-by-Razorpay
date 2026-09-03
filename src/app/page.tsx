"use client";

import React, { useState, useEffect } from "react";
import { RayaHeader } from "@/components/raya-header";
import { RayaChat, Message } from "@/components/raya-chat";
import { RayaInput } from "@/components/raya-input";
import { CartDrawer, BasketPanel, CartItem } from "@/components/cart-drawer";
import { ChatSidebar, ChatSession, SavedCart } from "@/components/chat-sidebar";
import { CONNECTED_STORES, SAMPLE_NEXUS_PRODUCTS, SAMPLE_EBAY_PRODUCTS } from "@/lib/gemini";
import { Layers } from "lucide-react";

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

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history,
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: data.text || "I found several options across the connected stores:",
        toolExecutions: data.toolExecutions,
        products: data.products,
        cart: data.cart,
        receipt: data.receipt,
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

      // Sync backend cart response if returned
      if (data.cart?.items && Array.isArray(data.cart.items)) {
        updateActiveCart(data.cart.items);
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

  const cartTotalCount = cartItems.reduce((acc, it) => acc + (it.quantity || 1), 0);
  const cartTotalAmount = cartItems.reduce((sum, item) => {
    const p = item.price || item.product?.price || 0;
    return sum + p * (item.quantity || 1);
  }, 0);

  const storeButtons = [
    { label: "🎧 Headphones under ₹5,000", query: "Show me headphones and audio electronics from all stores under 5000" },
    { label: "💻 Laptops", query: "Show me laptops across all stores" },
    { label: "🌐 All Stores", query: "Show me top recommended products across all stores" },
    { label: "⚡ NexusStore", query: "Show me smart apparel and tech from NexusStore" },
    { label: "🧵 ThreadVault", query: "Show me luxury clothing and acoustic gear from ThreadVault" },
    { label: "🎮 PixelMart", query: "Show me creator gaming rigs and cyberpunk gear from PixelMart" },
    { label: "🛍️ eBay", query: "Show me certified refurbished tech deals on eBay" },
  ];

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
          onSelectStore={(storeId) => {
            const store = CONNECTED_STORES[storeId];
            if (store) {
              handleSendMessage(`Show me the featured products from ${store.name}`);
            }
          }}
        />

        {/* Store Quick Filter Bar */}
        <div className="w-full max-w-5xl mx-auto px-3.5 sm:px-6 pt-2 pb-1 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[11px] font-bold text-raya-coolGray uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-raya-blue" />
            <span>Explore:</span>
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

        {/* Main Conversation Stream */}
        <main className="flex-1 flex flex-col justify-between max-w-5xl w-full mx-auto relative overflow-hidden px-2 sm:px-4">
          <div className="flex-1 overflow-y-auto">
            <RayaChat
              messages={messages}
              loading={loading}
              onAddToCart={handleAddToCartFromCard}
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
