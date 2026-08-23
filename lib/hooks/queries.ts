import { useQuery, useQueryClient } from "@tanstack/react-query";

// ─── Query Key Factories ──────────────────────────────────────────────────────
// All keys are scoped to avoid cross-user data leaks.

export const queryKeys = {
  // Recruiter — scoped by orgId to prevent cross-organization data leakage
  recruiterDashboard: (orgId: string) => ["recruiter-dashboard", orgId] as const,
  recruiterApplications: (orgId: string, internshipId?: string) =>
    internshipId
      ? (["recruiter-applications", orgId, internshipId] as const)
      : (["recruiter-applications", orgId] as const),

  // Applicant — scoped by userId to prevent cross-user data leakage
  applicantDashboard: (userId: string) => ["applicant-dashboard", userId] as const,
  applicantProfile: (userId: string) => ["applicant-profile", userId] as const,
  applicantApplications: (userId: string) => ["applicant-applications", userId] as const,
  applicantInternships: (userId: string) => ["applicant-internships", userId] as const,
} as const;

// ─── Recruiter Hooks ──────────────────────────────────────────────────────────

/**
 * Recruiter dashboard analytics.
 * staleTime: 30s — dashboard data changes when applications arrive.
 */
export function useRecruiterDashboard(orgId: string) {
  return useQuery({
    queryKey: queryKeys.recruiterDashboard(orgId),
    queryFn: async () => {
      const res = await fetch("/api/data/recruiter-dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

/**
 * Recruiter applications for a specific internship (or all).
 * staleTime: 15s — application status changes frequently.
 */
export function useRecruiterApplications(orgId: string, internshipId?: string) {
  return useQuery({
    queryKey: queryKeys.recruiterApplications(orgId, internshipId),
    queryFn: async () => {
      const url = internshipId
        ? `/api/data/recruiter-applications?internshipId=${internshipId}`
        : "/api/data/recruiter-applications";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch applications");
      return res.json();
    },
    staleTime: 15_000,
    gcTime: 5 * 60_000,
  });
}

// ─── Applicant Hooks ──────────────────────────────────────────────────────────

/**
 * Applicant dashboard data (profile, applications, stats).
 * staleTime: 60s — profile data is relatively stable.
 */
export function useApplicantDashboard(userId: string) {
  return useQuery({
    queryKey: queryKeys.applicantDashboard(userId),
    queryFn: async () => {
      const res = await fetch("/api/data/applicant-dashboard");
      if (!res.ok) throw new Error("Failed to fetch applicant dashboard");
      return res.json();
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}

/**
 * Applicant profile + skills + projects + experience.
 * staleTime: 120s — profile data rarely changes.
 */
export function useApplicantProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.applicantProfile(userId),
    queryFn: async () => {
      const res = await fetch("/api/data/applicant-profile");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    staleTime: 120_000,
    gcTime: 10 * 60_000,
  });
}

/**
 * Applicant applications list.
 * staleTime: 30s — application statuses change.
 */
export function useApplicantApplications(userId: string) {
  return useQuery({
    queryKey: queryKeys.applicantApplications(userId),
    queryFn: async () => {
      const res = await fetch("/api/data/applicant-applications");
      if (!res.ok) throw new Error("Failed to fetch applications");
      return res.json();
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

/**
 * Applicant internships/recommendations.
 * staleTime: 120s — AI recommendations are expensive and generally immutable.
 */
export function useApplicantInternships(userId: string) {
  return useQuery({
    queryKey: queryKeys.applicantInternships(userId),
    queryFn: async () => {
      const res = await fetch("/api/data/applicant-internships");
      if (!res.ok) throw new Error("Failed to fetch internships");
      return res.json();
    },
    staleTime: 120_000,
    gcTime: 15 * 60_000,
  });
}

// ─── Invalidation Helpers ─────────────────────────────────────────────────────

export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    /** After creating/updating/deleting an internship */
    invalidateRecruiterDashboard: (orgId: string) =>
      queryClient.invalidateQueries({ queryKey: ["recruiter-dashboard", orgId] }),

    /** After changing application status */
    invalidateRecruiterApplications: (orgId: string) =>
      queryClient.invalidateQueries({ queryKey: ["recruiter-applications", orgId] }),

    /** After applicant submits application */
    invalidateApplicantApplications: (userId: string) =>
      queryClient.invalidateQueries({ queryKey: ["applicant-applications", userId] }),

    /** After applicant updates profile */
    invalidateApplicantProfile: (userId: string) =>
      queryClient.invalidateQueries({ queryKey: ["applicant-profile", userId] }),

    /** After any mutation that affects recruiter stats — prefix match */
    invalidateAllRecruiter: (orgId: string) =>
      queryClient.invalidateQueries({ queryKey: ["recruiter", orgId] }),

    /** After any mutation that affects applicant data — prefix match */
    invalidateAllApplicant: (userId: string) =>
      queryClient.invalidateQueries({ queryKey: ["applicant", userId] }),

    /** Nuclear option: clear everything (e.g., on logout) */
    clearAll: () => queryClient.clear(),
  };
}
