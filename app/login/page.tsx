"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Shell from "@/components/layout/Shell";
import { Button } from "@/components/ui/Button";
import FormNotice from "@/components/ui/FormNotice";
import Tag from "@/components/ui/Tag";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setStatus("idle");

    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : signInError.message
      );
      return;
    }

    const next = searchParams.get("next") || "/dashboard";
    router.push(next);
    router.refresh();
  }

  return (
    <Shell>
      <div className="mx-auto flex max-w-sm flex-col gap-6 py-10">
        <div>
          <Tag tone="teal">Wired to Supabase Auth</Tag>
          <h1 className="mt-3 font-display text-2xl font-medium text-ink">
            Log in
          </h1>
          <p className="mt-1 text-sm text-muted">
            Welcome back — pick up where you left off.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <FormNotice tone="error">{error}</FormNotice>}

          <Field
            label="Email"
            type="email"
            placeholder="you@organization.com"
            value={email}
            onChange={setEmail}
          />
          <Field
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={setPassword}
          />

          <Button type="submit" className="mt-2 w-full" disabled={status === "loading"}>
            {status === "loading" ? "Logging in…" : "Log in"}
          </Button>
        </form>

        <p className="text-sm text-muted">
          No account yet?{" "}
          <Link href="/signup" className="font-medium text-ink underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </div>
    </Shell>
  );
}

function Field({
  label,
  type,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-text">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="rounded-md border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-muted/70 focus:border-ink"
      />
    </label>
  );
}
