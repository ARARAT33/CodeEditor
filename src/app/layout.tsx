import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AWECode — Powerful Code Editor with AWEAI",
  description: "Full-featured code editor supporting 150+ languages with offline linter, vulnerability scanner, code refactoring, auto-correction, 1000+ utility functions, and AWEAI API for AI agent integration.",
  keywords: ["AWECode", "AWEAI", "code editor", "IDE", "linter", "vulnerability scanner", "refactoring", "offline", "TypeScript", "Next.js"],
  authors: [{ name: "AWECode" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "AWECode — Powerful Code Editor",
    description: "150+ languages · 1000+ functions · AWEAI API · Offline linter & vuln scanner",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${jetbrains.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
