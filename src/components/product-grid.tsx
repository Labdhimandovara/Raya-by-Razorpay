"use client";

import React, { useState } from "react";
import { Plus, Check, ShoppingCart, Tag } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  category?: string;
  imageUrl?: string;
}

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  if (!products || products.length === 0) return null;

  const handleAdd = (p: Product) => {
    onAddToCart(p);
    setAddedMap((prev) => ({ ...prev, [p.id]: true }));
    setTimeout(() => {
      setAddedMap((prev) => ({ ...prev, [p.id]: false }));
    }, 2000);
  };

  return (
    <div className="my-4 space-y-2">
      <div className="flex items-center gap-2 text-xs font-bold text-[#64748B] uppercase tracking-wider">
        <Tag className="w-3.5 h-3.5 text-[#0C66E4]" />
        <span>NexusStore Catalog Results ({products.length})</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {products.map((p) => {
          const isAdded = addedMap[p.id];
          const img = p.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400";

          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-[#E2E8F0] hover:border-[#0C66E4]/40 hover:shadow-md transition-all p-3.5 flex flex-col justify-between group"
            >
              <div>
                <div className="relative w-full h-36 rounded-xl overflow-hidden bg-slate-100 mb-3">
                  <img
                    src={img}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {p.category && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-sm text-[10px] font-bold text-[#0C2340] shadow-sm">
                      {p.category}
                    </span>
                  )}
                  {p.stock !== undefined && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-500/90 text-white text-[10px] font-bold shadow-sm">
                      {p.stock} in stock
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm text-[#0C2340] line-clamp-1 group-hover:text-[#0C66E4] transition-colors">
                  {p.name}
                </h4>
                {p.description && (
                  <p className="text-xs text-[#64748B] line-clamp-2 mt-1 font-normal">
                    {p.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#64748B] block font-semibold uppercase">Price</span>
                  <span className="text-base font-extrabold text-[#0C2340]">
                    ₹{p.price.toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => handleAdd(p)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                    isAdded
                      ? "bg-emerald-600 text-white"
                      : "bg-[#0C66E4] hover:bg-[#0052CC] text-white"
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
