---
# Alternative body for diagonalization.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: diagonalization.hook.assured
concept_id: diagonalization
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: diagonalization.hook
for_stance: assured
---

Diagonalization writes $A = PDP^{-1}$: the same map, seen in the eigenvector basis, where it is pure scaling. Everything downstream — fast powers, matrix exponentials, decoupled systems — is this one substitution paying rent.

It fails exactly when some eigenvalue's geometric multiplicity falls short of its algebraic one. What's the smallest matrix where that happens?

```interactive-spec
{"v":1,"kind":"simulation","title":"Applying A=[[3,1],[1,3]] continuously: the larger eigenvalue wins","x_expr":"4^t + 2^t","y_expr":"4^t - 2^t","t_min":0,"t_max":1.5,"duration_sec":7,"view_box":{"x_min":-1,"x_max":12,"y_min":-1,"y_max":6},"narration_steps":[{"at_progress":0,"text":"This traces $A^t(2,0)$ for $A=\\begin{pmatrix}3&1\\\\1&3\\end{pmatrix}$ as $t$ grows continuously from 0 — a continuous stand-in for repeatedly applying $A$.","text_shaken":"At $t=0$: no application yet, so the vector sits exactly at $(2,0)$.","text_assured":"$A^t$ makes sense here because $A$ is symmetric — diagonalizable with real eigenvalues, so $D^t$ (just powers of two numbers) is well-defined.","emphasize":false},{"at_progress":0.3,"text":"By $t=0.45$ the vector has grown to about $(3.23, 0.50)$ — moving mostly along the old direction, only slightly bending upward.","text_shaken":"At $t=0.45$: roughly $(3.2, 0.5)$. It has grown, and it has started tilting — just a little.","text_assured":"The tilt is the second eigen-mode (eigenvalue $2$) growing slower than the first (eigenvalue $4$) — a ratio, not a coincidence.","emphasize":false},{"at_progress":0.6,"text":"At $t=0.9$: about $(5.35, 1.62)$ — the bend toward the $(1,1)$ line is more visible now, but still far short of it.","text_shaken":"At $t=0.9$: roughly $(5.3,1.6)$. Growing fast, and still tilting toward the diagonal.","text_assured":"The direction is converging toward the eigenvector of the LARGER eigenvalue ($4$, versus $2$) — dominance, not an even split.","emphasize":true,"trap":{"text":"Students assume any matrix decomposes this cleanly into independent growth channels; a defective matrix (repeated eigenvalue, too few eigenvectors) cannot be split this way at all — no such trajectory exists.","avoid":"Before applying this trick, check the eigenvectors actually span the space — geometric multiplicity must equal algebraic multiplicity for every eigenvalue."}},{"at_progress":0.85,"text":"By $t=1.275$: about $(8.28,3.44)$. The direction keeps bending toward $(1,1)$ — the larger eigenvalue's axis — without ever multiplying $A$ by itself directly.","text_shaken":"At $t=1.275$: roughly $(8.3,3.4)$. Still growing, still tilting the same way, computed from just two numbers: $4^t$ and $2^t$.","text_assured":"This is the whole payoff: in the eigenbasis, $A^t v_0$ is just $4^t$ and $2^t$ scaling two fixed axes — no repeated matrix multiplication, ever.","emphasize":false}]}
```
