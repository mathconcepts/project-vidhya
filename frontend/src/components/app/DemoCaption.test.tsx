import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fs from 'fs';
import path from 'path';
import { DemoCaption, captionFor } from './DemoCaption';
import { setDemoPersona, clearDemoPersona } from '@/lib/demoPersona';

const CAPTIONS = [
  { at: 'hook', text: 'The ellipse is what the matrix does to a circle.' },
  { at: 'intuition', text: 'Watch the eigenvalues update as she drags.' },
];

beforeEach(() => {
  sessionStorage.clear();
});

function enterDemo() {
  setDemoPersona({
    id: 'meera-gate-la-anxious',
    display_name: 'Meera',
    mastery_by_concept: { eigenvalues: 0.22 },
    recent_errors: [],
  });
}

describe('captionFor', () => {
  it('finds the caption anchored to a step', () => {
    expect(captionFor('hook', CAPTIONS)).toBe(CAPTIONS[0].text);
  });

  it('returns null for a step with no caption — the rail continues uncaptioned', () => {
    // The plan's shadow path: "script shorter than rail → rail simply continues
    // uncaptioned". Captions are garnish, never load-bearing.
    expect(captionFor('worked-example', CAPTIONS)).toBeNull();
    expect(captionFor('hook', [])).toBeNull();
    expect(captionFor('hook', undefined)).toBeNull();
  });
});

describe('DemoCaption', () => {
  it('renders nothing for a real student', () => {
    // Zero footprint on student surfaces: no demo persona, no component.
    clearDemoPersona();
    const { container } = render(<DemoCaption step="hook" captions={CAPTIONS} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('narrates the current step inside a demo journey', () => {
    enterDemo();
    render(<DemoCaption step="hook" captions={CAPTIONS} />);
    expect(screen.getByText(CAPTIONS[0].text)).toBeInTheDocument();
  });

  it('renders nothing when the rail has no caption for this step', () => {
    enterDemo();
    const { container } = render(<DemoCaption step="worked-example" captions={CAPTIONS} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('is dismissible', async () => {
    enterDemo();
    render(<DemoCaption step="hook" captions={CAPTIONS} />);
    await userEvent.click(screen.getByLabelText('Dismiss narration'));
    expect(screen.queryByText(CAPTIONS[0].text)).not.toBeInTheDocument();
  });

  it('shows the next step after a dismissal — dismissing one does not kill the rail', async () => {
    enterDemo();
    const { rerender } = render(<DemoCaption step="hook" captions={CAPTIONS} />);
    await userEvent.click(screen.getByLabelText('Dismiss narration'));
    rerender(<DemoCaption step="intuition" captions={CAPTIONS} />);
    expect(screen.getByText(CAPTIONS[1].text)).toBeInTheDocument();
  });
});

describe('shipped caption copy', () => {
  // The validator enforces this in CI against config/demo-rails.json; this
  // asserts the same rule from the frontend side so a caption cannot be added
  // in a UI-only change without the copy rule travelling with it.
  const config = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../../../../config/demo-rails.json'), 'utf8'),
  );

  it('every shipped caption anchors to a real step of its own rail', () => {
    for (const card of config.cards) {
      // Mirrors check-demo-rails' anchor resolution, per rail kind.
      const anchors =
        card.rail.kind === 'atoms'
          ? [...card.rail.atoms, ...(card.rail.practice_item_id ? ['practice'] : [])]
          : card.rail.kind === 'surfaces'
            ? card.rail.steps.map((s: { at: string }) => s.at)
            : ['compare'];
      for (const caption of card.captions ?? []) {
        expect(anchors, `card ${card.id}`).toContain(caption.at);
      }
    }
  });

  it('no shipped caption sells the product', () => {
    const banned = ['revolutionary', 'seamless', 'powerful', 'amazing', 'effortless'];
    for (const card of config.cards) {
      for (const caption of card.captions ?? []) {
        for (const word of banned) {
          expect(caption.text.toLowerCase(), `card ${card.id}`).not.toContain(word);
        }
      }
    }
  });
});
