# Teaching Tips: Trees

## Common Student Errors
- **Forgetting the $n-1$ edge formula**: Students often apply graph degree/edge formulas without confirming acyclicity. Always verify: trees have $|E| = |V| - 1$, and no other structure does. If you're given $|E| \neq |V| - 1$ in a connected graph, it's not a tree.
- **Confusing "spanning tree" with "the original graph"**: A spanning tree is a subgraph of $G$; it includes all vertices but removes edges to eliminate cycles. Students forget that removing edges from a graph with cycles still leaves a valid graph (the spanning tree), but removing them from a tree destroys connectivity.
- **Leaf-count pitfall**: A tree always has at least 2 leaves (except for $K_1$ and $K_2$). Students sometimes think a tree can have 0 or 1 leaf, which is impossible. The minimum occurs in a path graph (exactly 2 ends).

## GATE Question Pattern
GATE tree questions split into three types: (1) **Direct properties** (leaf count, height, degree sequence) in small trees, (2) **Spanning tree algorithms** (Kruskal, Prim for minimum spanning trees), and (3) **Rooted tree / binary tree structure** questions (in data structure contexts). GATE loves combining trees with weight/cost optimization.

## Speed Tricks for MCQs
- **$n-1$ edge check**: If a connected graph has $|V|$ vertices and $|E| \neq |V| - 1$, it's not a tree (has cycles). Use this to eliminate wrong answers instantly.
- **Leaf bound**: A tree with $L$ leaves has at least $L - 1$ non-leaf vertices (rough bound). If you see a claim like "a tree has 100 leaves and 2 non-leaves," it's immediately false.
- **Path graph model**: The simplest tree is a path: $1 - 2 - 3 - \cdots - n$. It has exactly 2 leaves and $n-1$ edges. Use this as a mental template for minimal cases.

## Must-Memorize Formulas / Results

**Basic tree formula:**
$$|E| = |V| - 1$$
for any tree $T = (V, E)$.

**Forest formula (multiple components):**
$$|E| = |V| - k$$
where $k$ = number of connected components (trees).

**Degree sum in a tree:**
$$\sum_{v \in V} \deg(v) = 2(|V| - 1) = 2|V| - 2$$

**Leaf characterization:** A vertex is a leaf iff $\deg(v) = 1$. Every tree with $|V| \geq 2$ has at least 2 leaves.

**Handshaking + tree structure:**
$$L + \sum_{v: \deg(v) \geq 2} \deg(v) = 2|V| - 2$$
where $L$ = number of leaves. Rearranging: $\sum_{v: \deg(v) \geq 2} (\deg(v) - 2) = 2|V| - 2 - L$.

**Number of leaves (Cayley count):** For a tree with degree sequence $(d_1, d_2, \ldots, d_n)$ where $\sum d_i = 2(n-1)$, the number of degree-1 vertices (leaves) satisfies:
$$L = 2 + \sum_{v: \deg(v) \geq 3} (\deg(v) - 2)$$
