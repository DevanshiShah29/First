export default function MemoryJarLoading() {
  return (
    <div className="section-shell">
      <div className="flex min-h-[calc(100svh-10rem)] items-center justify-center py-10">
        <div className="w-full max-w-2xl rounded-[2rem] border border-line bg-card/70 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-10">
          <div className="mx-auto flex w-fit items-center gap-2 rounded-full border border-line bg-chip px-4 py-1 text-xs uppercase tracking-[0.22em] text-accent-text">
            <span>✨</span>
            <span>Memory Jar</span>
          </div>

          <div className="relative mx-auto mt-8 h-72 w-56 sm:h-80 sm:w-64">
            <div
              className="absolute inset-0 rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(circle at center, color-mix(in srgb, var(--brand-from, #7c3aed) 26%, transparent), transparent 68%)",
              }}
            />
            <div className="absolute inset-x-8 bottom-8 top-12 rounded-[2.4rem] border border-white/35 bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_30px_70px_rgba(0,0,0,0.28)] backdrop-blur-sm" />
            <div className="absolute left-1/2 top-8 h-10 w-28 -translate-x-1/2 rounded-[2rem] border border-white/50 bg-gradient-to-b from-[#d8b17a] to-[#a67845] shadow-[0_8px_24px_rgba(0,0,0,0.18)]" />
            <div className="absolute left-1/2 top-16 h-52 w-40 -translate-x-1/2 rounded-[2rem] border border-white/30 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.22),rgba(255,255,255,0.06)_40%,rgba(124,58,237,0.10)_70%,rgba(255,255,255,0.08)_100%)]" />
            {[
              { left: "20%", top: "28%", size: "0.75rem", delay: "0s" },
              { left: "68%", top: "34%", size: "0.95rem", delay: "0.15s" },
              { left: "42%", top: "48%", size: "0.65rem", delay: "0.3s" },
              { left: "58%", top: "64%", size: "1rem", delay: "0.45s" },
            ].map((star) => (
              <span
                key={`${star.left}-${star.top}`}
                className="absolute animate-pulse rounded-full bg-white/90 shadow-[0_0_18px_rgba(255,255,255,0.45)]"
                style={{
                  left: star.left,
                  top: star.top,
                  width: star.size,
                  height: star.size,
                  animationDelay: star.delay,
                }}
              />
            ))}
          </div>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted sm:text-base">
            There are a few memories hiding in here...
          </p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-soft">
            Open the jar to read a memory
          </p>
        </div>
      </div>
    </div>
  );
}
