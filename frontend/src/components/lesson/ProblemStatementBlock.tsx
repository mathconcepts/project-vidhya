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
 *   1. The pain point ("this is where marks die on this topic").
 *   2. The exam intent (what GATE actually asks).
 *   3. The PYQ count sentence — omitted entirely when pyq_count is 0
 *      (never a fabricated or zero-valued sentence).
 *   4. A plain-language line naming the dominant intent — why this page
 *      opens the way it does for most students.
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
        padding: '4px 16px 20px',
        marginBottom: 4,
        borderBottom: 'var(--hairline) solid var(--separator)',
      }}
    >
      <div>
        <p style={eyebrowStyle}>Where marks die on this topic</p>
        <p style={bodyStyle}>{slice.pain_point}</p>
      </div>
      <div>
        <p style={eyebrowStyle}>What GATE actually asks</p>
        <p style={bodyStyle}>{slice.exam_intent}</p>
      </div>
      {slice.pyq_count > 0 && (
        <p style={supportingStyle}>
          {slice.pyq_count} past-paper question{slice.pyq_count === 1 ? '' : 's'} mapped to this concept.
        </p>
      )}
      <p style={supportingStyle}>{framingLine}</p>
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
