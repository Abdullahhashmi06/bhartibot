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
  "match_score": 84,

  "confidence_score": 95,

  "resume_quality_score": 91,

  "technical_score": 87,

  "education_score": 92,

  "experience_score": 58,

  "communication_score": 81,

  "culture_fit_score": 76,

  "candidate_summary": "Short paragraph about the candidate.",

  "strengths_summary": "Brief summary of strengths.",

  "risks_summary": "Brief summary of risks.",

  "strength_summary": "Concise strength paragraph for display.",

  "risk_summary": "Concise risk paragraph for display.",

  "overall_explanation": "Senior recruiter explanation of overall assessment.",

  "technical_reason": "Why this technical score was assigned.",

  "education_reason": "Why this education score was assigned.",

  "experience_reason": "Why this experience score was assigned.",

  "communication_reason": "Why this communication score was assigned.",

  "culture_reason": "Why this culture fit score was assigned.",

  "strengths": [],

  "weaknesses": [],

  "missing_skills": [],

  "recommendation": "Interview",

  "reasoning": "Detailed explanation..."
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

Consider: required skills, preferred skills, degree, projects, experience, CGPA, and screening answers.


Also evaluate:

- Confidence score (0-100)
- Resume quality (0-100)
- Technical skills (0-100)
- Education (0-100)
- Experience (0-100)
- Communication (0-100)
- Culture fit (0-100)

Generate:

- candidate_summary (80–150 words, professional recruiter tone)
- strengths_summary
- risks_summary
- strength_summary (1 paragraph, concise)
- risk_summary (1 paragraph, concise)
- overall_explanation (detailed recruiter explanation)
- technical_reason (why technical score was assigned, referencing resume/projects/skills)
- education_reason (why education score was assigned)
- experience_reason (why experience score was assigned)
- communication_reason (why communication score was assigned)
- culture_reason (why culture fit score was assigned)

Scoring explanations should sound like a senior recruiter. Reference resume, projects, education, skills, missing skills, screening answers, and requirements.

Return ONLY valid JSON.

`;

}

export const INTERVIEW_SYSTEM = `
You are a senior technical recruiter at a top technology company.

Generate high-quality interview questions tailored specifically to the candidate.

Questions should evaluate:

• technical ability
• projects
• communication
• problem solving
• behavioral traits

Each question must include:

- question
- purpose
- difficulty
- category

Return ONLY valid JSON.

Do not explain anything.

Do not use markdown.
`;

export const INTERVIEW_SCHEMA = `[
  {
    "question":"Explain how your final year project works.",
    "purpose":"Evaluate project understanding",
    "difficulty":"Medium",
    "category":"Projects"
  }
]`;

export function buildInterviewPrompt(
  input: CandidateScoreInput
): string {const required = input.requirements
  .filter(r => r.type === "required")
  .map(r => r.requirement);

const preferred = input.requirements
  .filter(r => r.type === "preferred")
  .map(r => r.requirement);

return `
Internship

${JSON.stringify(input.internship,null,2)}

Candidate Resume

${JSON.stringify(input.parsedResume,null,2)}

Screening Answers

${JSON.stringify(input.screeningAnswers,null,2)}

Required Skills

${required.join(", ")}

Preferred Skills

${preferred.join(", ")}

Generate 10 interview questions.

Rules:

- Questions must be personalized.
- Focus on missing skills.
- Ask deeper questions about projects.
- If experience is low, ask knowledge questions instead.
- Mix behavioral and technical questions.
- Return JSON matching:

${INTERVIEW_SCHEMA}
`;
}


/** Candidate Summary — standalone recruiter-friendly candidate summary. */
export const CANDIDATE_SUMMARY_SYSTEM = `You write concise, professional recruiter summaries for internship candidates.
Return valid JSON only. Do not use markdown, code fences, or any commentary.
Summaries should sound like a senior technical recruiter.`;

export const CANDIDATE_SUMMARY_SCHEMA = `{
  "candidate_summary": "Abdullah demonstrates strong technical foundations in Machine Learning and Python through multiple academic projects. While professional experience is limited, the candidate possesses relevant coursework and problem-solving ability. Overall, the profile indicates strong potential for an entry-level ML internship."
}`;

export function buildCandidateSummaryPrompt(
  input: CandidateScoreInput
): string {
  const required = input.requirements
    .filter((r) => r.type === "required")
    .map((r) => r.requirement);
  const preferred = input.requirements
    .filter((r) => r.type === "preferred")
    .map((r) => r.requirement);

  return `Write a recruiter-friendly candidate summary.

Internship: ${input.internship.title}
Description: ${input.internship.description ?? "N/A"}

