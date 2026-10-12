import type { Config } from "tailwindcss";

/**
 * Paleta Rollo Madrid, dirección callejera: asfalto de madrugada,
 * rotulador magenta, verde ácido de neón, ámbar de bar para los
 * premios y papel de fotocopia para el texto.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        asfalto: {
          950: "#08080A",
          900: "#0C0C0D",
          800: "#141417",
          700: "#1C1C21",
          600: "#26262C",
        },
        borde: "#2A2A31",
        papel: {
          DEFAULT: "#F2ECDF",
          apagado: "#B9B2A4",
        },
        marca: {
          DEFAULT: "#FF2E88",
          claro: "#FF6AAC",
        },
        acido: "#C6FF3D",
        ambar: "#FFB800",
        alarma: "#FF3B30",
      },
      fontFamily: {
        grito: ["var(--fuente-grito)", "'Arial Narrow'", "sans-serif"],
        sans: ["var(--fuente-sans)", "system-ui", "sans-serif"],
        mono: ["var(--fuente-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        dura: "6px 6px 0 #000",
        "dura-s": "4px 4px 0 #000",
        "dura-l": "14px 14px 0 #000",
      },
      keyframes: {
        correr: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        late: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.07)" },
        },
        sube: {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        entra: {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        correr: "correr 30s linear infinite",
        late: "late 1.5s ease-in-out infinite",
        sube: "sube 240ms cubic-bezier(0.22, 1, 0.36, 1)",
        entra: "entra 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
