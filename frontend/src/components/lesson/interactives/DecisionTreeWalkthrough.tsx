/**
 * DecisionTreeWalkthrough.tsx
 *
 * The W2.5 method-selection trainer: a `guided_walkthrough` whose spec
 * carries a `branches` tree renders here instead of the linear reveal.
 *
 * Interaction (plan W-UI):
 *   - A sequential question wizard, never a tree diagram. One question
 *     card per view, so it reads on a 375px screen.
 *   - Full-width 44px choice buttons.
 *   - A breadcrumb of the choices made so far, plus back navigation, so a
 *     student can re-decide without starting over.
 *   - ANY branch is walkable to its leaf. A wrong route is not blocked;
 *     the dead end IS the lesson, and the leaf says why in a sentence.
 *
 * Colour (DESIGN-SYSTEM.md):
 *   - Green marks the best leaf. This widget is the sanctioned exception
 *     to the other interactives' never-judge stance — green here means
 *     "correct method", the same thing it means everywhere else.
 *   - "Wrong" has no colour in Clarity. A non-best leaf gets neutral
 *     tokens and words ("Not the best route here — here's why"). No red,
 *     no hard-coded hex, no indigo (reserved for AI/tutor surfaces).
 *
 * Grading (plan amendment E5): SELF-CHECK ONLY. The spec ships to the
 * browser inside a fenced block, so the answer is client-visible and
 * leaf-grading in the browser would reintroduce the client-trusted-grading
 * hole the mock-exam fix closed. This component fires no callback, makes
 * no request, and feeds nothing into StudentModel. It carries the
 * SmartPracticePage honesty label to say so out loud. Measuring method
 * selection is the job of a server-graded item whose options are methods.
 *
 * Motion: none. Reveals here are navigation, not animation, so
 * prefers-reduced-motion is honoured trivially — there is nothing to
 * reduce.
 */

import { useMemo, useState } from 'react';
import { ArrowLeft, Check, CornerUpLeft, RotateCcw } from 'lucide-react';
import type { BranchLeaf, BranchNode, GuidedWalkthroughSpec } from './types';
import { MarkdownAtomRenderer } from '../MarkdownAtomRenderer';

/** The label a student sees on a leaf they should not have reached. */
export const NOT_BEST_HEADING = 'Not the best route here — here’s why';
/** The label on the sanctioned route. */
export const BEST_HEADING = 'That is the right call';
/** E5 honesty label — same wording family as SmartPracticePage. */
export const SELF_CHECK_LABEL =
  'Self-check — not exam grading, no marks recorded.';

interface Props {
  spec: GuidedWalkthroughSpec & { branches: NonNullable<GuidedWalkthroughSpec['branches']> };
}

interface TrailEntry {
  /** Node the choice was made at. */
  from: string;
  label: string;
  /** Node or leaf the choice led to. */
  next: string;
}

