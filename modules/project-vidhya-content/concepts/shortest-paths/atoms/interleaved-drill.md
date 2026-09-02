---
id: shortest-paths.interleaved-drill
concept_id: shortest-paths
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: shortest paths → trees.**

Undirected weighted graph, vertices $S,A,B,C$: edges $S\text{-}A=2$, $S\text{-}B=2$, $A\text{-}B=1$, $A\text{-}C=10$, $B\text{-}C=1$.

**Question 1 (shortest paths):** Run Dijkstra from $S$. What are the predecessor edges of the resulting shortest-path tree, and its total edge weight?

*Answer:* $d[S]=0$; relax $S\text{-}A=2$, $S\text{-}B=2$. Extract $A$: relax $A\text{-}B$: $2+1=3$, not better than $d[B]=2$, no update; relax $A\text{-}C$: $2+10=12$. Extract $B$: relax $B\text{-}C$: $2+1=3<12$, update $d[C]=3$. Predecessor edges: $A\leftarrow S$ (2), $B\leftarrow S$ (2), $C\leftarrow B$ (1). Total weight $=2+2+1=5$.

**Question 2 (trees):** Is this shortest-path tree the minimum spanning tree of the same graph? Compute the MST and compare.

*Answer:* No. By Kruskal's rule (cheapest edge first, skip anything that closes a cycle): $A\text{-}B(1)$, $B\text{-}C(1)$, then $S\text{-}A(2)$ (the cheaper of the two remaining edges into $S$) — 3 edges, total weight $=1+1+2=4$. That is strictly less than the shortest-path tree's weight of $5$. Both are valid spanning trees of the same 4 vertices; only one of them is minimum-weight.

**Why this drill exists:** a shortest-path tree guarantees the shortest possible distance from one fixed source to every other vertex; a minimum spanning tree guarantees the smallest possible total edge weight with no fixed source at all. Both are legitimate, correctly-computed trees on the same graph, and this example proves by direct computation that they are not the same tree — a shortest-path tree is not automatically a minimum spanning tree, and running Dijkstra is not a substitute for running Kruskal or Prim when the actual question asks for the cheapest network, not the fastest route from one point.
