---
id: planar-graphs.mnemonic
concept_id: planar-graphs
atom_type: mnemonic
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
modality: mnemonic
---

**"Face size sets the formula."** Both density bounds come from the same one idea — every face needs at least as many boundary edges as the shortest cycle in the graph — so pick the multiplier by looking at the smallest face, not by memorizing two unrelated numbers.

- Triangles allowed (any simple graph): faces need $\geq 3$ edges $\Rightarrow E \leq 3V-6$.
- No triangles (bipartite): faces need $\geq 4$ edges $\Rightarrow E \leq 2V-4$.

**Worked micro-example.** $K_{3,3}$: $V=6$, $E=9$. It's bipartite, so the 4-edge-face bound applies: $2(6)-4=8$. Since $9>8$, non-planar — caught by the tighter bound even though the general bound $3(6)-6=12$ would have missed it ($9\leq 12$).

**Sanity-check reflex:** before trusting a "planar" verdict from the density bound alone, ask whether the graph is bipartite. If it is, the general bound is too loose to trust — rerun with $2V-4$ before concluding anything.
