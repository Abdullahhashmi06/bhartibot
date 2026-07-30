import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getInternshipRequirements } from "@/lib/queries/internships";
import { getApplicationById, getApplicationAnswers } from "@/lib/queries/applications";
import { getCandidateAiAnalysis } from "@/lib/queries/ai-analysis";
import { generateInterviewQuestions } from "@/lib/ai/interview";
import type { CandidateScoreInput } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const { applicationId, internshipId } = await req.json();
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
    return NextResponse.json(questions);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
