import type { Metadata, Viewport } from "next";
import Image from "next/image";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://crex-staking.vercel.app"),
  title: {
    default: "CREX Staking",
    template: "%s | CREX Staking",
  },
  description: "Stake testnet ERC-20 tokens into time-locked plans to earn daily CREX rewards.",
  keywords: ["CREX", "staking", "CREX Chain", "CREX", "Wallet", "crypto", "web3", "DeFi"],
  applicationName: "CREX Staking",
  authors: [{ name: "CREX" }],
  creator: "CREX",
  publisher: "CREX",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "CREX Staking",
    title: "CREX Staking",
    description: "Stake testnet ERC-20 tokens into time-locked plans to earn daily CREX rewards.",
    images: [{ url: "/logo-header.png", width: 512, height: 512, alt: "CREX" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CREX Staking",
    description: "Stake testnet ERC-20 tokens into time-locked plans to earn daily CREX rewards.",
    images: ["/logo-header.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#080808",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[var(--background)] text-[var(--foreground)]`} suppressHydrationWarning>
        <div className="min-h-dvh flex flex-col">
          <Header />
          <main className="flex-1 px-6 sm:px-8">
            <div className="max-w-[1200px] mx-auto">{children}</div>
          </main>
          <footer className="site-footer">
            <div className="max-w-[1200px] mx-auto">
              <div className="footer-main">
                <div className="footer-brand">
                  <Image src="/logo-header.png" width={72} height={72} alt="CREX" className="site-logo footer-logo" />
                  <p>Fixed-term ERC-20 staking with transparent, predictable CREX rewards.</p>
                </div>
                <div className="footer-links">
                  <div>
                    <span>Staking</span>
                    <a href="#stake">Stake ERC-20</a>
                    <a href="#live-stakes">Live stakes</a>
                    <a href="#plans">Lock plans</a>
                    <a href="#calculator">Calculator</a>
                  </div>
                  <div>
                    <span>Account</span>
                    <a href="#dashboard">Portfolio</a>
                    <a href="#stats">Platform stats</a>
                    <a href="https://crex-explorer-frontend.up.railway.app" target="_blank" rel="noreferrer">CREX Explorer</a>
                  </div>
                </div>
              </div>
              <div className="footer-bottom">
                <span>© 2026 Connect Redefine Exchange. All rights reserved.</span>
                <span>Built on CREX Chain · ERC-20 staking</span>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
