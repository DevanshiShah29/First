export function CountUp({ value, suffix }: { value: number; suffix: string }) {
  return (
    <span>
      {value}
      {suffix}
    </span>
  );
}
