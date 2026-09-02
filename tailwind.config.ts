import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        raya: {
          // Primary Palette
          navy: "#0D1B2A",
          blue: "#0A63FF",
          sky: "#6DA8FF",
          softWhite: "#F3F6FB",

          // Neutrals
          ink: "#0F172A",
          slate: "#1E293B",
          stone: "#334155",
          coolGray: "#64748B",
          lightGray: "#CBD5E1",
          cloud: "#F8FAFC",

          // Semantic Colors
          success: "#22C55E",
          warning: "#F59E0B",
          error: "#EF4444",
          accent: "#8B5CF6",
          info: "#06B6D4",
        },
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #0D1B2A 0%, #0A63FF 100%)",
        "gradient-secondary": "linear-gradient(135deg, #6DA8FF 0%, #0A63FF 100%)",
        "gradient-dark": "linear-gradient(180deg, #0D1B2A 0%, #1E293B 100%)",
      },
      fontFamily: {
        sans: ["Satoshi", "system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        satoshi: ["Satoshi", "sans-serif"],
      },
      boxShadow: {
        "raya-glow": "0 0 20px -5px rgba(10, 99, 255, 0.3)",
        "raya-card": "0 4px 20px -2px rgba(15, 23, 42, 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;

