"use client";

import { Check, Copy, ShareNetwork } from "@phosphor-icons/react";
import { useState } from "react";

async function shareOrCopy(url: string, title: string) {
  if (navigator.share && matchMedia("(pointer: coarse)").matches) {
    await navigator.share({ title, text: `Join "${title}" live`, url }).catch(() => {});
    return false;
  }
  await navigator.clipboard.writeText(url);
  return true;
}

// Copies (or, on phones, opens the share sheet for) a link to a broadcast.
export function ShareLink({
  path,
  title,
  className,
  compact,
}: {
  path: string;
  title: string;
  className?: string;
  // Icon only, for tight control bars.
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (await shareOrCopy(new URL(path, window.location.origin).toString(), title)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button type="button" onClick={share} className={`gap-2 ${className ?? ""}`} aria-label={compact ? "Share link" : undefined}>
      {copied ? <Check size={20} weight="bold" /> : <ShareNetwork size={20} weight="bold" />}
      {!compact && (copied ? "Link copied" : "Share link")}
    </button>
  );
}

// The link itself, visible, with a copy button next to it.
export function LinkField({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex h-12 items-center gap-2 rounded-xl border border-white/15 bg-white/5 pl-4 pr-1.5">
      <span className="min-w-0 flex-1 truncate font-mono text-sm text-stone-300">{url.replace(/^https?:\/\//, "")}</span>
      <button
        type="button"
        onClick={copy}
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white px-3.5 text-sm font-semibold text-stone-900 transition hover:bg-stone-200"
      >
        {copied ? <Check size={16} weight="bold" /> : <Copy size={16} weight="bold" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
