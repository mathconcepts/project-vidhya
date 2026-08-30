---
# Alternative body for complex-integration.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: complex-integration.hook.assured
concept_id: complex-integration
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: complex-integration.hook
for_stance: assured
---

Path-independence needs two things together, and problems test dropping either silently: $f$ analytic at every point *inside and on* $C$, and the enclosed region free of singularities — an outer contour that looks like a simple closed curve is not automatically hole-free if something sits in the region it bounds. $\oint_{|z|=2}\frac{dz}{z}=2\pi i\neq0$: $1/z$ is perfectly well-behaved on the circle $|z|=2$ itself, but the theorem still fails because $z=0$ sits inside it.
