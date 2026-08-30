---
# Alternative body for orthogonality.hook, served when the learner stance is
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
id: orthogonality.hook.assured
concept_id: orthogonality
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: orthogonality.hook
for_stance: assured
---

$\langle u, v\rangle = 0$ is the whole definition; everything else is consequence.

**Why orthogonal bases are worth constructing.** Coordinates come from projection instead of a solve: $x = \sum_i \frac{\langle x, q_i\rangle}{\langle q_i, q_i\rangle} q_i$. Orthonormalise and the denominators vanish.

**Orthogonal matrices** ($Q^{\mathsf T}Q = I$) preserve every length and angle, so $Q^{-1} = Q^{\mathsf T}$ — inversion for free — and $|\det Q| = 1$. Their eigenvalues all sit on the unit circle.

**The facts that carry marks:**
- An orthogonal *set* of non-zero vectors is automatically independent. Independence questions sometimes reduce to a few dot products.
- $\operatorname{row}(A) \perp \operatorname{null}(A)$ and $\operatorname{col}(A) \perp \operatorname{null}(A^{\mathsf T})$ — the four-subspaces picture, and the reason least squares gives $A^{\mathsf T}A\hat{x} = A^{\mathsf T}b$.
- Symmetric matrices have orthogonal eigenvectors. That is the link to the spectral theorem.
- Orthogonal $\neq$ orthonormal. Gram–Schmidt gives you the first; you still have to normalise for the second, and forgetting to is the standard way to lose the mark.

```interactive-spec
{"v":1,"kind":"simulation","title":"Two orthogonal frequencies: cos(t) against cos(2t)","x_expr":"cos(t)","y_expr":"cos(2*t)","t_min":0,"t_max":6.28319,"duration_sec":6,"view_box":{"x_min":-1.3,"x_max":1.3,"y_min":-1.3,"y_max":1.3},"caption":"Watch the dot trace a looping curve instead of a circle — cos(t) and cos(2t) are orthogonal functions, the same zero-overlap idea as two perpendicular vectors.","narration_steps":[{"at_progress":0,"text":"Horizontal is cos(t); vertical is cos(2t). Two signals, plotted against each other rather than against time."},{"at_progress":0.25,"text":"cos(t) has fallen to zero while cos(2t) has run all the way down to -1. They are not moving together at all."},{"at_progress":0.55,"text":"Across one full period their product integrates to exactly zero — every positive overlap is cancelled by a negative one."},{"at_progress":0.85,"text":"That zero is the same statement as a dot product of zero. Orthogonal — just in a space of functions instead of arrows."}]}
```