Required skills:
${required.join(", ")}

Preferred skills:
${preferred.join(", ")}

Parsed resume:
${JSON.stringify(input.parsedResume)}

Screening answers:
${
  input.screeningAnswers.length > 0
    ? input.screeningAnswers
        .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
        .join("\n\n")
    : "None provided."
}

Rules:
- 80-150 words.
- Professional tone.
- Recruiter friendly.
- Mention strongest qualifications.
- Mention largest gaps.
- Mention overall hiring recommendation.

Return JSON matching:
${CANDIDATE_SUMMARY_SCHEMA}`;
}


/** Strength Summary — concise strength paragraph for recruiter display cards. */
export const STRENGTH_SUMMARY_SYSTEM = `You write concise strength summaries for internship candidates.
Return valid JSON only. Do not use markdown, code fences, or any commentary.
Focus on the candidate's strongest qualifications and attributes matching the role.`;

export const STRENGTH_SUMMARY_SCHEMA = `{
  "strength_summary": "The candidate possesses strong analytical skills, relevant AI coursework, and demonstrates initiative through independent ML projects."
}`;

export function buildStrengthSummaryPrompt(
  input: CandidateScoreInput
): string {
  const required = input.requirements
    .filter((r) => r.type === "required")
    .map((r) => r.requirement);
  const preferred = input.requirements
    .filter((r) => r.type === "preferred")
    .map((r) => r.requirement);

  return `Write a one-paragraph strength summary for this candidate.

Internship: ${input.internship.title}
Description: ${input.internship.description ?? "N/A"}

Required skills:
${required.join(", ")}

Preferred skills:
${preferred.join(", ")}

Parsed resume:
${JSON.stringify(input.parsedResume)}

Screening answers:
${
  input.screeningAnswers.length > 0
    ? input.screeningAnswers
        .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
        .join("\n\n")
    : "None provided."
}

Rules:
- One concise paragraph.
- Mention strongest qualifications matching the role.
- Professional, recruiter-friendly tone.

Return JSON matching:
${STRENGTH_SUMMARY_SCHEMA}`;
}


/** Risk Summary — concise risk paragraph for recruiter display cards. */
export const RISK_SUMMARY_SYSTEM = `You write concise risk summaries for internship candidates.
Return valid JSON only. Do not use markdown, code fences, or any commentary.
Focus on gaps, missing skills, and areas requiring verification.`;

export const RISK_SUMMARY_SCHEMA = `{
  "risk_summary": "The candidate has limited professional experience and lacks exposure to deployment technologies."
}`;

export function buildRiskSummaryPrompt(
  input: CandidateScoreInput
): string {
  const required = input.requirements
    .filter((r) => r.type === "required")
    .map((r) => r.requirement);
  const preferred = input.requirements
    .filter((r) => r.type === "preferred")
    .map((r) => r.requirement);

  return `Write a one-paragraph risk summary for this candidate.

Internship: ${input.internship.title}
Description: ${input.internship.description ?? "N/A"}

Required skills:
${required.join(", ")}

Preferred skills:
${preferred.join(", ")}

Parsed resume:
${JSON.stringify(input.parsedResume)}

Screening answers:
${
  input.screeningAnswers.length > 0
    ? input.screeningAnswers
        .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
        .join("\n\n")
    : "None provided."
}

Rules:
- One concise paragraph.
- Mention largest gaps and missing skills.
- Professional, recruiter-friendly tone.

Return JSON matching:
${RISK_SUMMARY_SCHEMA}`;
}


/** Score Explanation — per-dimension reasoning for each score. */
export const SCORE_EXPLANATION_SYSTEM = `You are a senior technical recruiter explaining why each score was assigned to an internship candidate.
Return valid JSON only. Do not use markdown, code fences, or any commentary.
Each reason should reference specific resume evidence, projects, education, skills, missing skills, screening answers, and requirements.`;

export const SCORE_EXPLANATION_SCHEMA = `{
  "overall_explanation": "Overall assessment explanation referencing resume and requirements.",
  "technical_reason": "Why this technical score was assigned.",
  "education_reason": "Why this education score was assigned.",
  "experience_reason": "Why this experience score was assigned.",
  "communication_reason": "Why this communication score was assigned.",
  "culture_reason": "Why this culture fit score was assigned."
}`;

