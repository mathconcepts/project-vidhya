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

**Method selector.** For Eulerian existence, the degree-parity check (count odd-degree vertices: $0$ for a circuit, $2$ for a path, otherwise neither) is decisive and instant — always use it first, never reach for Dirac's or Ore's theorem here, since those are Hamiltonian-only tools with no bearing on edge-traversal questions. For Hamiltonian existence, Dirac's and Ore's are *sufficient* conditions only: a graph failing both may still have a Hamiltonian circuit, so a failed check should route you to constructing one directly on a small graph, not to concluding "no Hamiltonian circuit exists" — that conclusion needs an actual proof of non-existence, not a missed sufficient condition.
