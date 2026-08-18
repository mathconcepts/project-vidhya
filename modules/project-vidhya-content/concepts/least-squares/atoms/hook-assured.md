---
# Alternative body for least-squares.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: least-squares.hook.assured
concept_id: least-squares
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: least-squares.hook
for_stance: assured
---

An overdetermined system $Ax=b$ has no exact solution when $b\notin\text{Col}(A)$. Least squares replaces "solve exactly" with "minimize $\|b-Ax\|$," and the minimizer is exactly the orthogonal projection of $b$ onto $\text{Col}(A)$ — geometry, not calculus, even though it's usually derived by setting a gradient to zero.
