export type RequirementType = "required" | "preferred";
export type WorkMode = "on-site" | "hybrid" | "remote";
export type QuestionType = "text" | "yes_no";
export type InternshipStatus = "draft" | "published";
export type ApplicationStatus =
  | "new"
  | "under_review"
  | "shortlisted"
  | "rejected";

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
  created_at: string;
}

export interface NewInternshipInput {
  title: string;
  field: string;
  description: string;
  location: string;
  work_mode: WorkMode;
  duration: string;
  requirements: Requirement[];
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
