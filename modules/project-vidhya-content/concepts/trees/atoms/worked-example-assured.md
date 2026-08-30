---
# Alternative body for trees.worked_example, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: trees.worked-example.assured
concept_id: trees
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: trees-worked-example
for_stance: assured
---

Sorted acceptances by weight, skipping same-component edges: $DE(1), AC(2), CD(3), AB(4)$ — $4=n-1$ edges, MST weight $10$. $BC(5)$ is rejected (both endpoints already joined via $A\text{-}C\text{-}D$); $CE(6)$ and $BD(7)$ are never even reached once the count hits $n-1$.

Labeled spanning trees on $5$ vertices total (a separate count from the MST, which is one specific tree): Cayley's formula $n^{n-2}=5^3=125$.

Kruskal's stopping rule is edge count, not "processed every edge" — an exam question naming an edge the algorithm "never reached" is testing whether you know it stops the instant $n-1$ acceptances are made, not that it silently rejects the rest.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Kruskal's MST and Cayley's formula for spanning trees","steps":[{"prompt":"In Kruskal's algorithm on the graph above, edge C–E (weight 6) was not even reached before the algorithm terminated. Why?","hint":"Kruskal's stops as soon as n−1 edges have been accepted. Count how many edges were accepted before C–E was considered.","answer":"The algorithm accepted 4 edges (D–E, A–C, C–D, A–B) before reaching C–E. Since n=5, we need n−1=4 edges for a spanning tree. The algorithm already terminated, so C–E was never needed."},{"prompt":"How many labeled spanning trees does K₄ (complete graph on 4 vertices) have? Apply Cayley's formula.","hint":"Cayley's formula: number of labeled trees on n vertices = n^(n−2). Substitute n=4.","answer":"4^(4−2) = 4² = 16. There are 16 distinct labeled spanning trees of K₄."}]}
```
