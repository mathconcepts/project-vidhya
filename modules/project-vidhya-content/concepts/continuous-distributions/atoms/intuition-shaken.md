---
# Alternative body for continuous-distributions-intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Note: the base atom's own id is `continuous-distributions-intuition` (no
# dot), a legacy naming drift check-content-integrity.ts tolerates.
# variant_of points at that exact id; this file's own id follows the normal
# convention instead of propagating the drift.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: continuous-distributions.intuition.shaken
concept_id: continuous-distributions
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: continuous-distributions-intuition
for_stance: shaken
---

## Start with the area, not the formula

$X\sim N(50,16)$, so $\sigma=4$. Picture a bell curve centered at 50. The chance $X$ falls between 46 and 58 is just the shaded area under that curve between those two points.

## Convert to the standard picture

Standardizing slides the same shaded region onto $N(0,1)$: $Z=\frac{X-50}{4}$. So $46\to Z=-1$, $58\to Z=+2$. The area is now $\Phi(2)-\Phi(-1)$, read straight off a table.

## One fact worth memorizing

Within $1\sigma$ of the mean: about 68% of the area. Within $2\sigma$: about 95%. Within $3\sigma$: about 99.7%. These numbers ARE the shape of the bell curve.

## A different shape entirely

Exponential time-to-failure has no bell and no center — it decays from its peak at $x=0$: $f(x)=\lambda e^{-\lambda x}$. Check: at $x=0$, $f(0)=\lambda$, the highest value it ever reaches, and it falls from there.

## What never changes

For ANY continuous distribution, one exact value has probability $0$; only a width has one.
