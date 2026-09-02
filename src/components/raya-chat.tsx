"use client";

import React, { useRef, useEffect } from "react";
import { Zap, User, Sparkles, CheckCircle2 } from "lucide-react";
import { ProductGrid } from "./product-grid";
import { OrderReceipt } from "./order-receipt";

export interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  products?: any[];
  receipt?: any;
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
}

export function RayaChat({ messages, loading, onAddToCart }: RayaChatProps) {
  const scrollEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
      {messages.map((m) => {
        const isUser = m.role === "user";

        return (
          <div
            key={m.id}
            className={`flex gap-3.5 max-w-4xl mx-auto ${isUser ? "justify-end" : "justify-start"}`}
          >
            {/* Assistant Avatar */}
            {!isUser && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0C66E4] to-[#00D09C] flex items-center justify-center text-white shrink-0 shadow-sm mt-1">
                <Zap className="w-4 h-4 fill-current text-white" />
              </div>
            )}

            {/* Message Bubble & Content */}
            <div className={`flex flex-col space-y-2 max-w-2xl ${isUser ? "items-end" : "items-start"}`}>
              
              {/* Tool Execution Badges (If agent invoked tools) */}
              {!isUser && m.toolExecutions && m.toolExecutions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {m.toolExecutions.map((t, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#EBF3FF] border border-[#0C66E4]/20 text-[#0C66E4] text-[10px] font-mono font-bold"
                    >
                      <Sparkles className="w-3 h-3 text-[#00D09C]" />
                      <span>{t.tool}()</span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    </span>
                  ))}
                </div>
              )}

              {/* Text Bubble */}
              {m.text && (
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? "bg-[#0C2340] text-white rounded-br-sm shadow-md"
                      : "bg-white text-[#0C2340] border border-[#E2E8F0] rounded-tl-sm shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              )}

              {/* Generative UI: Products Grid */}
              {!isUser && m.products && m.products.length > 0 && (
                <ProductGrid products={m.products} onAddToCart={onAddToCart} />
              )}

              {/* Generative UI: Order Confirmation Card */}
              {!isUser && m.receipt && (
                <OrderReceipt receipt={m.receipt} />
              )}

            </div>

            {/* User Avatar */}
            {isUser && (
              <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center text-[#475569] shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        );
      })}

      {/* Loading & Agent Thinking Indicator */}
      {loading && (
        <div className="flex gap-3.5 max-w-4xl mx-auto items-center animate-fadeIn">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0C66E4] to-[#00D09C] flex items-center justify-center text-white shrink-0 shadow-sm animate-pulse">
            <Zap className="w-4 h-4 fill-current text-white" />
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-center gap-2 text-xs font-semibold text-[#64748B]">
            <span className="w-2 h-2 rounded-full bg-[#0C66E4] animate-ping" />
            <span>Raya is searching NexusStore catalog & analyzing policies...</span>
          </div>
        </div>
      )}

      <div ref={scrollEndRef} />
    </div>
  );
}
