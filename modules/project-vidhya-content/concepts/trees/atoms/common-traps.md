---
id: trees.common-traps
concept_id: trees
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Forgetting the $n-1$ edge formula**: Students often apply graph degree/edge formulas without confirming acyclicity. Always verify: trees have $|E| = |V| - 1$, and no other structure does. If you're given $|E| \neq |V| - 1$ in a connected graph, it's not a tree.
- **Confusing "spanning tree" with "the original graph"**: A spanning tree is a subgraph of $G$; it includes all vertices but removes edges to eliminate cycles. Students forget that removing edges from a graph with cycles still leaves a valid graph (the spanning tree), but removing them from a tree destroys connectivity.
- **Leaf-count pitfall**: A tree always has at least 2 leaves (except for $K_1$ and $K_2$). Students sometimes think a tree can have 0 or 1 leaf, which is impossible. The minimum occurs in a path graph (exactly 2 ends).
