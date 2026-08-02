import { NextRequest, NextResponse } from "next/server";
import { generateRecruiterTips } from "@/lib/ai/assistant";
import { requireUser } from "@/lib/api/require-user";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
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
