---
# Alternative body for null-space-column-space.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: null-space-column-space.hook.assured
concept_id: null-space-column-space
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: null-space-column-space.hook
for_stance: assured
---

$\text{Null}(A)=\{x:Ax=0\}$; $\text{Col}(A)=\{Ax:x\in\mathbb{R}^n\}$ — the kernel and the image of the same map. $\dim\text{Null}(A)+\dim\text{Col}(A)=n$ (rank-nullity), so the two dimensions trade off directly: shrink one and the other grows.
