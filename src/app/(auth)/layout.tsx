import { redirect } from "next/navigation";
import { Logo } from "@/components/brand";
import { BrandPanel } from "@/components/brand-panel";
import { getCurrentUser } from "@/lib/auth";

// Phones: the form fills the screen. Desktop: form on the left, brand panel on the right.
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getCurrentUser()) redirect("/");

  return (
    <div className="flex min-h-dvh flex-1">
      <main className="flex flex-1 flex-col px-5 pb-[max(env(safe-area-inset-bottom),1.5rem)] pt-[max(env(safe-area-inset-top),1.25rem)] sm:px-10 lg:basis-1/2">
        <Logo />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col pt-12 sm:justify-center sm:pt-0">{children}</div>
      </main>
      <aside className="hidden p-3 lg:flex lg:basis-1/2">
        <BrandPanel />
      </aside>
    </div>
  );
}
