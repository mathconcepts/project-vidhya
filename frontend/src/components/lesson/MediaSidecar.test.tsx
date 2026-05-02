/**
 * MediaSidecar — visibility + accessibility contract tests (§4.15).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MediaSidecar, type ContentAtom } from './AtomCardRenderer';

function atomWith(media?: ContentAtom['media']): ContentAtom {
  return {
    id: 'a1',
    concept_id: 'c1',
    atom_type: 'intuition',
    bloom_level: 1,
    difficulty: 0.5,
    exam_ids: [],
    content: 'body',
    media,
  } as ContentAtom;
}

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
