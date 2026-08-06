"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, ExternalLink } from "lucide-react";
import ApplicationTimeline from "./ApplicationTimeline";
import { cn } from "@/lib/utils";

/**
 * Distinct color themes per application stage — every stage gets its own
 * avatar gradient, badge colors, card accent, and timeline accent so the
 * applications page reads clearly at a glance.
 */
interface StageTheme {
  avatar: string; // avatar gradient classes
  badge: string; // badge text/bg/border
  accent: string; // left accent border color
  timeline: { gradient: string; text: string; ring: string; shadow: string };
}

const STAGE_THEMES: Record<string, StageTheme> = {
  new: {
    avatar: "from-indigo-500 to-violet-500",
    badge: "text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 border-indigo-200 dark:border-indigo-500/30",
    accent: "border-l-indigo-400 dark:border-l-indigo-500",
    timeline: {
      gradient: "from-indigo-500 to-violet-500",
      text: "text-indigo-600 dark:text-indigo-300",
      ring: "ring-indigo-500/20",
      shadow: "shadow-indigo-500/30",
    },
  },
  under_review: {
    avatar: "from-amber-400 to-orange-500",
    badge: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30",
    accent: "border-l-amber-400 dark:border-l-amber-500",
    timeline: {
      gradient: "from-amber-400 to-orange-500",
      text: "text-amber-600 dark:text-amber-300",
      ring: "ring-amber-500/20",
      shadow: "shadow-amber-500/30",
    },
  },
  ai_reviewed: {
    avatar: "from-cyan-400 to-sky-500",
    badge: "text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/15 border-cyan-200 dark:border-cyan-500/30",
    accent: "border-l-cyan-400 dark:border-l-cyan-500",
    timeline: {
      gradient: "from-cyan-400 to-sky-500",
      text: "text-cyan-600 dark:text-cyan-300",
      ring: "ring-cyan-500/20",
      shadow: "shadow-cyan-500/30",
    },
  },
  viewed: {
    avatar: "from-sky-400 to-blue-500",
    badge: "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/15 border-sky-200 dark:border-sky-500/30",
    accent: "border-l-sky-400 dark:border-l-sky-500",
    timeline: {
      gradient: "from-sky-400 to-blue-500",
      text: "text-sky-600 dark:text-sky-300",
      ring: "ring-sky-500/20",
      shadow: "shadow-sky-500/30",
    },
  },
  shortlisted: {
    avatar: "from-violet-500 to-purple-500",
    badge: "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/15 border-violet-200 dark:border-violet-500/30",
    accent: "border-l-violet-400 dark:border-l-violet-500",
    timeline: {
      gradient: "from-violet-500 to-purple-500",
      text: "text-violet-600 dark:text-violet-300",
      ring: "ring-violet-500/20",
      shadow: "shadow-violet-500/30",
    },
  },
  interview: {
    avatar: "from-fuchsia-500 to-pink-500",
    badge: "text-fuchsia-700 dark:text-fuchsia-300 bg-fuchsia-50 dark:bg-fuchsia-500/15 border-fuchsia-200 dark:border-fuchsia-500/30",
    accent: "border-l-fuchsia-400 dark:border-l-fuchsia-500",
    timeline: {
      gradient: "from-fuchsia-500 to-pink-500",
      text: "text-fuchsia-600 dark:text-fuchsia-300",
      ring: "ring-fuchsia-500/20",
      shadow: "shadow-fuchsia-500/30",
    },
  },
  offer: {
    avatar: "from-emerald-500 to-green-500",
    badge: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30",
    accent: "border-l-emerald-400 dark:border-l-emerald-500",
    timeline: {
      gradient: "from-emerald-500 to-green-500",
      text: "text-emerald-600 dark:text-emerald-300",
      ring: "ring-emerald-500/20",
      shadow: "shadow-emerald-500/30",
    },
  },
  hired: {
    avatar: "from-green-500 to-teal-500",
    badge: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-500/15 border-green-200 dark:border-green-500/30",
    accent: "border-l-green-400 dark:border-l-green-500",
    timeline: {
      gradient: "from-green-500 to-teal-500",
      text: "text-green-600 dark:text-green-300",
      ring: "ring-green-500/20",
      shadow: "shadow-green-500/30",
    },
  },
  rejected: {
    avatar: "from-rose-400 to-red-500",
    badge: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/30",
    accent: "border-l-rose-400 dark:border-l-rose-500",
    timeline: {
      gradient: "from-rose-400 to-red-500",
      text: "text-rose-600 dark:text-rose-300",
      ring: "ring-rose-500/20",
      shadow: "shadow-rose-500/30",
    },
  },
  withdrawn: {
    avatar: "from-slate-400 to-slate-500",
    badge: "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/60 border-slate-300 dark:border-slate-600",
    accent: "border-l-slate-400 dark:border-l-slate-500",
    timeline: {
      gradient: "from-slate-400 to-slate-500",
      text: "text-slate-500 dark:text-slate-400",
      ring: "ring-slate-500/20",
      shadow: "shadow-slate-500/30",
    },
  },
};

