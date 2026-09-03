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
 *
 * `startAt` (wizard-mistake-loop follow-up, 2026-09-03): the wizard used to
 * always open at `branches.nodes[0]`, so a student diagnosed with a SPECIFIC
 * mistake (e.g. "picked trace(A) for invertibility") still had to re-walk
 * the topic's WHOLE classification chain before reaching the fork that
 * actually mattered. `startAt` is a render-time hint — never part of the
 * persisted spec, so an authored `branches` tree means the same thing
 * everywhere it's used — naming the node id to open at instead. An unknown
 * or absent id fails closed to the true root (never a broken render, never
 * a guess): a caller passes a value it computed from real data (the
 * concept→node map in method-selection-trainers.ts) or nothing at all.
 * `restart()` returns to that same deep-linked fork, not the true root —
 * "start over" means "try this decision again," not "abandon the shortcut."
 * A separate "see the full picture" control (rendered only when the deep
 * link is actually in effect) is the one way to walk from the true root.
 */

import { useMemo, useState } from 'react';
import { ArrowLeft, Check, CornerUpLeft, RotateCcw, Route } from 'lucide-react';
import type { BranchLeaf, BranchNode, GuidedWalkthroughSpec } from './types';
import { MarkdownAtomRenderer } from '../MarkdownAtomRenderer';
import { Button } from '@/components/ui/Button';

/** The label a student sees on a leaf they should not have reached. */
export const NOT_BEST_HEADING = 'Not the best route here — here’s why';
/** The label on the sanctioned route. */
export const BEST_HEADING = 'That is the right call';
/** E5 honesty label — same wording family as SmartPracticePage. */
export const SELF_CHECK_LABEL =
  'Self-check — not exam grading, no marks recorded.';
/** Shown above the tree when a valid `startAt` skipped the classification chain. */
export const DEEP_LINK_NOTE = 'Jumping straight to where this went wrong.';
/** The escape hatch back to the true root, from a deep-linked entry. */
export const FULL_PICTURE_LABEL = 'See the full picture from the top';

interface Props {
  spec: GuidedWalkthroughSpec & { branches: NonNullable<GuidedWalkthroughSpec['branches']> };
  /** See the file-level doc comment above. */
  startAt?: string;
}

interface TrailEntry {
  /** Node the choice was made at. */
  from: string;
  label: string;
  /** Node or leaf the choice led to. */
  next: string;
}

export function DecisionTreeWalkthrough({ spec, startAt }: Props) {
  const { branches } = spec;
  const [trail, setTrail] = useState<TrailEntry[]>([]);
  const [fromTrueRoot, setFromTrueRoot] = useState(false);

  const nodesById = useMemo(
    () => new Map<string, BranchNode>(branches.nodes.map((n) => [n.id, n])),
    [branches],
  );
  const leavesById = useMemo(
    () => new Map<string, BranchLeaf>(branches.leaves.map((l) => [l.id, l])),
    [branches],
  );

  const rootId = branches.nodes[0].id;
  const deepLinkActive = !fromTrueRoot && !!startAt && nodesById.has(startAt);
  const entryId = deepLinkActive ? startAt! : rootId;
  const currentId = trail.length > 0 ? trail[trail.length - 1].next : entryId;
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
  function walkFromTop() {
    setFromTrueRoot(true);
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

      {/* Deep-link note (see the file-level doc comment). Rendered only
          while a valid startAt is actually in effect — a wizard opened
          directly, or one whose concept has no map entry, shows neither
          this note nor the escape hatch, and behaves exactly as before. */}
      {deepLinkActive && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p
            className="leading-relaxed"
            style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-footnote)' }}
          >
            {DEEP_LINK_NOTE}
          </p>
          <button
            type="button"
            onClick={walkFromTop}
            className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline"
            style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-footnote)', background: 'transparent', border: 'none', padding: 0 }}
          >
            <Route size={12} aria-hidden /> {FULL_PICTURE_LABEL}
          </button>
        </div>
      )}

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

      {/* Back/Restart are pill CTAs (unlike the option buttons above, which
          stay deliberately full-width per this file's own design note) —
          the same shape family as Simulation.tsx's Continue and
          GuidedWalkthrough's advance button, so they get the same shared
          Button component and press-scale feedback. */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="grey"
          tone="neutral"
          size="md"
          onClick={back}
          disabled={trail.length === 0}
          icon={leaf ? <CornerUpLeft size={16} aria-hidden /> : <ArrowLeft size={16} aria-hidden />}
          style={{ background: 'var(--surface-fill-strong)', fontSize: 'var(--text-body)' }}
        >
          {leaf ? 'Walk back' : 'Back'}
        </Button>
        <Button
          variant="grey"
          tone="neutral"
          size="md"
          onClick={restart}
          disabled={trail.length === 0}
          icon={<RotateCcw size={16} aria-hidden />}
          style={{
            background: 'var(--surface-fill)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-body)',
            border: 'var(--hairline) solid var(--separator)',
          }}
        >
          Start over
        </Button>
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
