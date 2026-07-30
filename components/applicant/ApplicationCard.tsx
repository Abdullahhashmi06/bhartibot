"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, ArrowLeft, ExternalLink } from "lucide-react";
import ApplicationTimeline from "./ApplicationTimeline";
import Tag from "@/components/ui/Tag";

export default function ApplicationCard({ app }: { app: any }) {
  const [status, setStatus] = useState(app.status);
  const [withdrawing, setWithdrawing] = useState(false);
  const [reapplying, setReapplying] = useState(false);
  const supabase = createClient();
  const router = useRouter();

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

  const statusColors: Record<string, string> = {
    new: "text-blue-700 bg-blue-50 border-blue-200",
    under_review: "text-amber-700 bg-amber-50 border-amber-200",
    ai_reviewed: "text-amber-700 bg-amber-50 border-amber-200",
    viewed: "text-amber-700 bg-amber-50 border-amber-200",
    shortlisted: "text-teal-700 bg-teal-50 border-teal-200",
    interview: "text-teal-700 bg-teal-50 border-teal-200",
    offer: "text-emerald-700 bg-emerald-50 border-emerald-200",
    hired: "text-emerald-700 bg-emerald-50 border-emerald-200",
    rejected: "text-rose-700 bg-rose-50 border-rose-200",
    withdrawn: "text-slate-700 bg-slate-100 border-slate-300",
  };

  const stageColor = statusColors[status] || "text-slate-700 bg-slate-100 border-slate-200";

  return (
    <div className="bg-white rounded-3xl p-6 shadow-card border border-border">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-slate-50 to-slate-100 border border-border rounded-2xl flex items-center justify-center text-2xl font-bold text-primary shrink-0 shadow-subtle">
            {app.internships?.company_name?.charAt(0) || "C"}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-display font-bold text-primary">{app.internships?.title}</h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${stageColor} border`}>
                {getStageLabel(status)}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-sm font-medium text-text-secondary">{app.internships?.company_name}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 hidden sm:inline-block"></span>
              <span className="text-sm text-text-muted">{app.internships?.location} • {app.internships?.work_mode}</span>
            </div>
            <p className="text-xs text-text-muted mt-2">Applied on {new Date(app.created_at).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/applicant/internships`}>
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
            <Button variant="ghost" size="sm" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={handleWithdraw} disabled={withdrawing}>
              {withdrawing ? "Withdrawing..." : "Withdraw"}
            </Button>
          )}
        </div>
      </div>
      
      <ApplicationTimeline currentStatus={status} />
    </div>
  );
}
