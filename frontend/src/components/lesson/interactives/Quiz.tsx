/**
 * Quiz — inline multi-choice quiz directive.
 *
 * Authoring shape:
 *   :::quiz{question="What is d/dx(x^2)?" answer="2x"}
 *   - x
 *   - 2x
 *   - x^2
 *   :::
 *
 * For now we accept the answer + a comma-separated `options` attr to keep the
 * MVP simple. The full markdown-children-as-options pattern is a follow-up.
 *
 * On select: visual feedback (emerald=correct, amber=incorrect), no submission.
 * Engagement is logged at atom-leave via the existing engagement endpoint.
 */

import { useState } from 'react';
import type { DirectiveProps } from './registry';

interface QuizAttrs {
  question?: string;
  answer?: string;
  options?: string; // comma-separated
}

export default function Quiz({ attrs }: DirectiveProps) {
  const a = attrs as QuizAttrs;
  const question = a.question ?? '';
  const answer = (a.answer ?? '').trim();
  const options = (a.options ?? '').split(',').map((o) => o.trim()).filter(Boolean);
  const [selected, setSelected] = useState<string | null>(null);

  if (!question || options.length === 0 || !answer) {
    throw new Error('Quiz: requires question, answer, and options attrs');
  }

  return (
    <div className="my-3 p-3 rounded-md bg-surface-900/60 border border-surface-800">
      <p className="text-sm font-medium text-surface-200 mb-2">{question}</p>
      <ul className="space-y-1.5">
        {options.map((opt) => {
          const isSelected = selected === opt;
          const isCorrect = isSelected && opt === answer;
          const isWrong = isSelected && opt !== answer;
          return (
            <li key={opt}>
              <button
                onClick={() => setSelected(opt)}
                aria-pressed={isSelected}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  isCorrect
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200'
                    : isWrong
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-200'
                      : 'bg-surface-800 border border-surface-700 text-surface-300 hover:border-surface-600'
                } ${selected != null && !isSelected ? 'opacity-50' : ''}`}
              >
                {opt}
                {isCorrect && <span className="ml-2 text-xs">✓ correct</span>}
                {isWrong && <span className="ml-2 text-xs">try again</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
