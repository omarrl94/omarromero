import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

/**
 * Paleta corporativa FP José Ramón Otero
 *  - ofensiva  (amarillo mostaza): botones principales y alertas
 *  - defensiva (verde menta):      tarjetas, badges de éxito, temas de defensa
 *  - disponibilidad (salmón):      gráficos, notificaciones, infraestructura
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1280px" } },
    extend: {
      colors: {
        ofensiva: {
          DEFAULT: "#EFCD2F",
          50: "#FDF9E6",
          100: "#FBF1C2",
          200: "#F6E485",
          300: "#F2D753",
          400: "#EFCD2F",
          500: "#E4C038",
          600: "#C29E12",
          700: "#8F750D",
          800: "#5E4D09",
          foreground: "#2B2305",
        },
        defensiva: {
          DEFAULT: "#A9CABB",
          50: "#F2F7F5",
          100: "#E1EDE7",
          200: "#C6DCD1",
          300: "#A9CABB",
          400: "#A7C4B5",
          500: "#7FA894",
          600: "#5C8672",
          700: "#436455",
          800: "#2D4439",
          foreground: "#1E3029",
        },
        disponibilidad: {
          DEFAULT: "#E39F7D",
          50: "#FCF3EE",
          100: "#F8E2D6",
          200: "#F0C6AF",
          300: "#E6A57F",
          400: "#E39F7D",
          500: "#DCA482",
          600: "#C27552",
          700: "#955638",
          800: "#643925",
          foreground: "#3A1F12",
        },
        lienzo: "#F8F9FA",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [animate],
};
export default config;
