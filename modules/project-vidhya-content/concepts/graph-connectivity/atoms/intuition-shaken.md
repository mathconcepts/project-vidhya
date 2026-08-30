---
# Alternative body for graph-connectivity.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: graph-connectivity.intuition.shaken
concept_id: graph-connectivity
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: graph-connectivity-intuition
for_stance: shaken
---

Take the bowtie graph: two triangles, $\{A,B,C\}$ and $\{C,D,E\}$, sharing vertex $C$. Six edges total: $AB,BC,CA,CD,DE,EC$.

Remove vertex $C$: the graph splits into $\{A,B\}$ and $\{D,E\}$ — two pieces instead of one. That makes $C$ a cut vertex: a vertex whose removal increases the number of pieces. So $\kappa(G)=1$ — a single vertex is enough to disconnect it.

Now remove one edge at a time instead and check if any single edge splits the graph. Removing $AB$: still connected through $A$-$C$-$B$. Removing $CD$: still connected through $C$-$E$-$D$. No single edge disconnects this graph, so $\lambda(G)\geq 2$ — you'd need to remove at least $2$ edges (say both $CD$ and $CE$) to isolate $\{D,E\}$, so $\lambda(G)=2$.

Notice $\kappa(G)=1 < \lambda(G)=2$: exactly Whitney's inequality $\kappa(G)\leq\lambda(G)\leq\delta(G)$ in action — here $\delta(G)=2$ (vertices $A,B,D,E$ each have degree $2$), so $1\leq 2\leq 2$ holds.

Degrees here are $A=2,B=2,C=4,D=2,E=2$, summing to $12=2\times 6$ edges — the handshaking lemma again, and it's why the count of odd-degree vertices in any graph is always even: every edge raises the running total by $2$, never by $1$, so an odd grand total is simply never reachable.
