"use client";

import { Eye, EyeSlash } from "@phosphor-icons/react";
import Link from "next/link";
import { useActionState, useState } from "react";
import type { AuthState } from "@/app/(auth)/actions";
import { errorClass, inputClass, primaryButtonClass } from "./ui";

type Props = {
  mode: "login" | "signup";
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  // Path to return to after signing in, e.g. the live link someone was opening.
  next?: string;
};

const copy = {
  login: {
    title: "Welcome back",
    subtitle: "Sign in to go live or join a prayer as yourself.",
    submit: "Sign in",
    pending: "Signing in…",
    switchText: "New to Prayer Live?",
    switchLink: "Create an account",
    switchHref: "/signup",
  },
  signup: {
    title: "Create your account",
    subtitle: "Go live with your prayer and share the link with anyone.",
    submit: "Create account",
    pending: "Creating account…",
    switchText: "Already have an account?",
    switchLink: "Sign in",
    switchHref: "/login",
  },
};

export function AuthForm({ mode, action, next }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const isSignup = mode === "signup";
  const text = copy[mode];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl sm:text-5xl">{text.title}</h1>
        <p className="text-stone-500 dark:text-stone-400">{text.subtitle}</p>
      </div>

      <form action={formAction} className="flex flex-col gap-5">
        {next && <input type="hidden" name="next" value={next} />}
        {isSignup && (
          <Field label="Your name">
            <input
              name="name"
              autoComplete="name"
              placeholder="How listeners will see you"
              required
              autoFocus
              defaultValue={state?.fields?.name}
              className={inputClass}
            />
          </Field>
        )}
        <Field label="Email">
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            placeholder="you@example.com"
            required
            autoFocus={!isSignup}
            defaultValue={state?.fields?.email}
            className={inputClass}
          />
        </Field>
        <Field label="Password" hint={isSignup ? "At least 8 characters" : undefined}>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={isSignup ? 8 : undefined}
              required
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-4 text-stone-500 hover:text-stone-900 dark:hover:text-white"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </Field>

        {state?.error && (
          <p role="alert" className={errorClass}>
            {state.error}
          </p>
        )}

        <button disabled={pending} className={`${primaryButtonClass} mt-1`}>
          {pending ? text.pending : text.submit}
        </button>
      </form>

      <p className="text-center text-sm text-stone-500 dark:text-stone-400">
        {text.switchText}{" "}
        <Link
          href={`${text.switchHref}${next ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-semibold text-amber-700 underline-offset-4 hover:underline dark:text-amber-500"
        >
          {text.switchLink}
        </Link>
      </p>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between text-sm font-medium">
        {label}
        {hint && <span className="font-normal text-stone-400">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
