---
# Alternative body for greens-theorem.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: greens-theorem.hook.assured
concept_id: greens-theorem
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: greens-theorem.hook
for_stance: assured
---

$\mathbf F=\left(\frac{-y}{x^2+y^2},\frac{x}{x^2+y^2}\right)$ has $\partial Q/\partial x-\partial P/\partial y=0$ everywhere it is defined, which looks like grounds for zero circulation on any closed curve. But $\mathbf F$ is undefined at the origin, and a curve $C$ encircling the origin does not enclose a region where $P,Q$ stay differentiable throughout. Evaluating $\oint_C\mathbf F\cdot d\mathbf r$ around the unit circle actually gives $2\pi$, not $0$: the theorem needs the field defined and differentiable on all of $D$, not merely along $C$.
