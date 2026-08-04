import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { downloadCvBuffer } from "@/lib/queries/storage";
import { extractTextFromPdf } from "@/lib/ai/pdf";
import { parseResumeText } from "@/lib/ai/resume-parser";
import {
  analyzeResumeFeedback,
  buildHeuristicResumeFeedback,
} from "@/lib/ai/resume-feedback";
import { runAiOperation } from "@/lib/ai/service";
import { rateLimitOrNull } from "@/lib/api/rate-limit";

/**
 * POST /api/ai/resume-analysis
 *
 * Analyzes the applicant's OWN uploaded resume and returns constructive
 * feedback (score, strengths, improvements, missing elements, skills).
 * Requires a signed-in applicant with a cv_path on their profile.
 */
export async function POST(req: NextRequest) {
  const limited = rateLimitOrNull(req);
  if (limited) return limited;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Please sign in to analyze your resume." },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("applicant_profiles")
    .select("cv_path")
    .eq("id", user.id)
    .single();

  if (!profile?.cv_path) {
    return NextResponse.json(
      { success: false, error: "Upload a resume first, then analyze it." },
      { status: 400 }
    );
  }

  // Parse the PDF first (independent of any AI provider).
  const parseResult = await runAiOperation("applicantResumeParse", async () => {
    const pdfBuffer = await downloadCvBuffer(supabase, profile.cv_path as string);
    const resumeText = await extractTextFromPdf(pdfBuffer);
    const parsed = await parseResumeText(resumeText);
    return { parsed, resumeText };
  });

  if (!parseResult.success) {
    const msg = parseResult.message || "";
    // If the CV couldn't be read from storage, the most likely cause is the
    // storage bucket/policies missing (migration not applied yet). Give a
    // clear, actionable hint instead of a generic failure.
    const looksLikeStorage =
      /bucket|not found|denied|permission|could not find/i.test(msg);
    return NextResponse.json(
      {
        success: false,
        error: looksLikeStorage
          ? "Could not read your resume from storage. Run the latest database migration (creates the cv-files bucket + policies), then re-upload your resume and try again."
          : msg,
        errorType: parseResult.errorType,
      },
      { status: 502 }
    );
  }

  const { parsed } = parseResult.data;

  // Try the AI provider first; if it fails (no API key configured, rate
  // limited, etc.) fall back to a deterministic heuristic review so the
  // button ALWAYS returns useful feedback.
  const aiResult = await runAiOperation("applicantResumeAnalysis", async () => {
    return analyzeResumeFeedback(parsed);
  });

  if (aiResult.success) {
    return NextResponse.json({ success: true, ...aiResult.data, parsed, heuristic: false });
  }

  const fallback = buildHeuristicResumeFeedback(parsed);
  return NextResponse.json({ success: true, ...fallback, parsed, heuristic: true });
}
