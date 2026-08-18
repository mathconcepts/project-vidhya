---
# Alternative body for lu-factorization.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: lu-factorization.intuition.assured
concept_id: lu-factorization
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: lu-factorization.intuition
for_stance: assured
---

$A=LU$ is a factorization, not a new operation: $L$ carries the elimination multipliers (unit lower-triangular in Doolittle form), $U$ is the row-echelon result. The payoff is amortized cost — factor once at $O(n^3)$, then each right-hand side costs two $O(n^2)$ triangular solves (forward through $L$, backward through $U$) instead of $O(n^3)$ elimination repeated from scratch. Partial pivoting complicates this only cosmetically: $PA=LU$ for a permutation $P$, solved as $Ly=Pb$ then $Ux=y$. Reach for it whenever a problem loops the same $A$ over several $b$'s — iterative methods and repeated load cases both do exactly that.
