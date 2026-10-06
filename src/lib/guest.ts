import { cookies } from "next/headers";

// Guests listen without an account. The cookie only carries a display name and a
// stable id for RealtimeKit; guests always join with the listener preset, so
// editing it grants nothing.
const GUEST_COOKIE = "gps_guest";

export type Guest = { id: string; name: string };

export async function getGuest(): Promise<Guest | null> {
  const raw = (await cookies()).get(GUEST_COOKIE)?.value;
  if (!raw) return null;
  try {
    const guest = JSON.parse(raw) as Partial<Guest>;
    return typeof guest.id === "string" && typeof guest.name === "string" ? { id: guest.id, name: guest.name } : null;
  } catch {
    return null;
  }
}

export async function setGuest(name: string) {
  const existing = await getGuest();
  const guest: Guest = { id: existing?.id ?? `guest-${crypto.randomUUID()}`, name };
  (await cookies()).set(GUEST_COOKIE, JSON.stringify(guest), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
}
