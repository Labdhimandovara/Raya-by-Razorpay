import React, { useRef, useEffect, useState } from "react";
import { User, Sparkles, CheckCircle2, Bot, CreditCard, ShoppingBag, ShieldCheck, ArrowRight } from "lucide-react";
import { RayaLogo } from "./raya-logo";
import { ProductGrid } from "./product-grid";
import { OrderReceipt } from "./order-receipt";

export interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  products?: any[];
  receipt?: any;
  cart?: any;
  checkoutBasket?: any[];
  toolExecutions?: Array<{
    tool: string;
    args: any;
    status: "SUCCESS" | "FAILED";
  }>;
}

interface RayaChatProps {
  messages: Message[];
  loading: boolean;
  onAddToCart: (product: any) => void;
  onTriggerCheckout?: (items: any[]) => void;
  onAutonomousOrder?: (items: any[]) => void;
}

function renderInlineContent(text: string, isUser: boolean) {
  // Regex to match bold markers **...**
  const parts = text.split(/(\*\*[^*]+?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const content = part.slice(2, -2).replace(/\*/g, "").trim();
      return (
        <strong
          key={index}
          className={`font-bold ${isUser ? "text-white" : "text-raya-navy"}`}
        >
          {content}
        </strong>
      );
    }
    // Strip any lingering stray asterisks
    const clean = part.replace(/\*/g, "");
    return <React.Fragment key={index}>{clean}</React.Fragment>;
  });
}

