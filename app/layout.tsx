import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lemonpay - Invoice Generator",
  description: "Invoice generator for Lemonpay merchants",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