export function buildScoreExplanationPrompt(
  input: CandidateScoreInput
): string {
  const required = input.requirements
    .filter((r) => r.type === "required")
    .map((r) => r.requirement);
  const preferred = input.requirements
    .filter((r) => r.type === "preferred")
    .map((r) => r.requirement);

  return `Explain why each score dimension was assigned to this candidate.

Internship: ${input.internship.title}
Description: ${input.internship.description ?? "N/A"}

Required skills:
${required.join(", ")}

Preferred skills:
${preferred.join(", ")}

Parsed resume:
${JSON.stringify(input.parsedResume)}

Screening answers:
${
  input.screeningAnswers.length > 0
    ? input.screeningAnswers
        .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
        .join("\n\n")
    : "None provided."
}

For each dimension, provide a 1-3 sentence explanation referencing specific resume evidence, projects, education, skills, missing skills, screening answers, and requirements.
Sound like a senior recruiter.

Return JSON matching:
${SCORE_EXPLANATION_SCHEMA}`;
}


/** Recruiter Notes — internal-use summary for recruiters. */
export const RECRUITER_NOTES_SYSTEM = `You are a senior technical recruiter writing internal notes about an internship candidate.
Return valid JSON only. Do not use markdown, code fences, or any commentary.
Keep notes concise, professional, and focused on actionable hiring insights.`;

export const RECRUITER_NOTES_SCHEMA = `{
  "recruiter_notes": "Recommended for technical interview. Candidate shows strong learning ability but should be assessed on communication and practical software engineering experience."
}`;

export function buildRecruiterNotesPrompt(
  input: CandidateScoreInput
): string {
  const required = input.requirements
    .filter((r) => r.type === "required")
    .map((r) => r.requirement);
  const preferred = input.requirements
    .filter((r) => r.type === "preferred")
    .map((r) => r.requirement);

  return `Write internal recruiter notes for this candidate.

Internship: ${input.internship.title}
Description: ${input.internship.description ?? "N/A"}

Required skills:
${required.join(", ")}

Preferred skills:
${preferred.join(", ")}

Parsed resume:
${JSON.stringify(input.parsedResume)}

Screening answers:
${
  input.screeningAnswers.length > 0
    ? input.screeningAnswers
        .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
        .join("\n\n")
    : "None provided."
}

Rules:
- Maximum 100 words.
- Professional tone.
- Internal use only.
- Mention strongest qualifications.
- Mention largest gaps.
- Include overall hiring recommendation.

Return JSON matching:
${RECRUITER_NOTES_SCHEMA}`;
}




/* ================================================================
 *   AI RECRUITMENT ASSISTANT PROMPTS
 *   Used by the create-edit internship wizard to provide
 *   intelligent suggestions without overwriting recruiter work.
 * ================================================================ */


/** Description Assistant — suggests a better description. */
export const DESCRIPTION_SUGGEST_SYSTEM = `You are a senior recruiter helping improve internship descriptions.
Return valid JSON only. Do not use markdown, code fences, or any commentary.
Write clear, professional, recruiter-friendly content that attracts strong candidates.`;

export const DESCRIPTION_SUGGEST_SCHEMA = `{
  "description": "A comprehensive internship description.",
  "responsibilities": [],
  "learning_outcomes": [],
  "objectives": []
}`;

export function buildDescriptionSuggestionPrompt(opts: {
  title: string;
  field: string;
  location: string;
  workMode: string;
  duration: string;
  existingDescription: string;
}): string {
  return `Improve this internship description.

Role: ${opts.title}
Field: ${opts.field}
Location: ${opts.location}
Work Mode: ${opts.workMode}
Duration: ${opts.duration}

Existing description:
"""
${opts.existingDescription || "(not yet written)"}
"""

Generate:
1. A better, more detailed description (2-4 sentences)
2. 3-5 key responsibilities
3. 3-5 learning outcomes
4. 3-4 internship objectives

Return JSON matching:
${DESCRIPTION_SUGGEST_SCHEMA}

Rules:
- Professional tone
- Recruiter-friendly
- Attract top candidates
- Specific to the field and role`;
}


/** Requirement Review — reviews existing requirements and suggests additions. */
export const REQUIREMENT_REVIEW_SYSTEM = `You are a senior technical recruiter reviewing internship requirements.
Return valid JSON only. Do not use markdown, code fences, or any commentary.
Your suggestions must be industry-aware and context-specific.`;

export const REQUIREMENT_REVIEW_SCHEMA = `{
  "suggested_required": ["React", "TypeScript", "Git"],
  "suggested_preferred": ["Docker", "AWS", "CI/CD"],
  "missing_requirements": ["Version Control", "API Knowledge"],
  "explanation": "Brief explanation of suggestions."
}`;

