import { getCloudflareContext } from "@opennextjs/cloudflare";

export type User = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

export type Broadcast = {
  id: string;
  title: string;
  meeting_id: string;
  host_id: string;
  status: "live" | "ended";
  started_at: string;
  ended_at: string | null;
};

// Cloudflare D1, bound as `DB` in wrangler.jsonc. Schema lives in migrations/.
export async function getDb() {
  const { env } = await getCloudflareContext({ async: true });
  return env.DB;
}
