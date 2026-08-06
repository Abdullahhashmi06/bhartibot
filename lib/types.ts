export type RequirementType = "required" | "preferred";
export type WorkMode = "on-site" | "hybrid" | "remote";
export type QuestionType = "TEXT" | "YES_NO";
export type InternshipStatus = "draft" | "published" | "archived" | "closed";
export type ApplicationStatus =
  | "new"
  | "under_review"
  | "shortlisted"
  | "rejected"
  | "archived"
  | "pending";

export interface Requirement {
  id?: string;
  requirement: string;
  type: RequirementType;
}

export interface ScreeningQuestion {
  id: string;
  internship_id: string;
  question: string;
  type: QuestionType;
  created_at: string;
}

export interface Internship {
  id: string;
  organization_id: string;
  title: string;
  field: string | null;
  description: string | null;
  location: string | null;
  work_mode: WorkMode | null;
  duration: string | null;
  status: InternshipStatus | string;
  public_slug: string | null;
  stipend?: string | null;
  deadline?: string | null;
  internship_type?: string | null;
  created_at: string;
  github_required?: boolean;
  linkedin_required?: boolean;
}

export interface NewInternshipInput {
  title: string;
  field: string;
  description: string;
  location: string;
  work_mode: WorkMode;
  duration: string;
  stipend?: string;
  deadline?: string;
  internship_type?: string;
  requirements: Requirement[];
  github_required?: boolean;
  linkedin_required?: boolean;
  questions?: {
    question: string;
    type: QuestionType;
  }[];
}

export interface Application {
  id: string;
  internship_id: string;
  applicant_name: string;
  email: string;
  phone: string | null;
  university: string | null;
  degree: string | null;
  semester: string | null;
  cgpa: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  cv_path: string | null;
  status: ApplicationStatus | string;
  created_at: string;
}

export interface ApplicantFeedItem {
  id: string;
  organization_id: string;
  title: string;
  field: string | null;
  description: string | null;
  location: string | null;
  work_mode: string | null;
  duration: string | null;
  stipend: string | null;
  internship_type: string | null;
  deadline: string | null;
  status: string;
  public_slug: string | null;
  company_name: string;
  required_skills: string[];
  preferred_skills: string[];
  applicant_count: number;
  avg_applicant_match: number | null;
  created_at: string;
}

/**
 * Configurable recommendation-engine weights, persisted in the
 * recommendation_settings table. The engine reads these dynamically — changing
 * a row (and bumping `version`) instantly refreshes future recommendations
 * without any code change.
 */
export interface RecommendationWeights {
  required_skills_weight: number;
  preferred_skills_weight: number;
  education_weight: number;
  experience_weight: number;
  project_weight: number;
  profile_weight: number;
  competition_weight: number;
  recency_weight: number;
  algorithm_version: string;
  cache_version: number;
  version: number;
}

/** One missing skill with a priority order and estimated gains if learned. */
export interface SkillGap {
  skill: string;
  priority: "High" | "Medium" | "Low";
  matchGain: number; // estimated +match percentage points
  acceptanceGain: number; // estimated +acceptance percentage points
}

/** Competition intelligence for one internship. */
export interface CompetitionIntelligence {
  count: number;
  label: string;
  tone: "emerald" | "amber" | "rose";
  dot: string;
  estimatedDifficulty: "Low" | "Moderate" | "High";
  avgApplicantMatch: number | null;
}

/**
 * Cached AI recommendation for one (applicant, internship) pair.
 * Persisted in the applicant_recommendations table; the signal_hash allows
 * cheap staleness detection (recompute only when the applicant or the
 * internship requirements change). Extended with the v2 analytics columns.
 */
