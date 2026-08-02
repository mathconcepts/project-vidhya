/**
 * wolfram-steps-cache — disk cache for harvested Wolfram step-by-step
 * solutions (content-pipeline realignment plan, Accepted Scope item 5).
 *
 * The wolfram-verify background job writes one JSON file per problem to
 * .data/wolfram-steps/<problem_id>.json when verification succeeds AND
 * Wolfram returns a step-by-step pod. The lesson composer reads the
 * cache (graceful when the dir is missing) and attaches the steps as a
 * provenance-labeled enrichment on the worked_example component.
 *
 * Every entry carries provenance {source:"wolfram", query_id, fetched_at}
 * so the UI can render honest attribution through the existing
 * wolframAttribution path. `query_id` is a stable SHA-256 digest of the
 * query text (the Full Results API does not return a server-side id).
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface WolframStepsProvenance {
  source: 'wolfram';
  query_id: string;
  fetched_at: string;
}

export interface WolframStepsCacheEntry {
  problem_id: string;
  query: string;
  steps: string[];
  answer?: string | null;
  provenance: WolframStepsProvenance;
}

/** Steps cache dir — override with VIDHYA_WOLFRAM_STEPS_DIR (tests). */
export function wolframStepsDir(): string {
  return process.env.VIDHYA_WOLFRAM_STEPS_DIR || path.resolve(process.cwd(), '.data/wolfram-steps');
}

/** Stable identifier for a query (Full Results API returns no id). */
export function queryIdFor(query: string): string {
  return crypto.createHash('sha256').update(query).digest('hex').slice(0, 16);
}

/** Problem ids become file names — reject anything path-traversal-shaped. */
function safeFileName(problem_id: string): string | null {
  if (!problem_id || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(problem_id)) return null;
  return `${problem_id}.json`;
}

/**
 * Read a cached steps entry. Graceful on every failure mode: missing
 * dir, missing file, unparseable JSON, or a shape without steps all
 * return null — the composer simply omits the enrichment.
 */
export function readWolframSteps(problem_id: string): WolframStepsCacheEntry | null {
  const name = safeFileName(problem_id);
  if (!name) return null;
  try {
    const file = path.join(wolframStepsDir(), name);
    if (!fs.existsSync(file)) return null;
    const parsed = JSON.parse(fs.readFileSync(file, 'utf-8')) as WolframStepsCacheEntry;
    if (!parsed || !Array.isArray(parsed.steps) || parsed.steps.length === 0) return null;
    if (!parsed.provenance || parsed.provenance.source !== 'wolfram') return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Atomic write (temp + rename) of a steps cache entry. */
export function writeWolframSteps(problem_id: string, entry: WolframStepsCacheEntry): boolean {
  const name = safeFileName(problem_id);
  if (!name) return false;
  const dir = wolframStepsDir();
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name);
  const tmp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(entry, null, 2));
  fs.renameSync(tmp, file);
  return true;
}
