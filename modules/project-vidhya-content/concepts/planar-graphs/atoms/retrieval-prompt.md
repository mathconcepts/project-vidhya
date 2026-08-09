---
id: planar-graphs.retrieval-prompt
concept_id: planar-graphs
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

A connected simple planar graph has 7 vertices and 15 edges. How many faces does it have according to Euler's formula?

- **(A)** 9
- **(B)** 10
- **(C)** 11
- **(D)** The graph is non-planar; Euler's formula does not apply.

<details>
<summary>Answer</summary>

**B**. First, check if the graph can be planar using the edge bound:
$$m \leq 3n - 6$$
$$15 \leq 3(7) - 6 = 21 - 6 = 15$$ ✓

The edge bound is satisfied (just at the boundary), so the graph *could* be planar.

Applying Euler's formula for connected planar graphs:
$$|V| - |E| + |F| = 2$$
$$7 - 15 + |F| = 2$$
$$|F| = 2 - 7 + 15 = 10$$

The graph has 10 faces.

Note: The graph achieving exactly $m = 3n - 6$ is often a maximal planar graph (every face is bounded by exactly 3 edges; a triangulated planar graph). The 10 faces include 1 outer unbounded face and 9 bounded faces.

</details>
