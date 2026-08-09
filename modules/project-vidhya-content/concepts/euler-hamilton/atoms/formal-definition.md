---
id: euler-hamilton.formal-definition
concept_id: euler-hamilton
atom_type: formal_definition
bloom_level: 2
difficulty: 0.4
exam_ids: ["*"]
---

**Eulerian Path**: A walk that traverses every edge of $G$ exactly once. An **Eulerian circuit** is a closed Eulerian path (returns to the start).

**Euler's Theorem (Undirected)**: A connected graph $G$ has an Eulerian circuit iff every vertex has even degree. $G$ has an Eulerian path (but not circuit) iff $G$ has exactly 2 vertices of odd degree (the path must start at one odd-degree vertex and end at the other).

**Hamiltonian Path**: A simple path (no repeated vertices) that visits every vertex of $G$ exactly once. A **Hamiltonian circuit** is a closed Hamiltonian path.

**Hamiltonian Existence**: No simple characterization. Checking whether a Hamiltonian path exists is NP-complete (computationally hard). However, sufficient conditions exist:
- **Dirac's Theorem**: If every vertex in a graph $G$ with $n \geq 3$ vertices has degree $\geq \frac{n}{2}$, then $G$ has a Hamiltonian circuit.
- **Ore's Theorem**: If for every pair of non-adjacent vertices $u, v$: $\deg(u) + \deg(v) \geq n$, then $G$ has a Hamiltonian circuit.
