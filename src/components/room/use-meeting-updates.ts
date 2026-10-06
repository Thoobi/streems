"use client";

import { useEffect, useState } from "react";
import type { Meeting } from "./types";

type Emitter = { on(event: string, cb: () => void): void; off(event: string, cb: () => void): void };

// Re-render whenever anything in the room changes: people joining, mics, raised hands, stage moves.
// The room is small, so reading state straight off the meeting each render is cheap and never stale.
export function useMeetingUpdates(meeting: Meeting) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    const subscriptions: [Emitter, string[]][] = [
      [meeting.self as unknown as Emitter, ["*", "audioUpdate", "roomJoined", "roomLeft"]],
      [meeting.stage as unknown as Emitter, ["*", "stageAccessRequestUpdate", "stageStatusUpdate", "newStageRequest"]],
      [
        meeting.participants.joined as unknown as Emitter,
        ["*", "participantJoined", "participantLeft", "audioUpdate", "stageStatusUpdate"],
      ],
    ];
    for (const [emitter, events] of subscriptions) for (const e of events) emitter.on(e, bump);
    // Safety net for any change the SDK doesn't announce through the events above.
    const poll = setInterval(bump, 2000);
    return () => {
      clearInterval(poll);
      for (const [emitter, events] of subscriptions) for (const e of events) emitter.off(e, bump);
    };
  }, [meeting]);
}
