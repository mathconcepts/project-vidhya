---
# Alternative body for planar-graphs.hook, served when the learner stance
# is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: planar-graphs.hook.assured
concept_id: planar-graphs
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: planar-graphs.hook
for_stance: assured
---

Planarity has two workable tests, and neither is a drawing attempt: the density bound $E\leq3V-6$ (tighter, $E\leq 2V-4$, if the graph is bipartite) rules a graph out immediately when violated, and Kuratowski's theorem — no $K_5$ or $K_{3,3}$ subdivision — is the full iff characterization. $K_{3,3}$ has $V=6,E=9$: it satisfies $9\leq 3(6)-6=12$, so the general bound alone says nothing; only the bipartite bound ($9>2(6)-4=8$) or Kuratowski itself catches it. Reaching for the general bound where the bipartite one applies is the exact gap that misses this graph.
