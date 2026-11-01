"use client";

import { ArrowRight, Broadcast, LockKey } from "@phosphor-icons/react";
import { useActionState } from "react";
import { joinByCode, startCall, unlockHostAction } from "@/app/actions";
import { Waveform } from "./brand";
import { errorClass, inputClass, primaryButtonClass } from "./ui";

export function JoinCodeForm() {
  const [state, action, pending] = useActionState(joinByCode, undefined);
  return (
    <form action={action} className="flex w-full max-w-md flex-col gap-3">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Have a call code?</span>
        <div className="flex gap-2">
          <input
            name="code"
            required
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="e.g. K7M2QX"
            maxLength={200}
            className={`${inputClass} font-mono uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal`}
          />
          <button
            disabled={pending}
            aria-label="Join"
            className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-stone-900 px-5 font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60 dark:bg-white dark:text-stone-900"
          >
            {pending ? "…" : "Join"}
            <ArrowRight size={18} weight="bold" />
          </button>
        </div>
      </label>
      {state?.error && (
        <p role="alert" className={errorClass}>
          {state.error}
        </p>
      )}
    </form>
  );
}

export function PasscodeForm() {
  const [state, action, pending] = useActionState(unlockHostAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Host passcode</span>
        <input name="passcode" type="password" required autoComplete="current-password" autoFocus className={inputClass} />
      </label>
      {state?.error && (
        <p role="alert" className={errorClass}>
          {state.error}
        </p>
      )}
      <button disabled={pending} className={primaryButtonClass}>
        {!pending && <LockKey size={18} weight="bold" className="mr-2" />}
        {pending ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}

export function StartCallForm({ lastHostName }: { lastHostName: string }) {
  const [state, action, pending] = useActionState(startCall, undefined);
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
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">New call</span>
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
        <span className="text-sm text-stone-400">People see this when they open your link.</span>
      </label>

      <label className="relative flex flex-col gap-2">
        <span className="text-sm text-stone-400">Led by</span>
        <input
          name="hostName"
          required
          defaultValue={lastHostName}
          placeholder="Your name"
          maxLength={40}
          autoComplete="name"
          className="h-12 w-full rounded-xl border border-white/15 bg-white/5 px-4 text-base text-white outline-none transition placeholder:text-stone-500 focus:border-amber-500"
        />
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
          {pending ? "Starting…" : "Start call"}
        </button>
      </div>
    </form>
  );
}
