/**
 * LessonPage — scrollToRail wiring.
 *
 * Pre-landing review finding (/ship, 2026-09-01): the practice-CTA fix
 * (ProblemStatementBlock's `onSeeWhatsNext` handed off to WalkthroughRail
 * via a new `railRef`/`scrollToRail` callback) had no test — there was no
 * LessonPage.test.tsx at all. This is the first one; it covers just the
 * new wiring, not a general LessonPage suite.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import LessonPage from './LessonPage';

const ATOM = {
  id: 'eigenvalues.hook',
  concept_id: 'eigenvalues',
  atom_type: 'hook',
  bloom_level: 1,
  difficulty: 0,
  exam_ids: ['*'],
  content: 'The hook card body.',
};

const LESSON = {
  concept_id: 'eigenvalues',
  concept_label: 'Eigenvalues',
  topic: 'linear-algebra',
  components: [],
  atoms: [ATOM],
  estimated_minutes: 5,
  difficulty_base: 0.3,
  quality_score: 1,
  sources: [],
  personalization_applied: [],
  is_revisit: false,
};

const WALKTHROUGH = {
  concept_id: 'eigenvalues',
  label: 'Eigenvalues',
  legs: {
    explanation: { available: true, atom_count: 1 },
    interactive: { available: false, count: 0 },
    practice: { available: true, item_count: 3, first_object_id: 'obj-1' },
    test: { available: true, question_count: 2 },
  },
};

function jsonResponse(body: unknown) {
  return Promise.resolve({ ok: true, status: 200, json: async () => body } as Response);
}

function mockFetchByUrl() {
  return vi.fn((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/api/lesson/compose')) return jsonResponse(LESSON);
    if (url.includes('/api/lesson/walkthrough/')) return jsonResponse(WALKTHROUGH);
    if (url.includes('/api/exam/active')) return Promise.reject(new Error('no active exam in test'));
    if (url.includes('/api/auth/config')) return jsonResponse({ intent_lanes: true });
    if (url.includes('/api/lesson/engagement')) return jsonResponse({});
    return Promise.reject(new Error(`unexpected fetch: ${url}`));
  });
}

function renderLessonPage() {
  return render(
    <MemoryRouter initialEntries={['/lesson/eigenvalues']}>
      <Routes>
        <Route path="/lesson/:concept_id" element={<LessonPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LessonPage — scrollToRail wiring', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchByUrl());
    // jsdom doesn't implement scrollIntoView — this is exactly what the
    // wiring under test is supposed to call.
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('scrolls to the WalkthroughRail when the DPS "see what\'s next" CTA is clicked', async () => {
    renderLessonPage();

    await waitFor(() => expect(screen.getByText('The hook card body.')).toBeInTheDocument());

    // Expand the DPS disclosure to reveal the framing-line CTA.
    const trigger = await screen.findByTestId('dps-more-trigger');
    fireEvent.click(trigger);

    const cta = await screen.findByTestId('dps-see-whats-next');
    (Element.prototype.scrollIntoView as ReturnType<typeof vi.fn>).mockClear();
    fireEvent.click(cta);

    expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
  });
});
