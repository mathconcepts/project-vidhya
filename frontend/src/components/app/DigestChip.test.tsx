/**
 * DigestChip tests.
 *
 * Critical path — Mon/Tue gate is timezone-naive (T11 decision) and uses
 * browser-local time. ISO-week dismiss key prevents week-leakage.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DigestChip } from './DigestChip';

// Mock the analytics module so trackEvent is a no-op.
vi.mock('@/lib/analytics', () => ({
  trackEvent: vi.fn(),
}));

function wrap(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

const RECENT = () => new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
const STALE = () => new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

describe('DigestChip', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  function setMonday() {
    // Monday: a known Mon date (2026-04-27 is Mon). Set system time.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-27T10:00:00Z'));
  }

  function setWednesday() {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-29T10:00:00Z'));
  }

  it('does not render on Wednesday even with fresh digest', async () => {
    setWednesday();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ generated_at: RECENT() }),
    } as Response);

    const { container } = wrap(<DigestChip sessionId="abc" />);
    // Give the effect a chance to settle (it shouldn't fire — chip blocks
    // on inWindow before fetching).
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('does not render when fetch returns 404', async () => {
    setMonday();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    } as Response);

    const { container } = wrap(<DigestChip sessionId="abc" />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('does not render when generated_at is older than 7 days', async () => {
    setMonday();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ generated_at: STALE() }),
    } as Response);

    const { container } = wrap(<DigestChip sessionId="abc" />);
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders chip on Monday with fresh digest', async () => {
    setMonday();
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ generated_at: RECENT() }),
    } as Response);

    wrap(<DigestChip sessionId="abc" />);
    await waitFor(() => {
      expect(screen.getByText(/Weekly report ready/)).toBeInTheDocument();
    });
  });
});
