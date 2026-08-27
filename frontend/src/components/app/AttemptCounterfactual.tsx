/**
 * AttemptCounterfactual — the post-mock attempt/skip review.
 *
 * Design doc: docs/designs/2026-08-27-content-readiness-market-research-
 * integration.md §W3.2 + the W-UI "W3.2 counterfactual" contract.
 *
 * Renders BELOW the mock results summary, on the results screen, never as
 * an interstitial. Content, in order — the four-beat copy contract:
 *   1. earned — the score, plainly.
 *   2. competence — what the student was already good for.
 *   3. the gap, framed as recoverable through DECISIONS, not knowledge.
 *   4. exactly ONE action — the drill CTA.
 *
 * ORDER IS PART OF THE CONTRACT, not layout taste. Loss language appears
 * only inside beat 3, after competence has been established; beat 3 is
 * `null` in the success state and the component renders nothing for it.
 * AttemptCounterfactual.test.tsx asserts the order so a later edit cannot
 * quietly put the wound above the proof.
 *
 * EVERY SENTENCE COMES FROM THE SERVER. `report.beats`, each decision's
 * `label`/`detail`, and the break-even lines are produced by
 * src/readiness/attempt-counterfactual.ts and asserted by its tests. This
 * component composes; it does not phrase. That is what keeps the student
 * register ("marks, not EV; sentences, not formulas; break-even p stays
 * server-side") in one tested place rather than in JSX.
 *
 * Clarity compliance (DESIGN-SYSTEM.md — "One focal card per screen"):
 * the results summary above is the page's one focal card, so this is NOT
 * a second card. It is plain text under a single hairline rule, tokens
 * only, no accent colour — an attempt/skip review is analysis, not a
 * mastery or AI surface, so green and indigo both stay out of it. NO
 * RECEIPT BORDER: recoverable marks are derived analysis, not a
 * verification receipt, and `<ReceiptBorder>` is the only thing allowed
 * to draw that line.
 *
 * 17px floor: per-decision costs are stacked rows (17px label / 15px
 * supporting), never a 13px table. Decisions beyond
 * COUNTERFACTUAL_ITEM_CAP (3, enforced server-side) arrive already
 * collapsed into `remainder_count` / `remainder_marks` and render as one
 * line — a full per-question scroll is a shame ledger.
 *
 * Honest reduced frame: a legacy mock with no per-question decomposition
 * (`available: false`) renders the server's reason as one plain line and
 * nothing else — never a fabricated breakdown. A paper with no concept
 * mapping renders beat 4 as a sentence rather than a dead CTA button.
 *
 * Reachable, ignorable, repeatable: below the score, scroll-discoverable,
 * never blocking, and identical on a revisit (the server recomputes it
 * from the persisted analysis).
 */

import { Link } from 'react-router-dom';

export interface CounterfactualDecisionView {
  object_id: string;
  question_kind: 'mcq' | 'msq' | 'nat';
  marks: number;
  topic: string | null;
  concept_id: string | null;
  decision: 'attempted_wrong' | 'skipped_positive_ev';
  cost_marks: number;
  marks_wrong: number;
  accuracy: number | null;
  topic_attempts: number | null;
  label: string;
  detail: string;
}

export interface CounterfactualBreakEvenView {
  question_kind: 'mcq' | 'msq' | 'nat';
  marks: number;
  marks_wrong: number;
  break_even_p: number;
  sentence: string;
}

export interface CounterfactualReportView {
  available: boolean;
  state: 'unavailable' | 'attempt_more' | 'clean' | 'decisions';
  reason: string | null;
  earned: number;
  max_available: number;
  graded_questions: number;
  attempted: number;
  skipped: number;
  marks_close_to: number;
  recoverable_marks: number;
  top_decisions: CounterfactualDecisionView[];
  remainder_count: number;
  remainder_marks: number;
  break_even: CounterfactualBreakEvenView[];
  drill_concept_id: string | null;
  beats: {
    earned: string;
    competence: string | null;
    gap: string | null;
    action: string | null;
  };
}

export interface AttemptCounterfactualProps {
  report: CounterfactualReportView | null | undefined;
}

