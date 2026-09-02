---
# Alternative body for complex-numbers.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base atom
# so the widget cannot drift between variants; only prose differs.
id: complex-numbers.intuition.assured
concept_id: complex-numbers
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
modality: visual
variant_of: complex-numbers.intuition
for_stance: assured
---

$z=a+bi\leftrightarrow re^{i\theta}$, $r=|z|=\sqrt{a^2+b^2}$; multiplication is rotate-and-scale, $z_1z_2=r_1r_2e^{i(\theta_1+\theta_2)}$ — additive angles are the entire reason polar form exists, and why it beats Cartesian for products, quotients, and powers.

The mark-losing trap: $\theta=\arctan(b/a)$ alone gives the wrong quadrant whenever $a<0$. For $z=-3+4i$: raw $\arctan(4/{-3})$ returns a fourth-quadrant angle, but $z$ sits in the second quadrant; the correct value is $\theta=\pi-\arctan(4/3)$. Read the quadrant from the signs of $a,b$ before trusting $\arctan$ at all — $\cos\theta=a/r,\ \sin\theta=b/r$ carry their own sign and never need this correction.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag the real and imaginary parts of z = a + bi",
  "inputs": [
    {"id": "a", "label": "a (real part)", "min": -5, "max": 5, "step": 0.5, "initial": 3},
    {"id": "b", "label": "b (imaginary part)", "min": -5, "max": 5, "step": 0.5, "initial": 4}
  ],
  "outputs": [
    {"label": "|z|^2 = a^2 + b^2", "formula": "a^2 + b^2", "digits": 2},
    {"label": "modulus |z| = sqrt(a^2 + b^2)", "formula": "sqrt(a^2 + b^2)", "digits": 3},
    {"label": "cos(theta) = a / |z|", "formula": "a / sqrt(a^2 + b^2)", "digits": 3},
    {"label": "sin(theta) = b / |z|", "formula": "b / sqrt(a^2 + b^2)", "digits": 3}
  ],
  "caption": "At the starting point (3, 4), |z| = 5, cos(theta) = 0.6, sin(theta) = 0.8 -- the familiar 3-4-5 triangle. cos(theta) and sin(theta) pin down the direction z points from the origin; together with |z| they reconstruct z exactly through the polar form z = |z|(cos(theta) + i*sin(theta)). Drag a or b toward 0 and watch |z| shrink while cos(theta) and sin(theta) swing toward the axis you approached."
}
```
