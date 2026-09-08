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

Take the same net from the hook — area $1\,\text{m}^2$, flow $2\,\text{m/s}$ — but now written as vectors: field $\mathbf F=(0,0,2)$, net lying flat in the $xy$-plane with outward normal $\hat n=\hat k=(0,0,1)$. Then $\mathbf F\cdot\hat n=2$ everywhere on $S$, and since the field never changes, $\iint_S\mathbf F\cdot\hat n\,dS=2\times(\text{area }1)=2$ — matching the $2\,\text{m}^3/\text{s}$ the hook found.

Now tilt the same net so its normal is $\hat n=\frac{1}{\sqrt2}(1,0,1)$ instead: $\mathbf F\cdot\hat n=2/\sqrt2=\sqrt2\approx1.41$, smaller than before, even though the field and the net's own area have not changed, only the angle between them has. Push the tilt all the way to $\hat n=(1,0,0)$, perpendicular to $\mathbf F$, and the flux drops to $0$: the field runs entirely along the surface, crossing nothing — the same edge-on collapse the hook described, now reached by a dot product instead of a picture.

Flip $\hat n$ to point the other way and the number just found becomes negative — same surface, same field, the opposite bookkeeping convention.
