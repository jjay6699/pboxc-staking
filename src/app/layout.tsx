import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://pboxc-staking.vercel.app"),
  title: {
    default: "PBOXC Staking",
    template: "%s | PBOXC Staking",
  },
  description: "Stake SOL into time-locked plans to earn daily PBOXC rewards.",
  keywords: [
    "PBOXC",
    "staking",
    "Solana",
    "SOL",
    "Phantom",
    "crypto",
    "web3",
    "DeFi",
  ],
  applicationName: "PBOXC Staking",
  authors: [{ name: "PBOXC" }],
  creator: "PBOXC",
  publisher: "PBOXC",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "PBOXC Staking",
    title: "PBOXC Staking",
    description: "Stake SOL into time-locked plans to earn daily PBOXC rewards.",
    images: [
      { url: "/logo-header.png", width: 1200, height: 630, alt: "PBOXC" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PBOXC Staking",
    description: "Stake SOL into time-locked plans to earn daily PBOXC rewards.",
    images: ["/logo-header.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--background)] text-[var(--foreground)]`} suppressHydrationWarning>
        <div className="min-h-dvh flex flex-col">
          <Header />
          <main className="flex-1 px-6 sm:px-8">
            <div className="max-w-[1200px] mx-auto py-6 sm:py-8">{children}</div>
          </main>
          <footer className="border-t border-white/[0.06] text-sm text-white/60 px-6 sm:px-8 py-4">
            <div className="max-w-[1200px] mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-medium">PBOXC</span>
                <a className="hover:underline" href="#plans">Plans</a>
                <a className="hover:underline" href="#dashboard">Dashboard</a>
              </div>
              <div>© 2025</div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
