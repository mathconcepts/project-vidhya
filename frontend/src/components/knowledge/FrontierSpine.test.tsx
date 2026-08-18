import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FrontierSpine } from './FrontierSpine';
import type { FrontierNode, FrontierClusterSummary } from '@/lib/frontier-logic';

// jsdom doesn't implement matchMedia by default (same gap every other
// matchMedia-consuming test in this repo stubs — see
// src/lib/mediaPreferences.test.ts). FrontierSpine's auto-scroll routes
// through the shared usePrefersReducedMotion hook, which calls it
// unconditionally.
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
  // jsdom doesn't implement scrollIntoView either.
  Element.prototype.scrollIntoView = vi.fn();
});

function node(overrides: Partial<FrontierNode> & { id: string; name: string }): FrontierNode {
  return {
    dot: 'later',
    why: 'not started',
    cluster_id: 'matrix-operations',
    cluster_label: 'Matrix operations',
    builds_on: [],
    ...overrides,
  };
}

const CLUSTERS: FrontierClusterSummary[] = [
  { id: 'matrix-operations', label: 'Matrix operations', count: 1, done_count: 1 },
  { id: 'eigen-theory', label: 'Eigen-theory', count: 2, done_count: 0 },
];

const NODES: FrontierNode[] = [
  node({ id: 'matrix-operations', name: 'Matrix operations', dot: 'mastered', cluster_id: 'matrix-operations', cluster_label: 'Matrix operations' }),
  node({ id: 'eigenvalues', name: 'Eigenvalues', dot: 'frontier', why: 'in progress', cluster_id: 'eigen-theory', cluster_label: 'Eigen-theory', builds_on: [{ id: 'determinants', label: 'Determinants', met: true }] }),
  node({ id: 'diagonalization', name: 'Diagonalization', dot: 'later', why: 'after eigenvalues', cluster_id: 'eigen-theory', cluster_label: 'Eigen-theory' }),
];

describe('FrontierSpine — success state', () => {
  it('collapses a fully-done cluster to a one-line rollup', () => {
    render(<FrontierSpine nodes={NODES} clusters={CLUSTERS} onLearn={() => {}} />);
    expect(screen.getByText('Matrix operations · 1 of 1')).toBeInTheDocument();
  });

  it('renders the "You are here" focal card with the frontier concept and a CTA', () => {
    render(<FrontierSpine nodes={NODES} clusters={CLUSTERS} onLearn={() => {}} />);
    expect(screen.getByText('You are here')).toBeInTheDocument();
    expect(screen.getByText('Learn Eigenvalues')).toBeInTheDocument();
  });

  it('renders the later cluster label and dims non-frontier rows, using "after X" copy never "locked"', () => {
    render(<FrontierSpine nodes={NODES} clusters={CLUSTERS} onLearn={() => {}} />);
    const diag = screen.getByRole('button', { name: /Diagonalization, after eigenvalues/ });
    expect(diag).toBeInTheDocument();
    expect(screen.queryByText(/locked/i)).not.toBeInTheDocument();
  });

  it('calls onLearn with the frontier concept id when the CTA is clicked', () => {
    const onLearn = vi.fn();
    render(<FrontierSpine nodes={NODES} clusters={CLUSTERS} onLearn={onLearn} />);
    fireEvent.click(screen.getByText('Learn Eigenvalues'));
    expect(onLearn).toHaveBeenCalledWith('eigenvalues');
  });

  it('opens the per-concept bottom sheet with "Builds on" info, only on tap', () => {
    render(<FrontierSpine nodes={NODES} clusters={CLUSTERS} onLearn={() => {}} />);
    expect(screen.queryByText(/Builds on:/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Eigenvalues' }));
    expect(screen.getByText(/Builds on:/)).toBeInTheDocument();
    expect(screen.getByText(/Determinants/)).toBeInTheDocument();
  });
});

describe('FrontierSpine — placed vs demonstrated', () => {
  it('a placed concept shows a "placed" caption and the sheet\'s reassurance line', () => {
    const placedNodes: FrontierNode[] = [
      node({ id: 'matrix-operations', name: 'Matrix operations', dot: 'placed', why: 'in progress', cluster_id: 'matrix-operations', cluster_label: 'Matrix operations' }),
    ];
    const clusters: FrontierClusterSummary[] = [{ id: 'matrix-operations', label: 'Matrix operations', count: 1, done_count: 0 }];
    render(<FrontierSpine nodes={placedNodes} clusters={clusters} onLearn={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Matrix operations/ }));
    expect(screen.getByText(/Placed by your warmup/)).toBeInTheDocument();
  });
});

describe('FrontierSpine — empty', () => {
  it('renders nothing for an empty node list (page owns the empty-state copy)', () => {
    const { container } = render(<FrontierSpine nodes={[]} clusters={[]} onLearn={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
