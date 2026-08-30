---
# Alternative body for graph-coloring.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: graph-coloring.intuition.shaken
concept_id: graph-coloring
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: graph-coloring-intuition
for_stance: shaken
---

Take the cycle $C_5$: vertices $1,2,3,4,5$ in a ring, each joined to its two neighbors. Color $1$ red. Vertex $2$, adjacent to $1$, avoids red — blue. Vertex $3$, adjacent to $2$ (blue), avoids blue — red. Vertex $4$, adjacent to $3$ (red), avoids red — blue. Vertex $5$ is adjacent to both $4$ (blue) and $1$ (red): every color used so far is blocked, so it needs a third, green.

Two colors failed because $C_5$ has an odd number of vertices: alternating around an odd ring always forces the last vertex to clash with the first. A graph is 2-colorable exactly when it has no odd cycle — that property is called bipartite, and it's an iff, not a rule of thumb.

The rule just used — give each vertex the smallest color not already taken by a colored neighbor — is the greedy algorithm. It never needs more than $\Delta(G)+1$ colors, where $\Delta(G)$ is the largest degree anywhere in the graph. Here $\Delta(C_5)=2$ and greedy used $3=\Delta+1$ colors — one of only two situations, odd cycles and complete graphs, where that bound can't be shaved down to $\Delta(G)$ itself.
