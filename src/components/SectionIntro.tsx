export default function SectionIntro({ title, subtitle, className }: { title: string; subtitle?: string; className?: string }) {
  return (
    <div className={`rounded-2xl bg-white/[0.02] border border-white/[0.08] px-4 py-3 ${className ?? ""}`}>
      <div className="text-sm font-medium">{title}</div>
      {subtitle ? <div className="text-xs text-white/60 mt-0.5">{subtitle}</div> : null}
    </div>
  );
}
