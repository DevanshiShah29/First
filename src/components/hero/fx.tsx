/** Shared decorative FX used by World / Nook / Studio interactive heroes. */

export function Notes({ looping }: { looping?: boolean }) {
  return (
    <div className={`world-fx${looping ? " is-loop" : ""}`} aria-hidden>
      {["♪", "♫", "♩"].map((n, i) => (
        <span key={n} className="world-note" style={{ left: `${18 + i * 14}%`, animationDelay: `${i * 0.18}s` }}>
          {n}
        </span>
      ))}
    </div>
  );
}

export function MiniUi({ className = "world-ui" }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <span />
      <span />
      <span />
    </div>
  );
}

export function Ingredients() {
  return (
    <div className="world-bits" aria-hidden>
      <i style={{ left: "10%", animationDelay: "0s" }} />
      <i style={{ left: "40%", animationDelay: "0.2s" }} />
      <i style={{ left: "68%", animationDelay: "0.35s" }} />
    </div>
  );
}
