---
# Alternative body for multiple-integrals.intuition, served when the
# learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: multiple-integrals.intuition.assured
concept_id: multiple-integrals
atom_type: intuition
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
variant_of: multiple-integrals.intuition
for_stance: assured
---

Fubini's guarantee — that the two iterated orders agree — technically needs $f$ continuous on the region (or, more generally, absolutely integrable there), not merely "a rectangle." On a rectangle with a continuous integrand this is automatic and rarely worth stating; it becomes load-bearing only for an unbounded region or an integrand with a singularity inside it, where the two orders CAN disagree if the double integral fails to converge absolutely — the same failure mode that makes a conditionally-convergent series order-dependent. Treating Fubini as an unconditional "orders always match" habit, carried over from well-behaved rectangle practice, is exactly what breaks first once regions or integrands stop being tame.
