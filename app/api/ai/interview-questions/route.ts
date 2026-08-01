import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getInternshipRequirements } from "@/lib/queries/internships";
import { getApplicationById, getApplicationAnswers } from "@/lib/queries/applications";
import { getCandidateAiAnalysis, getInterviewQuestions, saveInterviewQuestions } from "@/lib/queries/ai-analysis";
import { generateInterviewQuestions } from "@/lib/ai/interview";
import type { CandidateScoreInput, InterviewQuestion } from "@/lib/types";

/**
 * POST /api/ai/interview-questions
 *
 * Generates or retrieves cached interview questions for an application.
 *
 * Caching flow:
 * 1. If questions exist in DB and force !== true → return cached (no AI call)
 * 2. If no cached questions or force === true → generate via AI, save, return
 */
export async function POST(req: NextRequest) {
  try {
    const { applicationId, internshipId, force } = await req.json();
    if (!applicationId || !internshipId) {
      return NextResponse.json(
        { error: "applicationId and internshipId are required." },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // ── Step 1: Check cache (skip if force=true) ──────────────────────
    if (!force) {
      const cached = await getInterviewQuestions(supabase, applicationId);
      if (cached) {
        return NextResponse.json(cached);
      }
    }

    // ── Step 2: Fetch application data for AI generation ───────────────
    const [application, requirements] = await Promise.all([
      getApplicationById(supabase, applicationId),
      getInternshipRequirements(supabase, internshipId),
    ]);

    if (!application) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    const answers = await getApplicationAnswers(supabase, applicationId);

    const analysis = await getCandidateAiAnalysis(supabase, applicationId);
    if (!analysis?.parsed_resume) {
      return NextResponse.json(
        { error: "No AI analysis found. Run analysis first." },
        { status: 400 }
      );
    }

    // Fetch the internship for details
    const { data: internship } = await supabase
      .from("internships")
      .select("*")
      .eq("id", internshipId)
      .single();

    if (!internship) {
      return NextResponse.json({ error: "Internship not found." }, { status: 404 });
    }

    // ── Step 3: Generate via AI ────────────────────────────────────────
    const input: CandidateScoreInput = {
      parsedResume: analysis.parsed_resume,
      internship: internship as any,
      requirements,
      screeningAnswers: answers.map((a) => ({
        question: a.question,
        answer: a.answer,
      })),
    };

    const questions = await generateInterviewQuestions(input);

    // ── Step 4: Persist to database ────────────────────────────────────
    await saveInterviewQuestions(supabase, applicationId, questions);

    return NextResponse.json(questions);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * PUT /api/ai/interview-questions
 *
 * Saves recruiter-edited interview questions without calling the AI provider.
 * Overwrites the stored questions with the provided array.
 */
export async function PUT(req: NextRequest) {
  try {
    const { applicationId, questions } = await req.json();
    if (!applicationId || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: "applicationId and questions array are required." },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const saved = await saveInterviewQuestions(
      supabase,
      applicationId,
      questions as InterviewQuestion[]
    );

    if (!saved) {
      return NextResponse.json(
        { error: "Failed to save interview questions." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, questions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
