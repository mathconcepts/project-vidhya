/**
 * ReviewQueuePanel — D4's item-level review queue, on the BulkApprovePanel
 * pattern (run → list → checkbox → bulk decide, keyboard-navigable).
 *
 * What the operator decides here is ONE thing: the `mathematics` gate — is
 * the answer key right? The other four gates were decided mechanically by
 * the batch pipeline and are shown, not editable.
 *
 * ── The throughput meter is the instrument, not decoration ───────────────
 *
 * The 50-item anatomy pilot exists to MEASURE operator minutes-per-item
 * (plan W3.5, premise 5: verification labor is the bottleneck). This panel
 * is where that measurement happens, so the number is on screen and live:
 * items decided this session ÷ elapsed since the first decision. It is
 * session-local and deliberately not persisted — the decisions themselves
 * are the durable record, and a fabricated cross-session average would be
 * worse than an honest per-sitting one. The clock starts at the FIRST
 * decision, not at page load, so leaving the tab open over lunch does not
 * quietly inflate the number the pilot reports.
 *
 * Vidhya Clarity: tokens only, no new colours. Admin density is acceptable
 * here (13px metadata, tight rows) but every control stays a real target.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronRight, Loader2, RefreshCw, X } from 'lucide-react';
import {
  CONTENT_GATES,
  decideBatch,
  listReviewQueue,
  type ContentGate,
  type GateStatus,
  type ReviewDecision,
  type ReviewQueueRow,
} from '@/api/admin/review-queue';

/** Colour per gate status — semantic only, from the two-accent palette. */
function statusColor(status: GateStatus | undefined): string {
  switch (status) {
    case 'passed':
      return 'var(--green-ink)';
    case 'waived':
      return 'var(--text-tertiary)';
    case 'failed':
      return 'var(--red)';
    default:
      return 'var(--orange)';
  }
}

const GATE_SHORT: Record<ContentGate, string> = {
  scope: 'scope',
  mathematics: 'math',
  assessment_contract: 'contract',
  misconception_coverage: 'misconception',
  provenance: 'provenance',
};

// ── Throughput ─────────────────────────────────────────────────────────────

export interface Throughput {
  decided: number;
  elapsedMs: number;
  minutesPerItem: number | null;
}

/**
 * Pure — exported so the number the pilot reports is a tested function, not
 * an inline expression nobody checks. Returns null minutes-per-item until
 * there is a real interval to divide by (one decision has no elapsed time
 * yet, and 0/1 would read as "instant").
 */
export function computeThroughput(decided: number, firstDecisionAt: number | null, now: number): Throughput {
  // `== null`, not falsy: a clock legitimately reads 0 (test clocks do, and
  // so does any monotonic origin), and treating that as "not started" is
  // exactly the bug that would silently zero the pilot's measurement.
  if (firstDecisionAt == null || decided === 0) return { decided, elapsedMs: 0, minutesPerItem: null };
  const elapsedMs = Math.max(0, now - firstDecisionAt);
  if (decided < 2 || elapsedMs <= 0) return { decided, elapsedMs, minutesPerItem: null };
  return { decided, elapsedMs, minutesPerItem: elapsedMs / 60000 / decided };
}

export function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

// ── Panel ──────────────────────────────────────────────────────────────────

export interface ReviewQueuePanelProps {
  /** Injected in tests; defaults to the real client. */
  fetchQueue?: typeof listReviewQueue;
  submitBatch?: typeof decideBatch;
  /** Injected in tests so the throughput clock is deterministic. */
  now?: () => number;
}

