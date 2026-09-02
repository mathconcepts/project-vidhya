---
# Alternative body for shortest-paths.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: shortest-paths.worked-example.assured
concept_id: shortest-paths
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: shortest-paths.worked-example
for_stance: assured
---

Settle order by current distance, not edge directness: $A(0)\to C(2)\to B(3)\to D(8)\to E(10)$. Each settlement relaxes outgoing edges; $C\to B$ drops $B$ from $4$ to $3$ before $B$ is ever settled, and $B\to D$ later drops $D$ from $10$ to $8$. Final distances: $B{:}3, C{:}2, D{:}8, E{:}10$; shortest $A\to E$ path is $A\to C\to B\to D\to E$, cost $10$.

The trap: extracting by current tentative distance, not by which edge looks shortest from the source directly, is the whole algorithm — $A\to B$ costs $4$ directly, but $C$'s smaller distance means $C$ is processed first, which is precisely what discovers the cheaper $A\to C\to B$ route before $B$ locks in. Once a vertex is extracted here, its distance is final — safe only because every weight is non-negative.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Dijkstra's algorithm on a 5-vertex graph","steps":[{"prompt":"After settling vertex A (distance 0), what are the updated distances d[B] and d[C]? Which vertex is extracted next?","hint":"Relax A's outgoing edges: A→B (weight 4) and A→C (weight 2). The vertex with minimum distance is extracted next.","answer":"d[B] = 4 (via A→B), d[C] = 2 (via A→C). C is extracted next because d[C]=2 < d[B]=4."},{"prompt":"After settling C (distance 2), d[B] improves. State the new d[B] and explain why the initial value of 4 is replaced.","hint":"Relax C's edge to B: d[C] + w(C,B) = 2 + 1 = 3. Compare with the current d[B] = 4.","answer":"New d[B] = 3 (via A→C→B, cost 2+1=3). Since 3 < 4, we relax: d[B]=3 and predecessor π[B] is updated to C. This is the fundamental relaxation step of Dijkstra."}]}
```
