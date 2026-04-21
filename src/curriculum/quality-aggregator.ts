// @ts-nocheck
/**
 * Quality Aggregator
 *
 * Reads engagement signals from the content telemetry flat-file and
 * rolls them up into per-component quality scores. Produces iteration
 * snapshots that the admin dashboard uses to show compounding quality
 * deltas across time.
 *
 * Storage: `.data/curriculum-quality.json` — flat file alongside the
 * other DB-less stores. Two top-level sections:
 *   - iterations: array of QualityIterationSnapshot (one per "cycle")
 *   - running: the in-progress aggregation since the last iteration close
 *
 * Pure functions where possible. The only side effect is file I/O.
 */

import fs from 'fs';
import path from 'path';
import type {
  QualitySignal,
  ComponentQuality,
  QualityIterationSnapshot,
} from './types';

const STORE_PATH = path.resolve(process.cwd(), '.data/curriculum-quality.json');

// ============================================================================
// Store — DB-less, flat JSON
// ============================================================================

interface Store {
  iterations: QualityIterationSnapshot[];
  running: {
    iteration: number;
    started_at: string;
    /** Raw counts keyed on "concept_id|component_kind" */
    counts: Record<string, {
      viewed: number;
      revealed: number;
      completed: number;
      skipped: number;
      /** Number of chances the component had to be revealed (seen but not auto-expanded) */
      reveal_opportunities: number;
      /** For micro_exercise only */
      correct: number;
      attempts: number;
      last_ts: string;
    }>;
  };
}

function readStore(): Store {
  try {
    if (fs.existsSync(STORE_PATH)) {
      return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
    }
  } catch {
    // fallthrough to fresh
  }
  return {
    iterations: [],
    running: {
      iteration: 1,
      started_at: new Date().toISOString(),
      counts: {},
    },
  };
}

function writeStore(s: Store): void {
  const dir = path.dirname(STORE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(s, null, 2));
}

// ============================================================================
// Ingestion — add a signal to the running iteration
// ============================================================================

const VALID_EVENTS = new Set(['viewed', 'revealed', 'completed', 'skipped']);
const REVEALABLE_COMPONENTS = new Set(['worked_example', 'micro_exercise']);

export function recordSignal(sig: QualitySignal): void {
  if (!sig.concept_id || !sig.component_kind || !VALID_EVENTS.has(sig.event)) return;
  const store = readStore();
  const key = `${sig.concept_id}|${sig.component_kind}`;
  let c = store.running.counts[key];
  if (!c) {
    c = {
      viewed: 0, revealed: 0, completed: 0, skipped: 0,
      reveal_opportunities: 0,
      correct: 0, attempts: 0,
      last_ts: sig.timestamp,
    };
    store.running.counts[key] = c;
  }
  c[sig.event]++;
  c.last_ts = sig.timestamp;
  if (REVEALABLE_COMPONENTS.has(sig.component_kind) && sig.event === 'viewed') {
    c.reveal_opportunities++;
  }
  if (sig.component_kind === 'micro_exercise' && sig.event === 'completed') {
    c.attempts++;
    if (sig.correct === true) c.correct++;
  }
  writeStore(store);
}

// ============================================================================
// Aggregation — turn raw counts into ComponentQuality
// ============================================================================

const QUALITY_THRESHOLD = 0.6;

