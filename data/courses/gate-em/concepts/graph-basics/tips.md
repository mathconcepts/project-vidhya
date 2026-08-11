# Teaching Tips: Graph Basics

## Common Student Errors
- **Forgetting the Handshaking Lemma**: Students often try to count edges as if each vertex "has its own edges"—forget that edges are shared. Always emphasize: each edge touches two vertices, so degree sum = 2 × edges.
- **Confusing directed vs. undirected degree**: In directed graphs, students forget to separate in-degree and out-degree. The formula $d^{in}(v) + d^{out}(v) \neq$ anything universal; only $\sum d^{in} = \sum d^{out} = |E|$ holds.
- **Odd degree parity trap**: A classic GATE gotcha—students don't remember that the number of odd-degree vertices must be even. They'll try to construct graphs that are impossible (e.g., exactly 3 vertices with odd degree), then get confused.

## GATE Question Pattern
Graph basics questions on GATE are usually **direct application** of the Handshaking Lemma or **impossibility detection**. A GATE MA question might give a list of degrees and ask: "Can this graph exist? If yes, how many edges?" GATE loves to slip in one extra constraint (e.g., "the graph is planar" or "it is a tree") to force a second theorem.

## Speed Tricks for MCQs
- **Handshaking Lemma shortcut**: The sum of all degrees must be even. If you see an odd sum, the answer is "impossible" immediately—no need to do anything else.
- **Odd-degree count rule**: If a problem says "exactly $k$ vertices have odd degree," check if $k$ is even. If odd, it's impossible. This single check eliminates half the wrong answers on many GATE problems.
- **Degree sequence reality check**: Not every sequence of numbers can be a valid degree sequence (e.g., $[5, 5, 5, 1]$ in a 4-vertex graph is impossible because max degree is 3). When in doubt, use the Handshaking Lemma first, then check connectivity constraints.

## Must-Memorize Formulas / Results

**Handshaking Lemma (Undirected Graphs):**
$$\sum_{v \in V} \deg(v) = 2|E|$$

**Directed Graphs (degree balance):**
$$\sum_{v \in V} d^{in}(v) = \sum_{v \in V} d^{out}(v) = |E|$$

**Number of odd-degree vertices:** Always even in any graph.

**Maximum degree in a simple graph:** $\deg_{\max}(v) = n - 1$ where $n = |V|$ (every other vertex).

**Sum of degrees in a $k$-regular graph:** If all vertices have degree $k$, then $\sum \deg(v) = n \cdot k = 2|E|$, so $|E| = \frac{n \cdot k}{2}$.
