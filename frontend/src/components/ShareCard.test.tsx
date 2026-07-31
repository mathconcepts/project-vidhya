/**
 * ShareCard tests.
 *
 * jsdom has no real <canvas> 2D renderer, so `getContext`/`toBlob` are
 * stubbed with no-op/fake implementations — these tests aren't pixel
 * assertions, they cover the behavioral contract: the share/download/
 * copy-link fallback chain, and the design-review-driven regression guard
 * that this card never draws the "Verified ✓" badge (see DESIGN-SYSTEM.md
 * "Receipt Border" — a share card with nothing behind it must not borrow
 * that trust cue).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareCard } from './ShareCard';

vi.mock('@/lib/beacon', () => ({
  trackShare: vi.fn(),
}));

const FAKE_CTX = {
  fillRect: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 10 })),
  fillStyle: '',
  font: '',
};

function stubCanvas() {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(FAKE_CTX as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (
    this: HTMLCanvasElement,
    cb: BlobCallback,
  ) {
    cb(new Blob(['fake-png'], { type: 'image/png' }));
  });
}

describe('ShareCard', () => {
  beforeEach(() => {
    stubCanvas();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  const props = {
    planHeadline: 'Your focus areas',
    planSubtext: '3 concepts stand between you and a stronger score.',
    examName: 'GATE',
    shareUrl: 'https://vidhya-demo.onrender.com/',
    onClose: vi.fn(),
  };

  it('never draws a "Verified" badge or receipt-border language on the card (no verification_log backs a share)', async () => {
    render(<ShareCard {...props} />);
    await waitFor(() => expect(FAKE_CTX.fillText).toHaveBeenCalled());
    const drawnStrings = FAKE_CTX.fillText.mock.calls.map(call => call[0]);
    expect(drawnStrings.some(s => /verified/i.test(s))).toBe(false);
    expect(screen.queryByText(/verified/i)).not.toBeInTheDocument();
  });

  it('shows a "Download report card" label when the Web Share API is unavailable', async () => {
    vi.stubGlobal('navigator', { ...navigator, share: undefined, clipboard: navigator.clipboard });
    render(<ShareCard {...props} />);
    expect(screen.getByRole('button', { name: /download report card/i })).toBeInTheDocument();
    // Let the canvas draw effect's promise settle before the test tears
    // down, so its `setReady` doesn't land after unmount (act() warning).
    await waitFor(() => expect(FAKE_CTX.fillText).toHaveBeenCalled());
  });

  it('shows a "Share report card" label and calls navigator.share with a file when file-sharing is supported', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { ...navigator, share, canShare, clipboard: navigator.clipboard });

    render(<ShareCard {...props} />);
    const button = await screen.findByRole('button', { name: /share report card/i });
    fireEvent.click(button);

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const arg = share.mock.calls[0][0];
    expect(arg.files).toHaveLength(1);
    expect(arg.files[0].type).toBe('image/png');
  });

  it('falls back to link-only sharing when the browser supports share() but not file attachments', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(false);
    vi.stubGlobal('navigator', { ...navigator, share, canShare, clipboard: navigator.clipboard });

    render(<ShareCard {...props} />);
    const button = await screen.findByRole('button', { name: /share report card/i });
    fireEvent.click(button);

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const arg = share.mock.calls[0][0];
    expect(arg.files).toBeUndefined();
    expect(arg.url).toBe(props.shareUrl);
  });

  it('copies the share URL to the clipboard via the "Copy link" action', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, share: undefined, clipboard: { writeText } });

    render(<ShareCard {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /copy link/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(props.shareUrl));
    expect(await screen.findByText(/link copied/i)).toBeInTheDocument();
  });

  it('treats a user-dismissed native share sheet (AbortError) as a non-failure', async () => {
    const abortError = Object.assign(new Error('cancelled'), { name: 'AbortError' });
    const share = vi.fn().mockRejectedValue(abortError);
    const canShare = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { ...navigator, share, canShare, clipboard: navigator.clipboard });

    render(<ShareCard {...props} />);
    const button = await screen.findByRole('button', { name: /share report card/i });
    fireEvent.click(button);

    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/couldn't open the share sheet/i)).not.toBeInTheDocument();
  });
});
