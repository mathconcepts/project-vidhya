---
# Alternative body for shortest-paths.hook, served when the learner stance
# is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: shortest-paths.hook.assured
concept_id: shortest-paths
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: shortest-paths.hook
for_stance: assured
---

Three algorithms cover the space, chosen by what the weights allow: Dijkstra ($O((V+E)\log V)$ with a binary heap) for non-negative weights only — it never revisits a settled vertex, so a negative edge appearing later can invalidate an already-fixed distance without the algorithm ever noticing. Bellman-Ford ($O(VE)$) tolerates negative weights and is the one that can certify a negative cycle exists at all. Floyd-Warshall ($O(V^3)$) trades speed for scope: every pair at once, negative edges fine, negative cycles detected as a negative diagonal entry.
