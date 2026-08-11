---
id: planar-graphs.micro-exercise
concept_id: planar-graphs
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

A connected planar graph has 6 vertices and 12 edges. Using Euler's formula, how many faces does this planar embedding have?

- **(A)** 6
- **(B)** 7
- **(C)** 8
- **(D)** 9

<details>
<summary>Answer</summary>

**C**. Euler's formula for connected planar graphs states:
$$|V| - |E| + |F| = 2$$

Given: $|V| = 6$, $|E| = 12$.

Solving for $|F|$:
$$6 - 12 + |F| = 2$$
$$|F| = 2 - 6 + 12 = 8$$

The graph has 8 faces (including the outer unbounded face).

Geometric interpretation: 12 edges in a planar drawing partition the plane into 8 regions—7 bounded regions and 1 unbounded region (the outer face).

</details>
