---
id: euler-hamilton.retrieval-prompt
concept_id: euler-hamilton
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

A simple graph has 5 vertices. For the graph to satisfy Dirac's condition (sufficient for a Hamiltonian circuit), what is the minimum degree each vertex must have?

- **(A)** 2
- **(B)** 2.5
- **(C)** 3
- **(D)** 4

<details>
<summary>Answer</summary>

**C**. Dirac's Theorem: If every vertex in a graph $G$ with $n \geq 3$ vertices has degree $\geq \frac{n}{2}$, then $G$ has a Hamiltonian circuit.

For $n = 5$:
$$\deg(v) \geq \frac{5}{2} = 2.5$$

Since degree must be an integer: $\deg(v) \geq 3$.

Therefore, each vertex must have degree at least 3 to satisfy Dirac's condition.

Geometrically: With 5 vertices, if each has degree at least 3, there are enough edges and enough connectivity to guarantee a path visiting all 5 vertices exactly once (a Hamiltonian circuit). A lower degree (like 2) might leave some vertices with insufficient options to complete a full circuit.

</details>
