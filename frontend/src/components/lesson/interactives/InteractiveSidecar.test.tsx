/**
 * Component tests for the interactive widgets. We test the dispatcher
 * (does it pick the right component for each kind?) and a smoke render
 * for each component (does it mount without throwing?).
 *
 * Doesn't exercise the full animation loop in Simulation — just confirms
 * the SVG is in the DOM. Doesn't simulate clicks across all walkthrough
 * phases — just confirms the initial prompt renders.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InteractiveSidecar } from './InteractiveSidecar';

const M_BODY = (json: object) => `# heading\n\n\`\`\`interactive-spec\n${JSON.stringify(json)}\n\`\`\``;

describe('InteractiveSidecar dispatcher', () => {
  it('renders nothing for body without a spec block', () => {
    const { container } = render(<InteractiveSidecar body="just text, no spec" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders a Manipulable widget for kind=manipulable', () => {
    const body = M_BODY({
      v: 1,
      kind: 'manipulable',
      title: 'Eigenvalue explorer',
      inputs: [{ id: 'a', label: 'a', min: -3, max: 3, initial: 1 }],
      outputs: [{ label: 'λ', formula: 'a + 2' }],
    });
    render(<InteractiveSidecar body={body} />);
    expect(screen.getByText('Eigenvalue explorer')).toBeInTheDocument();
    // Output evaluates 1 + 2 = 3
    expect(screen.getByText('3.000')).toBeInTheDocument();
  });

  it('renders a Simulation widget for kind=simulation', () => {
    const body = M_BODY({
      v: 1,
      kind: 'simulation',
      title: 'Trace of (cos t, sin t)',
      x_expr: 'cos(t)',
      y_expr: 'sin(t)',
      t_min: 0,
      t_max: 6.283,
    });
    const { container } = render(<InteractiveSidecar body={body} />);
    expect(screen.getByText('Trace of (cos t, sin t)')).toBeInTheDocument();
    // SVG is mounted
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders a GuidedWalkthrough widget for kind=guided_walkthrough', () => {
    const body = M_BODY({
      v: 1,
      kind: 'guided_walkthrough',
      title: 'Solve det(A) = 0',
      steps: [
        { prompt: 'What is the characteristic polynomial?', hint: 'Look at det(A − λI).', answer: 'λ² − 5λ + 6.' },
        { prompt: 'Now factor it.', answer: '(λ − 2)(λ − 3).' },
      ],
    });
    render(<InteractiveSidecar body={body} />);
    expect(screen.getByText('Solve det(A) = 0')).toBeInTheDocument();
    expect(screen.getByText('What is the characteristic polynomial?')).toBeInTheDocument();
    // Initial step shows step 1 of 2
    expect(screen.getByText(/Step 1 \/ 2/)).toBeInTheDocument();
  });

  it('shows authoring error in dev mode for malformed spec when prop is set', () => {
    const body = '```interactive-spec\n{not valid JSON\n```';
    render(<InteractiveSidecar body={body} showAuthoringErrors={true} />);
    expect(screen.getByText(/parse error/)).toBeInTheDocument();
  });

  it('hides authoring error by default (renders nothing)', () => {
    const body = '```interactive-spec\n{not valid JSON\n```';
    const { container } = render(<InteractiveSidecar body={body} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing for unknown kind without crashing', () => {
    const body = M_BODY({ v: 1, kind: 'glow-stick' });
    const { container } = render(<InteractiveSidecar body={body} />);
    expect(container.innerHTML).toBe('');
  });
});
