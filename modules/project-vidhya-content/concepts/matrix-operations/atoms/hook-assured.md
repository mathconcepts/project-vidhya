---
# Alternative body for matrix-operations.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: matrix-operations.hook.assured
concept_id: matrix-operations
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: matrix-operations.hook
for_stance: assured
---

Matrix multiplication composes transformations: $(AB)_{ij}$ is row $i$ of $A$ dotted with column $j$ of $B$. Associative, not commutative — $AB \neq BA$ in general, because "rotate then scale" isn't "scale then rotate." Addition and transpose are the easy operations; multiplication is where the structure — and the marks — live.
