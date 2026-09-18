import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Rollo Madrid · El mapa de los baños de los bares de Madrid",
  description:
    "Mapa comunitario para valorar los baños de los bares de Madrid: limpieza, espacio, intimidad y suministros. Busca el bar, mira la nota y evita sorpresas.",
};

export const viewport: Viewport = {
  themeColor: "#FAF6EC",
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
        {/* Si las fuentes no cargan, cae a la sans del sistema */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
