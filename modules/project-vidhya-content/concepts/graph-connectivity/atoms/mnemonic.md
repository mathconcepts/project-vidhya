---
id: graph-connectivity.mnemonic
concept_id: graph-connectivity
atom_type: mnemonic
bloom_level: 2
difficulty: 0.40
exam_ids: ["*"]
modality: mnemonic
---

**The weakest-link ladder: $\kappa(G) \leq \lambda(G) \leq \delta(G)$.** Vertex connectivity never beats edge connectivity, and edge connectivity never beats the graph's own smallest degree — because the sparsest vertex is always a cheap way to isolate something, and cutting that vertex's own few edges can never take more work than removing the vertex itself.

**Worked micro-example:** two triangles $\{1,2,3\}$ and $\{4,5,6\}$ joined by a single edge $3$–$4$. Minimum degree $\delta=2$ (vertices $1,2,5,6$). But removing the one bridge edge $3$–$4$ disconnects the graph — $\lambda=1$. And removing either endpoint, $3$ or $4$, does the same — $\kappa=1$. So $1\leq1\leq2$: the ladder holds, and it's the bridge, not the minimum-degree vertices, that's the graph's true bottleneck.

**Sanity-check reflex:** whenever a computed $\kappa$, $\lambda$, or $\delta$ comes out with $\kappa>\lambda$ or $\lambda>\delta$, one of the three was computed wrong — recheck before trusting the answer, because a real graph never breaks this ladder.
