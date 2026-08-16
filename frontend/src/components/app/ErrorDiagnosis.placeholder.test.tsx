/**
 * Regression: the placeholder diagnosis must not render as insight.
 *
 * When no LLM is configured, `classifyError` returns a shape that looks like a
 * diagnosis but says nothing: "The answer was incorrect", "The approach may
 * have seemed reasonable", "The specific error needs further analysis". The
 * panel then renders that filler under headings like "Why this was tempting",
 * which tells the student the product analysed their mistake when it did not.
 *
 * Nothing is the honest output there. `unclassified` is the marker the
 * fallback sets, and it is the one thing distinguishing filler from a real
 * diagnosis, so it is what the guard keys on.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorDiagnosis } from './ErrorDiagnosis';

const PLACEHOLDER = {
  error_type: 'conceptual',
  concept_id: 'unknown',
  misconception_id: 'unclassified',
  diagnosis: 'The answer was incorrect.',
  why_tempting: 'The approach may have seemed reasonable.',
  why_wrong: 'The specific error needs further analysis.',
  corrective_hint: 'Review the core concept and try again.',
} as any;

const REAL = {
  error_type: 'conceptual',
  concept_id: 'eigenvalues',
  misconception_id: 'm_trace_is_an_eigenvalue',
  diagnosis: 'Read the trace as one of the eigenvalues.',
  why_tempting: 'The trace is the sum of the eigenvalues, so it sits nearby.',
  why_wrong: 'The sum of the roots is not itself a root.',
  corrective_hint: 'Solve the characteristic quadratic instead.',
} as any;

describe('ErrorDiagnosis placeholder suppression', () => {
  it('renders nothing for the unclassified fallback', () => {
    const { container } = render(<ErrorDiagnosis diagnosis={PLACEHOLDER} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('does not leak the filler copy anywhere on screen', () => {
    render(<ErrorDiagnosis diagnosis={PLACEHOLDER} />);
    expect(screen.queryByText(/needs further analysis/i)).toBeNull();
    expect(screen.queryByText(/may have seemed reasonable/i)).toBeNull();
  });

  it('still renders a real diagnosis', () => {
    // The guard must be narrow. Suppressing a genuine diagnosis would trade
    // one silent failure for another.
    render(<ErrorDiagnosis diagnosis={REAL} />);
    expect(screen.getByText(/Read the trace as one of the eigenvalues/i)).toBeInTheDocument();
  });
});
