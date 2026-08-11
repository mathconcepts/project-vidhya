# Shortest Paths
> GATE Engineering Mathematics | Graph Theory | Medium frequency | difficulty: 0.5

## Intuition First
In a weighted graph (cities with highway costs), what's the cheapest route from A to B? Shortest-path algorithms find it. They're everywhere: GPS routing, network optimization, game AI. The challenge is efficiency: brute-force checking all paths is exponential; clever algorithms do it in polynomial time.

## Core Definition
**Shortest Path**: In a weighted graph $G = (V, E, w)$ where $w: E \to \mathbb{R}$ (edge weights), a shortest path from $s$ to $t$ is a path minimizing the sum of edge weights. The **shortest-path distance** $d(s, t)$ is that sum.

**Single-Source Shortest Paths**: Algorithms that compute distances from one source $s$ to all other vertices.
- **Dijkstra's Algorithm**: Efficient for non-negative weights. Time: $O(|E| \log |V|)$ with a min-heap. Greedy: always expand the nearest unvisited vertex.
- **Bellman-Ford**: Handles negative weights (but not negative cycles). Time: $O(|V| \cdot |E|)$. Relaxes all edges repeatedly.

**All-Pairs Shortest Paths**:
- **Floyd-Warshall**: $O(|V|^3)$ dynamic programming. Works with negative weights (no negative cycles).

**Negative Cycles**: A cycle with total weight $< 0$. Shortest paths are undefined if a negative cycle is reachable from the source (distance can become arbitrarily negative).

**Relaxation**: A core technique. For an edge $(u, v)$ with weight $w(u, v)$, if $d[u] + w(u, v) < d[v]$, update $d[v] := d[u] + w(u, v)$. Dijkstra and Bellman-Ford repeatedly relax edges.

## What Happens (Worked Example)
Label: "**What happens:**"

Consider a graph with 4 vertices $\{A, B, C, D\}$ and weighted edges:
- $(A, B): 1$, $(A, C): 4$, $(B, C): 2$, $(B, D): 5$, $(C, D): 1$.

Using Dijkstra from $A$:
1. Initialize: $d[A] = 0$, others = $\infty$.
2. Visit $A$ (nearest): relax $(A,B) \to d[B] = 1$, $(A,C) \to d[C] = 4$.
3. Visit $B$ (next nearest, $d[B] = 1$): relax $(B,C) \to d[C] = \min(4, 1+2) = 3$, $(B,D) \to d[D] = 6$.
4. Visit $C$ (next nearest, $d[C] = 3$): relax $(C,D) \to d[D] = \min(6, 3+1) = 4$.
5. Visit $D$ (last): nothing to relax.

Final distances: $d[A] = 0, d[B] = 1, d[C] = 3, d[D] = 4$.

Label: "**Why it works:**"

Dijkstra works because of the **optimal substructure** property: a shortest path from $s$ to $t$ consists of shortest paths to intermediate vertices. By processing vertices in order of distance, we ensure that when we visit a vertex, its distance is final (no further updates). This greedy choice is optimal for non-negative weights. With negative weights, the assumption breaks, so Bellman-Ford (which reprocesses edges) is needed.

## GATE MA Relevance
> **Why it matters in GATE MA:** Shortest-path questions appear in 8–15% of GATE graph problems. GATE asks: "Apply Dijkstra to [small graph] and find shortest paths" (NAT: numerical result), or "Verify that Bellman-Ford handles negative weights" (theoretical). Questions rarely ask for algorithm pseudocode but often require tracing through steps or understanding when algorithms work/fail.
