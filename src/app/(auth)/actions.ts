"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createUser, endSession, findUserByCredentials, safeNext, startSession } from "@/lib/auth";

export type AuthState = { error?: string; fields?: Record<string, string> } | undefined;

const signUpSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const signInSchema = z.object({
  email: z.email("Enter a valid email").trim().toLowerCase(),
  password: z.string().min(1, "Enter your password"),
});

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = signUpSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, fields: { name: raw.name, email: raw.email } };
  }
  let userId: string;
  try {
    userId = (await createUser(parsed.data)).id;
  } catch (err) {
    if (String(err).includes("UNIQUE")) {
      return { error: "An account with that email already exists", fields: { name: raw.name, email: raw.email } };
    }
    throw err;
  }
  await startSession(userId);
  redirect(safeNext(raw.next));
}

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = signInSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, fields: { email: raw.email } };
  const user = await findUserByCredentials(parsed.data.email, parsed.data.password);
  if (!user) return { error: "Incorrect email or password", fields: { email: raw.email } };
  await startSession(user.id);
  redirect(safeNext(raw.next));
}

export async function signOut() {
  await endSession();
  redirect("/login");
}
