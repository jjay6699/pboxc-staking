"use client";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-black/30 bg-black/40">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 h-16 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-5">
          <span className="font-semibold tracking-tight">PBOXC</span>
          <nav className="hidden sm:flex items-center gap-6 text-sm">
            <a className="text-white/70 hover:text-white transition-colors" href="#plans">Plans</a>
            <a className="text-white/70 hover:text-white transition-colors" href="#calculator">Calculator</a>
            <a className="text-white/70 hover:text-white transition-colors" href="#dashboard">Dashboard</a>
            <a className="text-white/70 hover:text-white transition-colors" href="#stats">Stats</a>
          </nav>
        </div>
        <div className="hidden sm:block text-xs text-white/70">Stake SOL → Earn PBOXC</div>
      </div>
    </header>
  );
}


