import type { Config } from "tailwindcss";

/**
 * Paleta Rollo Madrid: papel limpio de fondo, azul agua como color de
 * marca, marrón cartón para los detalles, dorado para los premios a los
 * mejores baños y el rojo clásico de Madrid para los acentos.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        papel: {
          50: "#FFFDF8",
          100: "#FAF6EC",
          200: "#F1EADA",
          300: "#E3D9C3",
        },
        carton: {
          100: "#F3EADB",
          200: "#E7DBC6",
          300: "#D6C3A3",
          400: "#C2A17B",
          500: "#A8865C",
          600: "#8B6A45",
          700: "#6B5134",
        },
        agua: {
          100: "#E3F4F9",
          200: "#BFE7F1",
          300: "#8ED5E6",
          400: "#4FBBD6",
          500: "#1E9FC6",
          600: "#1580A5",
          700: "#0F6383",
        },
        madrid: {
          100: "#FBE3E4",
          200: "#F6C3C6",
          400: "#E24B4B",
          500: "#D0202E",
          600: "#B3111F",
          700: "#8C0D18",
        },
        oro: {
          200: "#F8EAC4",
          300: "#F0D18A",
          400: "#E0B252",
          500: "#C9962F",
          600: "#A87B21",
        },
        nota: {
          verde: "#2E9E5B",
          amarillo: "#E0A526",
          rojo: "#D64541",
        },
        tinta: "#2B2A26",
      },
      fontFamily: {
        display: ["Fredoka", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        ficha: "0 10px 30px rgba(43, 42, 38, 0.12)",
        sheet: "0 -12px 40px rgba(43, 42, 38, 0.18)",
        pin: "0 4px 10px rgba(43, 42, 38, 0.35)",
        oro: "0 0 0 3px rgba(240, 209, 138, 0.55)",
      },
      keyframes: {
        "sube-sheet": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "entra-panel": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "rueda-rollo": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "sube-sheet": "sube-sheet 260ms cubic-bezier(0.22, 1, 0.36, 1)",
        "entra-panel": "entra-panel 200ms ease-out",
        "rueda-rollo": "rueda-rollo 1.1s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
