"use client";

import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-black/30 bg-black/40">
      <div className="px-6 sm:px-8">
        <div className="max-w-[1200px] mx-auto h-16 flex items-center justify-between border-b border-white/10">
          {/* Left: Logo */}
          <div className="flex items-center">
            <Image src="/logo-header.png" width={160} height={32} alt="PBOXC" priority />
          </div>

          {/* Right: Nav (desktop) */}
          <nav className="hidden sm:flex items-center gap-6 text-sm">
            <a className="link-neo" href="#plans">Plans</a>
            <a className="link-neo" href="#calculator">Calculator</a>
            <a className="link-neo" href="#dashboard">Dashboard</a>
            <a className="link-neo" href="#stats">Stats</a>
          </nav>

          {/* Mobile toggle */}
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="sm:hidden inline-flex items-center justify-center rounded-md p-2 text-white/80 hover:text-white hover:bg-white/10 transition"
            onClick={() => setOpen(v => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu panel */}
      <div className={`sm:hidden ${open ? "block" : "hidden"}`}>
        <div className="px-6">
          <div className="max-w-[1200px] mx-auto border-b border-white/10">
            <nav className="py-3 flex flex-col gap-2 text-sm">
              <a onClick={close} className="link-neo" href="#plans">Plans</a>
              <a onClick={close} className="link-neo" href="#calculator">Calculator</a>
              <a onClick={close} className="link-neo" href="#dashboard">Dashboard</a>
              <a onClick={close} className="link-neo" href="#stats">Stats</a>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}


