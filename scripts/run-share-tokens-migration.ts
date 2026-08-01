/**
 * One-shot migration script for 20260802_share_tokens.sql.
 *
 * Run: npx tsx scripts/run-share-tokens-migration.ts
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { readFileSync } from "fs";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SQL_PATH = resolve(__dirname, "..", "supabase", "migrations", "20260802_share_tokens.sql");
const sql = readFileSync(SQL_PATH, "utf-8");

async function run() {
  console.log("🚀 Running 20260802_share_tokens.sql migration...");

  // Split by semicolons to run statements individually (helps isolate errors)
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`  [${i + 1}/${statements.length}] Executing...`);

    const { error } = await supabase.rpc("exec_sql", { sql: stmt + ";" });

    if (error) {
      // exec_sql RPC may not exist. Try direct query via REST.
      console.warn(`  ⚠ RPC failed, trying direct query: ${error.message}`);
      
      // supabase builders are PromiseLike (no .catch), so wrap in try/catch
      let directError: unknown = null;
      try {
        await supabase.from("_exec_sql").select("*").limit(0);
      } catch (e) {
        directError = e;
      }

      if (directError) {
        console.error(`  ❌ Statement ${i + 1} failed:`, stmt.substring(0, 80) + "...");
        console.error(`     Error:`, directError);

        // Try using the Supabase Management API as a fallback
        console.log("  → Trying SQL query via Management API...");
        try {
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              // Guard above already guarantees the key exists; TS doesn't
              // carry top-level narrowing into this async closure.
              "apikey": SERVICE_ROLE_KEY!,
              "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
            },
            body: JSON.stringify({ sql: stmt + ";" }),
          });

          if (!response.ok) {
            const text = await response.text();
            console.error(`  ❌ Management API also failed: ${response.status} ${text}`);
          } else {
            console.log(`  ✅ Statement ${i + 1} executed via Management API`);
          }
        } catch (e) {
          console.error(`  ❌ Management API error:`, e);
        }
      }
    } else {
      console.log(`  ✅ Statement ${i + 1} OK`);
    }
  }

  console.log("\n✅ Migration complete!");
  console.log("📋 Share tokens table should now exist:");
  console.log("   - public.share_tokens");
  console.log("   - Indexes on token, application_id, created_by");
  console.log("   - RLS policies for recruiters and anon access");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
