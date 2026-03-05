import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

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
      <body className={`${geist.variable} antialiased`}>{children}</body>
    </html>
  );
}
