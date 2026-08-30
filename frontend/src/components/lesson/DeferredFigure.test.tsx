/**
 * A recall prompt's figure must not be visible before the student answers.
 *
 * `retrieval_prompt` asks for unaided recall. A figure on screen beside the
 * prompt cues the thing being recalled, so for that atom type the figure is
 * held inside the atom's own AnswerReveal and revealed with the answer
 * (ATOM_PRESENTATION_MAP's `stage: 'in_disclosure'`).
 *
 * No shipped retrieval_prompt atom carries a figure today — `gif-scene`
 * blocks live on visual_analogy atoms — so these tests construct one. That
 * is the point: media is attached by atom id with no atom-type gate in the
 * path, so the day an author adds a `gif-scene` to a retrieval prompt this
 * is what stands between them and a leaked answer.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AtomCardRenderer, type ContentAtom } from './AtomCardRenderer';

const BODY = `Without looking it up: what does the determinant of a matrix measure?

<details>
<summary>Answer</summary>

The signed factor by which the map scales volume.

</details>
`;

function atom(overrides: Partial<ContentAtom> = {}): ContentAtom {
  return {
    id: 'trace.retrieval-prompt',
    concept_id: 'trace',
    atom_type: 'retrieval_prompt',
    bloom_level: 2,
    difficulty: 0.4,
    exam_ids: ['*'],
    content: BODY,
    media: { gif_url: '/api/lesson/media/trace.retrieval-prompt/gif' },
    ...overrides,
  };
}

function renderAtom(a: ContentAtom) {
  return render(
    <AtomCardRenderer atoms={[a]} conceptId="trace" studentId={null} />,
  );
}

describe('retrieval_prompt figures are held behind the disclosure', () => {
  it('does not render the figure before the answer is revealed', () => {
    const { container } = renderAtom(atom());
    expect(screen.getByText(/what does the determinant/i)).toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders the figure once the student reveals the answer', async () => {
    const user = userEvent.setup();
    const { container } = renderAtom(atom());
    await user.click(screen.getByTestId('answer-reveal-trigger'));
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toBe('/api/lesson/media/trace.retrieval-prompt/gif');
  });

  it('puts the figure inside the disclosure body, not merely after it', async () => {
    const user = userEvent.setup();
    const { container } = renderAtom(atom());
    await user.click(screen.getByTestId('answer-reveal-trigger'));
    const body = screen.getByTestId('answer-reveal-body');
    // Containment, not document order: a figure that merely follows the
    // disclosure in the DOM would still be on screen while it is closed.
    expect(body.querySelector('img')).not.toBeNull();
    expect(container.querySelector('.vidhya-atom-stage__figure img')).toBeNull();
  });

  it('falls back to rendering the figure normally when the atom has no disclosure', () => {
    // An authored retrieval_prompt with no `<details>` block has nowhere to
    // hide a figure. It must still render — failing visible beats a figure
    // that silently disappears.
    const { container } = renderAtom(
      atom({ content: 'Recall the definition of the trace.' }),
    );
    expect(screen.queryByTestId('answer-reveal')).toBeNull();
    expect(container.querySelector('img')).not.toBeNull();
  });

  it('leaves other atom types alone — a visual_analogy figure still leads', () => {
    const { container } = renderAtom(
      atom({
        id: 'trace.visual-analogy',
        atom_type: 'visual_analogy',
        content: 'The trace sums the diagonal.',
        media: { gif_url: '/api/lesson/media/trace.visual-analogy/gif' },
      }),
    );
    const stage = container.querySelector('.vidhya-atom-stage');
    expect(stage?.getAttribute('data-stage')).toBe('above');
    expect(container.querySelector('.vidhya-atom-stage__figure img')).not.toBeNull();
  });
});