export function buildRequirementReviewPrompt(opts: {
  title: string;
  field: string;
  description: string;
  currentRequired: string[];
  currentPreferred: string[];
}): string {
  return `Review and suggest improvements for these internship requirements.

Role: ${opts.title}
Field: ${opts.field}
Description: ${opts.description}

Current Required Skills:
${opts.currentRequired.join(", ") || "(none)"}

Current Preferred Skills:
${opts.currentPreferred.join(", ") || "(none)"}

For the field "${opts.field}", suggest:
1. Additional required skills that are industry-standard
2. Additional preferred skills that would strengthen the posting
3. Any missing requirements the recruiter should consider
4. A brief explanation of your suggestions

Context-aware guidelines:
- For Computer Science / AI / IT: suggest React, TypeScript, Git, REST APIs, Node.js, Python, SQL
- For Engineering: suggest CAD, MATLAB, SolidWorks, Project Management, Technical Writing
- For Accounting / Finance: suggest Excel, Financial Modeling, Valuation, Accounting, ERP Systems
- For Business / Marketing: suggest SEO, Analytics, Copywriting, Campaign Management, CRM
- For Medicine / Healthcare: suggest Medical Ethics, Patient Privacy, Clinical Documentation, Research Methods
- For Sciences: suggest Lab Techniques, Data Analysis, Research Methodology, Scientific Writing
- For Law: suggest Legal Research, Contract Review, Case Analysis, Regulatory Compliance
- For Design: suggest Figma, Adobe Suite, UX Research, Design Systems, Prototyping
- For Other: suggest Communication, Problem Solving, Adaptability, Time Management

Return JSON matching:
${REQUIREMENT_REVIEW_SCHEMA}`;
}


/** Screening Question Assistant — suggests grouped questions. */
export const SCREENING_QUESTION_ASSIST_SYSTEM = `You are a senior recruiter suggesting screening questions for an internship.
Return valid JSON only. Do not use markdown, code fences, or any commentary.
Questions should be grouped by category and tailored to the specific role.`;

export const SCREENING_QUESTION_ASSIST_SCHEMA = `{
  "technical": ["What programming languages are you most comfortable with?"],
  "behavioral": ["Describe a time you worked on a team project."],
  "problem_solving": ["How would you approach debugging a complex issue?"],
  "communication": ["Explain a technical concept to a non-technical audience."],
  "culture": ["What type of work environment helps you thrive?"]
}`;

export function buildScreeningQuestionSuggestionPrompt(opts: {
  title: string;
  field: string;
  description: string;
  requirements: string[];
  currentQuestions: string[];
}): string {
  return `Suggest screening questions for this internship.

Role: ${opts.title}
Field: ${opts.field}
Description: ${opts.description}

Requirements:
${opts.requirements.join(", ") || "(none)"}

Current questions:
${opts.currentQuestions.join("\n") || "(none)"}

Generate 2-3 questions per category:
- Technical: skills assessment
- Behavioral: past experiences
- Problem Solving: analytical thinking
- Communication: clarity and expression
- Culture: team and values fit

Return JSON matching:
${SCREENING_QUESTION_ASSIST_SCHEMA}`;
}


/** Internship Health — analyzes internship quality and gives a score. */
export const INTERNSHIP_HEALTH_SYSTEM = `You are a senior recruitment analyst evaluating internship posting quality.
Return valid JSON only. Do not use markdown, code fences, or any commentary.
Be honest and constructive in your assessment.`;

export const INTERNSHIP_HEALTH_SCHEMA = `{
  "health_score": 85,
  "strengths": ["Clear title and field", "Good requirement coverage"],
  "weaknesses": ["Description is too short"],
  "recommendations": ["Add expected deliverables", "Mention mentorship opportunities"]
}`;

export function buildInternshipHealthPrompt(opts: {
  title: string;
  field: string;
  description: string;
  location: string;
  workMode: string;
  duration: string;
  requiredCount: number;
  preferredCount: number;
  questionCount: number;
}): string {
  return `Evaluate the quality of this internship posting.

Role: ${opts.title}
Field: ${opts.field}
Location: ${opts.location}
Work Mode: ${opts.workMode}
Duration: ${opts.duration}

Description length: ${opts.description.length} characters
Required skills count: ${opts.requiredCount}
Preferred skills count: ${opts.preferredCount}
Screening questions count: ${opts.questionCount}

Full description:
"""
${opts.description || "(not provided)"}
"""

Score the internship posting quality (0-100) based on:
- Complete information (title, location, duration, work mode)
- Description quality and detail
- Requirement coverage
- Screening question availability

List:
- 3-5 strengths (with emoji prefix ✓)
- 3-5 weaknesses (with emoji prefix ⚠)
- 3-5 actionable recommendations

Return JSON matching:
${INTERNSHIP_HEALTH_SCHEMA}`;
}


