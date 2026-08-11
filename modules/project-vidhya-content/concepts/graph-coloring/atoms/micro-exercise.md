---
id: graph-coloring.micro-exercise
concept_id: graph-coloring
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

What is the chromatic number of a cycle $C_6$ (a 6-vertex cycle)?

- **(A)** 1
- **(B)** 2
- **(C)** 3
- **(D)** 6

<details>
<summary>Answer</summary>

**B**. A cycle $C_n$ is 2-colorable iff $n$ is even.

For $C_6$ (a hexagon): vertices arranged in a cycle 1-2-3-4-5-6-1.
- Color vertices 1, 3, 5 with color A.
- Color vertices 2, 4, 6 with color B.

Each vertex is adjacent only to its neighbors (one on each side in the cycle). Odd-numbered vertices only touch even-numbered vertices, and vice versa. No two vertices of the same color are adjacent.

Therefore, $\chi(C_6) = 2$. $C_6$ is bipartite.

Geometrically: Even cycles form two-sided structures (one set of odd positions, one of even); odd cycles do not.

</details>
