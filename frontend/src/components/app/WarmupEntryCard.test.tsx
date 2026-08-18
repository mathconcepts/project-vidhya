import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { WarmupEntryCard } from './WarmupEntryCard';
import { WARMUP_COMPLETED_KEY } from '@/lib/warmup-logic';

vi.mock('@/lib/auth/client', () => ({
  authFetch: vi.fn(),
}));

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('WarmupEntryCard', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders nothing while the fetch is in flight or when not gated on', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockResolvedValue({
      ok: true,
      json: async () => ({ action: { kind: 'practice', objectId: 'x' }, expected_score: null }),
    } as any);

    const { container } = wrap(<WarmupEntryCard />);
    expect(container.firstChild).toBeNull();
    await waitFor(() => expect(authFetch).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  it('shows the entry card when next-action reports "building your baseline"', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockResolvedValue({
      ok: true,
      json: async () => ({ action: null, expected_score: null, reason: 'building your baseline' }),
    } as any);

    wrap(<WarmupEntryCard />);
    await waitFor(() => expect(screen.getByText('Start the warm-up')).toBeInTheDocument());
    expect(screen.getByText('Find your starting line')).toBeInTheDocument();
  });

  it('never fetches (and never shows) once the warmup is already completed this browser', async () => {
    localStorage.setItem(WARMUP_COMPLETED_KEY, '1');
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockResolvedValue({
      ok: true,
      json: async () => ({ action: null, reason: 'building your baseline' }),
    } as any);

    const { container } = wrap(<WarmupEntryCard />);
    // Give any stray microtask a chance to run.
    await new Promise((r) => setTimeout(r, 0));
    expect(authFetch).not.toHaveBeenCalled();
    expect(container.firstChild).toBeNull();
  });

  it('fails silently (renders nothing) on a network error', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockRejectedValue(new Error('network down'));

    const { container } = wrap(<WarmupEntryCard />);
    await waitFor(() => expect(authFetch).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });
});
