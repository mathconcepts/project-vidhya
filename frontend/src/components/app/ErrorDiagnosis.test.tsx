/**
 * ErrorDiagnosis.test.tsx
 *
 * Locks the weak-prerequisite -> wizard follow-up (2026-09-04): the
 * "Foundation gap detected" card gains a "Which method applies?" link when
 * the alerted concept resolves to a real wizard fork, and stays exactly as
 * it was (no link, no crash) when it doesn't.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ErrorDiagnosis } from './ErrorDiagnosis';

const DIAGNOSIS = {
  error_type: 'conceptual',
  concept_id: 'diagonalization',
  misconception_id: 'some-real-misconception',
  diagnosis: 'Picked the wrong route for A^100.',
  why_tempting: 'Multiplying A by itself 100 times seems direct.',
  why_wrong: 'That is computationally infeasible and misses the structure.',
  corrective_hint: 'Diagonalize A = PDP^-1 first.',
};

function renderDiagnosis(props: Partial<React.ComponentProps<typeof ErrorDiagnosis>> = {}) {
  return render(
    <MemoryRouter>
      <ErrorDiagnosis diagnosis={DIAGNOSIS} {...props} />
    </MemoryRouter>,
  );
}

describe('ErrorDiagnosis — foundation gap wizard link', () => {
  it('shows "Which method applies?" when the alerted concept has a wizard fork', () => {
    renderDiagnosis({
      prerequisiteAlerts: [{ concept: 'diagonalization', shaky_prereqs: ['eigenvalues'], severity: 'critical' }],
    });
    const link = screen.getByRole('link', { name: /Which method applies\?/ });
    expect(link).toHaveAttribute('href', '/theorem-wizard/linear-algebra?concept=diagonalization');
  });

  it('still shows the plain-language "Strengthen first" line either way', () => {
    renderDiagnosis({
      prerequisiteAlerts: [{ concept: 'diagonalization', shaky_prereqs: ['eigenvalues'], severity: 'critical' }],
    });
    expect(screen.getByText(/Strengthen first: eigenvalues/)).toBeInTheDocument();
  });

  it('omits the link when the alerted concept has no wizard fork', () => {
    renderDiagnosis({
      prerequisiteAlerts: [{ concept: 'vector-spaces', shaky_prereqs: ['linear-independence'], severity: 'warning' }],
    });
    expect(screen.getByText(/Strengthen first: linear independence/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Which method applies\?/ })).not.toBeInTheDocument();
  });

  it('renders neither the alert card nor the link when there are no prerequisite alerts', () => {
    renderDiagnosis({ prerequisiteAlerts: [] });
    expect(screen.queryByText(/Foundation gap detected/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Which method applies\?/ })).not.toBeInTheDocument();
  });
});
