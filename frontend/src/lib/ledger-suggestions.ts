/**
 * frontend/src/lib/ledger-suggestions.ts
 *
 * Mirror of src/experiments/ledger-suggestions.ts. Pure-function; kept
 * in sync manually (locked behaviour — same input → same suggestion
 * forever; backend tests cover the rules). The backend is the source
 * of truth for the eventual ledger digest; this client copy lets the
 * UI render inline without round-tripping per row.
 */

export type ExperimentStatus = 'active' | 'won' | 'lost' | 'inconclusive' | 'aborted';

export interface ExperimentSummary {
  id: string;
  status: ExperimentStatus;
  hypothesis: string | null;
  lift_v1: number | null;
  lift_n: number | null;
  lift_p: number | null;
  variant_kind: string | null;
  ended_at: string | null;
}

export type SuggestionKind =
  | 'bake_in_winner' | 'investigate_loser' | 'wait_for_signal'
  | 'expand_run_count' | 'fund_resume' | 'celebrate' | 'no_action';

export interface LedgerSuggestion {
  kind: SuggestionKind;
  message: string;
  cta?: { label: string; href: string };
}

const PROMOTION_LIFT = 0.05;
const DEMOTION_LIFT = -0.02;
const PROMOTION_N = 30;
const STALE_DAYS = 14;

export function suggestForExperiment(exp: ExperimentSummary): LedgerSuggestion {
  if (exp.status === 'aborted') {
    return {
      kind: 'fund_resume',
      message: 'Aborted. If by budget, increase max_cost_usd and Resubmit; if by operator, no action needed.',
      cta: { label: 'Open Active runs', href: '/admin/content-rd' },
    };
  }
  if (exp.status === 'won') {
    return {
      kind: 'bake_in_winner',
      message: `Won (lift ${formatLift(exp.lift_v1)}, p ${formatP(exp.lift_p)}, n=${exp.lift_n ?? '–'}). Bake this in: write a ruleset that captures what made this work.`,
      cta: { label: 'Write a ruleset', href: '/admin/rulesets' },
    };
  }
  if (exp.status === 'lost') {
    const arbitrator = exp.variant_kind === 'gen_run';
    return {
      kind: 'investigate_loser',
      message: `Lost (lift ${formatLift(exp.lift_v1)}, p ${formatP(exp.lift_p)}, n=${exp.lift_n ?? '–'}). ` +
        (arbitrator
          ? 'The arbitrator chose differently from the template here — investigate before discarding.'
          : 'Auto-demoted; no further action needed.'),
      cta: arbitrator ? { label: 'Open Decision log', href: '/admin/decisions' } : undefined,
    };
  }
  if (exp.status === 'inconclusive') {
    const n = exp.lift_n ?? 0;
    if (n < PROMOTION_N) {
      const ageDays = exp.ended_at ? daysSince(exp.ended_at) : 0;
      if (ageDays > STALE_DAYS) {
        return {
          kind: 'expand_run_count',
          message: `Inconclusive after ${Math.round(ageDays)}d (n=${n}). Lift signal too weak; consider increasing run count or aborting.`,
          cta: { label: 'Open Content R&D', href: '/admin/content-rd' },
        };
      }
      return { kind: 'wait_for_signal', message: `Inconclusive (n=${n} < ${PROMOTION_N}). Wait — the lift signal needs more cohort time.` };
    }
    return { kind: 'no_action', message: `Genuinely inconclusive (lift ${formatLift(exp.lift_v1)}, n=${n}). No effect either way; move on.` };
  }
  if (exp.status === 'active') {
    const lift = exp.lift_v1 ?? 0;
    const n = exp.lift_n ?? 0;
    if (lift > PROMOTION_LIFT && n >= PROMOTION_N) {
      return { kind: 'celebrate', message: `Trending toward win (lift ${formatLift(lift)}, n=${n}). Wait for nightly ledger to auto-promote.` };
    }
    if (lift < DEMOTION_LIFT && n >= PROMOTION_N) {
      return { kind: 'investigate_loser', message: `Trending toward loss (lift ${formatLift(lift)}, n=${n}). Next ledger run will likely auto-demote.` };
    }
    return { kind: 'no_action', message: `Active (n=${n}). Loop is healthy; check back next week.` };
  }
  return { kind: 'no_action', message: '' };
}

function formatLift(v: number | null | undefined): string {
  if (v == null) return '–';
  return (v >= 0 ? '+' : '') + v.toFixed(3);
}
function formatP(v: number | null | undefined): string {
  if (v == null) return '–';
  if (v < 0.001) return '<0.001';
  return v.toFixed(3);
}
function daysSince(iso: string): number {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 0;
  return (Date.now() - t) / (24 * 60 * 60 * 1000);
}
