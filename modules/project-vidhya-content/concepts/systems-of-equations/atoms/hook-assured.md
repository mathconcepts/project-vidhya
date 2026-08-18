---
# Alternative body for systems-of-equations.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: systems-of-equations.hook.assured
concept_id: systems-of-equations
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: systems-of-equations.hook
for_stance: assured
---

$A\mathbf{x}=\mathbf{b}$ is consistent iff $\text{rank}(A)=\text{rank}([A\mid\mathbf{b}])$ — Rouché–Capelli. Given consistency, compare that common rank to $n$: equal gives a unique solution, less than $n$ gives a free-variable family. Geometrically: hyperplanes meeting at a point, along a subspace, or not at all.
