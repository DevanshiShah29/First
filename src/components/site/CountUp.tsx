/**
 * Renders a stat value with suffix.
 * @example <CountUp value={5} suffix="+" />
 */
export function CountUp({ value, suffix }: { value: number; suffix: string }) {
  return (
    <span>
      {value}
      {suffix}
    </span>
  );
}
