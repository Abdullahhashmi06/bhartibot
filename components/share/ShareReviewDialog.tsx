"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Link2,
  CheckCircle2,
  Share2,
  QrCode,
  Mail,
  MessageSquare,
  Clock,
  Lock,
  Shield,
  AlertTriangle,
  Copy,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Dialog, {
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@/components/ui/Dialog";
import Checkbox from "@/components/ui/Checkbox";
import RadioGroup from "@/components/ui/RadioGroup";
import { Input } from "@/components/ui/Input";
import Tag from "@/components/ui/Tag";
import type { SharedSection, ShareExpiration } from "@/lib/types";

const ALL_SECTIONS: {
  key: SharedSection;
  label: string;
  description: string;
}[] = [
  { key: "candidate_summary", label: "Candidate Summary", description: "AI-generated candidate overview" },
  { key: "match_score", label: "Match Score", description: "Overall AI match percentage" },
  { key: "resume_summary", label: "Resume Summary", description: "Parsed resume highlights" },
  { key: "strengths", label: "AI Strengths", description: "Key candidate strengths" },
  { key: "weaknesses", label: "AI Weaknesses", description: "Areas for improvement" },
  { key: "skills", label: "Skill Breakdown", description: "Missing skills analysis" },
  { key: "radar_chart", label: "Radar Chart", description: "Multi-dimensional score visualization" },
  { key: "interview_questions", label: "Interview Questions", description: "AI-suggested interview questions" },
  { key: "recommendation", label: "AI Recommendation", description: "Final hiring recommendation" },
];

const EXPIRATION_OPTIONS = [
  { label: "Never expires", value: "never", description: "Permanent access" },
  { label: "24 Hours", value: "24h", description: "Expires in 24 hours" },
  { label: "7 Days", value: "7d", description: "Expires in 7 days" },
  { label: "30 Days", value: "30d", description: "Expires in 30 days" },
];

interface ShareReviewDialogProps {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  internshipId: string;
  applicantName: string;
  internshipTitle: string;
  organizationName: string;
  hasResume?: boolean;
}

export default function ShareReviewDialog({
  open,
  onClose,
  applicationId,
  internshipId,
  applicantName,
  internshipTitle,
  organizationName,
  hasResume = false,
}: ShareReviewDialogProps) {
  const [selectedSections, setSelectedSections] = useState<SharedSection[]>(
    () => ALL_SECTIONS.map((s) => s.key)
  );
  const [expiration, setExpiration] = useState<ShareExpiration>("never");
  const [password, setPassword] = useState("");
  const [enablePassword, setEnablePassword] = useState(false);
  const [includeResume, setIncludeResume] = useState(hasResume);
  const [includeNotes, setIncludeNotes] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<"configure" | "share">("configure");
  const [copied, setCopied] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [showQr, setShowQr] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStep("configure");
      setShareLink("");
      setQrDataUrl("");
      setCopied(false);
      setEmailStatus("idle");
      setEmailRecipients("");
      setShowQr(false);
    }
  }, [open]);

  const toggleSection = (section: SharedSection) => {
    setSelectedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const generateQrCode = useCallback(async (url: string) => {
    try {
      const QRCode = (await import("qrcode")).default;
      const qr = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: "#0B1F3A",
          light: "#FFFFFF",
        },
      });
      setQrDataUrl(qr);
    } catch {
      console.warn("[Share] QR generation failed — qrcode library not available");
    }
  }, []);

  const handleGenerate = async () => {
    if (selectedSections.length === 0) return;
    setIsGenerating(true);

    try {
      const res = await fetch("/api/share/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          internshipId,
          sharedSections: selectedSections,
          expiration,
          password: enablePassword && password ? password : undefined,
          includeResume,
          includeNotes,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setShareLink(data.shareUrl);
        setStep("share");
        generateQrCode(data.shareUrl);
      } else {
        console.error("[Share] Create failed:", data.error);
      }
    } catch (err) {
      console.error("[Share] Unexpected error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = shareLink;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsApp = () => {
    const message = [
      `Candidate Review: ${applicantName}`,
      ``,
      `Please review this applicant before our hiring discussion.`,
      ``,
      `Open Review: ${shareLink}`,
      ``,
      `Shared using InternIQ.`,
    ].join("\n");

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSendEmail = async () => {
    const recipients = emailRecipients
      .split(/[,;\s]+/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (recipients.length === 0) return;

    setEmailStatus("sending");
    try {
      const res = await fetch("/api/share/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipients,
          applicantName,
          internshipTitle,
          organizationName,
          reviewUrl: shareLink,
          expiresAt:
            expiration === "never"
              ? null
              : new Date(
                  Date.now() +
                    (expiration === "24h"
                      ? 24 * 60 * 60 * 1000
                      : expiration === "7d"
                      ? 7 * 24 * 60 * 60 * 1000
                      : 30 * 24 * 60 * 60 * 1000)
                ).toISOString(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEmailStatus("sent");
      } else {
        setEmailStatus("error");
        console.error("[Share] Email failed:", data.error);
      }
    } catch (err) {
      console.error("[Share] Email send error:", err);
      setEmailStatus("error");
    }
  };

  const expirationDateTime =
    expiration !== "never"
      ? new Date(
          Date.now() +
            (expiration === "24h"
              ? 24 * 60 * 60 * 1000
              : expiration === "7d"
              ? 7 * 24 * 60 * 60 * 1000
              : 30 * 24 * 60 * 60 * 1000)
        ).toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          // Fixed timezone so the calendar date is identical on server + client.
          timeZone: "UTC",
        })
      : null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="max-w-xl w-full"
      title="Share Candidate Review"
    >
      <DialogHeader>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-primary text-white shadow-teal">
            <Share2 className="h-4 w-4" />
          </div>
          <span>Share Candidate Review</span>
        </div>
      </DialogHeader>

      <DialogBody>
        {step === "configure" && (
          <div className="space-y-6">
            {/* Candidate Info */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-700/50 border border-border dark:border-slate-700 p-4 space-y-1">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider font-mono">
                Sharing Review For
              </p>
              <p className="font-display font-bold text-base text-primary dark:text-white">
                {applicantName}
              </p>
              <p className="text-xs text-text-muted">
                {internshipTitle} · {organizationName}
              </p>
            </div>

            {/* Sections to Include */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-text-primary dark:text-slate-200 uppercase tracking-wider font-mono">
                  Sections to Include
                </h4>
                <span className="text-[11px] text-text-muted font-mono">
                  {selectedSections.length}/{ALL_SECTIONS.length} selected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ALL_SECTIONS.map((section) => (
                  <div
                    key={section.key}
                    className="rounded-xl border border-border dark:border-slate-700 p-3 transition-colors hover:border-teal/30 hover:bg-teal-light/20 dark:hover:bg-teal/10"
                  >
                    <Checkbox
                      checked={selectedSections.includes(section.key)}
                      onCheckedChange={() => toggleSection(section.key)}
                      label={section.label}
                    />
                    <p className="mt-1 ml-6 text-[10px] text-text-muted leading-snug">
                      {section.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Features */}
            <div className="space-y-4">
              {/* Include Resume */}
              {hasResume && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={includeResume}
                    onCheckedChange={setIncludeResume}
                    label="Include Resume Download Link"
                  />
                </label>
              )}

              {/* Include Recruiter Notes */}
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={includeNotes}
                  onCheckedChange={setIncludeNotes}
                  label="Include Recruiter Notes"
                />
              </label>
            </div>

            {/* Expiration */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-text-primary dark:text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-teal" />
                Link Expiration
              </h4>
              <RadioGroup
                value={expiration}
                onChange={(v) => setExpiration(v as ShareExpiration)}
                options={EXPIRATION_OPTIONS}
              />
            </div>

            {/* Optional Password */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={enablePassword}
                  onCheckedChange={setEnablePassword}
                  label="Password Protection (Optional)"
                />
              </label>

              {enablePassword && (
                <Input
                  type="password"
                  placeholder="Set a password for accessing this review"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  helperText="Recipients will need this password to view the review."
                />
              )}
            </div>
          </div>
        )}

        {step === "share" && shareLink && (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="rounded-2xl bg-teal-light/50 dark:bg-teal/20 border border-teal/30 p-4 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-teal shrink-0" />
              <div>
                <p className="text-sm font-bold text-teal-dark dark:text-teal">
                  Share Link Generated Successfully
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {applicantName} · {internshipTitle}
                </p>
              </div>
            </div>

            {/* Link Preview */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary dark:text-slate-200 font-mono uppercase tracking-wider">
                Secure Share Link
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-xl border border-border dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-text-primary font-mono truncate">
                  {shareLink}
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyLink}
                  leftIcon={
                    copied ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-teal" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )
                  }
                  className="shrink-0"
                >
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Expiration & Password Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {expiration !== "never" && expirationDateTime && (
                <Tag tone="amber">
                  <Clock className="h-3 w-3" />
                  Expires {expirationDateTime}
                </Tag>
              )}
              {expiration === "never" && (
                <Tag tone="teal">
                  <Globe className="h-3 w-3" />
                  Never expires
                </Tag>
              )}
              {enablePassword && password && (
                <Tag tone="purple">
                  <Lock className="h-3 w-3" />
                  Password protected
                </Tag>
              )}
              <Tag tone="neutral">
                <Shield className="h-3 w-3" />
                Read-only
              </Tag>
            </div>

            {/* Share Actions */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-text-primary dark:text-slate-200 font-mono uppercase tracking-wider">
                Share Via
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="flex items-center gap-3 rounded-xl border border-border dark:border-slate-700 p-3 hover:bg-emerald-50 dark:hover:bg-emerald/10 hover:border-emerald/30 transition-all text-left"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald/20 text-emerald shrink-0">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-primary dark:text-slate-200">
                      WhatsApp
                    </p>
                    <p className="text-[10px] text-text-muted">
                      Share via chat
                    </p>
                  </div>
                </button>

                {/* Email */}
                <button
                  type="button"
                  onClick={() => {
                    const subject = encodeURIComponent(
                      `Candidate Review: ${applicantName} - ${internshipTitle}`
                    );
                    const body = encodeURIComponent(
                      [
                        `Candidate Review: ${applicantName}`,
                        ``,
                        `Position: ${internshipTitle}`,
                        `Organization: ${organizationName}`,
                        ``,
                        `Open Review: ${shareLink}`,
                        ``,
                        `Shared using InternIQ.`,
                      ].join("\n")
                    );
                    window.open(
                      `mailto:?subject=${subject}&body=${body}`,
                      "_blank"
                    );
                  }}
                  className="flex items-center gap-3 rounded-xl border border-border dark:border-slate-700 p-3 hover:bg-blue-50 dark:hover:bg-blue/10 hover:border-blue/30 transition-all text-left"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue/20 text-blue shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-primary dark:text-slate-200">
                      Email
                    </p>
                    <p className="text-[10px] text-text-muted">
                      Open email client
                    </p>
                  </div>
                </button>

                {/* QR Code */}
                <button
                  type="button"
                  onClick={() => setShowQr(!showQr)}
                  className="flex items-center gap-3 rounded-xl border border-border dark:border-slate-700 p-3 hover:bg-purple-50 dark:hover:bg-purple-ai/10 hover:border-purple-ai/30 transition-all text-left"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-light dark:bg-purple-ai/20 text-purple-ai shrink-0">
                    <QrCode className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-primary dark:text-slate-200">
                      QR Code
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {showQr ? "Hide QR" : "Show QR"}
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* QR Code */}
            {showQr && qrDataUrl && (
              <div className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-border dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-purple-ai" />
                  <span className="text-xs font-semibold text-text-primary">
                    Scan to Open Review
                  </span>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="QR Code for shared candidate review"
                  className="w-48 h-48 rounded-xl border border-border dark:border-slate-700"
                />
                <p className="text-[10px] text-text-muted text-center">
                  Scanning this QR code opens the candidate review without requiring a login.
                </p>
              </div>
            )}

            {/* Email Send Section */}
            <div className="space-y-3 border-t border-border dark:border-slate-700 pt-4">
              <h4 className="text-xs font-semibold text-text-primary dark:text-slate-200 font-mono uppercase tracking-wider">
                Send via Email
              </h4>

              <div className="flex gap-2">
                <Input
                  placeholder="Email addresses (comma separated)"
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="gradient"
                  size="sm"
                  onClick={handleSendEmail}
                  disabled={
                    emailStatus === "sending" || !emailRecipients.trim()
                  }
                  isLoading={emailStatus === "sending"}
                  leftIcon={<Mail className="h-3.5 w-3.5" />}
                >
                  {emailStatus === "sent" ? "Sent!" : "Send"}
                </Button>
              </div>

              {emailStatus === "sent" && (
                <div className="flex items-center gap-2 rounded-xl bg-teal-light/50 dark:bg-teal/20 border border-teal/30 p-3">
                  <CheckCircle2 className="h-4 w-4 text-teal shrink-0" />
                  <p className="text-xs font-medium text-teal-dark dark:text-teal">
                    Email sent successfully!
                  </p>
                </div>
              )}

              {emailStatus === "error" && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 dark:bg-rose/20 border border-rose/30 p-3">
                  <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
                  <p className="text-xs font-medium text-danger">
                    Failed to send email. The review link still exists and can be shared manually.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogBody>

      <DialogFooter>
        {step === "configure" ? (
          <>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="gradient"
              size="sm"
              onClick={handleGenerate}
              disabled={selectedSections.length === 0 || isGenerating}
              isLoading={isGenerating}
              leftIcon={!isGenerating ? <Link2 className="h-3.5 w-3.5" /> : undefined}
            >
              {isGenerating ? "Generating..." : "Generate Share Link"}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep("configure")}
            >
              Back to Settings
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={onClose}>
              Done
            </Button>
          </>
        )}
      </DialogFooter>
    </Dialog>
  );
}
