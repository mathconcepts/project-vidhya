import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WarmupResultScreen } from './WarmupResultScreen';
import type { SpineConcept } from '@/lib/warmup-logic';

const SPINE: SpineConcept[] = [
  { id: 'matrix-operations', label: 'Matrix operations' },
  { id: 'determinants', label: 'Determinants' },
  { id: 'matrix-inverse', label: 'Matrix inverse' },
];

describe('WarmupResultScreen', () => {
  it('leads with a competence headline and shows the placement line', () => {
    render(
      <WarmupResultScreen
        spine={SPINE} placed={['matrix-operations', 'determinants']} frontier="matrix-inverse"
        probedAnyProbe onStartPractising={() => {}}
      />,
    );
    expect(screen.getByText("You're solid through Determinants.")).toBeInTheDocument();
    expect(screen.getByText("We'll start you at Matrix inverse — the interesting part.")).toBeInTheDocument();
  });

  it('renders exactly ONE green CTA ("Start practising")', () => {
    render(
      <WarmupResultScreen
        spine={SPINE} placed={['matrix-operations']} frontier="determinants"
        probedAnyProbe onStartPractising={() => {}}
      />,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(1);
    expect(buttons[0]).toHaveTextContent('Start practising');
  });

  it('never renders a score, per-item review, or an Elo number', () => {
    const { container } = render(
      <WarmupResultScreen
        spine={SPINE} placed={['matrix-operations']} frontier="determinants"
        probedAnyProbe onStartPractising={() => {}}
      />,
    );
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/\d{3,4}\s*elo/i);
    expect(text).not.toMatch(/score:/i);
  });

  it('shows the footnote clarifying placement is not a grade', () => {
    render(
      <WarmupResultScreen
        spine={SPINE} placed={[]} frontier="matrix-operations"
        probedAnyProbe onStartPractising={() => {}}
      />,
    );
    expect(screen.getByText(/Placement is a starting point, not a grade/)).toBeInTheDocument();
  });

  it('calls onStartPractising when the CTA is clicked', () => {
    const onStart = vi.fn();
    render(
      <WarmupResultScreen
        spine={SPINE} placed={['matrix-operations']} frontier="determinants"
        probedAnyProbe onStartPractising={onStart}
      />,
    );
    fireEvent.click(screen.getByText('Start practising'));
    expect(onStart).toHaveBeenCalled();
  });

  it('renders the "We\'ll start at the beginning" fallback when nothing was placed', () => {
    render(
      <WarmupResultScreen
        spine={SPINE} placed={[]} frontier="matrix-operations"
        probedAnyProbe onStartPractising={() => {}}
      />,
    );
    expect(screen.getByText("We'll start at the beginning.")).toBeInTheDocument();
  });

  it('renders the honest early-ready state when nothing was ever probed', () => {
    render(
      <WarmupResultScreen
        spine={SPINE} placed={[]} frontier={null}
        probedAnyProbe={false} onStartPractising={() => {}}
      />,
    );
    expect(screen.getByText('Your starting line is ready.')).toBeInTheDocument();
  });

  it('placed rows show the "placed" caption, the frontier row shows "start here"', () => {
    render(
      <WarmupResultScreen
        spine={SPINE} placed={['matrix-operations']} frontier="determinants"
        probedAnyProbe onStartPractising={() => {}}
      />,
    );
    const placedRow = screen.getByText('Matrix operations').closest('div');
    expect(placedRow?.textContent).toContain('placed');
    const frontierRow = screen.getByText('Determinants').closest('div');
    expect(frontierRow?.textContent).toContain('start here');
  });
});
