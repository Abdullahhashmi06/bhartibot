"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Bookmark, MapPin, Building, Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import Tag from "@/components/ui/Tag";
import SavedJobCard from "@/components/applicant/SavedJobCard";

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from("saved_jobs")
        .select("*, internships(*)")
        .eq("applicant_id", user.id);
        
      if (error) throw error;
      setJobs(data || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (internshipId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { error } = await supabase
        .from("saved_jobs")
        .delete()
        .eq("applicant_id", user.id)
        .eq("internship_id", internshipId);
        
      if (error) throw error;
      setJobs(jobs.filter(j => j.internship_id !== internshipId));
      toast.success("Job removed from saved list");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-text-muted">Loading saved jobs...</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-primary">Saved Jobs</h1>
        <p className="text-text-secondary mt-1">Internships you&apos;ve bookmarked for later.</p>
      </div>

      {jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <SavedJobCard key={job.id} job={job} onUnsave={handleUnsave} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center shadow-card border border-border flex flex-col items-center">
          <div className="w-16 h-16 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-4">
            <Bookmark className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-display font-bold text-primary mb-2">No Saved Jobs</h2>
          <p className="text-text-secondary max-w-md mx-auto mb-6">
            You haven&apos;t saved any internships yet. Browse available positions and bookmark ones you&apos;re interested in!
          </p>
          <Link href="/applicant/internships">
            <Button variant="gradient">Explore Internships</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
