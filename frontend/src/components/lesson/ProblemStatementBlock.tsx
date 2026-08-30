/**
 * ProblemStatementBlock — the "definite problem statement" (DPS).
 *
 * Design doc: docs/designs/2026-08-25-intent-driven-content-restructure.md
 * §5 ("Every one of the 203 sub-topics resolves to an Intent-Resolved
 * Learning Unit... PROBLEM STATEMENT (definite, rendered first, always)")
 * + §7 Phase 2 ("render the DPS block ... no chips or lane router in this
 * phase").
 *
 * Renders FIRST on a mapped Linear Algebra concept's lesson page, only
 * when VIDHYA_INTENT_LANES is on. Content, in order:
 *   1. The exam intent (what GATE actually asks).
 *   2. The pain point (the common slips on this topic).
 *   3. The PYQ count sentence — omitted entirely when pyq_count is 0
 *      (never a fabricated or zero-valued sentence).
 *   4. A plain-language line naming the dominant intent — why this page
 *      opens the way it does for most students.
 *
 * ORDER AND EYEBROW REGISTER ARE PART OF THE CONTRACT, not layout taste.
 * This block used to open with the pain point under the eyebrow "Where marks
 * die on this topic". The 2026-08-27 content-readiness plan's P0 tone pass
 * (amendment D23 / design finding 10) read all 26 Linear Algebra pain-point
 * strings in sequence — `npx tsx scripts/check-intent-catalogue.ts
 * --pain-points` — and found ONE distinct string shared by all 26 atoms:
 * "Students often over-calculate, confuse definitions, or make row-operation
 * and sign errors." So every LA concept page opened, above everything else,
 * with the same sentence about the student's errors under a headline about
 * marks dying. For the anxious persona the platform explicitly models
 * (data/personas/priya-cbse-12-anxious.yaml) that is a daily loss prime, and
 * "on this topic" was not even true of a module-level generality.
 *
 * Both halves of the fix are copy/order only. The actionable fact (what the
 * exam asks) now renders before the wound, and the eyebrow states what the
 * sentence actually is — common slips — rather than a death. Ordering is
 * asserted in ProblemStatementBlock.test.tsx so a later edit cannot quietly
 * put the wound back on top.
 *
 * ── Progressive disclosure (2026-08-30 attention pass) ───────────────────
 * Items 2-4 now sit behind a "Common slips and past papers" expander; item 1
 * stays visible and first. Measured on a 390px viewport, the fully-expanded
 * block was 330px tall and pushed the first line of concept content 557px
 * down the page — two thirds of an 844px screen — so a student read to the
 * end of four grey paragraphs before a single line of the actual concept.
 * That is the shape the goodwill reservoir drains through: sizzle in front
 * of the thing they came for.
 *
 * This does NOT relax the contract above; it tightens it in the same
 * direction the tone pass was already pushing. The loss frame is now not
 * merely un-headlined but off the first screen entirely, while the exam
 * intent — the one actionable, non-wounding fact — is the only thing that
 * survives the compression. Order is preserved on expand and still asserted.
 * The tests were updated in lockstep: `renders the exam intent BEFORE the
 * pain point` still holds, and a new case asserts the lead is readable
 * WITHOUT expanding, which is the clause that keeps a future edit from
 * burying item 1 alongside the rest.
 *
 * Clarity compliance (DESIGN-SYSTEM.md — "One focal block per screen"):
 * this is NOT a second card. The atom-card stack below it is the page's
 * one focal card, so this block is plain text separated by a single
 * hairline rule, tokens only, no accent colour (pain point / exam intent
 * are informational framing, not an AI/tutor/mastery surface — indigo and
 * green stay reserved per DESIGN-SYSTEM.md's colour law).
 *
 * Honest reduced frame (design doc §8, "Nil" data-flow path): a concept
 * with no slice renders nothing — the page is byte-identical to today.
 * Never a broken block, never a fabricated pain point.
 */

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

import { INTENT_SLICES, type IntentId } from '@/generated/intent-slices.gen';

/** Plain-language framing per dominant intent — "why this page opens the
 * way it does for most students". Locked wording lives here, not derived,
 * because it addresses the STUDENT directly in a register the catalogue's
 * operator-facing `catalogue_label` fields don't carry. */
const INTENT_STUDENT_LABEL: Record<IntentId, string> = {
  pyq_targeted_practice:
    "Most students come here to practise real questions — that's how this page opens.",
  concept_clarification:
    "Most students come here to look up the exact property, fast — that's how this page opens.",
  guided_problem_solving:
    "Most students come here unsure which method to use — that's how this page opens.",
  foundation_learning:
    "Most students come here new to this topic — that's how this page opens.",
};

export interface ProblemStatementBlockProps {
  conceptId: string;
  /** Caller-resolved flag (useIntentLanesFlag()). Kept as a prop rather than
   * fetched internally so a single page-level flag read gates every surface
   * T4 touches, and so tests can render both states without mocking fetch. */
  enabled: boolean;
}

export function ProblemStatementBlock({ conceptId, enabled }: ProblemStatementBlockProps) {
  const [open, setOpen] = useState(false);
  if (!enabled) return null;
  const slice = INTENT_SLICES[conceptId];
  if (!slice) return null;

  const framingLine = INTENT_STUDENT_LABEL[slice.dominant_intent];

  return (
    <div
      data-testid="problem-statement-block"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '4px 16px 12px',
        marginBottom: 4,
        borderBottom: 'var(--hairline) solid var(--separator)',
      }}
    >
      {/* The lead — always visible, always first. */}
      <div>
        <p style={eyebrowStyle}>What GATE actually asks</p>
        <p style={bodyStyle}>{slice.exam_intent}</p>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        data-testid="dps-more-trigger"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          minHeight: 44, padding: 0, width: '100%',
          background: 'none', border: 'none', cursor: 'pointer',
          font: 'inherit', textAlign: 'left',
          fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)',
        }}
      >
        <ChevronDown
          size={15}
          aria-hidden
          style={{
            flexShrink: 0,
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            transition: 'transform var(--dur-base) var(--ease-standard)',
          }}
        />
        <span>Common slips and past papers</span>
      </button>

      {open && (
        <>
          <div>
            <p style={eyebrowStyle}>Common slips on this topic</p>
            <p style={bodyStyle}>{slice.pain_point}</p>
          </div>
          {slice.pyq_count > 0 && (
            <p style={supportingStyle}>
              {slice.pyq_count} past-paper question{slice.pyq_count === 1 ? '' : 's'} mapped to this concept.
            </p>
          )}
          <p style={supportingStyle}>{framingLine}</p>
        </>
      )}
    </div>
  );
}

const eyebrowStyle: React.CSSProperties = {
  margin: '0 0 4px',
  fontSize: 'var(--text-caption2)',
  fontWeight: 'var(--weight-semibold)',
  textTransform: 'uppercase',
  letterSpacing: 'var(--tracking-caps)',
  color: 'var(--text-tertiary)',
};

const bodyStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-body)',
  lineHeight: 'var(--leading-relaxed)',
  color: 'var(--text-primary)',
};

const supportingStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-subhead)',
  lineHeight: 'var(--leading-normal)',
  color: 'var(--text-secondary)',
};
