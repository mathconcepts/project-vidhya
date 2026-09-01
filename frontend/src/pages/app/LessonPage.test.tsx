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
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
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

// ============================================================================
// Cross-concept isolation (adversarial review, /ship 2026-09-01)
// ============================================================================
//
// Locks in the invariant the adversarial reviewer raised: AtomCardRenderer's
// per-concept session state (errorStreak, the auto-modality-switch one-shot
// ref, the carousel index) must never leak from one concept into the next
// after an in-app navigation. Confirmed by direct experiment (temporarily
// removing LessonPage.tsx's `key={concept_id}` and re-running this exact
// test) that the invariant ALREADY holds today for an independent reason:
// LessonPage's own `if (loading) return <Loader2 .../>` early-return
// unmounts the whole atom-stack subtree on every concept_id change (the
// compose-fetch effect sets `loading=true` first), which resets
// AtomCardRenderer's state regardless of any key — this test passed
// identically with the key present or absent. `key={concept_id}` is kept
// as defense-in-depth (see the comment at its call site), so this test
// stays valuable as a behavioral lock on the invariant itself, not as a
// test of that one prop.

function makeAtom(conceptId: string, suffix: string, overrides: Record<string, unknown> = {}) {
  return {
    id: `${conceptId}.${suffix}`,
    concept_id: conceptId,
    atom_type: 'micro_exercise',
    bloom_level: 2,
    difficulty: 0.2,
    exam_ids: ['*'],
    content: `${conceptId} ${suffix}`,
    ...overrides,
  };
}

function makeLesson(conceptId: string, label: string) {
  return {
    concept_id: conceptId,
    concept_label: label,
    topic: 'linear-algebra',
    components: [],
    atoms: [
      makeAtom(conceptId, 'hook', { atom_type: 'hook', modality: 'text', content: `${conceptId} hook card` }),
      makeAtom(conceptId, 'q1', { content: `${conceptId} Q1` }),
      makeAtom(conceptId, 'q2', { content: `${conceptId} Q2` }),
      makeAtom(conceptId, 'q3', { content: `${conceptId} Q3` }),
      makeAtom(conceptId, 'visual', { atom_type: 'visual_analogy', modality: 'visual', content: `${conceptId} visual card` }),
    ],
    estimated_minutes: 5,
    difficulty_base: 0.3,
    quality_score: 1,
    sources: [],
    personalization_applied: [],
    is_revisit: false,
  };
}

const LESSON_A = makeLesson('concept-a', 'Concept A');
const LESSON_B = makeLesson('concept-b', 'Concept B');

function mockFetchTwoConceptsByBody() {
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/api/lesson/compose')) {
      const body = init?.body ? JSON.parse(init.body as string) : {};
      const lesson = body.concept_id === 'concept-b' ? LESSON_B : LESSON_A;
      return jsonResponse(lesson);
    }
    if (url.includes('/api/lesson/walkthrough/')) {
      return jsonResponse({
        concept_id: 'x', label: 'x',
        legs: {
          explanation: { available: true, atom_count: 1 },
          interactive: { available: false, count: 0 },
          practice: { available: false, item_count: 0, first_object_id: null },
          test: { available: false, question_count: 0 },
        },
      });
    }
    if (url.includes('/api/exam/active')) return Promise.reject(new Error('no active exam in test'));
    if (url.includes('/api/auth/config')) return jsonResponse({ intent_lanes: false });
    if (url.includes('/api/lesson/engagement')) return jsonResponse({});
    return Promise.reject(new Error(`unexpected fetch: ${url}`));
  });
}

/** Renders LessonPage behind an in-app nav trigger so a click causes a
 *  route-param change WITHOUT remounting the MemoryRouter tree — the exact
 *  shape of a real concept-to-concept navigation. */
function NavHarness() {
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate('/lesson/concept-b')}>go-to-concept-b</button>
      <Routes>
        <Route path="/lesson/:concept_id" element={<LessonPage />} />
      </Routes>
    </>
  );
}

function renderWithNav() {
  return render(
    <MemoryRouter initialEntries={['/lesson/concept-a']}>
      <NavHarness />
    </MemoryRouter>,
  );
}

describe('LessonPage — AtomCardRenderer remounts fresh on concept change', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchTwoConceptsByBody());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('a streak tripped on concept A does not leak into concept B after in-app navigation', async () => {
    renderWithNav();

    await waitFor(() => expect(screen.getByText('concept-a hook card')).toBeInTheDocument());

    // Drive concept A to the auto-switch (3 consecutive misses).
    fireEvent.click(screen.getByLabelText('Next')); // -> q1
    await waitFor(() => expect(screen.getByText('concept-a Q1')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet'));
    await waitFor(() => expect(screen.getByText('concept-a Q2')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet'));
    await waitFor(() => expect(screen.getByText('concept-a Q3')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet')); // miss 3 — A's auto-switch fires
    await waitFor(() => expect(screen.getByText('concept-a visual card')).toBeInTheDocument());
    expect(screen.getByText(/streak switched modality/)).toBeInTheDocument();

    // Turn the (intentionally global, persisted) visual-mode preference
    // back off before navigating, isolating what this test is actually
    // about: does errorStreak/the one-shot switch ref leak across
    // concepts, independent of the separately-persisted display
    // preference (which is SUPPOSED to carry over, by design).
    fireEvent.click(screen.getByLabelText('Show all atoms'));
    await waitFor(() => expect(screen.getByText('concept-a hook card')).toBeInTheDocument());

    // In-app navigation to a DIFFERENT concept — LessonPage re-renders, it
    // does not remount (only the route param changed).
    fireEvent.click(screen.getByText('go-to-concept-b'));

    // Concept B must open on its own first (unreordered) card — not
    // force-jumped into visual mode, and not silently carrying a "streak
    // already tripped" claim it never earned.
    await waitFor(() => expect(screen.getByText('concept-b hook card')).toBeInTheDocument());
    expect(screen.queryByText('concept-b visual card')).not.toBeInTheDocument();
    expect(screen.queryByText(/streak switched modality/)).not.toBeInTheDocument();

    // And B's OWN future switch must still work — proving the one-shot ref
    // reset on remount rather than staying stuck "already used" from A.
    fireEvent.click(screen.getByLabelText('Next')); // -> q1
    await waitFor(() => expect(screen.getByText('concept-b Q1')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet'));
    await waitFor(() => expect(screen.getByText('concept-b Q2')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet'));
    await waitFor(() => expect(screen.getByText('concept-b Q3')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Not yet')); // miss 3 on B, from a clean slate
    await waitFor(() => expect(screen.getByText('concept-b visual card')).toBeInTheDocument());
  });
});
