---
id: graph-basics.micro-exercise
concept_id: graph-basics
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

A simple undirected graph has 5 vertices with degrees 3, 2, 4, 2, and 3. What is the total number of edges in the graph?

- **(A)** 7
- **(B)** 8
- **(C)** 9
- **(D)** 10

<details>
<summary>Answer</summary>

**A**. By the Handshaking Lemma, the sum of all degrees equals twice the number of edges.
Sum of degrees = 3 + 2 + 4 + 2 + 3 = 14.
Using $\sum_{v \in V} \deg(v) = 2|E|$:
$14 = 2|E|$
$|E| = 7$
Therefore, the graph has 7 edges. Geometrically, these 14 degree-units mean 7 highways are needed to connect the 5 cities at the specified degrees.

</details>
