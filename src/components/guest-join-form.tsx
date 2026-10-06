"use client";

import { Play } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState } from "react";
import { joinAsGuest } from "@/app/guest-actions";
import { LiveBadge, Logo, Waveform } from "./brand";
import { errorClass, inputClass, primaryButtonClass } from "./ui";

// What someone sees when they open a shared link without being signed in.
export function GuestJoinForm({ broadcastId, title, hostName }: { broadcastId: string; title: string; hostName: string }) {
  const [state, action, pending] = useActionState(joinAsGuest.bind(null, broadcastId), undefined);

  return (
    <div className="flex min-h-dvh flex-1 flex-col px-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-[max(env(safe-area-inset-top),1.25rem)] sm:px-10">
      <Logo />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-8 pt-12 sm:justify-center sm:pt-0">
        <div className="flex flex-col gap-4 rounded-3xl bg-stone-950 p-6 text-white ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <LiveBadge label="Live now" />
            <Waveform bars={10} className="h-5 gap-[3px]" barClassName="w-[3px] bg-amber-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl leading-tight">{title}</h1>
            <p className="mt-1 text-sm text-stone-400">Led by {hostName}</p>
          </div>
        </div>

        <form action={action} className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Your name</span>
            <input
              name="name"
              autoComplete="name"
              placeholder="So the host knows who’s listening"
              required
              maxLength={40}
              className={inputClass}
            />
          </label>
          {state?.error && (
            <p role="alert" className={errorClass}>
              {state.error}
            </p>
          )}
          <button disabled={pending} className={primaryButtonClass}>
            {!pending && <Play size={18} weight="fill" className="mr-2" />}
            {pending ? "Joining…" : "Listen now"}
          </button>
        </form>

        <p className="text-center text-sm text-stone-500 dark:text-stone-400">
          No account needed.{" "}
          <Link
            href={`/login?next=${encodeURIComponent(`/live/${broadcastId}`)}`}
            className="font-semibold text-amber-700 underline-offset-4 hover:underline dark:text-amber-500"
          >
            Sign in instead
          </Link>
        </p>
      </main>
    </div>
  );
}
