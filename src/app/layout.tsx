import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "PawsMatch",
  description: "Adopción responsable: encuentra al animal que encaja con tu vida.",
};

export const viewport: Viewport = { themeColor: "#e8613c" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#fff8f1", color: "#2b1d16" }}>
        {children}
      </body>
    </html>
  );
}
