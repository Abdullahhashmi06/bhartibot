import { SupabaseClient } from "@supabase/supabase-js";

export async function getApplicantProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.from("applicant_profiles").select("*").eq("id", userId).single();
  return { data, error };
}

export async function upsertApplicantProfile(supabase: SupabaseClient, userId: string, data: any) {
  const { data: result, error } = await supabase.from("applicant_profiles").upsert({ id: userId, ...data, updated_at: new Date().toISOString() }).select().single();
  return { data: result, error };
}

export async function getApplicantSkills(supabase: SupabaseClient, applicantId: string) {
  const { data, error } = await supabase.from("applicant_skills").select("*").eq("applicant_id", applicantId);
  return { data, error };
}

export async function addApplicantSkill(supabase: SupabaseClient, applicantId: string, skill: string) {
  const { data, error } = await supabase.from("applicant_skills").insert({ applicant_id: applicantId, skill }).select().single();
  return { data, error };
}

export async function deleteApplicantSkill(supabase: SupabaseClient, skillId: string) {
  const { error } = await supabase.from("applicant_skills").delete().eq("id", skillId);
  return { error };
}

export async function getApplicantProjects(supabase: SupabaseClient, applicantId: string) {
  const { data, error } = await supabase.from("applicant_projects").select("*").eq("applicant_id", applicantId);
  return { data, error };
}

export async function upsertApplicantProject(supabase: SupabaseClient, applicantId: string, project: any) {
  const { data, error } = await supabase.from("applicant_projects").upsert(project.id ? { id: project.id, applicant_id: applicantId, ...project } : { applicant_id: applicantId, ...project }).select().single();
  return { data, error };
}

export async function deleteApplicantProject(supabase: SupabaseClient, projectId: string) {
  const { error } = await supabase.from("applicant_projects").delete().eq("id", projectId);
  return { error };
}

export async function getApplicantExperience(supabase: SupabaseClient, applicantId: string) {
  const { data, error } = await supabase.from("applicant_experience").select("*").eq("applicant_id", applicantId);
  return { data, error };
}

export async function upsertApplicantExperience(supabase: SupabaseClient, applicantId: string, exp: any) {
  const { data, error } = await supabase.from("applicant_experience").upsert(exp.id ? { id: exp.id, applicant_id: applicantId, ...exp } : { applicant_id: applicantId, ...exp }).select().single();
  return { data, error };
}

export async function deleteApplicantExperience(supabase: SupabaseClient, expId: string) {
  const { error } = await supabase.from("applicant_experience").delete().eq("id", expId);
  return { error };
}

export async function getSavedJobs(supabase: SupabaseClient, applicantId: string) {
  const { data, error } = await supabase.from("saved_jobs").select("*, internships(*)").eq("applicant_id", applicantId);
  return { data, error };
}

export async function saveJob(supabase: SupabaseClient, applicantId: string, internshipId: string) {
  const { data, error } = await supabase.from("saved_jobs").insert({ applicant_id: applicantId, internship_id: internshipId }).select().single();
  return { data, error };
}

export async function unsaveJob(supabase: SupabaseClient, applicantId: string, internshipId: string) {
  const { error } = await supabase.from("saved_jobs").delete().eq("applicant_id", applicantId).eq("internship_id", internshipId);
  return { error };
}

export async function getPublishedInternships(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("internships").select("*").eq("status", "published");
  return { data, error };
}

export async function getApplicantApplications(supabase: SupabaseClient, email: string, applicantName?: string) {
  let query = supabase.from("applications").select("*, internships(*)");
  
  if (applicantName) {
    query = query.or(`email.eq.${email},applicant_name.eq."${applicantName}"`);
  } else {
    query = query.eq("email", email);
  }
  
  const { data, error } = await query;
  console.log(data);
  return { data, error };
}

export async function withdrawApplication(supabase: SupabaseClient, applicationId: string) {
  const { error } = await supabase.from("applications").update({ status: "withdrawn" }).eq("id", applicationId);
  return { error };
}

export function getProfileCompletionScore(profile: any, skills: any[], projects: any[], experience: any[]) {
  let score = 0;
  if (profile) {
    if (profile.full_name) score += 10;
    if (profile.email) score += 10;
    if (profile.phone) score += 5;
    if (profile.location) score += 5;
    if (profile.university) score += 10;
    if (profile.degree) score += 10;
    if (profile.cv_path) score += 20;
  }
  if (skills && skills.length > 0) score += 10;
  if (projects && projects.length > 0) score += 10;
  if (experience && experience.length > 0) score += 10;
  return Math.min(score, 100);
}
