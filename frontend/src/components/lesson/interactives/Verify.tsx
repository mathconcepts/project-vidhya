/**
 * Verify — `:::verify` directive client.
 *
 * Backed by POST /api/lesson/verify. The route uses Wolfram when
 * WOLFRAM_APP_ID is set, otherwise falls back to a deterministic local
 * equality check, so the experience never breaks in dev.
 *
 * Atom markdown shape:
 *
 *   :::verify{expected="d/dx[x^2]"}
 *   What is the derivative of x²?
 *   :::
 *
 * The `expected` attr carries the canonical answer; the directive's text
 * (after the opening line) is the prompt shown to the student.
 */

import { useState } from 'react';
import type { DirectiveProps } from './registry';
import { CheckCircle2, XCircle, HelpCircle, Loader2 } from 'lucide-react';

interface VerifyAttrs {
  expected?: string;
  prompt?: string;
}

type Status = 'idle' | 'pending' | 'verified' | 'failed' | 'inconclusive';

export default function Verify({ attrs }: DirectiveProps) {
  const a = attrs as VerifyAttrs;
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [detail, setDetail] = useState<string | null>(null);

  if (!a.expected) {
    throw new Error('Verify: missing expected attribute');
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setStatus('pending');
    setDetail(null);
    try {
      const r = await fetch('/api/lesson/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_input: input, expected: a.expected }),
      });
      const j = await r.json();
      setStatus(j.status as Status);
      setDetail(j.detail ? `${j.source}: ${j.detail}` : j.source);
    } catch {
      setStatus('inconclusive');
      setDetail('network error');
    }
  };

  const StatusBadge = () => {
    if (status === 'verified') {
      return (
        <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--green-ink)' }}>
          <CheckCircle2 size={14} /> Verified
        </span>
      );
    }
    if (status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--red)' }}>
          <XCircle size={14} /> Not equivalent
        </span>
      );
    }
    if (status === 'inconclusive') {
      return (
        <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--orange)' }}>
          <HelpCircle size={14} /> Couldn't verify
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <Loader2 size={14} className="animate-spin" /> Checking…
        </span>
      );
    }
    return null;
  };

  return (
    <form
      onSubmit={onSubmit}
      className="my-3 rounded-md border p-3 space-y-2"
      style={{ borderColor: 'var(--separator)', background: 'var(--surface-card)' }}
    >
      {a.prompt && (
        <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{a.prompt}</div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Your answer (e.g. 2*x)"
          className="flex-1 rounded border px-2 py-1.5 text-sm font-mono focus:outline-none"
          style={{
            background: 'var(--surface-fill)',
            borderColor: 'var(--separator)',
            color: 'var(--green-ink)',
          }}
          aria-label="Your answer"
        />
        <button
          type="submit"
          disabled={status === 'pending' || !input.trim()}
          className="px-3 py-1.5 rounded text-sm font-semibold disabled:opacity-40"
          style={{ background: 'var(--surface-fill-strong)', color: 'var(--text-primary)' }}
        >
          Check
        </button>
      </div>
      <div className="flex items-center justify-between min-h-[18px]">
        <StatusBadge />
        {detail && (
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{detail}</span>
        )}
      </div>
    </form>
  );
}
