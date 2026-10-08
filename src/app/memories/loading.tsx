import Image from "next/image";

/**
 * Renders the memories route loading UI.
 * @example <MemoryJarLoading /> for /memories
 */
export default function MemoryJarLoading() {
  return (
    <div className="jar-of-stars flex min-h-dvh items-center justify-center">
      <div className="text-center">
        <p className="font-cormorant text-3xl text-brand-blue sm:text-4xl">
          a little jar of <span className="text-brand-yellow">stars</span>
        </p>
        <p className="mt-3 font-mono-body text-xs text-brand-black/70 sm:text-sm">
          There are a few memories hiding in here…
        </p>
        <div className="relative mx-auto mt-8 h-48 w-40">
          <Image
            src="/memory-jar/mason-jar.png"
            alt=""
            width={320}
            height={416}
            priority
            className="jar-photo jar-photo--light h-full w-full object-contain animate-float-gentle"
          />
          <Image
            src="/memory-jar/mason-jar-dark.png"
            alt=""
            width={320}
            height={416}
            priority
            className="jar-photo jar-photo--dark absolute inset-0 h-full w-full object-contain animate-float-gentle"
          />
        </div>
      </div>
    </div>
  );
}