export function DecisionTreeWalkthrough({ spec }: Props) {
  const { branches } = spec;
  const [trail, setTrail] = useState<TrailEntry[]>([]);

  const nodesById = useMemo(
    () => new Map<string, BranchNode>(branches.nodes.map((n) => [n.id, n])),
    [branches],
  );
  const leavesById = useMemo(
    () => new Map<string, BranchLeaf>(branches.leaves.map((l) => [l.id, l])),
    [branches],
  );

  const rootId = branches.nodes[0].id;
  const currentId = trail.length > 0 ? trail[trail.length - 1].next : rootId;
  const node = nodesById.get(currentId);
  const leaf = leavesById.get(currentId);

  function choose(entry: TrailEntry) {
    setTrail((prev) => [...prev, entry]);
  }
  function back() {
    setTrail((prev) => prev.slice(0, -1));
  }
  function restart() {
    setTrail([]);
  }

  return (
    <div
      className="rounded-xl border p-4 space-y-3"
      style={{ borderColor: 'var(--separator)', background: 'var(--surface-fill)' }}
    >
      <header className="flex items-center justify-between gap-2">
        <h4
          className="font-semibold"
          style={{ color: 'var(--text-primary)', fontSize: 'var(--text-body)' }}
        >
          {spec.title}
        </h4>
        <span
          className="uppercase tracking-wide font-medium flex-shrink-0"
          style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-footnote)' }}
        >
          {leaf ? 'Result' : `Question ${trail.length + 1}`}
        </span>
      </header>

      {/* Breadcrumb of choices made. Plain text, not tappable — the Back
          button is the tappable affordance, at a full 44px. */}
      {trail.length > 0 && (
        <p
          data-testid="decision-breadcrumb"
          className="leading-relaxed"
          style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-subhead)' }}
        >
          {trail.map((t) => t.label).join(' → ')}
        </p>
      )}

      {node && (
        <div
          className="rounded-lg border p-3 space-y-3"
          style={{ background: 'var(--surface-card)', borderColor: 'var(--separator)' }}
        >
          <MarkdownAtomRenderer content={node.question} atomId={`${spec.title}.node.${node.id}.question`} />
          <div className="flex flex-col gap-2">
            {node.options.map((o) => (
              <button
                key={`${node.id}:${o.label}`}
                type="button"
                onClick={() => choose({ from: node.id, label: o.label, next: o.next })}
                className="w-full text-left rounded-md font-medium"
                style={{
                  background: 'var(--surface-fill-strong)',
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-body)',
                  minHeight: 44,
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingTop: 10,
                  paddingBottom: 10,
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {leaf && (
        <div
          data-testid="decision-leaf"
          data-best={leaf.best === true ? 'true' : 'false'}
          className="rounded-lg border p-3 space-y-2"
          style={
            leaf.best === true
              ? { background: 'var(--green-tint)', borderColor: 'var(--green)' }
              : { background: 'var(--surface-card)', borderColor: 'var(--separator)' }
          }
        >
          <div className="flex items-start gap-2">
            {leaf.best === true && (
              <Check
                size={16}
                className="mt-0.5 flex-shrink-0"
                style={{ color: 'var(--green-ink)' }}
                aria-hidden
              />
            )}
            <p
              className="font-semibold leading-relaxed"
              style={{
                color: leaf.best === true ? 'var(--green-ink)' : 'var(--text-primary)',
                fontSize: 'var(--text-body)',
              }}
            >
              {leaf.best === true ? BEST_HEADING : NOT_BEST_HEADING}
            </p>
          </div>
          <MarkdownAtomRenderer content={leaf.method} atomId={`${spec.title}.leaf.${leaf.id}.method`} />
          {/* Reason codes render as sentences, never codes. */}
          <div data-testid="decision-leaf-reason">
            <MarkdownAtomRenderer
              content={leaf.reason}
              atomId={`${spec.title}.leaf.${leaf.id}.reason`}
              className="vidhya-atom-body--hint-neutral"
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={back}
          disabled={trail.length === 0}
          className="inline-flex items-center justify-center gap-1.5 rounded-md font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'var(--surface-fill-strong)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-body)',
            minHeight: 44,
            paddingLeft: 16,
            paddingRight: 16,
          }}
        >
          {leaf ? <CornerUpLeft size={16} aria-hidden /> : <ArrowLeft size={16} aria-hidden />}
          {leaf ? 'Walk back' : 'Back'}
        </button>
        <button
          type="button"
          onClick={restart}
          disabled={trail.length === 0}
          className="inline-flex items-center justify-center gap-1.5 rounded-md font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'var(--surface-fill)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-body)',
            minHeight: 44,
            paddingLeft: 16,
            paddingRight: 16,
            border: 'var(--hairline) solid var(--separator)',
          }}
        >
          <RotateCcw size={16} aria-hidden />
          Start over
        </button>
      </div>

      <p
        className="leading-relaxed"
        style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-footnote)' }}
      >
        {SELF_CHECK_LABEL}
      </p>

      {spec.caption && (
        <p
          className="leading-relaxed"
          style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-footnote)' }}
        >
          {spec.caption}
        </p>
      )}
    </div>
  );
}
