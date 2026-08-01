import "server-only";

import { generateJson } from "@/lib/ai/provider-manager";
import { parseJsonFromModelText } from "@/lib/ai/prompts";
import { AiError } from "@/lib/ai/errors";
import type { ParsedResume } from "@/lib/types";

export interface ResumeFeedback {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  missing_elements: string[];
  recommended_skills: string[];
}

const RESUME_FEEDBACK_SYSTEM = `You are a senior career coach and technical recruiter reviewing a candidate's resume.
Return valid JSON only. Do not use markdown, code fences, or any commentary.
Be honest, specific, and constructive. Reference the actual resume content.`;

const RESUME_FEEDBACK_SCHEMA = `{
  "score": 72,
  "summary": "One paragraph assessment of the resume.",
  "strengths": ["Clear project descriptions", "Strong technical stack"],
  "improvements": ["Quantify achievements with numbers", "Add a professional summary at the top"],
  "missing_elements": ["GitHub/LinkedIn links", "Relevant certifications"],
  "recommended_skills": ["Docker", "CI/CD", "TypeScript"]
}`;

export function buildResumeFeedbackPrompt(parsed: ParsedResume): string {
  return `Review this parsed resume and give the candidate constructive feedback.

Parsed resume:
${JSON.stringify(parsed)}

Score the resume quality (0-100) based on:
- Completeness (contact info, education, experience, projects, skills)
- Achievement specificity (quantified impact vs. generic duties)
- Readability and professional presentation
- Marketability of skills for modern tech/internship roles

Then provide:
- summary: one paragraph assessment
- strengths: 3-6 concrete strengths visible in the resume
- improvements: 3-6 actionable improvements to boost the score
- missing_elements: important sections/links that are absent
- recommended_skills: 3-6 in-demand skills worth adding (from a general market perspective)

Rules:
- Be specific and reference the resume content.
- Do not invent information not present in the resume.
- Keep strengths/improvements to short, actionable phrases.

Return JSON matching:
${RESUME_FEEDBACK_SCHEMA}`;
}

export async function analyzeResumeFeedback(
  parsed: ParsedResume
): Promise<ResumeFeedback> {
  const rawText = await generateJson(buildResumeFeedbackPrompt(parsed), {
    systemInstruction: RESUME_FEEDBACK_SYSTEM,
  });

  let parsedOut: Partial<ResumeFeedback>;
  try {
    parsedOut = parseJsonFromModelText<Partial<ResumeFeedback>>(rawText);
  } catch {
    throw new AiError(
      "JSON_PARSE",
      `analyzeResumeFeedback JSON parse failed: ${rawText.slice(0, 200)}`
    );
  }

  return {
    score: Math.min(100, Math.max(0, Math.round(Number(parsedOut.score) || 0))),
    summary: String(parsedOut.summary ?? ""),
    strengths: Array.isArray(parsedOut.strengths)
      ? parsedOut.strengths.map(String)
      : [],
    improvements: Array.isArray(parsedOut.improvements)
      ? parsedOut.improvements.map(String)
      : [],
    missing_elements: Array.isArray(parsedOut.missing_elements)
      ? parsedOut.missing_elements.map(String)
      : [],
    recommended_skills: Array.isArray(parsedOut.recommended_skills)
      ? parsedOut.recommended_skills.map(String)
      : [],
  };
}

/**
 * Deterministic, provider-free resume review. Used as a fallback when no AI
 * provider API key is configured so the "Analyze My Resume" button ALWAYS
 * returns useful feedback instead of failing with 502.
 */
export function buildHeuristicResumeFeedback(parsed: ParsedResume): ResumeFeedback {
  let score = 35;
  const strengths: string[] = [];
  const improvements: string[] = [];
  const missing_elements: string[] = [];
  const recommended_skills: string[] = [
    "GitHub",
    "LinkedIn",
    "Portfolio",
    "Certifications",
    "Quantified achievements",
  ];

  // Contact info
  if (parsed.email) {
    score += 8;
    strengths.push("Email address present");
  } else missing_elements.push("Email address");
  if (parsed.phone) {
    score += 4;
  } else missing_elements.push("Phone number");
  if (parsed.candidate_name && parsed.candidate_name.trim().length > 0) {
    score += 5;
    strengths.push("Candidate name found");
  }

  // Summary
  if (parsed.summary && parsed.summary.trim().length > 20) {
    score += 10;
    strengths.push("Professional summary included");
  } else improvements.push("Add a concise professional summary at the top");

  // Education
  const education = parsed.education || [];
  if (education.length > 0) {
    score += 12;
    strengths.push(`${education.length} education entr${education.length === 1 ? "y" : "ies"} listed`);
  } else missing_elements.push("Education section");

  // Experience
  const experience = parsed.experience || [];
  if (experience.length > 0) {
    score += 14;
    strengths.push(`${experience.length} experience entr${experience.length === 1 ? "y" : "ies"} listed`);
  } else improvements.push("Add relevant work or internship experience");

  // Projects
  const projects = parsed.projects || [];
  if (projects.length > 0) {
    score += 12;
    strengths.push(`${projects.length} project${projects.length === 1 ? "" : "s"} detailed`);
  } else improvements.push("Add a projects section with bullet points");

  // Skills
  const skills = parsed.skills || [];
  if (skills.length >= 6) {
    score += 12;
    strengths.push(`${skills.length} skills listed`);
  } else if (skills.length >= 3) {
    score += 7;
    improvements.push("List more of your technical skills (6+ recommended)");
  } else {
    improvements.push("Add a dedicated skills section");
  }

  // Certifications
  const certs = parsed.certifications || [];
  if (certs.length > 0) {
    score += 6;
    strengths.push(`${certs.length} certification${certs.length === 1 ? "" : "s"} listed`);
  }

  // CGPA
  if (parsed.cgpa && parsed.cgpa.trim().length > 0 && parsed.cgpa !== "N/A") {
    score += 4;
  }

  // Tally missing elements into improvements so the output is always rich
  missing_elements.forEach((m) => {
    if (!improvements.includes(m)) improvements.push(`Include ${m}`);
  });

  const finalScore = Math.min(100, Math.max(10, Math.round(score)));

  return {
    score: finalScore,
    summary:
      finalScore >= 75
        ? "This resume is in strong shape — the key sections are present and well detailed."
        : finalScore >= 55
        ? "This resume has a solid foundation but a few important sections could be strengthened."
        : "This resume needs more structure — several key sections are missing or under-developed.",
    strengths,
    improvements,
    missing_elements,
    recommended_skills,
  };
}
