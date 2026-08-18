/**
 * NextBestActionCard — Wave 7 regression coverage (rewritten this branch,
 * previously zero tests). Locks:
 *   - the loading state before both fetches resolve
 *   - the honest "building your baseline" empty state, with FocusedWorkStrip
 *     still mounted beneath it
 *   - CTA routing by Action.kind: practice/retain with objectId → /attempt/:id,
 *     teach with nodeId → /lesson/:id
 *   - rationale text rendering for a resolved action
 *   - a network failure degrading to the honest empty state, never a crash
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NextBestActionCard } from './NextBestActionCard';

vi.mock('@/lib/auth/client', () => ({
  authFetch: vi.fn(),
}));

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

/** Routes the two (or three, once FocusedWorkStrip mounts) authFetch calls by URL. */
function mockFetchRouting(opts: {
  next?: unknown;
  score?: unknown;
  xpSummary?: unknown;
  reject?: 'next' | 'score' | 'both';
}) {
  return async (input: RequestInfo) => {
    const url = String(input);
    if (url.includes('next-action')) {
      if (opts.reject === 'next' || opts.reject === 'both') throw new Error('network down');
      return { ok: true, json: async () => opts.next ?? { action: null, reason: 'building your baseline' } } as any;
    }
    if (url.includes('expected-score')) {
      if (opts.reject === 'score' || opts.reject === 'both') throw new Error('network down');
      return { ok: true, json: async () => opts.score ?? null } as any;
    }
    if (url.includes('xp/summary')) {
      return { ok: true, json: async () => opts.xpSummary ?? { total_minutes: 40, threshold_minutes: 100, quiz_offer: { eligible: false } } } as any;
    }
    return { ok: false } as any;
  };
}

describe('NextBestActionCard', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('shows the loading state before the fetches resolve', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockImplementation(mockFetchRouting({}));

    wrap(<NextBestActionCard />);
    expect(screen.getByText(/Finding your next best action/)).toBeInTheDocument();
  });

  it('renders the honest empty state and mounts FocusedWorkStrip when building a baseline', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockImplementation(mockFetchRouting({
      next: { action: null, reason: 'building your baseline' },
    }));

    wrap(<NextBestActionCard />);
    await waitFor(() => expect(screen.getByText(/Building your baseline/)).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /Answer a few questions/ })).toHaveAttribute('href', '/smart-practice');
    // FocusedWorkStrip's own fetch resolves and renders its progress meter.
    await waitFor(() => expect(screen.getByText('40 / 100 min')).toBeInTheDocument());
  });

  it('routes a practice action with an objectId to /attempt/:objectId and shows the rationale', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockImplementation(mockFetchRouting({
      next: {
        action: { kind: 'practice', objectId: 'obj-42', estMinutes: 5, rationale: 'You are close on eigenvalues.', expectedGain: 1.2 },
      },
      score: { realized: 30, potential: 60, ratio: 0.5 },
    }));

    wrap(<NextBestActionCard />);
    await waitFor(() => expect(screen.getByText('You are close on eigenvalues.')).toBeInTheDocument());
    const cta = screen.getByRole('link', { name: /Start now/ });
    expect(cta).toHaveAttribute('href', '/attempt/obj-42');
    expect(screen.getByText('Estimated 30–60 marks right now')).toBeInTheDocument();
  });

  it('routes a retain action with an objectId to /attempt/:objectId (not /smart-practice)', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockImplementation(mockFetchRouting({
      next: {
        action: { kind: 'retain', objectId: 'obj-99', estMinutes: 3, rationale: 'This card is overdue for review.', expectedGain: 1.8 },
      },
    }));

    wrap(<NextBestActionCard />);
    await waitFor(() => expect(screen.getByText('This card is overdue for review.')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /Start now/ })).toHaveAttribute('href', '/attempt/obj-99');
    expect(screen.getByText('Review')).toBeInTheDocument(); // KIND_META label for 'retain'
  });

  it('routes a teach action by nodeId to /lesson/:nodeId with the "Start learning" label', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockImplementation(mockFetchRouting({
      next: {
        action: { kind: 'teach', nodeId: 'determinants', estMinutes: 8, rationale: 'A new concept is ready to learn.', expectedGain: 1.0 },
      },
    }));

    wrap(<NextBestActionCard />);
    await waitFor(() => expect(screen.getByText('A new concept is ready to learn.')).toBeInTheDocument());
    const cta = screen.getByRole('link', { name: /Start learning/ });
    expect(cta).toHaveAttribute('href', '/lesson/determinants');
  });

  it('degrades to the honest empty state (not a crash) when both fetches reject', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockImplementation(mockFetchRouting({ reject: 'both' }));

    wrap(<NextBestActionCard />);
    await waitFor(() => expect(screen.getByText(/Building your baseline/)).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /Answer a few questions/ })).toHaveAttribute('href', '/smart-practice');
  });
});
