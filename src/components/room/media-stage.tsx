"use client";

import { Microphone, MicrophoneSlash, Monitor } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";

export type Feed = {
  key: string;
  name: string;
  kind: "camera" | "screen";
  track: MediaStreamTrack | undefined;
  micOn: boolean;
  self: boolean;
};

// Shared screens take the main spot; cameras sit in a grid (or a strip under a screen).
export function MediaStage({ feeds }: { feeds: Feed[] }) {
  const screen = feeds.find((f) => f.kind === "screen");
  const cameras = feeds.filter((f) => f !== screen);

  if (screen) {
    return (
      <div className="flex w-full flex-col gap-3">
        <Tile feed={screen} className="aspect-video w-full" />
        {cameras.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {cameras.map((f) => (
              <Tile key={f.key} feed={f} className="aspect-[4/3] w-36 shrink-0 sm:w-44" />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`grid w-full gap-3 ${cameras.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
      {cameras.map((f) => (
        <Tile key={f.key} feed={f} className={cameras.length === 1 ? "aspect-[4/3] w-full sm:aspect-video" : "aspect-[3/4] w-full sm:aspect-[4/3]"} />
      ))}
    </div>
  );
}

function Tile({ feed, className }: { feed: Feed; className: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !feed.track) return;
    el.srcObject = new MediaStream([feed.track]);
    el.play().catch(() => {});
    return () => {
      el.srcObject = null;
    };
  }, [feed.track]);

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-black ring-1 ring-white/10 ${className}`}>
      {/* Muted: sound comes through RtkParticipantsAudio, not these elements. */}
      <video
        ref={ref}
        autoPlay
        playsInline
        muted
        className={`h-full w-full ${feed.kind === "screen" ? "object-contain" : "object-cover"} ${
          feed.self && feed.kind === "camera" ? "-scale-x-100" : ""
        }`}
      />
      <span className="absolute bottom-2 left-2 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium backdrop-blur">
        {feed.kind === "screen" ? (
          <Monitor size={14} weight="bold" />
        ) : feed.micOn ? (
          <Microphone size={14} weight="fill" className="text-amber-400" />
        ) : (
          <MicrophoneSlash size={14} className="text-stone-400" />
        )}
        <span className="truncate">
          {feed.kind === "screen" ? (feed.self ? "Your screen" : `${feed.name}’s screen`) : feed.self ? "You" : feed.name}
        </span>
      </span>
    </div>
  );
}
