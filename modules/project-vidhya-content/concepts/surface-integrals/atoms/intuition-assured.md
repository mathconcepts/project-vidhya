---
# Alternative body for surface-integrals.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: surface-integrals.intuition.assured
concept_id: surface-integrals
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: surface-integrals.intuition
for_stance: assured
---

On a closed surface, positive orientation is unambiguous: outward, full stop. On an open surface — the kind that shows up as the $S$ in Stokes' theorem — there is no default; the normal direction is only fixed once a traversal direction is chosen for its boundary curve, via the right-hand rule. Reporting a flux answer for an open surface without stating which normal was used is an incomplete answer, not merely an unclear one, because the same open surface with the same field gives two flux values differing only in sign, and both are correct for their respective conventions.
