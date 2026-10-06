import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex w-fit items-center gap-2.5 font-semibold tracking-tight ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-700 text-white" aria-hidden>
        <Waveform bars={4} className="h-3.5 gap-[2px]" barClassName="w-[2px] bg-white" />
      </span>
      Prayer Live
    </Link>
  );
}

// Animated audio bars. Delays are fixed so server and client render the same markup.
const DELAYS = [0, 0.45, 0.2, 0.7, 0.1, 0.55, 0.3, 0.85, 0.15, 0.6, 0.35, 0.8];

export function Waveform({
  bars = 12,
  className = "",
  barClassName = "",
}: {
  bars?: number;
  className?: string;
  barClassName?: string;
}) {
  return (
    <span className={`flex items-end ${className}`} aria-hidden>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className={`wave-bar h-full rounded-full ${barClassName}`}
          style={{ animationDelay: `${DELAYS[i % DELAYS.length]}s` }}
        />
      ))}
    </span>
  );
}

export function LiveBadge({ label = "Live" }: { label?: string }) {
  return (
    <span className="flex w-fit items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
      {label}
    </span>
  );
}
