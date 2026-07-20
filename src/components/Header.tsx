"use client";

import Image from "next/image";
import { useState } from "react";
import { Menu, Wallet, X } from "lucide-react";
import { usePhantom } from "@/hooks/usePhantom";

export default function Header() {
  const [open, setOpen] = useState(false);
  const { provider, address, connecting, connect, networkLabel } = usePhantom();
  const close = () => setOpen(false);
  const walletLabel = address
    ? `${address.slice(0, 4)}…${address.slice(-4)}`
    : connecting
      ? "Connecting…"
      : provider
        ? "Connect Wallet"
        : "Connect Wallet";

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#080808]/88 backdrop-blur-xl">
      <div className="px-6 sm:px-8">
        <div className="max-w-[1200px] mx-auto h-[84px] flex items-center justify-between">
          <div className="flex items-center gap-10">
            <a href="#" className="flex items-center" aria-label="CREX home">
              <Image src="/logo-header.png" width={64} height={64} alt="CREX" priority className="site-logo" />
            </a>

            <nav className="hidden lg:flex items-center gap-1 text-sm">
              <a className="nav-link" href="#stake">Stake</a>
              <a className="nav-link" href="#live-stakes">Live Stakes</a>
              <a className="nav-link" href="#plans">Plans</a>
              <a className="nav-link" href="#dashboard">Portfolio</a>
              <a className="nav-link" href="#stats">Rewards</a>
            </nav>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <div className="network-pill">
              <span className="network-dot" />
              CREX Chain Testnet
            </div>
            <button
              onClick={connect}
              disabled={connecting || !!address}
              className="wallet-button"
            >
              <Wallet size={16} strokeWidth={1.8} />
              {walletLabel}
            </button>
          </div>

          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="sm:hidden inline-flex items-center justify-center rounded-lg p-2 text-white/80 hover:text-white hover:bg-white/[0.06] transition"
            onClick={() => setOpen(v => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <div className={`sm:hidden ${open ? "block" : "hidden"}`}>
        <div className="px-6">
          <div className="max-w-[1200px] mx-auto pb-5">
            <nav className="py-3 flex flex-col text-sm">
              <a onClick={close} className="mobile-nav-link" href="#stake">Stake</a>
              <a onClick={close} className="mobile-nav-link" href="#live-stakes">Live Stakes</a>
              <a onClick={close} className="mobile-nav-link" href="#plans">Plans</a>
              <a onClick={close} className="mobile-nav-link" href="#dashboard">Portfolio</a>
              <a onClick={close} className="mobile-nav-link" href="#stats">Rewards</a>
            </nav>
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
              <div className="network-pill">
                <span className="network-dot" />
                {networkLabel}
              </div>
              <button
                onClick={() => { connect(); close(); }}
                disabled={connecting || !!address}
                className="wallet-button"
              >
                <Wallet size={16} />
                {walletLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}


