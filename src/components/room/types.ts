import type { useRealtimeKitClient } from "@cloudflare/realtimekit-react";

export type Meeting = ReturnType<typeof useRealtimeKitClient>[0];

// RealtimeKit customParticipantId of the one host; joiners get "guest-<uuid>".
export const HOST_PARTICIPANT_ID = "host";
