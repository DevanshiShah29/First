export default function MemoryJarLoading() {
  return (
    <div className="jar-of-stars flex min-h-dvh items-center justify-center px-4">
      <div className="text-center">
        <p className="font-cormorant text-3xl text-brand-blue sm:text-4xl">
          a little jar of <span className="text-brand-yellow">stars</span>
        </p>
        <p className="mt-3 font-mono-body text-xs text-brand-black/70 sm:text-sm">
          There are a few memories hiding in here…
        </p>
        <div className="relative mx-auto mt-8 h-48 w-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/memory-jar/mason-jar.png"
            alt=""
            className="jar-photo jar-photo--light h-full w-full object-contain animate-float-gentle"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/memory-jar/mason-jar-dark.png"
            alt=""
            className="jar-photo jar-photo--dark absolute inset-0 h-full w-full object-contain animate-float-gentle"
          />
        </div>
      </div>
    </div>
  );
}
