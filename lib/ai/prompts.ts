import type { ParsedResume, CandidateScoreInput } from "@/lib/types";

/** Step 2 — resume parser system instruction. Output must be raw JSON only. */
export const RESUME_PARSE_SYSTEM = `You extract structured data from resume text.
Return valid JSON only. Do not use markdown, code fences, or any commentary.
Use exactly the keys shown in the schema. Use empty strings or empty arrays when a field is missing.`;

export const PARSED_RESUME_SCHEMA = `{
  "candidate_name": "",
  "email": "",
  "phone": "",
  "education": [],
  "experience": [],
  "projects": [],
  "skills": [],
  "certifications": [],
  "cgpa": "",
  "summary": ""
}`;

export function buildResumeParsePrompt(resumeText: string): string {
  return `Extract structured resume data and return JSON matching this exact schema:

${PARSED_RESUME_SCHEMA}

Field rules:
- candidate_name: full name from the resume
- email, phone: contact details (empty string if absent)
- education: each entry as one string (degree, school, dates)
- experience: each role as one string (title, company, dates)
- projects: each project as one string
- skills: individual skill strings
- certifications: each certification as one string
- cgpa: GPA/CGPA as a string (empty if not found)
- summary: one short paragraph about the candidate

Resume text:
"""
${resumeText.slice(0, 80_000)}
"""`;
}

/** Step 3 — candidate scoring system instruction. Output must be raw JSON only. */
export const SCORE_SYSTEM = `You score internship candidates against role requirements.
Return valid JSON only. Do not use markdown, code fences, or any commentary.
Weigh required skills heavily; preferred skills moderately. Factor in degree, projects, experience, CGPA, and screening answers.`;

export const CANDIDATE_SCORE_SCHEMA = `{
  "match_score": 0,
  "strengths": [],
  "weaknesses": [],
  "missing_skills": [],
  "recommendation": "Interview",
  "reasoning": ""
}`;

export function buildScorePrompt(input: CandidateScoreInput): string {
  const required = input.requirements
    .filter((r) => r.type === "required")
    .map((r) => r.requirement);
  const preferred = input.requirements
    .filter((r) => r.type === "preferred")
    .map((r) => r.requirement);

  const degree = input.parsedResume.education.join("; ") || "Not listed";
  const cgpa = input.parsedResume.cgpa || "Not listed";

  return `Score this candidate for the internship "${input.internship.title}".

Internship description: ${input.internship.description ?? "N/A"}

Required skills/requirements (high weight):
${JSON.stringify(required)}

Preferred skills/requirements (moderate weight):
${JSON.stringify(preferred)}

Parsed resume JSON:
${JSON.stringify(input.parsedResume)}

Degree / education: ${degree}
CGPA: ${cgpa}
Projects: ${JSON.stringify(input.parsedResume.projects)}
Experience: ${JSON.stringify(input.parsedResume.experience)}

Screening Q&A:
${
  input.screeningAnswers.length > 0
    ? input.screeningAnswers
        .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
        .join("\n\n")
    : "None provided."
}

Return JSON matching this exact schema:
${CANDIDATE_SCORE_SCHEMA}

Scoring rules:
- match_score: integer 0–100 reflecting overall fit
- strengths: where the candidate clearly meets or exceeds requirements
- weaknesses: gaps, thin experience, or weak evidence
- missing_skills: required/preferred items not evidenced in the resume or answers
- recommendation: exactly one of Hire, Interview, Maybe, Reject
- reasoning: one paragraph for recruiters explaining the score

Consider: required skills, preferred skills, degree, projects, experience, CGPA, and screening answers.`;
}

/** Strips optional markdown fences and parses JSON from model output. */
export function parseJsonFromModelText<T>(text: string): T {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const payload = fenceMatch ? fenceMatch[1].trim() : trimmed;
  return JSON.parse(payload) as T;
}

/** Normalizes partial model output to the Step 2 ParsedResume shape. */
export function normalizeParsedResume(raw: Partial<ParsedResume>): ParsedResume {
  return {
    candidate_name: String(raw.candidate_name ?? ""),
    email: String(raw.email ?? ""),
    phone: String(raw.phone ?? ""),
    education: Array.isArray(raw.education) ? raw.education.map(String) : [],
    experience: Array.isArray(raw.experience) ? raw.experience.map(String) : [],
    projects: Array.isArray(raw.projects) ? raw.projects.map(String) : [],
    skills: Array.isArray(raw.skills) ? raw.skills.map(String) : [],
    certifications: Array.isArray(raw.certifications)
      ? raw.certifications.map(String)
      : [],
    cgpa: String(raw.cgpa ?? ""),
    summary: String(raw.summary ?? ""),
  };
}
