"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import OpportunityCard from "@/components/applicant/OpportunityCard";
import MatchDrawer from "@/components/applicant/MatchDrawer";
import type { RecommendationResult } from "@/lib/ai/recommendations";

export default function SavedJobCard({
  job,
  onUnsave,
}: {
  job: RecommendationResult;
  onUnsave?: (id: string) => void;
}) {
  const [applying, setApplying] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unsaving, setUnsaving] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Unsave works even without an explicit onUnsave prop (server-driven pages
  // don't pass one) — the card removes the row itself and refreshes.
  const handleUnsave = async () => {
    if (unsaving) return;
    setUnsaving(true);
    try {
      if (onUnsave) {
        onUnsave(job.id);
        return;
      }
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("saved_jobs")
        .delete()
        .eq("applicant_id", user.id)
        .eq("internship_id", job.id);
      if (error) throw error;
      toast.success("Job removed from saved list");
    } catch (e: any) {
      toast.error(e.message || "Failed to remove");
    } finally {
      setUnsaving(false);
    }
  };

  const handleApply = async () => {
    // Prefer the polished public apply flow when a slug exists.
    if (job.public_slug) {
      router.push(`/apply/${job.public_slug}`);
      return;
    }

    setApplying(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("applicant_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || !profile.full_name) {
        toast.error("Please complete your profile before applying");
        return;
      }

      const { error } = await supabase.from("applications").insert({
        internship_id: job.id,
        applicant_name: profile.full_name,
        email: user.email || profile.email,
        phone: profile.phone || null,
        university: profile.university || null,
        degree: profile.degree || null,
        cgpa: profile.cgpa || null,
        linkedin_url: profile.linkedin_url || null,
        github_url: profile.github_url || null,
        portfolio_url: profile.portfolio_url || null,
        cv_path: profile.cv_path || null,
        status: "new",
      });

      if (error) throw error;
      toast.success("Application submitted successfully!");
      setAlreadyApplied(true);
      queryClient.invalidateQueries({ queryKey: ["applicant-applications"] });
      queryClient.invalidateQueries({ queryKey: ["applicant-dashboard"] });
    } catch (e: any) {
      toast.error(e.message || "Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <OpportunityCard
        job={job}
        saved
        applied={alreadyApplied}
        applying={applying}
        onToggleSave={handleUnsave}
        onApply={handleApply}
        onWhyThisMatch={() => setDrawerOpen(true)}
      />

      {/* WHY THIS MATCH? DRAWER */}
      <MatchDrawer
        job={drawerOpen ? job : null}
        saved
        applied={alreadyApplied}
        applying={applying}
        onClose={() => setDrawerOpen(false)}
        onToggleSave={handleUnsave}
        onApply={async () => {
          await handleApply();
          setDrawerOpen(false);
        }}
      />
    </>
  );
}
