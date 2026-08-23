import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getApplicantRecommendations } from "@/lib/ai/recommendations";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { recommendations, savedJobIds, appliedJobIds } =
    await getApplicantRecommendations(supabase, user.id, user.email || "");

  return NextResponse.json({ recommendations, savedJobIds, appliedJobIds });
}
