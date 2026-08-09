# Teaching Tips: Graph Coloring

## Common Student Errors
- **Confusing chromatic number with maximum degree**: $\chi(G) \leq \Delta(G) + 1$, but equality is rare. Students often assume they're equal. A cycle $C_5$ has $\Delta = 2$ but $\chi = 3$; a tree has $\Delta$ potentially large but $\chi = 2$ (bipartite).
- **Missing the bipartite shortcut**: If a graph is bipartite, $\chi(G) = 2$ (unless disconnected with isolated vertices). Students waste time trying to color a bipartite graph with 3+ colors instead of recognizing the structure.
- **Forgetting clique lower bounds**: If you see a $K_r$ subgraph, immediately know $\chi(G) \geq r$. Students sometimes color a graph containing $K_4$ with 3 colors, violating this bound.

## GATE Question Pattern
GATE coloring questions usually take one of three forms:
1. **Specific small graphs** ("Find $\chi(C_5)$", "$\chi(K_7)$"): Direct computation or known formulas.
2. **Bipartiteness check**: "Is this graph bipartite?" (equivalent to "Is $\chi(G) \leq 2$?"). Answer via 2-coloring or cycle detection.
3. **Bounds** ("If max degree is 10, what bound on $\chi(G)$?"): Apply the greedy bound or clique lower bound.

## Speed Tricks for MCQs
- **Cycle parity rule**: $C_n$ is 2-colorable iff $n$ is even. Odd cycles need 3. Instant answer for cycle questions.
- **Bipartite ≡ no odd cycles**: A graph is bipartite iff it has no odd-length cycles. Use this to quickly identify bipartite structures (trees are always bipartite; any cycle of odd length makes it non-bipartite).
- **Clique size → lower bound**: If you spot a $K_r$ in the graph, $\chi(G) \geq r$. Use this to eliminate answer choices claiming smaller chromatic numbers.

## Must-Memorize Formulas / Results

**Chromatic number of common graphs:**
- $\chi(K_n) = n$ (complete graph)
- $\chi(C_n) = 2$ if $n$ is even, $3$ if $n$ is odd (cycles)
- $\chi(T) = 2$ for any tree $T$ (trees are bipartite)
- $\chi(K_{m,n}) = 2$ for any complete bipartite graph

**Greedy Coloring Bound:**
$$\chi(G) \leq \Delta(G) + 1$$
where $\Delta(G)$ is the maximum degree.

**Clique Lower Bound:**
$$\chi(G) \geq \omega(G)$$
where $\omega(G)$ is the size of the largest clique in $G$.

**Bipartite Characterization:**
A graph $G$ is bipartite ⟺ $\chi(G) \leq 2$ ⟺ $G$ has no odd-length cycles.

**Independent Set Partition:**
A proper $k$-coloring partitions $V$ into $k$ independent sets. Conversely, if $V$ can be partitioned into $k$ independent sets, $\chi(G) \leq k$.

**Chromatic Polynomial (complete graph):**
$$P(K_n, k) = k(k-1)(k-2) \cdots (k-n+1) = k^{\underline{n}}$$
(the number of ways to color $K_n$ with $k$ colors)
