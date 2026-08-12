import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: {
          950: "#050507",
          900: "#0a0a10",
          800: "#10101a",
          700: "#181826",
          600: "#222234",
          500: "#2e2e44",
        },
        neon: {
          yellow: "#FFD60A",
          blue: "#0A9BFF",
          green: "#00E572",
          red: "#FF453A",
          purple: "#BF5AF2",
          cyan: "#22D3EE",
          violet: "#8B5CF6",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "glow-violet": "0 0 24px rgba(139, 92, 246, 0.35)",
        "glow-cyan": "0 0 24px rgba(34, 211, 238, 0.30)",
        "glow-yellow": "0 0 28px rgba(255, 214, 10, 0.35)",
        panel: "0 8px 40px rgba(0, 0, 0, 0.55)",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(255, 214, 10, 0.35)" },
          "50%": { boxShadow: "0 0 44px rgba(255, 214, 10, 0.65)" },
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
