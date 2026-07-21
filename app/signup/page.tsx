"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Shell from "@/components/layout/Shell";
import { Button } from "@/components/ui/Button";
import FormNotice from "@/components/ui/FormNotice";
import Tag from "@/components/ui/Tag";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setStatus("loading");

    // full_name and organization_name ride along as user metadata.
    // Developer B's DB trigger (on auth.users insert) reads this to
    // create the organizations + profiles rows.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          organization_name: orgName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setStatus("idle");

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    // If email confirmation is required, there's no session yet.
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setCheckEmail(true);
    }
  }

  return (
    <Shell>
      <div className="mx-auto flex max-w-sm flex-col gap-6 py-10">
        <div>
          <Tag tone="teal">Wired to Supabase Auth</Tag>
          <h1 className="mt-3 font-display text-2xl font-medium text-ink">
            Create a recruiter account
          </h1>
          <p className="mt-1 text-sm text-muted">
            One account per organization to start.
          </p>
        </div>

        {checkEmail ? (
          <FormNotice tone="info">
            Almost there — we sent a confirmation link to{" "}
            <strong>{email}</strong>. Click it, then log in.
          </FormNotice>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <FormNotice tone="error">{error}</FormNotice>}

            <Field
              label="Full name"
              type="text"
              placeholder="Abdullah Khan"
              value={fullName}
              onChange={setFullName}
              required
            />
            <Field
              label="Organization name"
              type="text"
              placeholder="ABC Technologies"
              value={orgName}
              onChange={setOrgName}
              required
            />
            <Field
              label="Email"
              type="email"
              placeholder="you@organization.com"
              value={email}
              onChange={setEmail}
              required
            />
            <Field
              label="Password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={setPassword}
              required
            />

            <Button type="submit" className="mt-2 w-full" disabled={status === "loading"}>
              {status === "loading" ? "Creating account…" : "Create account"}
            </Button>
          </form>
        )}

        <p className="text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-ink underline underline-offset-2">
            Log in
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
  required,
}: {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-text">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={type === "password" ? 8 : undefined}
        className="rounded-md border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-muted/70 focus:border-ink"
      />
    </label>
  );
}
