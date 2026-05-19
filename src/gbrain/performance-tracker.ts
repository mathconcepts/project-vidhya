/**
 * Performance Trajectory Tracker — mastery over time + adaptive insights.
 *
 * GBrain's student model tracks current mastery per topic. This module
 * adds the time dimension — every meaningful change in mastery is logged
 * as a point on the student's trajectory, then analysed for patterns:
 *
 *   - Plateau     — mastery flat for N days with no movement
 *   - Breakthrough — sharp positive movement in a short window
 *   - Decline     — sustained downward trend (retention failure)
 *   - Steady      — gentle, consistent climb (the ideal)
 *
 * The detected pattern feeds back into:
 *   - the planner system prompt ("this student plateaued on calculus —
 *     vary the representation mode")
 *   - the bridge recommendation card ("you've been steady on X — try Y")
 *   - admin/teacher analytics (cohort patterns)
 *
 * Storage is intentionally lightweight: one append-only log file. Reads
 * project the log into trajectories on demand. Old entries (>90 days)
 * are kept for trend analysis but most queries default to a 30-day window.
 */

import { createFlatFileStore } from '../lib/flat-file-store';

// ============================================================================
// Types
// ============================================================================

export interface MasteryPoint {
  student_id: string;
  /** A topic id (exam-adapter topic OR curriculum concept id) */
  concept_id: string;
  /** 0.0 - 1.0 */
  mastery: number;
  /** ISO timestamp */
  at: string;
  /** Source of the change — for debugging trajectories */
  source: 'attempt' | 'retention' | 'manual' | 'onboard';
}

interface StoreShape { points: MasteryPoint[]; }

const _store = createFlatFileStore<StoreShape>({
  path: '.data/gbrain-trajectory.json',
  defaultShape: () => ({ points: [] }),
});

export type TrajectoryPattern =
  | 'plateau'
  | 'breakthrough'
  | 'decline'
  | 'steady'
  | 'cold-start';   // not enough data yet

export interface ConceptTrajectory {
  student_id: string;
  concept_id: string;
  points: MasteryPoint[];
  current_mastery: number;
  /** Mastery delta over the window (last - first) */
  delta_30d: number;
  /** Pattern detected over the last ~30 days */
  pattern: TrajectoryPattern;
  /** Human-readable insight string used in GBrain prompts */
  insight: string;
}

// ============================================================================
// Recording
// ============================================================================

/**
 * Log a mastery point. Called from after-each-attempt hooks, retention
 * scheduler, and the onboard seed. Auto-deduplicates: if the most recent
 * point for the same (student, concept) is within 60 seconds, the new
 * value replaces it rather than appending — avoids burst noise.
 */
export function logMasteryPoint(
  student_id: string,
  concept_id: string,
  mastery: number,
  source: MasteryPoint['source'] = 'attempt',
  now: Date = new Date(),
): void {
  _store.update(s => {
    const clamped = Math.max(0, Math.min(1, mastery));
    const point: MasteryPoint = {
      student_id, concept_id, mastery: clamped,
      at: now.toISOString(), source,
    };
    // Dedup: replace any point within 60s for the same (student, concept)
    const recent = s.points.findIndex(p =>
      p.student_id === student_id &&
      p.concept_id === concept_id &&
      Math.abs(new Date(p.at).getTime() - now.getTime()) < 60_000,
    );
    if (recent >= 0) s.points[recent] = point;
    else s.points.push(point);
    return s;
  });
}

// ============================================================================
// Reading + analysis
// ============================================================================

function pointsFor(student_id: string, concept_id: string, days = 30, now = new Date()): MasteryPoint[] {
  const cutoffMs = now.getTime() - days * 24 * 60 * 60 * 1000;
  return _store.read().points
    .filter(p =>
      p.student_id === student_id &&
      p.concept_id === concept_id &&
      new Date(p.at).getTime() >= cutoffMs,
    )
    .sort((a, b) => a.at.localeCompare(b.at));
}

/**
 * Detect the pattern in a sequence of mastery points.
 *
 * Rules (deliberately simple — readable + tunable):
 *   < 2 points                                -> 'cold-start'
 *   delta > +0.20 over the window             -> 'breakthrough'
 *   delta < -0.10 with last 3 declining       -> 'decline'
 *   |delta| < 0.03 across 5+ points           -> 'plateau'
 *   otherwise (gentle progress)               -> 'steady'
 */
