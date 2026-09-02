"use client";

import React, { useState } from "react";
import { Plus, Check, Tag, ExternalLink } from "lucide-react";
import { CONNECTED_STORES, StoreInfo } from "@/lib/gemini";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  category?: string;
  imageUrl?: string;
  store?: string;
  storeName?: string;
  storeUrl?: string;
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

  const getStoreMeta = (storeSlug?: string): StoreInfo => {
    const key = (storeSlug || "nexusstore").toLowerCase();
    return CONNECTED_STORES[key] || CONNECTED_STORES.nexusstore;
  };

  return (
    <div className="my-3 sm:my-4 space-y-2.5 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-raya-coolGray uppercase tracking-wider">
          <Tag className="w-3.5 h-3.5 text-raya-blue" />
          <span>Multi-Store Recommendations ({products.length})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full">
        {products.map((p) => {
          const isAdded = addedMap[p.id];
          const img = p.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400";
          const storeMeta = getStoreMeta(p.store);

          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border border-raya-lightGray ${storeMeta.borderClass} shadow-xs hover:shadow-raya-glow/20 transition-all p-3 sm:p-3.5 flex flex-col justify-between group`}
            >
              <div>
                <div className="relative w-full h-36 sm:h-40 rounded-xl overflow-hidden bg-raya-softWhite mb-3">
                  <img
                    src={img}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  
                  {/* Store Badge */}
                  <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold border backdrop-blur-xs shadow-xs ${storeMeta.badgeClass}`}>
                    {storeMeta.icon} {storeMeta.name}
                  </span>

                  {/* Category or Stock */}
                  {p.stock !== undefined && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-white/90 text-raya-navy text-[10px] font-bold shadow-xs">
                      {p.stock} in stock
                    </span>
                  )}
                </div>

                <div className="flex items-start justify-between gap-1">
                  <h4 className="font-bold text-xs sm:text-sm text-raya-navy line-clamp-1 group-hover:text-raya-blue transition-colors">
                    {p.name}
                  </h4>
                  {p.storeUrl && (
                    <a
                      href={`${p.storeUrl}/products/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-raya-coolGray hover:text-raya-blue p-0.5"
                      title={`View on ${storeMeta.name}`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {p.description && (
                  <p className="text-[11px] sm:text-xs text-raya-coolGray line-clamp-2 mt-1 font-normal">
                    {p.description}
                  </p>
                )}
              </div>

              <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-raya-lightGray/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-raya-coolGray block font-medium uppercase">Price</span>
                  <span className="text-sm sm:text-base font-extrabold text-raya-navy">
                    ₹{p.price.toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => handleAdd(p)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-medium transition-all shadow-2xs active:scale-95 cursor-pointer ${
                    isAdded
                      ? "bg-raya-success text-white"
                      : "bg-raya-blue hover:bg-blue-600 text-white"
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
                      <span>Add</span>
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
