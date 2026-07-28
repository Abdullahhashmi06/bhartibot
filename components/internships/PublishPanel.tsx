"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Link2, Globe, Lock, Share2 } from "lucide-react";
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
          "Could not publish. Confirm internships UPDATE RLS is set."
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
    <div className="rounded-3xl border border-border bg-white p-6 sm:p-8 shadow-card space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-light text-teal-dark border border-teal/20">
            {isPublished ? <Globe className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-primary">
              Publication & Candidate Form Link
            </h2>
            <p className="text-xs text-text-secondary">
              {isPublished
                ? "This drive is published and live for candidate submissions."
                : "Draft state — publish to generate a shareable public application link."}
            </p>
          </div>
        </div>

        <Tag tone={isPublished ? "teal" : "neutral"} className="px-3 py-1 text-xs">
          {isPublished ? "Live & Published" : "Draft Status"}
        </Tag>
      </div>

      {error && <FormNotice tone="error">{error}</FormNotice>}

      {!isPublished ? (
        <div className="rounded-2xl border border-dashed border-border bg-slate-50/50 p-6 space-y-4 text-center">
          <p className="text-xs sm:text-sm text-text-secondary max-w-md mx-auto">
            Publishing enables candidate PDF uploads, screening question responses, and automatic AI evidence scoring.
          </p>
          <Button
            type="button"
            variant="gradient"
            onClick={handlePublish}
            isLoading={busy === "publishing"}
            leftIcon={<Link2 className="h-4 w-4" />}
          >
            Publish Internship & Generate Public URL
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-teal/30 bg-teal-light/30 p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-primary flex items-center justify-between">
              <span>Shareable Public Application Link</span>
              <Share2 className="h-3.5 w-3.5 text-teal" />
            </label>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl ?? `/apply/${slug}`}
                className="w-full rounded-xl border border-border bg-white px-4 py-2.5 font-mono text-xs text-primary shadow-subtle focus:outline-none select-all"
              />
              <Button
                type="button"
                variant="gradient"
                size="sm"
                onClick={handleCopy}
                className="shrink-0 w-full sm:w-auto"
                leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              >
                {copied ? "Copied to Clipboard" : "Copy Link"}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-text-muted">
              Share this link on LinkedIn, WhatsApp, or university job portals.
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleUnpublish}
              isLoading={busy === "unpublishing"}
              className="text-text-muted hover:text-danger"
            >
              Revert to Draft
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
