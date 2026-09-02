---
id: shortest-paths.worked-example
concept_id: shortest-paths
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

## Problem (GATE Style): Dijkstra on a 5-Vertex Graph

Apply Dijkstra's algorithm on the directed graph below with source vertex $s = A$.
Find the shortest distance from $A$ to every other vertex and the order in which vertices are settled.

**Edges (directed, with weights):**

| From | To | Weight |
|---|---|---|
| A | B | 4 |
| A | C | 2 |
| B | C | 1 |
| B | D | 5 |
| C | B | 1 |
| C | D | 8 |
| C | E | 10 |
| D | E | 2 |
| E | — | — |

---

## Solution

### Step 0: Initialisation

$$d[A] = 0,\quad d[B] = d[C] = d[D] = d[E] = \infty$$

Priority queue (vertex, distance): $\{(A, 0)\}$

Settled set: $S = \{\}$

---

### Step 1: Extract $A$ (distance 0); settle $A$

$S = \{A\}$

Relax $A$'s neighbors:
- $d[B] = \min(\infty,\; 0 + 4) = 4$, predecessor $\pi[B] = A$
- $d[C] = \min(\infty,\; 0 + 2) = 2$, predecessor $\pi[C] = A$

Queue: $\{(C, 2),\; (B, 4)\}$

---

### Step 2: Extract $C$ (distance 2); settle $C$

$S = \{A, C\}$

Relax $C$'s neighbors:
- $d[B] = \min(4,\; 2 + 1) = 3$ ← **improved!** $\pi[B] = C$
- $d[D] = \min(\infty,\; 2 + 8) = 10$, $\pi[D] = C$
- $d[E] = \min(\infty,\; 2 + 10) = 12$, $\pi[E] = C$

Queue: $\{(B, 3),\; (B, 4)^*,\; (D, 10),\; (E, 12)\}$
($^*$ stale entry; ignored when extracted since $B$ is already settled)

---

### Step 3: Extract $B$ (distance 3); settle $B$

$S = \{A, C, B\}$

Relax $B$'s neighbors:
- $d[C]$: already settled — skip.
- $d[D] = \min(10,\; 3 + 5) = 8$ ← **improved!** $\pi[D] = B$

Queue: $\{(D, 8),\; (E, 12),\; (D, 10)^*\}$

---

### Step 4: Extract $D$ (distance 8); settle $D$

$S = \{A, C, B, D\}$

Relax $D$'s neighbors:
- $d[E] = \min(12,\; 8 + 2) = 10$ ← **improved!** $\pi[E] = D$

Queue: $\{(E, 10),\; (E, 12)^*\}$

---

### Step 5: Extract $E$ (distance 10); settle $E$

$S = \{A, C, B, D, E\}$. Queue empty. Done.

---

## Final Result

| Vertex | Shortest distance from $A$ | Predecessor |
|---|---|---|
| $A$ | 0 | — |
| $B$ | 3 | $C$ |
| $C$ | 2 | $A$ |
| $D$ | 8 | $B$ |
| $E$ | 10 | $D$ |

**Settlement order:** $A \to C \to B \to D \to E$

---

## Reconstructing the Shortest Path $A \to E$

Walk back through predecessors: $E \leftarrow D \leftarrow B \leftarrow C \leftarrow A$

$$\text{Path: } A \to C \to B \to D \to E \quad \text{(cost } 2+1+5+2 = 10\text{)}$$

---

## GATE Trap

> "Since $A \to B = 4$ and $A \to B$ is a direct edge, shouldn't B be settled before C?"

No. Dijkstra always settles the vertex with the **smallest current distance**. At the time of extraction, $d[C] = 2 < d[B] = 4$, so $C$ is settled first. After settling $C$, we discover $A \to C \to B$ costs only 3, improving $d[B]$ from 4 to 3.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Dijkstra's algorithm on a 5-vertex graph","steps":[{"prompt":"After settling vertex A (distance 0), what are the updated distances d[B] and d[C]? Which vertex is extracted next?","hint":"Relax A's outgoing edges: A→B (weight 4) and A→C (weight 2). The vertex with minimum distance is extracted next.","answer":"d[B] = 4 (via A→B), d[C] = 2 (via A→C). C is extracted next because d[C]=2 < d[B]=4."},{"prompt":"After settling C (distance 2), d[B] improves. State the new d[B] and explain why the initial value of 4 is replaced.","hint":"Relax C's edge to B: d[C] + w(C,B) = 2 + 1 = 3. Compare with the current d[B] = 4.","answer":"New d[B] = 3 (via A→C→B, cost 2+1=3). Since 3 < 4, we relax: d[B]=3 and predecessor π[B] is updated to C. This is the fundamental relaxation step of Dijkstra."}]}
```
