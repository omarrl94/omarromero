import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        kraft: {
          50: "#faf6ec",
          100: "#f4ebd9",
          200: "#e9dcc0",
          300: "#d9c7a3",
          400: "#c4ab7f",
          500: "#a98d5f",
          600: "#8a6f48",
          700: "#6e573a",
          800: "#584634",
          900: "#463930",
        },
        sage: {
          100: "#e4eadd",
          200: "#c9d6bc",
          300: "#a9bd97",
          400: "#8aa475",
          500: "#6f8a5c",
          600: "#576e48",
          700: "#45573a",
        },
        mustard: {
          100: "#f7ecc8",
          200: "#eed890",
          300: "#e2bf58",
          400: "#d4a72c",
          500: "#b98a1e",
          600: "#96690f",
        },
        terracotta: {
          100: "#f6e0d6",
          200: "#ecc0ad",
          300: "#dd9a7e",
          400: "#cb7554",
          500: "#b45c3d",
          600: "#94472e",
          700: "#763a28",
        },
        ink: "#3c3228",
      },
      fontFamily: {
        display: ["'Playfair Display'", "Georgia", "'Times New Roman'", "serif"],
        serif: ["Georgia", "'Iowan Old Style'", "'Times New Roman'", "serif"],
        mono: ["'Courier New'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        paper: "0 1px 2px rgba(70, 57, 48, 0.10), 0 8px 24px rgba(70, 57, 48, 0.12)",
        card: "0 1px 1px rgba(70, 57, 48, 0.08), 0 4px 12px rgba(70, 57, 48, 0.10)",
      },
      backgroundImage: {
        "paper-grain":
          "radial-gradient(rgba(70,57,48,0.045) 1px, transparent 1.4px)",
      },
      keyframes: {
        "stamp-in": {
          "0%": { transform: "scale(2.4) rotate(-18deg)", opacity: "0" },
          "60%": { transform: "scale(0.92) rotate(4deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1" },
        },
        wobble: {
          "0%, 100%": { transform: "rotate(-1deg)" },
          "50%": { transform: "rotate(1.4deg)" },
        },
      },
      animation: {
        "stamp-in": "stamp-in 0.35s cubic-bezier(0.2, 1.4, 0.4, 1) both",
        wobble: "wobble 0.9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
