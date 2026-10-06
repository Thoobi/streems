"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { setGuest } from "@/lib/guest";

export type GuestState = { error?: string } | undefined;

const nameSchema = z.string().trim().min(2, "Please enter your name").max(40, "That name is too long");

export async function joinAsGuest(broadcastId: string, _: GuestState, formData: FormData): Promise<GuestState> {
  const parsed = nameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await setGuest(parsed.data);
  redirect(`/live/${broadcastId}`);
}
