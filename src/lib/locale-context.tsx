"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

import enDict from "../locales/en.json";
import hiDict from "../locales/hi.json";
import mrDict from "../locales/mr.json";
import taDict from "../locales/ta.json";
import bnDict from "../locales/bn.json";

export type Locale = "en" | "hi" | "mr" | "ta" | "bn";

export interface LocaleOption {
  code: Locale;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা" },
];

const DICTIONARIES: Record<Locale, any> = {
  en: enDict,
  hi: hiDict,
  mr: mrDict,
  ta: taDict,
  bn: bnDict,
};

const STORAGE_KEY = "raya_bazaar_locale";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

function resolvePath(obj: any, path: string): string | undefined {
  if (!obj || !path) return undefined;
  const parts = path.split(".");
  let current = obj;
  for (const p of parts) {
    if (current && typeof current === "object" && p in current) {
      current = current[p];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && ["en", "hi", "mr", "ta", "bn"].includes(saved)) {
        setLocaleState(saved);
      }
    } catch (e) {
      console.warn("[LocaleProvider] Failed to read saved locale from localStorage", e);
    }
    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.documentElement.lang = newLocale;
    } catch (e) {
      console.warn("[LocaleProvider] Failed to persist locale to localStorage", e);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      // 1. Try active locale dictionary
      const activeDict = DICTIONARIES[locale];
      let value = resolvePath(activeDict, key);

      // 2. Fallback to English dictionary
      if (value === undefined && locale !== "en") {
        value = resolvePath(DICTIONARIES.en, key);
        if (value !== undefined && process.env.NODE_ENV === "development") {
          console.warn(`[i18n] Fallback to English for key: "${key}" (active locale: ${locale})`);
        }
      }

      // 3. Fallback to key itself
      if (value === undefined) {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[i18n] Missing translation for key: "${key}" in locale: ${locale}`);
        }
        return key;
      }

      // Interpolate parameters {param}
      if (params) {
        return value.replace(/\{(\w+)\}/g, (_, k) => {
          return params[k] !== undefined ? String(params[k]) : `{${k}}`;
        });
      }

      return value;
    },
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
