import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  JobAlert,
  CreateJobAlertInput,
  JobAlertMatch,
  ApplicantFeedItem,
} from "@/lib/types";

/**
 * Fetch all alerts for the authenticated applicant.
 */
export async function getApplicantJobAlerts(
  supabase: SupabaseClient,
  applicantId: string
): Promise<JobAlert[]> {
  try {
    const { data, error } = await supabase
      .from("job_alerts")
      .select("*")
      .eq("applicant_id", applicantId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[JOB_ALERTS] fetch warning:", error.message);
      return [];
    }
    return (data as JobAlert[]) || [];
  } catch (err) {
    console.warn("[JOB_ALERTS] error:", err);
    return [];
  }
}

/**
 * Create a new job alert for applicant.
 */
export async function createJobAlert(
  supabase: SupabaseClient,
  applicantId: string,
  input: CreateJobAlertInput
): Promise<JobAlert | null> {
  const payload = {
    applicant_id: applicantId,
    title: input.title,
    target_role: input.target_role || null,
    skills: input.skills || [],
    companies: input.companies || [],
    location: input.location || null,
    work_mode: input.work_mode || "any",
    match_threshold: input.match_threshold ?? 60,
    frequency: input.frequency || "instant",
    channels: input.channels || ["in_app"],
    is_active: true,
  };

  const { data, error } = await supabase
    .from("job_alerts")
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as JobAlert;
}

/**
 * Update an existing job alert.
 */
