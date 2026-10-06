"use client";

import { Broadcast } from "@phosphor-icons/react";
import { useActionState } from "react";
import { startBroadcast } from "@/app/broadcast-actions";
import { Waveform } from "./brand";

export function GoLiveForm() {
  const [state, action, pending] = useActionState(startBroadcast, undefined);

  return (
    <form
      action={action}
      className="relative flex flex-col gap-8 overflow-hidden rounded-[1.75rem] bg-stone-950 p-6 text-white ring-1 ring-white/10 sm:p-8"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(70% 60% at 85% 0%, rgba(217,119,6,0.35), transparent 70%)" }}
      />
      <div className="relative flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">New broadcast</span>
        <Waveform bars={8} className="h-4 gap-[3px] opacity-60" barClassName="w-[3px] bg-amber-400" />
      </div>

      <label className="relative flex flex-col gap-2">
        <span className="sr-only">Title</span>
        <input
          name="title"
          placeholder="Add a title"
          defaultValue="Prayer meeting"
          maxLength={120}
          className="w-full border-b border-white/15 bg-transparent pb-3 font-sans text-2xl font-medium tracking-tight text-white outline-none transition placeholder:text-stone-600 focus:border-amber-500 sm:text-3xl"
        />
        <span className="text-sm text-stone-400">Listeners see this when they open your link.</span>
      </label>

      {state?.error && (
        <p role="alert" className="relative rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">
          {state.error}
        </p>
      )}

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="order-2 text-center text-xs text-stone-500 sm:order-1 sm:text-left">
          Your browser will ask to use the microphone.
        </p>
        <button
          disabled={pending}
          className="order-1 flex h-14 items-center justify-center gap-2.5 rounded-full bg-red-600 px-8 text-lg font-semibold text-white shadow-lg shadow-red-900/40 transition hover:bg-red-500 active:scale-[0.99] disabled:opacity-60 sm:order-2"
        >
          <Broadcast size={24} weight="bold" />
          {pending ? "Starting…" : "Go live"}
        </button>
      </div>
    </form>
  );
}
