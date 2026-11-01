import { cookies } from "next/headers";

// There is one host: whoever knows the HOST_PASSCODE secret. Entering it once sets a
// cookie holding a hash derived from the passcode, so changing the secret signs the host out.
const HOST_COOKIE = "gps_host";

async function hostKey() {
  const passcode = process.env.HOST_PASSCODE;
  if (!passcode) throw new Error("HOST_PASSCODE is not set. Add it to .dev.vars or with `wrangler secret put`.");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`gps-host:${passcode}`));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function isHost() {
  const value = (await cookies()).get(HOST_COOKIE)?.value;
  return Boolean(value) && value === (await hostKey());
}

export async function unlockHost(passcode: string) {
  if (passcode !== process.env.HOST_PASSCODE) return false;
  (await cookies()).set(HOST_COOKIE, await hostKey(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
  return true;
}

export async function lockHost() {
  (await cookies()).delete(HOST_COOKIE);
}
