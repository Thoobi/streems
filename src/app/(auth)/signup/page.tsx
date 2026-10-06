import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { signUp } from "../actions";

export const metadata: Metadata = { title: "Create account · Prayer Live" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const { next } = await searchParams;
  return <AuthForm mode="signup" action={signUp} next={typeof next === "string" ? next : undefined} />;
}
