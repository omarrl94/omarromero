import type { Metadata, Viewport } from "next";
import { Anton, Manrope, Space_Mono } from "next/font/google";
import "./globals.css";

/* Las fuentes se sirven desde el propio dominio: ni parpadeo ni
   dependencia de que Google Fonts esté accesible. */
const grito = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--fuente-grito",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--fuente-sans",
  display: "swap",
});

const mono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--fuente-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rollo Madrid · El mapa callejero de los baños de Madrid",
  description:
    "Antes de entrar a ese baño, mira la nota. Limpieza, espacio, intimidad y suministros de los baños de los bares de Madrid, puntuados por quienes han estado ahí dentro.",
};

export const viewport: Viewport = {
  themeColor: "#0C0C0D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${grito.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
