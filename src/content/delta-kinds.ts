/**
 * src/content/delta-kinds.ts
 *
 * Closed taxonomy for WHY a personalized content delta was generated.
 *
 * docs/designs/2026-09-02-content-strategy-research-integration-plan.md
 * (P2): the research framework's core architectural idea is "stable base +
 * smallest supported, typed delta" -- every personalized write records its
 * trigger, so deltas are auditable and comparable across mechanisms instead
 * of each one inventing its own free-text vocabulary. This union is the
 * DeltaKind mirror of supabase/migrations/056_delta_kind.sql's CHECK
 * constraint; keep the two in lockstep the same way ErrorTag and migration
 * 053 already are (src/core/interfaces.ts).
 *
 * The first 10 kinds are the research's own taxonomy. `general_remediation`
 * is Vidhya's own 11th: the ONLY trigger path wired today
 * (src/content/concept-orchestrator/personalized-regen.ts -- 3 failures in
 * 7 days on one atom, regenerate the whole atom grounded in the student's
 * error text) doesn't cleanly match any single research kind. Tagging it as
 * one of the ten anyway would fabricate a precision the detector doesn't
 * have; `general_remediation` says plainly "this fired, but not from a
 * specific-enough signal to name a narrower kind."
 *
 * Wiring the other 10 kinds to real trigger detectors (a prerequisite-gap
 * probe, a representation-shift detector, a confidence/performance
 * divergence check, ...) is each its own scoped project -- see the design
 * doc's Deferred section. This module only makes the taxonomy real and
 * queryable; it does not claim those detectors exist.
 */

export const DELTA_KINDS = [
  'prerequisite_repair',
  'representation_shift',
  'definition_boundary',
  'execution_drill',
  'assessment_mode',
  'time_and_risk',
  'custom_source',
  'verified_computation',
  'language_accessibility',
  'confidence_calibration',
  'general_remediation',
] as const;

export type DeltaKind = (typeof DELTA_KINDS)[number];

/**
 * One-line description of when each kind applies, lifted from the research
 * framework's delta-trigger table (docs/content-spec/integrated-self-
 * improving-learning-system.md §15.4 / atomic-static-dynamic-content-
 * framework.md's dynamic_delta_slots). Not currently surfaced in any UI --
 * kept here so a future trigger detector or admin view has one canonical
 * source instead of re-deriving the wording.
 */
export const DELTA_KIND_DESCRIPTIONS: Record<DeltaKind, string> = {
  prerequisite_repair:
    'Attach only when graph traversal plus a diagnostic probe supports a prerequisite hypothesis.',
  representation_shift:
    'Switch between symbolic, numerical, graphical, geometric, tabular, verbal or algorithmic views based on observed error.',
  definition_boundary:
    'Add a short contrast when the learner confuses a definition, consequence, special case or condition.',
  execution_drill:
    'Add a minimal varied practice set when the method is selected correctly but intermediate-state errors recur.',
  assessment_mode:
    'Attach an MCQ/MSQ/NAT/descriptive/timed delta only for the observed mode gap.',
  time_and_risk:
    'Compress to a micro route and add stop/skip/review or negative-marking guidance when evidence supports it.',
  custom_source:
    'Ingest a learner-supplied source only with hash, page locator, extraction quality, permissions and conflict checking.',
  verified_computation:
    'Use a computational result only with query, assumptions, provider/version, output and reproducibility metadata.',
  language_accessibility:
    'Adapt language, pacing, captions, contrast and notation without changing canonical mathematics.',
  confidence_calibration:
    'Show evidence-based confidence feedback when self-report diverges from delayed transfer or mode performance.',
  general_remediation:
    "Vidhya-specific: today's only implemented trigger (repeated failure on one atom) -- regenerates the atom grounded in the student's error text without a narrower, research-taxonomy-specific detector behind it.",
};

export function isDeltaKind(value: unknown): value is DeltaKind {
  return typeof value === 'string' && (DELTA_KINDS as readonly string[]).includes(value);
}
