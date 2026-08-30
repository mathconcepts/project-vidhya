---
# Alternative body for surface-integrals.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: surface-integrals.hook.assured
concept_id: surface-integrals
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: surface-integrals.hook
for_stance: assured
---

Parametrize a tilted surface as a graph $z=f(x,y)$ and it is tempting to write $dS=dA$. It is not: the true element is $dS=\sqrt{1+f_x^2+f_y^2}\,dA$, and dropping that square root treats a slanted patch as if it had the area of its flat shadow, which is only correct when the surface happens to be horizontal, $f_x=f_y=0$. The stretch factor is exactly the tilt a net analogy warns about, now hiding inside the area element instead of the dot product.
