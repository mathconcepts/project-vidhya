---
id: graph-connectivity.micro-exercise
concept_id: graph-connectivity
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Consider a simple undirected graph with 7 vertices. An edge is called a bridge if its removal increases the number of connected components. In the given graph, identify which edge(s) is/are bridge(s). The edges are: (1,2), (2,3), (3,4), (4,5), (5,6), (6,1), (3,6). How many bridges are in this graph?

- **(A)** 0
- **(B)** 1
- **(C)** 2
- **(D)** 3

<details>
<summary>Answer</summary>

**A**. First, identify the structure. Edges form a cycle 1-2-3-4-5-6-1 (a hexagon) plus an additional edge (3,6).
A cycle is formed by vertices: 1-2-3-6-1 and another 3-4-5-6-3.
Let me trace: Start at 1: 1-2-3-4-5-6-1 is a 6-cycle (hexagon). Edge (3,6) creates a chord connecting non-adjacent vertices in this cycle.

To find bridges, check if each edge lies in a cycle:
- (1,2): path 1-2-3-4-5-6-1, so 1-2 is in a cycle (part of the main 6-cycle). Not a bridge.
- (2,3): in the 6-cycle. Not a bridge.
- (3,4): in the 6-cycle. Not a bridge.
- (4,5): in the 6-cycle. Not a bridge.
- (5,6): in the 6-cycle. Not a bridge.
- (6,1): in the 6-cycle. Not a bridge.
- (3,6): This edge creates cycles 3-4-5-6-3 and 3-6-1-2-3. It's part of cycles, so not a bridge.

Since every edge is part of at least one cycle, there are no bridges. The graph is 2-edge-connected (you need to remove at least 2 edges to disconnect it).

</details>
