"use client";

import { useId } from "react";

type LogoProps = {
  className?: string;
  title?: string;
};

export function LogoMark({ className = "h-9 w-9", title }: LogoProps) {
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={`${uid}-fill`} x1="6" y1="4" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--brand-from, #8b5cf6)" />
          <stop offset="55%" stopColor="var(--brand-from, #7c3aed)" />
          <stop offset="100%" stopColor="var(--brand-to, #4f46e5)" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill={`url(#${uid}-fill)`} />
      <path
        fill="#f8f8f8"
        fillRule="evenodd"
        d="M9.2 9.2h8.1c7.05 0 11.5 4.15 11.5 10.8S24.35 30.8 17.3 30.8H9.2V9.2Zm4.15 3.7v14.2h3.7c4.55 0 7.35-2.55 7.35-7.1s-2.8-7.1-7.35-7.1h-3.7Z"
      />
      <path
        fill="none"
        stroke="#f8f8f8"
        strokeWidth="2.45"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22.6 13.6c3.55-2.15 8.7-.35 8.35 3.85-.3 3.25-3.7 4.15-7.45 5.35-3.55 1.15-6.15 2.7-5.75 5.85.5 3.7 5.35 4.55 9.25 2.45"
      />
    </svg>
  );
}

export function Logo({ name }: { name: string }) {
  const [first] = name.split(" ");
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark className="logo-mark h-9 w-9 shrink-0 transition" />
      <span className="text-[0.95rem] font-semibold tracking-[-0.03em] text-foreground">
        <span className="sm:hidden">{first}</span>
        <span className="hidden sm:inline">{name}</span>
      </span>
    </span>
  );
}
