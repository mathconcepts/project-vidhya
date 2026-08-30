---
# Alternative body for shortest-paths.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: shortest-paths.intuition.shaken
concept_id: shortest-paths
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: shortest-paths-intuition
for_stance: shaken
---

Three vertices: $A\to B$ weight $4$, $A\to C$ weight $1$, $C\to B$ weight $1$. Start at $A$: $d[A]=0$. Relax $A$'s edges: $d[B]=4$, $d[C]=1$. Extract the smallest, $C$ (distance $1$), and relax its edge: $d[B]=\min(4, 1+1)=2$ — improved. Extract $B$ next (distance $2$). Done: shortest path $A\to B$ is $2$, via $C$, not $4$ direct. That greedy extract-smallest-then-relax loop is Dijkstra's algorithm, and it works because every weight was non-negative — once a vertex is extracted, no later relaxation can beat its distance, since all remaining weights can only add, never subtract.

Now make one weight negative: $C\to B$ becomes $-3$ instead of $1$. Dijkstra would still extract $C$ at distance $1$ and set $d[B]=\min(4,1+(-3))=-2$ — correctly, this time, since $C$ was extracted before $B$. But build a graph where the negative edge instead arrives from a vertex extracted later, and Dijkstra has already locked in a distance it can no longer revise; it only improves un-settled vertices.

Bellman-Ford avoids this by never declaring a vertex settled: it relaxes every edge, in any order, $V-1$ times total, so a negative-weight improvement arriving late still gets applied on some later pass. One extra pass beyond that catches a negative cycle: if any distance still drops on pass $V$, a negative cycle is reachable from the source.
