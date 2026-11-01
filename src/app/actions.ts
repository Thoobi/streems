"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCall, getDb, newCallCode, normalizeCode, type Call } from "@/lib/db";
import { isHost, lockHost, unlockHost } from "@/lib/host";
import { createMeeting } from "@/lib/realtimekit";

export type FormState = { error?: string } | undefined;

export async function unlockHostAction(_: FormState, formData: FormData): Promise<FormState> {
  const passcode = String(formData.get("passcode") ?? "");
  if (!(await unlockHost(passcode))) return { error: "That passcode isn’t right" };
  redirect("/host");
}

export async function lockHostAction() {
  await lockHost();
  redirect("/");
}

export async function joinByCode(_: FormState, formData: FormData): Promise<FormState> {
  const code = normalizeCode(String(formData.get("code") ?? ""));
  if (!code) return { error: "Enter the call code" };
  const call = await getCall(code);
  if (!call) return { error: "No call with that code. Check it and try again." };
  redirect(`/c/${call.code}`);
}

export async function startCall(_: FormState, formData: FormData): Promise<FormState> {
  if (!(await isHost())) redirect("/host");
  const title = z.string().trim().min(1).max(120).catch("Prayer meeting").parse(formData.get("title"));
  const parsedName = z.string().trim().min(1, "Add your name so people know who’s leading").max(40).safeParse(formData.get("hostName"));
  if (!parsedName.success) return { error: parsedName.error.issues[0].message };

  const db = await getDb();
  // One host, one call at a time: starting again reopens the live one.
  const live = await db.prepare("SELECT code FROM calls WHERE status = 'live' LIMIT 1").first<Pick<Call, "code">>();
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
    .prepare("INSERT INTO calls (code, title, host_name, meeting_id) VALUES (?, ?, ?, ?)")
    .bind(code, title, parsedName.data, meetingId)
    .run();
  revalidatePath("/host");
  redirect(`/c/${code}`);
}

export async function endCall(code: string) {
  if (!(await isHost())) redirect("/host");
  const db = await getDb();
  await db
    .prepare("UPDATE calls SET status = 'ended', ended_at = datetime('now') WHERE code = ? AND status = 'live'")
    .bind(code)
    .run();
  revalidatePath("/host");
  redirect("/host");
}
