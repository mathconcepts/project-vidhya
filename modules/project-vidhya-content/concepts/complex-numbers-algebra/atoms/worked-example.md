---
id: complex-numbers-algebra.worked-example
concept_id: complex-numbers-algebra
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Express $z = -1+i\sqrt3$ in polar form, and hence find $z^6$.

---

**Step 1 — Find the modulus first.** $|z| = \sqrt{(-1)^2+(\sqrt3)^2} = \sqrt{1+3} = \sqrt4 = 2$.

---

**Step 2 — Find the argument, watching the quadrant.** The real part is negative and the imaginary part is positive, so $z$ sits in the second quadrant. The reference angle is $\tan^{-1}\left(\dfrac{\sqrt3}{1}\right) = 60°$. In the second quadrant, the actual angle is $180°-60°=120° = \dfrac{2\pi}{3}$.

---

**Step 3 — Write the polar form.** $z = 2\left(\cos\dfrac{2\pi}{3}+i\sin\dfrac{2\pi}{3}\right)$.

---

**Step 4 — Apply De Moivre's theorem to find $z^6$.** $z^6 = 2^6\left(\cos\dfrac{6\cdot2\pi}{3}+i\sin\dfrac{6\cdot2\pi}{3}\right) = 64\left(\cos4\pi+i\sin4\pi\right)$.

---

**Step 5 — Simplify the angle.** $4\pi$ is exactly two full turns, so $\cos4\pi=1$ and $\sin4\pi=0$.

$$\boxed{z^6 = 64(1+0i) = 64}$$

Reaching this by direct binomial expansion of $(-1+i\sqrt3)^6$ would take far longer — polar form turned a six-fold multiplication into one multiplication of angles.
