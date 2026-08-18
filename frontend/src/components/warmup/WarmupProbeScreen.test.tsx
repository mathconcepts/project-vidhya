import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WarmupProbeScreen } from './WarmupProbeScreen';
import type { SpineConcept } from '@/lib/warmup-logic';

const SPINE: SpineConcept[] = [
  { id: 'matrix-operations', label: 'Matrix operations' },
  { id: 'determinants', label: 'Determinants' },
  { id: 'matrix-inverse', label: 'Matrix inverse' },
  { id: 'systems-of-equations', label: 'Systems of equations' },
  { id: 'eigenvalues', label: 'Eigenvalues' },
];

const PROBE = {
  id: 'pi-determinants-001',
  questionText: 'If det(A) = 4 and det(B) = 3, what is det(AB)?',
  options: ['7', '12', '64'],
};

describe('WarmupProbeScreen', () => {
  it('renders the question, progress line, and "not graded" label', () => {
    render(
      <WarmupProbeScreen
        spine={SPINE} conceptIndex={1} probe={PROBE} showFraming={false} pending={false}
        onAnswer={() => {}} onStopHere={() => {}}
      />,
    );
    expect(screen.getByText(PROBE.questionText)).toBeInTheDocument();
    expect(screen.getByText('Concept 2 of 5 · Determinants')).toBeInTheDocument();
    expect(screen.getByText('not graded')).toBeInTheDocument();
  });

  it('appends "I haven\'t learned this yet" as a first-class option', () => {
    render(
      <WarmupProbeScreen
        spine={SPINE} conceptIndex={0} probe={PROBE} showFraming={false} pending={false}
        onAnswer={() => {}} onStopHere={() => {}}
      />,
    );
    expect(screen.getByText("I haven't learned this yet")).toBeInTheDocument();
  });

  it('shows the framing copy only when showFraming is true', () => {
    const { rerender } = render(
      <WarmupProbeScreen
        spine={SPINE} conceptIndex={0} probe={PROBE} showFraming={true} pending={false}
        onAnswer={() => {}} onStopHere={() => {}}
      />,
    );
    expect(screen.getByText(/This isn't a test/)).toBeInTheDocument();

    rerender(
      <WarmupProbeScreen
        spine={SPINE} conceptIndex={0} probe={PROBE} showFraming={false} pending={false}
        onAnswer={() => {}} onStopHere={() => {}}
      />,
    );
    expect(screen.queryByText(/This isn't a test/)).not.toBeInTheDocument();
  });

  it('Continue is disabled until an option is selected, then calls onAnswer with the selected index', () => {
    const onAnswer = vi.fn();
    render(
      <WarmupProbeScreen
        spine={SPINE} conceptIndex={0} probe={PROBE} showFraming={false} pending={false}
        onAnswer={onAnswer} onStopHere={() => {}}
      />,
    );
    const continueBtn = screen.getByText('Continue');
    expect(continueBtn).toBeDisabled();

    fireEvent.click(screen.getByText('12'));
    expect(continueBtn).not.toBeDisabled();
    fireEvent.click(continueBtn);
    expect(onAnswer).toHaveBeenCalledWith(1);
  });

  it('selecting "I haven\'t learned this yet" answers with the -1 sentinel', () => {
    const onAnswer = vi.fn();
    render(
      <WarmupProbeScreen
        spine={SPINE} conceptIndex={0} probe={PROBE} showFraming={false} pending={false}
        onAnswer={onAnswer} onStopHere={() => {}}
      />,
    );
    fireEvent.click(screen.getByText("I haven't learned this yet"));
    fireEvent.click(screen.getByText('Continue'));
    expect(onAnswer).toHaveBeenCalledWith(-1);
  });

  it('"Stop here" is always visible and calls onStopHere', () => {
    const onStopHere = vi.fn();
    render(
      <WarmupProbeScreen
        spine={SPINE} conceptIndex={2} probe={PROBE} showFraming={false} pending={false}
        onAnswer={() => {}} onStopHere={onStopHere}
      />,
    );
    fireEvent.click(screen.getByText('Stop here'));
    expect(onStopHere).toHaveBeenCalled();
  });

  it('resets the selection when a new probe arrives (no stale highlight across the crossfade)', () => {
    const { rerender } = render(
      <WarmupProbeScreen
        spine={SPINE} conceptIndex={0} probe={PROBE} showFraming={false} pending={false}
        onAnswer={() => {}} onStopHere={() => {}}
      />,
    );
    fireEvent.click(screen.getByText('12'));
    expect(screen.getByText('Continue')).not.toBeDisabled();

    rerender(
      <WarmupProbeScreen
        spine={SPINE} conceptIndex={0} probe={{ ...PROBE, id: 'pi-determinants-002' }} showFraming={false} pending={false}
        onAnswer={() => {}} onStopHere={() => {}}
      />,
    );
    expect(screen.getByText('Continue')).toBeDisabled();
  });

  it('disables inputs while pending (optimistic-advance, no spinner flash)', () => {
    render(
      <WarmupProbeScreen
        spine={SPINE} conceptIndex={0} probe={PROBE} showFraming={false} pending={true}
        onAnswer={() => {}} onStopHere={() => {}}
      />,
    );
    expect(screen.getByText('Continue')).toBeDisabled();
    expect(screen.getByText('12').closest('button')).toBeDisabled();
  });
});
