/**
 * Recall — flashcard-style flip directive.
 *
 *   :::recall{front="What's the derivative of sin x?" back="cos x"}
 *   :::
 *
 * Click to flip; engagement logged on flip.
 */

import { useState } from 'react';
import type { DirectiveProps } from './registry';

interface RecallAttrs {
  front?: string;
  back?: string;
  prompt?: string;
  answer?: string;
}

export default function Recall({ attrs }: DirectiveProps) {
  const a = attrs as RecallAttrs;
  const front = a.front ?? a.prompt ?? '';
  const back = a.back ?? a.answer ?? '';
  const [flipped, setFlipped] = useState(false);

  if (!front || !back) {
    throw new Error('Recall: requires front+back (or prompt+answer) attrs');
  }

  return (
    <button
      onClick={() => setFlipped((f) => !f)}
      aria-label={flipped ? 'Hide answer' : 'Reveal answer'}
      aria-pressed={flipped}
      className="my-3 w-full p-4 rounded-md border transition-colors text-left"
      style={{
        background: 'var(--surface-card)',
        borderColor: flipped ? 'rgba(88,86,214,.4)' : 'var(--separator)',
      }}
    >
      <div
        className="text-xs uppercase tracking-wider mb-1"
        style={{ color: 'rgba(88,86,214,.8)' }}
      >
        {flipped ? 'Answer' : 'Recall'}
      </div>
      <div className="text-sm" style={{ color: 'var(--text-primary)' }}>{flipped ? back : front}</div>
      {!flipped && (
        <div className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>Tap to reveal</div>
      )}
    </button>
  );
}
