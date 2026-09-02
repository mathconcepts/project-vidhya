---
id: graph-coloring.mnemonic
concept_id: graph-coloring
atom_type: mnemonic
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
modality: mnemonic
---

**The three-check ladder, remembered as "CBG": Clique, Bipartite, Greedy.**

- **C**lique — does the graph contain $K_r$ as a subgraph? If so, $\chi(G) \geq r$ immediately, no coloring attempt needed.
- **B**ipartite — does it have zero odd cycles? If so, $\chi(G) = 2$ exactly, done.
- **G**reedy — anything else: run greedy coloring for an upper bound, then squeeze between whatever lower bound C found and whatever count G produced.

**Worked micro-example.** A graph has a triangle ($K_3$) plus two extra vertices attached only to one triangle corner each. Clique check: contains $K_3$, so $\chi(G)\geq 3$. Bipartite check: the triangle is an odd cycle, so not bipartite — $\chi(G)\neq 2$. Greedy, run on the triangle first then the pendant vertices, uses exactly 3 colors. Lower bound 3, achieved 3: $\chi(G)=3$.

**Sanity-check reflex:** once a coloring is assigned, recount every edge, not just a sample. One edge with matching endpoint colors invalidates the whole coloring — it isn't "close," it's wrong, the same way a single sign error invalidates an equation.
