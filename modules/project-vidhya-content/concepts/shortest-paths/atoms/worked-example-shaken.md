---
# Alternative body for shortest-paths.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: shortest-paths.worked-example.shaken
concept_id: shortest-paths
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: shortest-paths.worked-example
for_stance: shaken
---

**Setup.** Directed graph, source $A$: edges $A\to B(4)$, $A\to C(2)$, $B\to C(1)$, $B\to D(5)$, $C\to B(1)$, $C\to D(8)$, $C\to E(10)$, $D\to E(2)$.

**Step 0.** $d[A]=0$; every other distance $=\infty$.

**Step 1 — settle $A$.** Relax $A$'s edges: $d[B]=0+4=4$, $d[C]=0+2=2$.

**Step 2 — settle $C$ (smallest unsettled distance, $2$).** Relax $C$'s edges: $d[B]=\min(4,2+1)=3$ — improved. $d[D]=2+8=10$. $d[E]=2+10=12$.

**Step 3 — settle $B$ (distance $3$).** Relax $B$'s edges: $d[C]$ already settled, skip. $d[D]=\min(10,3+5)=8$ — improved.

**Step 4 — settle $D$ (distance $8$).** Relax $D$'s edge: $d[E]=\min(12,8+2)=10$ — improved.

**Step 5 — settle $E$ (distance $10$).** No outgoing edges. Done.

**Final distances.** $A{:}0,\ B{:}3,\ C{:}2,\ D{:}8,\ E{:}10$. Settlement order: $A,C,B,D,E$.

**Reconstruct $A\to E$.** Walk predecessors backward: $E\leftarrow D\leftarrow B\leftarrow C\leftarrow A$, giving path $A\to C\to B\to D\to E$, cost $2+1+5+2=10$ — matches $d[E]$.

**Watch this trap.** $A\to B$ is a direct edge costing $4$, but $C$ is settled first because at the moment of extraction $d[C]=2$ is smaller than $d[B]=4$ — Dijkstra always extracts by current distance, not by directness. Settling $C$ first is exactly what later drops $d[B]$ to $3$.

**Hold onto this.** Every step is the same move — extract the smallest unsettled distance, relax its outgoing edges — repeated until nothing is left.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Dijkstra's algorithm on a 5-vertex graph","steps":[{"prompt":"After settling vertex A (distance 0), what are the updated distances d[B] and d[C]? Which vertex is extracted next?","hint":"Relax A's outgoing edges: A→B (weight 4) and A→C (weight 2). The vertex with minimum distance is extracted next.","answer":"d[B] = 4 (via A→B), d[C] = 2 (via A→C). C is extracted next because d[C]=2 < d[B]=4."},{"prompt":"After settling C (distance 2), d[B] improves. State the new d[B] and explain why the initial value of 4 is replaced.","hint":"Relax C's edge to B: d[C] + w(C,B) = 2 + 1 = 3. Compare with the current d[B] = 4.","answer":"New d[B] = 3 (via A→C→B, cost 2+1=3). Since 3 < 4, we relax: d[B]=3 and predecessor π[B] is updated to C. This is the fundamental relaxation step of Dijkstra."}]}
```
