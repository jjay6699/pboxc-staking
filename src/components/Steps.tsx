"use client";

export default function Steps() {
  const steps = [
    { title: "Connect wallet", desc: "Link your Phantom wallet" },
    { title: "Choose a plan", desc: "Select amount and duration" },
    { title: "Confirm stake", desc: "Approve the SOL transaction" },
    { title: "Claim rewards", desc: "Collect CREX at maturity" },
  ];

  return (
    <section className="process-section" aria-labelledby="process-title">
      <div className="process-heading">
        <div>
          <p className="section-kicker">THE STAKING PROCESS</p>
          <h2 id="process-title">Simple from stake to reward.</h2>
        </div>
        <p>
          Four clear steps, with every transaction confirmed through your wallet.
        </p>
      </div>

      <div className="process-track">
        <div className="process-line" aria-hidden="true" />
        {steps.map((step, index) => (
          <div key={step.title} className="process-step">
            <div className="process-number">{String(index + 1).padStart(2, "0")}</div>
            <div className="process-step-copy">
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
