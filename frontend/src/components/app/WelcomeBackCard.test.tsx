/**
 * WelcomeBackCard tests.
 *
 * Critical path — the lapse detection logic has multiple branches and
 * one easy-to-mis-handle silent failure mode (new user with no attempts
 * appearing as lapsed). T7 added the account-age guard; these tests pin
 * it down.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WelcomeBackCard, _testHelpers } from './WelcomeBackCard';

const FIVE_DAYS_AGO = () => new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString();
const TEN_HOURS_AGO = () => new Date(Date.now() - 10 * 3600 * 1000).toISOString();
const FOUR_DAYS_AGO = () => new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString();
const ONE_HOUR_AGO = () => new Date(Date.now() - 1 * 3600 * 1000).toISOString();

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('WelcomeBackCard.computeLapse', () => {
  it('returns lapsed=false for brand-new account regardless of attempts', () => {
    const result = _testHelpers.computeLapse(
      { recent_attempts: [] },
      { created_at: ONE_HOUR_AGO() },
    );
    expect(result.lapsed).toBe(false);
  });

  it('returns lapsed=false for old account with empty attempts but no exam_id', () => {
    const result = _testHelpers.computeLapse(
      { recent_attempts: [], user: {} },
      { created_at: FIVE_DAYS_AGO() },
    );
    expect(result.lapsed).toBe(false);
  });

  it('returns lapsed=true for old account with empty attempts AND exam_id (onboarded but never practiced)', () => {
    const result = _testHelpers.computeLapse(
      { recent_attempts: [], user: { exam_id: 'gate-ma' } },
      { created_at: FIVE_DAYS_AGO() },
    );
    expect(result.lapsed).toBe(true);
  });

  it('returns lapsed=false for active user (latest attempt within 48h)', () => {
    const result = _testHelpers.computeLapse(
      { recent_attempts: [{ timestamp: TEN_HOURS_AGO() }] },
      { created_at: FIVE_DAYS_AGO() },
    );
    expect(result.lapsed).toBe(false);
  });

  it('returns lapsed=true for stale user (latest attempt >48h)', () => {
    const result = _testHelpers.computeLapse(
      { recent_attempts: [{ timestamp: FOUR_DAYS_AGO() }] },
      { created_at: FIVE_DAYS_AGO() },
    );
    expect(result.lapsed).toBe(true);
    expect(result.daysAway).toBeGreaterThanOrEqual(2);
  });

  it('handles attempted_at field as fallback for timestamp', () => {
    const result = _testHelpers.computeLapse(
      { recent_attempts: [{ attempted_at: FOUR_DAYS_AGO() }] },
      { created_at: FIVE_DAYS_AGO() },
    );
    expect(result.lapsed).toBe(true);
  });

  it('returns lapsed=false when summary or user is null', () => {
    expect(_testHelpers.computeLapse(null, null).lapsed).toBe(false);
    expect(_testHelpers.computeLapse({ recent_attempts: [] }, null).lapsed).toBe(false);
    expect(_testHelpers.computeLapse(null, { created_at: FIVE_DAYS_AGO() }).lapsed).toBe(false);
  });

  it('returns lapsed=false for malformed timestamp', () => {
    const result = _testHelpers.computeLapse(
      { recent_attempts: [{ timestamp: 'not-a-date' }] },
      { created_at: FIVE_DAYS_AGO() },
    );
    expect(result.lapsed).toBe(false);
  });
});

describe('WelcomeBackCard render', () => {
  it('renders nothing for non-lapsed user', () => {
    const { container } = wrap(
      <WelcomeBackCard
        summary={{ recent_attempts: [{ timestamp: TEN_HOURS_AGO() }] }}
        user={{ created_at: FIVE_DAYS_AGO() }}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders welcome-back copy for lapsed user, with topic from weak_concepts_preview', () => {
    wrap(
      <WelcomeBackCard
        summary={{
          recent_attempts: [{ timestamp: FOUR_DAYS_AGO() }],
          mastery: { weak_concepts_preview: [{ concept_id: 'linear-algebra', score: 0.3 }] },
        }}
        user={{ created_at: FIVE_DAYS_AGO() }}
      />,
    );
    // Both the headline and the CTA mention the topic — confirm at least one
    // appearance (full match would require getAllByText).
    expect(screen.getAllByText(/Linear Algebra/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Welcome back/i)).not.toBeInTheDocument(); // AI-slop blacklist guard
  });

  it('falls back to generic copy when no weak_concepts_preview is available', () => {
    wrap(
      <WelcomeBackCard
        summary={{ recent_attempts: [{ timestamp: FOUR_DAYS_AGO() }] }}
        user={{ created_at: FIVE_DAYS_AGO() }}
      />,
    );
    expect(screen.getByText(/Your plan's still here/)).toBeInTheDocument();
  });

  it('uses recent_attempts[last].concept_id over weak_concepts_preview', () => {
    wrap(
      <WelcomeBackCard
        summary={{
          recent_attempts: [{ timestamp: FOUR_DAYS_AGO(), concept_id: 'probability' }],
          mastery: { weak_concepts_preview: [{ concept_id: 'linear-algebra', score: 0.3 }] },
        }}
        user={{ created_at: FIVE_DAYS_AGO() }}
      />,
    );
    expect(screen.getAllByText(/Probability/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Linear Algebra/)).not.toBeInTheDocument();
  });
});
