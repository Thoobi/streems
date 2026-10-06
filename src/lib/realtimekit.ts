// Server-side client for the Cloudflare RealtimeKit REST API.
// Docs: https://developers.cloudflare.com/realtime/realtimekit/

function config() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const appId = process.env.REALTIMEKIT_APP_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !appId || !apiToken) {
    throw new Error(
      "RealtimeKit is not configured. Set CLOUDFLARE_ACCOUNT_ID, REALTIMEKIT_APP_ID and CLOUDFLARE_API_TOKEN in .env.local.",
    );
  }
  return {
    baseUrl: `https://api.cloudflare.com/client/v4/accounts/${accountId}/realtime/kit/${appId}`,
    apiToken,
  };
}

async function rtk<T>(path: string, body: unknown): Promise<T> {
  const { baseUrl, apiToken } = config();
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiToken}` },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as { success?: boolean; errors?: unknown; data?: T } | null;
  if (!res.ok || !json?.success) {
    throw new Error(`RealtimeKit ${path} failed (${res.status}): ${JSON.stringify(json?.errors ?? json)}`);
  }
  return json.data as T;
}

// Per broadcast: whoever started it hosts; everyone else (members and guests) listens.
export type Role = "host" | "listener";

export const presetFor = (role: Role) =>
  role === "host"
    ? (process.env.REALTIMEKIT_HOST_PRESET ?? "webinar_presenter")
    : (process.env.REALTIMEKIT_LISTENER_PRESET ?? "webinar_viewer");

export async function createMeeting(title: string) {
  const data = await rtk<{ id: string }>("/meetings", { title });
  return data.id;
}

export async function createParticipantToken(
  meetingId: string,
  participant: { id: string; name: string; role: Role },
) {
  const data = await rtk<{ token?: string; authToken?: string }>(`/meetings/${meetingId}/participants`, {
    name: participant.name,
    preset_name: presetFor(participant.role),
    custom_participant_id: participant.id,
  });
  const token = data.token ?? data.authToken;
  if (!token) throw new Error("RealtimeKit did not return a participant token");
  return token;
}
