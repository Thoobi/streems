import { Play } from "@phosphor-icons/react/ssr";
import { LiveBadge, Waveform } from "./brand";

// Desktop-only right half of the auth screens: shows what the app does instead of telling.
export function BrandPanel() {
  return (
    <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-[2rem] bg-stone-950 p-10 text-white ring-1 ring-white/10">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 70% 30%, rgba(217,119,6,0.55), transparent 70%), radial-gradient(50% 40% at 20% 85%, rgba(180,83,9,0.45), transparent 70%)",
        }}
      />

      <p className="relative max-w-xs text-sm text-stone-300">
        Go live with your prayer, share one link, and anyone can listen from anywhere.
      </p>

      <div className="relative mx-auto w-full max-w-sm rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <LiveBadge />
          <span className="text-xs text-stone-300">38 listening</span>
        </div>
        <p className="mt-5 font-display text-2xl">Midnight prayer</p>
        <p className="mt-1 text-sm text-stone-300">Led by Grace A.</p>
        <Waveform bars={28} className="mt-6 h-12 gap-1" barClassName="w-1.5 flex-1 bg-amber-400/90" />
        <div className="mt-6 flex items-center justify-between">
          <div className="flex -space-x-2">
            {["bg-amber-300", "bg-rose-300", "bg-emerald-300", "bg-sky-300"].map((bg) => (
              <span key={bg} className={`h-7 w-7 rounded-full border-2 border-stone-900 ${bg}`} />
            ))}
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-900">
            <Play size={14} weight="fill" /> Listen
          </span>
        </div>
      </div>

      <blockquote className="relative max-w-sm">
        <p className="font-display text-2xl leading-snug">
          “For where two or three gather in my name, there am I with them.”
        </p>
        <footer className="mt-2 text-sm text-stone-400">Matthew 18:20</footer>
      </blockquote>
    </div>
  );
}