export function ReviewQueuePanel({
  fetchQueue = listReviewQueue,
  submitBatch = decideBatch,
  now = () => Date.now(),
}: ReviewQueuePanelProps) {
  const [rows, setRows] = useState<ReviewQueueRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runFilter, setRunFilter] = useState<string>('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // Throughput state — session-local, see the header note.
  const [decidedCount, setDecidedCount] = useState(0);
  const [firstDecisionAt, setFirstDecisionAt] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  // A queue fetch outruns the operator navigating away often enough to
  // matter: without this guard the resolved promise writes into an
  // unmounted component (React warns, and the write is meaningless).
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await fetchQueue({ run: runFilter || undefined, status: 'pending', limit: 200 });
      if (!mounted.current) return;
      setRows(r.items);
      setSelected(new Set());
      setCursor(0);
    } catch (e) {
      if (!mounted.current) return;
      setRows([]);
      setError((e as Error).message);
    }
  }, [fetchQueue, runFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  // Re-render once a second only while a measurement is actually running.
  useEffect(() => {
    if (firstDecisionAt == null) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [firstDecisionAt]);

  const throughput = useMemo(
    () => computeThroughput(decidedCount, firstDecisionAt, now()),
    // `tick` is the deliberate re-compute trigger for the live clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [decidedCount, firstDecisionAt, tick, now],
  );

  const runs = useMemo(() => [...new Set((rows ?? []).map((r) => r.generation_run_id))].sort(), [rows]);

  const toggle = useCallback((itemId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  const allChecked = rows != null && rows.length > 0 && selected.size === rows.length;
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set((rows ?? []).map((r) => r.item_id)));

  const submit = async (decision: ReviewDecision) => {
    if (selected.size === 0 || !rows) return;
    if (decision === 'reject' && notes.trim().length === 0) {
      setOutcome('Rejecting needs a reason — say what is wrong with the key so the next operator can fix it.');
      return;
    }
    setSubmitting(true);
    setOutcome(null);
    try {
      const ids = rows.filter((r) => selected.has(r.item_id)).map((r) => r.item_id);
      const res = await submitBatch(ids, decision, notes.trim() || undefined);
      if (!mounted.current) return;
      const at = now();
      setFirstDecisionAt((prev) => prev ?? at);
      setDecidedCount((c) => c + res.decided);
      setOutcome(
        `${res.decided} ${decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'returned for fix'}` +
          (res.failed.length > 0 ? `, ${res.failed.length} failed: ${res.failed[0].reason}` : '.'),
      );
      setNotes('');
      await load();
    } catch (e) {
      if (mounted.current) setOutcome((e as Error).message);
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  };

  // j/k (and arrows) move the cursor, space toggles, enter expands.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!rows || rows.length === 0) return;
    if (e.key === 'j' || e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(rows.length - 1, c + 1));
    } else if (e.key === 'k' || e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === ' ') {
      e.preventDefault();
      toggle(rows[cursor].item_id);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      setExpanded((x) => (x === rows[cursor].item_id ? null : rows[cursor].item_id));
    }
  };

  if (rows === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)', fontSize: 'var(--text-caption)' }}>
        <Loader2 size={14} className="animate-spin" /> Loading review queue…
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ThroughputMeter throughput={throughput} />

      {/* Run selector + refresh */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <label htmlFor="run-filter" style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
          Run
        </label>
        <select
          id="run-filter"
          value={runFilter}
          onChange={(e) => setRunFilter(e.target.value)}
          style={{
            minHeight: 32,
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--separator)',
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-caption)',
          }}
        >
          <option value="">All runs</option>
          {runs.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void load()}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, minHeight: 32, padding: '4px 10px',
            borderRadius: 'var(--radius-sm)', border: '1px solid var(--separator)',
            background: 'transparent', color: 'var(--text-secondary)', fontSize: 'var(--text-caption)',
          }}
        >
          <RefreshCw size={12} /> Refresh
        </button>
        <span style={{ marginLeft: 'auto', fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
          {rows.length} awaiting review
        </span>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--separator)',
            background: 'var(--red-tint)', color: 'var(--red-ink)', fontSize: 'var(--text-caption)',
          }}
        >
          {error}
        </div>
      )}

      {rows.length === 0 && !error ? (
        <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
          Nothing awaiting review. Items enter this queue when a generation run writes its
          quality-gate ledger — the <code>mathematics</code> gate opens as pending and only an
          operator decision here can close it. See <code>docs/ops/content-verification-runbook.md</code>.
        </p>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', minHeight: 32 }}>
              <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Select all items" style={{ accentColor: 'var(--indigo)' }} />
              Select all
            </label>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
              {selected.size} selected
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)' }}>
              j / k to move · space to select · enter to expand
            </span>
          </div>

          <div
            role="list"
            tabIndex={0}
            onKeyDown={onKeyDown}
            aria-label="Items awaiting answer-key review"
            style={{ outline: 'none', display: 'flex', flexDirection: 'column' }}
          >
            {rows.map((row, i) => (
              <ReviewRow
                key={row.item_id}
                row={row}
                checked={selected.has(row.item_id)}
                cursored={i === cursor}
                expanded={expanded === row.item_id}
                onToggle={() => toggle(row.item_id)}
                onExpand={() => setExpanded((x) => (x === row.item_id ? null : row.item_id))}
              />
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label htmlFor="decision-notes" style={{ fontSize: 'var(--text-caption)', color: 'var(--text-tertiary)' }}>
              Notes (required to reject)
            </label>
            <textarea
              id="decision-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="What is wrong with the key, or what the fixer needs to change."
              style={{
                padding: 8, borderRadius: 'var(--radius-sm)', border: '1px solid var(--separator)',
                background: 'var(--surface-card)', color: 'var(--text-primary)',
                fontSize: 'var(--text-caption)', fontFamily: 'var(--font-sans)', resize: 'vertical',
              }}
            />
          </div>

          {outcome && (
            <div
              role="status"
              style={{
                padding: '8px 10px', borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-fill)', color: 'var(--text-secondary)', fontSize: 'var(--text-caption)',
              }}
            >
              {outcome}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={submitting || selected.size === 0}
              onClick={() => void submit('needs_fix')}
              style={{
                minHeight: 'var(--touch-min)', padding: '8px 14px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--separator)', background: 'transparent',
                color: 'var(--text-secondary)', fontSize: 'var(--text-caption)',
                opacity: submitting || selected.size === 0 ? 0.5 : 1,
              }}
            >
              Needs fix
            </button>
            <button
              type="button"
              disabled={submitting || selected.size === 0}
              onClick={() => void submit('reject')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                minHeight: 'var(--touch-min)', padding: '8px 14px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--separator)', background: 'var(--red-tint)',
                color: 'var(--red-ink)', fontSize: 'var(--text-caption)',
                opacity: submitting || selected.size === 0 ? 0.5 : 1,
              }}
            >
              <X size={13} /> Reject {selected.size}
            </button>
            <button
              type="button"
              disabled={submitting || selected.size === 0}
              onClick={() => void submit('approve')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                minHeight: 'var(--touch-min)', padding: '8px 14px', borderRadius: 'var(--radius-md)',
                border: 'none', background: 'var(--green)', color: 'var(--text-on-accent)',
                fontSize: 'var(--text-caption)', fontWeight: 'var(--weight-medium)',
                opacity: submitting || selected.size === 0 ? 0.5 : 1,
              }}
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Approve {selected.size}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ThroughputMeter({ throughput }: { throughput: Throughput }) {
  return (
    <div
      aria-label="Session throughput"
      style={{
        display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap',
        padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--surface-fill)',
      }}
    >
      <span style={{ fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
        This session
      </span>
      <span style={{ fontSize: 'var(--text-callout)', color: 'var(--text-primary)', fontWeight: 'var(--weight-semibold)', fontVariantNumeric: 'tabular-nums' }}>
        {throughput.decided} decided
      </span>
      <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
        {formatElapsed(throughput.elapsedMs)} elapsed
      </span>
      <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
        {throughput.minutesPerItem == null
          ? '— min/item (needs 2 decisions)'
          : `${throughput.minutesPerItem.toFixed(2)} min/item`}
      </span>
      <span style={{ marginLeft: 'auto', fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)' }}>
        Clock starts at your first decision. Not persisted — record it in the runbook.
      </span>
    </div>
  );
}

function ReviewRow({
  row,
  checked,
  cursored,
  expanded,
  onToggle,
  onExpand,
}: {
  row: ReviewQueueRow;
  checked: boolean;
  cursored: boolean;
  expanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
}) {
  const d = row.detail;
  return (
    <div
      role="listitem"
      data-testid={`review-row-${row.item_id}`}
      style={{
        borderBottom: '1px solid var(--separator)',
        background: cursored ? 'var(--surface-fill)' : 'transparent',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 6px', minHeight: 'var(--touch-min)' }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={`Select ${row.item_id}`}
          style={{ accentColor: 'var(--indigo)' }}
        />
        <button
          type="button"
          onClick={onExpand}
          aria-expanded={expanded}
          aria-label={`Toggle detail for ${row.item_id}`}
          style={{ display: 'flex', alignItems: 'center', background: 'transparent', border: 'none', color: 'var(--text-tertiary)', padding: 2 }}
        >
          <ChevronRight size={13} style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: `transform var(--dur-fast) var(--ease-standard)` }} />
        </button>
        <span style={{ flex: 1, minWidth: 0, fontSize: 'var(--text-caption)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {d.question_text ?? row.item_id}
        </span>
        {row.needs_fix && (
          <span style={{ fontSize: 'var(--text-caption2)', color: 'var(--orange-ink)' }}>needs fix</span>
        )}
        <span style={{ fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
          {row.gates_satisfied}/{row.gates_total} gates
        </span>
        <span style={{ display: 'flex', gap: 4 }}>
          {CONTENT_GATES.map((g) => (
            <span
              key={g}
              title={`${g}: ${row.gates[g]?.status ?? 'no row'} — ${row.gates[g]?.reason ?? 'not recorded'}`}
              style={{ fontSize: 'var(--text-caption2)', color: statusColor(row.gates[g]?.status) }}
            >
              {GATE_SHORT[g]}
            </span>
          ))}
        </span>
      </div>

      {expanded && (
        <div style={{ padding: '4px 6px 14px 34px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Meta label="Item" value={row.item_id} />
          <Meta label="Run" value={row.generation_run_id} />
          <Meta label="Source" value={d.source} />
          <Meta label="Kind" value={`${d.question_type ?? 'unmarked'}${d.marks != null ? ` · ${d.marks} marks` : ''}`} />
          {d.question_text && <Block label="Question">{d.question_text}</Block>}

          {d.options && d.options.length > 0 && (
            <div>
              <MetaLabel>Options</MetaLabel>
              <ol style={{ margin: '4px 0 0', paddingLeft: 20, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                {d.options.map((opt, i) => {
                  const correct = d.answer_index === i || (d.answer_indices ?? []).includes(i);
                  const tag = d.distractor_failure_tags?.[String(i)];
                  return (
                    <li key={i} style={{ color: correct ? 'var(--green-ink)' : 'var(--text-secondary)' }}>
                      {opt}
                      {correct && <strong> — proposed key</strong>}
                      {tag && <span style={{ color: 'var(--text-tertiary)' }}> · {tag}</span>}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {d.answer_range && (
            <Meta label="Accepted range" value={`${d.answer_range[0]} … ${d.answer_range[1]}`} />
          )}
          {d.correct_answer != null && <Meta label="Proposed key" value={String(d.correct_answer)} />}
          {d.solution_steps && d.solution_steps.length > 0 && (
            <div>
              <MetaLabel>Worked solution</MetaLabel>
              <ol style={{ margin: '4px 0 0', paddingLeft: 20, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                {d.solution_steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          )}

          <div>
            <MetaLabel>Gate evidence</MetaLabel>
            <ul style={{ margin: '4px 0 0', paddingLeft: 16, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
              {CONTENT_GATES.map((g) => (
                <li key={g} style={{ fontSize: 'var(--text-caption2)', color: 'var(--text-secondary)' }}>
                  <span style={{ color: statusColor(row.gates[g]?.status), fontWeight: 'var(--weight-medium)' }}>
                    {g}: {row.gates[g]?.status ?? 'no row'}
                  </span>
                  {row.gates[g]?.reason ? ` — ${row.gates[g]!.reason}` : ''}
                  {row.gates[g]?.decided_by ? ` (by ${row.gates[g]!.decided_by})` : ''}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function MetaLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: 'var(--text-caption2)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-caps)' }}>
      {children}
    </span>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
      <MetaLabel>{label}</MetaLabel>
      <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <MetaLabel>{label}</MetaLabel>
      <p style={{ margin: '4px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-primary)', lineHeight: 'var(--leading-normal)' }}>
        {children}
      </p>
    </div>
  );
}
