---
id: euler-hamilton.micro-exercise
concept_id: euler-hamilton
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

A connected graph has vertices with degrees: 2, 3, 4, 3, 2. Does this graph have an Eulerian path?

- **(A)** Yes, it has an Eulerian circuit.
- **(B)** Yes, it has an Eulerian path but not a circuit.
- **(C)** No, an Eulerian path does not exist.
- **(D)** Cannot be determined without knowing the edges.

<details>
<summary>Answer</summary>

**B**. By Euler's Theorem:
- A connected graph has an Eulerian circuit iff every vertex has even degree.
- A connected graph has an Eulerian path (but not circuit) iff exactly 2 vertices have odd degree.

Given degrees: 2 (even), 3 (odd), 4 (even), 3 (odd), 2 (even).
Odd-degree vertices: exactly 2 vertices with degree 3.

Since there are exactly 2 odd-degree vertices, an Eulerian path exists from one odd-degree vertex to the other. However, since not all vertices are even-degree, there is no Eulerian circuit.

Therefore: **Yes, the graph has an Eulerian path (but not a circuit).** The path must start at one degree-3 vertex and end at the other.

</details>
