"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Re-renders the server page periodically so people waiting see the prayer go live.
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
