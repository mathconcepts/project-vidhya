---
# Alternative body for graph-connectivity.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: graph-connectivity.worked-example.assured
concept_id: graph-connectivity
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: graph-connectivity-worked-example
for_stance: assured
---

Sum $=16$ (even) $\Rightarrow$ graphical is plausible, $|E|=8$; the Erdős–Gallai inequality, checked at $k=4$, confirms it ($12\leq16$). Connectivity is not implied: the same degree sequence realizes on a disconnected graph just as validly, since degrees fix local structure only, never global reachability. Max edges on $6$ vertices is $\binom{6}{2}=15$, achieved uniquely by $K_6$.

What the handshaking check actually establishes: a necessary condition on the sum (even), nothing about connectivity, and nothing about uniqueness of the realizing graph — a given graphical sequence can usually be realized by several non-isomorphic graphs, connected and not.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Handshaking Lemma on a degree sequence","steps":[{"prompt":"A graph has degree sequence (4, 3, 3, 2, 2). Is this a valid degree sequence? If yes, how many edges does it have?","hint":"Apply the Handshaking Lemma: sum all degrees. If the sum is even, divide by 2 to get the edge count.","answer":"Sum = 4+3+3+2+2 = 14, which is even. So the graph is potentially valid and has 14/2 = 7 edges."},{"prompt":"For the same degree sequence (4, 3, 3, 2, 2), the graph has 5 vertices. What is the maximum possible edges in a simple graph on 5 vertices? Is our edge count consistent?","hint":"Maximum edges in a simple graph on n vertices is C(n,2) = n(n−1)/2. Check if 7 ≤ this maximum.","answer":"Max edges = C(5,2) = 10. Our graph has 7 edges ≤ 10, so it is consistent with being a simple graph."}]}
```
