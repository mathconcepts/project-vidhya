/**
 * MediaSidecar — visibility + accessibility contract tests (§4.15).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { MediaSidecar, type ContentAtom } from './AtomCardRenderer';

function atomWith(media?: ContentAtom['media'], content = 'body'): ContentAtom {
  return {
    id: 'a1',
    concept_id: 'c1',
    atom_type: 'intuition',
    bloom_level: 1,
    difficulty: 0.5,
    exam_ids: [],
    content,
    media,
  } as ContentAtom;
}

const GIF_SCENE_BODY = 'Watch the trace unfold.\n\n```gif-scene\n{"type":"function-trace","expression":"2*x"}\n```\n';

beforeEach(() => {
  // Default: no reduced-motion preference
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((q: string) => ({
      matches: false,
      media: q,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

describe('MediaSidecar', () => {
  it('renders nothing when atom has no media', () => {
    const { container } = render(<MediaSidecar atom={atomWith(undefined)} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when media object is empty', () => {
    const { container } = render(<MediaSidecar atom={atomWith({})} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders an audio player when audio_url is set', () => {
    const { container } = render(
      <MediaSidecar atom={atomWith({ audio_url: '/api/lesson/media/a1/audio_narration' })} />,
    );
    const audio = container.querySelector('audio');
    expect(audio).not.toBeNull();
    expect(audio!.getAttribute('src')).toBe('/api/lesson/media/a1/audio_narration');
    expect(audio!.hasAttribute('controls')).toBe(true);
    expect(audio!.getAttribute('preload')).toBe('none');
    expect(audio!.getAttribute('aria-label')).toBeTruthy();
  });

  it('renders an img tag when gif_url is set', () => {
    const { container } = render(
      <MediaSidecar atom={atomWith({ gif_url: '/api/lesson/media/a1/gif' })} />,
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img!.getAttribute('src')).toBe('/api/lesson/media/a1/gif');
    expect(img!.getAttribute('alt')).toBeTruthy();
    expect(img!.getAttribute('loading')).toBe('lazy');
  });

  it('renders both when both URLs are set', () => {
    const { container } = render(
      <MediaSidecar atom={atomWith({ gif_url: '/g.gif', audio_url: '/a.mp3' })} />,
    );
    expect(container.querySelector('img')).not.toBeNull();
    expect(container.querySelector('audio')).not.toBeNull();
  });

  // Bug #2 (live QA): a visual_analogy atom authored with a gif-scene block
  // rendered as bare static text on a freshly-woken demo instance — the
  // GIF hadn't finished rendering to disk yet (demo:seed-media runs in a
  // background subshell after boot), and MediaSidecar silently rendered
  // nothing instead of saying so.
  describe('awaiting-gif honesty (bug #2)', () => {
    it('shows an honest placeholder when the atom authors a gif-scene block but has no media yet', () => {
      const { container, getByText } = render(
        <MediaSidecar atom={atomWith(undefined, GIF_SCENE_BODY)} />,
      );
      expect(container.firstChild).not.toBeNull();
      expect(container.querySelector('img')).toBeNull();
      expect(getByText(/still generating/i)).toBeInTheDocument();
    });

    it('shows the placeholder even when a media object exists but its gif_url is not set yet', () => {
      const { getByText } = render(
        <MediaSidecar atom={atomWith({ audio_url: '/a.mp3' }, GIF_SCENE_BODY)} />,
      );
      expect(getByText(/still generating/i)).toBeInTheDocument();
    });

    it('renders the real GIF, not the placeholder, once gif_url is set', () => {
      const { container, queryByText } = render(
        <MediaSidecar atom={atomWith({ gif_url: '/g.gif' }, GIF_SCENE_BODY)} />,
      );
      expect(container.querySelector('img')).not.toBeNull();
      expect(queryByText(/still generating/i)).toBeNull();
    });

    it('renders nothing (unchanged) when the atom has no media AND no gif-scene block', () => {
      const { container } = render(<MediaSidecar atom={atomWith(undefined, 'plain prose, no scene')} />);
      expect(container.firstChild).toBeNull();
    });
  });

  // Regression (/investigate, 2026-08-30): the "still generating" placeholder
  // never resolved on its own — only a full page reload could ever show the
  // real GIF, and nothing told the student to reload. This recurs on every
  // Render free-tier sleep/wake (no persistent disk), not just first boot,
  // which is why a student can hit it on a spaced-repetition revisit too.
  describe('awaiting-gif self-resolution (poll)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    });

    it('polls the deterministic media URL and swaps in the real GIF once it 200s, with no reload', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce({ ok: false } as Response) // still generating
        .mockResolvedValueOnce({ ok: true } as Response); // now ready
      vi.stubGlobal('fetch', fetchMock);

      const { queryByText, container } = render(
        <MediaSidecar atom={atomWith(undefined, GIF_SCENE_BODY)} />,
      );
      expect(queryByText(/still generating/i)).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith('/api/lesson/media/a1/gif', { cache: 'no-store' });
      expect(queryByText(/still generating/i)).toBeInTheDocument();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);

      const img = container.querySelector('img');
      expect(img).not.toBeNull();
      expect(img!.getAttribute('src')).toBe('/api/lesson/media/a1/gif');
      expect(queryByText(/still generating/i)).toBeNull();
    });

    it('stops polling once resolved — no fetches after the GIF is found', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: true } as Response);
      vi.stubGlobal('fetch', fetchMock);
      render(<MediaSidecar atom={atomWith(undefined, GIF_SCENE_BODY)} />);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(5000);
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(30000);
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('gives up after MAX_ATTEMPTS and stays on the honest placeholder rather than polling forever', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ ok: false } as Response);
      vi.stubGlobal('fetch', fetchMock);
      const { queryByText } = render(<MediaSidecar atom={atomWith(undefined, GIF_SCENE_BODY)} />);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(20 * 5000 + 10000);
      });
      expect(fetchMock).toHaveBeenCalledTimes(20);
      expect(queryByText(/still generating/i)).toBeInTheDocument();
    });

    it('does not poll when the GIF is already resolved server-side (no gif-scene wait)', async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      render(<MediaSidecar atom={atomWith({ gif_url: '/g.gif' })} />);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(30000);
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  it('shows reduced-motion caption when prefers-reduced-motion: reduce', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((q: string) => ({
        matches: q.includes('reduce'),
        media: q,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    const { container, getByText } = render(
      <MediaSidecar atom={atomWith({ gif_url: '/g.gif' })} />,
    );
    expect(container.querySelector('figcaption')).not.toBeNull();
    expect(getByText(/Motion reduced/)).toBeInTheDocument();
  });
});
