---
# Alternative body for gauss-divergence.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: gauss-divergence.hook.assured
concept_id: gauss-divergence
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: gauss-divergence.hook
for_stance: assured
---

The shortcut needs $S$ closed — no edges, no missing patch. A hemisphere $x^2+y^2+z^2=1,\,z\ge0$ by itself is not closed: it has a circular rim, and $\oiint_S\mathbf F\cdot d\mathbf S$ over that open bowl does not equal $\iiint_V\nabla\cdot\mathbf F\,dV$ for any volume, because no volume is yet enclosed. Cap the rim with the flat disk $z=0,\,x^2+y^2\le1$ first — only the closed union of bowl and disk bounds a solid, and only then does Gauss apply.
