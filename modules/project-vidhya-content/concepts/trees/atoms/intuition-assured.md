---
# Alternative body for trees.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: trees.intuition.assured
concept_id: trees
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: trees-intuition
for_stance: assured
---

MST is unique only when all edge weights are distinct — with a tie, Kruskal's tie-breaking order can select between multiple equal-weight MSTs, all valid, none more correct. Don't assume "the" MST is a single object without checking for repeated weights first.

$n-1$ edges is not sufficient alone: it must pair with either "connected" or "acyclic" to force a tree — $n-1$ edges spread across a disconnected forest of several small trees also sums to $n-1$ across all vertices combined, without any single component being the spanning structure.

Cayley's formula $n^{n-2}$ counts labeled trees only; unlabeled tree shapes grow far slower — $4$ labeled vertices give $16$ trees but only $2$ shapes up to relabeling (the path and the star). Kruskal and Prim both find one specific labeled MST, not a shape.
