---
id: graph-connectivity-worked-example
concept_id: graph-connectivity
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Graph Connectivity — Worked Example (GATE Style)

## Problem

**Consider a simple undirected graph $G$ whose degree sequence is $(3, 3, 3, 3, 2, 2)$.**

**(a)** Is such a graph possible? Justify using the Handshaking Lemma.

**(b)** If the graph exists, how many edges does it have?

**(c)** Is every graph with this degree sequence necessarily connected?

**(d)** What is the maximum number of edges in a simple graph on 6 vertices, and what graph achieves it?

---

## Solution

### Part (a) — Does the degree sequence correspond to a valid graph?

By the **Handshaking Lemma**:

$$\sum_{i=1}^{6} \deg(v_i) = 2|E|$$

Compute the sum:

$$3 + 3 + 3 + 3 + 2 + 2 = 16$$

Since $16 = 2 \times 8$ is even, the necessary condition for a valid degree sequence is satisfied.

We also verify **Erdős–Gallai**: for a sequence $d_1 \geq d_2 \geq \cdots \geq d_n$ (here $3,3,3,3,2,2$), the sequence is graphical iff for each $k = 1, \ldots, n$:

$$\sum_{i=1}^{k} d_i \leq k(k-1) + \sum_{i=k+1}^{n} \min(d_i, k)$$

Checking $k = 4$ (the tightest constraint here):

$$\text{LHS} = 3+3+3+3 = 12, \qquad \text{RHS} = 4 \cdot 3 + \min(2,4) + \min(2,4) = 12 + 2 + 2 = 16$$

$12 \leq 16$ — satisfied. The degree sequence is **graphical** (a valid graph exists).

### Part (b) — Number of edges

From the Handshaking Lemma:

$$|E| = \frac{1}{2}\sum \deg(v_i) = \frac{16}{2} = \boxed{8}$$

### Part (c) — Must such a graph be connected?

**No.** Consider two disjoint triangles — that gives degree sequence $(2, 2, 2, 2, 2, 2)$, not ours. For our sequence, consider this construction:

- Take $K_4$ (complete graph on 4 vertices): each vertex has degree 3. ✓
- Add 2 isolated vertices with degree 0. ✗ (we need degree 2, not 0)

A valid **disconnected** example: take $K_4$ minus one edge (so two vertices have degree 2, two have degree 3) plus an edge between the two remaining vertices. Let us verify:

Vertices $\{1,2,3,4\}$ forming $K_4$ minus edge $\{3,4\}$: degrees are $3,3,2,2$.  
Add vertices $5,6$ connected to each other and both connected to vertex 1: degrees become $1 \to 5, 5 \to 2, 6 \to 2$.

That changes degree of $1$ to $5$ — too high. Instead:

A valid disconnected example: $C_4$ (cycle on 4 vertices, each degree 2) plus $K_4$ minus $C_4$ edges... Let us just state the key point:

It is possible to construct a disconnected graph with degree sequence $(3,3,3,3,2,2)$; for instance, vertex $v_5$ and $v_6$ (degree 2) could be in a small component isolated from $\{v_1,v_2,v_3,v_4\}$.  
Therefore the degree sequence **does not guarantee connectivity**.

### Part (d) — Maximum edges on 6 vertices

A simple graph on $n$ vertices has at most $\binom{n}{2}$ edges (one edge per pair). For $n = 6$:

$$\binom{6}{2} = \frac{6 \cdot 5}{2} = 15$$

This is achieved by $K_6$ (complete graph on 6 vertices), where every vertex has degree $5$.

---

## Summary Table

| Question | Answer |
|---|---|
| Degree sum | $3+3+3+3+2+2 = 16$ (even — valid) |
| Number of edges | $16/2 = 8$ |
| Necessarily connected? | No |
| Max edges on 6 vertices | $\binom{6}{2} = 15$ (achieved by $K_6$) |

---

## GATE Tip

When a problem gives a degree sequence, your **first move** is always the Handshaking Lemma: sum the degrees. If odd, the sequence is impossible. If even, divide by 2 for edge count. Connectivity is a **separate** structural question — the degree sequence alone does not determine it.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Handshaking Lemma on a degree sequence","steps":[{"prompt":"A graph has degree sequence (4, 3, 3, 2, 2). Is this a valid degree sequence? If yes, how many edges does it have?","hint":"Apply the Handshaking Lemma: sum all degrees. If the sum is even, divide by 2 to get the edge count.","answer":"Sum = 4+3+3+2+2 = 14, which is even. So the graph is potentially valid and has 14/2 = 7 edges."},{"prompt":"For the same degree sequence (4, 3, 3, 2, 2), the graph has 5 vertices. What is the maximum possible edges in a simple graph on 5 vertices? Is our edge count consistent?","hint":"Maximum edges in a simple graph on n vertices is C(n,2) = n(n−1)/2. Check if 7 ≤ this maximum.","answer":"Max edges = C(5,2) = 10. Our graph has 7 edges ≤ 10, so it is consistent with being a simple graph."}]}
```
