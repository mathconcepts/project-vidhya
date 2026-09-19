---
id: complex-numbers-algebra.worked-example-shaken
concept_id: complex-numbers-algebra
atom_type: worked_example
variant_of: complex-numbers-algebra.worked-example
for_stance: shaken
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Express $z=-1+i\sqrt3$ in polar form and find $z^6$.

---

**Step 1 — Compute the modulus.** $|z| = \sqrt{(-1)^2+(\sqrt3)^2} = \sqrt{1+3}=\sqrt4=2$.

---

**Step 2 — Find the reference angle.** Ignore the signs for a moment: $\tan^{-1}\left(\dfrac{\sqrt3}{1}\right)=60°$.

---

**Step 3 — Fix the quadrant.** Real part is $-1$ (negative), imaginary part is $\sqrt3$ (positive) — that is the second quadrant. In the second quadrant, actual angle $=180°-\text{reference}=180°-60°=120°$.

---

**Step 4 — Write the polar form.** $z = 2(\cos120°+i\sin120°) = 2\left(\cos\dfrac{2\pi}{3}+i\sin\dfrac{2\pi}{3}\right)$.

---

**Step 5 — Apply De Moivre's theorem.** $z^6 = 2^6\left(\cos(6\times120°)+i\sin(6\times120°)\right) = 64(\cos720°+i\sin720°)$.

---

**Step 6 — Reduce the angle.** $720° = 2 \times 360°$, exactly two full turns, so $\cos720°=1$, $\sin720°=0$.

$$\boxed{z^6 = 64(1+0i) = 64}$$
