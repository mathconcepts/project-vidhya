---
# Alternative body for linear-independence.intuition, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: linear-independence.intuition.assured
concept_id: linear-independence
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: linear-independence.intuition
for_stance: assured
---

Independence is a property of the SET, checked via $c_1v_1+\cdots+c_kv_k=0 \implies c_1=\cdots=c_k=0$ — only the trivial combination reaches zero. Equivalently: no vector is a linear combination of the others.

Fast tests: stack the vectors as columns of a matrix $M$; the set is independent iff $\text{rank}(M)$ equals the number of vectors, iff $\det(M)\neq0$ when $M$ is square. More than $n$ vectors in $\mathbb{R}^n$ are automatically dependent — pigeonhole on dimension.

Where this connects: a basis is a maximal independent set (equivalently, a minimal spanning set); a spanning set that isn't independent contains a smaller spanning subset, found by discarding vectors that are combinations of earlier ones.

Common trap: independence of $\{v_1,v_2\}$ says nothing about independence of $\{v_1,v_2,v_3\}$ — adding a vector can only preserve or break independence, never restore it once broken.
