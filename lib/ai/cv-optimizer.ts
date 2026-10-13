import "server-only";

import { generateJson } from "@/lib/ai/provider-manager";
import { parseJsonFromModelText } from "@/lib/ai/prompts";
import { AiError } from "@/lib/ai/errors";
import type {
  ParsedResume,
  CvOptimizationAnalysis,
  CvOptimizationSuggestion,
  CvStrengthEvidence,
  CvMissingEvidence,
  CvKeywordAnalysis,
} from "@/lib/types";

export interface OptimizeCvInput {
  parsed: ParsedResume;
  cvText?: string;
  targetRoleTitle: string;
  targetRoleDescription?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
}

const CV_OPTIMIZATION_SYSTEM = `You are a world-class technical executive recruiter, resume strategist, and career coach.
You specialize in tailoring candidate resumes for specific target internship or junior roles.
CRITICAL RULES:
1. Return VALID JSON ONLY. Do not output markdown fences, code blocks, or explanations outside the JSON.
2. DO NOT INVENT fake degrees, unheld jobs, untrue qualifications, or fabricated achievements.
3. Every suggestion to rewrite an experience bullet or project description must build upon the candidate's actual work, using strong action verbs (Google XYZ formula: Accomplished [X], as measured by [Y], by doing [Z]).
4. Provide structured suggestions with unique IDs that the user can accept, reject, or edit.
5. Identify keywords from the target role that the candidate either has or is missing.`;

const CV_OPTIMIZATION_SCHEMA = `{
  "match_score": 75,
  "summary": "Overall assessment of how well this CV fits the target role and key recommendations.",
  "strengths": [
    {
      "title": "Strong Core Backend Fundamentals",
      "evidence": "Candidate has built multiple Node.js/Express APIs with PostgreSQL as demonstrated in project TaskTracker."
    }
  ],
  "missing_evidence": [
    {
      "requirement": "Docker & Containerization experience",
      "gapDescription": "The job explicitly requires Docker container deployment, which is not mentioned in your projects.",
      "advice": "If you have used Docker for local development or CI, add a bullet point detailing how you containerized your project."
    }
  ],
  "keyword_analysis": {
    "matchedKeywords": ["TypeScript", "REST API", "Git", "SQL"],
    "missingKeywords": ["Docker", "GraphQL", "Jest", "Microservices"]
  },
  "suggestions": [
    {
      "id": "sug-1",
      "section": "experience",
      "category": "achievement",
      "originalText": "Worked on the backend API and fixed bugs.",
      "suggestedText": "Architected and deployed 12+ RESTful endpoints in Node.js, reducing server response time by 25% and resolving critical bugs.",
      "explanation": "Replaces generic passive phrasing with quantifiable impact and relevant technical keywords.",
      "impact": "high"
    }
  ]
}`;

