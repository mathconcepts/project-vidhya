/**
 * src/jobs/source-freshness-monitor.ts
 *
 * docs/designs/2026-09-02-content-strategy-research-integration-plan.md
 * (P3): the research framework requires hash-based freshness monitoring on
 * the official exam scope/pattern documents, with "nothing watches the
 * official contract" flagged as an explicit, parked gap in
 * docs/designs/2026-08-27-content-readiness-market-research-integration.md
 * ("ADOPT AS CALENDAR — an annual operator checklist item, not a system").
 * This replaces that checklist with an actual (cheap, weekly) check.
 *
 * What it does NOT do: no impact traversal, no automatic content freeze, no
 * semantic diff of what changed. A hash flip means "an operator should look
 * at this page" — the research framework's own "Human review or bounded
 * pilot gate" principle (docs/content-spec/adaptive-content-generation-
 * framework.md §11) applies here too: this system detects drift, it does
 * not decide what the drift means.
 *
 * Network reachability from this process is not guaranteed in every
 * deployment/sandbox (proxy policy, offline dev, CI) — every source is
 * checked independently and a fetch failure never throws; it's recorded as
 * a per-source `fetch_failed` status so one unreachable source can't hide
 * another's real change.
 */

import crypto from 'crypto';
import { createFlatFileStore } from '../lib/flat-file-store';
import { durableCollection, registerDurable } from '../storage/durable-flat-file';

export interface OfficialSource {
  id: string;
  url: string;
  description: string;
}

/**
 * The two official GATE 2026 pages the research documents cite as the
 * canonical scope/assessment contract (docs/content-spec/research-notes.md).
 * Adding a new paper/year source is a one-line addition here — no schema
 * change, since freshness records are keyed by `id`, not enumerated columns.
 */
export const OFFICIAL_SOURCES: OfficialSource[] = [
  {
    id: 'gate2026-syllabus',
    url: 'https://gate2026.iitg.ac.in/exam-papers-and-syllabus.html',
    description: 'GATE 2026 test papers & syllabus index (paper/year scope contract).',
  },
  {
    id: 'gate2026-question-pattern',
    url: 'https://gate2026.iitg.ac.in/question-paper-pattern.html',
    description: 'GATE 2026 question paper pattern (MCQ/MSQ/NAT + marking rules — the Assessment Contract source).',
  },
];

export type SourceFreshnessStatus = 'unchanged' | 'changed' | 'first_check' | 'fetch_failed';

export interface SourceFreshnessRecord {
  id: string;
  url: string;
  last_hash: string | null;
  last_checked_at: string | null;
  last_changed_at: string | null;
  last_status: SourceFreshnessStatus | null;
  last_error: string | null;
}

interface SourceFreshnessFile {
  version: 1;
  records: Record<string, SourceFreshnessRecord>;
}

const store = createFlatFileStore<SourceFreshnessFile>({
  path: '.data/source-freshness.json',
  defaultShape: () => ({ version: 1, records: {} }),
});

// Durable mirror (migration 043's durable_records) — a hash the monitor
// forgot on restart is not lost data in the retention-schedule sense, but
// it IS a monitor that silently resets to "first_check" every time Render's
// free tier sleeps, which defeats the point of monitoring at all.
const durable = registerDurable('source-freshness', durableCollection<SourceFreshnessRecord>({
  collection: 'source-freshness',
  idOf: (r) => r.id,
  readLocal: () => Object.values(store.read().records),
  writeLocal: (records) => store.write({
    version: 1,
    records: Object.fromEntries(records.map((r) => [r.id, r])),
  }),
}));

function emptyRecord(source: OfficialSource): SourceFreshnessRecord {
  return {
    id: source.id,
    url: source.url,
    last_hash: null,
    last_checked_at: null,
    last_changed_at: null,
    last_status: null,
    last_error: null,
  };
}

export interface SourceCheckResult extends SourceFreshnessRecord {
  changed: boolean;
}

type FetchLike = (url: string) => Promise<{ ok: boolean; status: number; text(): Promise<string> }>;

/**
 * Check every registered official source once. Never throws — a fetch
 * failure on one source is recorded and the rest still run.
 *
 * `fetchImpl` is injectable so tests never touch the network; production
 * callers omit it and get the real global `fetch` (Node 18+).
 */
export async function checkSourceFreshness(
  fetchImpl: FetchLike = globalThis.fetch as FetchLike,
): Promise<SourceCheckResult[]> {
  const file = store.read();
  const results: SourceCheckResult[] = [];

  for (const source of OFFICIAL_SOURCES) {
    const prev = file.records[source.id] ?? emptyRecord(source);
    const checked_at = new Date().toISOString();

    let hash: string;
    try {
      const res = await fetchImpl(source.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.text();
      hash = crypto.createHash('sha256').update(body).digest('hex');
    } catch (err) {
      const failed: SourceFreshnessRecord = {
        ...prev,
        last_checked_at: checked_at,
        last_status: 'fetch_failed',
        last_error: (err as Error).message,
      };
      file.records[source.id] = failed;
      results.push({ ...failed, changed: false });
      continue;
    }

    const isFirstCheck = prev.last_hash === null;
    const changed = !isFirstCheck && hash !== prev.last_hash;
    const status: SourceFreshnessStatus = isFirstCheck ? 'first_check' : changed ? 'changed' : 'unchanged';

    const updated: SourceFreshnessRecord = {
      id: source.id,
      url: source.url,
      last_hash: hash,
      last_checked_at: checked_at,
      last_changed_at: changed ? checked_at : prev.last_changed_at,
      last_status: status,
      last_error: null,
    };
    file.records[source.id] = updated;
    results.push({ ...updated, changed });
  }

  store.write(file);
  durable.mirror(); // fire-and-forget; DB-less deploys no-op cleanly
  return results;
}

/** Current state without triggering a fetch — for the admin read endpoint. */
export function getSourceFreshnessState(): SourceFreshnessRecord[] {
  const file = store.read();
  return OFFICIAL_SOURCES.map((s) => file.records[s.id] ?? emptyRecord(s));
}

/** Scheduler entry point (src/jobs/scheduler.ts). */
export async function runSourceFreshnessMonitor(): Promise<{
  status: 'ran';
  checked: number;
  changed: number;
  failed: number;
}> {
  const results = await checkSourceFreshness();
  return {
    status: 'ran',
    checked: results.length,
    changed: results.filter((r) => r.last_status === 'changed').length,
    failed: results.filter((r) => r.last_status === 'fetch_failed').length,
  };
}
