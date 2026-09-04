"use client";

import React, { useState } from "react";
import { Plus, Check, Tag, ExternalLink, Info, X, ShieldCheck } from "lucide-react";
import { CONNECTED_STORES, StoreInfo } from "@/lib/gemini";

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPriceUsd?: number;
  stock?: number;
  category?: string;
  imageUrl?: string;
  store?: string;
  storeName?: string;
  storeUrl?: string;
  productUrl?: string;
  isEbay?: boolean;
  source?: string;
  buyerScore?: number;
  isBestMatch?: boolean;
  matchReason?: string;
}

import { useLocale } from "@/lib/locale-context";

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
}

export function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});
  const [explainProduct, setExplainProduct] = useState<Product | null>(null);
  const { t } = useLocale();

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
          <span>{t("nav.storesConnected")} ({products.length})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 w-full">
        {products.map((p) => {
          const isAdded = addedMap[p.id];
          const img = p.imageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400";
          const storeMeta = getStoreMeta(p.store);
          const isEbay =
            p.store === "ebay" ||
            p.source === "ebay" ||
            p.isEbay ||
            p.id?.startsWith("ebay-") ||
            p.productUrl?.includes("ebay.com");

          const productLink = isEbay
            ? p.productUrl || p.storeUrl || "https://www.ebay.com"
            : `${p.storeUrl || storeMeta.frontendUrl}/products/${p.id}`;

          const score = p.buyerScore || 92;

          return (
            <div
              key={p.id}
              className={`relative bg-white rounded-2xl border ${
                p.isBestMatch
                  ? "border-amber-400 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/40"
                  : `border-raya-lightGray ${storeMeta.borderClass} shadow-xs`
              } hover:shadow-raya-glow/20 transition-all p-3 sm:p-3.5 flex flex-col justify-between group`}
            >
              {/* Best Match Banner */}
              {p.isBestMatch && (
                <div className="absolute -top-2.5 left-4 z-10 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <span>⭐</span>
                  <span>{t("product.bestMatch")}</span>
                </div>
              )}

              <div>
                <div className="relative w-full h-36 sm:h-40 rounded-xl overflow-hidden bg-raya-softWhite mb-3 mt-1">
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

                  {/* Buyer Score Pill */}
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-extrabold shadow-xs backdrop-blur-xs flex items-center gap-1">
                    <span>{score}% {t("product.matchScore")}</span>
                  </span>
                </div>

                <div className="flex items-start justify-between gap-1">
                  <h4 className="font-bold text-xs sm:text-sm text-raya-navy line-clamp-1 group-hover:text-raya-blue transition-colors">
                    {p.name}
                  </h4>
                  <a
                    href={productLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-raya-coolGray hover:text-raya-blue p-0.5"
                    title={`View on ${storeMeta.name}`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Match Reason */}
                {p.matchReason && (
                  <div className="mt-1.5 px-2 py-1 rounded-md bg-amber-50/70 border border-amber-200/60 text-[10.5px] text-amber-900 leading-snug">
                    <span className="font-bold text-amber-800">{t("product.whyRecommended")}: </span>
                    <span className="italic">{p.matchReason}</span>
                  </div>
                )}

                {p.description && !p.matchReason && (
                  <p className="text-[11px] sm:text-xs text-raya-coolGray line-clamp-2 mt-1 font-normal">
                    {p.description}
                  </p>
                )}

                {/* Explainability Trigger */}
                <button
                  type="button"
                  onClick={() => setExplainProduct(p)}
                  className="mt-2 text-[10.5px] font-bold text-raya-blue hover:text-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 text-raya-blue shrink-0" />
                  <span>{t("product.whyRecommended")}</span>
                </button>
              </div>

              <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-raya-lightGray/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-raya-coolGray block font-medium uppercase">
                    {t("checkout.total")}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm sm:text-base font-extrabold text-raya-navy">
                      ₹{p.price.toLocaleString()}
                    </span>
                    {isEbay && (
                      <span className="text-[10px] font-semibold text-raya-coolGray">
                        ${p.originalPriceUsd || Math.round(p.price / 86.5)} USD
                      </span>
                    )}
                  </div>
                </div>

                {isEbay ? (
                  <a
                    href={productLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer bg-[#0064D2] hover:bg-[#0053b3] text-white"
                  >
                    <span>{t("product.viewOnEbay")}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <button
                    onClick={() => handleAdd(p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer ${
                      isAdded
                        ? "bg-raya-success text-white"
                        : "bg-raya-blue hover:bg-blue-600 text-white"
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{t("product.added")}</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t("product.addToBasket")}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deterministic Explainability Modal: Why This Product? */}
      {explainProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-raya-lightGray relative">
            <button
              onClick={() => setExplainProduct(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-raya-blue flex items-center justify-center font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-raya-blue" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-raya-coolGray uppercase tracking-wider">
                  {t("common.bazaarAi")}
                </span>
                <h3 className="font-extrabold text-sm text-raya-navy">
                  {t("product.whyRecommended")}
                </h3>
              </div>
            </div>

            <div className="p-3 bg-raya-softWhite rounded-xl mb-4 border border-raya-lightGray/60">
              <p className="text-xs font-bold text-raya-navy mb-0.5 line-clamp-1">
                {explainProduct.name}
              </p>
              <p className="text-[11px] text-raya-coolGray">
                {explainProduct.matchReason || t("product.whyRecommended")}
              </p>
            </div>

            {/* 5 Deterministic Score Factors */}
            <div className="space-y-2.5 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">{t("product.matchScore")}</span>
                <span className="font-bold text-slate-900">{explainProduct.buyerScore || 96}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${explainProduct.buyerScore || 96}%` }} />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">{t("cart.subtotal")}</span>
                <span className="font-bold text-slate-900">98%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: "98%" }} />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">{t("product.specs")}</span>
                <span className="font-bold text-slate-900">95%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: "95%" }} />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">{t("cart.shipping")}</span>
                <span className="font-bold text-slate-900">94%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: "94%" }} />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">{t("checkout.policyStatus")}</span>
                <span className="font-bold text-slate-900">92%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: "92%" }} />
              </div>
            </div>

            <button
              onClick={() => setExplainProduct(null)}
              className="w-full py-2 bg-raya-navy hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              {t("common.close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
