import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { signIn } from "../actions";

export const metadata: Metadata = { title: "Sign in · Prayer Live" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return <AuthForm mode="login" action={signIn} next={typeof next === "string" ? next : undefined} />;
}
