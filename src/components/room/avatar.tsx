export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("") || "?";

const COLORS = ["bg-amber-300", "bg-rose-300", "bg-emerald-300", "bg-sky-300", "bg-violet-300", "bg-orange-300"];

// Same name, same color, on every screen.
const colorFor = (name: string) => COLORS[[...name].reduce((sum, c) => sum + c.charCodeAt(0), 0) % COLORS.length];

export function Avatar({
  name,
  size = 40,
  speaking = false,
  className = "",
}: {
  name: string;
  size?: number;
  speaking?: boolean;
  className?: string;
}) {
  return (
    <span
      title={name}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      className={`flex shrink-0 items-center justify-center rounded-full font-bold text-stone-900 ring-2 transition ${colorFor(name)} ${
        speaking ? "ring-amber-400" : "ring-transparent"
      } ${className}`}
    >
      {initials(name)}
    </span>
  );
}
