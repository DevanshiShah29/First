import type { ReactNode } from "react";

type IconProps = { className?: string };

function Svg({ children, className = "wp-menu-icon" }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      width="20"
      height="20"
      fill="currentColor"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function IconDash({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z" />
    </Svg>
  );
}

export function IconPin({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10 2 6.5 8H8v6l-2 2v2h8v-2l-2-2V8h1.5L10 2z" />
    </Svg>
  );
}

export function IconPages({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 3h9l3 3v11H4V3zm9 1.5V7h2.5L13 4.5zM6 9h8v1.2H6V9zm0 3h8v1.2H6V12z" />
    </Svg>
  );
}

export function IconStar({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10 2.5 12.2 7l4.8.7-3.5 3.4.8 4.8L10 13.8 5.7 15.9l.8-4.8L3 7.7 7.8 7 10 2.5z" />
    </Svg>
  );
}

export function IconHero({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 5h14v10H3V5zm1.5 1.5v7h11v-7h-11zM7 17h6v1.5H7V17z" />
    </Svg>
  );
}

export function IconAppearance({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10 2a8 8 0 0 0 0 16c.7 0 1-.5 1-1 0-.3-.1-.5-.3-.7-.2-.3-.3-.6-.3-1 0-.8.7-1.5 1.5-1.5H14A4 4 0 0 0 10 2zm-3.5 8a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm2.8-4a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4zm3.4 0a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4zM15 9.5a1.2 1.2 0 1 1 0-2.4 1.2 1.2 0 0 1 0 2.4z" />
    </Svg>
  );
}

export function IconSettings({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M8.2 2h3.6l.4 2.1c.5.2 1 .5 1.4.8l2-1.1 1.8 3.1-1.7 1.3c.1.5.1 1 0 1.5l1.7 1.3-1.8 3.1-2-1.1c-.4.3-.9.6-1.4.8L11.8 18H8.2l-.4-2.1c-.5-.2-1-.5-1.4-.8l-2 1.1L2.6 13l1.7-1.3c-.1-.5-.1-1 0-1.5L2.6 9 4.4 5.9l2 1.1c.4-.3.9-.6 1.4-.8L8.2 2zM10 12.2A2.2 2.2 0 1 0 10 7.8a2.2 2.2 0 0 0 0 4.4z" />
    </Svg>
  );
}

export function IconHome({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M10 3 3 9h2v7h4v-5h2v5h4V9h2L10 3z" />
    </Svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M9 4h2v5h5v2h-5v5H9v-5H4V9h5V4z" />
    </Svg>
  );
}

export function IconMenu({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 5h14v2H3V5zm0 4h14v2H3V9zm0 4h14v2H3v-2z" />
    </Svg>
  );
}

export function IconJar({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 2h8v2H6V2zm-1 3h10v2h-1v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7H5V5zm3 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm4 2a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-2 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
    </Svg>
  );
}

export function IconCode({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m6.5 13.5-4-3.5 4-3.5 1 1-2.8 2.5 2.8 2.5-1 1zm7 0-1-1 2.8-2.5-2.8-2.5 1-1 4 3.5-4 3.5zm-4.7 1.5-1.6-.5 3.5-10 1.6.5-3.5 10z" />
    </Svg>
  );
}

