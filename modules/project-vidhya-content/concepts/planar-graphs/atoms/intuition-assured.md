---
# Alternative body for planar-graphs.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: planar-graphs.intuition.assured
concept_id: planar-graphs
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: planar-graphs-intuition
for_stance: assured
---

$E\leq 3V-6$ is necessary for planarity, never sufficient — a graph can satisfy it and still be non-planar, exactly $K_{3,3}$'s situation ($9\leq 3(6)-6=12$, bound satisfied, graph still non-planar). The bipartite tightening $E\leq 2V-4$ exists because a bipartite graph has no triangles, so every face needs at least $4$ boundary edges instead of $3$; $K_{3,3}$ fails that one ($9>2(6)-4=8$).

Kuratowski's theorem is the only iff: no subdivision of $K_5$ or $K_{3,3}$, where a subdivision allows inserting degree-$2$ vertices along edges — a graph can hide either forbidden structure under extra vertices and still be caught.

Euler's formula $V-E+F=2$ is an identity for any connected planar embedding, not a test — it holds automatically once planarity and connectivity are given; using it as a planarity check without already knowing the drawing has no crossings is circular.
