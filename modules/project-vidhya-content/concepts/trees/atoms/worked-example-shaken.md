---
# Alternative body for trees.worked_example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: trees.worked-example.shaken
concept_id: trees
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: trees-worked-example
for_stance: shaken
---

**Setup.** $5$ vertices $A,B,C,D,E$; edges $AB(4), AC(2), BC(5), BD(7), CD(3), CE(6), DE(1)$.

**Step 1 — sort edges by weight.** $DE(1), AC(2), CD(3), AB(4), BC(5), CE(6), BD(7)$.

**Step 2 — add $DE$, weight $1$.** Different components ($\{D\},\{E\}$ before) — accept. Components: $\{A\},\{B\},\{C\},\{D,E\}$.

**Step 3 — add $AC$, weight $2$.** Different components — accept. Components: $\{A,C\},\{B\},\{D,E\}$.

**Step 4 — add $CD$, weight $3$.** $C\in\{A,C\}$, $D\in\{D,E\}$ — different components — accept. Components: $\{A,C,D,E\},\{B\}$.

**Step 5 — add $AB$, weight $4$.** $A\in\{A,C,D,E\}$, $B\in\{B\}$ — different components — accept. Components: $\{A,B,C,D,E\}$, one piece.

**Step 6 — check the count and stop.** $4$ edges added, and $n-1=5-1=4$: exactly enough for a spanning tree on $5$ vertices. Every edge from here ($BC$ weight $5$, $CE$ weight $6$, $BD$ weight $7$) would join two vertices already in the same component, so the algorithm stops without even examining them.

**MST weight.** $1+2+3+4=10$.

**A separate question — how many labeled trees exist on $5$ vertices total, ignoring weight?** Cayley's formula: $n^{n-2}=5^3=125$.

**Hold onto this.** Kruskal never checks an edge once $n-1$ edges are accepted, and it never accepts an edge joining two vertices already in the same component — those two rules are the whole algorithm.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Kruskal's MST and Cayley's formula for spanning trees","steps":[{"prompt":"In Kruskal's algorithm on the graph above, edge C–E (weight 6) was not even reached before the algorithm terminated. Why?","hint":"Kruskal's stops as soon as n−1 edges have been accepted. Count how many edges were accepted before C–E was considered.","answer":"The algorithm accepted 4 edges (D–E, A–C, C–D, A–B) before reaching C–E. Since n=5, we need n−1=4 edges for a spanning tree. The algorithm already terminated, so C–E was never needed."},{"prompt":"How many labeled spanning trees does K₄ (complete graph on 4 vertices) have? Apply Cayley's formula.","hint":"Cayley's formula: number of labeled trees on n vertices = n^(n−2). Substitute n=4.","answer":"4^(4−2) = 4² = 16. There are 16 distinct labeled spanning trees of K₄."}]}
```
