# Eulerian & Hamiltonian Paths
> GATE Engineering Mathematics | Graph Theory | High frequency | difficulty: 0.5

## Intuition First
An **Eulerian path** visits every edge exactly once (like drawing a figure without lifting your pen). A **Hamiltonian path** visits every vertex exactly once (like a traveling salesman who must visit every city but can skip some highways). One is about exhausting edges; the other is about exhausting vertices. Detecting them is radically different: Eulerian paths are polynomial-time (degree-based rule), while Hamiltonian paths are NP-complete.

## Core Definition
**Eulerian Path**: A walk that traverses every edge of $G$ exactly once. An **Eulerian circuit** is a closed Eulerian path (returns to the start).

**Euler's Theorem (Undirected)**: A connected graph $G$ has an Eulerian circuit iff every vertex has even degree. $G$ has an Eulerian path (but not circuit) iff $G$ has exactly 2 vertices of odd degree (the path must start at one odd-degree vertex and end at the other).

**Hamiltonian Path**: A simple path (no repeated vertices) that visits every vertex of $G$ exactly once. A **Hamiltonian circuit** is a closed Hamiltonian path.

**Hamiltonian Existence**: No simple characterization. Checking whether a Hamiltonian path exists is NP-complete (computationally hard). However, sufficient conditions exist:
- **Dirac's Theorem**: If every vertex in a graph $G$ with $n \geq 3$ vertices has degree $\geq \frac{n}{2}$, then $G$ has a Hamiltonian circuit.
- **Ore's Theorem**: If for every pair of non-adjacent vertices $u, v$: $\deg(u) + \deg(v) \geq n$, then $G$ has a Hamiltonian circuit.

## What Happens (Worked Example)
Label: "**What happens:**"

**Graph A (Eulerian path exists):**
Vertices: $\{1, 2, 3, 4\}$, Edges: $(1,2), (2,3), (3,4), (4,1), (1,3)$

Degrees: $\deg(1) = 3, \deg(2) = 2, \deg(3) = 3, \deg(4) = 2$

Odd-degree vertices: $\{1, 3\}$ (exactly 2). So an Eulerian path exists from 1 to 3 (or 3 to 1).
Example Eulerian path: $1 \to 2 \to 3 \to 4 \to 1 \to 3$ (traverses all 5 edges exactly once).

**Graph B (Hamiltonian path exists):**
Same graph. A Hamiltonian path must visit each of the 4 vertices exactly once. Example: $1 \to 2 \to 3 \to 4$ or $2 \to 1 \to 4 \to 3$. Many such paths exist.

Note: Both exist here, but they are independent conditions.

Label: "**Why it works:**"

**Eulerian**: At each intermediate vertex on an Eulerian path, we must enter once and leave once per visit (consuming 2 edges per visit). For the path to end without getting stuck, every intermediate vertex needs an even degree. The two odd-degree endpoints are where we start/end (entering or leaving without a counterpart).

**Hamiltonian**: No simple rule exists, but Dirac's Theorem works because high-degree vertices have many exit options, making it harder to "trap" the path before visiting all vertices.

## GATE MA Relevance
> **Why it matters in GATE MA:** Eulerian/Hamiltonian concepts appear in 10–15% of GATE graph questions. GATE typically asks: "Does this graph have an Eulerian/Hamiltonian path?" (NAT or MCQ, using Euler's degree-check rule or Dirac's sufficient condition). Hamiltonian questions are often marked hard and may include impossibility proofs.