export async function updateJobAlert(
  supabase: SupabaseClient,
  alertId: string,
  applicantId: string,
  updates: Partial<JobAlert>
): Promise<JobAlert | null> {
  const { data, error } = await supabase
    .from("job_alerts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", alertId)
    .eq("applicant_id", applicantId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as JobAlert;
}

/**
 * Delete a job alert.
 */
export async function deleteJobAlert(
  supabase: SupabaseClient,
  alertId: string,
  applicantId: string
): Promise<boolean> {
  const { error } = await supabase
    .from("job_alerts")
    .delete()
    .eq("id", alertId)
    .eq("applicant_id", applicantId);

  if (error) {
    throw new Error(error.message);
  }
  return true;
}

export interface MatchEvaluation {
  isMatch: boolean;
  score: number;
  reasons: string[];
}

/**
 * Evaluates whether an internship matches an alert's criteria and calculates a score.
 */
export function evaluateJobAlertMatch(
  alert: JobAlert,
  job: ApplicantFeedItem | any
): MatchEvaluation {
  const reasons: string[] = [];
  let score = 30; // base score

  const jobTitle = (job.title || "").toLowerCase();
  const jobCompany = (job.company_name || "").toLowerCase();
  const jobLocation = (job.location || "").toLowerCase();
  const jobWorkMode = (job.work_mode || "").toLowerCase();
  const jobSkills = [
    ...(job.required_skills || []),
    ...(job.preferred_skills || []),
  ].map((s: string) => s.toLowerCase());

  // 1. Role / Title Match
  if (alert.target_role && alert.target_role.trim()) {
    const targetTerms = alert.target_role.toLowerCase().split(/\s+/).filter(Boolean);
    const matchedTerms = targetTerms.filter((term) => jobTitle.includes(term));
    if (matchedTerms.length > 0) {
      score += 35;
      reasons.push(`Role match on "${alert.target_role}"`);
    } else {
      score -= 10;
    }
  }

  // 2. Skills Match
  if (alert.skills && alert.skills.length > 0) {
    const matchedSkills = alert.skills.filter((skill) => {
      const sLower = skill.toLowerCase();
      return jobSkills.some((js) => js.includes(sLower) || sLower.includes(js));
    });

    if (matchedSkills.length > 0) {
      const skillScore = Math.min(30, matchedSkills.length * 10);
      score += skillScore;
      reasons.push(
        `${matchedSkills.length} target skill${
          matchedSkills.length === 1 ? "" : "s"
        } matched (${matchedSkills.slice(0, 3).join(", ")})`
      );
    }
  }

  // 3. Company Match
  if (alert.companies && alert.companies.length > 0) {
    const matchedCompany = alert.companies.find((comp) =>
      jobCompany.includes(comp.toLowerCase())
    );
    if (matchedCompany) {
      score += 15;
      reasons.push(`Target company match ("${job.company_name}")`);
    }
  }

  // 4. Location Match
  if (alert.location && alert.location.trim()) {
    if (jobLocation.includes(alert.location.toLowerCase())) {
      score += 10;
      reasons.push(`Location matches "${alert.location}"`);
    }
  }

  // 5. Work Mode Match
  if (alert.work_mode && alert.work_mode !== "any") {
    if (jobWorkMode.includes(alert.work_mode.toLowerCase())) {
      score += 10;
      reasons.push(`Preferred work mode: ${alert.work_mode}`);
    }
  }

  const finalScore = Math.min(100, Math.max(10, score));
  const isMatch = finalScore >= (alert.match_threshold || 60);

  return {
    isMatch,
    score: finalScore,
    reasons,
  };
}

/**
 * Scan all active alerts for applicant, record matches, and generate notifications.
 */
export async function scanAndNotifyApplicantAlerts(
  supabase: SupabaseClient,
  applicantId: string,
  jobs: (ApplicantFeedItem | any)[]
): Promise<{ newMatchesCount: number; matches: JobAlertMatch[] }> {
  // 1. Get active alerts
  const alerts = await getApplicantJobAlerts(supabase, applicantId);
  const activeAlerts = alerts.filter((a) => a.is_active);

  if (activeAlerts.length === 0 || jobs.length === 0) {
    return { newMatchesCount: 0, matches: [] };
  }

  // 2. Fetch previously recorded matches for deduplication
  const { data: existingMatches } = await supabase
    .from("job_alert_matches")
    .select("alert_id, internship_id")
    .eq("applicant_id", applicantId);

  const seenKeys = new Set(
    (existingMatches || []).map((m: any) => `${m.alert_id}:${m.internship_id}`)
  );

  const newMatchesToInsert: any[] = [];
  const inAppNotificationsToInsert: any[] = [];
  const resultMatches: JobAlertMatch[] = [];

  for (const alert of activeAlerts) {
    for (const job of jobs) {
      const dedupeKey = `${alert.id}:${job.id}`;
      const evalResult = evaluateJobAlertMatch(alert, job);

      if (evalResult.isMatch) {
        const isNew = !seenKeys.has(dedupeKey);
        const matchObj: JobAlertMatch = {
          id: dedupeKey,
          alert_id: alert.id,
          applicant_id: applicantId,
          internship_id: job.id,
          match_reasons: evalResult.reasons,
          score: evalResult.score,
          notified_channels: alert.channels,
          created_at: new Date().toISOString(),
          internship: job,
        };

        resultMatches.push(matchObj);

        if (isNew) {
          seenKeys.add(dedupeKey);
          newMatchesToInsert.push({
            alert_id: alert.id,
            applicant_id: applicantId,
            internship_id: job.id,
            match_reasons: evalResult.reasons,
            score: evalResult.score,
            notified_channels: alert.channels,
          });

          // Check if in_app channel enabled
          if (alert.channels.includes("in_app")) {
            inAppNotificationsToInsert.push({
              user_id: applicantId,
              type: "job_alert",
              title: `New Match: ${job.title}`,
              body: `${job.company_name} · ${evalResult.reasons[0] || "Matches your preferences"} (${evalResult.score}% match)`,
              link: job.public_slug ? `/internships/${job.public_slug}` : "/applicant/internships",
              read: false,
            });
          }
        }
      }
    }
  }

  // 3. Batch insert new matches
  if (newMatchesToInsert.length > 0) {
    try {
      await supabase.from("job_alert_matches").insert(newMatchesToInsert);
    } catch (e) {
      console.warn("[JOB_ALERTS] matches insert warning:", e);
    }
  }

  // 4. Batch insert in-app notifications
  if (inAppNotificationsToInsert.length > 0) {
    try {
      await supabase.from("notifications").insert(inAppNotificationsToInsert);
    } catch (e) {
      console.warn("[JOB_ALERTS] notifications insert warning:", e);
    }
  }

  // 5. Update last_run_at timestamp on active alerts
  try {
    const alertIds = activeAlerts.map((a) => a.id);
    await supabase
      .from("job_alerts")
      .update({ last_run_at: new Date().toISOString() })
      .in("id", alertIds);
  } catch (e) {
    console.warn("[JOB_ALERTS] alert timestamp update warning:", e);
  }

  return {
    newMatchesCount: newMatchesToInsert.length,
    matches: resultMatches,
  };
}
