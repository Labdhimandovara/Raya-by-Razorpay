"use client";

import React, { useRef, useEffect } from "react";
import { User, Sparkles, CheckCircle2, Bot } from "lucide-react";
import { RayaLogo } from "./raya-logo";
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
              {/* Tool Execution Badges */}
              {!isUser && m.toolExecutions && m.toolExecutions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {m.toolExecutions.map((t, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-raya-softWhite border border-raya-lightGray text-raya-blue text-[11px] font-mono font-bold shadow-2xs"
                    >
                      <Sparkles className="w-3 h-3 text-raya-accent" />
                      <span>{t.tool}()</span>
                      <CheckCircle2 className="w-3 h-3 text-raya-success" />
                    </span>
                  ))}
                </div>
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
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              )}

              {/* Generative UI: Products Grid */}
              {!isUser && m.products && m.products.length > 0 && (
                <ProductGrid products={m.products} onAddToCart={onAddToCart} />
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

