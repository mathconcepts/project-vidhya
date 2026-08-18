---
# Alternative body for lu-factorization.hook, served when the learner stance
# is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: lu-factorization.hook.assured
concept_id: lu-factorization
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: lu-factorization.hook
for_stance: assured
---

$A=LU$ front-loads the cost: factor once at $O(n^3)$, then each new right-hand side costs only two triangular solves at $O(n^2)$ instead of re-eliminating from scratch. Worth it whenever the same $A$ meets several $b$'s — iterative solvers and repeated load cases both loop over right-hand sides.
