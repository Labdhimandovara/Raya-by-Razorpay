"use client";

import React, { useState } from "react";
import { ArrowRight, Sparkles, Send } from "lucide-react";

interface RayaInputProps {
  onSend: (message: string) => void;
  loading: boolean;
}

const QUICK_SUGGESTIONS = [
  "Find white oxford shirts",
  "Show me backpacks for travel",
  "Find electronics under ₹5,000",
  "What is in my cart?",
];

export function RayaInput({ onSend, loading }: RayaInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input);
    setInput("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (loading) return;
    onSend(suggestion);
  };

  return (
    <div className="sticky bottom-0 w-full bg-gradient-to-t from-raya-cloud via-raya-cloud/90 to-transparent pt-3 pb-4 sm:pb-6 px-3 sm:px-6 z-30">
      <div className="max-w-4xl mx-auto space-y-2.5 sm:space-y-3">
        {/* Suggested Quick Prompts */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 text-xs no-scrollbar touch-pan-x">
          <span className="text-[11px] font-bold text-raya-coolGray flex items-center gap-1 shrink-0 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-raya-accent" />
            <span className="hidden xs:inline">Suggestions:</span>
          </span>
          {QUICK_SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(s)}
              disabled={loading}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-raya-softWhite active:bg-raya-softWhite text-raya-stone hover:text-raya-blue border border-raya-lightGray hover:border-raya-blue/30 text-xs font-medium whitespace-nowrap transition-all shadow-2xs shrink-0 active:scale-95"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Bar Form */}
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center bg-white rounded-2xl border-2 border-raya-lightGray focus-within:border-raya-blue focus-within:ring-4 focus-within:ring-raya-blue/10 shadow-sm transition-all"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask Raya to search products, manage cart, or checkout..."
            disabled={loading}
            className="flex-1 bg-transparent px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-medium text-raya-ink placeholder-raya-coolGray focus:outline-none min-w-0"
          />

          {/* Primary Button as defined in Brand Guide */}
          <div className="pr-2 sm:pr-3 flex items-center gap-2 shrink-0">
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-raya-blue hover:bg-blue-600 disabled:bg-raya-lightGray active:scale-95 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm shadow-raya-blue/20 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
            >
              <span>{loading ? "Thinking..." : "Send"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <p className="text-[10px] sm:text-[11px] text-center text-raya-coolGray">
          Raya by Razorpay is connected to live NexusStore with verified guardrails.
        </p>
      </div>
    </div>
  );
}

