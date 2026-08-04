import { NextRequest, NextResponse } from "next/server";
import { generateRecruiterTips } from "@/lib/ai/assistant";
import { requireRecruiter } from "@/lib/api/require-user";
import { rateLimitOrNull } from "@/lib/api/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimitOrNull(req);
    if (limited) return limited;

    const user = await requireRecruiter();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json();
    const result = await generateRecruiterTips(body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
