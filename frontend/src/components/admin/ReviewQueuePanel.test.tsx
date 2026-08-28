/**
 * Tests for ReviewQueuePanel — D4's review queue, and the pilot's own
 * measuring instrument.
 *
 * The throughput number is tested as hard as the list is: the 50-item
 * pilot reports it, so a wrong divisor here would land in a runbook as a
 * fact.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import {
  ReviewQueuePanel,
  computeThroughput,
  formatElapsed,
} from './ReviewQueuePanel';
import type { ReviewQueueRow } from '@/api/admin/review-queue';

function row(id: string, over: Partial<ReviewQueueRow> = {}): ReviewQueueRow {
  return {
    item_id: id,
    generation_run_id: 'run-1',
    status: 'pending',
    reason: 'awaiting operator',
    decided_by: null,
    decided_at: null,
    created_at: '2026-08-27T00:00:00Z',
    needs_fix: false,
    gates: {
      scope: { status: 'passed', reason: 'concept resolves', decided_by: null, decided_at: null },
      mathematics: { status: 'pending', reason: 'cascade AGREED', decided_by: null, decided_at: null },
      assessment_contract: { status: 'passed', reason: 'gradable', decided_by: null, decided_at: null },
      misconception_coverage: { status: 'waived', reason: 'not enforced', decided_by: null, decided_at: null },
      provenance: { status: 'passed', reason: 'run-1', decided_by: null, decided_at: null },
    },
    gates_satisfied: 4,
    gates_total: 5,
    detail: {
      source: 'file_bank',
      concept_id: 'eigenvalues',
      question_type: 'mcq',
      marks: 2,
      question_text: `Question text for ${id}`,
      options: ['4', '5', '6', '7'],
      answer_index: 0,
      correct_answer: '4',
      solution_steps: ['sum the diagonal'],
    },
    ...over,
  };
}

function queueOf(rows: ReviewQueueRow[]) {
  return vi.fn().mockResolvedValue({
    items: rows,
    gate: 'mathematics' as const,
    gates_total: 5,
    filters: { run: null, status: 'pending', limit: 200 },
  });
}

describe('computeThroughput', () => {
  it('is null until there are two decisions to measure an interval between', () => {
    expect(computeThroughput(0, null, 1000).minutesPerItem).toBeNull();
    expect(computeThroughput(1, 1000, 61000).minutesPerItem).toBeNull();
  });

  it('divides elapsed minutes by items decided', () => {
    // 4 items over 10 minutes → 2.5 min/item.
    const t = computeThroughput(4, 0, 10 * 60_000);
    expect(t.minutesPerItem).toBeCloseTo(2.5, 5);
    expect(t.elapsedMs).toBe(600_000);
  });

  it('never returns a negative elapsed time from a clock that went backwards', () => {
    expect(computeThroughput(3, 5000, 1000).elapsedMs).toBe(0);
  });
});

describe('formatElapsed', () => {
  it('renders minutes and zero-padded seconds', () => {
    expect(formatElapsed(0)).toBe('0m 00s');
    expect(formatElapsed(65_000)).toBe('1m 05s');
  });
});

describe('ReviewQueuePanel', () => {
  it('renders every queued item with its gate tally', async () => {
    render(<ReviewQueuePanel fetchQueue={queueOf([row('pi-1'), row('pi-2')])} submitBatch={vi.fn()} />);
    expect(await screen.findByText('Question text for pi-1')).toBeInTheDocument();
    expect(screen.getByText('Question text for pi-2')).toBeInTheDocument();
    expect(screen.getAllByText('4/5 gates')).toHaveLength(2);
    expect(screen.getByText('2 awaiting review')).toBeInTheDocument();
  });

  it('shows an honest empty state that names how items get here', async () => {
    render(<ReviewQueuePanel fetchQueue={queueOf([])} submitBatch={vi.fn()} />);
    expect(await screen.findByText(/Nothing awaiting review/)).toBeInTheDocument();
    expect(screen.getByText(/quality-gate ledger/)).toBeInTheDocument();
  });

  it('select-all checks every row and approve sends them all to the API', async () => {
    const submitBatch = vi.fn().mockResolvedValue({
      decision: 'approve', decided_by: 'admin-7', decided: 2, decided_item_ids: ['pi-1', 'pi-2'], failed: [],
    });
    render(<ReviewQueuePanel fetchQueue={queueOf([row('pi-1'), row('pi-2')])} submitBatch={submitBatch} />);
    await screen.findByText('Question text for pi-1');

    fireEvent.click(screen.getByLabelText('Select all items'));
    expect(screen.getByText('2 selected')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Approve 2/ }));
    await waitFor(() => expect(submitBatch).toHaveBeenCalledWith(['pi-1', 'pi-2'], 'approve', undefined));
  });

  it('a single checkbox selects just that item', async () => {
    const submitBatch = vi.fn().mockResolvedValue({
      decision: 'approve', decided_by: 'a', decided: 1, decided_item_ids: ['pi-2'], failed: [],
    });
    render(<ReviewQueuePanel fetchQueue={queueOf([row('pi-1'), row('pi-2')])} submitBatch={submitBatch} />);
    await screen.findByText('Question text for pi-2');

    fireEvent.click(screen.getByLabelText('Select pi-2'));
    fireEvent.click(screen.getByRole('button', { name: /Approve 1/ }));
    await waitFor(() => expect(submitBatch).toHaveBeenCalledWith(['pi-2'], 'approve', undefined));
  });

  it('refuses to reject without a reason, before calling the API', async () => {
    const submitBatch = vi.fn();
    render(<ReviewQueuePanel fetchQueue={queueOf([row('pi-1')])} submitBatch={submitBatch} />);
    await screen.findByText('Question text for pi-1');

    fireEvent.click(screen.getByLabelText('Select pi-1'));
    fireEvent.click(screen.getByRole('button', { name: /Reject 1/ }));
    expect(await screen.findByText(/Rejecting needs a reason/)).toBeInTheDocument();
    expect(submitBatch).not.toHaveBeenCalled();
  });

  it('sends the reason with a reject once one is typed', async () => {
    const submitBatch = vi.fn().mockResolvedValue({
      decision: 'reject', decided_by: 'a', decided: 1, decided_item_ids: ['pi-1'], failed: [],
    });
    render(<ReviewQueuePanel fetchQueue={queueOf([row('pi-1')])} submitBatch={submitBatch} />);
    await screen.findByText('Question text for pi-1');

    fireEvent.click(screen.getByLabelText('Select pi-1'));
    fireEvent.change(screen.getByLabelText(/Notes/), { target: { value: 'key says 4, answer is 5' } });
    fireEvent.click(screen.getByRole('button', { name: /Reject 1/ }));
    await waitFor(() =>
      expect(submitBatch).toHaveBeenCalledWith(['pi-1'], 'reject', 'key says 4, answer is 5'),
    );
  });

  it('expanding an item shows the proposed key, options and gate evidence', async () => {
    render(<ReviewQueuePanel fetchQueue={queueOf([row('pi-1')])} submitBatch={vi.fn()} />);
    await screen.findByText('Question text for pi-1');

    fireEvent.click(screen.getByLabelText('Toggle detail for pi-1'));
    expect(screen.getByText('— proposed key')).toBeInTheDocument();
    expect(screen.getByText('sum the diagonal')).toBeInTheDocument();
    expect(screen.getByText(/mathematics: pending/)).toBeInTheDocument();
  });

  it('B4: a mathematics gate reason naming wolfram_verified renders visibly in the expanded evidence', async () => {
    const wolframRow = row('pi-1', {
      gates: {
        scope: { status: 'passed', reason: 'concept resolves', decided_by: null, decided_at: null },
        mathematics: {
          status: 'passed',
          reason: 'cascade AGREED — wolfram_verified',
          decided_by: null,
          decided_at: null,
        },
        assessment_contract: { status: 'passed', reason: 'gradable', decided_by: null, decided_at: null },
        misconception_coverage: { status: 'waived', reason: 'not enforced', decided_by: null, decided_at: null },
        provenance: { status: 'passed', reason: 'run-1', decided_by: null, decided_at: null },
      },
    });
    render(<ReviewQueuePanel fetchQueue={queueOf([wolframRow])} submitBatch={vi.fn()} />);
    await screen.findByText('Question text for pi-1');

    fireEvent.click(screen.getByLabelText('Toggle detail for pi-1'));
    expect(screen.getByText(/mathematics: passed/)).toBeInTheDocument();
    expect(screen.getByText(/wolfram_verified/)).toBeInTheDocument();
  });

  it('the throughput meter reports what the operator actually did', async () => {
    const clock = 0;
    const submitBatch = vi.fn().mockResolvedValue({
      decision: 'approve', decided_by: 'a', decided: 2, decided_item_ids: ['pi-1', 'pi-2'], failed: [],
    });
    render(
      <ReviewQueuePanel
        fetchQueue={queueOf([row('pi-1'), row('pi-2')])}
        submitBatch={submitBatch}
        now={() => clock}
      />,
    );
    await screen.findByText('Question text for pi-1');
    expect(screen.getByText('0 decided')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Select all items'));
    fireEvent.click(screen.getByRole('button', { name: /Approve 2/ }));
    await waitFor(() => expect(screen.getByText('2 decided')).toBeInTheDocument());
    // The clock anchors at the first decision, so a fresh batch reads 0
    // elapsed — honest, not a fabricated rate.
    expect(screen.getByText(/min\/item/)).toBeInTheDocument();
  });

  it('j / k move the cursor and space toggles the item under it', async () => {
    render(<ReviewQueuePanel fetchQueue={queueOf([row('pi-1'), row('pi-2')])} submitBatch={vi.fn()} />);
    await screen.findByText('Question text for pi-1');
    const list = screen.getByRole('list');

    // Cursor starts on the first row; space selects it.
    fireEvent.keyDown(list, { key: ' ' });
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect((screen.getByLabelText('Select pi-1') as HTMLInputElement).checked).toBe(true);

    // j moves down, space selects the second, k moves back and space deselects.
    fireEvent.keyDown(list, { key: 'j' });
    fireEvent.keyDown(list, { key: ' ' });
    expect(screen.getByText('2 selected')).toBeInTheDocument();
    fireEvent.keyDown(list, { key: 'k' });
    fireEvent.keyDown(list, { key: ' ' });
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    expect((screen.getByLabelText('Select pi-1') as HTMLInputElement).checked).toBe(false);
  });

  it('surfaces a load failure instead of pretending the queue is empty', async () => {
    const fetchQueue = vi.fn().mockRejectedValue(new Error('DATABASE_URL not configured'));
    render(<ReviewQueuePanel fetchQueue={fetchQueue} submitBatch={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('DATABASE_URL not configured');
  });
});
