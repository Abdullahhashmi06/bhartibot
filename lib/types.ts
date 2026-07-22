export type RequirementType = "required" | "preferred";
export type WorkMode = "on-site" | "hybrid" | "remote";

export interface Requirement {
  id?: string;
  requirement: string;
  type: RequirementType;
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
  status: string;
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
