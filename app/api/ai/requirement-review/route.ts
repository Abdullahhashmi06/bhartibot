import { NextRequest, NextResponse } from "next/server";
import { reviewRequirements } from "@/lib/ai/assistant";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await reviewRequirements(body);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
