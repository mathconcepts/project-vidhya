/**
 * DigestChip tests.
 *
 * Critical path — Mon/Tue gate is timezone-naive (T11 decision) and uses
 * browser-local time. ISO-week dismiss key prevents week-leakage.
 *
 * Implementation note: spy on Date.prototype.getDay rather than using
 * `vi.setSystemTime()`. Fake timers freeze the microtask queue so
 * `waitFor` never resolves — that's a classic vitest footgun. Spying
 * the one method we actually care about avoids the trap.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DigestChip } from './DigestChip';

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
  let dayOfWeek = 1; // 1 = Monday by default

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    vi.spyOn(Date.prototype, 'getDay').mockImplementation(() => dayOfWeek);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('does not render on Wednesday even with fresh digest', async () => {
    dayOfWeek = 3; // Wednesday
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ generated_at: RECENT() }),
    } as Response);

    const { container } = wrap(<DigestChip sessionId="abc" />);
    // Wait long enough that a fetch effect would have settled if it fired.
    await new Promise(r => setTimeout(r, 50));
    expect(container.firstChild).toBeNull();
  });

  it('does not render when fetch returns 404', async () => {
    dayOfWeek = 1;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({}),
    } as Response);

    const { container } = wrap(<DigestChip sessionId="abc" />);
    await new Promise(r => setTimeout(r, 50));
    expect(container.firstChild).toBeNull();
  });

  it('does not render when generated_at is older than 7 days', async () => {
    dayOfWeek = 1;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ generated_at: STALE() }),
    } as Response);

    const { container } = wrap(<DigestChip sessionId="abc" />);
    await new Promise(r => setTimeout(r, 50));
    expect(container.firstChild).toBeNull();
  });

  it('renders chip on Monday with fresh digest', async () => {
    dayOfWeek = 1;
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ generated_at: RECENT() }),
    } as Response);

    wrap(<DigestChip sessionId="abc" />);
    await waitFor(() => {
      expect(screen.getByText(/Weekly report ready/)).toBeInTheDocument();
    });
  });

  it('renders chip on Tuesday with fresh digest', async () => {
    dayOfWeek = 2;
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
