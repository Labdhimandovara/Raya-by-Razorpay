"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";

interface RayaInputProps {
  onSend: (message: string) => void;
  loading: boolean;
}

export function RayaInput({ onSend, loading }: RayaInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input);
    setInput("");
  };

  return (
    <div className="sticky bottom-0 w-full bg-gradient-to-t from-raya-cloud via-raya-cloud/90 to-transparent pt-2 pb-3 sm:pb-5 px-3 sm:px-6 z-30">
      <div className="max-w-4xl mx-auto">
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
      </div>
    </div>
  );
}

