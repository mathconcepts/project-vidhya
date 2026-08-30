---
# Alternative body for planar-graphs.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: planar-graphs.intuition.shaken
concept_id: planar-graphs
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: planar-graphs-intuition
for_stance: shaken
---

Draw a square with both diagonals: $4$ vertices, $6$ edges. Count the faces in the drawing: $4$ small triangular regions inside, plus $1$ outer region — $5$ faces total.

Check Euler's formula $V-E+F=2$: $4-6+5=3$. That's not $2$ — because this drawing has a crossing at the center where the two diagonals meet, and Euler's formula only holds for a drawing with no crossings; a crossing point isn't a real vertex of the graph, so counting it as one broke the formula.

Redraw the same $4$ vertices without letting the diagonals cross — put one vertex in the middle, connected to the other three, which form a triangle around it. Same $6$ edges, no crossing now. Recount faces: $3$ inner triangles plus $1$ outer face $=4$. Now $V-E+F=4-6+4=2$. Formula holds.

For $K_5$ ($V=5,E=10$): the density bound for planar graphs is $E\leq 3V-6=9$. But $K_5$ has $10>9$ edges — the bound is violated, so $K_5$ cannot be drawn without a crossing, no drawing attempt needed.

This bound is necessary, not sufficient: a graph can satisfy $E\leq 3V-6$ and still be non-planar (that's exactly what happens to $K_{3,3}$, which needs the tighter bipartite version or Kuratowski's theorem instead). Kuratowski's theorem is the complete answer: a graph is planar iff it contains no subdivision of $K_5$ or $K_{3,3}$ anywhere inside it.
