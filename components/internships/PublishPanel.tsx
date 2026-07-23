"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Link2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import FormNotice from "@/components/ui/FormNotice";
import Tag from "@/components/ui/Tag";
import { createClient } from "@/lib/supabase/client";
import {
  publishInternship,
  unpublishInternship,
} from "@/lib/queries/internships";
import { InternshipStatus } from "@/lib/types";

export default function PublishPanel({
  internshipId,
  title,
  publicSlug,
  initialStatus,
}: {
  internshipId: string;
  title: string;
  publicSlug: string | null;
  initialStatus: InternshipStatus | string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [status, setStatus] = useState(initialStatus);
  const [slug, setSlug] = useState(publicSlug);
  const [busy, setBusy] = useState<"idle" | "publishing" | "unpublishing">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isPublished = status === "published";

  const publicUrl = useMemo(() => {
    if (!slug) return null;
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/apply/${slug}`;
  }, [slug]);

  async function handlePublish() {
    setError(null);
    setBusy("publishing");

    const { internship, error: publishError } = await publishInternship(
      supabase,
      internshipId,
      title
    );

    setBusy("idle");

    if (publishError || !internship) {
      setError(
        publishError ??
          "Could not publish. Confirm internships UPDATE RLS is set (Developer B)."
      );
      return;
    }

    setStatus(internship.status);
    setSlug(internship.public_slug);
    router.refresh();
  }

  async function handleUnpublish() {
    setError(null);
    setBusy("unpublishing");

    const { internship, error: unpublishError } = await unpublishInternship(
      supabase,
      internshipId
    );

    setBusy("idle");

    if (unpublishError || !internship) {
      setError(unpublishError ?? "Could not move back to draft.");
      return;
    }

    setStatus(internship.status);
    setCopied(false);
    router.refresh();
  }

  async function handleCopy() {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy the link. Select and copy it manually.");
    }
  }

  return (
    <section className="flex flex-col gap-4 border-t border-border pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-medium text-ink">
            Publish
          </h2>
          <p className="mt-1 text-sm text-muted">
            {isPublished
              ? "This internship is live. Share the public link with applicants."
              : "Still a draft — only you can see it. Publish when you’re ready to collect applications."}
          </p>
        </div>
        <Tag tone={isPublished ? "teal" : "neutral"}>
          {isPublished ? "published" : "draft"}
        </Tag>
      </div>

      {error && <FormNotice tone="error">{error}</FormNotice>}

      {!isPublished ? (
        <div className="flex flex-col gap-3 rounded-md border border-dashed border-border bg-white p-4">
          <p className="text-sm text-muted">
            Publishing creates a public application URL you can copy and share
            outside BhartiBot (LinkedIn, email, WhatsApp, etc.).
          </p>
          <Button
            type="button"
            onClick={handlePublish}
            disabled={busy !== "idle"}
            className="w-fit"
          >
            <Link2 size={14} />
            {busy === "publishing" ? "Publishing…" : "Publish Internship"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-md border border-border bg-white p-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-text">
              Public application link
            </span>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                readOnly
                value={publicUrl ?? `/apply/${slug}`}
                className="w-full rounded-md border border-border bg-paper px-3 py-2 font-mono text-xs text-text"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>
          </label>
          <p className="text-xs text-muted">
            Applicants open this link to fill in the application form and submit
            their details.
          </p>
          <Button
            type="button"
            variant="ghost"
            onClick={handleUnpublish}
            disabled={busy !== "idle"}
            className="w-fit text-muted"
          >
            {busy === "unpublishing" ? "Updating…" : "Move back to draft"}
          </Button>
        </div>
      )}
    </section>
  );
}
