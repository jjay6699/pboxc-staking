"use client";

export default function StickySummary({ address }: { address: string | null }) {
  if (!address) return null;
  return (
    <div className="fixed bottom-0 inset-x-0 sm:hidden z-40">
      <div className="mx-3 mb-3 rounded-2xl bg-white/[0.08] text-white shadow-lg backdrop-blur px-4 py-3 flex items-center justify-between">
        <div className="text-xs">
          <div className="text-white/80">Connected</div>
          <div className="font-medium">{address.slice(0, 4)}…{address.slice(-4)}</div>
        </div>
        <div className="text-xs text-white/70">Next maturity: —</div>
      </div>
    </div>
  );
}

