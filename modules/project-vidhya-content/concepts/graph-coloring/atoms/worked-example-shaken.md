---
# Alternative body for graph-coloring.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: graph-coloring.worked-example.shaken
concept_id: graph-coloring
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: graph-coloring-worked-example
for_stance: shaken
---

**Setup.** $C_5$: vertices $1,2,3,4,5$, edges $12,23,34,45,51$ forming a ring.

**Step 1 — can one color work?** No: vertex $1$ and vertex $2$ share edge $12$, so they need different colors. $\chi(C_5)\geq 2$.

**Step 2 — try two colors, vertex by vertex.** Color $1$ red. Vertex $2$ (adjacent to $1$): blue. Vertex $3$ (adjacent to $2$): red. Vertex $4$ (adjacent to $3$): blue. Vertex $5$ (adjacent to $4$ and $1$): $4$ is blue, $1$ is red — both colors are taken, and edge $51$ closes the ring, so vertex $5$ cannot legally be either color. Two colors fail.

**Step 3 — why, structurally.** $C_5$ has $5$ vertices — an odd cycle. Alternating two colors around an odd-length ring always produces this exact clash at the closing edge. $\chi(C_5)\geq 3$.

**Step 4 — three colors, vertex by vertex.** $1\to R$, $2\to B$, $3\to R$, $4\to B$, $5\to G$. Check every edge: $12$ (R,B) fine, $23$ (B,R) fine, $34$ (R,B) fine, $45$ (B,G) fine, $51$ (G,R) fine. No clashes.

**Step 5 — conclude.** Lower bound $3$ from Step 3, valid coloring with $3$ colors from Step 4: $\chi(C_5)=3$.

**Watch this trap.** $\Delta(C_5)=2$, and it's tempting to reach for Brooks' theorem and expect $\chi\leq\Delta=2$. Brooks' theorem excludes exactly two families — complete graphs and odd cycles — and $C_5$ is an odd cycle, so the bound doesn't apply here at all.

**Hold onto this.** For any cycle $C_n$: $\chi(C_n)=2$ when $n$ is even and $3$ when $n$ is odd — the parity of the ring, not its size, decides it.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: chromatic number of the cycle graph C5","steps":[{"prompt":"Why can C₅ not be 2-colored? State the bipartiteness condition.","hint":"A graph is 2-colorable iff it has no odd cycle. C₅ is a cycle of length 5 — odd.","answer":"C₅ is an odd cycle (length 5), so it is not bipartite. Bipartite ↔ 2-colorable, so 2 colors are insufficient and χ(C₅) ≥ 3."},{"prompt":"Assign a valid 3-coloring to the vertices 1–5 of C₅ (edges: 12,23,34,45,51) and verify every edge.","hint":"Alternate Red and Blue as far as possible, then use Green only for the last vertex that would otherwise conflict.","answer":"Color: 1→R, 2→B, 3→R, 4→B, 5→G. Check edges: 12(R,B)✓ 23(B,R)✓ 34(R,B)✓ 45(B,G)✓ 51(G,R)✓. All distinct — valid coloring."}]}
```
