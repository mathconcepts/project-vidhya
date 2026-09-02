---
# Alternative body for multiple-integrals.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: multiple-integrals.hook.assured
concept_id: multiple-integrals
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: multiple-integrals.hook
for_stance: assured
---

Swapping $dx\,dy$ for $dy\,dx$ is free on a rectangle where both variables' bounds are constants — Fubini guarantees it. The moment the region is NOT a rectangle, the bounds themselves encode the region's shape, and swapping the differentials without re-deriving new bounds from that shape — not just copying the old numbers across — produces a double integral over the wrong region entirely, even though every symbol still looks correctly placed. The habit worth keeping from rectangular practice, "the two orders always agree," is true of the VALUE once bounds are correct, never an excuse to skip re-deriving the bounds themselves.
