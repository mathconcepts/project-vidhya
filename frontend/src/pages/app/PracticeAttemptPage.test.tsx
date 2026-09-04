/**
 * PracticeAttemptPage — selected-state + a11y coverage (T24, §11
 * "Interaction states" a11y line: "fix the existing selected-state no-op
 * ternary, PracticeAttemptPage:296, and give selection a real
 * --surface-fill+border-color change").
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useSearchParams } from 'react-router-dom';

// Echoes the query string so tests can assert the wizard link carries
// concept/mistake context (/investigate, 2026-09-03), without needing the
// real TheoremWizardPage/DistributionSelectorPage wired into this test.
function WizardStub({ label }: { label: string }) {
  const [params] = useSearchParams();
  return <div>{label} concept={params.get('concept') ?? ''} mistake={params.get('mistake') ?? ''}</div>;
}

vi.mock('@/lib/auth/client', () => ({ authFetch: vi.fn() }));
vi.mock('@/lib/demoPersona', () => ({ setDemoOutcome: vi.fn() }));

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response;
}

const MCQ_ITEM = {
  id: 'obj-1',
  node_id: 'matrix-operations',
  topic: 'Matrix operations',
  question_text: 'What is 2 + 2?',
  est_minutes: 2,
  gradable: true,
  question_type: 'mcq' as const,
  marks: 1,
  options: ['3', '4', '5'],
  marking: { marks_correct: 1, marks_wrong: 0.33 },
  not_gradable_reason: null,
};

async function renderPage() {
  const Page = (await import('./PracticeAttemptPage')).default;
  return render(
    <MemoryRouter initialEntries={['/attempt/obj-1']}>
      <Routes>
        <Route path="/attempt/:objectId" element={<Page />} />
        <Route path="/lesson/:conceptId" element={<div>LESSON PAGE: matrix-operations</div>} />
        <Route path="/smart-practice" element={<div>SMART PRACTICE PAGE</div>} />
        <Route path="/theorem-wizard/:module" element={<WizardStub label="THEOREM WIZARD" />} />
        <Route path="/distribution-selector" element={<WizardStub label="DISTRIBUTION SELECTOR" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PracticeAttemptPage — option selection', () => {
  it('gives the mcq options a real radiogroup/radio a11y contract', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockResolvedValue(jsonResponse(MCQ_ITEM));
    await renderPage();

    await waitFor(() => expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument());
    expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    const options = screen.getAllByRole('radio');
    expect(options).toHaveLength(3);
    options.forEach((opt) => expect(opt).toHaveAttribute('aria-checked', 'false'));
  });

  it('gives a selected option a real visual change, not the former no-op ternary', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockResolvedValue(jsonResponse(MCQ_ITEM));
    await renderPage();

    await waitFor(() => expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument());
    const options = screen.getAllByRole('radio');
    const unselectedBackground = options[1].style.background;

    fireEvent.click(options[1]);

    expect(options[1]).toHaveAttribute('aria-checked', 'true');
    // The pre-fix code set the SAME value ('var(--surface-fill)') on both
    // branches of the ternary — selecting an option must now visibly change
    // both the background and the border color.
    expect(options[1].style.background).not.toBe(unselectedBackground);
    expect(options[1].style.background).toContain('surface-fill');
    expect(options[0].style.background).not.toContain('surface-fill');
  });

  it('supports arrow-key navigation across options', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockResolvedValue(jsonResponse(MCQ_ITEM));
    await renderPage();

    await waitFor(() => expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument());
    const options = screen.getAllByRole('radio');
    options[0].focus();
    expect(document.activeElement).toBe(options[0]);

    fireEvent.keyDown(options[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(options[1]);

    fireEvent.keyDown(options[1], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(options[0]);

    // Wraps around at the ends.
    fireEvent.keyDown(options[0], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(options[2]);
  });
});

// Regression (/investigate, 2026-08-30): POST /api/practice/attempt has
// shipped an honest `failure_tag` since W3.4 (practice-routes.ts's
// failureTagForWrongPick — "the ONE place a failure tag is allowed to
// reach the client... strictly after grading, for the option the student
// actually chose"), but this page never read the field, so a student who
// picked a well-known wrong answer never learned that's what it was.
describe('PracticeAttemptPage — common-mistake callout', () => {
  it('shows the plain-language common-trap label when the server names a failure_tag on a wrong pick', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch)
      .mockResolvedValueOnce(jsonResponse(MCQ_ITEM))
      .mockResolvedValueOnce(jsonResponse({
        grade: { earned: 0, max: 1, correct: false, feedback: 'Not quite.' },
        marking: { marks_correct: 1, marks_wrong: 0.33 },
        solution_steps: [],
        recorded: true,
        xp_minutes_awarded: null,
        failure_tag: 'sign',
      }));
    await renderPage();

    await waitFor(() => expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => expect(screen.getByText(/Not this time/)).toBeInTheDocument());
    expect(screen.getByText(/Common trap: a sign error/)).toBeInTheDocument();
  });

  it('does not show the callout on a correct answer, even if a stray failure_tag were present', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch)
      .mockResolvedValueOnce(jsonResponse(MCQ_ITEM))
      .mockResolvedValueOnce(jsonResponse({
        grade: { earned: 1, max: 1, correct: true, feedback: 'Nice work.' },
        marking: { marks_correct: 1, marks_wrong: 0.33 },
        solution_steps: [],
        recorded: true,
        xp_minutes_awarded: 1,
        failure_tag: null,
      }));
    await renderPage();

    await waitFor(() => expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('radio')[1]);
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => expect(screen.getByText(/^Correct/)).toBeInTheDocument());
    expect(screen.queryByText(/Common trap/)).toBeNull();
  });

  it('does not show the callout on a wrong answer when the server has no failure_tag for it', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch)
      .mockResolvedValueOnce(jsonResponse(MCQ_ITEM))
      .mockResolvedValueOnce(jsonResponse({
        grade: { earned: 0, max: 1, correct: false, feedback: 'Not quite.' },
        marking: { marks_correct: 1, marks_wrong: 0.33 },
        solution_steps: [],
        recorded: true,
        xp_minutes_awarded: null,
        failure_tag: null,
      }));
    await renderPage();

    await waitFor(() => expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => expect(screen.getByText(/Not this time/)).toBeInTheDocument());
    expect(screen.queryByText(/Common trap/)).toBeNull();
  });

  it('falls back to the raw tag when an ErrorTag has no plain-language label yet', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch)
      .mockResolvedValueOnce(jsonResponse(MCQ_ITEM))
      .mockResolvedValueOnce(jsonResponse({
        grade: { earned: 0, max: 1, correct: false, feedback: 'Not quite.' },
        marking: { marks_correct: 1, marks_wrong: 0.33 },
        solution_steps: [],
        recorded: true,
        xp_minutes_awarded: null,
        failure_tag: 'some_future_tag',
      }));
    await renderPage();

    await waitFor(() => expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => expect(screen.getByText(/Common trap: some_future_tag/)).toBeInTheDocument());
  });
});

// Regression (/investigate, 2026-09-02): a wrong answer left the student
// with only a generic "What's next for me?" link — no concrete path to
// either re-learn the concept or try another problem on it.
describe('PracticeAttemptPage — post-wrong-answer next-move CTAs', () => {
  it('shows Explore this concept + Practice more like this on a wrong answer, routing both by node_id', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch)
      .mockResolvedValueOnce(jsonResponse(MCQ_ITEM))
      .mockResolvedValueOnce(jsonResponse({
        grade: { earned: 0, max: 1, correct: false, feedback: 'Not quite.' },
        marking: { marks_correct: 1, marks_wrong: 0.33 },
        solution_steps: [],
        recorded: true,
        xp_minutes_awarded: null,
        failure_tag: null,
      }));
    await renderPage();

    await waitFor(() => expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => expect(screen.getByText(/Not this time/)).toBeInTheDocument());
    expect(screen.getByText('Explore this concept')).toBeInTheDocument();
    expect(screen.getByText('Practice more like this')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Explore this concept'));
    await waitFor(() => expect(screen.getByText('LESSON PAGE: matrix-operations')).toBeInTheDocument());
  });

  it('"Practice more like this" routes to /smart-practice scoped to the concept', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch)
      .mockResolvedValueOnce(jsonResponse(MCQ_ITEM))
      .mockResolvedValueOnce(jsonResponse({
        grade: { earned: 0, max: 1, correct: false, feedback: 'Not quite.' },
        marking: { marks_correct: 1, marks_wrong: 0.33 },
        solution_steps: [],
        recorded: true,
        xp_minutes_awarded: null,
        failure_tag: null,
      }));
    await renderPage();

    await waitFor(() => expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => expect(screen.getByText(/Not this time/)).toBeInTheDocument());
    fireEvent.click(screen.getByText('Practice more like this'));
    await waitFor(() => expect(screen.getByText('SMART PRACTICE PAGE')).toBeInTheDocument());
  });

  // /investigate (2026-09-02): a correct answer used to hide BOTH CTAs, so
  // a student who got it right had no way to keep practicing the same
  // concept short of navigating away and re-searching for it. "Explore
  // this concept" stays hidden — it's remediation framing, backwards for
  // an answer the student just proved they know — but "Practice more like
  // this" now always shows.
  it('shows "Practice more like this" but not "Explore this concept" on a correct answer', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch)
      .mockResolvedValueOnce(jsonResponse(MCQ_ITEM))
      .mockResolvedValueOnce(jsonResponse({
        grade: { earned: 1, max: 1, correct: true, feedback: 'Nice work.' },
        marking: { marks_correct: 1, marks_wrong: 0.33 },
        solution_steps: [],
        recorded: true,
        xp_minutes_awarded: 1,
        failure_tag: null,
      }));
    await renderPage();

    await waitFor(() => expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('radio')[1]);
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => expect(screen.getByText(/^Correct/)).toBeInTheDocument());
    expect(screen.queryByText('Explore this concept')).toBeNull();
    expect(screen.getByText('Practice more like this')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Practice more like this'));
    await waitFor(() => expect(screen.getByText('SMART PRACTICE PAGE')).toBeInTheDocument());
  });

  it("gives the receipt neutral tone on a wrong answer so its checkmark doesn't read as correctness", async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch)
      .mockResolvedValueOnce(jsonResponse(MCQ_ITEM))
      .mockResolvedValueOnce(jsonResponse({
        grade: { earned: 0, max: 1, correct: false, feedback: 'Not quite.' },
        marking: { marks_correct: 1, marks_wrong: 0.33 },
        solution_steps: [],
        recorded: true,
        xp_minutes_awarded: null,
        failure_tag: null,
      }));
    await renderPage();

    await waitFor(() => expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => expect(screen.getByText(/Not this time/)).toBeInTheDocument());
    const receiptLabel = screen.getByText('✓').parentElement as HTMLElement;
    expect(receiptLabel.getAttribute('style')).not.toContain('--green-ink');
  });
});

// Regression (/investigate, 2026-09-03): a wrong answer on a linear-algebra
// item (e.g. spectral-theorem's eigenvalue-power questions) used to hand the
// student one canned solution and nothing else — the real branching
// method-selection wizard (which already covers this exact territory via
// its `la_power`/`la_definite` nodes) existed but was reachable only by
// typing its URL directly.
//
// A same-day follow-up found that stacking the wizard link ABOVE "Explore
// this concept" produced 3 buttons + a text link fighting for attention
// right after a miss — decision overload, against Vidhya Clarity's one-
// focal-action rule. Both buttons are "go learn" moves, so they now share
// one slot: the wizard wins only when the server's own diagnosis
// (`failure_tag`) says the miss WAS a method choice; every other wrong
// answer gets the concept lesson instead, never both.
describe('PracticeAttemptPage — method-selection wizard link (one learn-more slot)', () => {
  const LA_ITEM = { ...MCQ_ITEM, id: 'obj-la', topic: 'linear-algebra' };
  const LA_ITEM_TITLE_CASE = { ...MCQ_ITEM, id: 'obj-la2', topic: 'Linear Algebra' };
  const PS_ITEM = { ...MCQ_ITEM, id: 'obj-ps', topic: 'probability-statistics' };
  // Micro-solver wave 2 (2026-09-04) gave every one of the 10 GATE-EM topic
  // families a trainer — complex-variables (this test's old example) is now
  // mapped, so "unmapped" needs a topic string with genuinely no trainer,
  // never a real subject that happens not to be covered yet.
  const UNMAPPED_ITEM = { ...MCQ_ITEM, id: 'obj-unmapped', topic: 'some-topic-with-no-trainer' };

  async function submitWrong(item: typeof MCQ_ITEM, failureTag: string | null) {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch)
      .mockResolvedValueOnce(jsonResponse(item))
      .mockResolvedValueOnce(jsonResponse({
        grade: { earned: 0, max: 1, correct: false, feedback: 'Not quite.' },
        marking: { marks_correct: 1, marks_wrong: 0.33 },
        solution_steps: [],
        recorded: true,
        xp_minutes_awarded: null,
        failure_tag: failureTag,
      }));
    await renderPage();
    await waitFor(() => expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('radio')[0]);
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => expect(screen.getByText(/Not this time/)).toBeInTheDocument());
  }

  it('links a method-selection miss on a linear-algebra item to the theorem wizard, not the lesson', async () => {
    await submitWrong(LA_ITEM, 'method_selection');
    expect(screen.queryByText('Explore this concept')).toBeNull();
    const link = screen.getByText(/Which method applies/);
    fireEvent.click(link);
    await waitFor(() => expect(screen.getByText(/THEOREM WIZARD/)).toBeInTheDocument());
  });

  it('carries the concept and mistake label into the wizard link so it connects to the actual problem', async () => {
    await submitWrong(LA_ITEM, 'method_selection');
    fireEvent.click(screen.getByText(/Which method applies/));
    await waitFor(() =>
      expect(screen.getByText(`THEOREM WIZARD concept=${LA_ITEM.node_id} mistake=picking the wrong approach`)).toBeInTheDocument(),
    );
  });

  it('also treats the plain "method" tag as a method-selection miss', async () => {
    await submitWrong(LA_ITEM, 'method');
    expect(screen.getByText(/Which method applies/)).toBeInTheDocument();
    expect(screen.queryByText('Explore this concept')).toBeNull();
  });

  it('normalizes a title-case topic to the same slug', async () => {
    await submitWrong(LA_ITEM_TITLE_CASE, 'method_selection');
    expect(screen.getByText(/Which method applies/)).toBeInTheDocument();
  });

  it('links a method-selection miss on a probability-statistics item to the distribution selector', async () => {
    await submitWrong(PS_ITEM, 'method_selection');
    const link = screen.getByText(/Which method applies/);
    fireEvent.click(link);
    await waitFor(() => expect(screen.getByText(/DISTRIBUTION SELECTOR/)).toBeInTheDocument());
  });

  it('falls back to "Explore this concept" for a non-method miss, even on a topic with a trainer', async () => {
    await submitWrong(LA_ITEM, 'sign');
    expect(screen.queryByText(/Which method applies/)).toBeNull();
    expect(screen.getByText('Explore this concept')).toBeInTheDocument();
  });

  it('falls back to "Explore this concept" when the server has no diagnosis at all', async () => {
    await submitWrong(LA_ITEM, null);
    expect(screen.queryByText(/Which method applies/)).toBeNull();
    expect(screen.getByText('Explore this concept')).toBeInTheDocument();
  });

  it('shows no wizard link for a topic with no trainer, even on a method-selection miss', async () => {
    await submitWrong(UNMAPPED_ITEM, 'method_selection');
    expect(screen.queryByText(/Which method applies/)).toBeNull();
    expect(screen.getByText('Explore this concept')).toBeInTheDocument();
  });

  it('never shows the wizard link on a correct answer', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch)
      .mockResolvedValueOnce(jsonResponse(LA_ITEM))
      .mockResolvedValueOnce(jsonResponse({
        grade: { earned: 1, max: 1, correct: true, feedback: 'Nice work.' },
        marking: { marks_correct: 1, marks_wrong: 0.33 },
        solution_steps: [],
        recorded: true,
        xp_minutes_awarded: 1,
        failure_tag: 'method_selection',
      }));
    await renderPage();
    await waitFor(() => expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('radio')[1]);
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => expect(screen.getByText(/^Correct/)).toBeInTheDocument());
    expect(screen.queryByText(/Which method applies/)).toBeNull();
    expect(screen.queryByText('Explore this concept')).toBeNull();
  });
});

// Regression (/design-review, 2026-09-04, live QA: "static text, no motion" on
// the solution-steps panel): solution_steps used to render as a plain
// `<ol><li>` of raw strings — no KaTeX, no motion. Now routed through
// MarkdownAtomRenderer with `structured`, matching every other structured
// list in the app.
describe('PracticeAttemptPage — solution_steps rendering', () => {
  async function submitWithSteps(steps: string[], correct = true) {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch)
      .mockResolvedValueOnce(jsonResponse(MCQ_ITEM))
      .mockResolvedValueOnce(jsonResponse({
        grade: { earned: correct ? 1 : 0, max: 1, correct, feedback: correct ? 'Nice work.' : 'Not quite.' },
        marking: { marks_correct: 1, marks_wrong: 0.33 },
        solution_steps: steps,
        recorded: true,
        xp_minutes_awarded: correct ? 1 : null,
        failure_tag: null,
      }));
    await renderPage();
    await waitFor(() => expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('radio')[correct ? 1 : 0]);
    fireEvent.click(screen.getByText('Submit'));
    await waitFor(() => expect(screen.getByText(correct ? /^Correct/ : /Not this time/)).toBeInTheDocument());
  }

  it('renders each step as a hairline-separated structured row, not a bare <ol><li>', async () => {
    await submitWithSteps(['D1 = 4 > 0.', 'D2 = det(A) = 4·3 - 2·2 = 8 > 0.']);
    expect(screen.getByText(/D1 = 4 > 0\./)).toBeInTheDocument();
    expect(screen.getByText(/D2 = det\(A\)/)).toBeInTheDocument();
    // MarkdownAtomRenderer's structured mode renders an actual <ol>/<li> list
    // (list-style handled in CSS, not by dropping the semantic list markup).
    const items = screen.getAllByRole('listitem');
    expect(items.length).toBe(2);
    // No bare, unstyled <ol> left over from the old plain-string rendering.
    expect(document.querySelector('ol[style]')).toBeNull();
  });

  it('typesets a LaTeX-authored step through KaTeX instead of leaking raw source', async () => {
    await submitWithSteps(['By Sylvester\'s criterion, $D_1 > 0$ and $D_2 > 0$.'], false);
    // A raw, unrendered "$D_1 > 0$" string would still contain the literal
    // dollar signs — KaTeX output does not.
    expect(screen.queryByText(/\$D_1/)).toBeNull();
    expect(document.querySelector('.katex')).not.toBeNull();
  });

  it('shows nothing extra when solution_steps is empty', async () => {
    await submitWithSteps([]);
    expect(screen.queryAllByRole('listitem').length).toBe(0);
  });
});