const DEFAULT_THEME: StageTheme = STAGE_THEMES.withdrawn;

export default function ApplicationCard({ app }: { app: any }) {
  const [status, setStatus] = useState(app.status);
  const [withdrawing, setWithdrawing] = useState(false);
  const [reapplying, setReapplying] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const theme = STAGE_THEMES[status] || DEFAULT_THEME;

  const handleWithdraw = async () => {
    if (!confirm("Are you sure you want to withdraw your application? This action cannot be undone.")) return;
    setWithdrawing(true);
    try {
      const { error } = await supabase.from("applications").update({ status: "withdrawn" }).eq("id", app.id);
      if (error) throw error;
      toast.success("Application withdrawn successfully");
      setStatus("withdrawn");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to withdraw application");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleReapply = async () => {
    // Can't reapply once the internship deadline has passed.
    if (
      app.internships?.deadline &&
      new Date(app.internships.deadline).getTime() < Date.now()
    ) {
      toast.error("This internship is closed — the application deadline has passed.");
      return;
    }

    setReapplying(true);
    try {
      // Create a new application for the same internship
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("applicant_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      const { error } = await supabase.from("applications").insert({
        internship_id: app.internship_id,
        applicant_name: profile?.full_name || app.applicant_name,
        email: user.email || app.email,
        phone: profile?.phone || app.phone,
        university: profile?.university || app.university,
        degree: profile?.degree || app.degree,
        cgpa: profile?.cgpa || app.cgpa,
        linkedin_url: profile?.linkedin_url || app.linkedin_url,
        github_url: profile?.github_url || app.github_url,
        portfolio_url: profile?.portfolio_url || app.portfolio_url,
        cv_path: profile?.cv_path || app.cv_path,
        status: "new",
      });

      if (error) throw error;
      toast.success("Re-applied successfully! Good luck!");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to re-apply");
    } finally {
      setReapplying(false);
    }
  };

  const getStageLabel = (status: string) => {
    switch (status) {
      case "new": return "Stage 1: Application Submitted";
      case "under_review": return "Stage 2: Under Review";
      case "ai_reviewed": case "viewed": return "Stage 3: Evaluated";
      case "shortlisted": return "Stage 4: Shortlisted 🎉";
      case "interview": return "Stage 5: Interview Stage";
      case "offer": case "hired": return "Final Stage: Offer Extended 🎊";
      case "rejected": return "Not Selected";
      case "withdrawn": return "Withdrawn";
      default: return status;
    }
  };

  const jobUrl = app.internships?.public_slug
    ? `/apply/${app.internships.public_slug}`
    : "/applicant/internships";

  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-card border border-border dark:border-slate-700 border-l-4 transition-all",
        theme.accent
      )}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex gap-4">
          <div
            className={cn(
              "w-14 h-14 bg-gradient-to-br text-white rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0 shadow-subtle",
              theme.avatar
            )}
          >
            {app.internships?.company_name?.charAt(0) || "C"}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-display font-bold text-primary dark:text-white">{app.internships?.title}</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${theme.badge} border`}>
                {getStageLabel(status)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-sm font-medium text-text-secondary dark:text-slate-400">{app.internships?.company_name}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 hidden sm:inline-block"></span>
              <span className="text-sm text-text-muted dark:text-slate-500">{app.internships?.location} • {app.internships?.work_mode}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 hidden sm:inline-block"></span>
              <span className="text-xs text-text-muted dark:text-slate-500">Applied {new Date(app.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={jobUrl}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="w-3.5 h-3.5" /> View Job
            </Button>
          </Link>
          {status === "rejected" && (
            <Button variant="gradient" size="sm" onClick={handleReapply} disabled={reapplying} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> {reapplying ? "Re-applying..." : "Reapply"}
            </Button>
          )}
          {status !== "withdrawn" && status !== "rejected" && status !== "hired" && (
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700" onClick={handleWithdraw} disabled={withdrawing}>
              {withdrawing ? "Withdrawing..." : "Withdraw"}
            </Button>
          )}
        </div>
      </div>

      <ApplicationTimeline currentStatus={status} theme={theme.timeline} />
    </div>
  );
}
