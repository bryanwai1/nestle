import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Nestlé SHE Day 2025",
  description: "Safety · Health · Environment — Interactive challenge platform for Nestlé Sales Region staff",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Nestlé SHE Day 2025",
    description: "Compete, learn and earn Game Cards in the Nestlé SHE Day challenge.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1B3A6B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">{children}</body>
    </html>
  );
}
