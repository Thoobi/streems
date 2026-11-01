import { getCloudflareContext } from "@opennextjs/cloudflare";

export type Call = {
  code: string;
  title: string;
  host_name: string;
  meeting_id: string;
  status: "live" | "ended";
  started_at: string;
  ended_at: string | null;
};

// Cloudflare D1, bound as `DB` in wrangler.jsonc. Schema lives in migrations/.
export async function getDb() {
  const { env } = await getCloudflareContext({ async: true });
  return env.DB;
}

// Join codes: 6 characters, no look-alikes (0/O, 1/I/L), so they're easy to read out loud.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function newCallCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

// Accepts "k7m 2qx", "K7M-2QX", or a pasted link ending in the code.
export function normalizeCode(input: string) {
  const last = input.trim().split("/").filter(Boolean).pop() ?? "";
  return last.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function getCall(code: string) {
  const db = await getDb();
  return db.prepare("SELECT * FROM calls WHERE code = ?").bind(normalizeCode(code)).first<Call>();
}
