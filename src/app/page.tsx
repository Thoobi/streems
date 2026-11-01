import { Microphone, Waveform as WaveformIcon } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { LiveBadge, Waveform } from "@/components/brand";
import { JoinCodeForm, StartCallForm } from "@/components/code-forms";
import { LocalTime } from "@/components/local-time";
import { LinkField, ShareLink } from "@/components/share-link";
import { SiteHeader } from "@/components/site-header";
import { getCurrentUser } from "@/lib/auth";
import { getDb, type Call } from "@/lib/db";
import { getOrigin } from "@/lib/origin";

type CallWithMinutes = Call & { minutes: number };

const formatDuration = (minutes: number) =>
  minutes < 1 ? "Under a minute" : minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) return <Landing />;

  // Hosts see their own calls; everyone else arrives through the link the host shares.
  const db = await getDb();
  const live = await db
    .prepare(
      `SELECT *, CAST((julianday('now') - julianday(started_at)) * 1440 AS INTEGER) AS minutes
         FROM calls WHERE host_id = ? AND status = 'live' ORDER BY started_at DESC LIMIT 1`,
    )
    .bind(user.id)
    .first<CallWithMinutes>();
  const { results: past } = await db
    .prepare(
      `SELECT *, CAST((julianday(ended_at) - julianday(started_at)) * 1440 AS INTEGER) AS minutes
         FROM calls WHERE host_id = ? AND status = 'ended' ORDER BY started_at DESC LIMIT 20`,
    )
    .bind(user.id)
    .all<CallWithMinutes>();
  const origin = await getOrigin();
  const firstName = user.name.split(/\s+/)[0];

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-5 pb-[max(env(safe-area-inset-bottom),2.5rem)] pt-8 sm:pt-12">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-4xl sm:text-5xl">Welcome, {firstName}</h1>
          <p className="text-stone-500 dark:text-stone-400">
            {live
              ? "You’re live. Share the link. Anyone who opens it joins, no sign-up."
              : "Start a call, then share its link."}
          </p>
        </div>

        {live ? (
          <section className="relative flex flex-col gap-6 overflow-hidden rounded-[1.75rem] bg-stone-950 p-6 text-white ring-1 ring-white/10 sm:p-8">
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: "radial-gradient(70% 60% at 85% 0%, rgba(220,38,38,0.35), transparent 70%)" }}
            />
            <div className="relative flex items-center justify-between">
              <LiveBadge />
              <span className="text-sm text-stone-400">
                Started {live.minutes < 1 ? "just now" : `${formatDuration(live.minutes)} ago`}
              </span>
            </div>
            <div className="relative flex items-end justify-between gap-4">
              <h2 className="font-display text-3xl leading-tight sm:text-4xl">{live.title}</h2>
              <Waveform bars={10} className="mb-2 hidden h-8 shrink-0 gap-1 sm:flex" barClassName="w-1 bg-red-400" />
            </div>
            <div className="relative flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                Link · code <span className="font-mono tracking-widest text-white">{live.code}</span>
              </span>
              <LinkField url={`${origin}/c/${live.code}`} />
            </div>
            <div className="relative grid grid-cols-2 gap-3">
              <Link
                href={`/c/${live.code}`}
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-white font-semibold text-stone-900 transition hover:bg-stone-200"
              >
                <Microphone size={20} weight="fill" />
                Open studio
              </Link>
              <ShareLink
                path={`/c/${live.code}`}
                title={live.title}
                className="flex h-12 items-center justify-center rounded-full border border-white/20 font-semibold transition hover:bg-white/10"
              />
            </div>
          </section>
        ) : (
          <StartCallForm />
        )}

        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Past calls</h2>
            {past.length > 0 && <span className="text-sm text-stone-500">{past.length} recent</span>}
          </div>
          {past.length > 0 ? (
            <ul className="flex flex-col divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900/50">
              {past.map((c) => (
                <li key={c.code} className="flex items-center gap-4 px-4 py-4 sm:px-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                    <WaveformIcon size={20} weight="bold" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.title}</p>
                    <LocalTime utc={c.started_at} className="text-sm text-stone-500" />
                  </div>
                  <span className="shrink-0 text-sm tabular-nums text-stone-500">{formatDuration(c.minutes)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 px-6 py-10 text-center dark:border-stone-700">
              <WaveformIcon size={28} className="mb-3 text-stone-400" />
              <p className="font-medium">No calls yet</p>
              <p className="mt-1 text-sm text-stone-500">Your calls show up here after they end.</p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

function Landing() {
  return (
    <>
      <SiteHeader user={null} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 px-5 pb-[max(env(safe-area-inset-bottom),2.5rem)] pt-12">
        <div className="flex flex-col gap-5">
          <LiveBadge label="Live audio for prayer" />
          <h1 className="font-display text-4xl font-medium leading-[1.1] text-balance sm:text-6xl">
            Pray together, wherever everyone is.
          </h1>
          <p className="max-w-xl text-lg text-stone-500 dark:text-stone-400">
            Joining? Open the link your host sent, or type the call code below. No account needed.
          </p>
        </div>
        <JoinCodeForm />
        <p className="text-sm text-stone-500">
          Leading a prayer?{" "}
          <Link href="/signup" className="font-semibold text-amber-700 underline-offset-4 hover:underline dark:text-amber-500">
            Create a host account
          </Link>{" "}
          or{" "}
          <Link href="/login" className="font-semibold text-amber-700 underline-offset-4 hover:underline dark:text-amber-500">
            sign in
          </Link>
          .
        </p>
      </main>
    </>
  );
}
