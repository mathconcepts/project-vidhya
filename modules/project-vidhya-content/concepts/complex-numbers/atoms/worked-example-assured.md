---
# Alternative body for complex-numbers.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks rather than re-teaching what they can already do.
id: complex-numbers.worked-example.assured
concept_id: complex-numbers
atom_type: worked_example
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
scaffold_fade: true
variant_of: complex-numbers.worked-example.multiply
for_stance: assured
---

$(2+3i)(1-2i)$ in Cartesian: one FOIL pass, $2-4i+3i-6i^2=2-4i+3i+6=8-i$ — fast enough that switching to polar buys nothing here, since neither factor's argument is a standard angle.

Polar pays off only when the angles are recognizable: $(1+i)(i)$ has $1+i=\sqrt2\,e^{i\pi/4}$, $i=e^{i\pi/2}$, so the product is $\sqrt2\,e^{i3\pi/4}=-1+i$, read straight off — no distribution needed. Reaching for polar on $(2+3i)(1-2i)$ instead would cost an $\arctan$ for no payoff.

Quadrant check on $8-i$: $a=8>0,\ b=-1<0$, fourth quadrant; $\arg=\arctan(-1/8)$ is valid as-is, since the arctan trap only bites when the real part is negative.
