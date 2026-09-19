---
id: quadratic-equations.intuition-assured
concept_id: quadratic-equations
atom_type: intuition
variant_of: quadratic-equations.intuition
for_stance: assured
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

The discriminant's three-way split and Vieta's sum/product are old ground by now. Here is the gap examiners actually probe: $D \ge 0$ is necessary for both roots to be real, but it is nowhere near sufficient for a **location** claim like "both roots lie between $1$ and $5$".

Counterexample: take $x^2-12x+35=0$. Here $D = 144-140=4>0$, so real roots exist. Factoring gives roots $x=5$ and $x=7$ — real, yes, but neither lies between $1$ and $5$ except at the boundary, and $7$ is nowhere near it. Checking only $D\ge0$ and stopping there would wrongly suggest the location question is settled; it is not. A genuine location claim needs three conditions together: $D\ge0$ (real roots exist), $a\cdot f(k)>0$ at the boundary point $k$ (the curve sits on the correct side there), and the vertex $-b/2a$ actually lying inside the claimed interval. Drop any one of the three and the claim can silently become false — $D\ge0$ alone proves nothing about *where* the roots sit, only that they exist.
