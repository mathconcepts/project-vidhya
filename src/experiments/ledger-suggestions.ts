/**
 * src/experiments/ledger-suggestions.ts
 *
 * Pure-function suggestion engine: given an ExperimentRow + its computed
 * lift signal, returns ONE next-action sentence the operator can act on
 * with a single click. The Effectiveness Ledger renders this under each
 * row.
 *
 * The whole point: stop showing operators raw numbers + a status pill
 * and start showing them "here's what to DO about this". Counters →
 * actions.
 *
 * Deterministic. No LLM. Same input → same suggestion forever.
 *
 * Design boundary: suggestions are ADVICE, never auto-applied. Each
 * suggestion has a `cta` that pre-fills a form somewhere in the admin
 * UI; the admin still clicks the button. Surveillance discipline 4:
 * the human stays in the loop on compounding decisions.
 */

export type ExperimentStatus =
  | 'active' | 'won' | 'lost' | 'inconclusive' | 'aborted';

export interface ExperimentSummary {
  id: string;
  status: ExperimentStatus;
  hypothesis: string | null;
  lift_v1: number | null;
  lift_n: number | null;
  lift_p: number | null;
  variant_kind: string | null;
  ended_at: string | null;
  /** Optional metadata; the suggester reads pyq_accuracy_delta_v1 if present. */
  metadata?: Record<string, unknown>;
}

export type SuggestionKind =
  | 'bake_in_winner'         // won + lift > 0.05 → write a ruleset
  | 'investigate_loser'      // lost + arbitrator-created → audit overrides
  | 'wait_for_signal'        // inconclusive + n < 30 → wait
  | 'expand_run_count'       // inconclusive + 14d+ + n < 30 → larger run
  | 'fund_resume'            // aborted by budget → resume with new cap
  | 'celebrate'              // won + already canonical, no further action needed
  | 'no_action';             // the loop is healthy here; nothing to suggest

export interface LedgerSuggestion {
  kind: SuggestionKind;
  /** One-line action sentence the admin reads. */
  message: string;
  /** Optional pre-fill payload for the CTA target. */
  cta?: { label: string; href: string; prefill?: Record<string, string> };
}

const PROMOTION_LIFT = 0.05;
const DEMOTION_LIFT = -0.02;
const PROMOTION_P = 0.05;
const PROMOTION_N = 30;
const STALE_DAYS = 14;

export function suggestForExperiment(exp: ExperimentSummary): LedgerSuggestion {
  // 1. Aborted → likely budget. Suggest fund-resume.
  if (exp.status === 'aborted') {
    return {
      kind: 'fund_resume',
      message: 'This run was aborted. If by budget, increase max_cost_usd and Resubmit; if by operator, no action needed.',
      cta: { label: 'Open Active runs', href: '/admin/content-rd' },
    };
  }

  // 2. Won → check whether a matching ruleset already exists. We can't
  //    answer "is there a ruleset" from this pure function — so the
  //    suggestion is a soft "consider baking in" with a link to the
  //    rulesets page. The new-ruleset form pre-fills the hypothesis.
  if (exp.status === 'won') {
    return {
      kind: 'bake_in_winner',
      message:
        `Won (lift ${formatLift(exp.lift_v1)}, p ${formatP(exp.lift_p)}, n=${exp.lift_n ?? '–'}). ` +
        'Bake this in: write a ruleset that captures what made this blueprint work.',
      cta: {
        label: 'Write a ruleset',
        href: '/admin/rulesets',
        prefill: {
          hypothesis: exp.hypothesis ?? '',
          source_experiment_id: exp.id,
        },
      },
    };
  }

  // 3. Lost → flag for investigation. Don't auto-rewrite anything.
  if (exp.status === 'lost') {
    const arbitrator = exp.variant_kind === 'gen_run';
    return {
      kind: 'investigate_loser',
      message:
        `Lost (lift ${formatLift(exp.lift_v1)}, p ${formatP(exp.lift_p)}, n=${exp.lift_n ?? '–'}). ` +
        (arbitrator
          ? 'The arbitrator chose differently from the template here — investigate before discarding.'
          : 'Auto-demoted; the canonical pool no longer serves these atoms. No action needed.'),
      cta: arbitrator ? { label: 'Open Decision log', href: '/admin/decisions' } : undefined,
    };
  }

  // 4. Inconclusive — depends on time + n.
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
      return {
        kind: 'wait_for_signal',
        message: `Inconclusive (n=${n} < ${PROMOTION_N}). Wait — the lift signal needs more cohort time.`,
      };
    }
    // n is large enough but lift didn't pass thresholds → genuinely flat.
    return {
      kind: 'no_action',
      message: `Genuinely inconclusive (lift ${formatLift(exp.lift_v1)}, p ${formatP(exp.lift_p)}, n=${n}). No effect either way; move on.`,
    };
  }

  // 5. Active — peek at lift even though no decision yet.
  if (exp.status === 'active') {
    const lift = exp.lift_v1 ?? 0;
    const n = exp.lift_n ?? 0;
    if (lift > PROMOTION_LIFT && n >= PROMOTION_N) {
      return {
        kind: 'celebrate',
        message: `Trending toward win (lift ${formatLift(lift)}, n=${n}). Wait for ledger nightly run to auto-promote.`,
      };
    }
    if (lift < DEMOTION_LIFT && n >= PROMOTION_N) {
      return {
        kind: 'investigate_loser',
        message: `Trending toward loss (lift ${formatLift(lift)}, n=${n}). The next ledger run will likely auto-demote.`,
      };
    }
    return {
      kind: 'no_action',
      message: `Active (n=${n}). Loop is healthy; check back next week.`,
    };
  }

  // Defensive: unknown status
  return { kind: 'no_action', message: '' };
}

// ----------------------------------------------------------------------------

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

export const __testing = {
  PROMOTION_LIFT, DEMOTION_LIFT, PROMOTION_P, PROMOTION_N, STALE_DAYS,
};
