---
# Alternative body for gauss-divergence.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: gauss-divergence.intuition.assured
concept_id: gauss-divergence
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: gauss-divergence-intuition
for_stance: assured
---

Gauss trades a surface integral for a volume integral only when $\mathbf F$ is continuously differentiable throughout the enclosed solid — a hypothesis that fails at a singularity, and singularities are exactly where the exam plants the trap. For $\mathbf F=\hat r/r^2$ with the origin inside $V$: $\nabla\cdot\mathbf F=0$ everywhere $\mathbf F$ is defined, yet $\oiint_S\mathbf F\cdot d\mathbf S=4\pi\ne0$ for a sphere enclosing the origin, because the origin itself sits outside where $\nabla\cdot\mathbf F$ is even defined, so $\iiint_V\nabla\cdot\mathbf F\,dV=0$ silently drops whatever is sitting there. The fix is a small excision: cut out a tiny ball around the singularity, apply Gauss to the remaining region — now genuinely smooth throughout, closed at both the outer and the inner cut surfaces — and let the inner radius shrink to zero. Never apply the theorem across a singularity without that step.
