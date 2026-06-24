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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://pboxc-staking.vercel.app"),
  title: {
    default: "PBOXC Staking",
    template: "%s | PBOXC Staking",
  },
  description: "Stake SOL into time-locked plans to earn daily PBOXC rewards.",
  keywords: ["PBOXC", "staking", "Solana", "SOL", "Phantom", "crypto", "web3", "DeFi"],
  applicationName: "PBOXC Staking",
  authors: [{ name: "PBOXC" }],
  creator: "PBOXC",
  publisher: "PBOXC",
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "PBOXC Staking",
    title: "PBOXC Staking",
    description: "Stake SOL into time-locked plans to earn daily PBOXC rewards.",
    images: [{ url: "/logo-header.png", width: 1200, height: 630, alt: "PBOXC" }],
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
                  <Image src="/logo-header.png" width={150} height={30} alt="Erabox" />
                  <p>Fixed-term SOL staking with transparent, predictable PBOXC rewards.</p>
                </div>
                <div className="footer-links">
                  <div>
                    <span>Staking</span>
                    <a href="#stake">Stake SOL</a>
                    <a href="#live-stakes">Live stakes</a>
                    <a href="#plans">Lock plans</a>
                    <a href="#calculator">Calculator</a>
                  </div>
                  <div>
                    <span>Account</span>
                    <a href="#dashboard">Portfolio</a>
                    <a href="#stats">Platform stats</a>
                    <a href="https://explorer.solana.com" target="_blank" rel="noreferrer">Solana Explorer</a>
                  </div>
                </div>
              </div>
              <div className="footer-bottom">
                <span>© 2026 Erabox. All rights reserved.</span>
                <span>Built on Solana · PBOXC staking</span>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
