---
id: euler-hamilton-worked-example
concept_id: euler-hamilton
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Euler & Hamiltonian Paths — Worked Example (GATE Style)

## Problem

**Consider the complete graph $K_4$ on vertices $\{1, 2, 3, 4\}$.**

**(a)** List the degree of each vertex in $K_4$.

**(b)** Does $K_4$ have an **Eulerian circuit**? Justify.

**(c)** Does $K_4$ have an **Eulerian path** (that is not a circuit)? Justify.

**(d)** Find a **Hamiltonian circuit** in $K_4$.

**(e)** For which values of $n$ does $K_n$ have an Eulerian circuit?

---

## Solution

### Part (a) — Degrees in $K_4$

In $K_n$, every vertex is connected to every other vertex. With $n = 4$ vertices:

$$\deg(v) = n - 1 = 3 \quad \text{for every vertex } v$$

All four vertices have degree 3.

### Part (b) — Eulerian Circuit in $K_4$

**Condition for an Eulerian circuit:** The graph must be connected AND every vertex must have **even degree**.

- $K_4$ is connected. ✓
- Every vertex has degree $3$ — which is **odd**. ✗

Since there exist vertices of odd degree (in fact all four vertices have odd degree), $K_4$ does **not** have an Eulerian circuit.

$$\boxed{\text{No Eulerian circuit in } K_4.}$$

### Part (c) — Eulerian Path (Not Circuit) in $K_4$

**Condition for an Eulerian path (not circuit):** The graph must be connected AND exactly **2 vertices** must have odd degree.

$K_4$ has all four vertices with odd degree — that is **4 odd-degree vertices**, not 2.

$$\boxed{\text{No Eulerian path in } K_4.}$$

Neither an Eulerian circuit nor an Eulerian path exists for $K_4$.

### Part (d) — Hamiltonian Circuit in $K_4$

A Hamiltonian circuit visits every **vertex** exactly once and returns to the start. In $K_4$ every pair of vertices is connected, so we can freely choose any permutation of vertices.

One Hamiltonian circuit:

$$1 \to 2 \to 3 \to 4 \to 1$$

This visits each of $\{1, 2, 3, 4\}$ exactly once and uses edges $\{1,2\}, \{2,3\}, \{3,4\}, \{4,1\}$ — all present in $K_4$.

Other valid Hamiltonian circuits include $1 \to 2 \to 4 \to 3 \to 1$, $1 \to 3 \to 2 \to 4 \to 1$, etc. (There are $(4-1)!/2 = 3$ distinct Hamiltonian circuits in $K_4$ up to direction.)

$$\boxed{1 \to 2 \to 3 \to 4 \to 1 \text{ is one valid Hamiltonian circuit.}}$$

### Part (e) — Eulerian Circuit in $K_n$

In $K_n$, every vertex has degree $n - 1$. An Eulerian circuit requires all degrees to be **even**, i.e., $n - 1$ must be even:

$$n - 1 \equiv 0 \pmod{2} \iff n \equiv 1 \pmod{2} \iff n \text{ is odd}$$

**$K_n$ has an Eulerian circuit if and only if $n$ is odd.**

| $n$ | $\deg(v) = n-1$ | Eulerian circuit? |
|---|---|---|
| 2 | 1 (odd) | No |
| 3 | 2 (even) | Yes |
| 4 | 3 (odd) | No |
| 5 | 4 (even) | Yes |
| 6 | 5 (odd) | No |
| 7 | 6 (even) | Yes |

---

## Summary

| Property | $K_4$ result | Reason |
|---|---|---|
| Eulerian circuit | No | All 4 vertices have odd degree (3) |
| Eulerian path | No | 4 odd-degree vertices (need exactly 2) |
| Hamiltonian circuit | Yes | $1 \to 2 \to 3 \to 4 \to 1$ |
| $K_n$ Eulerian circuit | $n$ odd only | Degree $n-1$ is even iff $n$ is odd |

## GATE Tip

The Euler condition is a **one-line check**: count odd-degree vertices.

- 0 odd-degree vertices → Eulerian circuit exists.
- 2 odd-degree vertices → Eulerian path (not circuit) exists.
- 4 or more odd-degree vertices → Neither exists.

For Hamiltonian questions on small graphs, GATE expects you to exhibit a circuit or prove impossibility by exhaustion / degree arguments (not NP-hardness, which applies to the general decision problem).

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"Consider a graph with 6 vertices where vertex degrees are (4, 4, 3, 3, 2, 2). Does an Eulerian circuit exist? Does an Eulerian path exist?","hint":"Count the number of odd-degree vertices. Euler circuit needs 0 odd; Euler path needs exactly 2 odd.","answer":"Odd-degree vertices: degree 3, 3 — exactly 2 odd-degree vertices. So no Eulerian circuit (need 0 odd), but an Eulerian path exists (exactly 2 odd). The path starts at one degree-3 vertex and ends at the other."},{"prompt":"Does K₅ have an Eulerian circuit? Apply the rule derived in Part (e).","hint":"In K_n, every vertex has degree n−1. Check whether n−1 is even for n=5.","answer":"K₅ has n=5 (odd), so degree = 5−1 = 4 (even). All vertices have even degree and K₅ is connected, so yes — K₅ has an Eulerian circuit."}]}
```
