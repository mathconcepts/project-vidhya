/**
 * dotenv-loader — minimal `.env` loader with no external dependency.
 *
 * job-cli.ts previously relied on the shell already having `.env`
 * exported (`set -a; source .env; set +a`) before running any
 * `npm run content:*` command — a manual step that's easy to forget and
 * produced a confusing "GEMINI_API_KEY is not set" refusal even though
 * `.env` had a real key in it (postinstall-check.cjs parses `.env`
 * directly and reported it as "set", which made the mismatch more
 * confusing, not less). This ports that same regex-based parse (see
 * `scripts/postinstall-check.cjs`'s `loadEnv()`) into a tiny loader the
 * job/setup CLIs call first, so `.env` just works without a shell step —
 * "take credentials from the user upfront" only works if upfront actually
 * means once, not once-per-terminal-session.
 *
 * Real exported environment variables always win over `.env` — this only
 * fills in keys that are not already set on `process.env`, matching
 * standard dotenv semantics.
 */

import fs from 'fs';
import path from 'path';

export function loadDotEnvIntoProcess(cwd: string = process.cwd()): void {
  const envPath = path.join(cwd, '.env');
  if (!fs.existsSync(envPath)) return;

  let raw: string;
  try {
    raw = fs.readFileSync(envPath, 'utf-8');
  } catch {
    return;
  }

  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    const [, key, rawValue] = m;
    if (process.env[key] !== undefined) continue; // real shell env wins
    process.env[key] = rawValue.trim().replace(/^["']|["']$/g, '');
  }
}