function computeQuality(
  concept_id: string,
  component_kind: ComponentQuality['component_kind'],
  iteration: number,
  counts: Store['running']['counts'][string],
): ComponentQuality {
  const obs = counts.viewed + counts.skipped;
  const view_rate = obs > 0 ? counts.viewed / obs : 0;
  const reveal_rate = counts.reveal_opportunities > 0
    ? counts.revealed / counts.reveal_opportunities
    : 0;
  const completion_rate = obs > 0 ? counts.completed / obs : 0;
  const skip_rate = obs > 0 ? counts.skipped / obs : 0;
  const micro_rate = counts.attempts > 0 ? counts.correct / counts.attempts : null;

  // Composite quality score:
  //   - heavy weight on completion, inverse on skip
  //   - reveal is a *positive* signal (student wanted more)
  //   - for micro_exercise, success rate also matters
  let score: number;
  if (component_kind === 'micro_exercise') {
    // Micro-exercise: balance completion + correctness
    score = 0.4 * completion_rate + 0.4 * (micro_rate ?? 0.5) + 0.2 * (1 - skip_rate);
  } else if (component_kind === 'worked_example') {
    // Worked example: reveal rate is a strong positive signal
    score = 0.4 * completion_rate + 0.35 * reveal_rate + 0.25 * (1 - skip_rate);
  } else {
    // Generic: completion and inverse-skip
    score = 0.6 * completion_rate + 0.4 * (1 - skip_rate);
  }
  score = Math.round(Math.max(0, Math.min(1, score)) * 100) / 100;

  const needs_review = obs >= 5 && score < QUALITY_THRESHOLD;
  let flag_reason: string | null = null;
  if (needs_review) {
    if (skip_rate > 0.5) flag_reason = `high skip rate (${(skip_rate * 100).toFixed(0)}%)`;
    else if (completion_rate < 0.3) flag_reason = `low completion rate (${(completion_rate * 100).toFixed(0)}%)`;
    else if (micro_rate !== null && micro_rate < 0.4) flag_reason = `low correctness rate (${(micro_rate * 100).toFixed(0)}%)`;
    else flag_reason = `composite score ${score.toFixed(2)} below threshold`;
  }

  return {
    concept_id,
    component_kind,
    iteration,
    observations: obs,
    engagement: {
      view_rate: Math.round(view_rate * 100) / 100,
      reveal_rate: Math.round(reveal_rate * 100) / 100,
      completion_rate: Math.round(completion_rate * 100) / 100,
      skip_rate: Math.round(skip_rate * 100) / 100,
      micro_exercise_success_rate: micro_rate !== null ? Math.round(micro_rate * 100) / 100 : null,
    },
    quality_score: score,
    needs_review,
    flag_reason,
    last_updated: counts.last_ts,
  };
}

// ============================================================================
// Public queries
// ============================================================================

/**
 * Snapshot the current running aggregation without closing the iteration.
 * Used by the admin dashboard for live views.
 */
export function getCurrentQualityView(): QualityIterationSnapshot {
  const store = readStore();
  const components: ComponentQuality[] = [];
  for (const [key, counts] of Object.entries(store.running.counts)) {
    const [concept_id, component_kind] = key.split('|');
    components.push(computeQuality(concept_id, component_kind as any, store.running.iteration, counts));
  }
  components.sort((a, b) => a.quality_score - b.quality_score); // worst first

  const totalObs = components.reduce((s, c) => s + c.observations, 0);
  const avg = totalObs > 0
    ? components.reduce((s, c) => s + c.quality_score * c.observations, 0) / totalObs
    : 0;
  const flagged = components.filter(c => c.needs_review).length;

  const prev = store.iterations[store.iterations.length - 1];
  const delta = prev ? Math.round((avg - prev.avg_quality_score) * 100) / 100 : null;

  return {
    iteration: store.running.iteration,
    started_at: store.running.started_at,
    total_components: components.length,
    avg_quality_score: Math.round(avg * 100) / 100,
    flagged_count: flagged,
    delta_vs_previous: delta,
    per_concept: components,
  };
}

/**
 * Close the current iteration, freeze its snapshot, and start a new one.
 * Called by the admin after shipping content updates, so the next
 * measurement window isn't polluted by pre-update engagement.
 */
export function closeIterationAndStartNext(): QualityIterationSnapshot {
  const store = readStore();
  const snapshot = getCurrentQualityView();
  snapshot.ended_at = new Date().toISOString();
  store.iterations.push(snapshot);
  store.running = {
    iteration: store.running.iteration + 1,
    started_at: new Date().toISOString(),
    counts: {},
  };
  writeStore(store);
  return snapshot;
}

/**
 * Get a specific past iteration snapshot.
 */
export function getIteration(iteration: number): QualityIterationSnapshot | null {
  const store = readStore();
  return store.iterations.find(i => i.iteration === iteration) || null;
}

/**
 * Get the history of iteration-level metrics for trend charts.
 */
export function getIterationTrend(): Array<{
  iteration: number;
  avg_quality_score: number;
  flagged_count: number;
  ended_at: string;
}> {
  const store = readStore();
  return store.iterations.map(i => ({
    iteration: i.iteration,
    avg_quality_score: i.avg_quality_score,
    flagged_count: i.flagged_count,
    ended_at: i.ended_at || i.started_at,
  }));
}

/**
 * Flagged-only view — what needs curator attention now.
 */
export function getFlaggedComponents(): ComponentQuality[] {
  return getCurrentQualityView().per_concept.filter(c => c.needs_review);
}
