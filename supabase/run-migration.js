// Run this script to apply ALL database fixes for InternIQ.
// Usage: node supabase/run-migration.js
//
// The exec_sql function executes as SECURITY DEFINER (full DB rights), so this
// script requires a SERVICE ROLE key, NOT the anon key. Set it via env var:
//
//   SUPABASE_URL=https://xxx.supabase.co node supabase/run-migration.js
//   SUPABASE_SERVICE_ROLE_KEY=service_role_key_here node supabase/run-migration.js
//
// If you only have the anon key, run supabase/migrations/20260801_apply_all_fixes.sql
// directly in the Supabase SQL Editor instead — that's the recommended path.

const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hvacdcjmyylhlaozoxcf.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2YWNkY2pteXlsaGxhb3pveGNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NTA4MTQsImV4cCI6MjEwMDAyNjgxNH0.Nyk33eeHUWISY2RuDGIK6fMuIaUz5zVSZr1girtLPXc';

if (!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_KEY) {
  console.warn(
    '\nWARNING: using the fallback anon key. exec_sql is only granted to ' +
    'authenticated + service_role after the migration, so anon-key calls may be ' +
    'denied. Prefer: SUPABASE_SERVICE_ROLE_KEY=... node supabase/run-migration.js\n'
  );
}

// ---------------------------------------------------------------------------
// Split the migration file into executable statements.
// We split on the "---" separator lines so each chunk is a complete, safe unit
// that exec_sql can run (multi-statement blocks with DO $$ ... $$ are kept
// whole because they don't contain a separator line inside).
// ---------------------------------------------------------------------------
const migrationFile = path.join(__dirname, 'migrations', '20260801_apply_all_fixes.sql');
const fullSql = fs.readFileSync(migrationFile, 'utf8');

const chunks = fullSql
  .split(/\n-- -{3,}\n/)
  .map((c) => c.trim())
  .filter((c) => c.length > 0);

function callExecSql(sql) {
  return new Promise((resolve) => {
    const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL);
    const body = JSON.stringify({ sql });

    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }
    );

    req.on('error', (e) => resolve({ status: 0, body: `Error: ${e.message}` }));
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log(`Applying ${chunks.length} migration chunks...\n`);

  let ok = 0;
  let failed = 0;

  for (let i = 0; i < chunks.length; i++) {
    const preview = chunks[i].split('\n')[0] || `chunk ${i + 1}`;
    process.stdout.write(`  [${i + 1}/${chunks.length}] ${preview.slice(0, 70)}... `);

    try {
      const res = await callExecSql(chunks[i]);
      if (res.status >= 200 && res.status < 300) {
        console.log('OK');
        ok++;
      } else {
        console.log(`FAIL (${res.status})`);
        console.log('       ' + (res.body || '').slice(0, 300));
        failed++;
      }
    } catch (e) {
      console.log('EXCEPTION');
      console.log('       ' + String(e).slice(0, 300));
      failed++;
    }
  }

  console.log(`\nDone. ${ok} OK, ${failed} failed.`);
  if (failed > 0) {
    console.log('Some statements failed — this is often fine for idempotent reruns.');
  }
}

run();
