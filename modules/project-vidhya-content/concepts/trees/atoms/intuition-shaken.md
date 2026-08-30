---
# Alternative body for trees.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: trees.intuition.shaken
concept_id: trees
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: trees-intuition
for_stance: shaken
---

Four vertices $A,B,C,D$, weighted edges $AB(1), BC(2), CD(3), AD(4), AC(5)$ — 5 edges total, more than a tree needs.

Sort by weight: $AB(1), BC(2), CD(3), AD(4), AC(5)$. Add $AB$: components $\{A,B\},\{C\},\{D\}$. Add $BC$: components $\{A,B,C\},\{D\}$. Add $CD$: components $\{A,B,C,D\}$ — one piece, $3$ edges, matching $n-1=4-1=3$. Stop here: adding $AD$ next would join two vertices already in the same component, creating a cycle, so Kruskal's algorithm skips it and every edge after.

Check the result is a tree: $4$ vertices, $3$ edges, connected (built that way), and acyclic (never added an edge inside one component) — three of the five equivalent conditions confirmed at once, so all five hold, including "unique path between every pair": trace $A$ to $D$ and only one route exists, $A\text{-}B\text{-}C\text{-}D$.

Total MST weight: $1+2+3=6$.

How many different labeled trees exist on these same $4$ vertices, ignoring weights entirely? Cayley's formula gives $n^{n-2}=4^2=16$ — sixteen distinct tree shapes are possible on $4$ labeled vertices, and Kruskal just found one specific one, the cheapest.

Remove any single edge from the tree just built, say $BC$: $\{A,B\}$ and $\{C,D\}$ fall apart into two disconnected pieces. That's true of every edge in a tree — each one is a bridge — which is exactly why adding a $4$th edge back in creates a cycle instead of extra connectivity: there was no redundancy left to add to.
