/**
 * Authored stance variants — the confident/unconfident axis for atom bodies.
 *
 * Until now the read path had no way to serve a *different body* to a
 * different student. `applyPersonalizedRanking` reorders and never rewrites
 * (its own docblock says so), and the only content-swapping mechanism,
 * `student_atom_overrides`, is written solely by the regeneration job after a
 * student fails the same atom three times in seven days — and requires a
 * database. On the demo instance, which has none, every student read
 * byte-identical text.
 *
 * This is the authored axis: an atom may ship sibling files that are
 * alternative bodies of the same atom, each declaring which learner stance it
 * is written for.
 *
 *   concepts/eigenvalues/atoms/
 *     intuition.md            ← base. Served to a steady student.
 *     intuition.shaken.md     ← variant_of: eigenvalues.intuition
 *     intuition.assured.md      for_stance: shaken | assured
 *
 * Properties that made this the right shape:
 *
 *   - **It works with no database.** Bodies are on disk, and the stance comes
 *     from a student model that cold-starts in memory. This is the only
 *     personalisation in the system that survives a DB-less deploy, which is
 *     exactly where the demo runs.
 *   - **It is authored, not generated.** A demo has to be dependable; nothing
 *     here calls a model at request time.
 *   - **Absence degrades to the base text**, never to an error and never to a
 *     blank. A concept with no variants behaves exactly as it did before.
 *
 * The stance vocabulary is deliberately the same three values the thinking-gap
 * service already uses (see learner-framing.ts), so one derivation drives both
 * the explanation of a wrong answer and the body of a lesson. `steady` has no
 * variant by construction: it IS the base file. Allowing a `steady` variant
 * would mean two files claiming to be the default, with load order deciding
 * which won.
 */

import type { ContentAtom } from './content-types';
import type { LearnerStance } from '../sessions/learner-framing';

/** Stances that may appear on a variant file. `steady` is the base atom. */
export const VARIANT_STANCES = ['shaken', 'assured'] as const;
export type VariantStance = (typeof VARIANT_STANCES)[number];

export function isVariantStance(v: unknown): v is VariantStance {
  return typeof v === 'string' && (VARIANT_STANCES as readonly string[]).includes(v);
}

/** A parsed entry that declares itself an alternative body for another atom. */
export function isVariantEntry(atom: Pick<ContentAtom, 'variant_of' | 'for_stance'>): boolean {
  return typeof atom.variant_of === 'string' && atom.variant_of.length > 0;
}

export interface FoldResult {
  atoms: ContentAtom[];
  /** Problems worth a log line. Never thrown: one bad file must not blank a lesson. */
  warnings: string[];
}

/**
 * Fold variant entries into their base atoms.
 *
 * Returns ONLY base atoms. A variant that names a base which is not present is
 * dropped with a warning rather than served — an orphan variant rendered as a
 * standalone atom would put "you've got this already" in the middle of a
 * beginner's lesson, which is worse than not having the variant at all.
 */
export function foldStanceVariants(entries: ContentAtom[]): FoldResult {
  const warnings: string[] = [];
  const bases: ContentAtom[] = [];
  const variants: ContentAtom[] = [];

  for (const e of entries) {
    if (isVariantEntry(e)) variants.push(e);
    else bases.push(e);
  }

  const byId = new Map<string, ContentAtom>();
  for (const b of bases) byId.set(b.id, b);

  for (const v of variants) {
    const base = byId.get(v.variant_of!);
    if (!base) {
      warnings.push(`variant ${v.id} names unknown base atom ${v.variant_of}; dropped`);
      continue;
    }
    if (!isVariantStance(v.for_stance)) {
      warnings.push(
        `variant ${v.id} has for_stance=${String(v.for_stance)}; must be one of ${VARIANT_STANCES.join(', ')}; dropped`,
      );
      continue;
    }
    if (base.stance_variants?.[v.for_stance]) {
      // Two files claiming the same slot means load order decides what a
      // student reads. Keep the first and say so, rather than silently
      // depending on readdir order.
      warnings.push(`duplicate ${v.for_stance} variant for ${base.id} (${v.id}); kept the first`);
      continue;
    }
    base.stance_variants = { ...(base.stance_variants ?? {}), [v.for_stance]: v.content };
  }

  return { atoms: bases, warnings };
}

/**
 * Swap in the authored body for this student's stance.
 *
 * Pure and total: returns a new array, mutates nothing, and falls back to the
 * base body whenever there is no variant for the stance. `steady` never swaps.
 *
 * Runs BEFORE per-student overrides in lesson-routes, so a regenerated
 * per-student body still wins over an authored cohort one — the more specific
 * signal beats the more general.
 */
export function applyStanceVariants(atoms: ContentAtom[], stance: LearnerStance): ContentAtom[] {
  if (stance === 'steady') return atoms;
  return atoms.map((a) => {
    const body = a.stance_variants?.[stance];
    if (!body) return a;
    return { ...a, content: body, served_stance: stance };
  });
}

/** How many of these atoms have an authored body for every variant stance. */
export function stanceCoverage(atoms: ContentAtom[]): {
  total: number;
  fully_covered: number;
  by_stance: Record<VariantStance, number>;
} {
  const by_stance = { shaken: 0, assured: 0 } as Record<VariantStance, number>;
  let fully = 0;
  for (const a of atoms) {
    let n = 0;
    for (const s of VARIANT_STANCES) {
      if (a.stance_variants?.[s]) {
        by_stance[s]++;
        n++;
      }
    }
    if (n === VARIANT_STANCES.length) fully++;
  }
  return { total: atoms.length, fully_covered: fully, by_stance };
}
