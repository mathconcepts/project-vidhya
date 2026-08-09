---
id: trees.micro-exercise
concept_id: trees
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

A tree has 12 vertices. How many edges does it have?

- **(A)** 10
- **(B)** 11
- **(C)** 12
- **(D)** 13

<details>
<summary>Answer</summary>

**B**. By definition, a tree with $n$ vertices has exactly $n - 1$ edges.
For $n = 12$: $|E| = 12 - 1 = 11$ edges.
This holds because:
1. The tree is connected (one component).
2. The tree is acyclic (no cycles).
These two properties together force exactly $n-1$ edges.
Geometrically, think of building the tree by starting with 12 isolated vertices. Each edge added connects a new vertex to the growing tree. After 11 edges, all 12 vertices are connected and no cycles can form.

</details>
