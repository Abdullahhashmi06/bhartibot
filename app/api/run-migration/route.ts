import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

/**
 * One-time migration endpoint that applies ALL InternIQ database fixes.
 *
 * Call it once while signed in: GET /api/run-migration
 *
 * It reads supabase/migrations/20260801_apply_all_fixes.sql and executes each
 * chunk through the exec_sql RPC. Requires an `exec_sql` function in Supabase
 * (the migration file itself creates it; you can also paste the file into the
 * Supabase SQL Editor once to bootstrap it).
 */
export async function GET() {
  const supabase = createClient();
  const results: string[] = [];

  // Read the consolidated migration file
  let fullSql = "";
  try {
    const filePath = path.join(
      process.cwd(),
      "supabase",
      "migrations",
      "20260801_apply_all_fixes.sql"
    );
    fullSql = readFileSync(filePath, "utf8");
  } catch (e) {
    return NextResponse.json({
      results: ["Could not read migration file on server."],
    });
  }

  // Split into chunks on separator lines (keeps DO $$ blocks whole).
  // Separator lines look like "-- ---..." (two dashes, a space, then dashes).
  const chunks = fullSql
    .split(/\n-- -{3,}\n/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  for (let i = 0; i < chunks.length; i++) {
    const preview = chunks[i].split("\n")[0] || `chunk ${i + 1}`;
    try {
      const { error } = await supabase.rpc("exec_sql", {
        sql: chunks[i],
      });
      results.push(error ? `[${i + 1}] ${preview}: ERROR — ${error.message}` : `[${i + 1}] ${preview}: OK`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push(`[${i + 1}] ${preview}: EXCEPTION — ${msg}`);
    }
  }

  return NextResponse.json({ results });
}