function detectPattern(points: MasteryPoint[]): TrajectoryPattern {
  if (points.length < 2) return 'cold-start';
  const first = points[0].mastery;
  const last = points[points.length - 1].mastery;
  const delta = last - first;

  // Decline: last 3 strictly decreasing (or close to it)
  if (points.length >= 3) {
    const tail = points.slice(-3);
    const declining = tail[0].mastery > tail[1].mastery && tail[1].mastery > tail[2].mastery;
    if (declining && delta < -0.10) return 'decline';
  }

  if (delta > 0.20) return 'breakthrough';
  if (Math.abs(delta) < 0.03 && points.length >= 5) return 'plateau';
  return 'steady';
}

function buildInsight(concept_id: string, pattern: TrajectoryPattern, delta: number): string {
  switch (pattern) {
    case 'breakthrough':
      return `${concept_id}: breakthrough (+${(delta * 100).toFixed(0)}% in 30d). Push to next-difficulty content while momentum is high.`;
    case 'plateau':
      return `${concept_id}: plateaued for several reviews. Vary the representation mode — try worked examples instead of practice, or vice versa.`;
    case 'decline':
      return `${concept_id}: mastery has slipped (${(delta * 100).toFixed(0)}%). Re-encounter via spaced review before harder problems.`;
    case 'steady':
      return `${concept_id}: steady progress (+${(delta * 100).toFixed(0)}%). Stay the course.`;
    case 'cold-start':
      return `${concept_id}: not enough data yet — needs more attempts before patterns emerge.`;
  }
}

/** Build the trajectory + insight for a single concept. */
export function conceptTrajectory(
  student_id: string,
  concept_id: string,
  window_days = 30,
  now: Date = new Date(),
): ConceptTrajectory {
  const points = pointsFor(student_id, concept_id, window_days, now);
  const current_mastery = points.length ? points[points.length - 1].mastery : 0;
  const delta_30d = points.length ? current_mastery - points[0].mastery : 0;
  const pattern = detectPattern(points);
  const insight = buildInsight(concept_id, pattern, delta_30d);
  return { student_id, concept_id, points, current_mastery, delta_30d: Number(delta_30d.toFixed(3)), pattern, insight };
}

/** All trajectories for a student in the window, one per concept. */
export function allTrajectories(student_id: string, window_days = 30, now: Date = new Date()): ConceptTrajectory[] {
  const cutoffMs = now.getTime() - window_days * 24 * 60 * 60 * 1000;
  const points = _store.read().points
    .filter(p => p.student_id === student_id && new Date(p.at).getTime() >= cutoffMs);
  const byConcept = new Map<string, MasteryPoint[]>();
  for (const p of points) {
    const list = byConcept.get(p.concept_id) ?? [];
    list.push(p);
    byConcept.set(p.concept_id, list);
  }
  return [...byConcept.keys()].map(cid => conceptTrajectory(student_id, cid, window_days, now));
}

/**
 * The top-N most actionable insights for a student. Used by the GBrain
 * prompt enricher and the planner card. Priority order:
 *   1. declines (immediate intervention needed)
 *   2. plateaus (vary approach)
 *   3. breakthroughs (push forward)
 *   4. steady (keep going)
 */
export function topInsights(student_id: string, limit = 5, now: Date = new Date()): ConceptTrajectory[] {
  const all = allTrajectories(student_id, 30, now);
  const priority: Record<TrajectoryPattern, number> = {
    'decline': 4, 'plateau': 3, 'breakthrough': 2, 'steady': 1, 'cold-start': 0,
  };
  return all
    .filter(t => t.pattern !== 'cold-start')
    .sort((a, b) => priority[b.pattern] - priority[a.pattern])
    .slice(0, limit);
}

/**
 * Aggregate performance signal for the prompt enricher. One paragraph the
 * LLM can read to calibrate response style.
 */
export function performanceSummary(student_id: string, now: Date = new Date()): string {
  const insights = topInsights(student_id, 3, now);
  if (insights.length === 0) return '';
  const lines = insights.map(i => `  - ${i.insight}`);
  return `Recent performance trajectory (last 30 days):\n${lines.join('\n')}`;
}
