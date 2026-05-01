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
      className="my-3 w-full p-4 rounded-md bg-surface-900 border border-surface-800 hover:border-violet-500/40 transition-colors text-left"
    >
      <div className="text-xs uppercase tracking-wider text-violet-300/80 mb-1">
        {flipped ? 'Answer' : 'Recall'}
      </div>
      <div className="text-sm text-surface-100">{flipped ? back : front}</div>
      {!flipped && (
        <div className="mt-2 text-xs text-surface-500">Tap to reveal</div>
      )}
    </button>
  );
}
