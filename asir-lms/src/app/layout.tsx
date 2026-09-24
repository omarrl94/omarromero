import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ASIR · Seguridad y Alta Disponibilidad | FP José Ramón Otero",
  description: "Plataforma de aprendizaje del módulo Seguridad y Alta Disponibilidad (ASIR).",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} font-sans`}>{children}</body>
    </html>
  );
}
