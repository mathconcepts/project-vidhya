/**
 * Regression: the placeholder diagnosis must not render as insight.
 *
 * `classifyError` (src/gbrain/error-taxonomy.ts) has three fallback paths
 * that all return a shape that looks like a diagnosis but says nothing:
 * no LLM configured ("The answer was incorrect", "The approach may have
 * seemed reasonable", "The specific error needs further analysis", marker
 * `unclassified`), the LLM returning no text, and the LLM returning bad
 * JSON (both of the latter: "The answer was incorrect. Error
 * classification unavailable.", marker `classification-failed`). The panel
 * then renders that filler under headings like "Why this was tempting",
 * which tells the student the product analysed their mistake when it did
 * not.
 *
 * Nothing is the honest output there. `unclassified` and
 * `classification-failed` are the two markers distinguishing filler from a
 * real diagnosis, so both are what the guard keys on (/investigate,
 * 2026-09-02 — the guard originally checked only `unclassified`, so a real
 * LLM hiccup or JSON-parse failure still leaked "Conceptual Gap — Error
 * classification unavailable" to the student as if it were real analysis).
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

const CLASSIFICATION_FAILED = {
  error_type: 'conceptual',
  concept_id: 'unknown',
  misconception_id: 'classification-failed',
  diagnosis: 'The answer was incorrect. Error classification unavailable.',
  why_tempting: '',
  why_wrong: '',
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

  it('renders nothing for the classification-failed fallback (LLM call/parse failure)', () => {
    const { container } = render(<ErrorDiagnosis diagnosis={CLASSIFICATION_FAILED} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(/classification unavailable/i)).toBeNull();
  });

  it('still renders a real diagnosis', () => {
    // The guard must be narrow. Suppressing a genuine diagnosis would trade
    // one silent failure for another.
    render(<ErrorDiagnosis diagnosis={REAL} />);
    expect(screen.getByText(/Read the trace as one of the eigenvalues/i)).toBeInTheDocument();
  });
});
