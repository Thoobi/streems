import { LiveBadge } from "@/components/brand";
import { JoinCodeForm } from "@/components/code-forms";
import { SiteHeader } from "@/components/site-header";
import { isHost } from "@/lib/host";

export default async function Home() {
  return (
    <>
      <SiteHeader host={await isHost()} />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 px-5 pb-[max(env(safe-area-inset-bottom),2.5rem)] pt-12">
        <div className="flex flex-col gap-5">
          <LiveBadge label="Live audio for prayer" />
          <h1 className="font-display text-4xl font-medium leading-[1.1] text-balance sm:text-6xl">
            Pray together, wherever everyone is.
          </h1>
          <p className="max-w-xl text-lg text-stone-500 dark:text-stone-400">
            Open the link you were sent, or type the call code below. No account or app needed.
          </p>
        </div>
        <JoinCodeForm />
      </main>
    </>
  );
}
