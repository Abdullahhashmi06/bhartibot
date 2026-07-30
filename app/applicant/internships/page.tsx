"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Search, MapPin, Building, Calendar, Bookmark, Filter, Sparkles, Clock, X, Briefcase, GraduationCap, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Tag from "@/components/ui/Tag";
import { motion, AnimatePresence } from "framer-motion";
import CircularGauge from "@/components/ai/CircularGauge";

export default function InternshipsPage() {
  const [internships, setInternships] = useState<any[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [applying, setApplying] = useState<string | null>(null);
  const [filterWorkMode, setFilterWorkMode] = useState<string>("");
  const [filterLocation, setFilterLocation] = useState<string>("");
  const [filterField, setFilterField] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});
  const [matchedSkills, setMatchedSkills] = useState<Record<string, string[]>>({});
  const [missingSkills, setMissingSkills] = useState<Record<string, string[]>>({});
  const [applicantSkills, setApplicantSkills] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [internshipsRes, savedRes, applicationsRes, skillsRes] = await Promise.all([
        supabase.from("internships").select("*").eq("status", "published"),
        supabase.from("saved_jobs").select("internship_id").eq("applicant_id", user.id),
        supabase.from("applications").select("internship_id").eq("email", user.email),
        supabase.from("applicant_skills").select("skill").eq("applicant_id", user.id)
      ]);

      if (internshipsRes.error) throw internshipsRes.error;
      
      const jobs = internshipsRes.data || [];
      const skills = (skillsRes.data || []).map(s => s.skill.toLowerCase());
      setApplicantSkills(skills);
      
      // Calculate match scores for all jobs
      const scores: Record<string, number> = {};
      const matched: Record<string, string[]> = {};
      const missing: Record<string, string[]> = {};
      
      jobs.forEach(job => {
        let matches: string[] = [];
        let misses: string[] = [];
        
        if (job.skills && Array.isArray(job.skills)) {
          job.skills.forEach((js: string) => {
            if (skills.some(as => as.includes(js.toLowerCase()) || js.toLowerCase().includes(as))) {
              matches.push(js);
            } else {
              misses.push(js);
            }
          });
        }
        
        const total = job.skills?.length || 1;
        scores[job.id] = Math.round((matches.length / total) * 100);
        matched[job.id] = matches;
        missing[job.id] = misses;
      });
      
      setMatchScores(scores);
      setMatchedSkills(matched);
      setMissingSkills(missing);
      setInternships(jobs);
      setSavedJobIds(new Set((savedRes.data || []).map(s => s.internship_id)));
      setAppliedJobIds(new Set((applicationsRes.data || []).map(a => a.internship_id)));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = async (internshipId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isSaved = savedJobIds.has(internshipId);
      
      if (isSaved) {
        await supabase.from("saved_jobs").delete().eq("applicant_id", user.id).eq("internship_id", internshipId);
        const newSet = new Set(savedJobIds);
        newSet.delete(internshipId);
        setSavedJobIds(newSet);
        toast.success("Removed from saved jobs");
      } else {
        await supabase.from("saved_jobs").insert({ applicant_id: user.id, internship_id: internshipId });
        const newSet = new Set(savedJobIds);
        newSet.add(internshipId);
        setSavedJobIds(newSet);
        toast.success("Job saved successfully!");
      }
    } catch (e: any) {
      toast.error("Failed to update saved status");
    }
  };

  const handleApply = async (internship: any) => {
    setApplying(internship.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
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

      const { data: existingApp } = await supabase
        .from("applications")
        .select("id")
        .eq("internship_id", internship.id)
        .eq("email", user.email || profile.email)
        .maybeSingle();

      if (existingApp) {
        toast.info("You've already applied to this internship");
        const newSet = new Set(appliedJobIds);
        newSet.add(internship.id);
        setAppliedJobIds(newSet);
        return;
      }

      const { error } = await supabase.from("applications").insert({
        internship_id: internship.id,
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
      
      const newSet = new Set(appliedJobIds);
      newSet.add(internship.id);
      setAppliedJobIds(newSet);
      toast.success("Application submitted successfully!");
    } catch (e: any) {
      toast.error(e.message || "Failed to apply");
    } finally {
      setApplying(null);
    }
  };

  // Get unique values for filters
  const uniqueWorkModes = Array.from(new Set(internships.map(i => i.work_mode).filter(Boolean)));
  const uniqueLocations = Array.from(new Set(internships.map(i => i.location).filter(Boolean)));
  const uniqueFields = Array.from(new Set(internships.map(i => i.field).filter(Boolean)));

  // Apply filters
  const filteredInternships = internships.filter(i => {
    if (searchQuery && !i.title.toLowerCase().includes(searchQuery.toLowerCase()) && !i.company_name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterWorkMode && i.work_mode !== filterWorkMode) return false;
    if (filterLocation && i.location !== filterLocation) return false;
    if (filterField && i.field !== filterField) return false;
    return true;
  });

  const clearFilters = () => {
    setFilterWorkMode("");
    setFilterLocation("");
    setFilterField("");
    setSearchQuery("");
  };

  const hasActiveFilters = filterWorkMode || filterLocation || filterField;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold text-primary">Discover Internships</h1>
        <p className="text-text-secondary mt-1">Find and apply to the best opportunities matching your skills.</p>
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
            <input
              type="text"
              placeholder="Search by role or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-border bg-white shadow-sm focus:border-teal focus:ring-1 focus:ring-teal outline-none transition-all"
            />
          </div>
          <Button 
            variant={showFilters ? "gradient" : "outline"} 
            className="shrink-0 gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" /> Filters
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-teal text-white text-[10px] rounded-full font-bold">
                {[filterWorkMode, filterLocation, filterField].filter(Boolean).length}
              </span>
            )}
          </Button>
        </div>

        {/* Expandable Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white rounded-2xl border border-border p-5 shadow-subtle space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
                    <Filter className="w-4 h-4 text-teal" /> Filter Internships
                  </h3>
                  <button onClick={clearFilters} className="text-xs font-medium text-teal hover:text-teal-dark transition-colors">
                    Clear all
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">Work Mode</label>
                    <select 
                      value={filterWorkMode} 
                      onChange={e => setFilterWorkMode(e.target.value)}
                      className="w-full rounded-xl border border-border bg-slate-50 px-3 py-2.5 text-sm focus:border-teal focus:outline-none"
                    >
                      <option value="">All Modes</option>
                      {uniqueWorkModes.map(mode => <option key={mode} value={mode}>{mode}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">Location</label>
                    <select 
                      value={filterLocation} 
                      onChange={e => setFilterLocation(e.target.value)}
                      className="w-full rounded-xl border border-border bg-slate-50 px-3 py-2.5 text-sm focus:border-teal focus:outline-none"
                    >
                      <option value="">All Locations</option>
                      {uniqueLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-1.5">Field</label>
                    <select 
                      value={filterField} 
                      onChange={e => setFilterField(e.target.value)}
                      className="w-full rounded-xl border border-border bg-slate-50 px-3 py-2.5 text-sm focus:border-teal focus:outline-none"
                    >
                      <option value="">All Fields</option>
                      {uniqueFields.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-muted">Loading internships...</div>
      ) : filteredInternships.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredInternships.map((job) => {
            const score = matchScores[job.id] || 0;
            const matched = matchedSkills[job.id] || [];
            const missing = missingSkills[job.id] || [];

            return (
              <motion.div 
                key={job.id} 
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-3xl shadow-card border border-border flex flex-col hover:border-teal/30 transition-all hover:shadow-hover"
              >
                <div className="flex gap-4 mb-4">
                  <div className="w-14 h-14 bg-slate-50 border border-border rounded-2xl flex items-center justify-center text-2xl font-bold text-primary shrink-0 shadow-subtle">
                    {job.company_name?.charAt(0) || "C"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-xl text-primary truncate">{job.title}</h3>
                        <p className="text-text-secondary font-medium">{job.company_name}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <CircularGauge score={score} size={48} />
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3 text-sm text-text-muted mt-3">
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-teal" /> {job.location}</span>
                      <span className="flex items-center gap-1.5"><Building className="w-4 h-4 text-teal" /> {job.work_mode}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-teal" /> {job.duration || "3 months"}</span>
                    </div>
                  </div>
                </div>

                {/* Matched & Missing Skills Chips */}
                {matched.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] font-semibold text-emerald-600 mb-1 uppercase tracking-wide">✓ Matched Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {matched.slice(0, 5).map((skill: string, idx: number) => (
                        <span key={idx} className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {missing.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-semibold text-amber-600 mb-1 uppercase tracking-wide">○ Skills to Develop</p>
                    <div className="flex flex-wrap gap-1.5">
                      {missing.slice(0, 5).map((skill: string, idx: number) => (
                        <span key={idx} className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-600 border border-amber-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-primary">{job.stipend || "Unpaid"}</span>
                    <button onClick={() => toggleSave(job.id)} className="p-1.5 text-slate-400 hover:text-teal hover:bg-teal/10 rounded-lg transition-colors">
                      <Bookmark className={`w-4 h-4 ${savedJobIds.has(job.id) ? 'fill-teal text-teal' : ''}`} />
                    </button>
                  </div>
                  
                  {appliedJobIds.has(job.id) ? (
                    <Button variant="secondary" disabled className="bg-slate-100 text-slate-500 text-xs">
                      <Check className="w-3.5 h-3.5 mr-1" /> Applied
                    </Button>
                  ) : (
                    <Button variant="gradient" onClick={() => handleApply(job)} disabled={applying === job.id}>
                      {applying === job.id ? "Applying..." : "Apply Now"}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-border">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-text-secondary font-medium">No internships found matching your criteria.</p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}


