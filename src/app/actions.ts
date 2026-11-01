"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getCall, getDb, newCallCode, normalizeCode, type Call } from "@/lib/db";
import { createMeeting } from "@/lib/realtimekit";

export type FormState = { error?: string } | undefined;

// Joiners don't need an account: a code (or the host's link) is enough.
export async function joinByCode(_: FormState, formData: FormData): Promise<FormState> {
  const code = normalizeCode(String(formData.get("code") ?? ""));
  if (!code) return { error: "Enter the call code" };
  const call = await getCall(code);
  if (!call) return { error: "No call with that code. Check it and try again." };
  redirect(`/c/${call.code}`);
}

export async function startCall(_: FormState, formData: FormData): Promise<FormState> {
  const host = await requireUser();
  const title = z.string().trim().min(1).max(120).catch("Prayer meeting").parse(formData.get("title"));

  const db = await getDb();
  // One live call per host: starting again reopens it.
  const live = await db
    .prepare("SELECT code FROM calls WHERE host_id = ? AND status = 'live' LIMIT 1")
    .bind(host.id)
    .first<Pick<Call, "code">>();
  if (live) redirect(`/c/${live.code}`);

  let meetingId: string;
  try {
    meetingId = await createMeeting(title);
  } catch (err) {
    console.error(err);
    return { error: err instanceof Error ? err.message : "Could not start the call" };
  }

  const code = newCallCode();
  await db
    .prepare("INSERT INTO calls (code, host_id, title, host_name, meeting_id) VALUES (?, ?, ?, ?, ?)")
    .bind(code, host.id, title, host.name, meetingId)
    .run();
  revalidatePath("/");
  redirect(`/c/${code}`);
}

export async function endCall(code: string) {
  const host = await requireUser();
  const db = await getDb();
  await db
    .prepare("UPDATE calls SET status = 'ended', ended_at = datetime('now') WHERE code = ? AND host_id = ? AND status = 'live'")
    .bind(code, host.id)
    .run();
  revalidatePath("/");
  redirect("/");
}
