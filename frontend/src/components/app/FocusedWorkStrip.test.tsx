/**
 * FocusedWorkStrip — T14 (B5, DR-4) coverage across its 5 branches:
 * fetch-failed (hidden), quiz-ready CTA at threshold, threshold-reached-
 * but-not-yet-eligible copy, zero-state copy, and the progress-fill value
 * below threshold.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FocusedWorkStrip } from './FocusedWorkStrip';

vi.mock('@/lib/auth/client', () => ({
  authFetch: vi.fn(),
}));

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('FocusedWorkStrip', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders nothing when the fetch fails (an honest absence, not a broken meter)', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockRejectedValue(new Error('network down'));

    const { container } = wrap(<FocusedWorkStrip />);
    await waitFor(() => expect(authFetch).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  it('shows the checkpoint quiz CTA once at threshold and eligible', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        total_minutes: 100,
        threshold_minutes: 100,
        quiz_offer: { eligible: true, quiz_length: 6 },
      }),
    } as any);

    wrap(<FocusedWorkStrip />);
    await waitFor(() => expect(screen.getByText(/Checkpoint quiz ready/)).toBeInTheDocument());
    expect(screen.getByText(/6 questions/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Checkpoint quiz ready/ })).toHaveAttribute('href', '/checkpoint');
  });

  it('shows the not-yet-eligible reason copy at threshold when quiz_offer.eligible is false', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        total_minutes: 120,
        threshold_minutes: 100,
        quiz_offer: { eligible: false, reason: 'Pool too small for a fresh quiz right now' },
      }),
    } as any);

    wrap(<FocusedWorkStrip />);
    await waitFor(() => expect(screen.getByText('Pool too small for a fresh quiz right now')).toBeInTheDocument());
    expect(screen.queryByRole('link')).not.toBeInTheDocument(); // no CTA link when not eligible
  });

  it('shows the zero-state copy when no focused minutes have been logged yet', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockResolvedValue({
      ok: true,
      json: async () => ({ total_minutes: 0, threshold_minutes: 100, quiz_offer: { eligible: false } }),
    } as any);

    wrap(<FocusedWorkStrip />);
    await waitFor(() => expect(screen.getByText('Your first focused minutes land here')).toBeInTheDocument());
  });

  it('renders the progress fill value below threshold as "N / threshold min"', async () => {
    const { authFetch } = await import('@/lib/auth/client');
    vi.mocked(authFetch).mockResolvedValue({
      ok: true,
      json: async () => ({ total_minutes: 64, threshold_minutes: 100, quiz_offer: { eligible: false } }),
    } as any);

    wrap(<FocusedWorkStrip />);
    await waitFor(() => expect(screen.getByText('64 / 100 min')).toBeInTheDocument());
  });
});
