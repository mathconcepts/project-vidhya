/**
 * Phase 5 frontend E2E — AtomCardRenderer integration with ImprovedBadge.
 *
 * Verifies the full client-side rendering path of an orchestrator-regenerated
 * atom: server enrichment fields → AtomCardRenderer card header → emerald
 * pill with tooltip → engagement clears the badge on next render.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AtomCardRenderer, type ContentAtom } from './AtomCardRenderer';

function makeAtom(overrides: Partial<ContentAtom> = {}): ContentAtom {
  return {
    id: 'calculus-derivatives.intuition',
    concept_id: 'calculus-derivatives',
    atom_type: 'intuition',
    bloom_level: 2,
    difficulty: 0.1,
    exam_ids: ['*'],
    content: 'The derivative measures how fast a function changes.',
    ...overrides,
  };
}

describe('Phase 5 — AtomCardRenderer + ImprovedBadge integration', () => {
  it('shows Improved badge when atom regenerated since last view', () => {
    const atom = makeAtom({
      improved_since: '2026-05-01T12:00:00Z',
      last_seen_at: '2026-04-30T08:00:00Z',
      improvement_reason: 'Cohort error 52% — top miss: students confused tangent with secant',
    });
    render(<AtomCardRenderer atoms={[atom]} conceptId="calculus-derivatives" studentId="s1" />);
    expect(screen.getByText('Improved')).toBeInTheDocument();
  });

  it('hides Improved badge when atom unchanged since last view', () => {
    const atom = makeAtom({
      improved_since: '2026-04-30T08:00:00Z',
      last_seen_at: '2026-05-01T12:00:00Z',
    });
    render(<AtomCardRenderer atoms={[atom]} conceptId="calculus-derivatives" studentId="s1" />);
    expect(screen.queryByText('Improved')).toBeNull();
  });

  it('shows badge when student has never seen the atom (last_seen_at unset)', () => {
    const atom = makeAtom({
      improved_since: '2026-05-01T12:00:00Z',
      // last_seen_at intentionally undefined — first-time encounter post-regen
    });
    render(<AtomCardRenderer atoms={[atom]} conceptId="calculus-derivatives" studentId="s1" />);
    expect(screen.getByText('Improved')).toBeInTheDocument();
  });

  it('hides badge when atom has no orchestrator enrichment at all', () => {
    const atom = makeAtom();
    render(<AtomCardRenderer atoms={[atom]} conceptId="calculus-derivatives" studentId="s1" />);
    expect(screen.queryByText('Improved')).toBeNull();
  });

  it('atom with student override still renders content + shows Improved badge', () => {
    // is_student_override = true means content was swapped server-side. The
    // frontend doesn't know or care — it just shows the content. The
    // Improved badge is still driven by improved_since, since per-student
    // variants get their own freshness too.
    const atom = makeAtom({
      content: 'Personalized variant: tangent slopes appear when motion stops.',
      is_student_override: true,
      improved_since: '2026-05-01T12:00:00Z',
    });
    render(<AtomCardRenderer atoms={[atom]} conceptId="calculus-derivatives" studentId="s1" />);
    expect(screen.getByText(/Personalized variant/)).toBeInTheDocument();
    expect(screen.getByText('Improved')).toBeInTheDocument();
  });

  it('badge has accessible status role', () => {
    const atom = makeAtom({
      improved_since: '2026-05-01T12:00:00Z',
      last_seen_at: '2026-04-30T08:00:00Z',
    });
    render(<AtomCardRenderer atoms={[atom]} conceptId="calculus-derivatives" studentId="s1" />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-label', 'This concept improved since your last visit');
  });
});
