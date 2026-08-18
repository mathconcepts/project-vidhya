/**
 * WarmupProbeScreen — wireframe 1 (docs/designs/linear-algebra-wireframes.html).
 *
 * Presentational: takes the current probe + progress as props, calls back
 * on answer. No fetching here — WarmupPage.tsx owns the state machine.
 */
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  buildSegmentProgress,
  WARMUP_FRAMING_COPY,
  WARMUP_NOT_GRADED_LABEL,
  HAVENT_LEARNED_SENTINEL,
  type SpineConcept,
} from '@/lib/warmup-logic';

export interface WarmupProbe {
  id: string;
  questionText: string;
  options: string[];
}

export interface WarmupProbeScreenProps {
  spine: SpineConcept[];
  conceptIndex: number;
  probe: WarmupProbe;
  /** true only before the very first probe of the whole flow. */
  showFraming: boolean;
  pending: boolean;
  onAnswer: (selectedIndex: number) => void;
  onStopHere: () => void;
}

export function WarmupProbeScreen({
  spine,
  conceptIndex,
  probe,
  showFraming,
  pending,
  onAnswer,
  onStopHere,
}: WarmupProbeScreenProps) {
  const [selected, setSelected] = useState<number | null>(null);
  // Reset the local selection every time a new probe arrives — no stale
  // highlight bleeding from the previous question through the crossfade.
  useEffect(() => setSelected(null), [probe.id]);

  const { segments, label } = buildSegmentProgress(conceptIndex, spine);
  const options = [...probe.options, "I haven't learned this yet"];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 'var(--text-title3)', fontWeight: 'var(--weight-semibold)', letterSpacing: 'var(--tracking-title)', color: 'var(--text-primary)' }}>
          Your starting line
        </h1>
        <button
          type="button"
          onClick={onStopHere}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 'var(--text-subhead)', color: 'var(--indigo-ink)', fontWeight: 'var(--weight-medium)',
          }}
        >
          Stop here
        </button>
      </div>

      {/* 5-segment bar — never a per-probe dot row. */}
      <div style={{ display: 'flex', gap: 4 }}>
        {segments.map((s, i) => (
          <i
            key={i}
            aria-hidden="true"
            style={{
              flex: 1, height: 3, borderRadius: 999,
              background: s === 'done' ? 'var(--green)' : s === 'now' ? 'var(--ink, var(--text-primary))' : 'var(--surface-fill)',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', minHeight: 'auto' }}>
        <span style={{ fontSize: 'var(--text-footnote)', color: 'var(--text-tertiary)' }}>{label}</span>
        <span style={{ fontSize: 'var(--text-footnote)', color: 'var(--text-tertiary)' }}>{WARMUP_NOT_GRADED_LABEL}</span>
      </div>

      <Card elevated padding={20} style={{ opacity: pending ? 0.6 : 1, transition: `opacity var(--dur-fast) var(--ease-standard)` }}>
        <p style={{ margin: '2px 0 14px', fontSize: 'var(--text-body)', letterSpacing: 'var(--tracking-body)', color: 'var(--text-primary)' }}>
          {probe.questionText}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {options.map((opt, i) => {
            const isHaventLearned = i === probe.options.length;
            const value = isHaventLearned ? -1 : i;
            const isSelected = selected === value;
            return (
              <button
                key={i}
                type="button"
                disabled={pending}
                onClick={() => setSelected(value)}
                style={{
                  minHeight: 'var(--touch-min)',
                  display: 'flex', alignItems: 'center',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${isSelected ? 'var(--text-primary)' : 'var(--separator)'}`,
                  background: isSelected ? 'var(--surface-fill)' : 'var(--surface-card)',
                  fontSize: 'var(--text-body)',
                  fontWeight: isSelected ? 'var(--weight-medium)' : 'var(--weight-regular)',
                  color: isHaventLearned ? 'var(--text-secondary)' : 'var(--text-primary)',
                  textAlign: 'left',
                  cursor: pending ? 'default' : 'pointer',
                  transition: 'background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)',
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
        <Button
          tone="mastery"
          size="lg"
          full
          disabled={selected === null || pending}
          onClick={() => selected !== null && onAnswer(selected)}
          style={{ marginTop: 14 }}
        >
          Continue
        </Button>
      </Card>

      {showFraming && (
        <p style={{ margin: 0, textAlign: 'center', fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          {WARMUP_FRAMING_COPY}
        </p>
      )}
    </div>
  );
}
