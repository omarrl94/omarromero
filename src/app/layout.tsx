import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hipster Bingo · Bingo multijugador en tiempo real",
  description:
    "Bingo de clichés hipsters multijugador en tiempo real. Crea una sala, comparte el código y sella casillas hasta cantar ¡BINGO!",
};

export const viewport: Viewport = {
  themeColor: "#f4ebd9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Si la fuente no carga (sin red), cae a Georgia/serif del sistema */}
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;0,900;1,500&family=Special+Elite&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-serif antialiased">
        {/* Filtro SVG global: da rugosidad de tinta a los sellos */}
        <svg width="0" height="0" className="absolute" aria-hidden="true">
          <filter id="ink-roughen">
            <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" />
          </filter>
        </svg>
        {children}
      </body>
    </html>
  );
}
