---
id: complex-numbers-algebra.intuition-shaken
concept_id: complex-numbers-algebra
atom_type: intuition
variant_of: complex-numbers-algebra.intuition
for_stance: shaken
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

Take $z = \sqrt3 + i$. Plot it as the point $(\sqrt3, 1)$ on the Argand plane, real part along the horizontal axis, imaginary part along the vertical.

Find the modulus: $|z| = \sqrt{(\sqrt3)^2+1^2} = \sqrt{3+1} = 2$. This is just Pythagoras applied to the point's coordinates.

Find the argument: $\tan\theta = \dfrac{1}{\sqrt3}$, and since both coordinates are positive (first quadrant), $\theta = 30°$.

Now write the **polar form**: $z = 2(\cos30° + i\sin30°)$. Check it: $2\cos30° = 2 \times \dfrac{\sqrt3}{2} = \sqrt3$ ✓, and $2\sin30° = 2\times\dfrac{1}{2}=1$ ✓. Both match the original coordinates exactly.

Multiplying $z$ by itself doubles the angle each time: $z^2$ has argument $60°$, $z^3$ has argument $90°$, and so on. That repeated angle-adding is De Moivre's theorem, and it is also why the three cube roots of unity sit exactly $120°$ apart on the unit circle.
