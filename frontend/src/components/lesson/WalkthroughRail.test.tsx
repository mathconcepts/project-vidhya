/**
 * WalkthroughRail — the four-leg per-concept walkthrough rail.
 *
 * Covers: loading state, an honest unavailable state per leg (no dead
 * links — unavailable rows render with no click handler and no chevron),
 * an available state wiring the right tap targets (scroll-to-explanation,
 * jump-to-interactive, /attempt/:id, /checkpoint?concept=), the
 * client-truth gate on the Interactive leg (server says available but
 * this render has no jump target — must not be tappable), and the fetch
 * error state.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WalkthroughRail } from './WalkthroughRail';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({ ok, status: ok ? 200 : 500, json: async () => body } as Response);
}

const AVAILABLE_BODY = {
  concept_id: 'eigenvalues',
  label: 'Eigenvalues',
  legs: {
    explanation: { available: true, atom_count: 6 },
    interactive: { available: true, count: 2 },
    practice: { available: true, item_count: 4, first_object_id: 'obj-1' },
    test: { available: true, question_count: 3 },
  },
};

const UNAVAILABLE_BODY = {
  concept_id: 'eigenvalues',
  label: 'Eigenvalues',
  legs: {
    explanation: { available: false, atom_count: 0 },
    interactive: { available: false, count: 0 },
    practice: { available: false, item_count: 0, first_object_id: null },
    test: { available: false, question_count: 0 },
  },
};

function renderRail(props: Partial<React.ComponentProps<typeof WalkthroughRail>> = {}) {
  const onExplanationTap = vi.fn();
  const onInteractiveTap = vi.fn();
  render(
    <MemoryRouter>
      <WalkthroughRail
        conceptId="eigenvalues"
        onExplanationTap={onExplanationTap}
        onInteractiveTap={onInteractiveTap}
        interactiveJumpReady={true}
        {...props}
      />
    </MemoryRouter>,
  );
  return { onExplanationTap, onInteractiveTap };
}

beforeEach(() => {
  mockNavigate.mockReset();
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('WalkthroughRail', () => {
  it('shows a loading state before the fetch resolves', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {})); // never resolves
    renderRail();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows an honest error state when the fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'));
    renderRail();
    await waitFor(() => expect(screen.getByText(/couldn't load the next steps/i)).toBeInTheDocument());
  });

  it('shows an honest error state on a non-2xx response', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse({ error: 'boom' }, false));
    renderRail();
    await waitFor(() => expect(screen.getByText(/couldn't load the next steps/i)).toBeInTheDocument());
  });

  it('fetches the right endpoint for the given concept', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse(AVAILABLE_BODY));
    renderRail();
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/lesson/walkthrough/eigenvalues'));
  });

  it('every leg unavailable renders honest empty-state copy with no tap target', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse(UNAVAILABLE_BODY));
    renderRail();

    expect(await screen.findByText('No explanation authored yet')).toBeInTheDocument();
    expect(screen.getByText('No interactive figures for this concept yet')).toBeInTheDocument();
    expect(screen.getByText('No practice items for this concept yet')).toBeInTheDocument();
    expect(screen.getByText('No exam-style questions tagged for this concept yet')).toBeInTheDocument();

    // Unavailable rows render as non-interactive divs (ListRow: onClick unset → <div>, no chevron).
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('available legs render as tappable rows with the right counts', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse(AVAILABLE_BODY));
    renderRail();

    expect(await screen.findByText('6 cards above')).toBeInTheDocument();
    expect(screen.getByText('2 interactive figures in this lesson')).toBeInTheDocument();
    expect(screen.getByText('4 graded practice questions')).toBeInTheDocument();
    expect(screen.getByText(/3 exam-style questions for this concept/)).toBeInTheDocument();
    expect(screen.getByText(/starts once you've banked enough practice XP/)).toBeInTheDocument();

    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('tapping Explanation calls onExplanationTap (scroll to the atom stack already on the page)', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse(AVAILABLE_BODY));
    const { onExplanationTap } = renderRail();
    fireEvent.click(await screen.findByText('Explanation'));
    expect(onExplanationTap).toHaveBeenCalledTimes(1);
  });

  it('tapping Interactive calls onInteractiveTap', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse(AVAILABLE_BODY));
    const { onInteractiveTap } = renderRail();
    fireEvent.click(await screen.findByText('Interactive'));
    expect(onInteractiveTap).toHaveBeenCalledTimes(1);
  });

  it('tapping Practice navigates to /attempt/:first_object_id', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse(AVAILABLE_BODY));
    renderRail();
    fireEvent.click(await screen.findByText('Practice'));
    expect(mockNavigate).toHaveBeenCalledWith('/attempt/obj-1');
  });

  it('tapping Checkpoint quiz navigates to /checkpoint?concept=<id>', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse(AVAILABLE_BODY));
    renderRail();
    fireEvent.click(await screen.findByText('Checkpoint quiz'));
    expect(mockNavigate).toHaveBeenCalledWith('/checkpoint?concept=eigenvalues');
  });

  it('the Interactive leg is NOT tappable when the server says available but this render has no jump target', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse(AVAILABLE_BODY));
    const { onInteractiveTap } = renderRail({ interactiveJumpReady: false });
    const row = await screen.findByText('Interactive');
    fireEvent.click(row);
    expect(onInteractiveTap).not.toHaveBeenCalled();
  });

  it('Practice is not tappable when available but the server gave no first_object_id (defensive — should not happen, but never crash on it)', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse({
      ...AVAILABLE_BODY,
      legs: { ...AVAILABLE_BODY.legs, practice: { available: true, item_count: 4, first_object_id: null } },
    }));
    renderRail();
    const row = await screen.findByText('Practice');
    fireEvent.click(row);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('re-fetches when conceptId changes', async () => {
    vi.mocked(fetch).mockReturnValue(jsonResponse(AVAILABLE_BODY));
    const { rerender } = render(
      <MemoryRouter>
        <WalkthroughRail
          conceptId="eigenvalues"
          onExplanationTap={vi.fn()}
          onInteractiveTap={vi.fn()}
          interactiveJumpReady={true}
        />
      </MemoryRouter>,
    );
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/lesson/walkthrough/eigenvalues'));

    vi.mocked(fetch).mockReturnValue(jsonResponse({ ...AVAILABLE_BODY, concept_id: 'determinants' }));
    rerender(
      <MemoryRouter>
        <WalkthroughRail
          conceptId="determinants"
          onExplanationTap={vi.fn()}
          onInteractiveTap={vi.fn()}
          interactiveJumpReady={true}
        />
      </MemoryRouter>,
    );
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/lesson/walkthrough/determinants'));
  });
});
