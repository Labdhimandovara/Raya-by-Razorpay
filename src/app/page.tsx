"use client";

import React, { useState, useEffect } from "react";
import { RayaHeader } from "@/components/raya-header";
import { RayaChat, Message } from "@/components/raya-chat";
import { RayaInput } from "@/components/raya-input";
import { CartDrawer } from "@/components/cart-drawer";
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
• "Show me certified refurbished tech deals on eBay"
• Or click one of the store pills below to start browsing!`,
};

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

  const messages = sessionMessages[activeSessionId] || [DEFAULT_WELCOME_MESSAGE];
  const history = sessionHistories[activeSessionId] || [];

  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [budget, setBudget] = useState<number | null>(null);

  // Seed initial past carts for instant re-order/restoration demo
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
            id: "thread-dap-player",
            name: "Portable High-Resolution Audio Player (DAP)",
            price: 42999,
            store: "threadvault",
            storeName: "ThreadVault",
            imageUrl: "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop",
          },
        },
      ],
    },
    {
      id: "cart_seed_2",
      title: "Nexus Techwear Companion Basket",
      createdAt: Date.now() - 86400000 * 2,
      total: 10198,
      status: "ACTIVE_DRAFT",
      items: [
        {
          id: "cart_seed_jacket",
          productId: "nx-smart-heated-techwear-jacket",
          quantity: 1,
          price: 7999,
          store: "nexusstore",
          product: {
            id: "nx-smart-heated-techwear-jacket",
            name: "Nexus Smart Heated Techwear Bomber Jacket",
            price: 7999,
            store: "nexusstore",
            storeName: "NexusStore",
            imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop",
          },
        },
        {
          id: "cart_seed_pwb",
          productId: "nx-magnetic-fast-charge-powerbank",
          quantity: 1,
          price: 2199,
          store: "nexusstore",
          product: {
            id: "nx-magnetic-fast-charge-powerbank",
            name: "Nexus MagVolt 10000mAh Magnetic Powerbank",
            price: 2199,
            store: "nexusstore",
            storeName: "NexusStore",
            imageUrl: "https://images.unsplash.com/photo-1586253634026-8cb574908d1e?w=600&auto=format&fit=crop",
          },
        },
      ],
    },
  ]);

  // Load saved state from localStorage if present
  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem("raya_sessions");
      if (storedSessions) {
        const parsed = JSON.parse(storedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) setSessions(parsed);
      }
      const storedCarts = localStorage.getItem("raya_saved_carts");
      if (storedCarts) {
        const parsed = JSON.parse(storedCarts);
        if (Array.isArray(parsed) && parsed.length > 0) setSavedCarts(parsed);
      }
    } catch {}
  }, []);

  // Save changes to localStorage
  const persistSessions = (newSessions: ChatSession[]) => {
    setSessions(newSessions);
    try {
      localStorage.setItem("raya_sessions", JSON.stringify(newSessions));
    } catch {}
  };

  const persistCarts = (newCarts: SavedCart[]) => {
    setSavedCarts(newCarts);
    try {
      localStorage.setItem("raya_saved_carts", JSON.stringify(newCarts));
    } catch {}
  };

  const cartTotal = cartItems.reduce((acc, item) => {
    const productMeta = item.product || lookupProduct(item.productId);
    const price = productMeta?.price || item.price || 0;
    const qty = item.quantity || 1;
    return acc + price * qty;
  }, 0);

  // Automatically record a cart snapshot when items are added
  useEffect(() => {
    if (cartItems.length > 0) {
      const currentCartSnap: SavedCart = {
        id: `cart_active_${activeSessionId}`,
        title: cartItems[0]?.product?.name
          ? `${cartItems[0].product.name.slice(0, 24)}... (${cartItems.length} items)`
          : `Active Cart (${cartItems.length} items)`,
        createdAt: Date.now(),
        items: cartItems,
        total: cartTotal,
        status: "ACTIVE_DRAFT",
      };

      persistCarts([
        currentCartSnap,
        ...savedCarts.filter((c) => c.id !== `cart_active_${activeSessionId}`),
      ]);
    }
  }, [cartItems, cartTotal, activeSessionId]);

  // Handle + New Chat Session
  const handleNewChat = () => {
    const newId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: "New Shopping Chat",
      createdAt: Date.now(),
      messageCount: 1,
      previewText: "Starting new search session...",
    };

    const updatedSessions = [newSession, ...sessions];
    persistSessions(updatedSessions);

    setSessionMessages((prev) => ({
      ...prev,
      [newId]: [DEFAULT_WELCOME_MESSAGE],
    }));

    setSessionHistories((prev) => ({
      ...prev,
      [newId]: [],
    }));

    setActiveSessionId(newId);
  };

  // Handle Select Session
  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    if (!sessionMessages[sessionId]) {
      setSessionMessages((prev) => ({
        ...prev,
        [sessionId]: [DEFAULT_WELCOME_MESSAGE],
      }));
    }
  };

  // Handle Delete Session
  const handleDeleteSession = (sessionId: string) => {
    const filtered = sessions.filter((s) => s.id !== sessionId);
    persistSessions(filtered);
    if (activeSessionId === sessionId) {
      if (filtered.length > 0) {
        setActiveSessionId(filtered[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  // Handle Restore Past Cart
  const handleRestoreCart = (cart: SavedCart) => {
    setCartItems(cart.items);
    setCartOpen(true);

    // Append notification in chat
    const noticeMsg: Message = {
      id: `notice-${Date.now()}`,
      role: "assistant",
      text: `🛒 Restored "${cart.title}" (${cart.items.length} items, ₹${cart.total.toLocaleString()}) to your active cart. You can now adjust quantities, add new items, or proceed to checkout.`,
    };

    setSessionMessages((prev) => ({
      ...prev,
      [activeSessionId]: [...(prev[activeSessionId] || []), noticeMsg],
    }));
  };

  // Handle Delete Saved Cart
  const handleDeleteSavedCart = (cartId: string) => {
    const filtered = savedCarts.filter((c) => c.id !== cartId);
    persistCarts(filtered);
  };

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || loading) return;

    // Detect dynamic budget constraints
    const budgetMatch = userText.match(
      /(?:under|below|less than|budget)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)*(?:\.\d+)?|\d+k)/i
    );
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

    // Update session title if this is the first user message
    const currentSession = sessions.find((s) => s.id === activeSessionId);
    if (currentSession && (currentSession.title === "New Shopping Chat" || currentSession.messageCount <= 1)) {
      const updatedSessions = sessions.map((s) =>
        s.id === activeSessionId
          ? {
              ...s,
              title: userText.slice(0, 30) + (userText.length > 30 ? "..." : ""),
              previewText: userText,
              messageCount: s.messageCount + 1,
            }
          : s
      );
      persistSessions(updatedSessions);
    }

    setSessionMessages((prev) => ({
      ...prev,
      [activeSessionId]: [...(prev[activeSessionId] || []), newMsg],
    }));
    setLoading(true);

    try {
      const currentHist = sessionHistories[activeSessionId] || [];
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: currentHist,
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

      setSessionMessages((prev) => ({
        ...prev,
        [activeSessionId]: [...(prev[activeSessionId] || []), assistantMsg],
      }));

      if (data.history) {
        setSessionHistories((prev) => ({
          ...prev,
          [activeSessionId]: data.history,
        }));
      }

      // Update cart state if modified
      if (data.cart?.items && Array.isArray(data.cart.items)) {
        setCartItems((prev) => {
          return data.cart.items.map((newItem: any) => {
            const prevItem = prev.find(
              (p) => p.productId === newItem.productId || p.id === newItem.id
            );
            const product =
              newItem.product || prevItem?.product || lookupProduct(newItem.productId);

            return {
              ...newItem,
              id: newItem.id || prevItem?.id || `cart-${newItem.productId}`,
              product,
              store: newItem.store || prevItem?.store || product?.store || "nexusstore",
            };
          });
        });
      } else if (data.receipt) {
        // Save as paid order in savedCarts
        const paidSnap: SavedCart = {
          id: `order_${Date.now()}`,
          title: `Completed Order (${cartItems.length} items)`,
          createdAt: Date.now(),
          items: [...cartItems],
          total: cartTotal,
          status: "PAID_ORDER",
          orderId: data.receipt.orderId || `order_${Math.random().toString(36).substring(2, 9)}`,
        };
        persistCarts([paidSnap, ...savedCarts]);
        setCartItems([]);
      }
    } catch (err: any) {
      console.error("Chat request failed:", err);
      setSessionMessages((prev) => ({
        ...prev,
        [activeSessionId]: [
          ...(prev[activeSessionId] || []),
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            text: `⚠️ Error: ${err.message || "Unable to reach Raya agent service. Please check your AI API key and store bridge connection."}`,
          },
        ],
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCartFromCard = (product: any) => {
    const store = product.store || "nexusstore";
    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1, product: i.product || product } : i
        );
      }
      return [...prev, { id: `cart-${Date.now()}`, productId: product.id, quantity: 1, store, product }];
    });

    handleSendMessage(`Add product "${product.name}" (ID: ${product.id}) from ${store} to my cart`);
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId && i.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId || item.id === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const handleClearCart = () => {
    setCartItems([]);
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
    <div className="flex h-[100dvh] w-full bg-raya-cloud bg-brand-pattern-light overflow-hidden font-sans">
      {/* ChatGPT / Antigravity Style Left Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        savedCarts={savedCarts}
        onRestoreCart={handleRestoreCart}
        onDeleteSavedCart={handleDeleteSavedCart}
      />

      {/* Main Chat Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <RayaHeader
          cartCount={cartItems.length}
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

        {/* Main Chat Flow */}
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

        {/* Slide-out Cart Drawer */}
        <CartDrawer
          isOpen={cartOpen}
          onClose={() => setCartOpen(false)}
          items={cartItems}
          total={cartTotal}
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
              total: cartTotal,
              status: "PAID_ORDER",
              orderId,
            };
            persistCarts([paidCart, ...savedCarts]);
            setCartItems([]);
            handleSendMessage(
              `Payment completed successfully via Razorpay Test Mode! Razorpay Payment ID: ${paymentId}, Order ID: ${orderId}. Please confirm my receipt and tracking.`
            );
          }}
          budget={budget}
        />
      </div>
    </div>
  );
}
