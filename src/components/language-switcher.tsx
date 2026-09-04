"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useLocale, SUPPORTED_LOCALES, Locale } from "@/lib/locale-context";

interface LanguageSwitcherProps {
  compact?: boolean;
}

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useLocale();
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentOption = SUPPORTED_LOCALES.find((l) => l.code === locale) || SUPPORTED_LOCALES[0];

  return (
    <div className="relative" ref={langRef}>
      <button
        onClick={() => setLangOpen(!langOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#F7F5F0] border border-[#E6E0D6] text-[#172033] text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-95"
        aria-label={t("nav.language")}
        title={t("nav.language")}
      >
        <Globe className="w-3.5 h-3.5 text-[#0A63FF]" />
        <span className="font-bold">{currentOption.nativeLabel}</span>
        <ChevronDown className={`w-3 h-3 text-[#667085] transition-transform ${langOpen ? "rotate-180" : ""}`} />
      </button>

      {langOpen && (
        <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-white border border-[#E6E0D6] shadow-lg py-1 z-50 animate-in fade-in-50 slide-in-from-top-1 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#667085] border-b border-[#F0EBE1]">
            {t("nav.language")}
          </div>
          {SUPPORTED_LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLocale(l.code);
                setLangOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer transition-colors ${
                locale === l.code
                  ? "bg-[#F7F5F0] text-[#0A63FF] font-bold"
                  : "text-[#172033] hover:bg-[#FAF8F5]"
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{l.nativeLabel}</span>
                <span className="text-[10px] text-[#667085] uppercase">({l.code})</span>
              </span>
              {locale === l.code && <Check className="w-3.5 h-3.5 text-[#0A63FF]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
