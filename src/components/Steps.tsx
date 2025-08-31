export default function Steps() {
  const steps = [
    { title: "Connect", desc: "Connect Phantom" },
    { title: "Choose Plan", desc: "Pick lock & see rewards" },
    { title: "Stake", desc: "Send SOL after plan" },
    { title: "Claim/Restake", desc: "After maturity" },
  ];
  return (
    <div className="relative rounded-2xl bg-white/[0.02] border border-white/[0.08] p-4">
      {/* connecting line on desktop */}
      <div className="hidden sm:block absolute left-6 right-6 top-[28px] border-t border-white/[0.12]" />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {steps.map((s, i) => (
          <div
            key={s.title}
            className="flex flex-row sm:flex-col items-start sm:items-center text-left sm:text-center gap-3"
          >
            <div className="relative z-10 mt-1 h-6 w-6 shrink-0 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold shadow">
              {i + 1}
            </div>
            <div>
              <div className="text-sm font-medium">{s.title}</div>
              <div className="text-xs text-white/60">{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
