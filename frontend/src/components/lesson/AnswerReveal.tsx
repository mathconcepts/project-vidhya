/**
 * AnswerReveal — the disclosure control for an atom's hidden answer.
 *
 * ## Why this exists
 *
 * Every `micro_exercise` and `retrieval_prompt` atom in the content base
 * (200 files across 100 concepts as of this commit) authors its answer
 * inside a `<details><summary>Answer</summary> … </details>` block. The
 * author's intent is unambiguous: the student attempts the question, THEN
 * reveals.
 *
 * `MarkdownAtomRenderer`'s pipeline ran `remark-rehype` with
 * `allowDangerousHtml: false`, which drops raw-HTML nodes from the tree.
 * It dropped the `<details>` and `</details>` markers — but the answer
 * paragraphs BETWEEN them are ordinary markdown, so they survived and
 * rendered as open body prose. Net effect: every retrieval atom on the
 * platform displayed its own answer directly beneath the question, and the
 * "Not yet / Got it" self-grade buttons underneath were asking a student to
 * grade a recall they were never given a chance to attempt.
 *
 * The fix is NOT `allowDangerousHtml: true` + `rehype-raw`. Atom bodies are
 * not all repo-authored — `applyStudentOverrides` / `applyAbVariants` serve
 * generated variants, and the generation path reaches an LLM. Turning on raw
 * HTML passthrough to fix a disclosure widget would open arbitrary markup
 * injection on a student-facing surface. Instead `remarkDetailsTransform`
 * (in MarkdownAtomRenderer) folds the open/close HTML markers into a single
 * mdast container node routed here, and no raw HTML is ever passed through.
 *
 * ## Design
 *
 * DESIGN-SYSTEM.md compliance:
 *   - Neutral, not green. Revealing an answer is not mastery — green is
 *     reserved for correctness/mastery, and the student has not been graded
 *     at the moment they tap this. The `Got it` button below the card is
 *     where green legitimately appears.
 *   - 44px minimum touch target on the trigger row.
 *   - One curve (`--ease-standard`), one duration (`--dur-base`), and the
 *     token collapses to 1ms under `prefers-reduced-motion` on its own, so
 *     no separate reduced-motion branch is needed here.
 *   - Hairline separation, no box inside the focal card ("one focal block
 *     per screen").
 */

import { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AnswerRevealProps {
  /** Text from the authored `<summary>`, e.g. "Answer". Falls back to "Answer". */
  summary?: string;
  /** The parsed answer body — already through remark-math/KaTeX. */
  children?: React.ReactNode;
}

export function AnswerReveal({ summary, children }: AnswerRevealProps) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const label = (summary ?? '').trim() || 'Answer';

  return (
    <div
      data-testid="answer-reveal"
      style={{
        marginTop: 16,
        borderTop: 'var(--hairline) solid var(--separator)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={bodyId}
        data-testid="answer-reveal-trigger"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          minHeight: 44,
          padding: '0',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          font: 'inherit',
          fontSize: 'var(--text-subhead)',
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--text-secondary)',
          textAlign: 'left',
        }}
      >
        <ChevronDown
          size={16}
          aria-hidden
          style={{
            flexShrink: 0,
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform var(--dur-base) var(--ease-standard)',
          }}
        />
        {/*
          The label is the student's instruction, not a heading: before the
          reveal it must read as an action ("Show answer"), because a bare
          noun ("Answer") next to a chevron reads as a section that is simply
          collapsed — something to skip past rather than something to do.
          After the reveal the authored word stands on its own as the label
          for what is now on screen.
        */}
        <span>{open ? label : `Show ${label.toLowerCase()}`}</span>
      </button>

      {/*
        Unmounted, not `display: none`, while collapsed. A hidden-but-present
        answer is still in the accessibility tree for a screen reader and
        still findable with the browser's own find-in-page — either one hands
        the answer to the student the disclosure exists to withhold.
      */}
      {open && (
        <div
          id={bodyId}
          data-testid="answer-reveal-body"
          style={{
            paddingBottom: 4,
            animation: 'vidhya-answer-in var(--dur-base) var(--ease-standard)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