export interface ApplicantRecommendation {
  id: string;
  applicant_id: string;
  internship_id: string;
  match_score: number;
  explanation: string;
  matched_skills: string[];
  missing_skills: string[];
  signal_hash: string;
  acceptance_probability: number;
  overall_score: number;
  skill_gaps: SkillGap[] | null;
  strengths: string[];
  weaknesses: string[];
  competition_level: string;
  avg_applicant_match: number | null;
  reason_generated: "ai" | "computed" | "cache";
  algorithm_version: string;
  cache_version: number;
  weights_snapshot: Record<string, number> | null;
  profile_completeness: number;
  generated_at: string;
  updated_at: string;
}

export interface ApplicationAnswerInput {
  question_id: string;
  answer: string;
}

export interface NewApplicationInput {
  internship_id: string;
  applicant_name: string;
  email: string;
  phone?: string;
  university?: string;
  degree?: string;
  semester?: string;
  cgpa?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;

  cv_path?: string;

  answers: ApplicationAnswerInput[];
}

export interface ParsedResume {
  candidate_name: string;
  email: string;
  phone: string;
  education: string[];
  experience: string[];
  projects: string[];
  skills: string[];
  certifications: string[];
  cgpa: string;
  summary: string;
}

export type CandidateRecommendation = "Hire" | "Interview" | "Maybe" | "Reject";

export interface CandidateScore {
  match_score: number;

  confidence_score: number;
  resume_quality_score: number;
  technical_score: number;
  education_score: number;
  experience_score: number;
  communication_score: number;
  culture_fit_score: number;

  candidate_summary: string;
  strengths_summary: string;
  risks_summary: string;

  /** Singular-form summary paragraphs for dedicated display cards. */
  strength_summary: string;
  risk_summary: string;

  /** Per-score recruiter-facing explanations. */
  overall_explanation: string;
  technical_reason: string;
  education_reason: string;
  experience_reason: string;
  communication_reason: string;
  culture_reason: string;

  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];

  recommendation: CandidateRecommendation;
  reasoning: string;
}

export interface CandidateScoreInput {
  parsedResume: ParsedResume;
  internship: Internship;
  requirements: Requirement[];
  screeningAnswers: { question: string; answer: string }[];
}

export interface CandidateAiAnalysis {
  id: string;
  application_id: string;
  parsed_resume: ParsedResume;
  match_score: number;
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  recommendation: CandidateRecommendation;
  reasoning: string;
  created_at: string;

  // Enhanced AI output fields — optional so DB schema is unchanged.
  candidate_summary?: string;
  strengths_summary?: string;
  risks_summary?: string;
  strength_summary?: string;
  risk_summary?: string;

  // Sub-scores from AI analysis
  technical_score?: number;
  education_score?: number;
  experience_score?: number;
  communication_score?: number;
  culture_fit_score?: number;
  confidence_score?: number;
  resume_quality_score?: number;

  // Per-score recruiter-facing explanations
  overall_explanation?: string;
  technical_reason?: string;
  education_reason?: string;
  experience_reason?: string;
  communication_reason?: string;
  culture_reason?: string;
  recruiter_notes?: string;
}

export const FIELD_OPTIONS = [
  "Computer Science / AI / IT",
  "Engineering",
  "Accounting / Finance",
  "Business / Marketing",
  "Medicine / Healthcare / Clinical Research",
  "Sciences",
  "Law",
  "Design",
  "Other",
];

export interface DashboardStats {
  totalInternships: number;
  activeInternships: number;
  archivedInternships: number;
  totalApplications: number;
  newApplications: number;
  underReviewApplications: number;
  shortlistedApplications: number;
  rejectedApplications: number;
  scheduledInterviews: number;
  averageAiScore: number;
  weeklyApplicationTrend: number | null; // percentage change vs previous week, null if no prior data
  aiScoresByInternship: Record<string, number>; // internshipId -> average AI score
  scoreDistribution: {
    excellent: number;
    good: number;
    average: number;
    weak: number;
  };
}

export interface ActivityItem {
  id: string;
  type: "application" | "status_change" | "internship_published" | "ai_analysis" | "shortlisted";
  title: string;
  description: string;
  timestamp: string;
  icon?: string;
  link?: string;
}
