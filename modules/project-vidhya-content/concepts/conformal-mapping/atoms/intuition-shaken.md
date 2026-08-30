---
# Alternative body for conformal-mapping.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: conformal-mapping.intuition.shaken
concept_id: conformal-mapping
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: conformal-mapping.intuition
for_stance: shaken
---

Take $f(z)=z+1/z$ at $z_0=2$: $f'(z)=1-1/z^2$, so $f'(2)=1-\frac14=\frac34\neq0$, and $f$ is analytic there — both conditions for conformal hold. Near $z_0=2$, the map rotates every direction by $\arg(0.75)=0$ and scales every length by $|0.75|=0.75$; a right angle at $z_0$ stays a right angle in the image, just at $75\%$ the local scale.

That's the general rule: $f$ is conformal at a point exactly when $f$ is analytic there **and** $f'(z)\neq0$. Fail analyticity — as $1/z$ does at $z=0$ — or fail $f'(z)\neq0$, and angle preservation isn't guaranteed.

For $w=z+1/z$: $f'(z)=1-1/z^2=0$ exactly at $z=\pm1$, so conformality breaks precisely there, plus the pole at $z=0$.

Why this matters for engineering problems: this map sends circles to airfoil-shaped curves, letting a Laplace problem get solved on a plain circle instead of an awkward boundary, then carried back — the whole trick relies on angles surviving the map away from those three points.
