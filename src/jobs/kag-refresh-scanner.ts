/**
 * src/jobs/kag-refresh-scanner.ts
 *
 * Nightly job that grows the KAG corpus (src/content/kag-store.ts) toward
 * full concept-graph coverage, bounded by content-refresh-queue.ts's
 * MAX_PER_NIGHT=5 invariant.
 *
 * Concepts already covered are skipped, so re-runs only ever fill gaps —
 * safe to run nightly indefinitely without re-generating existing entries.
 *
 * Off by default (VIDHYA_KAG_NIGHTLY unset) — this job spends real LLM
 * and Wolfram Alpha calls, so it ships disabled the same way
 * contentPipelineNightly / VIDHYA_AB_TESTING do, and needs an explicit
 * opt-in per deploy.
 */

import { ALL_CONCEPTS } from '../constants/concept-graph';
import { getKagEntry } from '../content/kag-store';
import { isNightlyCapReached } from './content-refresh-queue';
import { generateKagEntry } from '../gbrain/operations/kag-concept-generator';

export interface KagRefreshResult {
  status: 'skipped' | 'ran';
  reason?: string;
  generated: number;
  skipped_existing: number;
  skipped_cap: number;
  failed: number;
}

export async function runKagRefreshScanner(): Promise<KagRefreshResult> {
  if (process.env.VIDHYA_KAG_NIGHTLY !== 'on') {
    return { status: 'skipped', reason: 'VIDHYA_KAG_NIGHTLY not enabled', generated: 0, skipped_existing: 0, skipped_cap: 0, failed: 0 };
  }

  let generated = 0;
  let skipped_existing = 0;
  let skipped_cap = 0;
  let failed = 0;

  for (const concept of ALL_CONCEPTS) {
    if (isNightlyCapReached()) {
      skipped_cap++;
      continue;
    }
    if (getKagEntry(concept.id)) {
      skipped_existing++;
      continue;
    }

    try {
      const result = await generateKagEntry({
        concept_id: concept.id,
        concept_label: concept.label,
        description: concept.description,
        embedding: [],
      });
      if (result.ok) {
        generated++;
      } else if (result.skipped_reason === 'nightly_cap') {
        skipped_cap++;
      } else {
        failed++;
        console.warn(`[kag-refresh-scanner] ${concept.id} failed: ${result.skipped_reason}`);
      }
    } catch (err) {
      failed++;
      console.error(`[kag-refresh-scanner] ${concept.id} threw: ${(err as Error).message}`);
    }
  }

  return { status: 'ran', generated, skipped_existing, skipped_cap, failed };
}
