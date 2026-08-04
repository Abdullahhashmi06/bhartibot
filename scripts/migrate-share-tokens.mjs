/**
 * Self-contained migration script for 20260802_share_tokens.sql.
 * 
 * Usage: node scripts/migrate-share-tokens.mjs
 * 
 * Reads .env.local manually (no dotenv dependency needed).
 * Uses the Supabase Management API (database/query endpoint) with a
 * management key to execute raw SQL. The dev-only exec_sql RPC was removed
 * from the codebase on 2026-08-07 and must never ship.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ── Parse .env.local manually ──────────────────────────────────────────────
function loadEnv(path) {
  const content = readFileSync(path, "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Strip quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const envPath = resolve(ROOT, ".env.local");
let env;
try {
  env = loadEnv(envPath);
  console.log(`📄 Loaded ${Object.keys(env).length} env vars from .env.local`);
} catch (err) {
  console.error("❌ Failed to read .env.local:", err.message);
  process.exit(1);
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
// The Supabase Management API authenticates with a personal access token
// (sbp_...) from https://supabase.com/dashboard/account/tokens. The service
// role key is NOT accepted by api.supabase.com — it will always return 401.
const ACCESS_TOKEN = env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_URL) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local");
  process.exit(1);
}
if (!ACCESS_TOKEN) {
  console.error("❌ SUPABASE_ACCESS_TOKEN (Management API personal access token) not found in .env.local");
  process.exit(1);
}

// ── Read SQL migration ─────────────────────────────────────────────────────
const SQL_PATH = resolve(ROOT, "supabase", "migrations", "20260802_share_tokens.sql");
const sql = readFileSync(SQL_PATH, "utf-8");
console.log(`📋 Read migration (${sql.length} bytes)`);

// ── SQL execution via the Supabase Management API ──────────────────────────

async function execSql(sqlStatement) {
  // The dev-only exec_sql RPC has been removed (2026-08-07) and must never
  // exist in production. Apply raw SQL via the Supabase Management API
  // database/query endpoint (requires a management API key) or, preferably,
  // paste the migration into the Supabase SQL Editor.
  const projectRef = extractProjectRef(SUPABASE_URL);
  if (!projectRef) {
    return { ok: false, error: "Could not extract project ref from SUPABASE_URL." };
  }

  const mgmtResponse = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query: sqlStatement }),
    }
  );

  if (mgmtResponse.ok) {
    return { ok: true, method: "mgmt_api" };
  }

  const mgmtError = await mgmtResponse.text();
  return { ok: false, error: mgmtError.substring(0, 300) };
}

function extractProjectRef(url) {
  // Supabase URLs look like: https://<ref>.supabase.co
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : null;
}

// ── Run migration ──────────────────────────────────────────────────────────
async function run() {
  console.log("\n🚀 Running 20260802_share_tokens.sql migration...\n");

  // Split into individual statements
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 100).replace(/\n/g, " ");
    process.stdout.write(`  [${i + 1}/${statements.length}] ${preview}... `);

    const result = await execSql(stmt + ";");

    if (result.ok) {
      console.log(`✅ (${result.method})`);
      successCount++;
    } else {
      console.log(`❌`);
      console.log(`     Error: ${result.error}`);
      failCount++;
    }
  }

  console.log("\n📊 Migration Results:");
  console.log(`   ✅ ${successCount} statements succeeded`);
  if (failCount > 0) console.log(`   ❌ ${failCount} statements failed`);

  if (failCount === 0) {
    console.log("\n✅ Migration complete! The share_tokens table is ready.");
    console.log("   - public.share_tokens (table)");
    console.log("   - share_tokens_token_idx (index)");
    console.log("   - share_tokens_application_id_idx (index)");
    console.log("   - share_tokens_created_by_idx (index)");
    console.log("   - RLS: Recruiters can view/create/update/delete own tokens");
    console.log("   - RLS: Anonymous users can read tokens by token UUID");
  } else {
    console.log(`\n⚠  ${failCount} statements had errors. Check the output above.`);
    console.log("   Common issues:");
    console.log("   - Table already exists (safe to ignore)");
    console.log("   - Index already exists (safe to ignore)");
    console.log("   - Policy already exists (safe to ignore)");
    console.log("   - pgcrypto extension already exists (safe to ignore)");
  }

  process.exit(failCount > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error("\n❌ Migration script error:", err);
  process.exit(1);
});
