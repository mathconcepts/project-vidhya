/**
 * Regression (/investigate, 2026-08-30): a modern-catalog item reached
 * through the legacy topic browser (gate-topics-modern-bridge.ts) has no
 * correct_answer in its /api/problems/id/:id response by design — this
 * page's grading is an unsafe client-side string compare, so it must hand
 * off to the real, server-graded /attempt/:id flow instead of rendering
 * an answer form with nothing to check against.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('@/hooks/useApi', () => ({ apiFetch: vi.fn() }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));

function jsonPromise<T>(body: T): Promise<T> {
  return Promise.resolve(body);
}

async function renderAt(problemId: string) {
  const Page = (await import('./PracticePage')).default;
  return render(
    <MemoryRouter initialEntries={[`/practice/${problemId}`]}>
      <Routes>
        <Route path="/practice/:problemId" element={<Page />} />
        <Route path="/attempt/:objectId" element={<div>Attempt page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PracticePage — modern-catalog handoff', () => {
  it('REGRESSION: redirects to /attempt/:id when the fetched problem has no correct_answer', async () => {
    const { apiFetch } = await import('@/hooks/useApi');
    vi.mocked(apiFetch).mockReturnValue(jsonPromise({
      problem: {
        id: 'pi-matrix-operations-001',
        year: null,
        question_text: 'What is 2+2?',
        topic: 'linear-algebra',
        difficulty: 'easy',
        marks: 1,
        source: 'modern_catalog',
        // no correct_answer, no options — matches the real response shape
      },
    }));

    const { getByText } = await renderAt('pi-matrix-operations-001');

    await waitFor(() => expect(getByText('Attempt page')).toBeInTheDocument());
  });

  it('renders the legacy answer form as before when correct_answer IS present', async () => {
    const { apiFetch } = await import('@/hooks/useApi');
    vi.mocked(apiFetch).mockReturnValue(jsonPromise({
      problem: {
        id: 'la-001',
        year: 2020,
        question_text: 'A legacy PYQ question?',
        options: { A: 'one', B: 'two', C: 'three', D: 'four' },
        correct_answer: 'B',
        explanation: 'because',
        topic: 'linear-algebra',
        difficulty: 'easy',
        marks: 1,
      },
    }));

    const { getByText, queryByText } = await renderAt('la-001');

    await waitFor(() => expect(getByText('A legacy PYQ question?')).toBeInTheDocument());
    expect(queryByText('Attempt page')).toBeNull();
  });
});