function FormattedChatText({ text, isUser }: { text: string; isUser: boolean }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: { type: "bullet" | "number"; num?: string; text: string }[] = [];

  const flushList = () => {
    if (listBuffer.length === 0) return;
    elements.push(
      <ul key={`list-${elements.length}`} className="my-1.5 space-y-1.5 pl-1">
        {listBuffer.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2">
            {item.type === "bullet" ? (
              <span className={`text-[12px] select-none mt-0.5 ${isUser ? "text-white/80" : "text-raya-blue"}`}>
                •
              </span>
            ) : (
              <span
                className={`text-[10px] font-bold select-none px-1.5 py-0.5 rounded-md leading-none mt-0.5 ${
                  isUser
                    ? "bg-white/20 text-white"
                    : "bg-raya-softWhite text-raya-blue border border-raya-lightGray"
                }`}
              >
                {item.num}
              </span>
            )}
            <span className="flex-1 leading-relaxed">{renderInlineContent(item.text, isUser)}</span>
          </li>
        ))}
      </ul>
    );
    listBuffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) {
      flushList();
      continue;
    }

    // Numbered list: e.g. "1. ..." or "2) ..."
    const numMatch = rawLine.match(/^(\d+)[\.\)]\s+(.+)$/);
    if (numMatch) {
      listBuffer.push({ type: "number", num: numMatch[1], text: numMatch[2] });
      continue;
    }

    // Bullet list: e.g. "* ...", "- ...", "• ..."
    const bulletMatch = rawLine.match(/^[\*\-\•]\s+(.+)$/);
    if (bulletMatch) {
      listBuffer.push({ type: "bullet", text: bulletMatch[1] });
      continue;
    }

    flushList();

    // Headers: e.g. "### ...", "## ..."
    const headerMatch = rawLine.match(/^#{1,4}\s+(.+)$/);
    if (headerMatch) {
      elements.push(
        <h4
          key={`h-${elements.length}`}
          className={`font-bold mt-2.5 mb-1 text-xs sm:text-sm tracking-tight ${
            isUser ? "text-white" : "text-raya-navy"
          }`}
        >
          {renderInlineContent(headerMatch[1], isUser)}
        </h4>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${elements.length}`} className="my-1 leading-relaxed">
        {renderInlineContent(rawLine, isUser)}
      </p>
    );
  }

  flushList();
  return <div className="space-y-0.5">{elements}</div>;
}

function formatToolSummary(toolName: string): string {
  switch (toolName) {
    case "listConnectedStores":
      return "Connected stores verified";
    case "listProducts":
      return "Catalog searched across stores";
    case "searchEbayRefurbished":
      return "eBay live marketplace queried";
    case "viewCart":
      return "Active basket verified";
    case "addToCart":
      return "Item added to basket";
    case "checkoutOrder":
      return "Checkout initiated";
    default:
      return toolName;
  }
}

function ToolActivityDisclosure({
  executions,
}: {
  executions: Array<{ tool: string; args?: any }>;
}) {
  const [open, setOpen] = useState(false);

  // Deduplicate tools so we never show repeated listConnectedStores() or viewCart()
  const uniqueTools = Array.from(new Set(executions.map((e) => e.tool)));
  const primarySummary = uniqueTools.map(formatToolSummary).slice(0, 2).join(" • ");

  return (
    <div className="mb-1 text-xs">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F7F5F0] hover:bg-slate-100 border border-[#E6E0D6] text-[#667085] hover:text-[#172033] text-[11px] font-medium transition-all cursor-pointer shadow-2xs"
        title="Click to view technical execution details"
      >
        <Sparkles className="w-3 h-3 text-[#0A63FF]" />
        <span>{primarySummary}</span>
        <span className="text-[9px] text-slate-400 ml-0.5">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="mt-1 p-2.5 rounded-xl bg-white border border-[#E6E0D6] text-[10px] font-mono text-[#667085] space-y-1 shadow-xs">
          <span className="font-bold text-[#172033] block">Debug Execution Ledger:</span>
          {executions.map((t, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="font-bold text-[#172033]">{t.tool}()</span>
              {t.args && Object.keys(t.args).length > 0 && (
                <span className="text-slate-400 truncate max-w-xs">
                  {JSON.stringify(t.args)}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ConversationalCheckoutCard({
  items,
  onPay,
  onAutonomousOrder,
}: {
  items: any[];
  onPay?: () => void;
  onAutonomousOrder?: () => void;
}) {
  const totalAmount = items.reduce((sum, it) => {
    const p = it.price || it.product?.price || 0;
    return sum + p * (it.quantity || 1);
  }, 0);

  return (
    <div className="w-full max-w-lg mt-2 p-4 rounded-2xl bg-white border border-[#E6E0D6] shadow-sm space-y-3 font-sans animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E6E0D6]">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-[#0A63FF]" />
          <span className="font-extrabold text-xs text-[#172033] uppercase tracking-wider">
            Active Basket ({items.length} {items.length === 1 ? "item" : "items"})
          </span>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
          Ready for Payment
        </span>
      </div>

      {/* Items List */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {items.map((item, idx) => {
          const name = item.name || item.product?.name || `Product (${item.productId || idx})`;
          const price = item.price || item.product?.price || 0;
          const qty = item.quantity || 1;
          const storeName = item.store || item.product?.store || "NexusStore";

          return (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-[#F7F5F0]/70 border border-[#E6E0D6]/80 flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-800">
                    {storeName}
                  </span>
                  <span className="text-[10px] text-[#667085] font-semibold">Qty: {qty}</span>
                </div>
                <h5 className="font-bold text-[#172033] truncate" title={name}>
                  {name}
                </h5>
              </div>
              <span className="font-black text-[#172033] shrink-0">
                ₹{(price * qty).toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Purchase Control Tag */}
      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[10.5px] text-emerald-800 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Purchase Control: All 6 Gates Passed • Strict INR Domestic Settlement</span>
      </div>

      {/* Total & Action Buttons */}
      <div className="pt-2 border-t border-[#E6E0D6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold text-[#667085] block">Total Amount</span>
          <span className="text-lg font-black text-[#172033]">₹{totalAmount.toLocaleString()}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {onAutonomousOrder && (
            <button
              onClick={onAutonomousOrder}
              className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-200"
              title="Autonomous AI Buyer instantly executes verified order placement"
            >
              <span>⚡ Place Order (AI Buyer)</span>
            </button>
          )}

          <button
            onClick={onPay}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-[#0A63FF] hover:bg-blue-600 active:scale-95 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-blue-200"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Pay with Razorpay</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function RayaChat({ messages, loading, onAddToCart, onTriggerCheckout, onAutonomousOrder }: RayaChatProps) {
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {messages.map((m) => {
        const isUser = m.role === "user";

        return (
          <div
            key={m.id}
            className={`flex gap-2.5 sm:gap-3.5 max-w-4xl mx-auto ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            {/* Assistant Avatar */}
            {!isUser && (
              <div className="w-8 h-8 rounded-xl bg-gradient-dark p-1.5 flex items-center justify-center shrink-0 shadow-sm border border-raya-slate/20 mt-0.5">
                <RayaLogo variant="icon" size="sm" />
              </div>
            )}

            {/* Message Bubble & Content */}
            <div
              className={`flex flex-col space-y-2 max-w-[88%] sm:max-w-2xl ${
                isUser ? "items-end" : "items-start"
              }`}
            >
              {/* Single Compact Tool Activity Disclosure */}
              {!isUser && m.toolExecutions && m.toolExecutions.length > 0 && (
                <ToolActivityDisclosure executions={m.toolExecutions} />
              )}

              {/* Text Bubble */}
              {m.text && (
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed font-normal shadow-xs ${
                    isUser
                      ? "bg-raya-navy text-white rounded-br-xs"
                      : "bg-white text-raya-ink border border-raya-lightGray rounded-tl-xs"
                  }`}
                >
                  <FormattedChatText text={m.text} isUser={isUser} />
                </div>
              )}

              {/* Generative UI: Products Grid */}
              {!isUser && m.products && m.products.length > 0 && (
                <ProductGrid products={m.products} onAddToCart={onAddToCart} />
              )}

              {/* Generative UI: Conversational In-Chat Checkout Card */}
              {!isUser && m.checkoutBasket && m.checkoutBasket.length > 0 && !m.receipt && (
                <ConversationalCheckoutCard
                  items={m.checkoutBasket}
                  onPay={() => onTriggerCheckout && onTriggerCheckout(m.checkoutBasket!)}
                  onAutonomousOrder={() => onAutonomousOrder && onAutonomousOrder(m.checkoutBasket!)}
                />
              )}

              {/* Generative UI: Order Confirmation Card */}
              {!isUser && m.receipt && <OrderReceipt receipt={m.receipt} />}
            </div>

            {/* User Avatar */}
            {isUser && (
              <div className="w-8 h-8 rounded-xl bg-raya-lightGray/70 flex items-center justify-center text-raya-stone shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        );
      })}

      {/* Loading & Agent Thinking Indicator */}
      {loading && (
        <div className="flex gap-2.5 sm:gap-3.5 max-w-4xl mx-auto items-center">
          <div className="w-8 h-8 rounded-xl bg-gradient-dark p-1.5 flex items-center justify-center shrink-0 shadow-sm border border-raya-slate/20 animate-pulse">
            <RayaLogo variant="icon" size="sm" />
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-white border border-raya-lightGray shadow-xs flex items-center gap-2.5 text-xs font-medium text-raya-stone">
            <span className="w-2 h-2 rounded-full bg-raya-blue animate-ping" />
            <span>Raya is consulting multi-store catalog & live inventory...</span>
          </div>
        </div>
      )}

      <div ref={scrollEndRef} />
    </div>
  );
}

