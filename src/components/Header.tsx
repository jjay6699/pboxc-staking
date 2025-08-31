"use client";

import Image from "next/image";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-black/30 bg-black/40">
      <div className="px-6 sm:px-8">
        <div className="max-w-[1200px] mx-auto h-16 flex items-center justify-between border-b border-white/10">
        {/* Left: Logo */}
        <div className="flex items-center">
          <Image src="/logo-header.png" width={160} height={32} alt="PBOXC" priority />
        </div>
        {/* Right: Nav */}
        <nav className="flex items-center gap-6 text-sm">
          <a className="text-white/70 hover:text-white transition-colors" href="#plans">Plans</a>
          <a className="text-white/70 hover:text-white transition-colors" href="#calculator">Calculator</a>
          <a className="text-white/70 hover:text-white transition-colors" href="#dashboard">Dashboard</a>
          <a className="text-white/70 hover:text-white transition-colors" href="#stats">Stats</a>
        </nav>
        </div>
      </div>
    </header>
  );
}