/** Mirrors the server's formatMarks — glyphs for the exam's own thirds. */
function formatCost(n: number): string {
  const abs = Math.abs(n);
  if (Number.isInteger(abs)) return String(abs);
  for (const [value, glyph] of [[1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾']] as const) {
    if (Math.abs(abs - value) < 1e-4) return glyph;
  }
  return String(Math.round(abs * 100) / 100);
}

export function AttemptCounterfactual({ report }: AttemptCounterfactualProps) {
  if (!report) return null;

  // Headline-only degradation: a legacy row, or a paper with nothing
  // gradable. One honest sentence, no fabricated decomposition.
  if (!report.available) {
    return (
      <section data-testid="attempt-counterfactual" style={sectionStyle}>
        <p style={eyebrowStyle}>Your attempt-or-skip calls</p>
        <p style={supportingStyle}>{report.reason}</p>
      </section>
    );
  }

  const { beats } = report;

  return (
    <section data-testid="attempt-counterfactual" style={sectionStyle}>
      <p style={eyebrowStyle}>Your attempt-or-skip calls</p>

      {/* Beat 1 — earned, plainly. */}
      <p data-testid="cf-beat-earned" style={bodyStyle}>{beats.earned}</p>

      {/* Beat 2 — competence proof. */}
      {beats.competence && (
        <p data-testid="cf-beat-competence" style={bodyStyle}>{beats.competence}</p>
      )}

      {/* Beat 3 — the gap, as recoverable decisions. The ONLY place loss
          language appears, and absent entirely in the success state. */}
      {beats.gap && (
        <p data-testid="cf-beat-gap" style={supportingStyle}>{beats.gap}</p>
      )}

      {report.top_decisions.length > 0 && (
        <ul data-testid="cf-decisions" style={listStyle}>
          {report.top_decisions.map((d) => (
            <li key={d.object_id} data-testid="cf-decision-row" style={rowStyle}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                <span style={bodyStyle}>{d.label}</span>
                <span style={costStyle}>{formatCost(d.cost_marks)}</span>
              </div>
              <p style={{ ...supportingStyle, margin: '4px 0 0' }}>{d.detail}</p>
            </li>
          ))}
        </ul>
      )}

      {report.remainder_count > 0 && (
        <p data-testid="cf-remainder" style={supportingStyle}>
          {report.remainder_count} more call{report.remainder_count === 1 ? '' : 's'} like
          {' '}{report.remainder_count === 1 ? 'this one' : 'these'}, worth
          {' '}{formatCost(report.remainder_marks)} between them.
        </p>
      )}

      {report.break_even.map((b) => (
        <p key={`${b.question_kind}-${b.marks}`} data-testid="cf-break-even" style={supportingStyle}>
          {b.sentence}
        </p>
      ))}

      {/* Beat 4 — exactly one action. A full-width button, not a card. */}
      {beats.action && (
        report.drill_concept_id
          ? (
            <Link
              data-testid="cf-drill-cta"
              to={`/attempt-skip-drill?concept=${encodeURIComponent(report.drill_concept_id)}`}
              style={ctaStyle}
            >
              {beats.action}
            </Link>
          )
          : (
            <p data-testid="cf-drill-unavailable" style={supportingStyle}>
              We can't line up a drill from this paper — its questions aren't mapped to a concept yet.
            </p>
          )
      )}
    </section>
  );
}

// ── Tokens only. No accent colour, no receipt border, no gradient. ──

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: '20px 0 4px',
  borderTop: 'var(--hairline) solid var(--separator)',
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
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

const listStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
};

const rowStyle: React.CSSProperties = {
  padding: '12px 0',
  borderTop: 'var(--hairline) solid var(--separator)',
};

const costStyle: React.CSSProperties = {
  flexShrink: 0,
  fontSize: 'var(--text-body)',
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--text-secondary)',
};

const ctaStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  minHeight: 44,
  padding: '0 16px',
  borderRadius: 'var(--radius-sm)',
  border: 'var(--hairline) solid var(--separator)',
  background: 'var(--surface-fill)',
  color: 'var(--text-primary)',
  fontSize: 'var(--text-body)',
  textDecoration: 'none',
};
