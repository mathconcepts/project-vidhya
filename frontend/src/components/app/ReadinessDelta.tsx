/**
 * ReadinessDelta.tsx
 *
 * /investigate (2026-09-08, item 4: "a path from lesson -> practice and
 * vice versa... at each step, the competency is moving to the right").
 * Root cause (see the Competency Compass plan): `POST /api/practice/attempt`
 * already fed every graded attempt through `StudentModel.update()`, which
 * already computes a before/after Elo movement on the student's skill
 * rating internally (src/gbrain/student-model-pg.ts) — and threw it away.
 * Nothing on this page, or anywhere else, ever showed a student "that
 * attempt moved something." This is the one component that shows it.
 *
 * Deliberately called "readiness," never "mastery" — ProgressPage /
 * TopicPage / SpinePage / Home already show a DIFFERENT, cumulative
 * Wilson-bound accuracy percentage under the word "mastery"
 * (frontend/src/lib/mastery-confidence.ts). This is a distinct, per-attempt
 * signal (the same Elo→percent mapping src/readiness/expected-score.ts
 * already uses for its "expected marks" figure) — using a different word
 * keeps the two from ever reading as two disagreeing measurements of the
 * same thing.
 *
 * `--green-ink` on an improving delta mirrors the existing "+N min of
 * focused work" XP line just below it in PracticeAttemptPage.tsx (same
 * quiet, no-toast, no-floating-number treatment); a flat or declining
 * delta renders in `--text-secondary` — never red. This app has no
 * punitive color (DESIGN-SYSTEM.md's two-accent law); a dip is
 * information a student can act on, not a scolding.
 *
 * Renders nothing when `delta` is null/undefined — the honest shape for
 * a DB-less deploy or a deduped retry (see AttemptSkillDelta's doc
 * comment, src/core/interfaces.ts), matching this app's standing
 * never-fabricate discipline (AttemptCounterfactual.tsx and others).
 */

import { TrendingUp } from 'lucide-react';

export interface ReadinessDeltaValue {
  skill_id: string;
  before_pct: number;
  after_pct: number;
}

export function ReadinessDelta({ delta }: { delta: ReadinessDeltaValue | null | undefined }) {
  if (!delta) return null;
  const improved = delta.after_pct > delta.before_pct;
  const skillLabel = delta.skill_id.replace(/-/g, ' ');

  return (
    <p
      aria-live="polite"
      style={{
        margin: 0,
        paddingTop: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        color: improved ? 'var(--green-ink)' : 'var(--text-secondary)',
        fontSize: 'var(--text-subhead)',
      }}
    >
      {improved && <TrendingUp size={14} style={{ flexShrink: 0 }} aria-hidden="true" />}
      <span style={{ textTransform: 'capitalize' }}>{skillLabel}</span>
      <span>
        skill readiness: {delta.before_pct}% → {delta.after_pct}%
      </span>
    </p>
  );
}
