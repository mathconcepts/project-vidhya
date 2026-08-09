# Teaching Tips: Planar Graphs

## Common Student Errors
- **Misusing Euler's formula**: Students apply $|V| - |E| + |F| = 2$ to disconnected graphs (it only holds for connected graphs). If a graph has $c$ components, the formula is $|V| - |E| + |F| = 1 + c$.
- **Confusing the edge bound direction**: $m \leq 3n - 6$ is an *upper bound* for planar graphs (sparse). Students sometimes think dense graphs automatically satisfy this. A non-planar graph like $K_5$ violates this bound, but a planar graph satisfying the bound is still not guaranteed to be planar (necessary but not sufficient).
- **Forgetting $K_{3,3}$ as non-planar**: Students remember $K_5$ is non-planar but forget $K_{3,3}$ (complete bipartite graph with parts of size 3 each) is also a fundamental non-planar graph. Both are Kuratowski's forbidden minors.

## GATE Question Pattern
GATE planar problems come in three flavors:
1. **Euler's formula application**: "Given $|V|$ and $|E|$, find $|F|$." Straightforward plug-in.
2. **Planarity checking**: "Is this graph planar?" Use the edge bound ($m \leq 3n - 6$) or identify $K_5$/$K_{3,3}$ subgraphs.
3. **Face and region counting**: Combine Euler's formula with graph properties to derive face structure.

## Speed Tricks for MCQs
- **Edge bound sanity check**: $m \leq 3n - 6$ is your first filter. If $|E| > 3|V| - 6$, the graph is **definitely non-planar**. Reject any "planar" answer instantly.
- **Identify forbidden minors**: Spot $K_5$ (5 vertices all connected) or $K_{3,3}$ (bipartite, 3+3 vertices, all cross-edges). If you see either as a subgraph, the whole graph is non-planar.
- **Euler's formula shortcut**: $|F| = 2 - |V| + |E|$. Rearrange it so you're always solving for one missing variable.

## Must-Memorize Formulas / Results

**Euler's Formula for Connected Planar Graphs:**
$$|V| - |E| + |F| = 2$$

**Euler's Formula for Disconnected Graphs (c components):**
$$|V| - |E| + |F| = 1 + c$$

**Edge Bound for Planar Graphs (simple, $n \geq 3$):**
$$|E| \leq 3n - 6$$

**Edge Bound for Bipartite Planar Graphs (no triangles):**
$$|E| \leq 2n - 4$$
(Each face is bounded by at least 4 edges.)

**Minimum Degree in Planar Graphs:**
$$\delta(G) \leq 5$$
Every planar graph has a vertex of degree at most 5.

**Complete Graphs:**
- $K_n$ is planar iff $n \leq 4$.
- $K_5$ and $K_6, K_7, \ldots$ are all non-planar.

**Complete Bipartite Graphs:**
- $K_{m,n}$ is planar iff $m \leq 2$ or $n \leq 2$ (i.e., $K_{1,n}$, $K_{2,n}$ are planar; $K_{3,3}$ is non-planar).

**Kuratowski's Theorem (Characterization):**
A graph is planar iff it contains no subdivision of $K_5$ or $K_{3,3}$.

**4-Color Theorem (consequence of planarity):**
Every planar graph can be colored with at most 4 colors: $\chi(G) \leq 4$ for all planar $G$.
