import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OTP Stories Builder",
  description: "Generador de stories para Torneos Americanos",
  icons: {
    icon: "/logos/otp-logo.svg",
    shortcut: "/logos/otp-logo.svg",
  },
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
