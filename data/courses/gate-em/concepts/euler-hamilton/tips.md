# Teaching Tips: Eulerian & Hamiltonian

## Common Student Errors
- **Confusing Eulerian with Hamiltonian**: Eulerian = visits every **edge** once. Hamiltonian = visits every **vertex** once. Students mix these up constantly. A mnemonic: **E**ulerian → **E**dges, **H**amiltonian → **H**ow many (vertices).
- **Forgetting the "exactly 2" rule for Eulerian paths**: Students remember "all even = Eulerian circuit" but forget that "exactly 2 odd = Eulerian path (not circuit)." They think "odd degrees = no Eulerian anything," which is wrong.
- **Overconfidence in Dirac's Theorem**: Dirac's theorem is a *sufficient* condition, not necessary. Just because a graph doesn't satisfy Dirac doesn't mean no Hamiltonian circuit exists. GATE tests this: it gives a degree sequence that fails Dirac and asks if a Hamiltonian path CAN exist (yes, but we'd need to check other methods or the structure).

## GATE Question Pattern
GATE splits Eulerian/Hamiltonian into two question types:
1. **Eulerian (computational)**: "Does this graph have an Eulerian path?" Answer via degree check (polynomial-time, easy). GATE will give a degree sequence and ask you to apply Euler's rule.
2. **Hamiltonian (NP-hard, conceptual)**: "Does this graph have a Hamiltonian circuit?" GATE rarely asks for an algorithm (it's hard), but instead asks if *sufficient conditions* apply (Dirac, Ore) or gives a small graph and asks you to manually find/verify a path.

## Speed Tricks for MCQs
- **Degree parity instantly**: Count odd-degree vertices. If the count is 0, there's an Eulerian circuit. If exactly 2, there's an Eulerian path. Any other count → no Eulerian path. Takes seconds.
- **Dirac's threshold**: For $n$ vertices, threshold = $n/2$ (round up to integer). If all degrees $\geq \lceil n/2 \rceil$, Hamiltonian circuit exists. This is a *sufficient* condition, so failure doesn't prove non-existence.
- **Manual path-tracing** (for small graphs): If a graph has $\leq 8$ vertices and you need to verify a Hamiltonian path exists, try to sketch one. Start from any vertex, try not to dead-end. This works for small cases faster than formal proofs.

## Must-Memorize Formulas / Results

**Euler's Theorem (Undirected Graphs):**
- Eulerian circuit exists ⟺ Graph is connected AND all vertices have even degree.
- Eulerian path (but not circuit) exists ⟺ Graph is connected AND exactly 2 vertices have odd degree.

**Directed Graphs (Euler's Theorem for digraphs):**
- Eulerian circuit exists ⟺ For all $v$: $d^{in}(v) = d^{out}(v)$.
- Eulerian path (but not circuit) exists ⟺ Exactly one vertex has $d^{out}(v) - d^{in}(v) = 1$, exactly one has $d^{in}(v) - d^{out}(v) = 1$, and all others balance.

**Dirac's Theorem (Sufficient for Hamiltonian Circuit):**
If $G$ has $n \geq 3$ vertices and every vertex has degree $\geq \frac{n}{2}$, then $G$ has a Hamiltonian circuit.

**Ore's Theorem (Sufficient for Hamiltonian Circuit):**
If for all pairs of non-adjacent vertices $u, v$: $\deg(u) + \deg(v) \geq n$, then $G$ has a Hamiltonian circuit.

**Complete graph $K_n$:**
- Degree of each vertex: $n - 1$.
- Eulerian: iff $n$ is odd (all degrees $n-1$ are even).
- Hamiltonian: Always (for $n \geq 3$, by Dirac).