export function buildCvOptimizationPrompt(input: OptimizeCvInput): string {
  const {
    parsed,
    cvText,
    targetRoleTitle,
    targetRoleDescription,
    requiredSkills = [],
    preferredSkills = [],
  } = input;

  return `Tailor and optimize this candidate's CV specifically for the target role: "${targetRoleTitle}".

TARGET ROLE SPECIFICATION:
Title: ${targetRoleTitle}
Description: ${targetRoleDescription || "No detailed description provided; assess for standard industry expectations for this title."}
Required Skills: ${requiredSkills.length > 0 ? requiredSkills.join(", ") : "Standard industry competencies for this role"}
Preferred Skills: ${preferredSkills.length > 0 ? preferredSkills.join(", ") : "Modern technical practices"}

CANDIDATE'S CURRENT CV CONTENT:
${JSON.stringify({
  candidate_name: parsed.candidate_name,
  summary: parsed.summary,
  education: parsed.education,
  experience: parsed.experience,
  projects: parsed.projects,
  skills: parsed.skills,
  certifications: parsed.certifications,
})}

${cvText ? `RAW CV EXCERPT:\n${cvText.slice(0, 3000)}` : ""}

YOUR TASK:
1. Calculate a realistic "match_score" (0-100) reflecting how well their evidence matches the target role.
2. Provide a 2-3 sentence executive "summary" of alignment and high-leverage tailoring tips.
3. Identify 2-4 "strengths" where their existing experience directly provides evidence for this role.
4. Identify 2-4 "missing_evidence" areas where key role expectations are missing or weakly demonstrated, with practical advice on how to address them honestly.
5. Provide "keyword_analysis" with:
   - "matchedKeywords": industry keywords found in both the role and the candidate's CV.
   - "missingKeywords": important skills/tools mentioned in the role that are absent in the CV.
6. Provide 4-8 concrete "suggestions" to optimize specific sentences, bullet points, summary statements, or skill groupings.
   - Every suggestion MUST have:
     - "id": a unique string (e.g. "sug-1", "sug-2")
     - "section": one of "summary", "experience", "projects", "skills", "education"
     - "category": one of "wording", "achievement", "keyword", "clarity", "formatting"
     - "originalText": the exact or approximate sentence/bullet from the CV
     - "suggestedText": the optimized, punchy, impact-focused replacement
     - "explanation": why this change helps with recruiters for this role
     - "impact": "high", "medium", or "low"

CRITICAL: DO NOT invent fake employment or unsupported claims. Enhance existing truth with stronger framing, metrics, and technical precision.

Return JSON strictly matching this schema:
${CV_OPTIMIZATION_SCHEMA}`;
}

export async function optimizeCvForRole(
  input: OptimizeCvInput
): Promise<CvOptimizationAnalysis> {
  const prompt = buildCvOptimizationPrompt(input);
  const rawText = await generateJson(prompt, {
    systemInstruction: CV_OPTIMIZATION_SYSTEM,
  });

  let parsedOut: any;
  try {
    parsedOut = parseJsonFromModelText<any>(rawText);
  } catch {
    throw new AiError(
      "JSON_PARSE",
      `optimizeCvForRole JSON parse failed: ${rawText.slice(0, 200)}`
    );
  }

  const match_score = Math.min(
    100,
    Math.max(15, Math.round(Number(parsedOut.match_score) || 60))
  );

  const strengths: CvStrengthEvidence[] = Array.isArray(parsedOut.strengths)
    ? parsedOut.strengths.map((s: any) => ({
        title: String(s.title || "Demonstrated Capability"),
        evidence: String(s.evidence || s),
      }))
    : [];

  const missing_evidence: CvMissingEvidence[] = Array.isArray(
    parsedOut.missing_evidence
  )
    ? parsedOut.missing_evidence.map((m: any) => ({
        requirement: String(m.requirement || "Role Requirement"),
        gapDescription: String(m.gapDescription || m.gap || "Not explicitly demonstrated in current CV."),
        advice: String(m.advice || "Highlight relevant coursework or personal projects in this area."),
      }))
    : [];

  const matchedKeywords = Array.isArray(parsedOut.keyword_analysis?.matchedKeywords)
    ? parsedOut.keyword_analysis.matchedKeywords.map(String)
    : [];
  const missingKeywords = Array.isArray(parsedOut.keyword_analysis?.missingKeywords)
    ? parsedOut.keyword_analysis.missingKeywords.map(String)
    : [];

  const suggestions: CvOptimizationSuggestion[] = Array.isArray(
    parsedOut.suggestions
  )
    ? parsedOut.suggestions.map((s: any, idx: number) => ({
        id: String(s.id || `sug-${idx + 1}`),
        section: ["summary", "experience", "projects", "skills", "education"].includes(
          s.section
        )
          ? s.section
          : "experience",
        category: [
          "wording",
          "achievement",
          "keyword",
          "clarity",
          "formatting",
        ].includes(s.category)
          ? s.category
          : "achievement",
        originalText: String(s.originalText || ""),
        suggestedText: String(s.suggestedText || ""),
        explanation: String(s.explanation || "Improves clarity and recruiter impact."),
        impact: ["high", "medium", "low"].includes(s.impact) ? s.impact : "medium",
        status: "pending",
        userEdit: null,
      }))
    : [];

  return {
    target_role_title: input.targetRoleTitle,
    target_role_description: input.targetRoleDescription,
    version: 1,
    match_score,
    summary: String(
      parsedOut.summary ||
        `CV optimization analysis tailored for ${input.targetRoleTitle}.`
    ),
    strengths,
    missing_evidence,
    keyword_analysis: {
      matchedKeywords,
      missingKeywords,
    },
    suggestions,
    optimized_content: {
      summary: parsedOut.summary,
      skills: input.parsed.skills,
      experience: input.parsed.experience,
      projects: input.parsed.projects,
      education: input.parsed.education,
    },
    model_version: "gemini-1.5-flash",
  };
}

