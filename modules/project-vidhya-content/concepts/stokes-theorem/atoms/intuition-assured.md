---
# Alternative body for stokes-theorem.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: stokes-theorem.intuition.assured
concept_id: stokes-theorem
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: stokes-theorem-intuition
for_stance: assured
---

When $S$ is flat in the $xy$-plane, $d\mathbf S=\hat k\,dA$ and $(\nabla\times\mathbf F)\cdot\hat k$ reduces to $\partial_xF_y-\partial_yF_x$ — Stokes collapses to Green's circulation form exactly, which is why a flat-surface Stokes problem and a Green's-theorem problem should agree if solved both ways. The surface-choice freedom cuts the other way, though: swapping to a different surface sharing the same boundary is only valid while $\nabla\times\mathbf F$ stays defined and smooth at every point between the two surfaces, not merely on each surface separately — a field singular somewhere in that gap breaks the equality even though both surfaces still share the same rim.
