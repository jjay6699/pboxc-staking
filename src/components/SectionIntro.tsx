export default function SectionIntro({ title, subtitle, className }: { title: string; subtitle?: string; className?: string }) {
  return (
    <div className={`section-heading ${className ?? ""}`}>
      <div>
        <p className="section-kicker">CREX STAKING</p>
        <h2>{title}</h2>
      </div>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}
