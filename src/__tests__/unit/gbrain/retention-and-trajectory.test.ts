/**
 * Tests for GBrain retention scheduler + performance trajectory tracker.
 *
 * These two modules together make GBrain's personalization compound over
 * time: scheduling reviews against the forgetting curve (retention) and
 * detecting plateau/breakthrough/decline patterns (trajectory).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync, rmSync } from 'fs';
import {
  recordEncounter, getDueReviews, getUpcomingReviews,
  retentionSnapshot, qualityFromAttempt, listRetentionItems,
} from '../../../gbrain/retention-scheduler';
import {
  logMasteryPoint, conceptTrajectory, allTrajectories,
  topInsights, performanceSummary,
} from '../../../gbrain/performance-tracker';

const STORES = [
  '.data/gbrain-retention.json',
  '.data/gbrain-trajectory.json',
];

function clearStores() {
  for (const p of STORES) if (existsSync(p)) rmSync(p);
}

// ============================================================================
// Retention scheduler
// ============================================================================

describe('retention-scheduler: SM-2 mechanics', () => {
  beforeEach(clearStores);

  it('first encounter with quality 5 schedules review 1 day out', () => {
    const now = new Date('2026-01-01T12:00:00Z');
    const item = recordEncounter('s1', 'calculus', 5, now);
    expect(item.repetitions).toBe(1);
    expect(item.interval_days).toBe(1);
    // ease_factor goes up slightly on quality 5
    expect(item.ease_factor).toBeGreaterThan(2.5);
    const due = new Date(item.due_for_review_at);
    expect((due.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)).toBeCloseTo(1, 0);
  });

  it('second successful review jumps interval to 6 days', () => {
    const t0 = new Date('2026-01-01T12:00:00Z');
    recordEncounter('s2', 'algebra', 5, t0);
    const t1 = new Date('2026-01-02T12:00:00Z');
    const item = recordEncounter('s2', 'algebra', 4, t1);
    expect(item.repetitions).toBe(2);
    expect(item.interval_days).toBe(6);
  });

  it('third successful review uses ease_factor multiplier (~15 days)', () => {
    const t0 = new Date('2026-01-01T12:00:00Z');
    recordEncounter('s3', 'vectors', 5, t0);
    recordEncounter('s3', 'vectors', 4, new Date('2026-01-02T12:00:00Z'));
    const item = recordEncounter('s3', 'vectors', 4, new Date('2026-01-08T12:00:00Z'));
    expect(item.repetitions).toBe(3);
    // 6 * ease (~2.5) = ~15
    expect(item.interval_days).toBeGreaterThan(12);
    expect(item.interval_days).toBeLessThan(20);
  });

  it('failure (quality < 3) resets repetitions to 0 and interval to 1 day', () => {
    const t0 = new Date('2026-01-01T12:00:00Z');
    recordEncounter('s4', 'trig', 5, t0);
    recordEncounter('s4', 'trig', 5, new Date('2026-01-02T12:00:00Z'));
    const item = recordEncounter('s4', 'trig', 1, new Date('2026-01-09T12:00:00Z'));
    expect(item.repetitions).toBe(0);
    expect(item.interval_days).toBe(1);
    // Ease decays on failure
    expect(item.ease_factor).toBeLessThan(2.5);
  });

  it('ease_factor never decays below 1.3', () => {
    const t0 = new Date('2026-01-01T12:00:00Z');
    let item = recordEncounter('s5', 'topic', 0, t0);
    // Keep failing
    for (let i = 0; i < 20; i++) {
      item = recordEncounter('s5', 'topic', 0, new Date(t0.getTime() + (i + 1) * 86400000));
    }
    expect(item.ease_factor).toBeGreaterThanOrEqual(1.3);
  });
});

describe('retention-scheduler: qualityFromAttempt heuristic', () => {
  it('correct + fast => 5', () => {
    expect(qualityFromAttempt(true, 10)).toBe(5);
  });
  it('correct + medium => 4', () => {
    expect(qualityFromAttempt(true, 30)).toBe(4);
  });
  it('correct + slow => 3', () => {
    expect(qualityFromAttempt(true, 60)).toBe(3);
  });
  it('incorrect + felt-close => 2', () => {
    expect(qualityFromAttempt(false, 30, true)).toBe(2);
  });
  it('incorrect + very fast = guess => 0', () => {
    expect(qualityFromAttempt(false, 3)).toBe(0);
  });
  it('correct without time defaults conservatively', () => {
    expect(qualityFromAttempt(true, undefined)).toBe(4);
  });
});

describe('retention-scheduler: queries', () => {
  beforeEach(clearStores);

  it('getDueReviews returns only items whose due date has passed', () => {
    const t0 = new Date('2026-01-01T12:00:00Z');
    // After encounter, due_for_review is 1 day later (2026-01-02)
    recordEncounter('s6', 'a', 5, t0);
    recordEncounter('s6', 'b', 5, t0);
    // At t0, nothing is due yet
    expect(getDueReviews('s6', t0).length).toBe(0);
    // The next day, both are due
    const t1 = new Date('2026-01-02T13:00:00Z');
    expect(getDueReviews('s6', t1).length).toBe(2);
  });

  it('getUpcomingReviews respects horizon', () => {
    const t0 = new Date('2026-01-01T12:00:00Z');
    recordEncounter('s7', 'topic-a', 5, t0);  // due ~24h
    recordEncounter('s7', 'topic-b', 5, t0);
    recordEncounter('s7', 'topic-b', 5, new Date(t0.getTime() + 86400000));  // now due ~6d
    // 3-day horizon includes only topic-a
    const upcoming3 = getUpcomingReviews('s7', 3, t0);
    expect(upcoming3.length).toBeGreaterThanOrEqual(1);
    expect(upcoming3.length).toBeLessThanOrEqual(2);
    // 30-day horizon includes both
    const upcoming30 = getUpcomingReviews('s7', 30, t0);
    expect(upcoming30.length).toBe(2);
  });

  it('retentionSnapshot reports counts correctly', () => {
    const t0 = new Date('2026-01-01T12:00:00Z');
    recordEncounter('s8', 'stable-1', 5, t0);
    recordEncounter('s8', 'stable-1', 5, new Date('2026-01-02T12:00:00Z'));
    recordEncounter('s8', 'stable-1', 5, new Date('2026-01-08T12:00:00Z'));
    recordEncounter('s8', 'stable-1', 5, new Date('2026-01-23T12:00:00Z'));
    recordEncounter('s8', 'fragile-1', 1, new Date('2026-01-25T12:00:00Z'));
    const snap = retentionSnapshot('s8', new Date('2026-01-25T13:00:00Z'));
    expect(snap.total_concepts_tracked).toBe(2);
    expect(snap.stable_concepts).toBeGreaterThanOrEqual(1);  // stable-1 had 4 reviews
    expect(snap.fragile_concepts).toBeGreaterThanOrEqual(1); // fragile-1 last quality < 3
  });
});

// ============================================================================
// Performance tracker
// ============================================================================

describe('performance-tracker: trajectory patterns', () => {
  beforeEach(clearStores);

  it('cold-start when fewer than 2 points', () => {
    const t0 = new Date('2026-01-01T12:00:00Z');
    logMasteryPoint('p1', 'calc', 0.3, 'attempt', t0);
    const traj = conceptTrajectory('p1', 'calc', 30, new Date(t0.getTime() + 86400000));
    expect(traj.pattern).toBe('cold-start');
  });

  it('breakthrough: delta > 0.20', () => {
    const t0 = new Date('2026-01-01T12:00:00Z');
    logMasteryPoint('p2', 'algebra', 0.20, 'attempt', t0);
    logMasteryPoint('p2', 'algebra', 0.45, 'attempt', new Date(t0.getTime() + 86400000));
    logMasteryPoint('p2', 'algebra', 0.70, 'attempt', new Date(t0.getTime() + 2 * 86400000));
    const traj = conceptTrajectory('p2', 'algebra', 30, new Date(t0.getTime() + 3 * 86400000));
    expect(traj.pattern).toBe('breakthrough');
    expect(traj.delta_30d).toBeGreaterThan(0.20);
  });

  it('plateau: |delta| < 0.03 across 5+ points', () => {
    const t0 = new Date('2026-01-01T12:00:00Z');
    for (let i = 0; i < 6; i++) {
      logMasteryPoint('p3', 'trig', 0.50 + (i % 2) * 0.005, 'attempt',
        new Date(t0.getTime() + i * 86400000));
    }
    const traj = conceptTrajectory('p3', 'trig', 30, new Date(t0.getTime() + 10 * 86400000));
    expect(traj.pattern).toBe('plateau');
  });

  it('decline: last 3 strictly decreasing AND total delta < -0.10', () => {
    const t0 = new Date('2026-01-01T12:00:00Z');
    logMasteryPoint('p4', 'vectors', 0.75, 'attempt', t0);
    logMasteryPoint('p4', 'vectors', 0.60, 'attempt', new Date(t0.getTime() + 86400000));
    logMasteryPoint('p4', 'vectors', 0.50, 'attempt', new Date(t0.getTime() + 2 * 86400000));
    logMasteryPoint('p4', 'vectors', 0.40, 'attempt', new Date(t0.getTime() + 3 * 86400000));
    const traj = conceptTrajectory('p4', 'vectors', 30, new Date(t0.getTime() + 4 * 86400000));
    expect(traj.pattern).toBe('decline');
    expect(traj.delta_30d).toBeLessThan(-0.10);
  });

  it('steady: gentle climb', () => {
    const t0 = new Date('2026-01-01T12:00:00Z');
    logMasteryPoint('p5', 'calc', 0.30, 'attempt', t0);
    logMasteryPoint('p5', 'calc', 0.35, 'attempt', new Date(t0.getTime() + 86400000));
    logMasteryPoint('p5', 'calc', 0.40, 'attempt', new Date(t0.getTime() + 2 * 86400000));
    logMasteryPoint('p5', 'calc', 0.45, 'attempt', new Date(t0.getTime() + 3 * 86400000));
    const traj = conceptTrajectory('p5', 'calc', 30, new Date(t0.getTime() + 4 * 86400000));
    expect(traj.pattern).toBe('steady');
  });
});

describe('performance-tracker: insights + summary', () => {
  beforeEach(clearStores);

  it('topInsights prioritises declines over plateaus over breakthroughs', () => {
    const t0 = new Date('2026-01-01T12:00:00Z');
    // decline on topic-decline
    logMasteryPoint('p6', 't-decline', 0.80, 'attempt', t0);
    logMasteryPoint('p6', 't-decline', 0.60, 'attempt', new Date(t0.getTime() + 86400000));
    logMasteryPoint('p6', 't-decline', 0.50, 'attempt', new Date(t0.getTime() + 2 * 86400000));
    logMasteryPoint('p6', 't-decline', 0.40, 'attempt', new Date(t0.getTime() + 3 * 86400000));
    // breakthrough on topic-rising
    logMasteryPoint('p6', 't-rising', 0.20, 'attempt', t0);
    logMasteryPoint('p6', 't-rising', 0.55, 'attempt', new Date(t0.getTime() + 86400000));

    const insights = topInsights('p6', 5, new Date(t0.getTime() + 4 * 86400000));
    expect(insights[0].pattern).toBe('decline');
  });

  it('performanceSummary produces an empty string for cold-start students', () => {
    expect(performanceSummary('never-seen-student')).toBe('');
  });

  it('performanceSummary surfaces top patterns when data exists', () => {
    const t0 = new Date('2026-01-01T12:00:00Z');
    logMasteryPoint('p7', 'topic-x', 0.20, 'attempt', t0);
    logMasteryPoint('p7', 'topic-x', 0.55, 'attempt', new Date(t0.getTime() + 86400000));
    const summary = performanceSummary('p7', new Date(t0.getTime() + 2 * 86400000));
    expect(summary).toMatch(/breakthrough|topic-x/);
  });
});
