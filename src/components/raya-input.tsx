"use client";

import React, { useState } from "react";
import { Send, Sparkles, CornerDownLeft } from "lucide-react";

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
    <div className="sticky bottom-0 w-full bg-gradient-to-t from-white via-white to-transparent pt-4 pb-6 px-4 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-3">
        
        {/* Suggested Quick Prompts */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-bold text-[#64748B] flex items-center gap-1 shrink-0 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#00D09C]" />
            <span>Suggestions:</span>
          </span>
          {QUICK_SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSuggestionClick(s)}
              disabled={loading}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-[#EBF3FF] text-[#475569] hover:text-[#0C66E4] border border-[#E2E8F0] hover:border-[#0C66E4]/30 text-xs font-semibold whitespace-nowrap transition-all shadow-sm shrink-0"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Bar Form */}
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center bg-white rounded-2xl border-2 border-[#E2E8F0] focus-within:border-[#0C66E4] focus-within:ring-4 focus-within:ring-[#0C66E4]/10 shadow-lg transition-all"
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
            placeholder="Ask Raya to search products, add to cart, or checkout directly..."
            disabled={loading}
            className="flex-1 bg-transparent px-5 py-4 text-sm font-medium text-[#0C2340] placeholder-[#94A3B8] focus:outline-none"
          />

          <div className="pr-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0C66E4] to-[#00D09C] disabled:from-slate-200 disabled:to-slate-300 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#0C66E4]/20 disabled:shadow-none"
            >
              <span>{loading ? "Thinking..." : "Send"}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        <p className="text-[11px] text-center text-[#94A3B8]">
          Raya by Razorpay is connected to live NexusStore. AI actions are bounded by verified purchase policies.
        </p>

      </div>
    </div>
  );
}
