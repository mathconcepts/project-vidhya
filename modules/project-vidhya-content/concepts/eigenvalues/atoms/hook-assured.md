---
# Alternative body for eigenvalues.hook, served when the learner stance is
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
id: eigenvalues.hook.assured
concept_id: eigenvalues
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: eigenvalues.hook
for_stance: assured
---

You can already compute these. The thing worth your time is what they mean structurally.

Eigenvectors are the directions where $A$ acts as a scalar. In that basis the matrix is diagonal, and $A^k$ costs you $\lambda^k$ instead of $k$ matrix multiplications. That is why diagonalisation shows up under power, exponential, and stability questions rather than as its own topic.

The exam edge is the degenerate cases: repeated $\lambda$ with a deficient eigenspace (not diagonalisable), and complex $\lambda$ for a real matrix (rotation, no real invariant direction). Those are where the marks are, and where a fast solver is most likely to assume the generic case and lose them.

```interactive-spec
{"v":1,"kind":"simulation","title":"The ellipse's own axes are the eigenvectors of [[2,1],[1,2]]","x_expr":"2*cos(t) + sin(t)","y_expr":"cos(t) + 2*sin(t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-2.4,"x_max":2.4,"y_min":-2.4,"y_max":2.4},"caption":"Watch the long axis settle along (1,1) — the eigenvector for λ=3 — while the short axis along (1,-1) is λ=1, the direction the matrix stretches least."}
```
