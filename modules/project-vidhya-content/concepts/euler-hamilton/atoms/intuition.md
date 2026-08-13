---
id: euler-hamilton-intuition
concept_id: euler-hamilton
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Euler & Hamiltonian Paths — Core Intuition

## The Two Questions

| Question | Unit | Condition |
|---|---|---|
| **Eulerian path/circuit** | Every **edge** traversed exactly once | Degree-based (easy to check) |
| **Hamiltonian path/circuit** | Every **vertex** visited exactly once | No simple characterization (NP-complete in general) |

These look similar but are fundamentally different in computational difficulty.

---

## Eulerian Paths and Circuits

### Definitions

- **Eulerian path:** A walk that traverses every **edge** of $G$ exactly once.
- **Eulerian circuit:** An Eulerian path that starts and ends at the **same vertex**.

### Existence Conditions (Undirected Graph)

| Type | Condition |
|---|---|
| **Eulerian circuit** | Graph is connected AND every vertex has **even degree** |
| **Eulerian path** | Graph is connected AND exactly **2 vertices** have odd degree (these are the start and end) |

**Why?** When traversing an Eulerian circuit, every time you enter a vertex you must leave it — using one edge in, one edge out. This "uses up" two edges at every intermediate vertex, requiring even degree. The start/end vertex is the only exception (one extra unpaired use), which is why a path (not circuit) allows exactly two odd-degree vertices.

### Directed Graph Conditions

| Type | Condition |
|---|---|
| **Eulerian circuit** | Strongly connected AND $\deg^+(v) = \deg^-(v)$ for every $v$ |
| **Eulerian path** | Exactly one vertex with $\deg^+(v) - \deg^-(v) = 1$ (start) and one with $\deg^-(v) - \deg^+(v) = 1$ (end); rest balanced |

### Algorithm

Hierholzer's algorithm finds an Eulerian circuit in $O(E)$ time:
1. Start at any vertex, follow edges (deleting them) until you return to start.
2. If edges remain, find a vertex on the current circuit with unused edges and extend.

---

## Hamiltonian Paths and Circuits

### Definitions

- **Hamiltonian path:** A path that visits every **vertex** exactly once.
- **Hamiltonian circuit:** A Hamiltonian path that returns to the starting vertex.

### Existence — Sufficient Conditions (Not Necessary)

**Dirac's Theorem (1952):** If $G$ is a simple graph on $n \geq 3$ vertices and every vertex has degree $\geq n/2$, then $G$ has a Hamiltonian circuit.

**Ore's Theorem:** If for every pair of non-adjacent vertices $u, v$: $\deg(u) + \deg(v) \geq n$, then $G$ has a Hamiltonian circuit.

These are **sufficient** conditions only. Graphs that fail them may still have Hamiltonian circuits.

### Computational Hardness

Determining whether a Hamiltonian circuit exists is **NP-complete** — no efficient general algorithm is known. This is in sharp contrast with Eulerian circuits (polynomial time via degree check).

---

## Summary Comparison

| Feature | Eulerian Circuit | Hamiltonian Circuit |
|---|---|---|
| Condition | Every vertex even degree | No simple characterization |
| Check complexity | $O(V + E)$ | NP-complete |
| Historical problem | Königsberg bridges | Icosian game |
| Related to | Edges | Vertices |

## Key Facts for GATE

1. Eulerian circuit exists iff connected + all degrees even.
2. Eulerian path (not circuit) exists iff connected + exactly 2 odd-degree vertices.
3. $K_n$ has an Eulerian circuit iff $n$ is odd (since all degrees are $n-1$, which is even iff $n$ is odd).
4. Dirac's theorem: min degree $\geq n/2 \Rightarrow$ Hamiltonian circuit exists.
5. Hamiltonian circuit existence is NP-complete — GATE may ask for specific small graphs, not a general algorithm.
