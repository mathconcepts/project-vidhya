# Teaching Tips: Connectivity

## Common Student Errors
- **Confusing cut vertices with bridges**: A cut vertex is a vertex whose removal disconnects the graph; a bridge is an edge whose removal disconnects it. Students often mix these up. Remember: cut vertex = node, bridge = edge.
- **Forgetting the $k$-connectivity bound**: Many students don't realize that $\kappa(G) \leq \lambda(G) \leq \delta(G)$. They'll try to construct a 3-connected graph with minimum degree 2, which is impossible.
- **Misidentifying components**: When removing vertices/edges, students often lose track of which vertices belong to which component. Draw the graph explicitly and track the connected regions.

## GATE Question Pattern
GATE connectivity questions come in three flavors: (1) **Identify cut vertices/bridges** in a small graph (NAT-style: "count them"), (2) **Compute or bound $\kappa(G)$ or $\lambda(G)$** given degree/edge info, and (3) **Theoretical questions** combining connectivity with other properties (e.g., "a graph has a bridge and a cycle—what does this tell us about its structure?").

## Speed Tricks for MCQs
- **Bridge ↔ cycle rule**: An edge is a bridge iff it is not part of any cycle. Quickly scan the graph for cycles and mark edges outside them as potential bridges.
- **Cut vertex ↔ degree**: If a vertex has degree 1, it's either isolated (if degree 0) or a leaf. A cut vertex with degree $d$ splits the graph into at most $d$ components. Use this to quickly bound $\kappa(G)$.
- **Average degree lower bound**: $\bar{d} = \frac{2|E|}{|V|}$. If the average is low (e.g., $< 3$), you know no vertex can have degree $> 2 \times$ average. Use this to reject 3-connected claims for sparse graphs.

## Must-Memorize Formulas / Results

**Connectivity inequality chain:**
$$\kappa(G) \leq \lambda(G) \leq \delta(G)$$
where $\kappa$ = vertex connectivity, $\lambda$ = edge connectivity, $\delta$ = minimum degree.

**Complete graph:** $\kappa(K_n) = \lambda(K_n) = n - 1$.

**Tree connectivity:** A tree with $n \geq 2$ vertices has $\kappa(T) = 1$ and $\lambda(T) = 1$ (every vertex except leaves is a cut vertex, and every edge is a bridge).

**Minimum edges for $k$-connectivity:** A $k$-connected graph on $n$ vertices requires at least $\lceil \frac{n \cdot k}{2} \rceil$ edges.

**Cut vertex characterization:** $v$ is a cut vertex iff there exist vertices $u, w$ such that every path from $u$ to $w$ passes through $v$.

**Bridge characterization:** An edge $(u, v)$ is a bridge iff it is not part of any cycle in $G$.
