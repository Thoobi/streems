import { SignOut } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import type { User } from "@/lib/db";
import { Logo } from "./brand";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

export function SiteHeader({ user }: { user: User | null }) {
  return (
    <header className="sticky top-0 z-10 border-b border-stone-200/70 bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-lg dark:border-stone-800/70">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-5">
        <Logo />
        {user ? (
          // <details> gives a tap-to-open menu with no client JS.
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full p-1 pr-3 transition hover:bg-stone-200/60 dark:hover:bg-stone-800 [&::-webkit-details-marker]:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
                {initials(user.name)}
              </span>
              <span className="hidden max-w-40 truncate text-sm font-medium sm:block">{user.name}</span>
            </summary>
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-stone-200 bg-white p-1.5 shadow-xl dark:border-stone-800 dark:bg-stone-900">
              <div className="px-3 py-2">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-stone-500">{user.email}</p>
              </div>
              <form action={signOut}>
                <button className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-red-600 hover:bg-stone-100 dark:hover:bg-stone-800">
                  <SignOut size={18} />
                  Sign out
                </button>
              </form>
            </div>
          </details>
        ) : (
          <nav className="flex items-center gap-2 text-sm font-semibold">
            <Link href="/login" className="rounded-full px-4 py-2 hover:bg-stone-200/60 dark:hover:bg-stone-800">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-stone-900 px-4 py-2 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900"
            >
              Get started
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
