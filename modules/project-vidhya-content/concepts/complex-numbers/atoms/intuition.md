---
id: complex-numbers.intuition
concept_id: complex-numbers
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
modality: visual
---

A complex number $a + bi$ is a point in the plane: $a$ on the real axis, $b$ on the imaginary axis. Adding two complex numbers is vector addition. Multiplying by $i$ rotates 90° counterclockwise. Multiplying by any complex number scales by its magnitude and rotates by its angle.

That last fact is the whole game: **complex multiplication = rotation + scaling**. Polar form $re^{i\theta}$ makes this explicit.

Drag $a$ and $b$ below and watch $|z|$, $\cos\theta$, and $\sin\theta$ move together — they never move independently, because all three are locked to the same point $z = a+bi$.

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
