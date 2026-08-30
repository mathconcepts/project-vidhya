---
# Alternative body for complex-numbers.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: complex-numbers.intuition.shaken
concept_id: complex-numbers
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
modality: visual
variant_of: complex-numbers.intuition
for_stance: shaken
---

Take $z=3+4i$: a point $3$ right, $4$ up. Its distance from the origin is $|z|=\sqrt{3^2+4^2}=5$ — the familiar $3$-$4$-$5$ triangle. Multiply $z$ by $i$: $i(3+4i)=3i+4i^2=-4+3i$, the point $(-4,3)$ — same distance $5$ from the origin, rotated $90°$ counterclockwise. Multiplying by any complex number scales by its magnitude and rotates by its angle; that's complex multiplication, in one sentence. Try it on the picture below and watch $|z|$, $\cos\theta$, $\sin\theta$ move together — they're locked to the same point $z$.

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
