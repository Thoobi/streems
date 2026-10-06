"use client";

// D1 stores UTC ("YYYY-MM-DD HH:MM:SS"). Format in the viewer's timezone, not the Worker's (always UTC).
export function LocalTime({ utc, className }: { utc: string; className?: string }) {
  const date = new Date(utc.replace(" ", "T") + "Z");
  return (
    <time dateTime={date.toISOString()} className={className} suppressHydrationWarning>
      {date.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
    </time>
  );
}
