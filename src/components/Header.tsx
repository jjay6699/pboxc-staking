"use client";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-black/30 bg-black/40 border-b border-white/10">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-semibold tracking-tight">PBOXC</span>
          <nav className="hidden sm:flex items-center gap-4 text-sm text-white/70">
            <a className="hover:text-white" href="#plans">Plans</a>
            <a className="hover:text-white" href="#calculator">Calculator</a>
            <a className="hover:text-white" href="#dashboard">Dashboard</a>
            <a className="hover:text-white" href="#stats">Stats</a>
          </nav>
        </div>
        <div className="text-xs text-white/60">Stake SOL → Earn PBOXC</div>
      </div>
    </header>
  );
}


