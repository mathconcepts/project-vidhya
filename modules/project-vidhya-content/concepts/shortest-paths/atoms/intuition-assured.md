---
# Alternative body for shortest-paths.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: shortest-paths.intuition.assured
concept_id: shortest-paths
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: shortest-paths.intuition
for_stance: assured
---

Dijkstra fails on negative weights for a structural reason, not a performance one: once extracted, a vertex is never relaxed again, so a negative edge reachable only through a later extraction can beat an already-final distance and Dijkstra has no mechanism to notice. Bellman-Ford has no such lock-in — it relaxes all $E$ edges every pass, $V-1$ passes, so a correction arriving on pass $k$ still propagates on pass $k+1$.

Negative cycles break the shortest-path problem itself (no finite minimum exists), not just the algorithm: Bellman-Ford detects one via a $V$-th pass that still improves some distance; Floyd-Warshall detects one via a negative entry on the diagonal, $D[i][i]<0$, after the DP completes.

Floyd-Warshall tolerates negative edges but not negative cycles — same restriction as Bellman-Ford, different reason: the DP recurrence assumes a shortest path never needs to repeat a vertex, which a negative cycle makes false by definition, since looping forever keeps decreasing cost.
