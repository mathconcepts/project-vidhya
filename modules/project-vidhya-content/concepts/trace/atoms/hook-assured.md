---
# Alternative body for trace.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: trace.hook.assured
concept_id: trace
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: trace.hook
for_stance: assured
---

$\text{tr}(A)=\sum_i a_{ii}=\sum_i \lambda_i$ — diagonal sum equals eigenvalue sum, for free, without factoring the characteristic polynomial. It's basis-independent ($\text{tr}(P^{-1}AP)=\text{tr}(A)$) and satisfies $\text{tr}(AB)=\text{tr}(BA)$ even though $AB\neq BA$ in general — a fast consistency check on any eigenvalue computation.
