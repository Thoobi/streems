import type { useRealtimeKitClient } from "@cloudflare/realtimekit-react";

export type Meeting = ReturnType<typeof useRealtimeKitClient>[0];
