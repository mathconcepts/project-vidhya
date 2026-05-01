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
        <span className="inline-flex items-center gap-1 text-emerald-300 text-xs">
          <CheckCircle2 size={14} /> Verified
        </span>
      );
    }
    if (status === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 text-rose-300 text-xs">
          <XCircle size={14} /> Not equivalent
        </span>
      );
    }
    if (status === 'inconclusive') {
      return (
        <span className="inline-flex items-center gap-1 text-amber-300 text-xs">
          <HelpCircle size={14} /> Couldn't verify
        </span>
      );
    }
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 text-violet-300 text-xs">
          <Loader2 size={14} className="animate-spin" /> Checking…
        </span>
      );
    }
    return null;
  };

  return (
    <form
      onSubmit={onSubmit}
      className="my-3 rounded-md border border-surface-800 bg-surface-900/50 p-3 space-y-2"
    >
      {a.prompt && <div className="text-sm text-surface-200">{a.prompt}</div>}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Your answer (e.g. 2*x)"
          className="flex-1 rounded bg-surface-950 border border-surface-700 px-2 py-1.5 text-sm font-mono text-emerald-200 focus:border-emerald-500/50 focus:outline-none"
          aria-label="Your answer"
        />
        <button
          type="submit"
          disabled={status === 'pending' || !input.trim()}
          className="px-3 py-1.5 rounded bg-violet-500 hover:bg-violet-400 disabled:opacity-40 text-white text-sm font-semibold"
        >
          Check
        </button>
      </div>
      <div className="flex items-center justify-between min-h-[18px]">
        <StatusBadge />
        {detail && <span className="text-[10px] text-surface-500">{detail}</span>}
      </div>
    </form>
  );
}
