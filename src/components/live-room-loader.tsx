"use client";

import dynamic from "next/dynamic";
import type { LiveRoomProps } from "./live-room";

// The RealtimeKit SDK touches browser APIs at import time, so never render it on the server.
const LiveRoom = dynamic(() => import("./live-room"), {
  ssr: false,
  loading: () => <div className="flex min-h-dvh flex-1 items-center justify-center bg-stone-950 text-stone-400">Loading…</div>,
});

export function LiveRoomLoader(props: LiveRoomProps) {
  return <LiveRoom {...props} />;
}