/**
 * Deterministic heuristic CV optimizer used as a fallback if AI APIs are unavailable.
 * Ensures the candidate always receives high-value, actionable advice.
 */
export function buildHeuristicCvOptimization(
  input: OptimizeCvInput
): CvOptimizationAnalysis {
  const {
    parsed,
    targetRoleTitle,
    targetRoleDescription = "",
    requiredSkills = [],
    preferredSkills = [],
  } = input;

  const candidateSkills = (parsed.skills || []).map((s) => s.toLowerCase());
  const allTargetSkills = [
    ...requiredSkills,
    ...preferredSkills,
    ...extractKeywordsFromText(targetRoleTitle + " " + targetRoleDescription),
  ];

  const uniqueTargetSkills = Array.from(new Set(allTargetSkills.map((s) => s.trim()))).filter(
    (s) => s.length > 1
  );

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];

  uniqueTargetSkills.forEach((skill) => {
    const sLower = skill.toLowerCase();
    const isMatched = candidateSkills.some(
      (c) => c.includes(sLower) || sLower.includes(c)
    );
    if (isMatched) {
      if (!matchedKeywords.includes(skill)) matchedKeywords.push(skill);
    } else {
      if (!missingKeywords.includes(skill)) missingKeywords.push(skill);
    }
  });

  // Calculate score
  let score = 50;
  if (matchedKeywords.length > 0) {
    score += Math.min(35, matchedKeywords.length * 8);
  }
  if (parsed.experience && parsed.experience.length > 0) score += 10;
  if (parsed.projects && parsed.projects.length >= 2) score += 10;
  score = Math.min(94, Math.max(35, score));

  const strengths: CvStrengthEvidence[] = [];
  if (matchedKeywords.length > 0) {
    strengths.push({
      title: "Core Skill Alignment",
      evidence: `Your profile demonstrates existing proficiency in key required skills: ${matchedKeywords
        .slice(0, 4)
        .join(", ")}.`,
    });
  }
  if (parsed.projects && parsed.projects.length > 0) {
    strengths.push({
      title: "Hands-on Project Portfolio",
      evidence: `You have documented ${parsed.projects.length} practical project${
        parsed.projects.length === 1 ? "" : "s"
      } showcasing technical implementation.`,
    });
  }
  if (parsed.education && parsed.education.length > 0) {
    strengths.push({
      title: "Relevant Academic Background",
      evidence: parsed.education[0],
    });
  }

  const missing_evidence: CvMissingEvidence[] = [];
  if (missingKeywords.length > 0) {
    missing_evidence.push({
      requirement: `Target Skill Gaps (${missingKeywords.slice(0, 3).join(", ")})`,
      gapDescription: `The role explicitly values ${missingKeywords
        .slice(0, 3)
        .join(", ")}, which are not clearly evidenced on your resume.`,
      advice: `If you have worked with these technologies in coursework or side projects, explicitly add them with concrete examples.`,
    });
  }
  if (!parsed.summary || parsed.summary.trim().length < 30) {
    missing_evidence.push({
      requirement: "Targeted Professional Summary",
      gapDescription: "Missing a tailored headline connecting your background to the target role.",
      advice: `Add a 2-sentence summary at the top positioning yourself as a motivated candidate for ${targetRoleTitle}.`,
    });
  }

  const suggestions: CvOptimizationSuggestion[] = [];

  // Summary suggestion
  suggestions.push({
    id: "sug-summary",
    section: "summary",
    category: "wording",
    originalText: parsed.summary || "No professional summary currently present.",
    suggestedText: `Motivated software engineer with foundational expertise in ${
      matchedKeywords.slice(0, 3).join(", ") || "modern software development"
    }, seeking the ${targetRoleTitle} position to apply strong problem-solving skills and deliver scalable solutions.`,
    explanation: `Aligns your opening statement directly with the "${targetRoleTitle}" job title and highlights your top matching skills.`,
    impact: "high",
    status: "pending",
    userEdit: null,
  });

  // Experience / Projects bullet suggestions
  if (parsed.experience && parsed.experience.length > 0) {
    const firstExp = parsed.experience[0];
    suggestions.push({
      id: "sug-exp-1",
      section: "experience",
      category: "achievement",
      originalText: firstExp,
      suggestedText: `Spearheaded key initiatives during tenure, collaborating with team members to engineer reliable solutions and improve system workflows using ${
        matchedKeywords[0] || "industry standard tools"
      }.`,
      explanation:
        "Transforms passive responsibility description into active achievement language with quantifiable scope.",
      impact: "high",
      status: "pending",
      userEdit: null,
    });
  }

  if (parsed.projects && parsed.projects.length > 0) {
    const firstProj = parsed.projects[0];
    suggestions.push({
      id: "sug-proj-1",
      section: "projects",
      category: "achievement",
      originalText: firstProj,
      suggestedText: `Engineered ${firstProj.split(/[-–:]/)[0] || "full-stack application"} implementing modular architecture, robust error handling, and responsive user flows; enhanced deployment efficiency by 20%.`,
      explanation:
        "Applies the Google XYZ achievement formula (Accomplished X, measured by Y, by doing Z) to highlight technical depth.",
      impact: "high",
      status: "pending",
      userEdit: null,
    });
  }

  // Skills section suggestion
  if (missingKeywords.length > 0) {
    suggestions.push({
      id: "sug-skills-1",
      section: "skills",
      category: "keyword",
      originalText: (parsed.skills || []).slice(0, 6).join(", "),
      suggestedText: `${(parsed.skills || []).slice(0, 8).join(", ")}, ${missingKeywords
        .slice(0, 2)
        .join(", ")} (familiar)`,
      explanation: `Adds priority keywords (${missingKeywords
        .slice(0, 2)
        .join(", ")}) that recruiters and ATS scanners look for in candidate screening.`,
      impact: "medium",
      status: "pending",
      userEdit: null,
    });
  }

  return {
    target_role_title: targetRoleTitle,
    target_role_description: targetRoleDescription,
    version: 1,
    match_score: score,
    summary: `Heuristic tailoring review for "${targetRoleTitle}". Your CV shares ${matchedKeywords.length} key competencies with this role. Incorporating the suggestions below will significantly improve your recruiter impact.`,
    strengths,
    missing_evidence,
    keyword_analysis: {
      matchedKeywords,
      missingKeywords,
    },
    suggestions,
    optimized_content: {
      summary: parsed.summary,
      skills: parsed.skills,
      experience: parsed.experience,
      projects: parsed.projects,
      education: parsed.education,
    },
    model_version: "heuristic-v1",
  };
}

function extractKeywordsFromText(text: string): string[] {
  const commonTechWords = [
    "React",
    "Next.js",
    "Node.js",
    "TypeScript",
    "JavaScript",
    "Python",
    "Java",
    "C++",
    "SQL",
    "PostgreSQL",
    "MongoDB",
    "Docker",
    "AWS",
    "Git",
    "REST API",
    "GraphQL",
    "Tailwind",
    "CSS",
    "HTML",
    "Linux",
    "Figma",
    "Agile",
    "Machine Learning",
    "AI",
    "NLP",
    "PyTorch",
    "TensorFlow",
    "Data Analysis",
    "Testing",
    "Jest",
    "Redux",
    "Express",
    "Flask",
    "Django",
    "FastAPI",
    "CI/CD",
  ];

  const matched: string[] = [];
  const textLower = text.toLowerCase();
  for (const word of commonTechWords) {
    if (textLower.includes(word.toLowerCase())) {
      matched.push(word);
    }
  }
  return matched;
}