/** Recruiter Tips — general tips for the create internship flow. */
export const RECRUITER_TIPS_SYSTEM = `You are a senior recruitment strategist providing concise tips to recruiters creating internship postings.
Return valid JSON only. Do not use markdown, code fences, or any commentary.
Keep tips actionable and backed by recruitment best practices.`;

export const RECRUITER_TIPS_SCHEMA = `{
  "tips": [
    "Candidates with Docker experience usually perform better for this role.",
    "Internships with 5-7 requirements receive more applications."
  ]
}`;

export function buildRecruiterTipsPrompt(opts: {
  title: string;
  field: string;
  requiredCount: number;
  preferredCount: number;
  descriptionLength: number;
}): string {
  return `Provide 3-5 concise, actionable tips for a recruiter creating this internship posting.

Role: ${opts.title}
Field: ${opts.field}
Required skills count: ${opts.requiredCount}
Preferred skills count: ${opts.preferredCount}
Description length: ${opts.descriptionLength} characters

Tips should be:
- Field-specific and relevant
- Based on recruitment best practices
- Actionable and specific
- 1 sentence each
- Professional tone

Return JSON matching:
${RECRUITER_TIPS_SCHEMA}`;
}


/**
 * Applicant-portal recommendation explanations (batched).
 * One AI call produces short "why this match" blurbs for the top internships.
 * Results are cached in applicant_recommendations so the AI is not re-invoked
 * on every page load.
 */
export const RECOMMENDATION_SYSTEM = `You are InternIQ's AI career advisor explaining why internships are recommended to a student.
Return valid JSON only. Do not use markdown, code fences, or any commentary.
Each explanation must be 2–3 sentences, personalized, and reference the student's actual skills, projects, or experience.
Acknowledge ONE missing/preferred skill only when it adds value (e.g. it is compensated by strong experience).
Reference the competition level and the student's estimated chance where relevant.
Never mention that a score, weight, or algorithm produced the suggestion.`;

export const RECOMMENDATION_SCHEMA = `{
  "explanations": [
    {
      "internship_id": "<uuid>",
      "explanation": "This internship is highly recommended because your Python, SQL and Machine Learning projects closely match the employer's requirements. Although Docker is listed as preferred, your strong AI experience compensates for this gap. Competition is currently moderate, improving your estimated interview chances."
    }
  ]
}`;

export interface RecommendationExplanationInput {
  studentName: string;
  degree: string;
  university: string;
  skills: string[];
  projects: string[];
  experience: string[];
  internships: {
    id: string;
    title: string;
    field: string | null;
    company: string;
    description: string | null;
    requiredSkills: string[];
    preferredSkills: string[];
    matchedSkills: string[];
    missingSkills: string[];
    matchScore: number;
    acceptanceProbability: number;
    competitionLabel: string;
    applicantCount: number;
    strengths: string[];
    weaknesses: string[];
  }[];
}

export function buildRecommendationPrompt(
  input: RecommendationExplanationInput
): string {
  return `Write a personalized, 2–3 sentence explanation for why each internship below is recommended to this student.

STUDENT PROFILE
Name: ${input.studentName || "Student"}
Degree: ${input.degree || "Not listed"}
University: ${input.university || "Not listed"}
Skills: ${input.skills.join(", ") || "None listed"}
Projects: ${input.projects.join("; ") || "None listed"}
Experience: ${input.experience.join("; ") || "None listed"}

INTERNSHIPS (id, title, field, company, required, preferred, matched, missing, match, acceptance, competition, applicants, strengths, weaknesses):
${input.internships
  .map(
    (i) =>
      `- ${i.id} | ${i.title} | ${i.field || "general"} | ${i.company} | required: ${i.requiredSkills.join(", ") || "-"} | preferred: ${i.preferredSkills.join(", ") || "-"} | matched: ${i.matchedSkills.join(", ") || "-"} | missing: ${i.missingSkills.join(", ") || "-"} | match: ${i.matchScore}% | acceptance: ${i.acceptanceProbability}% | competition: ${i.competitionLabel} (${i.applicantCount} applicants) | strengths: ${i.strengths.join("; ") || "-"} | weaknesses: ${i.weaknesses.join("; ") || "-"}`
  )
  .join("\n")}

Rules:
- Exactly one explanation per internship, same order, using the exact internship_id.
- 2–3 sentences each, warm and specific, like a career advisor.
- Reference real matched skills/projects; acknowledge ONE missing skill only if it adds value.
- Mention the competition level and estimated chance only when it is genuinely informative.
- Return JSON matching:
${RECOMMENDATION_SCHEMA}`;
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
