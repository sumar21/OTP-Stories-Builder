import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OTP Stories Builder",
  description: "Generador de stories para Torneos Americanos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
