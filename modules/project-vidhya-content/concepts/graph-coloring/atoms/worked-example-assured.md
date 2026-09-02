---
# Alternative body for graph-coloring.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: graph-coloring.worked-example.assured
concept_id: graph-coloring
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: graph-coloring.worked-example
for_stance: assured
---

$C_5$ is an odd cycle, so $\chi(C_5)=3$ directly, by the parity rule for cycles ($\chi(C_n)=2$ if $n$ even, $3$ if odd) — no need to attempt and fail a 2-coloring first. A valid 3-coloring: $1,3\to R$; $2,4\to B$; $5\to G$, verified in one pass over the five edges.

The parity rule checks bipartiteness (no odd cycle), which for a cycle graph is both necessary and sufficient for $\chi=2$ — that's why the shortcut is safe to use directly here, unlike Brooks' bound $\chi\leq\Delta$, which explicitly excludes odd cycles and would wrongly suggest $\chi\leq 2$ for $C_5$ if applied without checking the exception first.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: chromatic number of the cycle graph C5","steps":[{"prompt":"Why can C₅ not be 2-colored? State the bipartiteness condition.","hint":"A graph is 2-colorable iff it has no odd cycle. C₅ is a cycle of length 5 — odd.","answer":"C₅ is an odd cycle (length 5), so it is not bipartite. Bipartite ↔ 2-colorable, so 2 colors are insufficient and χ(C₅) ≥ 3."},{"prompt":"Assign a valid 3-coloring to the vertices 1–5 of C₅ (edges: 12,23,34,45,51) and verify every edge.","hint":"Alternate Red and Blue as far as possible, then use Green only for the last vertex that would otherwise conflict.","answer":"Color: 1→R, 2→B, 3→R, 4→B, 5→G. Check edges: 12(R,B)✓ 23(B,R)✓ 34(R,B)✓ 45(B,G)✓ 51(G,R)✓. All distinct — valid coloring."}]}
```
