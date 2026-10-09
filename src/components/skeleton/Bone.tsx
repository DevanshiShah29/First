/**
 * Pulsing placeholder bar. Hidden from assistive tech; the page names the loading state.
 * @example <Bone className="h-4 w-32" />
 */
export function Bone({ className = "" }: { className?: string }) {
  return (
    <span
      className={`block animate-pulse rounded-md bg-foreground/10 motion-reduce:animate-none ${className}`}
      aria-hidden="true"
    />
  );
}
