---
# Alternative body for surface-integrals.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: surface-integrals.intuition.shaken
concept_id: surface-integrals
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: surface-integrals.intuition
for_stance: shaken
---

Take the uniform field $\mathbf F=(0,0,3)$ and a flat unit square $S$ lying in the $xy$-plane, $z=0$, with outward normal $\hat n=\hat k$: $\mathbf F\cdot\hat n=3$ everywhere on $S$, and since the field never changes, $\iint_S\mathbf F\cdot\hat n\,dS=3\times(\text{area }1)=3$.

Now tilt the same square so its normal is $\hat n=\frac{1}{\sqrt2}(1,0,1)$ instead: $\mathbf F\cdot\hat n=3/\sqrt2$, smaller than before, even though the field and the square's own area have not changed, only the angle between them has. Push the tilt all the way to $\hat n=(1,0,0)$, perpendicular to $\mathbf F$, and the flux drops to $0$: the field runs entirely along the surface, crossing nothing.

Flip $\hat n$ to point the other way and the number just found becomes negative — same surface, same field, the opposite bookkeeping convention.
