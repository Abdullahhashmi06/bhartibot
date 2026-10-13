import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { downloadCvBuffer } from "@/lib/queries/storage";
import { extractTextFromPdf } from "@/lib/ai/pdf";
import { parseResumeText } from "@/lib/ai/resume-parser";
import {
  optimizeCvForRole,
  buildHeuristicCvOptimization,
} from "@/lib/ai/cv-optimizer";
import { runAiOperation } from "@/lib/ai/service";
import { rateLimitOrNull } from "@/lib/api/rate-limit";

/**
 * POST /api/ai/cv-optimization
 *
 * Runs role-specific CV optimization:
 * - Compares candidate's CV against target role requirements.
 * - Extracts strengths, gaps, missing keywords, and actionable suggestions.
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
      { success: false, error: "Please sign in to optimize your CV." },
      { status: 401 }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const {
    targetJobId,
    targetRoleTitle = "Software Engineering Intern",
    targetRoleDescription = "",
    requiredSkills = [],
    preferredSkills = [],
  } = body;

  // 1. Fetch applicant profile to find CV path
  const { data: profile } = await supabase
    .from("applicant_profiles")
    .select("cv_path")
    .eq("id", user.id)
    .single();

  if (!profile?.cv_path) {
    return NextResponse.json(
      {
        success: false,
        error: "Please upload a resume first on the Resume page before optimizing it for a role.",
      },
      { status: 400 }
    );
  }

  // 2. If targetJobId was provided, fetch the actual job & its requirements
  let finalTargetTitle = targetRoleTitle;
  let finalTargetDesc = targetRoleDescription;
  let finalRequiredSkills: string[] = Array.isArray(requiredSkills) ? requiredSkills : [];
  let finalPreferredSkills: string[] = Array.isArray(preferredSkills) ? preferredSkills : [];

  if (targetJobId) {
    const { data: internship } = await supabase
      .from("internships")
      .select("id, title, description, requirements(requirement, type)")
      .eq("id", targetJobId)
      .single();

    if (internship) {
      finalTargetTitle = internship.title;
      finalTargetDesc = internship.description || finalTargetDesc;
      if (Array.isArray(internship.requirements)) {
        finalRequiredSkills = internship.requirements
          .filter((r: any) => r.type === "required")
          .map((r: any) => r.requirement);
        finalPreferredSkills = internship.requirements
          .filter((r: any) => r.type === "preferred")
          .map((r: any) => r.requirement);
      }
    }
  }

  // 3. Parse candidate CV
  const parseResult = await runAiOperation("applicantResumeParse", async () => {
    const pdfBuffer = await downloadCvBuffer(supabase, profile.cv_path as string);
    const resumeText = await extractTextFromPdf(pdfBuffer);
    const parsed = await parseResumeText(resumeText);
    return { parsed, resumeText };
  });

  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: parseResult.message || "Could not read or parse resume file.",
      },
      { status: 502 }
    );
  }

  const { parsed, resumeText } = parseResult.data;

  // 4. Run Optimization analysis via AI or Heuristic Fallback
  const aiResult = await runAiOperation("cvOptimization", async () => {
    return optimizeCvForRole({
      parsed,
      cvText: resumeText,
      targetRoleTitle: finalTargetTitle,
      targetRoleDescription: finalTargetDesc,
      requiredSkills: finalRequiredSkills,
      preferredSkills: finalPreferredSkills,
    });
  });

  let analysis = aiResult.success
    ? aiResult.data
    : buildHeuristicCvOptimization({
        parsed,
        targetRoleTitle: finalTargetTitle,
        targetRoleDescription: finalTargetDesc,
        requiredSkills: finalRequiredSkills,
        preferredSkills: finalPreferredSkills,
      });

  analysis.original_cv_path = profile.cv_path;
  analysis.target_job_id = targetJobId || null;

  return NextResponse.json({
    success: true,
    data: analysis,
    parsedCv: parsed,
    heuristic: !aiResult.success,
  });
}
