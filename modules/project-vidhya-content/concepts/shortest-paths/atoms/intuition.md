---
id: shortest-paths-intuition
concept_id: shortest-paths
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
---

# Shortest Paths — The Three Algorithms

## The Core Problem

Given a weighted directed (or undirected) graph, find the minimum-weight path between vertices.

---

## Algorithm 1: Dijkstra's Algorithm

**Use when:** All edge weights are **non-negative**.

**Idea:** Greedily settle vertices in order of their current shortest distance from the source.

**Data structure:** Min-priority queue (min-heap).

**Steps:**
1. Initialize $d[s] = 0$, $d[v] = \infty$ for all $v \neq s$.
2. Insert all vertices into a min-heap keyed by $d$.
3. Extract the vertex $u$ with minimum $d[u]$.
4. For each neighbor $v$ of $u$: **relax** — if $d[u] + w(u,v) < d[v]$, update $d[v]$.
5. Repeat until the heap is empty.

**Time complexity:**

| Implementation | Complexity |
|---|---|
| Adjacency matrix + linear scan | $O(V^2)$ |
| Adjacency list + binary heap | $O((V + E) \log V)$ |
| Adjacency list + Fibonacci heap | $O(E + V \log V)$ |

**Does NOT work with negative edge weights** (a settled vertex can be revisited via a negative edge, but Dijkstra never goes back).

---

## Algorithm 2: Bellman-Ford

**Use when:** Graph may have **negative edge weights**. Also detects **negative-weight cycles**.

**Idea:** Relax all $E$ edges exactly $V - 1$ times. After $k$ iterations, $d[v]$ holds the shortest path using at most $k$ edges.

**Steps:**
1. Initialize $d[s] = 0$, $d[v] = \infty$.
2. Repeat $V - 1$ times: for every edge $(u, v, w)$, relax: $d[v] = \min(d[v],\, d[u] + w)$.
3. **Negative cycle check:** do one more pass. If any $d[v]$ still decreases, a negative cycle is reachable from $s$.

**Time complexity:** $O(VE)$

---

## Algorithm 3: Floyd-Warshall

**Use when:** You need **all-pairs** shortest paths.

**Idea:** Dynamic programming — $D^{(k)}[i][j]$ = shortest path from $i$ to $j$ using only intermediate vertices from $\{1, \ldots, k\}$.

**Recurrence:**

$$D^{(k)}[i][j] = \min\!\Big(D^{(k-1)}[i][j],\; D^{(k-1)}[i][k] + D^{(k-1)}[k][j]\Big)$$

**Time complexity:** $O(V^3)$ &emsp; **Space:** $O(V^2)$

Handles negative edges (but not negative cycles). Detects negative cycle if $D[i][i] < 0$ for any $i$ after the algorithm.

---

## Relaxation — The Universal Primitive

All three algorithms reduce to **relaxation**:

$$\text{if } d[u] + w(u,v) < d[v]: \quad d[v] \leftarrow d[u] + w(u,v),\quad \pi[v] \leftarrow u$$

$\pi[v]$ is the **predecessor** of $v$ in the shortest-path tree. Walk back through $\pi$ to reconstruct any path.

---

## GATE Exam Signals

| Scenario | Use |
|---|---|
| Non-negative weights, single source | Dijkstra |
| Negative weights or detect neg. cycle | Bellman-Ford |
| All-pairs shortest paths | Floyd-Warshall |
| Sparse graph, fast single-source | Dijkstra + heap |
| Dense graph, all-pairs | Floyd-Warshall |

- GATE often asks for the **number of iterations** Bellman-Ford needs, or the **state of the distance array** after $k$ relaxation passes.
- Dijkstra questions often ask for the order in which vertices are settled.
