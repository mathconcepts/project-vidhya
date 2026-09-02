---
id: planar-graphs.interleaved-drill
concept_id: planar-graphs
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: planar graphs → graph coloring.**

Take the octahedron graph: 6 vertices, 12 edges, every vertex adjacent to every other vertex except the one directly opposite it.

**Question 1 (planar graphs):** Assuming this graph has a planar embedding, use Euler's formula to find the number of faces, and check whether it is maximal planar.

*Answer:* $V-E+F=2 \Rightarrow 6-12+F=2 \Rightarrow F=8$ (matching the octahedron's 8 triangular faces). Density bound: $3V-6=3(6)-6=12=E$ — equality, so this is a maximal planar graph (a full triangulation; no edge can be added without crossing).

**Question 2 (graph coloring):** Since the graph is planar, the Four Color Theorem guarantees $\chi(G)\leq 4$. Is $\chi(G)$ actually 4?

*Answer:* No — $\chi(G)=3$. The octahedron is the complete tripartite graph $K_{2,2,2}$: its 6 vertices split into 3 pairs of opposite (non-adjacent) vertices, and coloring each pair its own color gives a valid 3-coloring (checked directly: no proper 2-coloring exists, and a proper 3-coloring does). The Four Color Theorem's "$\leq 4$" is an upper bound the octahedron does not saturate.

**Why this drill exists:** graph-coloring's own drill on the wheel graph $W_5$ shows a planar graph that genuinely needs all 4 colors — students who see that example can overcorrect and assume every maximal planar graph (every face a triangle, the densest planar case) needs 4. The octahedron is a maximal planar graph that needs only 3, proving edge-density and chromatic number are separate questions.
