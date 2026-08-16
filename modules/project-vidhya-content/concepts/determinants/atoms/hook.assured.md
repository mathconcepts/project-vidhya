---
# Alternative body for determinants.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: determinants.hook.assured
concept_id: determinants
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: determinants.hook
for_stance: assured
---

$\det$ is the unique alternating multilinear function of the columns normalised by $\det(I) = 1$. Every property you use follows from that one sentence:

- **Row swap flips the sign** — alternating.
- **Repeated row gives $0$** — alternating.
- **Adding a multiple of one row to another changes nothing** — multilinearity plus the repeated-row case. This is why row reduction is a legal way to compute it.
- **$\det(AB) = \det(A)\det(B)$** — and therefore $\det(A^{-1}) = 1/\det(A)$, $\det(A^k) = (\det A)^k$.

Geometrically it is the signed volume scale factor, which is why $\det = 0$ and singular are the same statement.

Speed note: for anything $3\times3$ or larger, row-reduce to triangular and multiply the diagonal. Cofactor expansion is $O(n!)$ and exists mainly to prove things, not to compute them.

```interactive-spec
{"v":1,"kind":"simulation","title":"det([[3,0],[0,2]]) = 6: the unit circle's area grows 6x","x_expr":"3*cos(t)","y_expr":"2*sin(t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-3.2,"x_max":3.2,"y_min":-3.2,"y_max":3.2},"caption":"Watch the traced curve — it's the unit circle stretched by A, enclosing exactly 6x the original area, matching det(A) = 6."}
```
