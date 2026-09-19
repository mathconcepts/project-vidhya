---
id: complex-numbers-algebra.worked-example-assured
concept_id: complex-numbers-algebra
atom_type: worked_example
variant_of: complex-numbers-algebra.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Express $z=-1+i\sqrt3$ in polar form and find $z^6$.

---

**Step 1 — Modulus and quadrant-checked argument.** $|z|=2$; second quadrant, reference angle $60°$, so $\arg z = 180°-60°=120°$. Polar form: $z=2(\cos120°+i\sin120°)$.

---

**Step 2 — De Moivre.** $z^6 = 2^6(\cos720°+i\sin720°) = 64(\cos0°+i\sin0°) = 64$.

$$\boxed{z^6=64}$$

---

**The distinction worth noticing: $z^6$ came out real, but $z^2$ or $z^4$ would not have.** $z^2$ has angle $240°$: $\cos240°+i\sin240°=-\tfrac12-\tfrac{\sqrt3}{2}i$, a genuinely complex value. $z^4$ has angle $480°\equiv120°$: same direction as $z$ itself, still complex. Only when the total angle lands on a multiple of $360°$ — here, $720°$ — does the imaginary part vanish and the answer become purely real. Recognising *why* an answer is real (the angle happened to complete whole turns) rather than treating it as a coincidence is what separates genuinely understanding De Moivre from mechanically applying the formula. A quick check any exam should reward: is $\dfrac{n\theta}{360°}$ a whole number? If yes, expect a real result; if not, expect a genuinely complex one, and don't second-guess an answer with a nonzero imaginary part.
