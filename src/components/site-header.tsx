import { LockKeyOpen } from "@phosphor-icons/react/ssr";
import Link from "next/link";
import { lockHostAction } from "@/app/actions";
import { Logo } from "./brand";

export function SiteHeader({ host }: { host: boolean }) {
  return (
    <header className="sticky top-0 z-10 border-b border-stone-200/70 bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur-lg dark:border-stone-800/70">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-5">
        <Logo />
        {host ? (
          <form action={lockHostAction}>
            <button className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold hover:bg-stone-200/60 dark:hover:bg-stone-800">
              <LockKeyOpen size={18} />
              Lock host
            </button>
          </form>
        ) : (
          <Link href="/host" className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-stone-200/60 dark:hover:bg-stone-800">
            Host
          </Link>
        )}
      </div>
    </header>
  );
}
