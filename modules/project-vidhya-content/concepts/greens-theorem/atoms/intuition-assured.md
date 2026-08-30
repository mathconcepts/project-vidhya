---
# Alternative body for greens-theorem.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: greens-theorem.intuition.assured
concept_id: greens-theorem
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: greens-theorem.intuition
for_stance: assured
---

Circulation form pairs $(P,Q)$ with $\partial Q/\partial x-\partial P/\partial y$; flux form pairs the same field, read as normal outflow, with $\partial P/\partial x+\partial Q/\partial y$ — same theorem, different bookkeeping, and mixing up which combination belongs to which form is the fastest way to sign-flip an answer that otherwise looks right. Both require $C$ closed, positively oriented (interior on the left as you walk it), and $P,Q$ continuously differentiable on all of $D$, not merely along $C$. That last clause is where a field like $\left(\frac{-y}{x^2+y^2},\frac{x}{x^2+y^2}\right)$ breaks the shortcut: zero curl away from the origin does not give zero circulation once $C$ encloses the undefined point, since $D$ is no longer a region where the hypothesis holds.
