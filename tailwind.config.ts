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
        razorpay: {
          dark: "#0C2340",
          navy: "#112B50",
          blue: "#0C66E4",
          lightBlue: "#EBF3FF",
          emerald: "#00D09C",
          mint: "#10B981",
          slate: "#F8FAFC",
          border: "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
