import React, { useState } from "react";
import { ArrowRight, Mic } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

interface RayaInputProps {
  onSend: (message: string) => void;
  loading: boolean;
}

export function RayaInput({ onSend, loading }: RayaInputProps) {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const { t, locale } = useLocale();

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input);
    setInput("");
  };

  const handleVoiceInput = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      const localeMap: Record<string, string> = {
        en: "en-IN",
        hi: "hi-IN",
        mr: "mr-IN",
        ta: "ta-IN",
        bn: "bn-IN",
      };
      recognition.lang = localeMap[locale] || "en-IN";
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.start();
    } catch (err) {
      console.warn("Speech recognition error:", err);
      setIsListening(false);
    }
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
            placeholder={isListening ? t("chat.listening") : t("chat.inputPlaceholder")}
            disabled={loading}
            className="flex-1 bg-transparent px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-medium text-raya-ink placeholder-raya-coolGray focus:outline-none min-w-0"
          />

          <div className="pr-2 sm:pr-3 flex items-center gap-1.5 shrink-0">
            {/* Voice Input Button */}
            <button
              type="button"
              onClick={handleVoiceInput}
              title={t("chat.listening")}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isListening
                  ? "bg-red-500 text-white animate-pulse"
                  : "text-raya-coolGray hover:text-raya-ink hover:bg-raya-cloud"
              }`}
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-raya-blue hover:bg-blue-600 disabled:bg-raya-lightGray active:scale-95 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm shadow-raya-blue/20 disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
            >
              <span>{loading ? t("loading.analyzing") : t("chat.send")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

