"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getDb, type Broadcast } from "@/lib/db";
import { createMeeting } from "@/lib/realtimekit";

export type StartState = { error?: string } | undefined;

export async function startBroadcast(_: StartState, formData: FormData): Promise<StartState> {
  const host = await requireUser();
  const title = z.string().trim().min(1).max(120).catch("Prayer meeting").parse(formData.get("title"));

  const db = await getDb();
  // Anyone can host, but one live broadcast per person: going live again reopens it.
  const live = await db
    .prepare("SELECT id FROM broadcasts WHERE host_id = ? AND status = 'live' LIMIT 1")
    .bind(host.id)
    .first<Pick<Broadcast, "id">>();
  if (live) redirect(`/live/${live.id}`);

  let meetingId: string;
  try {
    meetingId = await createMeeting(title);
  } catch (err) {
    console.error(err);
    return { error: err instanceof Error ? err.message : "Could not create the broadcast" };
  }

  const id = crypto.randomUUID();
  await db
    .prepare("INSERT INTO broadcasts (id, title, meeting_id, host_id) VALUES (?, ?, ?, ?)")
    .bind(id, title, meetingId, host.id)
    .run();
  revalidatePath("/");
  redirect(`/live/${id}`);
}

export async function endBroadcast(id: string) {
  const user = await requireUser();
  const db = await getDb();
  await db
    .prepare(
      "UPDATE broadcasts SET status = 'ended', ended_at = datetime('now') WHERE id = ? AND host_id = ? AND status = 'live'",
    )
    .bind(id, user.id)
    .run();
  revalidatePath("/");
  redirect("/");
}
